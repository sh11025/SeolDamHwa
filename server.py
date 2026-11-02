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
import csv
import io
import json
import os
import shutil
import socket
import threading
import time
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'DATA')
BACKUP = os.path.join(DATA, 'backup')

TABLES = {
    'products': 'products.csv', 'orders': 'orders.csv', 'order_items': 'order_items.csv',
    'expenses': 'expenses.csv', 'inquiries': 'inquiries.csv', 'restock': 'restock.csv',
    'popups': 'popups.csv', 'pages': 'pages.csv', 'settings': 'settings.csv',
    'flowers': 'flowers.csv', 'images': 'images.csv', 'coupons': 'coupons.csv',
}
PUBLIC_TABLES = {'products', 'popups', 'pages', 'settings', 'flowers'}   # 손님 기기도 읽을 수 있는 표
REMOTE_INSERT_TABLES = {'orders', 'order_items', 'inquiries', 'restock'}  # 손님 기기는 새 줄 추가만
KEYS = {'order_items': ('orderId', 'lineNo'), 'settings': ('key',), 'coupons': ('code',)}
COUPON_PUBLIC = ('code', 'batchName', 'type', 'value', 'minOrder', 'startDate', 'endDate', 'active')
MAX_BODY = 60 * 1024 * 1024
BACKUP_EVERY = 600  # 초
BACKUP_KEEP = 40

LOCK = threading.Lock()
_last_backup = 0.0


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
    index = {key_of(table, r): r for r in rows}
    order = [key_of(table, r) for r in rows]
    applied, rejected = 0, []
    for row in change.get('upserts') or []:
        row = {k: ('' if v is None else str(v)) for k, v in row.items()}
        k = key_of(table, row)
        if not k.strip('#'):
            continue
        if not local:
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
            if k in index:
                rejected.append(f'{table}:{k} 이미 있음')
                continue
        if k in index:
            index[k].update(row)
        else:
            index[k] = row
            order.append(k)
        applied += 1
    deletes = change.get('deletes') or []
    if deletes and not local:
        rejected.append(f'{table}: 이 기기에서는 지울 수 없음')
    elif deletes:
        gone = set(str(d) for d in deletes)
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
        if path == '/api/csv':
            local = self.is_local()
            readable = [t for t in TABLES if local or t in PUBLIC_TABLES]
            files = {}
            with LOCK:
                for t in readable:
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
        local = self.is_local()
        if path == '/api/sync':
            total, rejected = 0, []
            with LOCK:
                make_backup('auto')
                for change in body.get('changes') or []:
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
