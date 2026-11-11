// assets/js/admin/admin-orders.js
// 설담화 관리자: 주문 목록·거르기·운송장 출력·주문 취소
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 3. 주문 및 배송 관리 (한 줄 목록 + 거르기 + 펼쳐 보기)
const COURIERS = ['직접 배송', '퀵서비스', 'CJ대한통운', '우체국택배', '한진택배', '롯데택배', '로젠택배'];
const ORDER_PAGE_SIZE = 30;
let orderStatusFilter = 'all';
let orderShowCount = ORDER_PAGE_SIZE;
let currentOrderViewMode = 'list'; // 'list' | 'timeline'
const expandedOrders = new Set();
const checkedOrders = new Set();
const orderMsgPanels = new Map(); // orderId -> 'shipping' | 'review' | 'pickup'

function setOrderViewMode(mode) {
  currentOrderViewMode = mode;
  const listBtn = document.getElementById('btn-view-list');
  const timeBtn = document.getElementById('btn-view-timeline');
  const tableCont = document.getElementById('admin-orders-table-container');
  const timeCont = document.getElementById('admin-orders-timeline-container');
  
  if (listBtn && timeBtn) {
    if (mode === 'list') {
      listBtn.className = 'px-3 py-1.5 rounded-xs bg-ink-black text-white transition-colors cursor-pointer';
      listBtn.setAttribute('aria-selected', 'true');
      timeBtn.className = 'px-3 py-1.5 rounded-xs text-ink-black hover:text-seal-red transition-colors cursor-pointer';
      timeBtn.setAttribute('aria-selected', 'false');
    } else {
      timeBtn.className = 'px-3 py-1.5 rounded-xs bg-ink-black text-white transition-colors cursor-pointer';
      timeBtn.setAttribute('aria-selected', 'true');
      listBtn.className = 'px-3 py-1.5 rounded-xs text-ink-black hover:text-seal-red transition-colors cursor-pointer';
      listBtn.setAttribute('aria-selected', 'false');
    }
  }

  if (tableCont && timeCont) {
    tableCont.classList.toggle('hidden', mode !== 'list');
    timeCont.classList.toggle('hidden', mode !== 'timeline');
  }

  renderOrdersList();
}

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

function clearOrderChecks() {
  checkedOrders.clear();
  document.querySelectorAll('.order-check').forEach(cb => { cb.checked = false; });
  const checkAll = document.getElementById('order-check-all');
  if (checkAll) checkAll.checked = false;
  updatePrintButton();
}

function updatePrintButton() {
  const btn = document.getElementById('print-labels-btn');
  const toolbar = document.getElementById('order-batch-toolbar');
  const selCount = document.getElementById('batch-selected-count');
  
  if (btn) btn.innerText = checkedOrders.size ? `선택한 ${checkedOrders.size}건 운송장 출력` : '선택한 주문 운송장 출력';
  
  if (toolbar) {
    toolbar.classList.toggle('hidden', checkedOrders.size === 0);
  }
  if (selCount) {
    selCount.innerText = `${checkedOrders.size}건 선택됨`;
  }
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
  if (currentOrderViewMode === 'timeline') {
    renderOrderTimelineBoard(all);
  }
  const tbody = document.getElementById('admin-orders-list');
  if (!tbody) return;
  const list = filteredOrders();
  const shown = list.slice(0, orderShowCount);
  const today = financeToday();
  const tomorrow = addDays(today, 1);
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
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
    const stats = getCustomerStats(o, all);
    const badge = o.personalInfoClearedAt ? '' : customerBadgeHtml(stats);
    const row = `
      <tr class="order-summary-row border-b border-ink-black/5 ${soon ? 'bg-amber-50/70' : ''} ${isCancelled ? 'opacity-55' : ''} hover:bg-[#F3EDE3]/50">
        <td class="order-col-check py-2 pl-3 pr-1" onclick="event.stopPropagation()"><input type="checkbox" class="order-check w-4 h-4 cursor-pointer" data-id="${o.id}" ${checkedOrders.has(o.id) ? 'checked' : ''} onchange="toggleOrderCheck('${o.id}', this.checked)" onclick="event.stopPropagation()" aria-label="${escapeHtml(o.orderNumber)} 선택"></td>
        <td class="order-col-date py-2 px-2 whitespace-nowrap cursor-pointer" onclick="toggleOrderExpand('${o.id}')">
          ${soon ? `<span class="px-1.5 py-0.5 mr-1 rounded text-[11px] font-bold bg-amber-200 text-amber-900">${soon}</span>` : ''}<span class="font-bold text-ink-black">${escapeHtml(d ? shortDate(d) + ' (' + weekdayLabel(d) + ')' : o.deliveryDate)}</span>
          <span class="block text-[11px] text-ink-gray">${escapeHtml(time)}</span>
        </td>
        <td class="order-col-no py-2 px-2 cursor-pointer" onclick="toggleOrderExpand('${o.id}')">
          <span class="font-mono text-xs ${isCancelled ? 'line-through' : ''}">${escapeHtml(o.orderNumber)}</span>
          <span class="block text-[11px] text-ink-gray">${escapeHtml(getOrderDate(o))} 접수</span>
          ${o.personalInfoClearedAt ? `<span class="inline-block mt-0.5 px-1 py-0.2 rounded text-[10px] font-bold bg-gray-200 text-gray-700">개인정보 정리됨</span>` : ''}
          ${o.reviewRequestedAt ? `<span class="inline-block mt-0.5 px-1 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="후기 요청: ${escapeHtml(o.reviewRequestedAt)}">후기 요청함</span>` : ''}
        </td>
        <td class="order-col-recipient py-2 px-2 font-bold text-ink-black cursor-pointer" onclick="toggleOrderExpand('${o.id}')">
          <div class="flex items-center flex-wrap gap-1">
            <span>${o.personalInfoClearedAt ? '<span class="text-ink-gray font-normal">개인정보 정리됨</span>' : escapeHtml(orderRecipient(o).name)}</span>
            ${badge}
            ${o.deliveryMethod === 'pickup' ? '<span class="text-[10px] font-bold px-1 rounded bg-blue-100 text-blue-800">픽업</span>' : ''}
          </div>
        </td>
        <td class="order-col-items py-2 px-2 text-ink-black cursor-pointer max-w-[220px] truncate" onclick="toggleOrderExpand('${o.id}')" title="${escapeHtml(items.map(i => i.product && i.product.name).join(', '))}">${escapeHtml(first)}${items.length > 1 ? ` <span class="text-ink-gray">외 ${items.length - 1}</span>` : ''}</td>
        <td class="order-col-amount py-2 px-2 text-right font-bold whitespace-nowrap cursor-pointer" onclick="toggleOrderExpand('${o.id}')">${isCancelled ? `<s>${formatWon(o.totalAmount)}</s>` : formatWon(o.totalAmount)}</td>
        <td class="order-col-status py-2 px-2">${statusSelect}</td>
        <td class="order-col-tracking py-2 px-2 text-xs whitespace-nowrap">${(() => {
          if (!o.trackingNumber) return o.courier ? escapeHtml(o.courier) : '<span class="text-ink-light">-</span>';
          const trkUrl = typeof getCourierTrackingUrl === 'function' ? getCourierTrackingUrl(o.courier, o.trackingNumber) : '';
          return `<span class="text-ink-black">${escapeHtml(o.courier || '')}</span>
            <span class="block font-mono text-ink-gray">${trkUrl ? `<a href="${trkUrl}" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-seal-red inline-flex items-center gap-0.5">${escapeHtml(o.trackingNumber)} <span class="text-[9px]">↗</span></a>` : escapeHtml(o.trackingNumber)}</span>`;
        })()}</td>
        <td class="order-col-toggle py-2 px-2 text-center"><button type="button" onclick="toggleOrderExpand('${o.id}')" class="text-ink-gray hover:text-seal-red cursor-pointer" aria-label="자세히" aria-expanded="${open}">${open ? '▴' : '▾'}</button></td>
      </tr>`;
    if (!open) return row;

    const ordererPhone = getOrdererPhone(o);
    const canSendShipping = !isCancelled && (o.status === 'delivering' || (o.deliveryMethod === 'parcel' && o.trackingNumber) || (o.courier && o.courier.includes('택배') && o.trackingNumber));
    const canSendReview = !isCancelled && o.status === 'completed';
    const canSendPickup = !isCancelled && o.deliveryMethod === 'pickup';
    const msgPanelType = orderMsgPanels.get(o.id);

    let msgPanelHtml = '';
    if (msgPanelType === 'shipping' || msgPanelType === 'review' || msgPanelType === 'pickup') {
      const isReview = msgPanelType === 'review';
      const isPickup = msgPanelType === 'pickup';
      const msgText = isReview ? buildReviewMessage(o, settings) : (isPickup ? buildPickupReadyMessage(o, settings) : buildShippingMessage(o, settings));
      const smsBodyEncoded = encodeURIComponent(msgText);
      const cleanPhone = ordererPhone.replace(/\D/g, '');
      const panelTitle = isReview ? '💬 후기 요청 안내 문구' : (isPickup ? '🏪 픽업 준비완료 안내 문구' : '🚚 배송 출발 안내 문구');
      msgPanelHtml = `
        <div id="order-msg-panel-${o.id}" class="mt-2 p-3 bg-white border border-ink-black/15 rounded-xs space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-ink-black">${panelTitle}</span>
            <span class="text-[11px] text-ink-gray">수신: ${escapeHtml(cleanPhone || '전화번호 없음')}</span>
          </div>
          <pre class="w-full text-xs p-2 bg-[#FAF7F2] border border-ink-black/10 rounded font-sans whitespace-pre-wrap leading-relaxed select-all">${escapeHtml(msgText)}</pre>
          <div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <button type="button" onclick="copyOrderMessage('${o.id}', '${msgPanelType}')" class="min-h-[40px] px-3 py-1.5 bg-ink-black text-white font-bold rounded-xs hover:bg-seal-red cursor-pointer inline-flex items-center justify-center">문구 복사</button>
            ${cleanPhone ? `<a href="sms:${escapeHtml(cleanPhone)}?body=${smsBodyEncoded}" onclick="if (${isReview}) markReviewRequested('${o.id}')" class="min-h-[40px] px-3 py-1.5 border border-ink-black/20 text-ink-black font-bold rounded-xs hover:border-ink-black bg-white inline-flex items-center justify-center">문자 앱 열기</a>` : '<span class="text-[11px] text-ink-light">주문자 번호 없음</span>'}
            <button type="button" onclick="toggleOrderMsgPanel('${o.id}', '')" class="min-h-[40px] px-2 ml-auto text-ink-gray hover:text-seal-red cursor-pointer inline-flex items-center">닫기</button>
          </div>
        </div>`;
    }

    return row + `
      <tr class="order-detail-row bg-[#FAF7F2] border-b border-ink-black/10">
        <td></td>
        <td colspan="8" class="py-3 px-2">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1">
              <div class="flex items-center justify-between pb-1">
                <span class="font-bold text-ink-gray">받는 분 & 주문자</span>
                ${badge}
              </div>
              ${stats.isRepeat ? `<p class="text-[11px] font-bold text-seal-red bg-[#FAF0E6] p-1.5 rounded-xs border border-seal-red/20">🌸 단골 손님입니다 (누적 ${stats.count}회차 주문 · 총 ${formatWon(stats.total)})</p>` : `<p class="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded-xs border border-emerald-200">🌱 첫 주문 손님입니다 (정성껏 맞이해 주세요)</p>`}
              ${o.personalInfoClearedAt ? `<p class="text-xs text-ink-gray font-bold p-2 bg-white rounded border border-ink-black/10">🔒 보관 기간(5년) 경과로 개인정보가 정리되었습니다. (${escapeHtml(o.personalInfoClearedAt.slice(0, 10))})</p>` : `
              <p class="text-sm font-bold text-ink-black">${escapeHtml(orderRecipient(o).name)} · <a href="tel:${escapeHtml(orderRecipient(o).phone)}" class="underline">${escapeHtml(orderRecipient(o).phone)}</a></p>
              <p class="text-ink-black">${o.zipcode ? `(${escapeHtml(o.zipcode)}) ` : ''}${escapeHtml(o.address)}</p>
              ${o.ordererName && (o.ordererName !== o.recipientName || o.ordererPhone !== o.recipientPhone) ? `<p class="pt-1 text-ink-gray">주문하신 분: <span class="text-ink-black font-bold">${escapeHtml(o.ordererName)}</span> · <a href="tel:${escapeHtml(o.ordererPhone)}" class="underline">${escapeHtml(o.ordererPhone)}</a></p>` : ''}
              `}
              ${o.deliveryMethodLabel ? `<p class="text-ink-gray">배송: <span class="text-ink-black font-bold">${escapeHtml(o.deliveryMethodLabel)}</span>${typeof o.deliveryFee === 'number' ? ` · 배송비 ${formatWon(o.deliveryFee)}` : ''}</p>` : ''}
              ${o.couponCode ? `<p class="text-ink-gray">쿠폰: <span class="text-seal-red font-bold">-${formatWon(o.couponDiscount || 0)}</span> <span class="font-mono">${escapeHtml(o.couponCode)}</span></p>` : ''}
              ${o.request ? `<p class="text-ink-gray">요청: <span class="text-ink-black">${escapeHtml(o.request)}</span></p>` : ''}
              ${o.hideSender ? '<p class="font-bold text-amber-800">🤫 익명 선물 (카드에 보내는 분 이름 생략)</p>' : ''}
              ${o.message ? `<p class="mt-2 text-seal-red font-serif italic bg-[#F3EDE3] p-2 rounded-xs border-l-2 border-seal-red">✉️ "${escapeHtml(o.message)}"</p>` : '<p class="text-ink-light mt-2">카드 메시지 없음</p>'}
            </div>
            <div class="space-y-1">
              <p class="font-bold text-ink-gray">주문 상품</p>
              ${items.map(i => `<p class="text-ink-black">• ${escapeHtml(i.product && i.product.name)}${i.sizeLabel ? ` (${escapeHtml(i.sizeLabel)})` : ''} × ${Number(i.quantity) || 1}<span class="block pl-3 text-ink-gray">${escapeHtml(i.optionName || (i.optionPrice === 0 ? '기본 단아 한지 포장' : '전통 실크 본견 보자기 & 노리개 포장'))}</span></p>`).join('')}
              <p class="pt-1 text-ink-gray">접수 ${escapeHtml(getOrderDate(o))} ${escapeHtml(o.createdAt || '')}</p>
            </div>
            <div class="space-y-2">
              <p class="font-bold text-ink-gray">운송장 및 안내</p>
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
              <!-- 알림 메시지 발송 버튼 -->
              <div class="pt-2 border-t border-ink-black/10 space-y-1.5">
                <div class="flex flex-wrap items-center gap-1.5">
                  ${canSendPickup ? `<button type="button" onclick="toggleOrderMsgPanel('${o.id}', 'pickup')" class="px-2.5 py-1 rounded-xs text-xs font-bold border border-blue-300 text-blue-900 bg-blue-50/80 hover:bg-blue-600 hover:text-white cursor-pointer ${msgPanelType === 'pickup' ? 'bg-blue-600 text-white' : ''}">🏪 픽업 준비완료 안내</button>` : ''}
                  ${canSendShipping ? `<button type="button" onclick="toggleOrderMsgPanel('${o.id}', 'shipping')" class="px-2.5 py-1 rounded-xs text-xs font-bold border border-ink-black/25 bg-white hover:bg-ink-black hover:text-white cursor-pointer ${msgPanelType === 'shipping' ? 'bg-ink-black text-white' : ''}">🚚 배송 출발 안내</button>` : ''}
                  ${canSendReview ? `<button type="button" onclick="toggleOrderMsgPanel('${o.id}', 'review')" class="px-2.5 py-1 rounded-xs text-xs font-bold border border-seal-red/30 text-seal-red bg-white hover:bg-seal-red hover:text-white cursor-pointer ${msgPanelType === 'review' ? 'bg-seal-red text-white' : ''}">💬 후기 요청</button>` : ''}
                  ${o.reviewRequestedAt ? `<span class="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">후기 요청 보냄 (${escapeHtml(o.reviewRequestedAt)})</span>` : ''}
                </div>
                ${msgPanelHtml}
              </div>
              <!-- 사장님 비공개 주문 메모 -->
              <div class="pt-2 border-t border-ink-black/10">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-ink-gray text-[11px]">📝 사장님 비공개 메모</span>
                  ${o.adminMemoUpdatedAt ? `<span class="text-[10px] text-ink-light">저장 ${escapeHtml(o.adminMemoUpdatedAt.slice(5, 16))}</span>` : ''}
                </div>
                <div class="flex gap-1.5">
                  <input type="text" id="admin-memo-${o.id}" value="${escapeHtml(o.adminMemo || '')}" placeholder="예: 단골 사은품 노리개 동봉, 14시 정각 배송 요청 등" class="flex-1 min-w-0 bg-white border border-amber-300/80 p-1.5 rounded-xs text-xs">
                  <button type="button" onclick="saveOrderAdminMemo('${o.id}')" class="px-2.5 py-1.5 bg-[#FAF0E6] text-seal-red border border-seal-red/30 rounded-xs font-bold hover:bg-seal-red hover:text-white cursor-pointer transition-colors whitespace-nowrap">메모 저장</button>
                </div>
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
    const items = (o.items || []).map(i => {
      const pkg = i.optionName || (i.optionPrice === 0 ? '기본 단아 한지 포장' : '전통 실크 본견 보자기 & 노리개 포장');
      return `${escapeHtml(i.product && i.product.name)}${i.sizeLabel ? `(${escapeHtml(i.sizeLabel)})` : ''} [${escapeHtml(pkg)}] ×${Number(i.quantity) || 1}`;
    }).join(', ');
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

/* ---------- 새 주문·상담 알림 (관리자 화면을 켜 둔 동안) ----------
 * 쇼핑몰 탭이나 다른 기기(서버 모드)에서 새 주문·상담이 들어오면 소리 + 화면 알림 + 탭 제목에 숫자 */
const adminSeen = { orders: null, inquiries: null, reviews: null };
let adminUnread = 0;
let adminAudio = null;
const ADMIN_BASE_TITLE = document.title;

function adminSoundOn() {
  return DataStore.readRaw(DataStore.KEYS.adminSound) !== 'off';
}

function playAdminChime() {
  if (!adminSoundOn()) return;
  try {
    adminAudio = adminAudio || new (window.AudioContext || window.webkitAudioContext)();
    [880, 1318.5].forEach((freq, i) => {
      const osc = adminAudio.createOscillator();
      const gain = adminAudio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = adminAudio.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      osc.connect(gain).connect(adminAudio.destination);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    });
  } catch (e) { /* 소리를 못 내는 브라우저 */ }
}

function adminIds(key) {
  try { return new Set((DataStore.read(key, [])).filter(x => !x.isSample).map(x => x.id)); } catch (e) { return new Set(); }
}

function showAdminNotice(text, tab) {
  let box = document.getElementById('admin-notice-stack');
  if (!box) {
    box = document.createElement('div');
    box.id = 'admin-notice-stack';
    box.setAttribute('role', 'status');
    box.className = 'fixed right-4 bottom-4 z-[70] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]';
    document.body.appendChild(box);
  }
  const card = document.createElement('div');
  card.className = 'bg-ink-black text-white rounded-sm shadow-2xl px-4 py-3 flex items-center gap-3 text-sm';
  const p = document.createElement('p');
  p.className = 'flex-1 font-bold leading-snug';
  p.textContent = text;
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'px-3 py-1.5 bg-seal-red rounded-xs text-xs font-bold cursor-pointer whitespace-nowrap';
  go.textContent = '보기';
  go.onclick = () => { switchAdminTab(tab); card.remove(); clearAdminUnread(); };
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'text-lg leading-none text-white/70 hover:text-white cursor-pointer';
  x.textContent = '×';
  x.setAttribute('aria-label', '알림 닫기');
  x.onclick = () => card.remove();
  card.append(p, go, x);
  box.appendChild(card);
  setTimeout(() => card.remove(), 60000);
}

function clearAdminUnread() {
  adminUnread = 0;
  document.title = ADMIN_BASE_TITLE;
}

function checkNewOrdersAndInquiries() {
  const now = {
    orders: adminIds('seoldamhwa_orders'),
    inquiries: adminIds('seoldamhwa_inquiries'),
    reviews: adminIds('seoldamhwa_reviews')
  };
  if (adminSeen.orders === null) {
    adminSeen.orders = now.orders;
    adminSeen.inquiries = now.inquiries;
    adminSeen.reviews = now.reviews;
    return;
  }
  const newOrders = [...now.orders].filter(id => !adminSeen.orders.has(id));
  const newInq = [...now.inquiries].filter(id => !adminSeen.inquiries.has(id));
  const newRevs = [...now.reviews].filter(id => !adminSeen.reviews.has(id));
  adminSeen.orders = now.orders;
  adminSeen.inquiries = now.inquiries;
  adminSeen.reviews = now.reviews;
  if (!newOrders.length && !newInq.length && !newRevs.length) return;
  const orders = typeof loadOrders === 'function' ? loadOrders() : DataStore.read(DataStore.KEYS.orders, []);
  newOrders.forEach(id => {
    const o = orders.find(x => x.id === id) || {};
    showAdminNotice(`🌸 새 주문 ${o.orderNumber || ''} · ${o.deliveryDate || ''} · ${formatWon(o.totalAmount || 0)}`, 'orders');
  });
  if (newInq.length) showAdminNotice(`💬 새 상담 문의 ${newInq.length}건`, 'reviews');
  if (newRevs.length) showAdminNotice(`🌸 새 손님 후기 ${newRevs.length}건`, 'reviews-admin');
  adminUnread += newOrders.length + newInq.length + newRevs.length;
  document.title = `(${adminUnread}) 새 소식 · ${ADMIN_BASE_TITLE}`;
  playAdminChime();
  ['renderDashboard', 'renderOrdersList', 'renderInquiriesList', 'renderReviewsAdmin'].forEach(fn => { try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { /* 그 화면이 없으면 건너뜀 */ } });
}

function toggleAdminSound() {
  DataStore.writeRaw(DataStore.KEYS.adminSound, adminSoundOn() ? 'off' : 'on');
  renderAdminSoundButton();
  if (adminSoundOn()) playAdminChime();
}

function renderAdminSoundButton() {
  const b = document.getElementById('admin-sound-btn');
  if (!b) return;
  const on = adminSoundOn();
  b.textContent = on ? '🔔 새 주문 소리 켜짐' : '🔕 새 주문 소리 꺼짐';
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
}

document.addEventListener('DOMContentLoaded', () => {
  checkNewOrdersAndInquiries();
  setInterval(checkNewOrdersAndInquiries, 5000);
  window.addEventListener('storage', e => { if (e.key === 'seoldamhwa_orders' || e.key === 'seoldamhwa_inquiries' || e.key === 'seoldamhwa_reviews') checkNewOrdersAndInquiries(); });
  window.addEventListener('focus', () => { if (adminUnread) setTimeout(clearAdminUnread, 1500); });
  // 브라우저는 한 번 누른 뒤에야 소리를 낼 수 있어서, 처음 클릭 때 소리 장치를 준비
  document.addEventListener('click', () => { try { adminAudio = adminAudio || new (window.AudioContext || window.webkitAudioContext)(); adminAudio.resume(); } catch (e) { /* 무시 */ } }, { once: true });
  renderAdminSoundButton();
});

// ---- 단골 손님 집계 및 뱃지 ----
function getCustomerStats(order, allOrders) {
  const phone = getOrdererPhone(order);
  if (!phone || phone.length < 9) return { count: 1, total: Number(order.totalAmount) || 0, isRepeat: false };

  // 취소되지 않은 주문 중 연락처가 일치하는 주문 집계
  const matched = (allOrders || []).filter(o => {
    if (o.status === 'cancelled') return false;
    const p = getOrdererPhone(o);
    return p && p === phone;
  });

  const count = matched.length || 1;
  const total = matched.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0) || (Number(order.totalAmount) || 0);
  return {
    count,
    total,
    isRepeat: count >= 2
  };
}

function customerBadgeHtml(stats) {
  if (stats.isRepeat) {
    return `<span class="inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FAF0E6] text-seal-red border border-seal-red/30 whitespace-nowrap" title="누적 ${stats.count}회차 주문 · 총 ${formatWon(stats.total)}">🌸 단골 · ${stats.count}회차</span>`;
  }
  return `<span class="inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap" title="설담화 첫 주문 고객님입니다">🌱 첫 주문</span>`;
}

// ---- 주문 안내 메시지 (배송 출발 및 후기 요청) ----
function getOrdererPhone(o) {
  const p = o.ordererPhone || o.phone || (typeof orderRecipient === 'function' && orderRecipient(o) && orderRecipient(o).phone) || '';
  return String(p).replace(/\D/g, '');
}

function toggleOrderMsgPanel(ordId, type) {
  if (orderMsgPanels.get(ordId) === type) {
    orderMsgPanels.delete(ordId);
  } else {
    orderMsgPanels.set(ordId, type);
  }
  renderOrdersList();
}

function buildReviewMessage(o, settings) {
  const shopUrl = (settings.shopUrl || '').trim().replace(/\/+$/, '');
  const linkText = shopUrl ? `${shopUrl}/#/review/${o.orderNumber}` : '쇼핑몰 주문 조회에서 쓸 수 있어요';
  return `[설담화] ${o.ordererName || '고객'}님, 설담화를 찾아주셔서 진심으로 감사드립니다.\n소중한 순간을 함께할 수 있어 기뻤습니다. 받아보신 꽃은 어떠셨나요?\n\n• 주문번호: ${o.orderNumber}\n• 후기 작성: ${linkText}\n\n정성 어린 후기를 남겨주시면 다음 꽃을 준비하는 데 큰 힘이 됩니다. 감사합니다.`;
}

function buildShippingMessage(o, settings) {
  const d = typeof getDeliveryDate === 'function' ? getDeliveryDate(o) : '';
  const dateStr = d ? `${typeof shortDate === 'function' ? shortDate(d) : d} (${typeof weekdayLabel === 'function' ? weekdayLabel(d) : ''})` : (o.deliveryDate || '');
  const courierInfo = o.courier && o.trackingNumber ? `\n• 택배사: ${o.courier}\n• 운송장번호: ${o.trackingNumber}` : (o.courier ? `\n• 배송방법: ${o.courier}` : '');
  return `[설담화] ${o.ordererName || '고객'}님의 소중한 꽃이 정성껏 포장되어 배송을 시작했습니다.\n\n• 주문번호: ${o.orderNumber}${courierInfo}\n• 배송 예정일: ${dateStr}\n\n신선하고 안전하게 전달해 드리겠습니다. 감사합니다.`;
}

function buildPickupReadyMessage(o, settings) {
  const s = settings || (typeof loadSettings === 'function' ? loadSettings() : {});
  const b = s.business || {};
  const storeName = b.companyName || '설담화';
  const storeAddr = [s.address, s.addressDetail].filter(Boolean).join(' ') || '매장';
  const storePhone = s.phone || '';
  const hours = s.hours || '평일 10:00~18:00';
  return `[${storeName}] ${o.ordererName || o.customerName || '고객'}님, 주문하신 꽃이 정성스럽게 완성되어 매장에 준비되었습니다.\n\n• 주문번호: ${o.orderNumber}\n• 픽업 매장: ${storeName} (${storeAddr})\n• 운영시간: ${hours}\n• 문의전화: ${storePhone}\n\n방문 시 주문자 성함을 말씀해 주시면 바로 전달해 드리겠습니다. 조심히 오세요. 감사합니다.`;
}

function markReviewRequested(ordId) {
  const all = typeof loadAdminOrders === 'function' ? loadAdminOrders() : [];
  const o = all.find(x => x.id === ordId);
  if (!o) return;
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
  const pad = n => String(n).padStart(2, '0');
  const nowStr = `${kst.getFullYear()}-${pad(kst.getMonth() + 1)}-${pad(kst.getDate())} ${pad(kst.getHours())}:${pad(kst.getMinutes())}`;
  o.reviewRequestedAt = nowStr;
  DataStore.write(DataStore.KEYS.orders, all);
  if (typeof DataSync !== 'undefined' && DataSync.enabled && !DataSync.local) {
    if (typeof DataSync.push === 'function') DataSync.push();
  }
  renderOrdersList();
}

function copyOrderMessage(ordId, type) {
  const all = typeof loadAdminOrders === 'function' ? loadAdminOrders() : [];
  const o = all.find(x => x.id === ordId);
  if (!o) return;
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  let text = '';
  if (type === 'review') {
    text = buildReviewMessage(o, settings);
  } else if (type === 'pickup') {
    text = buildPickupReadyMessage(o, settings);
  } else {
    text = buildShippingMessage(o, settings);
  }
  const onDone = () => {
    alert('메시지 문구가 복사되었습니다.');
    if (type === 'review' && ordId) markReviewRequested(ordId);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onDone).catch(() => fallbackCopyMessage(text, onDone));
  } else {
    fallbackCopyMessage(text, onDone);
  }
}

function fallbackCopyMessage(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch (e) {
    alert('복사하지 못했습니다. 문구를 직접 선택해 복사해 주세요.');
  } finally {
    if (ta.parentNode) ta.parentNode.removeChild(ta);
  }
}

// ---- 사장님 비공개 메모 저장 ----
function saveOrderAdminMemo(ordId) {
  const input = document.getElementById(`admin-memo-${ordId}`);
  if (!input) return;
  const memo = input.value.trim();
  const all = loadAdminOrders();
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
  const pad = n => String(n).padStart(2, '0');
  const nowStr = `${kst.getFullYear()}-${pad(kst.getMonth() + 1)}-${pad(kst.getDate())} ${pad(kst.getHours())}:${pad(kst.getMinutes())}`;
  
  const updated = all.map(o => o.id === ordId ? { ...o, adminMemo: memo, adminMemoUpdatedAt: nowStr } : o);
  saveOrders(updated);
  alert('사장님 메모가 저장되었습니다.');
  renderOrdersList();
}

// ---- 선택 주문 일괄 변경 (배송 출발 / 배송 완료) ----
function batchUpdateOrderStatus(newStatus) {
  const ids = [...checkedOrders];
  if (ids.length === 0) {
    alert('상태를 일괄 변경할 주문을 먼저 선택해 주세요.');
    return;
  }
  const label = ORDER_STATUS_LABELS[newStatus] || newStatus;
  if (!confirm(`선택한 ${ids.length}건의 주문 상태를 모두 '${label}'(으)로 변경할까요?`)) return;

  const all = loadAdminOrders();
  const updated = all.map(o => ids.includes(o.id) && o.status !== 'cancelled' ? { ...o, status: newStatus } : o);
  saveOrders(updated);
  clearOrderChecks();
  renderOrdersList();
  renderDashboard();
  try { renderFinance(); } catch (e) {}
  alert(`${ids.length}건의 주문 상태가 '${label}'(으)로 일괄 변경되었습니다.`);
}

// ---- 선택 주문 송장 번호 일괄 입력 모달 제어 ----
function openBatchTrackingModal() {
  const ids = [...checkedOrders];
  if (ids.length === 0) {
    alert('송장을 입력할 주문을 먼저 체크해 주세요.');
    return;
  }
  const all = loadAdminOrders();
  const selected = all.filter(o => ids.includes(o.id) && o.status !== 'cancelled');
  if (selected.length === 0) {
    alert('선택된 주문 중 진행 가능한 주문이 없어요.');
    return;
  }

  const tbody = document.getElementById('batch-tracking-list');
  if (tbody) {
    tbody.innerHTML = selected.map(o => {
      const items = (o.items || []).map(i => `${i.product && i.product.name} ×${i.quantity || 1}`).join(', ');
      return `
        <tr data-order-id="${escapeHtml(o.id)}" class="hover:bg-amber-50/50">
          <td class="py-2.5 px-2.5">
            <span class="font-bold text-ink-black">${escapeHtml(orderRecipient(o).name)}</span>
            <span class="block font-mono text-[11px] text-ink-gray">${escapeHtml(o.orderNumber)}</span>
          </td>
          <td class="py-2 px-2 max-w-[180px] truncate text-ink-black" title="${escapeHtml(items)}">${escapeHtml(items)}</td>
          <td class="py-2 px-2">
            <select class="batch-row-courier w-full bg-white border border-ink-black/20 p-1.5 rounded-xs text-xs">
              ${COURIERS.map(c => `<option ${o.courier === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </td>
          <td class="py-2 px-2">
            <input type="text" class="batch-row-tracking w-full bg-white border border-ink-black/20 p-1.5 rounded-xs font-mono text-xs" value="${escapeHtml(o.trackingNumber || '')}" placeholder="운송장 번호">
          </td>
        </tr>
      `;
    }).join('');
  }

  const modal = document.getElementById('batch-tracking-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeBatchTrackingModal() {
  const modal = document.getElementById('batch-tracking-modal');
  if (modal) modal.classList.add('hidden');
}

function applyBatchCourier() {
  const selCourier = document.getElementById('batch-courier-select').value;
  document.querySelectorAll('.batch-row-courier').forEach(sel => {
    sel.value = selCourier;
  });
}

function saveBatchTracking() {
  const rows = document.querySelectorAll('#batch-tracking-list tr');
  if (!rows.length) return;

  const markDelivering = document.getElementById('batch-mark-delivering').checked;
  const updates = new Map();

  for (const row of rows) {
    const id = row.dataset.orderId;
    const courier = (row.querySelector('.batch-row-courier') || {}).value;
    const tracking = ((row.querySelector('.batch-row-tracking') || {}).value || '').trim().replace(/\s+/g, '');
    if (tracking && !/^[0-9A-Za-z-]{6,30}$/.test(tracking)) {
      alert(`운송장 번호('${tracking}')는 6~30자의 숫자·영문이어야 합니다.`);
      return;
    }
    updates.set(id, { courier, tracking });
  }

  const all = loadAdminOrders();
  const updated = all.map(o => {
    if (!updates.has(o.id)) return o;
    const u = updates.get(o.id);
    const newStatus = (markDelivering && u.tracking && o.status === 'preparing' || o.status === 'packaged') ? 'delivering' : o.status;
    return {
      ...o,
      courier: u.courier,
      trackingNumber: u.tracking,
      status: newStatus
    };
  });

  saveOrders(updated);
  closeBatchTrackingModal();
  clearOrderChecks();
  renderOrdersList();
  renderDashboard();
  try { renderFinance(); } catch (e) {}
  alert(`${updates.size}건의 운송장 정보가 일괄 저장되었습니다.`);
}

// ---- 오늘의 제작·출고 시간표 보드 렌더링 ----
function renderOrderTimelineBoard(allOrders) {
  const grid = document.getElementById('admin-orders-timeline-grid');
  const summaryCounts = document.getElementById('timeline-summary-counts');
  const titleEl = document.getElementById('timeline-today-title');
  if (!grid) return;

  const today = financeToday();
  if (titleEl) {
    const dateFormatted = `${Number(today.slice(5, 7))}월 ${Number(today.slice(8, 10))}일 (${weekdayLabel(today)})`;
    titleEl.textContent = `오늘의 꽃 작업 시간표 · ${dateFormatted}`;
  }

  // 오늘 배송 또는 오늘 픽업 예정인 유효 주문 필터링
  const todayOrders = (allOrders || []).filter(o => {
    if (o.status === 'cancelled') return false;
    const d = getDeliveryDate(o);
    return d === today;
  });

  const packagedCount = todayOrders.filter(o => o.status === 'packaged' || o.status === 'delivering' || o.status === 'completed').length;
  if (summaryCounts) {
    summaryCounts.innerHTML = `
      <span class="px-2 py-1 rounded bg-[#FAF7F2] border border-ink-black/15 text-ink-black">전체 ${todayOrders.length}건</span>
      <span class="px-2 py-1 rounded bg-emerald-100 text-emerald-800">제작 완료 ${packagedCount}건</span>
      <span class="px-2 py-1 rounded bg-amber-100 text-amber-900">남은 제작 ${todayOrders.length - packagedCount}건</span>
    `;
  }

  if (todayOrders.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center admin-card p-8 rounded-sm bg-white">
        <p class="text-3xl mb-2">🌸</p>
        <p class="font-extrabold text-ink-black text-base">오늘 예정된 제작·출고 주문이 없습니다.</p>
        <p class="text-xs text-ink-gray mt-1">새 주문이 들어오거나 배송일이 오늘인 주문이 발생하면 시간표에 바로 나타납니다.</p>
      </div>
    `;
    return;
  }

  // 시간대 그룹 정의
  const groups = [
    { key: 'morning', label: '오전 (10:00 ~ 13:00)', icon: '🌅', filter: o => matchesTimeSlot(o, 'morning') },
    { key: 'afternoon', label: '오후 (14:00 ~ 18:00)', icon: '☀️', filter: o => matchesTimeSlot(o, 'afternoon') },
    { key: 'evening', label: '저녁 (18:00 ~ 21:00)', icon: '🌙', filter: o => matchesTimeSlot(o, 'evening') },
    { key: 'parcel', label: '택배 출고 & 시간 미지정', icon: '📦', filter: o => matchesTimeSlot(o, 'parcel') }
  ];

  grid.innerHTML = groups.map(g => {
    const ordersInGroup = todayOrders.filter(g.filter);
    const cardsHtml = ordersInGroup.length === 0
      ? `<div class="p-6 text-center text-xs text-ink-light border border-dashed border-ink-black/15 rounded-xs bg-[#FAF7F2]/50">예정된 주문 없음</div>`
      : ordersInGroup.map(o => {
          const stats = getCustomerStats(o, allOrders);
          const isDone = (o.status === 'packaged' || o.status === 'delivering' || o.status === 'completed');
          const isPickup = (o.deliveryMethod === 'pickup');
          const items = o.items || [];
          return `
            <div class="p-3.5 rounded-sm border transition-all ${isDone ? 'bg-white/80 border-emerald-300 opacity-80' : 'bg-white border-amber-300/80 shadow-xs hover:border-seal-red'} space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-extrabold text-sm text-ink-black">${escapeHtml(orderRecipient(o).name)}</span>
                    ${customerBadgeHtml(stats)}
                    ${isPickup ? '<span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">픽업</span>' : '<span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">퀵·배송</span>'}
                  </div>
                  <span class="font-mono text-[11px] text-ink-gray">${escapeHtml(o.orderNumber)} · <a href="tel:${escapeHtml(orderRecipient(o).phone)}" class="underline">${escapeHtml(orderRecipient(o).phone)}</a></span>
                </div>
                <!-- 원클릭 제작 완료 토글 버튼 -->
                <button type="button" onclick="toggleOrderStatusTimeline('${o.id}', '${isDone ? 'preparing' : 'packaged'}')" class="px-2.5 py-1 rounded-xs font-bold text-xs cursor-pointer transition-colors ${isDone ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-seal-red text-white hover:opacity-90'}">
                  ${isDone ? '✅ 포장 완료' : '🌸 제작 완료'}
                </button>
              </div>

              <!-- 상품 및 포장 옵션 -->
              <div class="p-2 bg-[#FAF7F2] rounded-xs border border-ink-black/5 text-xs space-y-1">
                ${items.map(it => {
                  const isSilk = it.optionPrice > 0 || (it.optionName && it.optionName.includes('보자기'));
                  return `
                    <div class="leading-tight">
                      <span class="font-bold text-ink-black">• ${escapeHtml(it.product && it.product.name)}${it.sizeLabel ? ` (${escapeHtml(it.sizeLabel)})` : ''}</span>
                      <span class="text-ink-gray">×${Number(it.quantity) || 1}</span>
                      <div class="pl-2 mt-0.5">
                        ${isSilk ? '<span class="inline-block px-1 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">🎀 실크 보자기 & 노리개 포장</span>' : '<span class="text-[11px] text-ink-gray">기본 단아 한지 포장</span>'}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- 카드 메시지 동봉 내용 미리보기 -->
              ${o.message ? `
                <div class="p-2 bg-amber-50/60 border-l-2 border-seal-red rounded-xs text-[11px] font-serif text-seal-red italic leading-relaxed">
                  ✉️ "${escapeHtml(o.message)}"
                </div>
              ` : ''}

              <!-- 사장님 비공개 메모 -->
              ${o.adminMemo ? `
                <div class="p-1.5 bg-amber-100/60 rounded-xs text-[11px] font-bold text-amber-900">
                  📝 ${escapeHtml(o.adminMemo)}
                </div>
              ` : ''}

              <!-- 주소 및 요청사항 -->
              ${o.address && !isPickup ? `<p class="text-[11px] text-ink-gray truncate">📍 ${escapeHtml(o.address)}</p>` : ''}
              ${o.request ? `<p class="text-[11px] text-ink-black font-semibold">요청: ${escapeHtml(o.request)}</p>` : ''}
            </div>
          `;
        }).join('');

    return `
      <div class="admin-card rounded-sm flex flex-col h-full bg-[#FAF7F2]/60 border border-ink-black/10">
        <div class="px-3.5 py-3 border-b border-ink-black/10 flex items-center justify-between bg-white">
          <div class="flex items-center gap-1.5 font-bold text-xs text-ink-black">
            <span>${g.icon}</span>
            <span>${g.label}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F2] text-ink-black border border-ink-black/15">${ordersInGroup.length}</span>
        </div>
        <div class="p-3 space-y-3 flex-1 overflow-y-auto">
          ${cardsHtml}
        </div>
      </div>
    `;
  }).join('');
}

// 시간대 매칭 헬퍼
function matchesTimeSlot(o, slotKey) {
  const raw = String(o.deliveryDate || '').toLowerCase();
  const isParcel = (o.deliveryMethod === 'parcel' || (o.courier && o.courier.includes('택배')));
  
  if (slotKey === 'parcel') {
    if (isParcel) return true;
    // 배송 시간이 특정되지 않은 경우
    return !raw.includes('오전') && !raw.includes('오후') && !raw.includes('저녁') && !/\d{1,2}:\d{2}/.test(raw);
  }

  if (isParcel) return false;

  if (slotKey === 'morning') {
    if (raw.includes('오전') || raw.includes('10:') || raw.includes('11:') || raw.includes('12:')) return true;
    return false;
  }
  if (slotKey === 'afternoon') {
    if (raw.includes('오후') || raw.includes('14:') || raw.includes('15:') || raw.includes('16:') || raw.includes('17:')) return true;
    return false;
  }
  if (slotKey === 'evening') {
    if (raw.includes('저녁') || raw.includes('18:') || raw.includes('19:') || raw.includes('20:')) return true;
    return false;
  }
  return false;
}

function toggleOrderStatusTimeline(ordId, nextStatus) {
  updateOrderStatus(ordId, nextStatus);
}
