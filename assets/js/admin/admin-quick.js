// assets/js/admin/admin-quick.js
// 설담화 관리자 센터: 편의성 혁신 모듈
// - 스마트 전역 검색 (Ctrl + K)
// - 상단 매장 현황 요약 미니 밴드
// - 모바일 하단 퀵 내비바 연동
// - 이달의 추천 꽃 비주얼 갤러리 선택기
// - 대시보드 당일 작업 원스톱 퀵패널
// - 매장 휴무일 캘린더 원클릭 지정
// - 초보 사장님 상세 사용 설명서 모달

// ==========================================
// 1. 스마트 전역 통합 검색 (Ctrl + K / Cmd + K)
// ==========================================
let searchResults = [];
let selectedSearchIndex = -1;

function openCommandPalette() {
  const modal = document.getElementById('admin-search-modal');
  const input = document.getElementById('admin-search-input');
  if (!modal || !input) return;
  modal.classList.remove('hidden');
  input.value = '';
  selectedSearchIndex = -1;
  renderSearchResults('');
  setTimeout(() => input.focus(), 50);
}

function closeCommandPalette() {
  const modal = document.getElementById('admin-search-modal');
  if (modal) modal.classList.add('hidden');
}

function handleSearchKeydown(e) {
  if (e.key === 'Escape') {
    closeCommandPalette();
    return;
  }
  const items = document.querySelectorAll('.search-result-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSearchIndex = (selectedSearchIndex + 1) % items.length;
    updateSearchSelection(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSearchIndex = (selectedSearchIndex - 1 + items.length) % items.length;
    updateSearchSelection(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedSearchIndex >= 0 && selectedSearchIndex < items.length) {
      items[selectedSearchIndex].click();
    } else if (items.length > 0) {
      items[0].click();
    }
  }
}

function updateSearchSelection(items) {
  items.forEach((item, idx) => {
    const isSel = idx === selectedSearchIndex;
    item.classList.toggle('bg-amber-100/70', isSel);
    item.classList.toggle('border-seal-red', isSel);
    if (isSel) item.scrollIntoView({ block: 'nearest' });
  });
}

function renderSearchResults(query) {
  const container = document.getElementById('admin-search-results');
  if (!container) return;
  const q = (query || '').trim().toLowerCase().replace(/-/g, '');

  const orders = typeof loadAdminOrders === 'function' ? loadAdminOrders() : [];
  const products = typeof loadAdminProducts === 'function' ? loadAdminProducts() : [];

  // 기본 바로가기 메뉴 목록
  const menuShortcuts = [
    { type: 'menu', icon: '🏠', title: '대시보드 운영 현황', desc: '오늘 할 일, 배송 달력, 매출 요약', action: () => switchAdminTab('dashboard') },
    { type: 'menu', icon: '⏰', title: '오늘의 꽃 작업 시간표', desc: '오늘 배송·픽업 주문 시간대별 보드 및 제작 완료 체크', action: () => { switchAdminTab('orders'); if (typeof setOrderViewMode === 'function') setOrderViewMode('timeline'); } },
    { type: 'menu', icon: '📋', title: '전체 주문 및 배송 관리', desc: '주문 목록, 운송장 출력, 주문 검색 및 일괄 처리', action: () => { switchAdminTab('orders'); if (typeof setOrderViewMode === 'function') setOrderViewMode('list'); } },
    { type: 'menu', icon: '🌸', title: '상품 및 한 줄 글귀 관리', desc: '꽃 상품 등록, 수정, 재고 및 이달의 추천 꽃', action: () => switchAdminTab('products') },
    { type: 'menu', icon: '🌿', title: '꽃 사전', desc: '꽃말, 제철 달, 상품 사용 꽃 관리', action: () => switchAdminTab('flowers') },
    { type: 'menu', icon: '💰', title: '매출·지출 관리', desc: '월별 요약, 지출 내역, PDF 및 엑셀 리포트', action: () => switchAdminTab('finance') },
    { type: 'menu', icon: '💬', title: '고객 상담 문의 & 재입고 알림', desc: '1:1 말풍선 상담 확인 및 답변, 재입고 알림 손님 관리', action: () => switchAdminTab('reviews') },
    { type: 'menu', icon: '💌', title: '꽃 편지함 (손님 후기 관리)', desc: '배송 후기 승인, 숨김, 사장님 답글 작성', action: () => switchAdminTab('reviews-admin') },
    { type: 'menu', icon: '⚙️', title: '매장 정보 설정 (운영시간·휴무일)', desc: '영업시간, 정기휴무, 임시 휴무 캘린더, 배송비, 포장', action: () => switchAdminTab('settings') },
    { type: 'menu', icon: '🎫', title: '오프라인 쿠폰 관리', desc: '쿠폰 코드 발행 및 할인 설정', action: () => switchAdminTab('coupons') },
    { type: 'menu', icon: '📖', title: '초보 사장님 사용 설명서', desc: '매장 운영 루틴 및 탭별 사용법 가이드', action: () => openAdminManualModal() }
  ];

  if (!q) {
    // 검색어가 없을 때는 자주 쓰는 메뉴 바로가기 추천
    container.innerHTML = `
      <div class="p-3 text-xs text-ink-gray font-bold border-b border-ink-black/5 bg-[#FAF7F2]">⚡ 추천 바로가기 메뉴</div>
      <div class="divide-y divide-ink-black/5">
        ${menuShortcuts.slice(0, 6).map((m, i) => `
          <div onclick="executeSearchAction(${i}, 'menu')" class="search-result-item p-3 flex items-center justify-between hover:bg-amber-50 cursor-pointer transition-colors text-xs">
            <div class="flex items-center gap-2.5">
              <span class="text-base">${m.icon}</span>
              <div>
                <p class="font-bold text-ink-black text-sm">${m.title}</p>
                <p class="text-[11px] text-ink-gray">${m.desc}</p>
              </div>
            </div>
            <span class="text-[10px] text-ink-light px-1.5 py-0.5 rounded bg-black/5 font-mono">바로가기</span>
          </div>
        `).join('')}
      </div>
    `;
    window.__currentSearchResults = menuShortcuts.slice(0, 6);
    return;
  }

  // 검색어 필터링
  const matchedMenus = menuShortcuts.filter(m => m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));

  const matchedOrders = orders.filter(o => {
    const hay = [o.orderNumber, o.customerName, o.phone, o.recipientName, o.recipientPhone, o.adminMemo].join(' ').toLowerCase().replace(/-/g, '');
    return hay.includes(q);
  }).slice(0, 6).map(o => ({
    type: 'order',
    icon: '📦',
    title: `${o.customerName || '고객'} 님 주문 (${o.orderNumber})`,
    desc: `${getDeliveryDate(o)} 배송 · ${formatWon(o.totalAmount)} · ${ORDER_STATUS_LABELS[o.status] || o.status}`,
    action: () => {
      switchAdminTab('orders');
      if (typeof setOrderViewMode === 'function') setOrderViewMode('list');
      if (typeof expandedOrders !== 'undefined') expandedOrders.add(o.id);
      if (typeof renderOrdersList === 'function') renderOrdersList();
      setTimeout(() => {
        const el = document.getElementById(`tracking-${o.id}`) || document.getElementById(`admin-memo-${o.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }));

  const matchedProducts = products.filter(p => {
    const hay = [p.name, p.englishName, p.flowerMeaning, p.poeticLine].join(' ').toLowerCase();
    return hay.includes(q);
  }).slice(0, 5).map(p => ({
    type: 'product',
    icon: '🌸',
    title: `${p.name} (${(p.price || 0).toLocaleString()}원)`,
    desc: `꽃말: ${p.flowerMeaning || '-'} · "${p.poeticLine || ''}"`,
    action: () => {
      switchAdminTab('products');
      if (typeof editProduct === 'function') editProduct(p.id);
    }
  }));

  const allResults = [...matchedMenus, ...matchedOrders, ...matchedProducts];
  window.__currentSearchResults = allResults;

  if (allResults.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-xs text-ink-gray">
        <p class="text-2xl mb-1">🔍</p>
        <p class="font-bold text-ink-black text-sm">'${escapeHtml(query)}' 검색 결과가 없어요.</p>
        <p class="mt-1">주문자 성함, 전화번호 뒷자리, 주문번호, 상품명 등으로 다시 찾아보세요.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="divide-y divide-ink-black/5">
      ${allResults.map((r, i) => `
        <div onclick="executeSearchAction(${i})" class="search-result-item p-3 flex items-center justify-between hover:bg-amber-50 cursor-pointer transition-colors text-xs border-l-2 border-transparent">
          <div class="flex items-center gap-2.5">
            <span class="text-base">${r.icon}</span>
            <div>
              <p class="font-bold text-ink-black text-sm">${escapeHtml(r.title)}</p>
              <p class="text-[11px] text-ink-gray">${escapeHtml(r.desc)}</p>
            </div>
          </div>
          <span class="text-[10px] text-ink-light px-1.5 py-0.5 rounded bg-black/5 font-bold font-mono">
            ${r.type === 'order' ? '주문' : r.type === 'product' ? '상품' : '메뉴'}
          </span>
        </div>
      `).join('')}
    </div>
  `;
  selectedSearchIndex = 0;
  const items = container.querySelectorAll('.search-result-item');
  if (items.length) updateSearchSelection(items);
}

function executeSearchAction(index) {
  const results = window.__currentSearchResults || [];
  const target = results[index];
  if (target && typeof target.action === 'function') {
    closeCommandPalette();
    target.action();
  }
}

// 전역 키보드 단축키 리스너 (Ctrl+K, Cmd+K, '/', Escape)
document.addEventListener('keydown', e => {
  // ESC 키로 열려 있는 모달 닫기 (설명서 -> 추천꽃 갤러리 -> 전역검색 순)
  if (e.key === 'Escape') {
    const manualModal = document.getElementById('admin-manual-modal');
    if (manualModal && !manualModal.classList.contains('hidden')) {
      e.preventDefault();
      closeAdminManualModal();
      return;
    }
    const featuredModal = document.getElementById('modal-featured-picker');
    if (featuredModal && !featuredModal.classList.contains('hidden')) {
      e.preventDefault();
      closeFeaturedPickerModal();
      return;
    }
    const searchModal = document.getElementById('admin-search-modal');
    if (searchModal && !searchModal.classList.contains('hidden')) {
      e.preventDefault();
      closeCommandPalette();
      return;
    }
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    openCommandPalette();
  } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    openCommandPalette();
  }
});


// ==========================================
// 2. 상단 매장 현황 요약 미니 밴드 (Status Bar)
// ==========================================
function updateStatusMinibar() {
  const container = document.getElementById('minibar-stats');
  if (!container) return;

  const orders = typeof loadAdminOrders === 'function' ? loadAdminOrders() : [];
  const today = typeof financeToday === 'function' ? financeToday() : new Date().toISOString().slice(0, 10);
  
  // 오늘 배송 또는 픽업 유효 주문
  const todayOrders = orders.filter(o => o.status !== 'cancelled' && getDeliveryDate(o) === today);
  const doneCount = todayOrders.filter(o => o.status === 'packaged' || o.status === 'delivering' || o.status === 'completed').length;
  const remainCount = todayOrders.length - doneCount;

  // 신규/미답변 상담
  const inquiries = typeof loadInquiries === 'function' ? loadInquiries() : [];
  const pendingInquiries = inquiries.filter(i => !i.isSample && (!i.status || i.status === 'pending' || !i.reply));

  // 승인 대기 후기
  const reviews = typeof loadReviews === 'function' ? loadReviews() : (typeof DataStore !== 'undefined' ? DataStore.read('seoldamhwa_reviews', []) : []);
  const pendingReviews = reviews.filter(r => !r.isSample && r.status === 'pending');

  const soundOn = typeof adminSoundOn === 'function' ? adminSoundOn() : true;

  container.innerHTML = `
    <!-- 오늘 출고 현황 배지 -->
    <button type="button" onclick="switchAdminTab('orders'); if (typeof setOrderViewMode === 'function') setOrderViewMode('timeline');" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${remainCount > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'} cursor-pointer" title="클릭 시 오늘의 꽃 작업 시간표로 이동">
      <span>⏰ 오늘 출고 ${todayOrders.length}건</span>
      <span class="text-[11px] font-normal">(${remainCount > 0 ? `남은 제작 ${remainCount}건` : '모두 완료! 🎉'})</span>
    </button>

    <!-- 미답변 상담 배지 -->
    <button type="button" onclick="switchAdminTab('reviews')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${pendingInquiries.length > 0 ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 animate-pulse' : 'bg-[#FAF7F2] text-ink-gray border border-ink-black/10'} cursor-pointer" title="클릭 시 고객 상담 문의 탭으로 이동">
      <span>💬 상담 ${pendingInquiries.length > 0 ? `<span class="text-blue-700">${pendingInquiries.length}건 대기</span>` : '대기 없음'}</span>
    </button>

    <!-- 확인 대기 후기 배지 -->
    ${pendingReviews.length > 0 ? `
      <button type="button" onclick="switchAdminTab('reviews-admin')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF0E6] text-seal-red border border-seal-red/30 hover:bg-seal-red hover:text-white transition-all cursor-pointer" title="새 후기 승인 대기">
        <span>💌 새 후기 ${pendingReviews.length}건</span>
      </button>
    ` : ''}

    <!-- 소리 알림 퀵 토글 -->
    <button type="button" onclick="if (typeof toggleAdminSound === 'function') toggleAdminSound(); updateStatusMinibar();" class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-ink-gray hover:text-ink-black border border-ink-black/15 bg-white cursor-pointer ml-auto" title="새 주문 소리 알림 켜기/끄기">
      <span>${soundOn ? '🔔 소리 켜짐' : '🔕 소리 꺼짐'}</span>
    </button>
  `;

  updateMinibarClock();
  updateBottomNavBadges(todayOrders.length, remainCount, pendingInquiries.length);
}

function updateMinibarClock() {
  const clock = document.getElementById('minibar-clock');
  if (!clock) return;
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
  const pad = n => String(n).padStart(2, '0');
  clock.textContent = `${pad(kst.getHours())}:${pad(kst.getMinutes())}:${pad(kst.getSeconds())}`;
}

function refreshAdminData() {
  updateStatusMinibar();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderOrdersList === 'function') renderOrdersList();
  if (typeof renderProductsTable === 'function') renderProductsTable();
  if (typeof renderDashboardTodayQuickpanel === 'function') renderDashboardTodayQuickpanel();
  alert('모든 매장 현황 데이터가 최신으로 갱신되었습니다.');
}

function updateBottomNavBadges(todayTotal, remainCount, pendingInq) {
  const timeBadge = document.getElementById('bottom-timeline-badge');
  const orderBadge = document.getElementById('bottom-order-badge');
  const inqBadge = document.getElementById('bottom-inq-badge');

  if (timeBadge) timeBadge.classList.toggle('hidden', remainCount <= 0);
  if (orderBadge) {
    if (todayTotal > 0) {
      orderBadge.textContent = todayTotal;
      orderBadge.classList.remove('hidden');
    } else {
      orderBadge.classList.add('hidden');
    }
  }
  if (inqBadge) inqBadge.classList.toggle('hidden', pendingInq <= 0);
}


// ==========================================
// 3. 이달의 추천 꽃 비주얼 갤러리 선택기 모달
// ==========================================
function openFeaturedPickerModal() {
  const modal = document.getElementById('modal-featured-picker');
  const grid = document.getElementById('featured-picker-grid');
  if (!modal || !grid) return;

  const all = typeof loadAdminProducts === 'function' ? loadAdminProducts() : [];
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  const currentFeaturedId = settings.featuredProductId || '';

  // 현재 추천 중인 꽃 판정
  let activeProduct = all.find(p => p.id === currentFeaturedId);
  if (!activeProduct) {
    activeProduct = (typeof homeProducts === 'function' ? homeProducts('all')[0] : null) || all[0];
  }

  grid.innerHTML = all.map(p => {
    const isCurrent = (p.id === (currentFeaturedId || (activeProduct && activeProduct.id)));
    const priceText = p.sizes && p.sizes.length ? `${Math.min(...p.sizes.map(s => s.price)).toLocaleString()}원~` : `${(p.price || 0).toLocaleString()}원`;
    return `
      <div class="admin-card rounded-sm overflow-hidden border ${isCurrent ? 'border-seal-red ring-2 ring-seal-red/30 bg-[#FAF0E6]/30' : 'border-ink-black/10 bg-white hover:border-seal-red/50'} flex flex-col justify-between transition-all shadow-xs">
        <div>
          <div class="relative h-40 bg-[#EFECE6] overflow-hidden">
            <img src="${escapeHtml(p.image)}" alt="" class="w-full h-full object-cover">
            ${isCurrent ? '<span class="absolute top-2 right-2 px-2 py-0.5 rounded text-[11px] font-extrabold bg-seal-red text-white shadow-xs">🌸 현재 추천 꽃</span>' : ''}
          </div>
          <div class="p-3.5 space-y-1">
            <div class="flex items-center justify-between">
              <h4 class="font-extrabold text-sm text-ink-black">${escapeHtml(p.name)}</h4>
              <span class="text-xs font-bold text-seal-red font-mono">${priceText}</span>
            </div>
            ${p.poeticLine ? `<p class="text-[11px] font-serif text-ink-gray line-clamp-1 italic">"${escapeHtml(p.poeticLine)}"</p>` : ''}
            ${p.flowerMeaning ? `<p class="text-[11px] text-ink-light">꽃말: ${escapeHtml(p.flowerMeaning)}</p>` : ''}
          </div>
        </div>
        <div class="p-3 pt-0">
          ${isCurrent ? `
            <button type="button" disabled class="w-full py-2 bg-[#FAF0E6] text-seal-red border border-seal-red/30 rounded-xs text-xs font-bold cursor-default">
              🌸 현재 쇼핑몰 메인에 표시 중
            </button>
          ` : `
            <button type="button" onclick="selectFeaturedProduct('${p.id}')" class="w-full py-2 jakae-btn rounded-xs text-xs font-bold cursor-pointer hover:shadow-md transition-all">
              👀 선택하여 프리뷰 체험하기
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  modal.classList.remove('hidden');
}

function closeFeaturedPickerModal() {
  const modal = document.getElementById('modal-featured-picker');
  if (modal) modal.classList.add('hidden');
}

function selectFeaturedProduct(prodId) {
  closeFeaturedPickerModal();
  // 상품 관리 탭으로 전환 후 해당 꽃을 실시간 프리뷰로 지정
  if (typeof switchAdminTab === 'function') {
    switchAdminTab('products');
  }
  if (typeof previewFeaturedProductSelection === 'function') {
    previewFeaturedProductSelection(prodId);
  }
  // 추천 꽃 설정 카드로 스크롤
  setTimeout(() => {
    const card = document.getElementById('featured-product-card-container');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}


// ==========================================
// 4. 대시보드 당일 작업 원스톱 퀵패널
// ==========================================
function renderDashboardTodayQuickpanel() {
  const container = document.getElementById('dashboard-today-quickpanel');
  if (!container) return;

  const orders = typeof loadAdminOrders === 'function' ? loadAdminOrders() : [];
  const today = typeof financeToday === 'function' ? financeToday() : new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.status !== 'cancelled' && getDeliveryDate(o) === today);

  if (todayOrders.length === 0) {
    container.innerHTML = `
      <div class="admin-card p-4 rounded-sm bg-white border border-dashed border-ink-black/15 flex items-center justify-between text-xs text-ink-gray">
        <div class="flex items-center gap-2">
          <span class="text-lg">🌸</span>
          <span class="font-bold text-ink-black">오늘 예정된 제작·출고 주문이 없습니다.</span>
        </div>
        <button type="button" onclick="switchAdminTab('orders')" class="text-seal-red font-bold hover:underline cursor-pointer">전체 주문 목록 보기 &gt;</button>
      </div>
    `;
    return;
  }

  const doneCount = todayOrders.filter(o => o.status === 'packaged' || o.status === 'delivering' || o.status === 'completed').length;

  container.innerHTML = `
    <div class="admin-card p-4 sm:p-5 rounded-sm bg-[#FAF7F2] border border-amber-300/80 shadow-xs space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-black/10 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-seal-red animate-pulse"></span>
            <h2 class="text-base font-extrabold text-ink-black">오늘의 출고·제작 원스톱 퀵패널</h2>
            <span class="px-2 py-0.5 rounded text-xs font-bold ${doneCount === todayOrders.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">
              ${doneCount}/${todayOrders.length}건 완료
            </span>
          </div>
          <p class="text-xs text-ink-gray mt-0.5">대시보드에서 탭을 옮기지 않고 바로 제작 완료를 체크하고 운송장을 저장할 수 있어요.</p>
        </div>
        <button type="button" onclick="switchAdminTab('orders'); if (typeof setOrderViewMode === 'function') setOrderViewMode('timeline');" class="jakae-btn px-3 py-1.5 rounded-xs text-xs font-bold cursor-pointer whitespace-nowrap">
          ⏰ 제작 시간표 보드로 보기 &gt;
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        ${todayOrders.map(o => {
          const stats = typeof getCustomerStats === 'function' ? getCustomerStats(o, orders) : { isRepeat: false };
          const isDone = (o.status === 'packaged' || o.status === 'delivering' || o.status === 'completed');
          const isPickup = (o.deliveryMethod === 'pickup');
          const items = o.items || [];
          return `
            <div class="p-3 rounded-xs border ${isDone ? 'bg-white/70 border-emerald-300 opacity-85' : 'bg-white border-amber-300 shadow-xs'} space-y-2 text-xs">
              <div class="flex items-start justify-between gap-1">
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-extrabold text-ink-black">${escapeHtml(orderRecipient(o).name)}</span>
                    ${typeof customerBadgeHtml === 'function' ? customerBadgeHtml(stats) : ''}
                    ${isPickup ? '<span class="text-[10px] font-bold px-1 rounded bg-blue-100 text-blue-800">픽업</span>' : '<span class="text-[10px] font-bold px-1 rounded bg-amber-100 text-amber-800">배송</span>'}
                  </div>
                  <span class="font-mono text-[11px] text-ink-gray">${escapeHtml(o.orderNumber)}</span>
                </div>
                <button type="button" onclick="quickToggleOrderStatus('${o.id}', '${isDone ? 'preparing' : 'packaged'}')" class="px-2.5 py-1 rounded-xs font-bold text-xs cursor-pointer transition-colors ${isDone ? 'bg-emerald-700 text-white' : 'bg-seal-red text-white hover:opacity-90'}">
                  ${isDone ? '✅ 포장 완료' : '🌸 제작 완료'}
                </button>
              </div>

              <!-- 품목 및 포장 요약 -->
              <div class="text-[11px] text-ink-black space-y-0.5">
                ${items.map(it => `
                  <p class="truncate">• ${escapeHtml(it.product && it.product.name)} ×${it.quantity || 1} <span class="text-ink-gray">(${escapeHtml(it.optionName || '기본 한지 포장')})</span></p>
                `).join('')}
              </div>

              <!-- 카드 메시지 -->
              ${o.message ? `
                <p class="p-1.5 bg-amber-50 rounded text-[11px] font-serif text-seal-red italic line-clamp-1 border-l-2 border-seal-red">✉️ "${escapeHtml(o.message)}"</p>
              ` : ''}

              <!-- 운송장 빠른 입력 -->
              <div class="flex gap-1 pt-1 border-t border-ink-black/5">
                <input type="text" id="quick-track-${o.id}" value="${escapeHtml(o.trackingNumber || '')}" placeholder="송장번호 입력" class="flex-1 bg-white border border-ink-black/20 p-1 rounded-xs text-[11px] font-mono">
                <button type="button" onclick="quickSaveTracking('${o.id}')" class="px-2 py-1 bg-ink-black text-white rounded-xs text-[11px] font-bold hover:bg-seal-red cursor-pointer">저장</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function quickToggleOrderStatus(ordId, newStatus) {
  if (typeof updateOrderStatus === 'function') {
    updateOrderStatus(ordId, newStatus);
  }
  renderDashboardTodayQuickpanel();
  updateStatusMinibar();
}

function quickSaveTracking(ordId) {
  const input = document.getElementById(`quick-track-${ordId}`);
  if (!input) return;
  const trackingNumber = input.value.trim().replace(/\s+/g, '');
  if (trackingNumber && !/^[0-9A-Za-z-]{6,30}$/.test(trackingNumber)) {
    alert('운송장 번호는 숫자·영문 6~30자로 적어 주세요.');
    return;
  }
  const orders = typeof loadAdminOrders === 'function' ? loadAdminOrders() : [];
  const updated = orders.map(o => o.id === ordId ? { ...o, trackingNumber, status: trackingNumber && o.status === 'preparing' ? 'packaged' : o.status } : o);
  if (typeof saveOrders === 'function') saveOrders(updated);
  alert('운송장 번호가 저장되었습니다.');
  renderDashboardTodayQuickpanel();
  updateStatusMinibar();
}


// ==========================================
// 5. 매장 휴무일 캘린더 원클릭 지정
// ==========================================
let holidayCalYear = new Date().getFullYear();
let holidayCalMonth = new Date().getMonth() + 1; // 1-12

function renderHolidayCalendar() {
  const container = document.getElementById('holiday-quick-calendar');
  if (!container) return;

  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  const closures = settings.closures || [];
  const weekly = settings.weeklyHours || [];

  const firstDay = new Date(holidayCalYear, holidayCalMonth - 1, 1).getDay(); // 0(일) ~ 6(토)
  const lastDate = new Date(holidayCalYear, holidayCalMonth, 0).getDate();

  const pad = n => String(n).padStart(2, '0');
  const monthStr = `${holidayCalYear}-${pad(holidayCalMonth)}`;

  let daysHtml = '';
  // 앞쪽 빈 칸
  for (let i = 0; i < firstDay; i++) {
    daysHtml += `<div class="p-2 border border-transparent"></div>`;
  }

  const todayStr = typeof financeToday === 'function' ? financeToday() : new Date().toISOString().slice(0, 10);

  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${monthStr}-${pad(d)}`;
    const dayOfWeek = new Date(holidayCalYear, holidayCalMonth - 1, d).getDay();
    const isRegularClosed = weekly[dayOfWeek] && !weekly[dayOfWeek].open;
    const closureObj = closures.find(c => c.date === dateStr);
    const isCustomClosed = !!closureObj;
    const isToday = (dateStr === todayStr);

    let bgClass = 'bg-white hover:bg-amber-50 cursor-pointer';
    let textClass = 'text-ink-black';
    let badge = '';

    if (isCustomClosed) {
      bgClass = 'bg-red-500 text-white font-bold hover:bg-red-600 shadow-xs cursor-pointer';
      textClass = 'text-white';
      badge = `<span class="block text-[9px] truncate text-white/90">${escapeHtml(closureObj.reason || '임시휴무')}</span>`;
    } else if (isRegularClosed) {
      bgClass = 'bg-[#FAF7F2] text-ink-light opacity-60 cursor-pointer';
      badge = '<span class="block text-[9px] text-ink-light">정기휴무</span>';
    }

    daysHtml += `
      <div onclick="toggleHolidayFromCalendar('${dateStr}', ${isCustomClosed})" class="p-2 min-h-[52px] border border-ink-black/10 rounded-xs flex flex-col justify-between transition-colors ${bgClass} ${isToday ? 'ring-2 ring-seal-red' : ''}">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold ${textClass}">${d}</span>
          ${isToday ? '<span class="text-[9px] px-1 rounded bg-amber-200 text-amber-900 font-extrabold">오늘</span>' : ''}
        </div>
        ${badge}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="admin-card p-4 rounded-sm bg-[#FAF7F2] border border-ink-black/15 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-base">📅</span>
          <h4 class="font-bold text-sm text-ink-black">달력에서 쉬는 날(임시 휴무) 콕 찍기</h4>
          <span class="text-[11px] text-ink-gray">날짜를 클릭하면 바로 임시 휴무로 등록되거나 해제돼요.</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick="changeHolidayCalMonth(-1)" class="px-2 py-1 bg-white border border-ink-black/20 rounded-xs font-bold text-xs hover:border-ink-black cursor-pointer">&lt;</button>
          <span class="font-bold text-xs text-ink-black min-w-[70px] text-center">${holidayCalYear}년 ${holidayCalMonth}월</span>
          <button type="button" onclick="changeHolidayCalMonth(1)" class="px-2 py-1 bg-white border border-ink-black/20 rounded-xs font-bold text-xs hover:border-ink-black cursor-pointer">&gt;</button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-ink-gray pb-1 border-b border-ink-black/10">
        <span class="text-red-600">일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span class="text-blue-600">토</span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        ${daysHtml}
      </div>
      <div class="flex items-center gap-4 text-[11px] text-ink-gray pt-1">
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-xs bg-red-500 inline-block"></span> 빨간색: 등록된 임시 휴무</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-xs bg-[#FAF7F2] border border-ink-black/10 inline-block"></span> 회색: 정기 휴무</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-xs bg-white border border-ink-black/20 inline-block"></span> 흰색: 영업일 (클릭 시 휴무 지정)</span>
      </div>
    </div>
  `;
}

function changeHolidayCalMonth(dir) {
  holidayCalMonth += dir;
  if (holidayCalMonth > 12) {
    holidayCalMonth = 1;
    holidayCalYear++;
  } else if (holidayCalMonth < 1) {
    holidayCalMonth = 12;
    holidayCalYear--;
  }
  renderHolidayCalendar();
}

function toggleHolidayFromCalendar(dateStr, isAlreadyClosed) {
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  let closures = settings.closures ? [...settings.closures] : [];

  if (isAlreadyClosed) {
    if (!confirm(`${dateStr}의 임시 휴무 지정을 해제하고 정상 영업일로 되돌릴까요?`)) return;
    closures = closures.filter(c => c.date !== dateStr);
  } else {
    const reason = prompt(`${dateStr}을(를) 임시 휴무일로 지정합니다.\n사유를 입력해 주세요 (예: 추석 연휴, 매장 공사, 개인 사정):`, '개인 사정');
    if (reason === null) return;
    closures.push({ date: dateStr, reason: reason.trim() || '임시 휴무' });
  }

  if (typeof saveSettings === 'function') {
    saveSettings({ closures });
  }
  renderHolidayCalendar();
  if (typeof renderClosuresList === 'function') renderClosuresList();
  alert(`${dateStr} 휴무 설정이 반영되었습니다.`);
}


// ==========================================
// 6. 초보 사장님 상세 사용 설명서 모달
// ==========================================
function openAdminManualModal() {
  const modal = document.getElementById('admin-manual-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    showManualChapter('routine');
  }
}

function closeAdminManualModal() {
  const modal = document.getElementById('admin-manual-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function showManualChapter(chapterId) {
  const targetId = chapterId || 'routine';
  document.querySelectorAll('.manual-nav-btn').forEach(btn => {
    const isActive = btn.dataset.chapter === targetId;
    btn.className = `manual-nav-btn w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-xs flex items-center justify-between cursor-pointer transition-all ${isActive ? 'is-active bg-ink-black text-white shadow-xs' : 'bg-white hover:bg-amber-50 text-ink-black border border-ink-black/10'}`;
  });

  document.querySelectorAll('.manual-chapter-content').forEach(cont => {
    const match = cont.id === `manual-chapter-${targetId}`;
    cont.classList.toggle('hidden', !match);
  });

  const contentContainer = document.getElementById('manual-content-container');
  if (contentContainer) {
    contentContainer.scrollTop = 0;
  }
}


// ==========================================
// 7. 모듈 초기화 및 타이머
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    updateStatusMinibar();
    renderDashboardTodayQuickpanel();
  }, 200);

  // 1초마다 시계 갱신 및 15초마다 매장 현황 갱신
  setInterval(updateMinibarClock, 1000);
  setInterval(updateStatusMinibar, 15000);
});
