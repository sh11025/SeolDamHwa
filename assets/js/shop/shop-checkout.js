// assets/js/shop/shop-checkout.js
// 설담화 쇼핑몰: 장바구니·주문서(받는 분·배송 방법·주소 찾기)·주문 완료·주문 조회
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

function updateCartUI() {
  saveCart();
  const container = document.getElementById('cart-items-container');
  const badge = document.getElementById('cart-badge');
  const totalEl = document.getElementById('cart-total-amount');
  if (!container) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.innerText = String(totalItems);

  if (cart.length === 0) {
    const emptyText = typeof t === 'function' ? t('cart_empty', '장바구니가 비어 있습니다.') : '장바구니가 비어 있습니다.';
    container.innerHTML = `
      <div class="py-16 text-center text-ink-gray text-xs space-y-2">
        <svg class="w-8 h-8 mx-auto text-ink-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <p>${emptyText}</p>
      </div>
    `;
    if (totalEl) totalEl.innerText = formatPrice(0);
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  const sizePrefix = typeof t === 'function' ? t('cart_size_prefix', '크기: ') : '크기: ';
  const qtyLabel = typeof t === 'function' ? t('pdp_qty_label', '수량') : '수량';

  cart.forEach((item, index) => {
    const itemTotal = (item.price + item.optionPrice) * item.quantity;
    subtotal += itemTotal;
    const tp = typeof tProduct === 'function' ? tProduct(item.product) : item.product;

    const optDisplay = item.optionPrice === 0
      ? (typeof t === 'function' ? t('pdp_package_basic', '기본 단아 한지 포장') : '기본 단아 한지 포장')
      : (typeof t === 'function' ? t('pdp_package_silk', '전통 실크 본견 보자기 & 노리개 포장') : '전통 실크 본견 보자기 & 노리개 포장');

    const el = document.createElement('div');
    el.className = 'p-3 bg-[#FAF7F2] border border-ink-black/10 rounded-xs flex gap-3';
    el.innerHTML = `
      <img src="${item.product.image}" class="w-16 h-20 object-cover border border-ink-black/10">
      <div class="flex-1 flex flex-col justify-between py-0.5 text-xs">
        <div>
          <div class="flex justify-between font-bold text-ink-black">
            <span>${htmlText(tp.name)}</span>
            <button onclick="removeFromCart(${index})" class="text-ink-light hover:text-seal-red cursor-pointer">✕</button>
          </div>
          ${item.sizeLabel ? `<p class="text-[11px] text-seal-red font-medium mt-0.5">${sizePrefix}${item.sizeLabel}</p>` : ''}
          <p class="text-[11px] text-ink-gray mt-0.5">${optDisplay}</p>
        </div>
        <div class="flex justify-between items-baseline mt-2">
          <span class="text-ink-gray">${qtyLabel}: ${item.quantity}</span>
          <span class="font-bold text-ink-black">${formatPrice(itemTotal)}</span>
        </div>
      </div>
    `;
    container.appendChild(el);
  });

  if (totalEl) totalEl.innerText = formatPrice(subtotal);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cart-drawer');
  if (open) {
    drawer.classList.remove('hidden');
    updateCartUI();
  } else {
    drawer.classList.add('hidden');
  }
}

// 4. 결제 모달 제어
function proceedCheckoutFromCart() {
  openCheckoutModal();
}

// ---- 주문서: 받는 분·배송 방법·배송비·주소 찾기 ----
let checkoutItemsTotal = 0;
let checkoutAllGoods = false; // 장바구니가 모두 굿즈면 택배로만 보냄
let addressSearchSido = '';

function coT(key, fallback) {
  return typeof t === 'function' ? t(key, fallback) : fallback;
}

function selectedDeliveryMethod() {
  const r = document.querySelector('input[name="delivery-method"]:checked');
  return r ? r.value : '';
}

/* ---------- 오프라인 쿠폰 (coupons.js) ---------- */
let appliedCoupon = null;

function couponMessage(text, ok) {
  const el = document.getElementById('coupon-message');
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('hidden', !text);
  el.classList.toggle('text-emerald-700', !!ok);
  el.classList.toggle('text-seal-red', !ok);
}

function couponReasonText(reason, c) {
  if (reason === 'used') return coT('coupon_err_used', '이미 사용한 쿠폰이에요.');
  if (reason === 'stopped') return coT('coupon_err_stopped', '지금은 쓸 수 없는 쿠폰이에요.');
  if (reason === 'before') return coT('coupon_err_before', '{date}부터 쓸 수 있어요.').replace('{date}', c.startDate);
  if (reason === 'expired') return coT('coupon_err_expired', '기간이 끝난 쿠폰이에요.');
  if (reason === 'min') return coT('coupon_err_min', '상품 금액이 {amount} 이상이면 쓸 수 있어요.').replace('{amount}', formatPrice(Number(c.minOrder) || 0));
  return coT('coupon_err_none', '없는 쿠폰 코드예요. 다시 확인해 주세요.');
}

// 지금 장바구니 금액으로 할인 금액 (조건이 안 맞게 되면 0)
function currentCouponDiscount() {
  if (!appliedCoupon || typeof checkCoupon !== 'function') return 0;
  const r = checkCoupon(appliedCoupon, checkoutItemsTotal);
  return r.ok ? r.discount : 0;
}

function applyCouponCode() {
  const input = document.getElementById('coupon-code');
  const raw = input.value.trim();
  if (!raw) { couponMessage(coT('coupon_err_none', '없는 쿠폰 코드예요. 다시 확인해 주세요.'), false); return; }
  const c = findCoupon(raw);
  const r = checkCoupon(c, checkoutItemsTotal);
  if (!r.ok) { appliedCoupon = null; couponMessage(couponReasonText(r.reason, c), false); recalcCheckout(); syncCouponButtons(); return; }
  appliedCoupon = c;
  input.value = c.code;
  couponMessage(`${c.batchName ? `${c.batchName} · ` : ''}${coT('coupon_ok', '{amount} 할인이 적용됐어요.').replace('{amount}', formatPrice(r.discount))}`, true);
  recalcCheckout();
  syncCouponButtons();
}

function removeCouponCode() {
  appliedCoupon = null;
  document.getElementById('coupon-code').value = '';
  couponMessage('', true);
  recalcCheckout();
  syncCouponButtons();
}

function syncCouponButtons() {
  document.getElementById('coupon-code').readOnly = !!appliedCoupon;
  document.getElementById('coupon-apply-btn').classList.toggle('hidden', !!appliedCoupon);
  document.getElementById('coupon-remove-btn').classList.toggle('hidden', !appliedCoupon);
}

// 쿠폰 QR로 들어오면 (index.html?coupon=코드) 결제 때 자동으로 넣어 둠
document.addEventListener('DOMContentLoaded', () => {
  try {
    const code = new URLSearchParams(location.search).get('coupon');
    if (code) sessionStorage.setItem('sdh_coupon_pending', code);
  } catch (e) { /* 무시 */ }
});

// 퀵·픽업만 시간대를 고름 (택배는 날짜만)
function deliveryNeedsTime(method) {
  return method === 'quick' || method === 'pickup';
}

/* ---------- 배송일 달력 (② 받는 분·배송) ---------- */
let deliveryCalMonth = ''; // 'YYYY-MM'
let serverFullDatesCache = [];

async function syncServerFullDates() {
  if (window.SDH_SERVER_MODE) {
    try {
      const res = await (await fetch('/api/full-dates', { cache: 'no-store' })).json();
      if (res && res.ok && Array.isArray(res.dates)) {
        serverFullDatesCache = res.dates;
      }
    } catch (e) {}
  }
}

function initDeliveryCalendar() {
  const input = document.getElementById('order-delivery-date');
  const fallbackInit = () => {
    const dates = getAvailableDeliveryDates();
    if (input && !dates.some(d => d.value === input.value)) input.value = dates.length ? dates[0].value : '';
    deliveryCalMonth = (input && input.value ? input.value : (dates[0] ? dates[0].value : '')).slice(0, 7);
    renderDeliveryCalendar();
  };
  syncServerFullDates().then(() => {
    fallbackInit();
  }).catch(() => {
    fallbackInit();
  });
}

function moveDeliveryCalendar(delta) {
  let [y, m] = deliveryCalMonth.split('-').map(Number);
  m += delta;
  if (m < 1) { m = 12; y--; }
  if (m > 12) { m = 1; y++; }
  deliveryCalMonth = `${y}-${String(m).padStart(2, '0')}`;
  renderDeliveryCalendar();
}

function pickDeliveryDate(value) {
  document.getElementById('order-delivery-date').value = value;
  renderDeliveryCalendar();
}

function renderDeliveryCalendar() {
  const box = document.getElementById('delivery-calendar');
  const input = document.getElementById('order-delivery-date');
  if (!box || !input) return;
  const dates = getAvailableDeliveryDates();
  if (input.value && !dates.some(d => d.value === input.value)) input.value = dates.length ? dates[0].value : '';
  if (!deliveryCalMonth) deliveryCalMonth = (input.value || (dates[0] ? dates[0].value : '')).slice(0, 7);
  if (!deliveryCalMonth) { box.innerHTML = ''; return; }
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const months = [...new Set(dates.map(d => d.value.slice(0, 7)))];
  const [y, m] = deliveryCalMonth.split('-').map(Number);
  const open = new Set(dates.map(d => d.value));
  const today = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(new Date()).dateStr : '';

  box.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'flex items-center justify-between mb-2';
  const nav = (text, delta, label, disabled) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.setAttribute('aria-label', label);
    b.disabled = disabled;
    b.className = 'w-8 h-8 rounded-full text-lg font-bold hover:bg-[#FAF7F2] disabled:opacity-20 disabled:pointer-events-none cursor-pointer';
    b.onclick = () => moveDeliveryCalendar(delta);
    return b;
  };
  const title = document.createElement('p');
  title.className = 'font-bold text-ink-black text-sm';
  title.textContent = lang === 'en' ? new Date(y, m - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : lang === 'ja' ? `${y}年${m}月` : `${y}년 ${m}월`;
  head.append(nav('‹', -1, coT('co_cal_prev', '이전 달'), deliveryCalMonth <= months[0]), title, nav('›', 1, coT('co_cal_next', '다음 달'), deliveryCalMonth >= months[months.length - 1]));
  box.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-7 gap-1 text-center';
  grid.setAttribute('role', 'grid');
  const weekdays = lang === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : lang === 'ja' ? ['日', '月', '火', '水', '木', '金', '土'] : ['일', '월', '화', '수', '목', '금', '토'];
  weekdays.forEach((w, i) => {
    const c = document.createElement('span');
    c.className = `text-[11px] font-bold pb-1 ${i === 0 ? 'text-seal-red' : 'text-ink-gray'}`;
    c.textContent = w;
    grid.appendChild(c);
  });
  const firstDay = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('span'));
  for (let d = 1; d <= daysInMonth; d++) {
    const value = `${deliveryCalMonth}-${String(d).padStart(2, '0')}`;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = d;
    const isFull = typeof isDeliveryDateFull === 'function' && isDeliveryDateFull(value, { serverFullDates: serverFullDatesCache });
    const ok = open.has(value) && !isFull;
    const on = value === input.value;
    b.disabled = !ok;
    b.dataset.date = value;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    const info = dates.find(x => x.value === value);
    if (isFull) {
      b.title = coT('co_date_full', '이 날은 주문이 마감되었어요.');
      b.setAttribute('aria-label', `${value} (${coT('co_date_full', '이 날은 주문이 마감되었어요.')})`);
    } else {
      b.setAttribute('aria-label', info ? info.label : value);
    }
    b.className = `h-9 rounded-full text-sm font-bold ${on ? 'bg-seal-red text-white' : ok ? 'text-ink-black hover:bg-[#FAF7F2] border border-ink-black/10 cursor-pointer' : 'text-ink-black/25 cursor-not-allowed'}${value === today ? ' underline' : ''}${isFull ? ' line-through opacity-40' : ''}`;
    if (ok) b.onclick = () => pickDeliveryDate(value);
    grid.appendChild(b);
  }
  box.appendChild(grid);

  const picked = document.getElementById('delivery-date-picked');
  const sel = dates.find(x => x.value === input.value);
  if (picked) picked.textContent = sel ? `📅 ${sel.label}` : coT('co_date_required', '달력에서 날짜를 골라 주세요.');
}

function renderDeliveryMethodOptions() {
  const wrap = document.getElementById('delivery-method-options');
  if (!wrap || typeof getDeliveryMethods !== 'function') return;
  const s = loadSettings();
  let methods = getDeliveryMethods(s);
  // 굿즈만 담았으면 택배만 (택배를 꺼 두었으면 원래 방법 그대로)
  const goodsOnly = checkoutAllGoods && methods.some(m => m.id === 'parcel');
  if (goodsOnly) methods = methods.filter(m => m.id === 'parcel');
  const prev = selectedDeliveryMethod();
  const until = typeof quickSameDayUntil === 'function' ? quickSameDayUntil(s) : '';
  // 당일 마감 시각이 없으면 '당일'이라고 하지 않음 (달력도 내일부터)
  const names = { quick: until ? coT('co_method_quick', '퀵 당일 배송') : coT('co_method_quick_plain', '퀵 배송'), parcel: coT('co_method_parcel', '택배'), pickup: coT('co_method_pickup', '매장 픽업') };
  wrap.innerHTML = '';
  methods.forEach((m, i) => {
    const fee = calcDeliveryFee(m.id, checkoutItemsTotal, s);
    const label = document.createElement('label');
    label.className = 'flex items-center gap-3 p-2.5 bg-white border border-ink-black/15 rounded-xs cursor-pointer has-[:checked]:border-seal-red has-[:checked]:bg-[#FAF7F2]';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'delivery-method';
    input.value = m.id;
    input.className = 'w-4 h-4';
    input.checked = prev ? prev === m.id : i === 0;
    input.onchange = recalcCheckout;
    const text = document.createElement('span');
    text.className = 'flex-1';
    const title = document.createElement('span');
    title.className = 'block font-bold text-ink-black';
    title.textContent = names[m.id];
    const area = document.createElement('span');
    area.className = 'block text-[11px] text-ink-gray';
    area.textContent = [m.area || '', m.id === 'quick' && until ? coT('co_quick_until', '오늘 {time}까지 주문하면 오늘 받아요').replace('{time}', until) : ''].filter(Boolean).join(' · ');
    text.append(title, area);
    const price = document.createElement('span');
    price.className = 'font-bold text-ink-black whitespace-nowrap';
    price.textContent = fee === 0 ? coT('co_free', '무료') : formatPrice(fee);
    label.append(input, text, price);
    wrap.appendChild(label);
  });
  const note = document.getElementById('delivery-note');
  note.textContent = [goodsOnly ? coT('co_goods_parcel_only', '굿즈는 택배로만 보내 드려요.') : '', (s.delivery && s.delivery.note) || ''].filter(Boolean).join(' ');
  note.classList.toggle('hidden', !note.textContent);
}

function recalcCheckout() {
  const s = loadSettings();
  const method = selectedDeliveryMethod();
  const fee = method ? calcDeliveryFee(method, checkoutItemsTotal, s) : 0;
  document.getElementById('checkout-items-total').innerText = formatPrice(checkoutItemsTotal);
  const t1 = document.getElementById('checkout-items-total-1');
  if (t1) t1.innerText = formatPrice(checkoutItemsTotal);
  document.getElementById('checkout-delivery-fee').innerText = fee === 0 ? coT('co_free', '무료') : formatPrice(fee);
  const discount = currentCouponDiscount();
  document.getElementById('checkout-coupon-row').classList.toggle('hidden', !discount);
  document.getElementById('checkout-coupon-discount').innerText = `-${formatPrice(discount)}`;
  document.getElementById('checkout-final-price').innerText = formatPrice(checkoutItemsTotal + fee - discount);
  const hint = document.getElementById('checkout-free-hint');
  const freeOver = s.delivery ? s.delivery.freeOver : 0;
  if (method && method !== 'pickup' && fee > 0 && freeOver > checkoutItemsTotal) {
    hint.textContent = coT('co_free_hint', '{amount} 더 담으면 배송비가 무료예요.').replace('{amount}', formatPrice(freeOver - checkoutItemsTotal));
    hint.classList.remove('hidden');
  } else {
    hint.classList.add('hidden');
  }
  // 픽업이면 주소 칸 숨기기
  const isPickup = method === 'pickup';
  document.getElementById('address-fields').classList.toggle('hidden', isPickup);
  document.getElementById('order-address').required = !isPickup;
  // 퀵을 골랐을 때만 오늘 날짜가 생길 수 있어 달력 다시 그리기
  if (typeof renderDeliveryCalendar === 'function') renderDeliveryCalendar();
  // 시간대는 퀵·픽업만, 택배는 날짜만
  const needsTime = deliveryNeedsTime(method);
  document.getElementById('co-date-label').textContent = isPickup ? coT('co_pickup_day_label', '픽업 날짜 (필수)') : coT('co_date_label', '생화 희망 배송일 (필수)');
  document.getElementById('co-time-wrap').classList.toggle('hidden', !needsTime);
  document.getElementById('co-time-label').textContent = isPickup ? coT('co_pickup_time_label', '픽업 시간대') : coT('co_time_label', '받으실 시간대');
  document.getElementById('co-time-parcel-note').classList.toggle('hidden', method !== 'parcel');
  checkAddressArea();
}

function toggleSameRecipient() {
  const same = document.getElementById('order-same-recipient').checked;
  const nameEl = document.getElementById('order-name');
  const phoneEl = document.getElementById('order-phone');
  if (same) {
    nameEl.value = document.getElementById('order-orderer-name').value;
    phoneEl.value = document.getElementById('order-orderer-phone').value;
  }
  nameEl.readOnly = phoneEl.readOnly = same;
  document.getElementById('recipient-fields').classList.toggle('opacity-60', same);
}

// '주문하시는 분과 같아요'를 켠 뒤에 주문자 이름·연락처를 고쳐도 받는 분에 바로 따라가게
document.addEventListener('DOMContentLoaded', () => {
  ['order-orderer-name', 'order-orderer-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { if (document.getElementById('order-same-recipient').checked) toggleSameRecipient(); });
  });
});

// 퀵은 서울만 (주소 찾기로 고른 경우에만 확인)
function checkAddressArea() {
  const warn = document.getElementById('address-area-warning');
  if (!warn) return true;
  const bad = selectedDeliveryMethod() === 'quick' && addressSearchSido && !/^서울/.test(addressSearchSido);
  warn.textContent = bad ? coT('co_quick_area_warn', '퀵 당일 배송은 서울 지역만 가능해요. 다른 배송 방법을 고르거나 1:1 상담으로 문의해 주세요.') : '';
  warn.classList.toggle('hidden', !bad);
  return !bad;
}

// 주소 찾기: 새 창 대신 페이지 안 창에 띄움 (휴대폰·팝업 차단에서도 고른 주소가 바로 들어가게)
function closeAddressSearch() {
  const layer = document.getElementById('address-search-layer');
  if (layer) layer.classList.add('hidden');
  const box = document.getElementById('address-search-box');
  if (box) box.innerHTML = '';
}

function openAddressSearch() {
  const run = () => {
    const layer = document.getElementById('address-search-layer');
    const box = document.getElementById('address-search-box');
    box.innerHTML = '';
    layer.classList.remove('hidden');
    new daum.Postcode({
      oncomplete: data => {
        document.getElementById('order-zipcode').value = data.zonecode || '';
        const addr = document.getElementById('order-address');
        addr.value = data.roadAddress || data.jibunAddress || data.address || '';
        addr.dispatchEvent(new Event('input', { bubbles: true }));
        addressSearchSido = data.sido || '';
        closeAddressSearch();
        checkAddressArea();
        document.getElementById('order-address-detail').focus();
      },
      width: '100%',
      height: '100%'
    }).embed(box, { autoClose: false });
  };
  if (window.daum && window.daum.Postcode) return run();
  const s = document.createElement('script');
  s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  s.onload = run;
  s.onerror = () => alert(coT('co_address_search_fail', '주소 찾기를 불러오지 못했어요. 주소를 직접 적어 주세요.'));
  document.head.appendChild(s);
}

// 주문 완료 화면
function showOrderComplete(order) {
  document.getElementById('checkout-form').classList.add('hidden');
  const done = document.getElementById('order-complete');
  done.classList.remove('hidden');
  document.getElementById('done-order-number').innerText = order.orderNumber;
  const rows = [
    [coT('co_recipient_title', '받으시는 분'), order.recipientName],
    [order.deliveryMethod === 'pickup' ? coT('co_pickup_date_short', '픽업일') : coT('co_delivery_date_short', '배송일'), order.deliveryDate],
    [coT('co_method_title', '배송 방법'), order.deliveryMethodLabel],
    ...(order.couponCode ? [[coT('co_coupon_discount', '쿠폰 할인'), `-${formatPrice(order.couponDiscount)} (${order.couponCode})`]] : []),
    [coT('checkout_total_label', '최종 결제 금액'), formatPrice(order.totalAmount)]
  ];
  const dl = document.getElementById('done-summary');
  dl.innerHTML = '';
  rows.forEach(([k, v]) => {
    const row = document.createElement('div');
    row.className = 'flex justify-between gap-3';
    const dt = document.createElement('dt');
    dt.className = 'text-ink-gray';
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.className = 'font-bold text-ink-black text-right';
    dd.textContent = v;
    row.append(dt, dd);
    dl.appendChild(row);
  });
  document.querySelector('#checkout-modal > div.relative').scrollTop = 0;
}

function copyDoneOrderNumber(btn) {
  const num = document.getElementById('done-order-number').innerText;
  navigator.clipboard.writeText(num).then(() => {
    btn.innerText = coT('co_copied', '복사했어요');
    setTimeout(() => { btn.innerText = coT('co_copy', '복사하기'); }, 1500);
  }).catch(() => {});
}

// ---- 주문 조회 ----
function openOrderLookup(prefillNumber) {
  toggleCheckoutModal(false); // 결제 페이지에서 왔으면 홈으로 돌아간 뒤 조회 창 열기
  document.getElementById('order-lookup-modal').classList.remove('hidden');
  document.getElementById('lookup-result').classList.add('hidden');
  if (typeof prefillNumber === 'string' && prefillNumber) document.getElementById('lookup-order-number').value = prefillNumber;
  if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
}

function closeOrderLookup() {
  document.getElementById('order-lookup-modal').classList.add('hidden');
}

function runOrderLookup(e) {
  e.preventDefault();
  const num = document.getElementById('lookup-order-number').value.trim().toUpperCase();
  const phone = document.getElementById('lookup-phone').value.replace(/\D/g, '');
  const orders = loadOrders();
  let o = orders.find(x => String(x.orderNumber).toUpperCase() === num && String(x.ordererPhone || x.phone || '').replace(/\D/g, '') === phone);
  // 서버로 연 손님 기기는 주문 목록을 갖고 있지 않으므로 서버에 한 건만 확인
  if (!o && typeof DataSync !== 'undefined' && DataSync.enabled && !DataSync.local) o = DataSync.lookupOrder(num, phone);
  const box = document.getElementById('lookup-result');
  box.classList.remove('hidden');
  box.innerHTML = '';
  if (!o) {
    const p = document.createElement('p');
    p.className = 'text-sm text-seal-red font-bold text-center py-3';
    p.textContent = coT('lookup_not_found', '주문을 찾지 못했어요. 주문번호와 주문하신 분 연락처를 다시 확인해 주세요.');
    box.appendChild(p);
    return;
  }
  const steps = ['preparing', 'packaged', 'delivering', 'completed'];
  const stepNames = { preparing: coT('st_preparing', '제작 중'), packaged: coT('st_packaged', '포장 완료'), delivering: coT('st_delivering', '배송 중'), completed: coT('st_completed', '배송 완료') };
  const card = document.createElement('div');
  card.className = 'bg-white border border-ink-black/10 rounded-xs p-4 space-y-3 text-sm';
  if (o.status === 'cancelled') {
    const c = document.createElement('p');
    c.className = 'font-bold text-ink-gray text-center';
    c.textContent = coT('st_cancelled', '주문이 취소되었어요.');
    card.appendChild(c);
  } else {
    const idx = steps.indexOf(o.status);
    const bar = document.createElement('ol');
    bar.className = 'grid grid-cols-4 gap-1 text-center text-[11px]';
    steps.forEach((st, i) => {
      const li = document.createElement('li');
      li.className = `py-2 rounded-xs font-bold ${i <= idx ? 'bg-seal-red text-white' : 'bg-[#F4F1EA] text-ink-gray'}`;
      li.textContent = stepNames[st];
      bar.appendChild(li);
    });
    card.appendChild(bar);
  }
  const info = [
    [coT('co_order_number', '주문번호'), o.orderNumber],
    [coT('co_recipient_title', '받으시는 분'), o.recipientName || o.customerName],
    [o.deliveryMethod === 'pickup' ? coT('co_pickup_date_short', '픽업일') : coT('co_delivery_date_short', '배송일'), o.deliveryDate],
    [coT('lookup_items', '상품'), (o.items || []).map(i => `${(typeof tProduct === 'function' ? tProduct(i.product) : i.product).name}${i.sizeLabel ? ` (${i.sizeLabel})` : ''} × ${i.quantity}`).join(', ')],
    [coT('checkout_total_label', '최종 결제 금액'), formatPrice(o.totalAmount)]
  ];
  if (o.trackingNumber || o.courier) info.push([coT('lookup_tracking', '운송장'), `${o.courier || ''} ${o.trackingNumber || ''}`.trim()]);
  info.forEach(([k, v]) => {
    const row = document.createElement('div');
    row.className = 'flex justify-between gap-3';
    const a = document.createElement('span');
    a.className = 'text-ink-gray whitespace-nowrap';
    a.textContent = k;
    const b = document.createElement('span');
    b.className = 'font-bold text-ink-black text-right';
    b.textContent = v;
    row.append(a, b);
    card.appendChild(row);
  });

  // 배송 완료 주문인 경우 품목별 후기 작성 영역 추가
  if (o.status === 'completed') {
    const revSection = document.createElement('div');
    revSection.className = 'mt-4 pt-3 border-t border-ink-black/10 space-y-2';
    const revTitle = document.createElement('div');
    revTitle.className = 'font-bold text-xs text-ink-black flex items-center justify-between';
    revTitle.innerHTML = '<span>꽃 후기 남기기</span><span class="text-[11px] font-normal text-ink-gray">배송 완료 후기를 남겨주세요</span>';
    revSection.appendChild(revTitle);

    const allRevs = typeof loadReviews === 'function' ? loadReviews() : [];
    const itemsList = o.items || [];
    itemsList.forEach((item, itemIdx) => {
      const pid = (item.product && item.product.id) || item.productId || item.id || `prod_${itemIdx}`;
      const pname = (typeof tProduct === 'function' && item.product ? tProduct(item.product).name : (item.product && item.product.name) || item.productName || item.name || '주문 상품');

      const itemRow = document.createElement('div');
      itemRow.className = 'flex items-center justify-between p-2.5 bg-[#FAF7F2] rounded-xs text-xs';

      const itemInfo = document.createElement('div');
      itemInfo.className = 'font-medium text-ink-black pr-2';
      itemInfo.textContent = pname + (item.sizeLabel ? ` (${item.sizeLabel})` : '');
      itemRow.appendChild(itemInfo);

      const existing = allRevs.find(r =>
        (String(r.orderId) === String(o.id) || String(r.orderNumber) === String(o.orderNumber)) &&
        (String(r.productId) === String(pid) || String(r.productName) === String(pname))
      );

      const actionWrap = document.createElement('div');
      actionWrap.className = 'shrink-0';
      if (existing) {
        if (existing.status === 'approved') {
          actionWrap.innerHTML = '<span class="text-xs font-bold text-forest-green">후기를 남기셨어요 (게시됨)</span>';
        } else {
          actionWrap.innerHTML = '<span class="text-xs font-bold text-ink-gray">후기를 남기셨어요 (확인 중)</span>';
        }
      } else {
        const revBtn = document.createElement('button');
        revBtn.type = 'button';
        revBtn.className = 'px-3 py-1 bg-seal-red text-white text-xs font-bold rounded-xs hover:bg-seal-red/90 cursor-pointer shadow-xs';
        revBtn.textContent = '후기 쓰기';
        revBtn.onclick = () => openReviewModal(o, item);
        actionWrap.appendChild(revBtn);
      }
      itemRow.appendChild(actionWrap);
      revSection.appendChild(itemRow);
    });
    card.appendChild(revSection);
  }

  box.appendChild(card);
}

function openCheckoutModal() {
  const allProds = loadProducts();
  const hiddenItems = [];
  cart = cart.filter(item => {
    const fresh = allProds.find(p => p.id === item.product.id);
    const vis = fresh && (typeof isProductVisible === 'function' ? isProductVisible(fresh) : true);
    if (!vis) {
      hiddenItems.push(item.product.name);
      return false;
    }
    return true;
  });
  if (hiddenItems.length > 0) {
    updateCartUI();
    const msg = typeof t === 'function'
      ? t('checkout_hidden_removed', '현재 판매가 중단(비공개)된 상품이 장바구니에서 제외되었습니다: {items}').replace('{items}', hiddenItems.join(', '))
      : `현재 판매가 중단(비공개)된 상품이 장바구니에서 제외되었습니다: ${hiddenItems.join(', ')}`;
    alert(msg);
  }

  if (cart.length === 0) {
    alert(typeof t === 'function' ? t('order_alert_empty_cart', '장바구니가 비어 있습니다.') : '장바구니가 비어 있습니다.');
    return;
  }
  toggleCartDrawer(false);
  if (typeof updatePopupVisibility === 'function') updatePopupVisibility();

  const itemsSummary = document.getElementById('checkout-items-summary');
  const orderTime = document.getElementById('order-delivery-time');
  initDeliveryCalendar();

  if (orderTime && orderTime.options && orderTime.options.length >= 3) {
    orderTime.options[0].text = typeof t === 'function' ? t('pdp_delivery_time_morning', '오전 10:00~13:00') : '오전 10:00~13:00';
    orderTime.options[1].text = typeof t === 'function' ? t('pdp_delivery_time_afternoon', '오후 14:00~18:00') : '오후 14:00~18:00';
    orderTime.options[2].text = typeof t === 'function' ? t('pdp_delivery_time_evening', '저녁 18:00~21:00') : '저녁 18:00~21:00';
  }

  // 주문 완료 화면에서 다시 열면 주문서로 되돌리기
  document.getElementById('checkout-form').classList.remove('hidden');
  document.getElementById('order-complete').classList.add('hidden');

  itemsSummary.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = (item.price + item.optionPrice) * item.quantity;
    subtotal += itemTotal;
    const tp = typeof tProduct === 'function' ? tProduct(item.product) : item.product;
    const optDisplay = item.optionPrice === 0
      ? (typeof t === 'function' ? t('pdp_package_basic', '기본 단아 한지 포장') : '기본 단아 한지 포장')
      : (typeof t === 'function' ? t('pdp_package_silk', '전통 실크 본견 보자기 & 노리개 포장') : '전통 실크 본견 보자기 & 노리개 포장');

    const row = document.createElement('div');
    row.className = 'flex justify-between text-xs py-1 text-ink-gray border-b border-ink-black/5';
    row.innerHTML = `
      <div>
        <span class="font-bold text-ink-black">${htmlText(tp.name)}</span>
        ${item.sizeLabel ? `<span class="text-seal-red text-[11px]"> (${item.sizeLabel})</span>` : ''}
        <span> × ${item.quantity}</span>
        <div class="text-[11px] text-ink-light">${optDisplay}</div>
      </div>
      <span class="font-bold text-ink-black">${formatPrice(itemTotal)}</span>
    `;
    itemsSummary.appendChild(row);
  });

  checkoutItemsTotal = subtotal;
  checkoutAllGoods = cart.every(item => item.product && item.product.category === 'goods');
  // QR로 받은 쿠폰 코드가 있으면 미리 넣기 (적용은 손님이 [적용]을 눌러야)
  try {
    const pending = sessionStorage.getItem('sdh_coupon_pending');
    const box = document.getElementById('coupon-code');
    if (pending && box && !appliedCoupon && !box.value) box.value = pending;
  } catch (e) { /* 무시 */ }
  renderDeliveryMethodOptions();
  recalcCheckout();
  goCheckoutStep(1);
  toggleCheckoutModal(true);
}

// 결제 페이지 보이기/닫기 (#/checkout). 닫으면 홈으로
function toggleCheckoutModal(open) {
  const page = document.getElementById('checkout-modal');
  if (!page) return;
  if (open) {
    if (typeof hideMainViews === 'function') hideMainViews();
    const pdp = document.getElementById('pdp-modal');
    if (pdp) pdp.classList.add('hidden');
    page.classList.remove('hidden');
    document.title = `${coT('checkout_title', '주문 및 결제')} | 설담화`;
    if (typeof setRouteHash === 'function') setRouteHash('#/checkout');
    window.scrollTo({ top: 0 });
  } else if (!page.classList.contains('hidden')) {
    page.classList.add('hidden');
    if (typeof switchView === 'function') switchView('shop');
  }
  if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
}

// ---- 결제 단계 (① 주문할 꽃 → ② 받는 분·배송 → ③ 확인·주문) ----
let checkoutStep = 1;

function goCheckoutStep(n) {
  if (n === 3 && !validateCheckoutStep2()) return;
  checkoutStep = n;
  document.querySelectorAll('#checkout-form [data-co-step]').forEach(sec => sec.classList.toggle('hidden', Number(sec.dataset.coStep) !== n));
  document.querySelectorAll('#checkout-stepper [data-step-label]').forEach(li => {
    const k = Number(li.dataset.stepLabel);
    li.className = `py-2 rounded-xs border ${k === n ? 'bg-ink-black text-hanji border-ink-black' : k < n ? 'bg-[#FAF7F2] text-seal-red border-seal-red/30' : 'bg-white text-ink-gray border-ink-black/10'}`;
  });
  if (n === 3) renderCheckoutReview();
  const page = document.getElementById('checkout-modal');
  if (page && !page.classList.contains('hidden')) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCheckoutStep2() {
  const sec = document.querySelector('#checkout-form [data-co-step="2"]');
  if (!sec) return true;
  for (const el of sec.querySelectorAll('input, select, textarea')) {
    if (!el.checkValidity()) { el.reportValidity(); return false; }
  }
  const method = selectedDeliveryMethod();
  if (!method) { alert(coT('co_method_required', '배송 방법을 골라 주세요.')); return false; }
  const pickedDate = document.getElementById('order-delivery-date').value;
  if (pickedDate && typeof isDeliveryDateFull === 'function' && isDeliveryDateFull(pickedDate, { serverFullDates: serverFullDatesCache })) {
    document.getElementById('order-delivery-date').value = '';
    renderDeliveryCalendar();
    alert(coT('co_date_full_pick_other', '선택하신 날짜는 주문이 마감되었어요. 다른 날짜를 골라 주세요.'));
    return false;
  }
  if (pickedDate && !getAvailableDeliveryDates().some(d => d.value === pickedDate)) {
    // 예: 당일 퀵 마감 시각이 지나 버림
    document.getElementById('order-delivery-date').value = '';
    renderDeliveryCalendar();
    alert(coT('co_date_expired', '고른 날짜는 이제 받을 수 없어요. 달력에서 다시 골라 주세요.'));
    return false;
  }
  if (!document.getElementById('order-delivery-date').value) {
    alert(coT('co_date_required', '달력에서 날짜를 골라 주세요.'));
    document.getElementById('delivery-calendar').scrollIntoView({ block: 'center' });
    return false;
  }
  const val = id => (document.getElementById(id) || {}).value?.trim() || '';
  if (!val('order-orderer-name')) {
    alert('주문하시는 분 이름을 적어 주세요.');
    return false;
  }
  if (!val('order-name')) {
    alert('받으시는 분 이름을 적어 주세요.');
    return false;
  }
  if (method !== 'pickup' && !val('order-address')) {
    alert('배송 주소를 입력해 주세요.');
    return false;
  }
  if (!isValidPhone(val('order-orderer-phone')) || !isValidPhone(val('order-phone'))) {
    alert(coT('co_phone_invalid', '연락처를 숫자 10~11자리로 적어 주세요. (예: 010-1234-5678)'));
    return false;
  }
  if (!checkAddressArea()) { document.getElementById('address-area-warning').scrollIntoView({ block: 'center' }); return false; }
  return true;
}

function renderCheckoutReview() {
  const dl = document.getElementById('checkout-review');
  if (!dl) return;
  if (document.getElementById('order-same-recipient').checked) toggleSameRecipient();
  const val = id => (document.getElementById(id) || {}).value || '';
  const method = selectedDeliveryMethod();
  const timeSel = document.getElementById('order-delivery-time');
  const picked = getAvailableDeliveryDates().find(d => d.value === val('order-delivery-date'));
  const timeText = deliveryNeedsTime(method) && timeSel.options[timeSel.selectedIndex] ? ` · ${timeSel.options[timeSel.selectedIndex].text}` : '';
  const dateText = `${picked ? picked.label : val('order-delivery-date')}${timeText}`;
  const rows = [
    [coT('co_orderer_title', '주문하시는 분'), `${val('order-orderer-name')} · ${val('order-orderer-phone')}`],
    [coT('co_recipient_title', '받으시는 분'), `${val('order-name')} · ${val('order-phone')}`],
    [coT('co_method_title', '배송 방법'), coT(`co_method_${method}`, method)],
    ...(method === 'pickup' ? [] : [[coT('checkout_address_label', '배송 주소'), [val('order-zipcode') ? `(${val('order-zipcode')})` : '', val('order-address'), val('order-address-detail')].filter(Boolean).join(' ')]]),
    [method === 'pickup' ? coT('co_pickup_date_short', '픽업일') : coT('co_delivery_date_short', '배송일'), dateText],
    ...(val('order-message') ? [[coT('checkout_message_label', '카드 메시지'), val('order-message') + (document.getElementById('order-hide-sender').checked ? ` (${coT('co_anonymous', '익명')})` : '')]] : []),
    ...(val('order-request') ? [[coT('co_request', '배송 요청'), val('order-request')]] : [])
  ];
  dl.innerHTML = '';
  rows.forEach(([k, v]) => {
    const row = document.createElement('div');
    row.className = 'flex justify-between gap-4';
    const dt = document.createElement('dt');
    dt.className = 'text-ink-gray whitespace-nowrap';
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.className = 'font-bold text-ink-black text-right break-keep';
    dd.textContent = v;
    row.append(dt, dd);
    dl.appendChild(row);
  });
}

let orderSubmitting = false;

// 주문 제출 -> localStorage 'seoldamhwa_orders'에 저장 및 실시간 재고 차감!
async function submitCustomerOrder(e) {
  e.preventDefault();
  if (orderSubmitting) return;
  orderSubmitting = true;

  const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = coT('co_placing_order', '주문 접수 중…');
  }

  function resetSubmitState() {
    orderSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml || coT('co_submit', '주문하기');
    }
  }

  try {
    if (!cart || cart.length === 0) {
      return;
    }
    const dateVal = document.getElementById('order-delivery-date').value;
    if (dateVal && typeof isDeliveryDateFull === 'function' && isDeliveryDateFull(dateVal, { serverFullDates: serverFullDatesCache })) {
      document.getElementById('order-delivery-date').value = '';
      renderDeliveryCalendar();
      goCheckoutStep(2);
      alert(coT('co_date_full_pick_other', '선택하신 날짜는 주문이 마감되었어요. 다른 날짜를 골라 주세요.'));
      return;
    }
    if (dateVal && !getAvailableDeliveryDates().some(d => d.value === dateVal)) {
      document.getElementById('order-delivery-date').value = '';
      renderDeliveryCalendar();
      goCheckoutStep(2);
      alert(coT('co_date_expired', '고른 날짜는 이제 받을 수 없어요. 달력에서 다시 골라 주세요.'));
      return;
    }
    if (!dateVal) {
      alert(coT('co_date_required', '달력에서 날짜를 골라 주세요.'));
      return;
    }
    const method = selectedDeliveryMethod();
    if (!method) {
      alert(coT('co_method_required', '배송 방법을 골라 주세요.'));
      return;
    }
    if (!checkAddressArea()) {
      document.getElementById('address-area-warning').scrollIntoView({ block: 'center' });
      return;
    }
    const val = id => (document.getElementById(id) || {}).value?.trim() || '';
    if (!val('order-orderer-name')) {
      alert('주문하시는 분 이름을 적어 주세요.');
      return;
    }
    if (!val('order-name')) {
      alert('받으시는 분 이름을 적어 주세요.');
      return;
    }
    if (method !== 'pickup' && !val('order-address')) {
      alert('배송 주소를 입력해 주세요.');
      return;
    }
    if (!isValidPhone(val('order-orderer-phone')) || !isValidPhone(val('order-phone'))) {
      alert(coT('co_phone_invalid', '연락처를 숫자 10~11자리로 적어 주세요. (예: 010-1234-5678)'));
      return;
    }
    if (document.getElementById('order-same-recipient').checked) toggleSameRecipient();

    // 주문 직전 재고 다시 확인 (다른 손님이 먼저 사 갔을 수 있음)
    const fresh = loadProducts();
    const short = [];
    const need = {};
    cart.forEach(i => { need[i.product.id] = (need[i.product.id] || 0) + (Number(i.quantity) || 0); });
    Object.entries(need).forEach(([id, n]) => {
      const p = fresh.find(x => x.id === id);
      if (!p) short.push({ name: (cart.find(i => i.product.id === id) || {}).product.name, left: 0 });
      else if (!p.inquiryOnly && typeof p.stockQuantity === 'number' && p.stockQuantity < n) short.push({ name: p.name, left: p.stockQuantity });
    });
    if (short.length) {
      const lines = short.map(x => `· ${(typeof tProduct === 'function' ? tProduct({ name: x.name }).name : x.name) || x.name}: ${coT('stock_left_n', '남은 수량 {n}개').replace('{n}', x.left)}`).join('\n');
      alert(`${coT('stock_changed', '주문하는 사이 재고가 줄었어요. 장바구니 수량을 고쳐 주세요.')}\n${lines}`);
      toggleCartDrawer(true);
      return;
    }

    const settings = loadSettings();
    const timeVal = document.getElementById('order-delivery-time').value;
    const deliveryDate = deliveryNeedsTime(method) ? `${dateVal} ${timeVal}` : dateVal;
    const orderNumber = makeOrderNumber();
    const itemsTotal = cart.reduce((sum, i) => sum + (i.price + i.optionPrice) * i.quantity, 0);
    const deliveryFee = calcDeliveryFee(method, itemsTotal, settings);
    // 쿠폰: 주문 직전에 한 번 더 확인 (그 사이 다른 곳에서 썼을 수 있음)
    let couponCode = '';
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      const fresh = findCoupon(appliedCoupon.code);
      const r = checkCoupon(fresh, itemsTotal);
      if (!r.ok) {
        couponMessage(couponReasonText(r.reason, fresh), false);
        appliedCoupon = null;
        syncCouponButtons();
        recalcCheckout();
        alert(couponReasonText(r.reason, fresh));
        return;
      }
      couponCode = fresh.code;
      couponDiscountAmount = r.discount;
    }
    const isToday = typeof getKoreaTimeParts === 'function' && dateVal === getKoreaTimeParts(new Date()).dateStr;
    const methodLabels = { quick: isToday ? '퀵 당일 배송' : '퀵 배송', parcel: '택배', pickup: '매장 픽업' };
    const isPickup = method === 'pickup';
    const address = isPickup ? '매장 픽업' : [val('order-address'), val('order-address-detail')].filter(Boolean).join(', ');

    const now = new Date();
    const createdDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const createdAt = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    // 저장 데이터는 UI 언어와 상관없이 한국어 원본으로 (관리자 화면 호환)
    const newOrder = {
      id: makeId('ord'),
      orderNumber,
      // 주문하신 분
      ordererName: val('order-orderer-name'),
      ordererPhone: val('order-orderer-phone'),
      // 받으시는 분
      recipientName: val('order-name'),
      recipientPhone: val('order-phone'),
      // 예전 화면 호환: customerName/phone은 주문하신 분
      customerName: val('order-orderer-name'),
      phone: val('order-orderer-phone'),
      zipcode: isPickup ? '' : val('order-zipcode'),
      address,
      deliveryMethod: method,
      deliveryMethodLabel: methodLabels[method],
      deliveryFee,
      itemsTotal,
      deliveryDate,
      message: val('order-message'),
      hideSender: document.getElementById('order-hide-sender').checked,
      request: val('order-request'),
      items: cart.map(i => ({ ...i, product: { ...i.product, name: i.product.name } })),
      ...(couponCode ? { couponCode, couponDiscount: couponDiscountAmount } : {}),
      totalAmount: itemsTotal + deliveryFee - couponDiscountAmount,
      status: 'preparing',
      createdAt,
      createdDate
    };

    const existingOrders = loadOrders();
    existingOrders.unshift(newOrder);
    saveOrders(existingOrders);

    // 서버 모드(손님 기기): 서버 동기화 시도 및 중복/유효성 거절 확인
    if (typeof DataSync !== 'undefined' && DataSync.enabled && !DataSync.local) {
      try {
        const syncRes = await DataSync.push();
        if (syncRes && syncRes.rejected && syncRes.rejected.some(r => r.startsWith('orders:'))) {
          // 서버에서 거절된 경우 로컬 롤백
          const rolledBack = loadOrders().filter(o => o.orderNumber !== orderNumber);
          saveOrders(rolledBack);
          alert(coT('co_order_failed', '주문을 접수하지 못했어요. 입력 정보나 주문 번호를 확인해 주세요.'));
          return;
        }
      } catch (err) {
        console.warn('주문 서버 동기화 중 오류:', err);
      }
    }

    try { if (typeof notifyOrderToDiscord === 'function') notifyOrderToDiscord(newOrder); } catch (err) { console.error('discord notify error:', err); }

    // 재고 줄이기
    const currentProducts = loadProducts();
    cart.forEach(item => {
      const prod = currentProducts.find(p => p.id === item.product.id);
      if (prod && typeof prod.stockQuantity === 'number' && !prod.inquiryOnly) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      }
    });
    saveProducts(currentProducts);
    renderProducts(currentCategory);
    if (couponCode) {
      markCouponUsed(couponCode, orderNumber);
      try { sessionStorage.removeItem('sdh_coupon_pending'); } catch (e) { /* 무시 */ }
      appliedCoupon = null;
      document.getElementById('coupon-code').value = '';
      couponMessage('', true);
      syncCouponButtons();
    }

    cart = [];
    updateCartUI();
    showOrderComplete({ ...newOrder, deliveryMethodLabel: coT(`co_method_${method}`, methodLabels[method]) });
  } finally {
    resetSubmitState();
  }
}


// 1:1 상담 문의 핸들러는 하단 단일 정의로 통합 관리

// ----------------------------------------------------
// 고객 후기 작성 및 미디어 처리 (Customer Reviews)
// ----------------------------------------------------
let reviewSelectedPhotos = []; // { blob, name, previewUrl }
let reviewSelectedVideo = null; // { file, name }

function openReviewModal(order, item) {
  const modal = document.getElementById('modal-review');
  if (!modal) return;
  const pid = (item.product && item.product.id) || item.productId || item.id || '';
  const pname = (typeof tProduct === 'function' && item.product ? tProduct(item.product).name : (item.product && item.product.name) || item.productName || item.name || '주문 상품');
  const pphone = order.ordererPhone || order.phone || '';

  document.getElementById('review-order-id').value = order.id || '';
  document.getElementById('review-order-number').value = order.orderNumber || '';
  document.getElementById('review-orderer-phone').value = pphone;
  document.getElementById('review-product-id').value = pid;
  document.getElementById('review-product-name').value = pname;

  const prodNameEl = document.getElementById('review-modal-product-name');
  if (prodNameEl) prodNameEl.textContent = pname + (item.sizeLabel ? ` (${item.sizeLabel})` : '');

  // 서버 연결 여부에 따른 사진·동영상 선택기 / 오프라인 안내 제어
  const isServerRemote = typeof DataSync !== 'undefined' && DataSync.enabled && !DataSync.local;
  const mediaSec = document.getElementById('review-media-upload-section');
  const offlineNotice = document.getElementById('review-media-offline-notice');
  if (mediaSec) mediaSec.classList.toggle('hidden', !isServerRemote);
  if (offlineNotice) offlineNotice.classList.toggle('hidden', isServerRemote);

  // 초기화
  setReviewRating(5);
  const textEl = document.getElementById('review-text');
  if (textEl) textEl.value = '';
  updateReviewCharCount();

  const consentEl = document.getElementById('review-consent');
  if (consentEl) consentEl.checked = false;

  reviewSelectedPhotos = [];
  reviewSelectedVideo = null;
  const photoInput = document.getElementById('review-photo-input');
  if (photoInput) photoInput.value = '';
  const videoInput = document.getElementById('review-video-input');
  if (videoInput) videoInput.value = '';
  renderReviewPhotoPreviews();
  renderReviewVideoPreview();

  modal.classList.remove('hidden');
}

function closeReviewModal() {
  const modal = document.getElementById('modal-review');
  if (modal) modal.classList.add('hidden');
  reviewSelectedPhotos.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
  reviewSelectedPhotos = [];
  reviewSelectedVideo = null;
}

function setReviewRating(rating) {
  const val = Math.max(1, Math.min(5, Number(rating) || 5));
  const hiddenInput = document.getElementById('review-rating-val');
  if (hiddenInput) hiddenInput.value = val;
  const starBtns = document.querySelectorAll('#review-rating-stars .star-btn');
  starBtns.forEach((btn, idx) => {
    btn.textContent = idx < val ? '★' : '☆';
    btn.className = `star-btn hover:scale-110 transition-transform ${idx < val ? 'text-amber-400' : 'text-ink-black/20'}`;
  });
}

function updateReviewCharCount() {
  const textEl = document.getElementById('review-text');
  const countEl = document.getElementById('review-text-counter');
  if (!textEl || !countEl) return;
  const len = textEl.value.trim().length;
  countEl.textContent = `${len} / 500`;
  if (len > 0 && len < 10) {
    countEl.className = 'text-seal-red text-xs font-bold';
  } else {
    countEl.className = 'text-ink-gray text-xs';
  }
}

async function handleReviewPhotoSelect(input) {
  if (!input.files || input.files.length === 0) return;
  const newFiles = Array.from(input.files);
  input.value = '';

  if (reviewSelectedPhotos.length + newFiles.length > 3) {
    alert('사진은 최대 3장까지만 첨부할 수 있어요.');
    return;
  }

  for (const file of newFiles) {
    try {
      const resizedBlob = await resizeImageToBlob(file);
      const previewUrl = URL.createObjectURL(resizedBlob);
      reviewSelectedPhotos.push({
        blob: resizedBlob,
        name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
        previewUrl
      });
    } catch (err) {
      alert(err.message || '사진을 처리할 수 없어요.');
    }
  }
  renderReviewPhotoPreviews();
}

function renderReviewPhotoPreviews() {
  const box = document.getElementById('review-photo-previews');
  if (!box) return;
  box.innerHTML = '';
  reviewSelectedPhotos.forEach((item, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'relative w-16 h-16 rounded-xs border border-ink-black/15 overflow-hidden group';
    wrap.innerHTML = `
      <img src="${item.previewUrl}" alt="첨부 사진" class="w-full h-full object-cover cursor-pointer" onclick="openReviewPhotoModal('${item.previewUrl}')" />
      <button type="button" class="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-seal-red" onclick="removeReviewPhoto(${idx})">×</button>
    `;
    box.appendChild(wrap);
  });
}

function removeReviewPhoto(idx) {
  if (reviewSelectedPhotos[idx] && reviewSelectedPhotos[idx].previewUrl) {
    URL.revokeObjectURL(reviewSelectedPhotos[idx].previewUrl);
  }
  reviewSelectedPhotos.splice(idx, 1);
  renderReviewPhotoPreviews();
}

function resizeImageToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1000;
        let w = img.width;
        let h = img.height;
        if (w > maxSide || h > maxSide) {
          if (w > h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('사진 변환에 실패했어요.'));
          if (blob.size > 300 * 1024) {
            canvas.toBlob(blob2 => {
              if (blob2 && blob2.size <= 300 * 1024) resolve(blob2);
              else reject(new Error('사진 크기가 300KB를 넘어요. 더 작은 사진을 올려주세요.'));
            }, 'image/jpeg', 0.65);
          } else {
            resolve(blob);
          }
        }, 'image/jpeg', 0.82);
      };
      img.onerror = () => reject(new Error('사진 파일을 읽을 수 없어요.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('파일 읽기 오류'));
    reader.readAsDataURL(file);
  });
}

async function handleReviewVideoSelect(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  input.value = '';

  try {
    await checkVideoMetadata(file);
    reviewSelectedVideo = { file, name: file.name };
    renderReviewVideoPreview();
  } catch (err) {
    alert(err.message || '동영상을 첨부할 수 없어요.');
  }
}

function checkVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 20 * 1024 * 1024) {
      return reject(new Error('동영상 용량은 20MB 이하여야 해요.'));
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const validExts = ['mp4', 'webm', 'mov'];
    if (!validExts.includes(ext) && !file.type.startsWith('video/')) {
      return reject(new Error('동영상은 mp4, webm, mov 파일만 첨부할 수 있어요.'));
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration > 30.5) {
        reject(new Error(`동영상 길이는 30초 이하여야 해요 (현재: ${Math.round(video.duration)}초).`));
      } else {
        resolve(true);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('동영상 재생 시간을 확인할 수 없어요.'));
    };
    video.src = url;
  });
}

function renderReviewVideoPreview() {
  const box = document.getElementById('review-video-preview');
  if (!box) return;
  if (!reviewSelectedVideo) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `
    <div class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#FAF7F2] border border-ink-black/15 rounded-xs text-xs text-ink-black">
      <span class="truncate max-w-[200px]">🎬 ${htmlText(reviewSelectedVideo.name)}</span>
      <button type="button" class="text-ink-gray hover:text-seal-red font-bold text-sm leading-none" onclick="removeReviewVideo()">✕</button>
    </div>
  `;
}

function removeReviewVideo() {
  reviewSelectedVideo = null;
  renderReviewVideoPreview();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = (reader.result || '').split(',')[1] || '';
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadReviewMedia(orderNumber, phone, filename, blob) {
  const base64 = await blobToBase64(blob);
  const res = await fetch('/api/review-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, phone, filename, data: base64 })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '미디어 업로드 실패');
  }
  const data = await res.json();
  return data.path;
}

async function submitCustomerReview(e) {
  e.preventDefault();
  const orderId = document.getElementById('review-order-id').value;
  const orderNumber = document.getElementById('review-order-number').value;
  const phone = document.getElementById('review-orderer-phone').value;
  const productId = document.getElementById('review-product-id').value;
  const productName = document.getElementById('review-product-name').value;
  const rating = Number(document.getElementById('review-rating-val').value) || 5;
  const text = (document.getElementById('review-text').value || '').trim();

  if (rating < 1 || rating > 5) {
    alert('별점을 1~5점 중에서 골라 주세요.');
    return;
  }
  if (text.length < 10 || text.length > 500) {
    alert('후기 내용은 10자 이상 500자 이하로 적어 주세요.');
    return;
  }
  const consent = document.getElementById('review-consent').checked;
  if (!consent) {
    alert('후기 게시 동의에 체크해 주세요.');
    return;
  }

  // 동일 주문·상품 중복 작성 방지
  const existingList = typeof loadReviews === 'function' ? loadReviews() : [];
  const alreadyReviewed = existingList.some(r =>
    (String(r.orderId) === String(orderId) || String(r.orderNumber) === String(orderNumber)) &&
    (String(r.productId) === String(productId) || String(r.productName) === String(productName))
  );
  if (alreadyReviewed) {
    alert('이미 후기를 작성해 주신 상품이에요. 소중한 마음에 감사드려요.');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-review');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
  }

  try {
    const photoPaths = [];
    let videoPath = '';

    const isServerMode = typeof DataSync !== 'undefined' && DataSync.enabled && !DataSync.local;

    // 미디어 업로드 (서버 모드일 때만)
    if (isServerMode) {
      for (const p of reviewSelectedPhotos) {
        const path = await uploadReviewMedia(orderNumber, phone, p.name, p.blob);
        photoPaths.push(path);
      }
      if (reviewSelectedVideo) {
        videoPath = await uploadReviewMedia(orderNumber, phone, reviewSelectedVideo.name, reviewSelectedVideo.file);
      }
    }

    const newRev = {
      id: typeof makeId === 'function' ? makeId('rev') : ('rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
      orderId,
      orderNumber,
      productId,
      productName,
      rating,
      text,
      photos: photoPaths,
      video: videoPath,
      status: 'pending', // 사장님 승인 대기
      adminReply: '',
      replyAt: '',
      createdAt: new Date().toISOString(),
      isSample: false
    };

    const currentRevs = typeof loadReviews === 'function' ? loadReviews() : [];
    currentRevs.push(newRev);
    if (typeof saveReviews === 'function') saveReviews(currentRevs);

    // 서버에 동기화 (DataSync.push 사용)
    if (typeof DataSync !== 'undefined' && DataSync.enabled && typeof DataSync.push === 'function') {
      try {
        const pushRes = await DataSync.push();
        if (pushRes && Array.isArray(pushRes.rejected)) {
          const revRejects = pushRes.rejected.filter(r => typeof r === 'string' && r.startsWith('reviews:'));
          if (revRejects.length > 0) {
            const rolledBack = (typeof loadReviews === 'function' ? loadReviews() : []).filter(r => r.id !== newRev.id);
            if (typeof saveReviews === 'function') saveReviews(rolledBack);
            const reason = revRejects[0].replace(/^reviews:\s*/, '');
            alert(reason || '후기를 등록하지 못했어요. 입력 내용을 확인해 주세요.');
            return;
          }
        }
      } catch (pushErr) {
        console.warn('후기 서버 전송 중 오류:', pushErr);
      }
    }

    alert('소중한 후기가 접수되었어요. 사장님 확인 후 게시됩니다.');
    closeReviewModal();

    // 주문 조회 결과 새로고침
    const lookupEvt = new Event('submit', { cancelable: true });
    runOrderLookup(lookupEvt);

  } catch (err) {
    console.error('후기 등록 실패:', err);
    alert(err.message || '후기를 등록하지 못했어요. 다시 시도해 주세요.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '후기 등록하기';
    }
  }
}

function openReviewPhotoModal(src) {
  const modal = document.getElementById('modal-review-photo');
  const img = document.getElementById('review-photo-full');
  if (!modal || !img) return;
  img.src = typeof reviewMediaUrl === 'function' ? reviewMediaUrl(src) : src;
  modal.classList.remove('hidden');
}

function closeReviewPhotoModal() {
  const modal = document.getElementById('modal-review-photo');
  const img = document.getElementById('review-photo-full');
  if (modal) modal.classList.add('hidden');
  if (img) img.src = '';
}


// 5. 뷰 전환 및 모바일 메뉴 제어
