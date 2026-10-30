// assets/js/shop/shop-checkout.js
// 설담화 쇼핑몰: 장바구니·주문서(받는 분·배송 방법·주소 찾기)·주문 완료·주문 조회
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

function updateCartUI() {
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
            <span>${tp.name}</span>
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
let addressSearchSido = '';

function coT(key, fallback) {
  return typeof t === 'function' ? t(key, fallback) : fallback;
}

function selectedDeliveryMethod() {
  const r = document.querySelector('input[name="delivery-method"]:checked');
  return r ? r.value : '';
}

function renderDeliveryMethodOptions() {
  const wrap = document.getElementById('delivery-method-options');
  if (!wrap || typeof getDeliveryMethods !== 'function') return;
  const s = loadSettings();
  const methods = getDeliveryMethods(s);
  const prev = selectedDeliveryMethod();
  const names = { quick: coT('co_method_quick', '퀵 당일 배송'), parcel: coT('co_method_parcel', '택배'), pickup: coT('co_method_pickup', '매장 픽업') };
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
    area.textContent = m.area || '';
    text.append(title, area);
    const price = document.createElement('span');
    price.className = 'font-bold text-ink-black whitespace-nowrap';
    price.textContent = fee === 0 ? coT('co_free', '무료') : formatPrice(fee);
    label.append(input, text, price);
    wrap.appendChild(label);
  });
  const note = document.getElementById('delivery-note');
  note.textContent = (s.delivery && s.delivery.note) || '';
  note.classList.toggle('hidden', !note.textContent);
}

function recalcCheckout() {
  const s = loadSettings();
  const method = selectedDeliveryMethod();
  const fee = method ? calcDeliveryFee(method, checkoutItemsTotal, s) : 0;
  document.getElementById('checkout-items-total').innerText = formatPrice(checkoutItemsTotal);
  document.getElementById('checkout-delivery-fee').innerText = fee === 0 ? coT('co_free', '무료') : formatPrice(fee);
  document.getElementById('checkout-final-price').innerText = formatPrice(checkoutItemsTotal + fee);
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
  document.getElementById('co-date-label').textContent = isPickup ? coT('co_pickup_date_label', '픽업 날짜 및 시간 (필수)') : coT('checkout_delivery_label', '생화 희망 배송일 및 시간 (필수)');
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

// 퀵은 서울만 (주소 찾기로 고른 경우에만 확인)
function checkAddressArea() {
  const warn = document.getElementById('address-area-warning');
  if (!warn) return true;
  const bad = selectedDeliveryMethod() === 'quick' && addressSearchSido && !/^서울/.test(addressSearchSido);
  warn.textContent = bad ? coT('co_quick_area_warn', '퀵 당일 배송은 서울 지역만 가능해요. 다른 배송 방법을 고르거나 1:1 상담으로 문의해 주세요.') : '';
  warn.classList.toggle('hidden', !bad);
  return !bad;
}

function openAddressSearch() {
  const run = () => {
    new daum.Postcode({
      oncomplete: data => {
        document.getElementById('order-zipcode').value = data.zonecode || '';
        document.getElementById('order-address').value = data.roadAddress || data.jibunAddress || data.address || '';
        addressSearchSido = data.sido || '';
        checkAddressArea();
        document.getElementById('order-address-detail').focus();
      }
    }).open();
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
  document.getElementById('checkout-modal').classList.add('hidden');
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
  const orders = JSON.parse(localStorage.getItem('seoldamhwa_orders') || '[]');
  const o = orders.find(x => String(x.orderNumber).toUpperCase() === num && String(x.ordererPhone || x.phone || '').replace(/\D/g, '') === phone);
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
  const orderDate = document.getElementById('order-delivery-date');
  const orderTime = document.getElementById('order-delivery-time');

  buildDeliveryDateOptions(orderDate);
  if (selectedDelivery.date) {
    const exists = Array.from(orderDate.options).some(o => o.value === selectedDelivery.date);
    if (exists) orderDate.value = selectedDelivery.date;
  }
  if (selectedDelivery.time && orderTime) {
    orderTime.value = selectedDelivery.time;
  }

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
        <span class="font-bold text-ink-black">${tp.name}</span>
        ${item.sizeLabel ? `<span class="text-seal-red text-[11px]"> (${item.sizeLabel})</span>` : ''}
        <span> × ${item.quantity}</span>
        <div class="text-[11px] text-ink-light">${optDisplay}</div>
      </div>
      <span class="font-bold text-ink-black">${formatPrice(itemTotal)}</span>
    `;
    itemsSummary.appendChild(row);
  });

  checkoutItemsTotal = subtotal;
  renderDeliveryMethodOptions();
  recalcCheckout();
  toggleCheckoutModal(true);
}

function toggleCheckoutModal(open) {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    if (open) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
  }
  if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
}

// 주문 제출 -> localStorage 'seoldamhwa_orders'에 저장 및 실시간 재고 차감!
function submitCustomerOrder(e) {
  e.preventDefault();
  const dateVal = document.getElementById('order-delivery-date').value;
  if (!dateVal) {
    alert(coT('pdp_delivery_label', '희망 배송일을 선택해 주세요.'));
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
  const val = id => document.getElementById(id).value.trim();
  const phoneOk = v => v.replace(/\D/g, '').length >= 9;
  if (!phoneOk(val('order-orderer-phone')) || !phoneOk(val('order-phone'))) {
    alert(coT('co_phone_invalid', '연락처를 숫자 9자리 이상으로 적어 주세요.'));
    return;
  }
  if (document.getElementById('order-same-recipient').checked) toggleSameRecipient();

  const settings = loadSettings();
  const timeVal = document.getElementById('order-delivery-time').value;
  const deliveryDate = `${dateVal} ${timeVal}`;
  const orderNumber = `SDH-${Date.now().toString().slice(-8)}`;
  const itemsTotal = cart.reduce((sum, i) => sum + (i.price + i.optionPrice) * i.quantity, 0);
  const deliveryFee = calcDeliveryFee(method, itemsTotal, settings);
  const methodLabels = { quick: '퀵 당일 배송', parcel: '택배', pickup: '매장 픽업' };
  const isPickup = method === 'pickup';
  const address = isPickup ? '매장 픽업' : [val('order-address'), val('order-address-detail')].filter(Boolean).join(', ');

  const now = new Date();
  const createdDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const createdAt = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  // 저장 데이터는 UI 언어와 상관없이 한국어 원본으로 (관리자 화면 호환)
  const newOrder = {
    id: `ord-${Date.now()}`,
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
    totalAmount: itemsTotal + deliveryFee,
    status: 'preparing',
    createdAt,
    createdDate
  };

  const existingOrders = JSON.parse(localStorage.getItem('seoldamhwa_orders') || '[]');
  existingOrders.unshift(newOrder);
  localStorage.setItem('seoldamhwa_orders', JSON.stringify(existingOrders));
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

  cart = [];
  updateCartUI();
  showOrderComplete({ ...newOrder, deliveryMethodLabel: coT(`co_method_${method}`, methodLabels[method]) });
}


// 1:1 상담 문의 핸들러는 하단 단일 정의로 통합 관리

// 5. 뷰 전환 및 모바일 메뉴 제어
