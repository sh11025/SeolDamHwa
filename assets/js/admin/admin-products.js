// assets/js/admin/admin-products.js
// 설담화 관리자: 상품 목록·공개 상태 거르기·검색
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 2. 상품 및 한 줄 글귀 테이블 렌더링 & 필터
let currentProductFilter = 'all';

function setProductFilter(filter) {
  currentProductFilter = filter;
  document.querySelectorAll('.prod-filter-btn').forEach(btn => {
    btn.className = 'prod-filter-btn px-3 py-1.5 text-xs font-bold rounded-xs bg-white text-ink-black border border-ink-black/20 hover:border-ink-black cursor-pointer';
  });
  const activeBtn = document.getElementById('prod-filter-' + filter);
  if (activeBtn) {
    activeBtn.className = 'prod-filter-btn px-3 py-1.5 text-xs font-bold rounded-xs bg-ink-black text-white cursor-pointer shadow-xs';
  }
  renderProductsTable();
}

function previewProduct(prodId) {
  window.open('index.html?preview=' + encodeURIComponent(prodId), '_blank');
}

function renderProductsTable() {
  const allProducts = loadAdminProducts();
  const tbody = document.getElementById('admin-products-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  const catNames = {
    bouquet: '꽃다발',
    basket: '꽃바구니',
    space: '웨딩·공간'
  };

  const q = ((document.getElementById('prod-search') || {}).value || '').trim().toLowerCase();
  const stockFilter = (document.getElementById('prod-stock-filter') || {}).value || 'all';
  const filtered = allProducts.filter(p => {
    if (q && ![p.name, p.englishName, p.flowerMeaning, p.poeticLine].join(' ').toLowerCase().includes(q)) return false;
    if (stockFilter !== 'all') {
      if (p.inquiryOnly) return false;
      const st = getStockStatus(p.stockQuantity);
      if (stockFilter === 'low' && st !== 'low_stock') return false;
      if (stockFilter === 'out' && st !== 'out_of_stock') return false;
      if (stockFilter === 'restock' && !(typeof restockWaitingCount === 'function' && restockWaitingCount(p.id))) return false;
    }
    const isVis = typeof isProductVisible === 'function' ? isProductVisible(p) : true;
    if (currentProductFilter === 'all') return true;
    if (currentProductFilter === 'public') return isVis;
    if (currentProductFilter === 'private') return p.visibility === 'private';
    if (currentProductFilter === 'scheduled') return (p.visibility === 'scheduled' && !isVis);
    return true;
  });

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#F3EDE3]/40 transition-colors';
    
    let stBadge = '';
    if (p.inquiryOnly) {
      stBadge = '<span class="bg-[#FAF7F2] text-ink-black/80 border border-ink-black/10 px-2.5 py-0.5 rounded font-bold text-xs">상담 상품</span>';
    } else {
      const stStatus = getStockStatus(p.stockQuantity);
      const qty = p.stockQuantity ?? 0;
      if (stStatus === 'in_stock') {
        stBadge = `<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">판매 중 (${qty}개)</span>`;
      } else if (stStatus === 'low_stock') {
        stBadge = `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">품절 임박 (${qty}개)</span>`;
      } else {
        stBadge = `<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">일시 품절 (0개)</span>`;
      }
    }

    // 공개 상태 배지: 공개 (green), 비공개 (grey), 예약 · M/D HH:mm (amber; 시간 경과 시 자동으로 공개)
    let visBadge = '';
    const isVis = typeof isProductVisible === 'function' ? isProductVisible(p) : true;
    if (isVis) {
      visBadge = '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">공개</span>';
    } else if (p.visibility === 'private') {
      visBadge = '<span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">비공개</span>';
    } else if (p.visibility === 'scheduled') {
      let timeFmt = '';
      if (p.publishAt) {
        const parts = p.publishAt.split('T');
        const dParts = (parts[0] || '').split('-');
        const m = parseInt(dParts[1] || '0', 10);
        const d = parseInt(dParts[2] || '0', 10);
        timeFmt = `${m}/${d} ${parts[1] || ''}`;
      }
      visBadge = `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">예약 · ${timeFmt}</span>`;
    } else {
      visBadge = '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">공개</span>';
    }

    let priceText = '';
    if (p.inquiryOnly) {
      priceText = '상담 후 견적';
    } else if (p.sizes && p.sizes.length > 0) {
      const minP = Math.min(...p.sizes.map(s => s.price));
      priceText = `${minP.toLocaleString()}원~`;
    } else {
      priceText = `${(p.price || 0).toLocaleString()}원`;
    }

    const catLabel = catNames[p.category] || p.category;

    tr.innerHTML = `
      <td class="py-3 px-4"><img src="${escapeHtml(p.image)}" alt="" class="w-12 h-14 object-cover border border-ink-black/10 rounded-xs"></td>
      <td class="py-3 px-4 font-bold text-ink-black text-sm">${escapeHtml(p.name)}<p class="text-[11px] text-ink-gray font-normal">${catLabel}</p></td>
      <td class="py-3 px-4 max-w-xs font-serif text-seal-red font-semibold leading-relaxed line-clamp-2">"${escapeHtml(p.poeticLine)}"</td>
      <td class="py-3 px-4 font-bold text-ink-black">${priceText}</td>
      <td class="py-3 px-4">${stBadge}${p.inquiryOnly ? '' : `<div class="mt-1.5 inline-flex items-center border border-ink-black/20 rounded-xs bg-white overflow-hidden" role="group" aria-label="재고 조절">
          <button type="button" onclick="adjustStock('${p.id}', -1)" class="px-2 py-0.5 font-bold hover:bg-[#EFECE6] cursor-pointer" aria-label="재고 하나 빼기">−</button>
          <span class="px-2 font-bold min-w-[2.5em] text-center">${p.stockQuantity ?? 0}</span>
          <button type="button" onclick="adjustStock('${p.id}', 1)" class="px-2 py-0.5 font-bold hover:bg-[#EFECE6] cursor-pointer" aria-label="재고 하나 더하기">+</button>
        </div>`}${typeof restockWaitingCount === 'function' && restockWaitingCount(p.id) ? `<span class="block mt-1 text-[11px] font-bold text-amber-700">🔔 재입고 알림 ${restockWaitingCount(p.id)}명</span>` : ''}</td>
      <td class="py-3 px-4">${visBadge}<span class="block mt-1 text-[11px] ${p.hideOnHome ? 'text-ink-light' : 'text-ink-gray'}">${p.hideOnHome ? '홈에 숨김' : (typeof p.homeOrder === 'number' ? `홈 ${p.homeOrder}번째` : '홈에 보임')}</span></td>
      <td class="py-3 px-4 text-center whitespace-nowrap space-x-1">
        <button onclick="previewProduct('${p.id}')" class="px-2.5 py-1 border border-ink-black/20 bg-white hover:border-seal-red hover:text-seal-red rounded-xs font-bold cursor-pointer">미리보기</button>
        <button onclick="editProduct('${p.id}')" class="px-2.5 py-1 border border-ink-black/20 bg-white hover:border-seal-red hover:text-seal-red rounded-xs font-bold cursor-pointer">수정</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
