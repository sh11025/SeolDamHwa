// assets/js/coupons.js
// 설담화(說談花) 오프라인 쿠폰 - 관리자가 묶음으로 만들어 인쇄해 나눠 주고, 손님은 결제 ③ 단계에서 코드를 입력
// 저장: localStorage 'seoldamhwa_coupons' = 코드 한 장이 한 줄
//   { code, batchId, batchName, type: 'amount'|'percent', value, minOrder, startDate, endDate, active, createdAt, usedAt, orderNumber }
// 쿠폰에는 손님 정보를 저장하지 않아요 (사용한 주문번호만).

var COUPONS_KEY = DataStore.KEYS.coupons;
const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0·O·1·I 뺌

function loadCoupons() {
  const list = DataStore.read(COUPONS_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveCoupons(list) {
  DataStore.write(COUPONS_KEY, list);
}

function normalizeCouponCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(SDH)?/, 'SDH').replace(/^SDH(.{4})(.{0,4}).*$/, (m, a, b) => `SDH-${a}${b ? `-${b}` : ''}`);
}

function randomCouponCode(taken) {
  const pick = () => COUPON_ALPHABET[crypto.getRandomValues(new Uint32Array(1))[0] % COUPON_ALPHABET.length];
  for (;;) {
    const code = `SDH-${Array.from({ length: 4 }, pick).join('')}-${Array.from({ length: 4 }, pick).join('')}`;
    if (!taken.has(code)) { taken.add(code); return code; }
  }
}

function couponToday() {
  if (typeof getKoreaTimeParts === 'function') return getKoreaTimeParts(new Date()).dateStr;
  return new Date().toISOString().slice(0, 10);
}

// 할인 금액 (상품 금액에만, 배송비는 할인 안 함, 100원 단위 버림)
function couponDiscount(c, itemsTotal) {
  const total = Number(itemsTotal) || 0;
  const v = Number(c.value) || 0;
  const d = c.type === 'percent' ? Math.floor((total * Math.min(v, 100)) / 100 / 100) * 100 : v;
  return Math.max(0, Math.min(d, total));
}

function couponLabel(c) {
  return c.type === 'percent' ? `${Number(c.value)}% 할인` : `${(Number(c.value) || 0).toLocaleString()}원 할인`;
}

// 쓸 수 있는지: { ok, discount, reason: 'none'|'stopped'|'used'|'before'|'expired'|'min' }
function checkCoupon(c, itemsTotal) {
  if (!c) return { ok: false, reason: 'none' };
  if (c.usedAt || c.used) return { ok: false, reason: 'used' };
  if (c.active === false || c.active === 'false') return { ok: false, reason: 'stopped' };
  const today = couponToday();
  if (c.startDate && today < c.startDate) return { ok: false, reason: 'before' };
  if (c.endDate && today > c.endDate) return { ok: false, reason: 'expired' };
  if ((Number(c.minOrder) || 0) > (Number(itemsTotal) || 0)) return { ok: false, reason: 'min' };
  return { ok: true, discount: couponDiscount(c, itemsTotal) };
}

// 코드로 쿠폰 찾기. 손님 기기(서버의 다른 기기)는 쿠폰 목록을 못 받으므로 서버에 한 장만 물어봄
function findCoupon(code) {
  const norm = normalizeCouponCode(code);
  if (typeof DataSync !== 'undefined' && DataSync.enabled && !DataSync.local) {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', `/api/coupon?code=${encodeURIComponent(norm)}`, false);
      x.send(null);
      const res = JSON.parse(x.responseText);
      return res.ok ? res.coupon : null;
    } catch (e) {
      return null;
    }
  }
  return loadCoupons().find(c => c.code === norm) || null;
}

// 주문할 때 사용 처리 (같은 저장소에 있을 때. 서버의 다른 기기에서 온 주문은 서버가 처리)
function markCouponUsed(code, orderNumber) {
  const list = loadCoupons();
  const c = list.find(x => x.code === normalizeCouponCode(code));
  if (!c || c.usedAt) return false;
  c.usedAt = new Date().toISOString();
  c.orderNumber = orderNumber;
  saveCoupons(list);
  return true;
}

/* ---------- 기간이 끝난 쿠폰 정리 + 기록 ----------
 * 기간이 끝난 묶음은 코드를 지우고, 몇 장 만들고 몇 장 썼는지·쓴 날짜만 'seoldamhwa_coupon_history'에 남김
 * { id(묶음 id), batchName, type, value, minOrder, startDate, endDate, created, used, usedDates: ['YYYY-MM-DD', ...], archivedAt } */
var COUPON_HISTORY_KEY = DataStore.KEYS.couponHistory;

function loadCouponHistory() {
  const list = DataStore.read(COUPON_HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveCouponHistory(list) {
  DataStore.write(COUPON_HISTORY_KEY, list);
}

// 쓴 시각 → 한국 날짜
function couponUseDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso).slice(0, 10);
  return typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(d).dateStr : d.toISOString().slice(0, 10);
}

// 끝난 묶음 정리. 정리한 묶음 수를 돌려줌
function cleanupExpiredCoupons() {
  const today = couponToday();
  const list = loadCoupons();
  const expired = new Map();
  list.forEach(c => {
    if (c.endDate && today > c.endDate) {
      if (!expired.has(c.batchId)) expired.set(c.batchId, []);
      expired.get(c.batchId).push(c);
    }
  });
  if (!expired.size) return 0;
  const history = loadCouponHistory();
  expired.forEach((codes, batchId) => {
    const b = codes[0];
    const usedDates = codes.filter(c => c.usedAt).map(c => couponUseDate(c.usedAt)).sort();
    const prev = history.find(h => h.id === batchId);
    const rec = { id: batchId, batchName: b.batchName, type: b.type, value: b.value, minOrder: b.minOrder, startDate: b.startDate, endDate: b.endDate, created: codes.length, used: usedDates.length, usedDates, archivedAt: new Date().toISOString() };
    if (prev) Object.assign(prev, rec); else history.push(rec);
  });
  saveCouponHistory(history);
  saveCoupons(list.filter(c => !expired.has(c.batchId)));
  return expired.size;
}

// 지금 묶음 + 정리된 기록을 합친 통계용 목록
function couponStatsRows() {
  const live = new Map();
  loadCoupons().forEach(c => {
    if (!live.has(c.batchId)) live.set(c.batchId, { id: c.batchId, batchName: c.batchName, type: c.type, value: c.value, minOrder: c.minOrder, startDate: c.startDate, endDate: c.endDate, created: 0, used: 0, usedDates: [], live: true });
    const r = live.get(c.batchId);
    r.created++;
    if (c.usedAt) { r.used++; r.usedDates.push(couponUseDate(c.usedAt)); }
  });
  return [...live.values(), ...loadCouponHistory().filter(h => !live.has(h.id)).map(h => ({ ...h, live: false }))];
}
