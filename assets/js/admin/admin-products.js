// assets/js/admin/admin-products.js
// 설담화 관리자: 상품 목록·공개 상태 거르기·검색
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 2. 상품 및 한 줄 글귀 테이블 렌더링 & 필터
let currentProductFilter = 'all';
let currentProductCategory = 'all';

function setProductCategory(cat) {
  currentProductCategory = cat;
  renderProductsTable();
}

// 종류 버튼: 전체 + 7가지 (상품 수 표시, 상품이 없는 종류도 보여 줌)
function renderProductCategoryFilter(allProducts) {
  const box = document.getElementById('prod-cat-filter');
  if (!box) return;
  box.innerHTML = '';
  const label = document.createElement('span');
  label.className = 'text-xs font-bold text-ink-gray mr-1';
  label.textContent = '종류';
  box.appendChild(label);
  [{ id: 'all', label: '전체' }, ...PRODUCT_CATEGORIES].forEach(c => {
    const n = c.id === 'all' ? allProducts.length : allProducts.filter(p => p.category === c.id).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${c.label} ${n}`;
    const on = currentProductCategory === c.id;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.className = `px-2.5 py-1 text-xs font-bold rounded-full cursor-pointer ${on ? 'bg-seal-red text-white' : 'bg-white text-ink-black border border-ink-black/15 hover:border-seal-red'}${n || on ? '' : ' opacity-50'}`;
    b.onclick = () => setProductCategory(c.id);
    box.appendChild(b);
  });
}

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
  renderFeaturedProductCard(allProducts);
  const tbody = document.getElementById('admin-products-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  const catNames = Object.fromEntries(PRODUCT_CATEGORIES.map(c => [c.id, c.label]));
  const currentSettings = typeof loadSettings === 'function' ? loadSettings() : {};
  const currentFeaturedId = currentSettings.featuredProductId || '';

  const q = ((document.getElementById('prod-search') || {}).value || '').trim().toLowerCase();
  const stockFilter = (document.getElementById('prod-stock-filter') || {}).value || 'all';
  renderProductCategoryFilter(allProducts);
  const filtered = allProducts.filter(p => {
    if (currentProductCategory !== 'all' && p.category !== currentProductCategory) return false;
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
    const isFeatured = (p.id === currentFeaturedId);
    const featuredBadge = isFeatured
      ? '<span class="inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FAF0E6] text-seal-red border border-seal-red/30 whitespace-nowrap">🌸 이달의 추천</span>'
      : '';

    tr.innerHTML = `
      <td class="py-3 px-4"><img src="${escapeHtml(p.image)}" alt="" class="w-12 h-14 object-cover border border-ink-black/10 rounded-xs"></td>
      <td class="py-3 px-4 font-bold text-ink-black text-sm">
        <div class="flex items-center flex-wrap gap-1">
          <span>${escapeHtml(p.name)}</span>
          ${featuredBadge}
        </div>
        <p class="text-[11px] text-ink-gray font-normal mt-0.5">${catLabel}</p>
      </td>
      <td class="py-3 px-4 max-w-xs font-serif text-seal-red font-semibold leading-relaxed line-clamp-2">"${escapeHtml(p.poeticLine)}"</td>
      <td class="py-3 px-4 font-bold text-ink-black">${priceText}</td>
      <td class="py-3 px-4">${stBadge}${p.inquiryOnly ? '' : `<div class="mt-1.5 inline-flex items-center border border-ink-black/20 rounded-xs bg-white overflow-hidden" role="group" aria-label="재고 조절">
          <button type="button" onclick="adjustStock('${p.id}', -1)" class="px-2 py-0.5 font-bold hover:bg-[#EFECE6] cursor-pointer" aria-label="재고 하나 빼기">−</button>
          <span class="px-2 font-bold min-w-[2.5em] text-center">${p.stockQuantity ?? 0}</span>
          <button type="button" onclick="adjustStock('${p.id}', 1)" class="px-2 py-0.5 font-bold hover:bg-[#EFECE6] cursor-pointer" aria-label="재고 하나 더하기">+</button>
        </div>`}${typeof restockWaitingCount === 'function' && restockWaitingCount(p.id) ? `<span class="block mt-1 text-[11px] font-bold text-amber-700">🔔 재입고 알림 ${restockWaitingCount(p.id)}명</span>` : ''}</td>
      <td class="py-3 px-4">${visBadge}<span class="block mt-1 text-[11px] ${p.hideOnHome ? 'text-ink-light' : 'text-ink-gray'}">${p.hideOnHome ? '홈에 숨김' : (typeof p.homeOrder === 'number' ? `홈 ${p.homeOrder}번째` : '홈에 보임')}</span></td>
      <td class="py-3 px-4 text-center whitespace-nowrap space-x-1">
        ${isFeatured ? '<span class="inline-block px-2 py-1 bg-[#FAF0E6] text-seal-red border border-seal-red/25 rounded-xs font-bold text-[11px]">추천 중</span>' : `<button type="button" onclick="saveFeaturedProduct('${p.id}')" class="px-2 py-1 border border-ink-black/20 bg-white hover:border-seal-red hover:text-seal-red rounded-xs font-bold text-[11px] cursor-pointer" title="이 꽃을 쇼핑몰 메인의 '이달의 추천'으로 지정">⭐ 추천</button>`}
        <button onclick="previewProduct('${p.id}')" class="px-2.5 py-1 border border-ink-black/20 bg-white hover:border-seal-red hover:text-seal-red rounded-xs font-bold cursor-pointer">미리보기</button>
        <button onclick="editProduct('${p.id}')" class="px-2.5 py-1 border border-ink-black/20 bg-white hover:border-seal-red hover:text-seal-red rounded-xs font-bold cursor-pointer">수정</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- 🌸 쇼핑몰 메인 '이달의 추천 꽃' 관리 함수들 ----
let tempPreviewFeaturedId = null;

function renderFeaturedProductCard(products) {
  const cardContainer = document.getElementById('featured-product-card-container');
  const select = document.getElementById('featured-prod-select');
  const badge = document.getElementById('featured-prod-badge');
  const previewImg = document.getElementById('featured-prod-preview-img');
  const previewName = document.getElementById('featured-prod-preview-name');
  const previewPoetic = document.getElementById('featured-prod-preview-poetic');
  const previewPrice = document.getElementById('featured-prod-preview-price');
  const heroBtnPreview = document.getElementById('featured-hero-btn-preview');
  const statusPill = document.getElementById('featured-status-pill');
  const confirmBtn = document.getElementById('btn-confirm-featured');
  const cancelBtn = document.getElementById('btn-cancel-featured');
  const previewHint = document.getElementById('featured-preview-hint');

  const all = products || loadAdminProducts();
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  const currentSavedFeaturedId = settings.featuredProductId || '';
  
  // 현재 프리뷰 중인 꽃이 있다면 그것을 우선 표시, 없으면 저장된 꽃 표시
  const targetId = tempPreviewFeaturedId || currentSavedFeaturedId;
  const isPreviewing = !!(tempPreviewFeaturedId && tempPreviewFeaturedId !== currentSavedFeaturedId);

  let activeProduct = all.find(p => p.id === targetId);
  let isAuto = false;
  if (!activeProduct) {
    isAuto = true;
    activeProduct = (typeof homeProducts === 'function' ? homeProducts('all')[0] : null) || all[0];
  }

  if (badge) {
    if (activeProduct) {
      badge.textContent = isPreviewing ? `미리보기 체험 중` : (isAuto ? `자동 추천 (홈 1순위)` : `사장님 직접 지정`);
      badge.className = isPreviewing
        ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-400 animate-pulse'
        : (isAuto
          ? 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200'
          : 'px-2 py-0.5 rounded text-[11px] font-bold bg-[#FAF0E6] text-seal-red border border-seal-red/30');
    }
  }

  if (statusPill) {
    if (isPreviewing) {
      statusPill.textContent = '👀 체험 미리보기 (미저장)';
      statusPill.className = 'text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300';
    } else {
      statusPill.textContent = 'LIVE (현재 쇼핑몰 적용 중)';
      statusPill.className = 'text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800';
    }
  }

  if (confirmBtn) confirmBtn.classList.toggle('hidden', !isPreviewing);
  if (cancelBtn) cancelBtn.classList.toggle('hidden', !isPreviewing);
  if (previewHint) previewHint.classList.toggle('hidden', !isPreviewing);

  // 비주얼 미리보기 갱신
  if (activeProduct) {
    if (previewImg) {
      previewImg.src = activeProduct.image || 'assets/images/placeholder.png';
      previewImg.alt = activeProduct.name;
    }
    if (previewName) previewName.textContent = activeProduct.name;
    if (previewPoetic) previewPoetic.textContent = activeProduct.poeticLine ? `"${activeProduct.poeticLine}"` : '';
    if (previewPrice) {
      const pText = activeProduct.sizes && activeProduct.sizes.length ? `${Math.min(...activeProduct.sizes.map(s => s.price)).toLocaleString()}원~` : `${(activeProduct.price || 0).toLocaleString()}원`;
      previewPrice.textContent = pText;
    }
    if (heroBtnPreview) {
      heroBtnPreview.textContent = `🌸 이달의 추천 : ${activeProduct.name} 보기`;
      if (isPreviewing) {
        heroBtnPreview.classList.add('ring-2', 'ring-amber-400');
      } else {
        heroBtnPreview.classList.remove('ring-2', 'ring-amber-400');
      }
    }
  }

  // 드롭다운 채우기
  if (select) {
    select.innerHTML = '<option value="">-- 꽃을 선택하면 아래 버튼 모양이 실시간으로 바뀌어요 --</option>' + all.map(p => {
      const isSel = (p.id === (targetId || (activeProduct && activeProduct.id)));
      return `<option value="${escapeHtml(p.id)}" ${isSel ? 'selected' : ''}>${escapeHtml(p.name)} (${(p.price || 0).toLocaleString()}원)</option>`;
    }).join('');
  }
}

// 사장님이 드롭다운에서 꽃을 바꿀 때: 실시간으로 버튼 모양과 사진 프리뷰 체험!
function previewFeaturedProductSelection(prodId) {
  if (!prodId) return;
  tempPreviewFeaturedId = prodId;
  renderFeaturedProductCard();
}

// 마음에 들어 확정할 때: 비로소 정식 저장!
function confirmFeaturedProductSelection() {
  if (!tempPreviewFeaturedId) return;
  saveFeaturedProduct(tempPreviewFeaturedId);
  tempPreviewFeaturedId = null;
  renderFeaturedProductCard();
}

// 취소하고 원래대로 되돌릴 때
function cancelFeaturedPreview() {
  tempPreviewFeaturedId = null;
  renderFeaturedProductCard();
}

function saveFeaturedProduct(prodId) {
  if (!prodId) return;
  const all = loadAdminProducts();
  const target = all.find(p => p.id === prodId);
  if (!target) return;

  if (typeof saveSettings === 'function') {
    saveSettings({ featuredProductId: prodId });
  }
  tempPreviewFeaturedId = null;
  alert(`🌸 '${target.name}' 상품이 쇼핑몰 메인의 [이달의 추천]으로 확정 지정되었습니다!\n실제 쇼핑몰(index.html)에도 즉시 반영됩니다.`);
  renderProductsTable();
}

function saveFeaturedProductFromSelect() {
  const select = document.getElementById('featured-prod-select');
  if (!select || !select.value) {
    alert('이달의 추천으로 지정할 상품을 목록에서 선택해 주세요.');
    return;
  }
  saveFeaturedProduct(select.value);
}

function resetFeaturedProduct() {
  tempPreviewFeaturedId = null;
  if (typeof saveSettings === 'function') {
    saveSettings({ featuredProductId: '' });
  }
  alert('🌸 이달의 추천 꽃이 기본값(홈 제철 꽃 1순위)으로 재설정되었습니다.');
  renderProductsTable();
}
