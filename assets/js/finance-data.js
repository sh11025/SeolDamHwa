// assets/js/finance-data.js
// 설담화(說談花) 매출·지출 데이터 모듈 (관리자 전용)
// 지금은 브라우저 저장소(localStorage)를 쓰고, 나중에 서버로 바꿀 때는 이 파일의 load/save 함수만 교체하면 됩니다.

const EXPENSES_STORAGE_KEY = 'seoldamhwa_expenses';
const ORDERS_STORAGE_KEY = 'seoldamhwa_orders';

const EXPENSE_CATEGORIES = ['꽃 사입', '포장재', '배송·퀵', '임대·공과금', '인건비', '기타'];
const EXPENSE_METHODS = ['카드', '현금', '계좌이체'];

const ORDER_STATUS_LABELS = {
  preparing: '제작 중',
  packaged: '포장 완료',
  delivering: '배송 중',
  completed: '배송 완료',
  cancelled: '주문 취소'
};

// 예전에 관리자 화면에 미리 들어 있던 예시 주문 (실제 판매하지 않는 상품) - 자동으로 정리합니다.
const SAMPLE_ORDER_NUMBERS = ['SDH-261029-01', 'SDH-261028-09', 'SDH-261028-04', 'SDH-261027-12'];

function loadOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    if (!Array.isArray(list)) return [];
    const cleaned = list.filter(o => !SAMPLE_ORDER_NUMBERS.includes(o.orderNumber));
    if (cleaned.length !== list.length) saveOrders(cleaned);
    return cleaned;
  } catch (e) {
    return [];
  }
}

function saveOrders(list) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
}

function loadExpenses() {
  try {
    const list = JSON.parse(localStorage.getItem(EXPENSES_STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveExpenses(list) {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(list));
}

// 'YYYY-MM-DD' (한국 시간)
function financeToday() {
  if (typeof getKoreaTimeParts === 'function') return getKoreaTimeParts().dateStr;
  return toDateStr(new Date());
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return toDateStr(dt);
}

function daysBetween(fromStr, toStr) {
  const [y1, m1, d1] = fromStr.split('-').map(Number);
  const [y2, m2, d2] = toStr.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

// 주문일: createdDate가 없으면 주문 id(ord-타임스탬프)에서 계산
function getOrderDate(o) {
  if (o.createdDate) return o.createdDate;
  const ts = Number(String(o.id || '').replace('ord-', ''));
  if (ts > 1e12) return toDateStr(new Date(ts));
  return '';
}

// 배송일: "2026-10-30 오전 10:00~13:00" → "2026-10-30"
function getDeliveryDate(o) {
  const m = String(o.deliveryDate || '').match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}

function isCountedOrder(o) {
  return o.status !== 'cancelled';
}

// 기간 프리셋 → { from, to, label }
function getPeriodRange(preset, today = financeToday()) {
  const [y, m, d] = today.split('-').map(Number);
  if (preset === 'today') return { from: today, to: today, label: '오늘' };
  if (preset === 'week') {
    const dow = new Date(y, m - 1, d).getDay(); // 0=일
    const from = addDays(today, -((dow + 6) % 7)); // 월요일 시작
    return { from, to: today, label: '이번 주' };
  }
  if (preset === 'month') return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: today, label: '이번 달' };
  if (preset === '30d') return { from: addDays(today, -29), to: today, label: '최근 30일' };
  return { from: today, to: today, label: '오늘' };
}

function inRange(dateStr, from, to) {
  return !!dateStr && dateStr >= from && dateStr <= to;
}

// 기간 요약
function summarizePeriod(from, to) {
  const orders = loadOrders().filter(o => inRange(getOrderDate(o), from, to));
  const counted = orders.filter(isCountedOrder);
  const cancelled = orders.filter(o => !isCountedOrder(o));
  const expenses = loadExpenses().filter(e => inRange(e.date, from, to));
  const revenue = counted.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const expense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const byCategory = {};
  EXPENSE_CATEGORIES.forEach(c => { byCategory[c] = 0; });
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0); });
  return {
    from, to,
    orders: counted,
    cancelled,
    expenses,
    revenue,
    expense,
    profit: revenue - expense,
    orderCount: counted.length,
    avgOrder: counted.length ? Math.round(revenue / counted.length) : 0,
    cancelledAmount: cancelled.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
    byCategory
  };
}

// 날짜별 매출·지출
function dailySeries(from, to) {
  const days = daysBetween(from, to);
  const orders = loadOrders().filter(isCountedOrder);
  const expenses = loadExpenses();
  const rows = [];
  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i);
    const dayOrders = orders.filter(o => getOrderDate(o) === date);
    const revenue = dayOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const expense = expenses.filter(e => e.date === date).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    rows.push({ date, orderCount: dayOrders.length, revenue, expense, profit: revenue - expense });
  }
  return rows;
}

// 상품별 매출 (기간 내, 취소 제외)
function productRevenue(from, to) {
  const totals = {};
  loadOrders()
    .filter(o => isCountedOrder(o) && inRange(getOrderDate(o), from, to))
    .forEach(o => {
      (o.items || []).forEach(it => {
        const name = (it.product && it.product.name) || '기타';
        const amount = ((Number(it.price) || 0) + (Number(it.optionPrice) || 0)) * (Number(it.quantity) || 1);
        totals[name] = (totals[name] || 0) + amount;
      });
    });
  return Object.entries(totals).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
}

// 앞으로 N일 배송 일정 (상태별 건수)
function deliverySchedule(days = 7, today = financeToday()) {
  const orders = loadOrders().filter(isCountedOrder);
  const rows = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const dayOrders = orders.filter(o => getDeliveryDate(o) === date);
    const counts = { preparing: 0, packaged: 0, delivering: 0, completed: 0 };
    dayOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    rows.push({ date, total: dayOrders.length, counts });
  }
  return rows;
}

// 받는 분 / 주문하신 분 (예전 주문은 customerName·phone 하나만 있음)
function orderRecipient(o) {
  return { name: o.recipientName || o.customerName || '', phone: o.recipientPhone || o.phone || '' };
}

function orderOrderer(o) {
  return { name: o.ordererName || o.customerName || '', phone: o.ordererPhone || o.phone || '' };
}

function formatWon(n) {
  return `${(Number(n) || 0).toLocaleString('ko-KR')}원`;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
