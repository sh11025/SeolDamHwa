// assets/js/shop/shop-core.js
// 설담화 쇼핑몰: 쇼핑몰 공통 상태·배송일 선택·첫 실행·상품 목록·이달의 추천·미리보기 띠
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 장바구니 상태 관리
let cart = [];
let currentSelectedProduct = null;
let currentSelectedSize = null;
let currentQty = 1;
let currentCategory = 'all';
let selectedDelivery = { date: '', time: '' };

// 배송일 드롭다운 생성 (영업일 기준 14일치 옵션, 정기 휴무 및 임시 휴무 제외)
function buildDeliveryDateOptions(selectEl) {
  if (!selectEl) return;
  const prevVal = selectEl.value;
  selectEl.innerHTML = '';
  const currentLang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};

  const now = new Date();
  let foundDays = 0;
  let dayOffset = 1;

  // 최대 60일까지 탐색하며 open인 날 14일 수집
  while (foundDays < 14 && dayOffset <= 60) {
    const d = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const kp = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(d) : { dateStr: d.toISOString().slice(0, 10), day: d.getDay() };
    const sched = typeof getDaySchedule === 'function' ? getDaySchedule(kp.dateStr, settings) : { open: true };

    if (sched.open) {
      const val = kp.dateStr;
      const label = typeof formatDeliveryDateOption === 'function'
        ? formatDeliveryDateOption(d, currentLang)
        : `${val} 도착 희망`;
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      selectEl.appendChild(opt);
      foundDays++;
    }
    dayOffset++;
  }

  if (prevVal && selectEl.querySelector(`option[value="${prevVal}"]`)) {
    selectEl.value = prevVal;
  }
}

// 초기 실행
document.addEventListener('DOMContentLoaded', () => {
  try { renderBusinessInfo(); } catch (e) { console.error('renderBusinessInfo error:', e); }
  try { if (typeof applyLanguage === 'function') applyLanguage(getCurrentLang()); } catch (e) { console.error('applyLanguage error:', e); }
  try { renderProducts('all'); } catch (e) { console.error('renderProducts error:', e); }
  try { updateCartUI(); } catch (e) { console.error('updateCartUI error:', e); }
  try { initVideoControls(); } catch (e) { console.error('initVideoControls error:', e); }
  try { initInquiryProductOptions();
  try { initCurationUI(); } catch (e) { console.error('initCurationUI error:', e); } } catch (e) { console.error('initInquiryProductOptions error:', e); }
  try { renderSiteSettings(); } catch (e) { console.error('renderSiteSettings error:', e); }
  try { initFloatingControls(); } catch (e) { console.error('initFloatingControls error:', e); }
  try { updateHeroRecommendButton(); } catch (e) {}
  try { initPopupSlider(); } catch (e) { console.error('initPopupSlider error:', e); }

  // URL 미리보기 파라미터 확인 (?preview=<productId>)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const previewId = urlParams.get('preview');
    if (previewId) {
      openProductDetail(previewId, true);
    }
  } catch (e) {}
});

// 1. 상품 갤러리 렌더링 (재고 상태, 견적 문의 및 공개 여부 반영)
function renderProducts(category) {
  if (!category) category = currentCategory || 'all';
  currentCategory = category;
  const allProducts = loadProducts();
  const visibleProducts = allProducts.filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true);
  const filtered = category === 'all' ? visibleProducts : visibleProducts.filter(p => p.category === category);
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '';

  filtered.forEach(p => {
    const tp = typeof tProduct === 'function' ? tProduct(p) : p;
    const card = document.createElement('div');
    card.className = 'group cursor-pointer flex flex-col';
    card.onclick = () => openProductDetail(p.id);

    let priceDisplay = '';
    if (p.inquiryOnly) {
      priceDisplay = typeof t === 'function' ? t('inquiry_price_label', '상담 후 견적') : '상담 후 견적';
    } else if (p.sizes && p.sizes.length > 0) {
      const minPrice = Math.min(...p.sizes.map(s => s.price));
      const hasMultipleSizes = p.sizes.length >= 2;
      priceDisplay = `${formatPrice(minPrice)}${hasMultipleSizes ? '~' : ''}`;
    } else {
      priceDisplay = formatPrice(p.price || 0);
    }

    let badgeHtml = '';
    let imgClass = 'w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106';

    let stockStatus = 'ample';
    if (!p.inquiryOnly) {
      stockStatus = getStockStatus(p.stockQuantity);
      if (stockStatus === 'out_of_stock') {
        imgClass += ' grayscale opacity-60';
        const soldoutText = typeof t === 'function' ? t('stock_soldout', '일시 품절') : '일시 품절';
        badgeHtml = `
          <div class="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <span class="bg-ink-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-xs tracking-wider shadow">${soldoutText}</span>
          </div>
        `;
      } else if (stockStatus === 'low_stock') {
        const lowText = typeof t === 'function' ? t('stock_low_fmt', '품절 임박 · {qty}개 남음').replace('{qty}', p.stockQuantity) : `품절 임박 · ${p.stockQuantity}개 남음`;
        badgeHtml = `
          <span class="absolute top-2.5 left-2.5 bg-seal-red text-white text-[11px] font-bold px-2.5 py-1 rounded-xs shadow">
            ${lowText}
          </span>
        `;
      }
    }

    const meaningPrefix = typeof t === 'function' ? t('pdp_meaning_prefix', '꽃말: ') : '꽃말: ';

    card.innerHTML = `
      <div class="hanok-card p-3 transition-all duration-300">
        <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
        <div class="relative aspect-[3/4] overflow-hidden bg-[#ECE8E1]">
          <img loading="lazy" decoding="async" src="${p.image}" alt="${tp.name}" class="${imgClass}" loading="lazy">
          ${badgeHtml}
          <!-- 호버 시 시적 글귀 노출 -->
          <div class="card-hover-overlay absolute inset-0 bg-gradient-to-t from-ink-black/85 via-ink-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
            <p class="font-serif text-base sm:text-lg text-white/95 mb-1.5 leading-snug font-semibold italic line-clamp-2">"${tp.poeticLine}"</p>
            <div class="flex items-center gap-1.5 text-sm text-white/90">
              <span class="w-1 h-3 bg-seal-red rounded-xs"></span>
              <span>${meaningPrefix}${tp.flowerMeaning}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- 카드 하단 정보 -->
      <div class="mt-3 text-center space-y-1">
        <h3 class="text-base font-bold text-ink-black tracking-tight group-hover:text-seal-red transition-colors">${tp.name}</h3>
        <!-- 터치 화면용 시적 글귀 -->
        <p class="touch-poetic-line hidden font-serif text-xs sm:text-sm text-seal-red italic line-clamp-1 px-1">"${tp.poeticLine}"</p>
        <p class="text-sm font-semibold ${stockStatus === 'out_of_stock' ? 'text-ink-light' : 'text-ink-gray'}">${priceDisplay}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 카테고리 필터
function filterCategory(cat) {
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 text-xs sm:text-sm font-semibold rounded-xs bg-[#FAF7F2] text-ink-gray hover:text-ink-black border border-ink-black/10 cursor-pointer';
  });
  const activeBtn = document.getElementById(`cat-${cat}`);
  if (activeBtn) {
    activeBtn.className = 'cat-pill px-4 py-2 text-xs sm:text-sm font-semibold rounded-xs bg-ink-black text-white cursor-pointer shadow-xs';
  }
  renderProducts(cat);
}

// 히어로 "이달의 추천" 버튼 핸들러 (B4)
function openHeroRecommendProduct() {
  const products = loadProducts();
  let target = products.find(p => p.id === 'bohemian-autumn' && (typeof isProductVisible === 'function' ? isProductVisible(p) : true));
  if (!target) {
    target = products.find(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true);
  }
  if (target) {
    openProductDetail(target.id);
  }
}

function updateHeroRecommendButton() {
  const btn = document.getElementById('hero-recommend-btn');
  if (!btn) return;
  const products = loadProducts();
  let target = products.find(p => p.id === 'bohemian-autumn' && (typeof isProductVisible === 'function' ? isProductVisible(p) : true));
  if (!target) {
    target = products.find(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true);
  }
  if (target) {
    btn.classList.remove('hidden');
  } else {
    btn.classList.add('hidden');
  }
}

// 미리보기 모드 상태 및 배너 제어 (B3, B5)
let isPreviewMode = false;

function updatePreviewBannerText(product) {
  const bannerTextEl = document.getElementById('preview-mode-text');
  const closeBtn = document.getElementById('preview-mode-close');
  if (closeBtn) closeBtn.innerText = typeof t === 'function' ? t('preview_close', '닫기') : '닫기';
  if (!bannerTextEl || !product) return;

  const isVis = typeof isProductVisible === 'function' ? isProductVisible(product) : true;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';

  if (product.visibility === 'private' || (!isVis && product.visibility !== 'scheduled')) {
    bannerTextEl.innerText = typeof t === 'function' ? t('preview_banner_private', '미리보기 모드 · 손님에게는 아직 보이지 않는 상품이에요') : '미리보기 모드 · 손님에게는 아직 보이지 않는 상품이에요';
  } else if (product.visibility === 'scheduled' && !isVis) {
    let formattedTime = product.publishAt || '';
    if (product.publishAt) {
      const parts = product.publishAt.split('T');
      const dParts = (parts[0] || '').split('-');
      const m = parseInt(dParts[1] || '0', 10);
      const d = parseInt(dParts[2] || '0', 10);
      const timePart = parts[1] || '';
      if (lang === 'en') {
        formattedTime = `${m}/${d} ${timePart}`;
      } else if (lang === 'ja') {
        formattedTime = `${m}月${d}日 ${timePart}`;
      } else {
        formattedTime = `${m}월 ${d}일 ${timePart}`;
      }
    }
    const schedTemplate = typeof t === 'function' ? t('preview_banner_scheduled', '미리보기 모드 · {time}에 공개 예정') : '미리보기 모드 · {time}에 공개 예정';
    bannerTextEl.innerText = schedTemplate.replace('{time}', formattedTime);
  } else {
    bannerTextEl.innerText = typeof t === 'function' ? t('preview_banner_public', '미리보기 모드 · 현재 공개 중인 상품이에요') : '미리보기 모드 · 현재 공개 중인 상품이에요';
  }
}

function updatePreviewBanner() {
  if (isPreviewMode && currentSelectedProduct) {
    updatePreviewBannerText(currentSelectedProduct);
    const btnCart = document.getElementById('pdp-btn-cart');
    const btnBuy = document.getElementById('pdp-btn-buy');
    if (btnCart) btnCart.innerText = typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드 (주문 불가)';
    if (btnBuy) btnBuy.innerText = typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드 (주문 불가)';
  }
}

function closePreviewMode() {
  isPreviewMode = false;
  const banner = document.getElementById('preview-mode-banner');
  if (banner) banner.classList.add('hidden');

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('preview');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  } catch(e) {}

  if (currentSelectedProduct && typeof isProductVisible === 'function' && !isProductVisible(currentSelectedProduct)) {
    closeProductDetail();
  } else {
    resetPDPButtons();
  }
}

// 2. 상품 상세 PDP 모달 열기 (미리보기 모드 isPreview 지원)
