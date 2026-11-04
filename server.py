#!/usr/bin/env python3
"""설담화(說談花) 로컬 서버 - 사이트를 띄우고 DATA 폴더의 CSV를 진짜 저장소로 씁니다.

실행:  python server.py            → 이 컴퓨터에서만 (http://localhost:5500)
       python server.py --lan      → 같은 와이파이의 휴대폰에서도 접속 (주문 시험용)

- 쇼핑몰·관리자 화면은 열릴 때 DATA/*.csv를 읽어 오고, 바뀐 줄만 서버로 보냅니다 (assets/js/data-sync.js).
- 저장하기 전에 10분에 한 번씩 DATA/backup/<시각>/ 에 그대로 복사해 둡니다 (최근 40개 보관).
- 이 컴퓨터가 아닌 기기(손님 휴대폰)는 개인정보가 든 표(주문·상담·지출 등)를 읽을 수 없고,
  새 주문·상담·재입고 신청 추가와 재고 줄이기만 할 수 있습니다.
- 손님 개인정보가 오가므로 매장 컴퓨터와 내부 와이파이에서만 쓰세요. 인터넷 공개는 로그인·호스팅 후에.
"""
import argparse
import base64
import csv
import hashlib
import hmac
import io
import json
import os
import re
import secrets
import shutil
import socket
import threading
import time
import urllib.request
import zipfile
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get('SDH_DATA_DIR') or os.path.join(ROOT, 'DATA')
BACKUP = os.path.join(DATA, 'backup')

TABLES = {
    'products': 'products.csv', 'orders': 'orders.csv', 'order_items': 'order_items.csv',
    'expenses': 'expenses.csv', 'inquiries': 'inquiries.csv', 'restock': 'restock.csv',
    'popups': 'popups.csv', 'pages': 'pages.csv', 'settings': 'settings.csv',
    'flowers': 'flowers.csv', 'images': 'images.csv', 'coupons': 'coupons.csv',
    'coupon_history': 'coupon_history.csv', 'reviews': 'reviews.csv',
}
PUBLIC_TABLES = {'products', 'popups', 'pages', 'settings', 'flowers'}   # 손님 기기도 읽을 수 있는 표
REMOTE_INSERT_TABLES = {'orders', 'order_items', 'inquiries', 'restock', 'reviews'}  # 손님 기기는 새 줄 추가만
KEYS = {'order_items': ('orderId', 'lineNo'), 'settings': ('key',), 'coupons': ('code',)}
COUPON_PUBLIC = ('code', 'batchName', 'type', 'value', 'minOrder', 'startDate', 'endDate', 'active')
REVIEW_PUBLIC = ('id', 'productName', 'rating', 'text', 'photos', 'video', 'status', 'adminReply', 'replyAt', 'createdAt', 'isSample')
UPLOADS_DIR = os.path.join(DATA, 'uploads')
REVIEW_UPLOADS_DIR = os.path.join(UPLOADS_DIR, 'reviews')
_review_media_counts = {}  # (orderNumber, YYYY-MM-DD) -> 업로드 횟수
MAX_BODY = 60 * 1024 * 1024
BACKUP_EVERY = 600  # 초
BACKUP_KEEP = 40

LOCK = threading.Lock()
_last_backup = 0.0

# 디스코드 웹후크·관리자 비밀번호 (Git에 올라가지 않는 숨김 파일, 관리자만 바꿈)
INTEGRATIONS_FILE = os.path.join(DATA, '.integrations.json')
ADMIN_FILE = os.path.join(DATA, '.admin.json')
WEBHOOK_RE = re.compile(r'^https://(?:(?:canary|ptb)\.)?discord(?:app)?\.com/api/webhooks/\d+/[\w-]+$')
SESSIONS = {}          # 로그인 표 → 끝나는 시각
SESSION_HOURS = 12
_hits = {}             # (ip, 종류) → 최근 요청 시각들 (너무 자주 묻는 것 막기)


def too_many(ip, kind, limit, per=60):
    now = time.time()
    lst = [t for t in _hits.get((ip, kind), []) if now - t < per]
    lst.append(now)
    _hits[(ip, kind)] = lst
    return len(lst) > limit


def read_json_file(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def write_json_file(path, obj):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False)
    os.replace(tmp, path)


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), 200_000).hex()
    return salt, digest


def check_password(password):
    saved = read_json_file(ADMIN_FILE, {})
    if not saved.get('salt') or not saved.get('hash'):
        return False
    return hmac.compare_digest(hash_password(password, saved['salt'])[1], saved['hash'])


def send_discord(channel, payload):
    """손님 기기에서 온 알림을 서버에 저장된 웹후크로 보냄 (웹후크 주소는 손님에게 안 보임)"""
    cfg = read_json_file(INTEGRATIONS_FILE, {})
    if channel == 'order':
        if cfg.get('notifyOrders') is False:
            return False, 'off'
        url = (cfg.get('orderWebhook') or '').strip()
    else:
        if cfg.get('notifyInquiries') is False:
            return False, 'off'
        url = (cfg.get('inquiryWebhook') or cfg.get('orderWebhook') or '').strip()
    if not WEBHOOK_RE.match(url):
        return False, 'no-webhook'
    body = dict(payload or {})
    body['username'] = '설담화 알림'
    body['allowed_mentions'] = {'parse': []}
    data = json.dumps(body, ensure_ascii=False).encode('utf-8')
    if len(data) > 12000:
        return False, 'too-big'
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Seoldamhwa/1.0'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            return 200 <= res.status < 300, res.status
    except Exception as e:  # 인터넷이 끊겨도 주문 저장은 계속
        return False, str(e)[:80]


def list_backups():
    if not os.path.isdir(BACKUP):
        return []
    out = []
    for d in sorted(os.listdir(BACKUP), reverse=True):
        p = os.path.join(BACKUP, d)
        if os.path.isdir(p):
            files = [f for f in os.listdir(p) if f in TABLES.values()]
            out.append({'name': d, 'files': len(files)})
    return out


def key_of(table, row):
    return '#'.join(str(row.get(k, '')) for k in KEYS.get(table, ('id',)))


def table_path(table):
    return os.path.join(DATA, TABLES[table])


def read_table(table):
    """(머리줄, 줄 목록) 또는 파일이 없으면 None"""
    path = table_path(table)
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        return list(reader.fieldnames or []), [dict(r) for r in reader]


def write_table(table, header, rows):
    path = table_path(table)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, lineterminator='\r\n')
        w.writerow(header)
        for r in rows:
            w.writerow(['' if r.get(c) is None else str(r.get(c)) for c in header])
    os.replace(tmp, path)  # 쓰는 도중에 꺼져도 파일이 반쯤 깨지지 않게


def make_backup(label, force=False):
    global _last_backup
    now = time.time()
    if not force and now - _last_backup < BACKUP_EVERY:
        return None
    _last_backup = now
    folder = os.path.join(BACKUP, datetime.now().strftime('%Y%m%d-%H%M%S') + f'-{label}')
    os.makedirs(folder, exist_ok=True)
    for name in TABLES.values():
        src = os.path.join(DATA, name)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(folder, name))
    olds = sorted(d for d in os.listdir(BACKUP) if os.path.isdir(os.path.join(BACKUP, d)))
    for d in olds[:-BACKUP_KEEP]:
        shutil.rmtree(os.path.join(BACKUP, d), ignore_errors=True)
    return folder


def _get_server_full_dates():
    """settings 표와 orders 표를 바탕으로 마감된 날짜 목록 계산 (LOCK 안에서 호출)"""
    st = read_table('settings')
    daily = 0
    date_limits = {}
    if st:
        header, rows = st
        delivery_row = next((r for r in rows if r.get('key') == 'delivery'), None)
        if delivery_row:
            try:
                val = json.loads(delivery_row.get('value') or '{}')
                daily = max(0, int(val.get('dailyLimit') or 0))
                for dl in val.get('dateLimits') or []:
                    if isinstance(dl, dict) and dl.get('date') and 'limit' in dl:
                        date_limits[str(dl['date'])] = max(1, int(dl['limit']))
            except Exception:
                pass
    if daily <= 0 and not date_limits:
        return []
    ot = read_table('orders')
    if not ot:
        return []
    header, rows = ot
    counts = {}
    for r in rows:
        if r.get('status') == 'cancelled':
            continue
        if str(r.get('isSample', '')).lower() in ('true', '1'):
            continue
        d = str(r.get('deliveryDate') or '').strip()
        if d:
            d_ymd = d.split()[0]
            counts[d_ymd] = counts.get(d_ymd, 0) + 1

    full_dates = set()
    for d, lim in date_limits.items():
        if lim > 0 and counts.get(d, 0) >= lim:
            full_dates.add(d)
    if daily > 0:
        for d, cnt in counts.items():
            if d not in date_limits and cnt >= daily:
                full_dates.add(d)
    return sorted(list(full_dates))


def get_server_full_dates():
    """락을 걸고 마감 날짜 목록 반환 (외부 호출용)"""
    with LOCK:
        return _get_server_full_dates()


def apply_change(change, local):
    """한 표의 바뀐 줄 적용. (적용 수, 거절 사유 목록)"""
    table = change.get('table')
    if table not in TABLES:
        return 0, [f'{table}: 모르는 표']
    if not local and table not in REMOTE_INSERT_TABLES and table != 'products':
        return 0, [f'{table}: 이 기기에서는 바꿀 수 없음']
    existing = read_table(table)
    header, rows = existing if existing else (list(change.get('columns') or []), [])
    for c in change.get('columns') or []:
        if c not in header:
            header.append(c)
    if not header and (change.get('upserts') or []):
        header = list((change.get('upserts')[0]).keys())
    index = {key_of(table, r): r for r in rows}
    order = [key_of(table, r) for r in rows]
    applied, rejected = 0, []
    existing_order_numbers = set()
    if table == 'orders':
        for r in rows:
            onum = str(r.get('orderNumber') or '').strip().upper()
            if onum:
                existing_order_numbers.add(onum)
    for row in change.get('upserts') or []:
        row = {k: ('' if v is None else str(v)) for k, v in row.items()}
        k = key_of(table, row)
        if not k.strip('#'):
            continue
        if not local:
            if table in ('orders', 'inquiries', 'restock', 'reviews'):
                row_id = str(row.get('id') or '').strip()
                if not re.match(r'^[A-Za-z0-9_-]{1,80}$', row_id):
                    rejected.append(f'{table}: 잘못된 ID 형식입니다')
                    continue
            if table in ('order_items', 'restock', 'reviews'):
                # 상품 번호는 관리자·쇼핑몰 버튼에 그대로 들어가므로 형식을 제한
                prod_id = str(row.get('productId') or '').strip()
                if prod_id and not re.match(r'^[A-Za-z0-9_-]{1,80}$', prod_id):
                    rejected.append(f'{table}: 잘못된 상품 번호 형식입니다')
                    continue
            if table == 'order_items':
                oid = str(row.get('orderId') or '').strip()
                if not re.match(r'^[A-Za-z0-9_-]{1,80}$', oid):
                    rejected.append('order_items: 잘못된 orderId 형식입니다')
                    continue
                orders_data = read_table('orders')
                orders_ids = {str(o.get('id') or '').strip() for o in orders_data[1]} if orders_data else set()
                if oid not in orders_ids:
                    rejected.append('order_items: 일치하는 주문(orders)이 없습니다')
                    continue
            if table == 'products':
                # 손님 기기: 이미 있는 상품의 재고를 줄이는 것만
                old = index.get(k)
                try:
                    if old is not None and int(float(row.get('stockQuantity') or 0)) <= int(float(old.get('stockQuantity') or 0)):
                        old['stockQuantity'] = row.get('stockQuantity')
                        applied += 1
                except ValueError:
                    pass
                continue
            if table == 'orders':
                # 1. orderNumber 유효성 및 중복 검사
                onum = str(row.get('orderNumber') or '').strip().upper()
                if not re.match(r'^[A-Za-z0-9-]{1,40}$', onum):
                    rejected.append('orders: 잘못된 주문번호 형식입니다')
                    continue
                if onum in existing_order_numbers:
                    rejected.append(f'orders:{onum} 이미 접수된 주문번호입니다')
                    continue
                # 원격 주문 상태 강제 덮어쓰기
                row['status'] = 'preparing'
                row['statusBeforeCancel'] = ''
                row['courier'] = ''
                row['trackingNumber'] = ''
                row['reviewRequestedAt'] = ''
                row['isSample'] = 'false'
                # 2. ordererName, ordererPhone 비어있는지 검사
                name = str(row.get('ordererName') or row.get('customerName') or '').strip()
                phone = str(row.get('ordererPhone') or row.get('phone') or '').strip()
                if not name or not phone:
                    rejected.append('orders: 주문자 이름 또는 연락처가 비어 있습니다')
                    continue
                # 3. totalAmount, itemsTotal, deliveryFee 음수 또는 비숫자 검사
                invalid_money = False
                for mf in ('totalAmount', 'itemsTotal', 'deliveryFee'):
                    val_str = str(row.get(mf, '')).strip()
                    try:
                        v = float(val_str)
                        if v < 0:
                            invalid_money = True
                            break
                    except (ValueError, TypeError):
                        invalid_money = True
                        break
                if invalid_money:
                    rejected.append('orders: 금액 항목(totalAmount, itemsTotal, deliveryFee)은 0 이상의 숫자여야 합니다')
                    continue
                # 4. 빈 배송일 검사 및 날짜별 주문 상한 초과 검사
                raw_deliv = str(row.get('deliveryDate') or '').strip()
                if not raw_deliv:
                    rejected.append('orders: 배송일이 비어 있습니다')
                    continue
                deliv_date = raw_deliv.split()[0]
                if deliv_date and deliv_date in _get_server_full_dates():
                    rejected.append(f'orders: {deliv_date} 배송일은 주문이 마감되었습니다')
                    continue
            if table == 'reviews':
                row['status'] = 'pending'
                row['adminReply'] = ''
                row['replyAt'] = ''
                row['isSample'] = 'false'
                rev_order_num = str(row.get('orderNumber') or '').strip().upper()
                rev_order_id = str(row.get('orderId') or '').strip()
                rev_prod_id = str(row.get('productId') or '').strip()
                orders_data = read_table('orders')
                matching_order = None
                if orders_data:
                    for o in orders_data[1]:
                        if str(o.get('orderNumber') or '').strip().upper() == rev_order_num:
                            matching_order = o
                            break
                if not matching_order or matching_order.get('status') != 'completed' or matching_order.get('id') != rev_order_id:
                    rejected.append('reviews: 배송 완료된 주문만 후기를 작성할 수 있습니다')
                    continue
                items_data = read_table('order_items')
                item_found = False
                if items_data:
                    for it in items_data[1]:
                        if str(it.get('orderId') or '').strip() == rev_order_id and str(it.get('productId') or '').strip() == rev_prod_id:
                            item_found = True
                            break
                if not item_found:
                    rejected.append('reviews: 주문에 포함된 상품만 후기를 작성할 수 있습니다')
                    continue
                dup_review = False
                for existing_r in index.values():
                    if str(existing_r.get('orderId') or '').strip() == rev_order_id and str(existing_r.get('productId') or '').strip() == rev_prod_id:
                        dup_review = True
                        break
                if dup_review:
                    rejected.append('reviews: 이미 작성된 후기가 있습니다')
                    continue
                try:
                    r_val = int(row.get('rating') or 0)
                    if not (1 <= r_val <= 5):
                        rejected.append('reviews: 별점은 1~5점이어야 합니다')
                        continue
                except (ValueError, TypeError):
                    rejected.append('reviews: 별점 형식이 올바르지 않습니다')
                    continue
                txt = str(row.get('text') or '').strip()
                if len(txt) < 10 or len(txt) > 500:
                    rejected.append('reviews: 후기 내용은 10자 이상 500자 이하여야 합니다')
                    continue
                photos_raw = row.get('photos')
                if photos_raw is None or photos_raw == '':
                    photos_list = []
                elif isinstance(photos_raw, list):
                    photos_list = photos_raw
                elif isinstance(photos_raw, str):
                    try:
                        photos_list = json.loads(photos_raw)
                        if isinstance(photos_list, str):
                            photos_list = json.loads(photos_list)
                    except Exception:
                        photos_list = []
                else:
                    photos_list = []
                if not isinstance(photos_list, list):
                    photos_list = []

                invalid_photo = False
                for p in photos_list:
                    p_str = str(p or '').strip()
                    if not re.match(r'^reviews/[\w.-]+$', p_str) or '..' in p_str:
                        invalid_photo = True
                        break
                if invalid_photo:
                    rejected.append('reviews: 사진 경로가 올바르지 않습니다')
                    continue
                row['photos'] = json.dumps(photos_list, ensure_ascii=False)

                v_raw = str(row.get('video') or '').strip()
                if v_raw:
                    if not re.match(r'^reviews/[\w.-]+$', v_raw) or '..' in v_raw:
                        rejected.append('reviews: 동영상 경로가 올바르지 않습니다')
                        continue
                row['video'] = v_raw
            if k in index:
                rejected.append(f'{table}:{k} 이미 있음')
                continue
        if k in index:
            index[k].update(row)
        else:
            index[k] = row
            order.append(k)
            if table == 'orders':
                onum = str(row.get('orderNumber') or '').strip().upper()
                if onum:
                    existing_order_numbers.add(onum)
        applied += 1
    deletes = change.get('deletes') or []
    if deletes and not local:
        rejected.append(f'{table}: 이 기기에서는 지울 수 없음')
    elif deletes:
        gone = set(str(d) for d in deletes)
        if table == 'reviews' and local:
            norm_rev_dir = os.path.normpath(REVIEW_UPLOADS_DIR)
            for d in gone:
                r_item = index.get(d)
                if r_item:
                    try:
                        p_raw = r_item.get('photos')
                        if isinstance(p_raw, str):
                            try:
                                p_list = json.loads(p_raw)
                                if isinstance(p_list, str): p_list = json.loads(p_list)
                            except Exception: p_list = []
                        elif isinstance(p_raw, list): p_list = p_raw
                        else: p_list = []
                        for pf in p_list:
                            pf_str = str(pf or '').strip()
                            if pf_str:
                                fp = os.path.normpath(os.path.join(DATA, 'uploads', pf_str))
                                if fp.startswith(norm_rev_dir) and os.path.isfile(fp):
                                    try: os.remove(fp)
                                    except OSError: pass
                    except Exception: pass
                    vf = str(r_item.get('video') or '').strip()
                    if vf:
                        fp = os.path.normpath(os.path.join(DATA, 'uploads', vf))
                        if fp.startswith(norm_rev_dir) and os.path.isfile(fp):
                            try: os.remove(fp)
                            except OSError: pass
        applied += len([k for k in order if k in gone])
        order = [k for k in order if k not in gone]
    write_table(table, header, [index[k] for k in order])
    if table == 'orders':
        mark_coupons_used(change.get('upserts') or [])
    return applied, rejected


def mark_coupons_used(orders):
    """쿠폰을 쓴 주문이 들어오면 그 쿠폰을 '사용됨'으로 (손님 기기는 쿠폰 표를 못 바꾸므로 서버가 처리)"""
    used = {str(o.get('couponCode') or ''): str(o.get('orderNumber') or '') for o in orders if o.get('couponCode')}
    if not used:
        return
    existing = read_table('coupons')
    if not existing:
        return
    header, rows = existing
    changed = False
    for r in rows:
        if r.get('code') in used and not r.get('usedAt'):
            r['usedAt'] = datetime.now().isoformat(timespec='seconds')
            r['orderNumber'] = used[r['code']]
            changed = True
    if changed:
        write_table('coupons', header, rows)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def is_local(self):
        return self.client_address[0] in ('127.0.0.1', '::1')

    def session_token(self):
        cookie = self.headers.get('Cookie') or ''
        m = re.search(r'(?:^|;\s*)sdh_admin=([\w-]+)', cookie)
        return m.group(1) if m else ''

    def is_admin(self):
        """이 컴퓨터이거나, 다른 기기에서 관리자 비밀번호로 로그인한 경우"""
        if self.is_local():
            return True
        tok = self.session_token()
        exp = SESSIONS.get(tok)
        if exp and exp > time.time():
            return True
        SESSIONS.pop(tok, None)
        return False

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')  # 고친 파일이 바로 보이게
        super().end_headers()

    def send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        n = int(self.headers.get('Content-Length') or 0)
        if n > MAX_BODY:
            raise ValueError('너무 큼')
        return json.loads(self.rfile.read(n).decode('utf-8') or '{}')

    def do_GET(self):
        path = urlparse(self.path).path
        lower = path.lower()
        # 개인정보 CSV·Git·서버 파일은 주소로 직접 못 열게
        if lower.startswith(('/data/', '/.git', '/.claude')) or lower in ('/server.py', '/data'):
            self.send_error(404)
            return
        if path.startswith('/api/review-media/'):
            subpath = path[len('/api/review-media/'):].lstrip('/')
            if not subpath or '..' in subpath:
                self.send_error(404)
                return
            full_path = os.path.normpath(os.path.join(DATA, 'uploads', subpath))
            if not full_path.startswith(os.path.normpath(os.path.join(DATA, 'uploads'))):
                self.send_error(404)
                return
            if not os.path.exists(full_path) or not os.path.isfile(full_path):
                self.send_error(404)
                return
            if not self.is_admin():
                ref_target = subpath.replace('\\', '/')
                with LOCK:
                    rev_data = read_table('reviews')
                referenced = False
                if rev_data:
                    for r in rev_data[1]:
                        if r.get('status') == 'approved':
                            try:
                                photos = r.get('photos')
                                if isinstance(photos, str):
                                    try:
                                        photos = json.loads(photos)
                                        if isinstance(photos, str):
                                            photos = json.loads(photos)
                                    except Exception:
                                        photos = []
                                if not isinstance(photos, list):
                                    photos = []
                                if any(ref_target == p or os.path.basename(ref_target) == os.path.basename(p) for p in photos):
                                    referenced = True
                                    break
                            except Exception: pass
                            v_path = str(r.get('video') or '').strip().replace('\\', '/')
                            if v_path and (v_path == ref_target or os.path.basename(ref_target) == os.path.basename(v_path)):
                                referenced = True
                                break
                if not referenced:
                    self.send_error(404)
                    return
            ctype = 'application/octet-stream'
            lower_f = full_path.lower()
            if lower_f.endswith(('.jpg', '.jpeg')): ctype = 'image/jpeg'
            elif lower_f.endswith('.png'): ctype = 'image/png'
            elif lower_f.endswith('.mp4'): ctype = 'video/mp4'
            elif lower_f.endswith('.webm'): ctype = 'video/webm'
            elif lower_f.endswith(('.mov', '.qt')): ctype = 'video/quicktime'
            try:
                with open(full_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except OSError:
                self.send_error(500)
            return
        if path == '/api/coupon':
            # 쿠폰 한 장만 확인 (손님 기기는 쿠폰 목록 전체를 못 받음)
            code = (parse_qs(urlparse(self.path).query).get('code') or [''])[0].strip().upper()
            with LOCK:
                existing = read_table('coupons')
            row = next((r for r in (existing[1] if existing else []) if r.get('code') == code), None)
            if not row:
                self.send_json({'ok': False})
                return
            coupon = {k: row.get(k, '') for k in COUPON_PUBLIC}
            coupon['used'] = bool(row.get('usedAt'))
            coupon['active'] = row.get('active') != 'false'
            self.send_json({'ok': True, 'coupon': coupon})
            return
        query = parse_qs(urlparse(self.path).query)
        if path == '/api/session':
            self.send_json({'ok': True, 'admin': self.is_admin(), 'local': self.is_local(), 'hasPassword': bool(read_json_file(ADMIN_FILE, {}).get('hash'))})
            return
        if path == '/api/order-lookup':
            # 주문번호 + 연락처가 맞는 주문 한 건만 (손님 기기용)
            if too_many(self.client_address[0], 'lookup', 20):
                self.send_json({'ok': False, 'error': '잠시 뒤에 다시 해 주세요'}, 429)
                return
            number = (query.get('number') or [''])[0].strip().upper()
            phone = re.sub(r'\D', '', (query.get('phone') or [''])[0])
            with LOCK:
                orders = read_table('orders')
                items = read_table('order_items')
            row = None
            if orders and number and len(phone) >= 9:
                row = next((r for r in orders[1] if str(r.get('orderNumber', '')).upper() == number
                            and phone in (re.sub(r'\D', '', r.get('ordererPhone') or r.get('phone') or ''),)), None)
            if not row:
                self.send_json({'ok': False})
                return
            def as_csv(header, rows):
                buf = io.StringIO()
                w = csv.writer(buf, lineterminator='\r\n')
                w.writerow(header)
                for r in rows:
                    w.writerow([r.get(c, '') for c in header])
                return buf.getvalue()
            item_rows = [r for r in (items[1] if items else []) if r.get('orderId') == row.get('id')]
            self.send_json({'ok': True, 'orders': as_csv(orders[0], [row]), 'items': as_csv(items[0], item_rows) if items else ''})
            return
        if path == '/api/full-dates':
            self.send_json({'ok': True, 'dates': get_server_full_dates()})
            return
        if path == '/api/full-backup':
            if not self.is_admin():
                self.send_json({'ok': False, 'error': '관리자만'}, 403)
                return
            buf = io.BytesIO()
            now_str = datetime.now().strftime('%Y%m%d')
            filename = f'seoldamhwa-backup-{now_str}.zip'
            with LOCK:
                with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
                    if os.path.isdir(DATA):
                        for name in sorted(os.listdir(DATA)):
                            p = os.path.join(DATA, name)
                            if os.path.isfile(p) and name.lower().endswith('.csv') and not name.startswith('.'):
                                zf.write(p, arcname=name)
                        uploads_dir = os.path.join(DATA, 'uploads')
                        if os.path.isdir(uploads_dir):
                            for root, dirs, files in os.walk(uploads_dir):
                                for f in sorted(files):
                                    if f.startswith('.') or f.endswith('.tmp'):
                                        continue
                                    full_f = os.path.join(root, f)
                                    rel_f = os.path.relpath(full_f, DATA)
                                    zf.write(full_f, arcname=rel_f.replace('\\', '/'))
            content = buf.getvalue()
            self.send_response(200)
            self.send_header('Content-Type', 'application/zip')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        if path == '/api/backups':
            if not self.is_admin():
                self.send_json({'ok': False, 'error': '관리자만'}, 403)
                return
            self.send_json({'ok': True, 'backups': list_backups()})
            return
        if path == '/api/csv':
            local = self.is_admin()
            readable = [t for t in TABLES if local or t in PUBLIC_TABLES or t == 'reviews']
            files = {}
            with LOCK:
                for t in readable:
                    if t == 'reviews' and not local:
                        r_data = read_table('reviews')
                        if r_data:
                            r_header, r_rows = r_data
                            buf = io.StringIO()
                            w = csv.writer(buf, lineterminator='\r\n')
                            w.writerow(REVIEW_PUBLIC)
                            for r in r_rows:
                                if r.get('status') == 'approved':
                                    w.writerow([r.get(c, '') for c in REVIEW_PUBLIC])
                            files[TABLES[t]] = buf.getvalue()
                        else:
                            files[TABLES[t]] = ','.join(REVIEW_PUBLIC) + '\r\n'
                        continue
                    p = table_path(t)
                    if os.path.exists(p):
                        with open(p, encoding='utf-8-sig', newline='') as f:
                            files[TABLES[t]] = f.read()
            self.send_json({'ok': True, 'local': local, 'readable': readable, 'files': files})
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            body = self.read_json()
        except Exception:
            self.send_json({'ok': False, 'error': '잘못된 요청'}, 400)
            return
        local = self.is_admin()
        ip = self.client_address[0]
        if path == '/api/review-media':
            order_num = str(body.get('orderNumber') or '').strip().upper()
            phone = re.sub(r'\D', '', str(body.get('phone') or ''))
            filename = str(body.get('filename') or '').strip()
            data_b64 = str(body.get('data') or '').strip()
            if not order_num or len(phone) < 9 or not data_b64:
                self.send_json({'ok': False, 'error': '주문번호, 연락처, 파일 데이터가 필요합니다.'}, 400)
                return
            with LOCK:
                orders_data = read_table('orders')
            target_order = None
            if orders_data:
                for o in orders_data[1]:
                    if str(o.get('orderNumber') or '').strip().upper() == order_num:
                        o_phone = re.sub(r'\D', '', str(o.get('ordererPhone') or o.get('phone') or ''))
                        if phone and phone == o_phone:
                            target_order = o
                            break
            if not target_order:
                self.send_json({'ok': False, 'error': '일치하는 주문을 찾을 수 없습니다.'}, 404)
                return
            if target_order.get('status') != 'completed':
                self.send_json({'ok': False, 'error': '배송 완료된 주문만 사진/영상을 올릴 수 있습니다.'}, 400)
                return
            today_str = datetime.now().strftime('%Y-%m-%d')
            cnt_key = (order_num, today_str)
            curr_cnt = _review_media_counts.get(cnt_key, 0)
            if curr_cnt >= 4:
                self.send_json({'ok': False, 'error': '주문당 하루 최대 4개까지만 올릴 수 있습니다.'}, 429)
                return
            try:
                if ',' in data_b64:
                    data_b64 = data_b64.split(',', 1)[1]
                file_bytes = base64.b64decode(data_b64)
            except Exception:
                self.send_json({'ok': False, 'error': '파일 데이터 인코딩이 올바르지 않습니다.'}, 400)
                return
            ext = os.path.splitext(filename)[1].lower()
            if not ext:
                ext = '.jpg'
            is_img = ext in ('.jpg', '.jpeg')
            is_vid = ext in ('.mp4', '.webm', '.mov', '.qt')
            if not is_img and not is_vid:
                self.send_json({'ok': False, 'error': '지원하지 않는 파일 형식입니다. (JPEG 이미지 또는 MP4/WebM/MOV 동영상)'}, 400)
                return
            if is_img and len(file_bytes) > 300 * 1024:
                self.send_json({'ok': False, 'error': '사진 용량이 300KB를 초과합니다.'}, 400)
                return
            if is_vid and len(file_bytes) > 20 * 1024 * 1024:
                self.send_json({'ok': False, 'error': '동영상 용량이 20MB를 초과합니다.'}, 400)
                return
            os.makedirs(REVIEW_UPLOADS_DIR, exist_ok=True)
            out_name = f'rev-{secrets.token_hex(12)}{ext}'
            out_path = os.path.join(REVIEW_UPLOADS_DIR, out_name)
            with open(out_path, 'wb') as f:
                f.write(file_bytes)
            _review_media_counts[cnt_key] = curr_cnt + 1
            rel_path = f'reviews/{out_name}'
            self.send_json({'ok': True, 'path': rel_path})
            return
        if path == '/api/login':
            if too_many(ip, 'login', 5):
                self.send_json({'ok': False, 'error': '너무 여러 번 틀렸어요. 1분 뒤에 다시 해 주세요.'}, 429)
                return
            if not check_password(str(body.get('password') or '')):
                self.send_json({'ok': False, 'error': '비밀번호가 맞지 않아요.'}, 401)
                return
            tok = secrets.token_urlsafe(24)
            SESSIONS[tok] = time.time() + SESSION_HOURS * 3600
            payload = json.dumps({'ok': True}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Set-Cookie', f'sdh_admin={tok}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_HOURS * 3600}')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if path == '/api/logout':
            SESSIONS.pop(self.session_token(), None)
            self.send_response(200)
            self.send_header('Set-Cookie', 'sdh_admin=; Path=/; Max-Age=0')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        if path == '/api/admin-password':
            if not local:
                self.send_json({'ok': False, 'error': '관리자만'}, 403)
                return
            pw = str(body.get('password') or '')
            if len(pw) < 8:
                self.send_json({'ok': False, 'error': '비밀번호는 8자 이상으로 정해 주세요.'}, 400)
                return
            salt, digest = hash_password(pw)
            write_json_file(ADMIN_FILE, {'salt': salt, 'hash': digest, 'updatedAt': datetime.now().isoformat(timespec='seconds')})
            SESSIONS.clear()  # 바꾸면 다른 기기는 다시 로그인
            self.send_json({'ok': True})
            return
        if path == '/api/integrations':
            if not local:
                self.send_json({'ok': False, 'error': '관리자만'}, 403)
                return
            cfg = {
                'orderWebhook': str(body.get('orderWebhook') or '').strip(),
                'inquiryWebhook': str(body.get('inquiryWebhook') or '').strip(),
                'notifyOrders': body.get('notifyOrders') is not False,
                'notifyInquiries': body.get('notifyInquiries') is not False,
            }
            for k in ('orderWebhook', 'inquiryWebhook'):
                if cfg[k] and not WEBHOOK_RE.match(cfg[k]):
                    cfg[k] = ''
            write_json_file(INTEGRATIONS_FILE, cfg)
            self.send_json({'ok': True})
            return
        if path == '/api/notify':
            # 새 주문·상담 알림 (손님 기기도 보낼 수 있지만 자주 못 보내게)
            channel = 'order' if body.get('channel') == 'order' else 'inquiry'
            if too_many(ip, 'notify', 10):
                self.send_json({'ok': False, 'error': 'too-many'}, 429)
                return
            ok, info = send_discord(channel, body.get('payload'))
            self.send_json({'ok': ok, 'info': info})
            return
        if path == '/api/restore':
            if not local:
                self.send_json({'ok': False, 'error': '관리자만'}, 403)
                return
            name = str(body.get('folder') or '')
            if name not in [b['name'] for b in list_backups()]:
                self.send_json({'ok': False, 'error': '없는 백업'}, 404)
                return
            src = os.path.join(BACKUP, name)
            with LOCK:
                make_backup('before-restore', force=True)  # 되돌리기 전 지금 상태도 남김
                for fname in TABLES.values():
                    p = os.path.join(src, fname)
                    if os.path.exists(p):
                        shutil.copy2(p, os.path.join(DATA, fname))
            self.send_json({'ok': True})
            return
        if path == '/api/sync':
            total, rejected = 0, []
            with LOCK:
                make_backup('auto')
                changes = list(body.get('changes') or [])
                def change_sort_key(c):
                    t = c.get('table')
                    if t == 'orders': return 0
                    if t == 'order_items': return 2
                    return 1
                changes.sort(key=change_sort_key)
                for change in changes:
                    n, r = apply_change(change, local)
                    total += n
                    rejected += r
            self.send_json({'ok': True, 'applied': total, 'rejected': rejected})
            return
        if path == '/api/backup':
            # 처음 연결할 때 이 브라우저에 있던 데이터를 따로 보관 (이 컴퓨터에서만)
            if not local:
                self.send_json({'ok': False, 'error': '이 컴퓨터에서만'}, 403)
                return
            label = ''.join(ch for ch in str(body.get('label') or 'browser') if ch.isalnum() or ch in '-_')[:30]
            folder = os.path.join(BACKUP, datetime.now().strftime('%Y%m%d-%H%M%S') + f'-{label}')
            os.makedirs(folder, exist_ok=True)
            for name, text in (body.get('files') or {}).items():
                if name in TABLES.values():
                    with open(os.path.join(folder, name), 'w', encoding='utf-8-sig', newline='') as f:
                        f.write(text.lstrip('﻿'))
            self.send_json({'ok': True, 'folder': os.path.relpath(folder, ROOT)})
            return
        self.send_json({'ok': False, 'error': '없는 주소'}, 404)

    def log_message(self, fmt, *args):
        # API 요청과 오류만 화면에 (사진·스크립트 요청은 너무 많아서 생략)
        msg = fmt % args if args else fmt
        if '/api/' in msg or not str(args[1] if len(args) > 1 else '').startswith(('2', '3')):
            super().log_message(fmt, *args)


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return None


def main():
    ap = argparse.ArgumentParser(description='설담화 로컬 서버 (사이트 + DATA 폴더 CSV 저장소)')
    ap.add_argument('--port', type=int, default=5500)
    ap.add_argument('--lan', action='store_true', help='같은 와이파이의 다른 기기에서도 접속 허용')
    args = ap.parse_args()
    os.makedirs(BACKUP, exist_ok=True)
    host = '0.0.0.0' if args.lan else '127.0.0.1'
    server = ThreadingHTTPServer((host, args.port), Handler)
    print(f'설담화 서버가 켜졌어요 → http://localhost:{args.port}/  (관리자: /admin-index.html)')
    if args.lan:
        ip = lan_ip()
        if ip:
            print(f'같은 와이파이 휴대폰에서: http://{ip}:{args.port}/')
        print('※ 손님 개인정보가 오가요. 매장 내부 와이파이에서만 쓰세요.')
    print('끄려면 Ctrl+C')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n서버를 껐어요.')


if __name__ == '__main__':
    main()
