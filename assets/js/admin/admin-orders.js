// assets/js/admin/admin-orders.js
// 설담화 관리자: 주문 목록·거르기·운송장 출력·주문 취소
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 3. 주문 및 배송 관리 (한 줄 목록 + 거르기 + 펼쳐 보기)
const COURIERS = ['직접 배송', '퀵서비스', 'CJ대한통운', '우체국택배', '한진택배', '롯데택배', '로젠택배'];
const ORDER_PAGE_SIZE = 30;
let orderStatusFilter = 'all';
let orderShowCount = ORDER_PAGE_SIZE;
const expandedOrders = new Set();
const checkedOrders = new Set();

function setOrderStatusFilter(st) {
  orderStatusFilter = st;
  orderShowCount = ORDER_PAGE_SIZE;
  renderOrdersList();
}

function showMoreOrders() {
  orderShowCount += ORDER_PAGE_SIZE;
  renderOrdersList();
}

function toggleOrderExpand(id) {
  if (expandedOrders.has(id)) expandedOrders.delete(id); else expandedOrders.add(id);
  renderOrdersList();
}

function toggleOrderCheck(id, on) {
  if (on) checkedOrders.add(id); else checkedOrders.delete(id);
  updatePrintButton();
}

function toggleAllOrderChecks(on) {
  document.querySelectorAll('.order-check').forEach(cb => { cb.checked = on; toggleOrderCheck(cb.dataset.id, on); });
}

function updatePrintButton() {
  const btn = document.getElementById('print-labels-btn');
  if (btn) btn.innerText = checkedOrders.size ? `선택한 ${checkedOrders.size}건 운송장 출력` : '선택한 주문 운송장 출력';
}

function filteredOrders() {
  const today = financeToday();
  const tomorrow = addDays(today, 1);
  const in7 = addDays(today, 6);
  const dateFilter = (document.getElementById('order-date-filter') || {}).value || 'all';
  const q = ((document.getElementById('order-search') || {}).value || '').trim().toLowerCase().replace(/-/g, '');
  return loadAdminOrders().filter(o => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    const d = getDeliveryDate(o);
    if (dateFilter === 'today' && d !== today) return false;
    if (dateFilter === 'tomorrow' && d !== tomorrow) return false;
    if (dateFilter === 'next7' && !(d >= today && d <= in7)) return false;
    if (dateFilter === 'past' && !(d && d < today)) return false;
    if (q) {
      const hay = [o.orderNumber, o.customerName, o.phone, o.recipientName, o.recipientPhone, o.trackingNumber].join(' ').toLowerCase().replace(/-/g, '');
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    // 진행 중인 주문은 배송일이 가까운 순, 끝난 주문(배송 완료·취소)은 뒤에서 최근 순
    const doneA = a.status === 'completed' || a.status === 'cancelled';
    const doneB = b.status === 'completed' || b.status === 'cancelled';
    if (doneA !== doneB) return doneA ? 1 : -1;
    const da = a.deliveryDate || '', db = b.deliveryDate || '';
    return doneA ? db.localeCompare(da) : da.localeCompare(db);
  });
}

function renderOrderStatusTabs(all) {
  const wrap = document.getElementById('order-status-tabs');
  if (!wrap) return;
  const tabs = [['all', '전체'], ['preparing', '제작 중'], ['packaged', '포장 완료'], ['delivering', '배송 중'], ['completed', '배송 완료'], ['cancelled', '취소']];
  wrap.innerHTML = tabs.map(([st, label]) => {
    const n = st === 'all' ? all.length : all.filter(o => o.status === st).length;
    const on = st === orderStatusFilter;
    return `<button type="button" onclick="setOrderStatusFilter('${st}')" class="px-3 py-1.5 rounded-xs text-xs font-bold cursor-pointer ${on ? 'bg-ink-black text-white' : 'bg-white border border-ink-black/15 text-ink-black hover:border-ink-black'}">${label} <span class="${on ? 'text-white/70' : 'text-ink-gray'}">${n}</span></button>`;
  }).join('');
}

function renderOrdersList() {
  const all = loadAdminOrders();
  renderOrderStatusTabs(all);
  const tbody = document.getElementById('admin-orders-list');
  if (!tbody) return;
  const list = filteredOrders();
  const shown = list.slice(0, orderShowCount);
  const today = financeToday();
  const tomorrow = addDays(today, 1);
  document.getElementById('order-list-count').innerText = list.length ? `${list.length}건 중 ${shown.length}건 표시` : '';
  document.getElementById('order-more-btn').classList.toggle('hidden', shown.length >= list.length);
  document.getElementById('order-check-all').checked = shown.length > 0 && shown.every(o => checkedOrders.has(o.id));
  updatePrintButton();

  if (shown.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-ink-gray">${all.length ? '조건에 맞는 주문이 없어요.' : '아직 들어온 주문이 없어요.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = shown.map(o => {
    const d = getDeliveryDate(o);
    const time = String(o.deliveryDate || '').slice(d.length).trim();
    const soon = o.status !== 'cancelled' && o.status !== 'completed' ? (d === today ? '오늘' : d === tomorrow ? '내일' : '') : '';
    const isCancelled = o.status === 'cancelled';
    const items = o.items || [];
    const first = items[0] ? `${items[0].product && items[0].product.name}${items[0].sizeLabel ? ` (${items[0].sizeLabel})` : ''} ×${Number(items[0].quantity) || 1}` : '-';
    const open = expandedOrders.has(o.id);
    const statusSelect = isCancelled
      ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-600">주문 취소</span>'
      : `<select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs font-bold rounded-xs border border-ink-black/15 py-1 px-1.5 ${ORDER_STATUS_STYLE[o.status] || ''}" aria-label="배송 상태">
          ${['preparing', 'packaged', 'delivering', 'completed'].map(st => `<option value="${st}" ${o.status === st ? 'selected' : ''}>${ORDER_STATUS_LABELS[st]}</option>`).join('')}
        </select>`;
    const row = `
      <tr class="border-b border-ink-black/5 ${soon ? 'bg-amber-50/70' : ''} ${isCancelled ? 'opacity-55' : ''} hover:bg-[#F3EDE3]/50">
        <td class="py-2 pl-3 pr-1"><input type="checkbox" class="order-check w-4 h-4" data-id="${o.id}" ${checkedOrders.has(o.id) ? 'checked' : ''} onchange="toggleOrderCheck('${o.id}', this.checked)" aria-label="${escapeHtml(o.orderNumber)} 선택"></td>
        <td class="py-2 px-2 whitespace-nowrap cursor-pointer" onclick="toggleOrderExpand('${o.id}')">
          ${soon ? `<span class="px-1.5 py-0.5 mr-1 rounded text-[11px] font-bold bg-amber-200 text-amber-900">${soon}</span>` : ''}<span class="font-bold text-ink-black">${escapeHtml(d ? shortDate(d) + ' (' + weekdayLabel(d) + ')' : o.deliveryDate)}</span>
          <span class="block text-[11px] text-ink-gray">${escapeHtml(time)}</span>
        </td>
        <td class="py-2 px-2 cursor-pointer" onclick="toggleOrderExpand('${o.id}')"><span class="font-mono text-xs ${isCancelled ? 'line-through' : ''}">${escapeHtml(o.orderNumber)}</span><span class="block text-[11px] text-ink-gray">${escapeHtml(getOrderDate(o))} 접수</span></td>
        <td class="py-2 px-2 font-bold text-ink-black cursor-pointer" onclick="toggleOrderExpand('${o.id}')">${escapeHtml(orderRecipient(o).name)}${o.deliveryMethod === 'pickup' ? ' <span class="text-[10px] font-bold px-1 rounded bg-blue-100 text-blue-800">픽업</span>' : ''}</td>
        <td class="py-2 px-2 text-ink-black cursor-pointer max-w-[220px] truncate" onclick="toggleOrderExpand('${o.id}')" title="${escapeHtml(items.map(i => i.product && i.product.name).join(', '))}">${escapeHtml(first)}${items.length > 1 ? ` <span class="text-ink-gray">외 ${items.length - 1}</span>` : ''}</td>
        <td class="py-2 px-2 text-right font-bold whitespace-nowrap">${isCancelled ? `<s>${formatWon(o.totalAmount)}</s>` : formatWon(o.totalAmount)}</td>
        <td class="py-2 px-2">${statusSelect}</td>
        <td class="py-2 px-2 text-xs whitespace-nowrap">${o.trackingNumber ? `<span class="text-ink-black">${escapeHtml(o.courier || '')}</span><span class="block font-mono text-ink-gray">${escapeHtml(o.trackingNumber)}</span>` : o.courier ? escapeHtml(o.courier) : '<span class="text-ink-light">-</span>'}</td>
        <td class="py-2 px-2 text-center"><button type="button" onclick="toggleOrderExpand('${o.id}')" class="text-ink-gray hover:text-seal-red cursor-pointer" aria-label="자세히" aria-expanded="${open}">${open ? '▴' : '▾'}</button></td>
      </tr>`;
    if (!open) return row;
    return row + `
      <tr class="bg-[#FAF7F2] border-b border-ink-black/10">
        <td></td>
        <td colspan="8" class="py-3 px-2">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1">
              <p class="font-bold text-ink-gray">받는 분</p>
              <p class="text-sm font-bold text-ink-black">${escapeHtml(orderRecipient(o).name)} · <a href="tel:${escapeHtml(orderRecipient(o).phone)}" class="underline">${escapeHtml(orderRecipient(o).phone)}</a></p>
              <p class="text-ink-black">${o.zipcode ? `(${escapeHtml(o.zipcode)}) ` : ''}${escapeHtml(o.address)}</p>
              ${o.ordererName && (o.ordererName !== o.recipientName || o.ordererPhone !== o.recipientPhone) ? `<p class="pt-1 text-ink-gray">주문하신 분: <span class="text-ink-black font-bold">${escapeHtml(o.ordererName)}</span> · <a href="tel:${escapeHtml(o.ordererPhone)}" class="underline">${escapeHtml(o.ordererPhone)}</a></p>` : ''}
              ${o.deliveryMethodLabel ? `<p class="text-ink-gray">배송: <span class="text-ink-black font-bold">${escapeHtml(o.deliveryMethodLabel)}</span>${typeof o.deliveryFee === 'number' ? ` · 배송비 ${formatWon(o.deliveryFee)}` : ''}</p>` : ''}
              ${o.request ? `<p class="text-ink-gray">요청: <span class="text-ink-black">${escapeHtml(o.request)}</span></p>` : ''}
              ${o.hideSender ? '<p class="font-bold text-amber-800">🤫 익명 선물 (카드에 보내는 분 이름 생략)</p>' : ''}
              ${o.message ? `<p class="mt-2 text-seal-red font-serif italic bg-[#F3EDE3] p-2 rounded-xs border-l-2 border-seal-red">✉️ "${escapeHtml(o.message)}"</p>` : '<p class="text-ink-light mt-2">카드 메시지 없음</p>'}
            </div>
            <div class="space-y-1">
              <p class="font-bold text-ink-gray">주문 상품</p>
              ${items.map(i => `<p class="text-ink-black">• ${escapeHtml(i.product && i.product.name)}${i.sizeLabel ? ` (${escapeHtml(i.sizeLabel)})` : ''} × ${Number(i.quantity) || 1}<span class="block pl-3 text-ink-gray">${escapeHtml(i.optionName || '기본 포장')}</span></p>`).join('')}
              <p class="pt-1 text-ink-gray">접수 ${escapeHtml(getOrderDate(o))} ${escapeHtml(o.createdAt || '')}</p>
            </div>
            <div class="space-y-2">
              <p class="font-bold text-ink-gray">운송장</p>
              <div class="flex gap-1.5">
                <select id="courier-${o.id}" class="bg-white border border-ink-black/20 p-1.5 rounded-xs text-xs" aria-label="택배사">
                  ${COURIERS.map(c => `<option ${o.courier === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <input type="text" id="tracking-${o.id}" value="${escapeHtml(o.trackingNumber || '')}" placeholder="운송장 번호 (선택)" class="flex-1 min-w-0 bg-white border border-ink-black/20 p-1.5 rounded-xs text-xs font-mono">
                <button type="button" onclick="saveTracking('${o.id}')" class="px-2.5 py-1.5 bg-ink-black text-white rounded-xs font-bold cursor-pointer hover:bg-seal-red">저장</button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button type="button" onclick="printLabels(['${o.id}'])" class="px-3 py-1.5 border border-ink-black/20 bg-white rounded-xs font-bold cursor-pointer hover:border-ink-black">🏷 운송장 출력</button>
                <button type="button" onclick="${isCancelled ? `restoreOrder('${o.id}')` : `cancelOrder('${o.id}')`}" class="px-3 py-1.5 border rounded-xs font-bold cursor-pointer ${isCancelled ? 'border-ink-black/20 bg-white text-ink-black' : 'border-seal-red/30 text-seal-red bg-white hover:bg-seal-red/10'}">${isCancelled ? '취소 되돌리기' : '주문 취소'}</button>
              </div>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function saveTracking(ordId) {
  const courier = document.getElementById(`courier-${ordId}`).value;
  const trackingNumber = document.getElementById(`tracking-${ordId}`).value.trim().replace(/\s+/g, '');
  if (trackingNumber && !/^[0-9A-Za-z-]{6,30}$/.test(trackingNumber)) {
    alert('운송장 번호는 숫자·영문 6~30자로 적어 주세요.');
    return;
  }
  saveOrders(loadAdminOrders().map(o => o.id === ordId ? { ...o, courier, trackingNumber } : o));
  renderOrdersList();
}

// 운송장(배송 라벨) 출력: A4 한 장에 4장 (92×132mm), 인쇄 창에서 프린터나 'PDF로 저장' 선택
function printSelectedLabels() {
  const ids = [...checkedOrders];
  if (ids.length === 0) { alert('운송장을 출력할 주문을 먼저 체크해 주세요.'); return; }
  printLabels(ids);
}

function printLabels(ids) {
  const orders = loadAdminOrders().filter(o => ids.includes(o.id));
  const cancelled = orders.filter(o => o.status === 'cancelled');
  const targets = orders.filter(o => o.status !== 'cancelled');
  if (cancelled.length && !confirm(`취소된 주문 ${cancelled.length}건은 빼고 출력할게요.`)) return;
  if (targets.length === 0) { alert('출력할 주문이 없어요.'); return; }
  const s = loadSettings();
  const b = s.business || {};
  const senderName = b.companyName || '설담화';
  const senderAddr = b.bizAddress || [s.address, s.addressDetail].filter(Boolean).join(' ');
  const sheet = document.getElementById('report-sheet');
  sheet.innerHTML = `<div class="label-grid">${targets.map(o => {
    const d = getDeliveryDate(o);
    const time = String(o.deliveryDate || '').slice(d.length).trim();
    const items = (o.items || []).map(i => `${escapeHtml(i.product && i.product.name)}${i.sizeLabel ? `(${escapeHtml(i.sizeLabel)})` : ''} ×${Number(i.quantity) || 1}`).join(', ');
    return `<div class="ship-label">
      <div class="sl-top">
        <div class="sl-brand"><img src="assets/images/seal.svg" alt=""><span>${escapeHtml(senderName)}</span></div>
        <div class="sl-fragile">생화 · 취급주의</div>
      </div>
      <div class="sl-date">${escapeHtml(d ? `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일 (${weekdayLabel(d)})` : o.deliveryDate)} <span>${escapeHtml(time)}</span></div>
      <div class="sl-block sl-to">
        <div class="sl-label">받는 분</div>
        <div class="sl-name">${escapeHtml(orderRecipient(o).name)}</div>
        <div class="sl-phone">${escapeHtml(orderRecipient(o).phone)}</div>
        <div class="sl-addr">${o.zipcode ? `(${escapeHtml(o.zipcode)}) ` : ''}${escapeHtml(o.address)}</div>
      </div>
      <div class="sl-block sl-from">
        <div class="sl-label">보내는 분</div>
        <div>${escapeHtml(senderName)} · ${escapeHtml(s.phone || '')}</div>
        <div>${escapeHtml(senderAddr)}</div>
      </div>
      <div class="sl-items"><b>상품</b> ${items}${o.message ? '<br><b>✉ 카드 메시지 동봉</b>' : ''}${o.hideSender ? ' · <b>보내는 분 이름 생략</b>' : ''}${o.request ? `<br><b>요청</b> ${escapeHtml(o.request)}` : ''}</div>
      <div class="sl-bottom">
        <svg class="sl-barcode" data-code="${escapeHtml(o.orderNumber)}"></svg>
        <div class="sl-track">${o.courier ? escapeHtml(o.courier) : ''}${o.trackingNumber ? `<br><b>${escapeHtml(o.trackingNumber)}</b>` : ''}</div>
      </div>
      <div class="sl-warn">⬆ 이쪽이 위 · 눕히지 마세요 · 물기 주의</div>
    </div>`;
  }).join('')}</div>`;
  if (typeof JsBarcode === 'function') {
    sheet.querySelectorAll('.sl-barcode').forEach(svg => {
      try { JsBarcode(svg, svg.dataset.code, { format: 'CODE128', height: 34, width: 1.3, fontSize: 11, margin: 0, displayValue: true }); } catch (e) { svg.outerHTML = `<div class="sl-code-text">${svg.dataset.code}</div>`; }
    });
  } else {
    sheet.querySelectorAll('.sl-barcode').forEach(svg => { svg.outerHTML = `<div class="sl-code-text">${escapeHtml(svg.dataset.code)}</div>`; });
  }
  const prevTitle = document.title;
  document.title = `설담화_운송장_${financeToday()}_${targets.length}건`;
  const restore = () => { document.title = prevTitle; window.removeEventListener('afterprint', restore); };
  window.addEventListener('afterprint', restore);
  const imgs = [...sheet.querySelectorAll('img')];
  Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; })))
    .then(() => setTimeout(() => window.print(), 50));
}

function updateOrderStatus(ordId, newStatus) {
  const orders = loadAdminOrders();
  const updated = orders.map(o => o.id === ordId ? { ...o, status: newStatus } : o);
  saveOrders(updated);
  renderOrdersList();
  renderDashboard();
  try { renderFinance(); } catch (e) {}
}

// 주문 취소: 매출에서 빠지고, 줄었던 재고를 되돌림
function adjustStockForOrder(ord, direction) {
  const products = loadProducts();
  (ord.items || []).forEach(it => {
    const prod = products.find(p => it.product && p.id === it.product.id);
    if (prod && typeof prod.stockQuantity === 'number' && !prod.inquiryOnly) {
      prod.stockQuantity = Math.max(0, prod.stockQuantity + direction * (Number(it.quantity) || 1));
    }
  });
  saveProducts(products);
}

function cancelOrder(ordId) {
  const ord = loadAdminOrders().find(o => o.id === ordId);
  if (!ord) return;
  if (!confirm(`${ord.orderNumber} (${ord.customerName} 님) 주문을 취소할까요?\n매출에서 빠지고, 주문했던 수량만큼 재고가 다시 늘어나요.`)) return;
  adjustStockForOrder(ord, +1);
  saveOrders(loadAdminOrders().map(o => o.id === ordId ? { ...o, status: 'cancelled', statusBeforeCancel: o.status } : o));
  renderOrdersList();
  renderProductsTable();
  renderDashboard();
  try { renderFinance(); } catch (e) {}
}

function restoreOrder(ordId) {
  const ord = loadAdminOrders().find(o => o.id === ordId);
  if (!ord) return;
  if (!confirm(`${ord.orderNumber} 주문 취소를 되돌릴까요?\n다시 매출에 포함되고 재고가 줄어들어요.`)) return;
  adjustStockForOrder(ord, -1);
  saveOrders(loadAdminOrders().map(o => o.id === ordId ? { ...o, status: o.statusBeforeCancel || 'preparing' } : o));
  renderOrdersList();
  renderProductsTable();
  renderDashboard();
  try { renderFinance(); } catch (e) {}
}
