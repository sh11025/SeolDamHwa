// assets/js/restock.js
// 설담화(說談花) 재입고 알림 신청 - 품절 상품에 손님이 연락처를 남기면 관리자 '고객 상담 문의'에 모임
// 서버를 붙일 때는 loadRestock/saveRestock만 서버 호출로 바꾸면 됩니다.

var RESTOCK_STORAGE_KEY = DataStore.KEYS.restock;

function loadRestock() {
  const list = DataStore.read(RESTOCK_STORAGE_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveRestock(list) {
  DataStore.write(RESTOCK_STORAGE_KEY, list);
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

// 같은 상품·같은 번호로 기다리는 신청이 있으면 새로 만들지 않음 → { ok, duplicate, request }
function addRestockRequest({ productId, productName, phone, name }) {
  const list = loadRestock();
  const digits = normalizePhone(phone);
  const dup = list.find(r => r.productId === productId && normalizePhone(r.phone) === digits && r.status === 'waiting');
  if (dup) return { ok: true, duplicate: true, request: dup };
  const now = new Date();
  const request = {
    id: makeId('rs'),
    productId,
    productName,
    name: String(name || '').trim().slice(0, 20),
    phone: String(phone || '').trim().slice(0, 20),
    createdDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    status: 'waiting'
  };
  list.unshift(request);
  saveRestock(list);
  return { ok: true, duplicate: false, request };
}

function restockWaitingCount(productId) {
  return loadRestock().filter(r => r.status === 'waiting' && (!productId || r.productId === productId)).length;
}
