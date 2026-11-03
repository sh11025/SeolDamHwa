// assets/js/shop/shop-core.js
// 설담화 쇼핑몰: 쇼핑몰 공통 상태·배송일 선택·첫 실행·상품 목록·이달의 추천·미리보기 띠
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 장바구니 상태 관리
let cart = loadSavedCart();

// 장바구니는 이 기기에만 저장 (새로고침해도 남게, 서버·백업에는 안 보냄)
function loadSavedCart() {
  const list = DataStore.read(DataStore.KEYS.cart, []);
  if (!Array.isArray(list)) return [];
  // 그사이 지워졌거나 숨긴 상품은 빼고, 상품 정보는 지금 것으로
  const products = typeof loadProducts === 'function' ? loadProducts() : [];
  return list.filter(i => i && i.product && Number(i.quantity) > 0).map(i => {
    const p = products.find(x => x.id === i.product.id);
    if (!p || p.inquiryOnly || (typeof isProductVisible === 'function' && !isProductVisible(p))) return null;
    return { ...i, product: p };
  }).filter(Boolean);
}

function saveCart() {
  DataStore.write(DataStore.KEYS.cart, cart);
}

// 지금 재고 기준으로 이 상품을 몇 개 더 담을 수 있는지 (견적 상품·재고 미설정은 제한 없음)
function stockLeftFor(productId, exceptIndex = -1) {
  const p = loadProducts().find(x => x.id === productId);
  if (!p || p.inquiryOnly || typeof p.stockQuantity !== 'number') return Infinity;
  const inCart = cart.reduce((n, i, idx) => n + (idx !== exceptIndex && i.product && i.product.id === productId ? Number(i.quantity) || 0 : 0), 0);
  return Math.max(0, p.stockQuantity - inCart);
}
let currentSelectedProduct = null;
let currentSelectedSize = null;
let currentQty = 1;
let currentCategory = 'all';

// 고를 수 있는 배송일 (내일부터 영업일 14일, 정기 휴무·임시 휴무 제외). [{ value: 'YYYY-MM-DD'(한국 날짜), label }]
// 퀵이고 관리자가 '당일 퀵 마감 시각'을 정했으면, 그 시각 전에는 오늘도 고를 수 있음
function getAvailableDeliveryDates(method = (typeof selectedDeliveryMethod === 'function' ? selectedDeliveryMethod() : '')) {
  const currentLang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  const now = new Date();
  const list = [];
  const until = method === 'quick' && typeof quickSameDayUntil === 'function' ? quickSameDayUntil(settings) : '';
  if (until && typeof getKoreaTimeParts === 'function') {
    const kp = getKoreaTimeParts(now);
    const sched = typeof getDaySchedule === 'function' ? getDaySchedule(kp.dateStr, settings) : { open: true };
    if (sched.open && kp.timeStr < until) {
      const label = typeof formatDeliveryDateOption === 'function' ? formatDeliveryDateOption(new Date(kp.year, kp.month - 1, kp.date), currentLang) : kp.dateStr;
      list.push({ value: kp.dateStr, label: `${label} · ${typeof t === 'function' ? t('co_today', '오늘') : '오늘'}` });
    }
  }
  // 최대 60일까지 탐색하며 open인 날 14일 수집
  for (let dayOffset = 1; list.length < 14 && dayOffset <= 60; dayOffset++) {
    const d = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const kp = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(d) : { dateStr: d.toISOString().slice(0, 10), day: d.getDay() };
    const sched = typeof getDaySchedule === 'function' ? getDaySchedule(kp.dateStr, settings) : { open: true };
    if (!sched.open) continue;
    const [y, m, day] = kp.dateStr.split('-').map(Number);
    const label = typeof formatDeliveryDateOption === 'function'
      ? formatDeliveryDateOption(new Date(y, m - 1, day), currentLang)
      : `${kp.dateStr} 도착 희망`;
    list.push({ value: kp.dateStr, label });
  }
  return list;
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
  try { renderHomeReviewsSlider(); } catch (e) { console.error('renderHomeReviewsSlider error:', e); }

  // URL 미리보기 파라미터 확인 (?preview=<productId>)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const previewId = urlParams.get('preview');
    if (previewId) {
      openProductDetail(previewId, true);
    }
  } catch (e) {}
});

// 상품 카드 하나 (홈 슬라이더·꽃 둘러보기에서 함께 사용, 재고 상태·견적 문의·찜 하트 반영)
function buildProductCard(p) {
  const tp = typeof tProduct === 'function' ? tProduct(p) : p;
  const card = document.createElement('div');
  card.className = 'group cursor-pointer flex flex-col';
  card.dataset.productId = p.id;
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
        <span class="absolute top-2.5 left-2.5 max-w-[calc(100%-3.75rem)] bg-seal-red text-white text-[11px] leading-tight font-bold px-2 py-1 rounded-xs shadow">
          ${lowText}
        </span>
      `;
    }
  }

  const meaningPrefix = typeof t === 'function' ? t('pdp_meaning_prefix', '꽃말: ') : '꽃말: ';
  const inSeason = typeof isProductInSeason === 'function' && isProductInSeason(p);
  const seasonText = typeof t === 'function' ? t('season_now', '🌿 지금이 제철') : '🌿 지금이 제철';
  const cover = (Array.isArray(p.images) && p.images[0]) || p.image;

  card.innerHTML = `
    <div class="hanok-card p-3 transition-all duration-300">
      <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
      <div class="card-media relative aspect-[3/4] overflow-hidden bg-[#ECE8E1]">
        <img loading="lazy" decoding="async" src="${htmlText(cover)}" alt="${htmlText(tp.name)}" class="${imgClass}">
        ${badgeHtml}
        ${inSeason ? `<span class="season-badge absolute left-2.5 bottom-2.5 z-[1] inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white/90 border border-emerald-200 px-2 py-0.5 rounded-xs shadow-xs">${seasonText}</span>` : ''}
        <!-- 호버 시 시적 글귀 노출 -->
        <div class="card-hover-overlay absolute inset-0 bg-gradient-to-t from-ink-black/85 via-ink-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
          <p class="font-serif text-base sm:text-lg text-white/95 mb-1.5 leading-snug font-semibold italic line-clamp-2">"${htmlText(tp.poeticLine)}"</p>
          <div class="flex items-center gap-1.5 text-sm text-white/90">
            <span class="w-1 h-3 bg-seal-red rounded-xs"></span>
            <span>${meaningPrefix}${htmlText(tp.flowerMeaning)}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 카드 하단 정보 -->
    <div class="mt-3 text-center space-y-1">
      <h3 class="text-sm sm:text-base font-bold text-ink-black tracking-tight group-hover:text-seal-red transition-colors">${htmlText(tp.name)}</h3>
      <!-- 터치 화면용 시적 글귀 -->
      <p class="touch-poetic-line hidden font-serif text-xs sm:text-sm text-seal-red italic line-clamp-1 px-1">"${htmlText(tp.poeticLine)}"</p>
      <p class="text-sm font-semibold ${stockStatus === 'out_of_stock' ? 'text-ink-light' : 'text-ink-gray'}">${priceDisplay}</p>
    </div>
  `;

  // 찜 하트 (카드를 누르면 상품 페이지, 하트만 누르면 찜)
  if (typeof isWished === 'function') {
    const heart = document.createElement('button');
    heart.type = 'button';
    heart.className = 'card-wish-btn absolute top-2 right-2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-lg leading-none cursor-pointer';
    const paint = () => {
      const on = isWished(p.id);
      heart.textContent = on ? '♥' : '♡';
      heart.classList.toggle('text-seal-red', on);
      heart.classList.toggle('text-ink-black', !on);
      heart.setAttribute('aria-pressed', on ? 'true' : 'false');
      heart.setAttribute('aria-label', `${tp.name} ${on ? (typeof t === 'function' ? t('wish_remove', '찜 해제') : '찜 해제') : (typeof t === 'function' ? t('wish_add', '찜하기') : '찜하기')}`);
    };
    heart.onclick = ev => { ev.stopPropagation(); toggleWish(p.id); paint(); };
    paint();
    card.querySelector('.card-media').appendChild(heart);
  }
  return card;
}

// 홈 '제철 꽃 컬렉션'에 보일 상품: 관리자에서 '홈에 숨기기'가 아닌 것, '홈 순서'가 작은 것부터,
// 순서를 안 정한 상품끼리는 지금 제철인 꽃이 든 상품이 먼저 (꽃 사전 flowers-data.js)
const HOME_SLIDER_MAX = 12;

function homeOrderOf(p) {
  return typeof p.homeOrder === 'number' && Number.isFinite(p.homeOrder) ? p.homeOrder : 999;
}

function homeProducts(category) {
  const list = loadProducts()
    .filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true)
    .filter(p => !p.hideOnHome)
    .filter(p => category === 'all' || p.category === category);
  const flowers = typeof loadFlowers === 'function' ? loadFlowers() : [];
  const seasonRank = p => (typeof isProductInSeason === 'function' && isProductInSeason(p, flowers) ? 0 : 1);
  return list.map((p, i) => ({ p, i, s: seasonRank(p) }))
    .sort((a, b) => (homeOrderOf(a.p) - homeOrderOf(b.p)) || (a.s - b.s) || (a.i - b.i))
    .map(x => x.p);
}

// 1. 홈 상품 슬라이더 (4개씩 보이고 옆으로 넘김)
function renderProducts(category) {
  if (!category) category = currentCategory || 'all';
  currentCategory = category;
  const grid = document.getElementById('product-grid');
  if (grid) {
    grid.innerHTML = '';
    // 홈에는 앞쪽 12개만 (나머지는 '꽃 전체 둘러보기')
    const items = homeProducts(category).slice(0, HOME_SLIDER_MAX);
    items.forEach(p => {
      const slide = document.createElement('div');
      slide.className = 'home-slide shrink-0 snap-start w-[78%] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-6rem)/4)]';
      slide.appendChild(buildProductCard(p));
      grid.appendChild(slide);
    });
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'w-full text-center text-sm text-ink-gray py-16';
      empty.textContent = typeof t === 'function' ? t('browse_empty', '조건에 맞는 꽃이 없어요.') : '조건에 맞는 꽃이 없어요.';
      grid.appendChild(empty);
    }
    grid.scrollLeft = 0;
    updateHomeSliderArrows();
    requestAnimationFrame(updateHomeSliderArrows);
  }
  renderCategoryPills();
  if (typeof refreshFlowersPage === 'function') refreshFlowersPage();
  if (typeof refreshDictionaryPage === 'function') refreshDictionaryPage();
  updateHeroRecommendButton();
  if (typeof startCtaPicker === 'function' && document.getElementById('cta-picker-row')?.children.length) startCtaPicker();
}

function scrollHomeSlider(dir) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.scrollBy({ left: dir * grid.clientWidth, behavior: 'smooth' });
}

function updateHomeSliderArrows() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const prev = document.getElementById('home-slider-prev');
  const next = document.getElementById('home-slider-next');
  const max = grid.scrollWidth - grid.clientWidth - 4;
  if (prev) prev.disabled = grid.scrollLeft <= 4;
  if (next) next.disabled = grid.scrollLeft >= max;
}

// 홈 종류 버튼 (전체 + 상품 종류)
function renderCategoryPills() {
  const box = document.getElementById('home-category-pills');
  if (!box) return;
  box.innerHTML = '';
  [{ id: 'all', key: 'cat_all', label: '전체 둘러보기' }, ...PRODUCT_CATEGORIES].forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = `cat-${c.id}`;
    b.textContent = typeof t === 'function' ? t(c.key, c.label) : c.label;
    b.onclick = () => filterCategory(c.id);
    const on = (currentCategory || 'all') === c.id;
    b.className = `cat-pill px-4 py-2 text-xs sm:text-sm font-semibold rounded-xs cursor-pointer ${on ? 'bg-ink-black text-white shadow-xs' : 'bg-[#FAF7F2] text-ink-gray hover:text-ink-black border border-ink-black/10'}`;
    box.appendChild(b);
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
// 이달의 추천 = 홈 '제철 꽃 컬렉션' 맨 앞 상품 (관리자 홈 순서 → 지금 제철 → 목록 순서)
function heroRecommendProduct() {
  return homeProducts('all')[0] || loadProducts().find(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true) || null;
}

function openHeroRecommendProduct() {
  const target = heroRecommendProduct();
  if (target) openProductDetail(target.id);
}

function updateHeroRecommendButton() {
  const btn = document.getElementById('hero-recommend-btn');
  if (!btn) return;
  const target = heroRecommendProduct();
  btn.classList.toggle('hidden', !target);
  const label = document.getElementById('hero-recommend-label');
  if (target && label) {
    const name = (typeof tProduct === 'function' ? tProduct(target) : target).name;
    label.textContent = (typeof t === 'function' ? t('hero_btn_recommend_fmt', '이달의 추천 : {name} 보기') : '이달의 추천 : {name} 보기').replace('{name}', name);
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

// 화면 아래 잠깐 뜨는 안내 (예: 없는 상품 주소로 들어왔을 때)
function showToast(message) {
  let el = document.getElementById('shop-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'shop-toast';
    el.setAttribute('role', 'status');
    el.className = 'fixed left-1/2 -translate-x-1/2 bottom-24 z-[90] max-w-[90vw] px-4 py-2.5 rounded-full bg-ink-black text-white text-sm font-bold shadow-lg transition-opacity duration-300 opacity-0 pointer-events-none';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove('opacity-0');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.classList.add('opacity-0'), 3200);
}

// 들어갈 수 없는 주소면 홈으로 가면서 주소도 홈으로 바꾸고 알려 줌
function goHomeWithNotice(key, fallback) {
  showView('shop');
  if (typeof setRouteHash === 'function') setRouteHash('#/', true);
  showToast(typeof t === 'function' ? t(key, fallback) : fallback);
}

// 모서리 무늬 붙이기: el 안에 꽃살 위치용 span 4개 (mk: ajasal·cloud·gyeop·maedeup·ttisal·lotus, 비우면 꽃살)
function addCornerMarks(el, mk, which = ['tl', 'tr', 'bl', 'br']) {
  if (!el) return el;
  el.classList.add('relative');
  which.forEach(w => {
    const s = document.createElement('span');
    s.className = `kkotsal ${w}${mk ? ' mk-' + mk : ''}`;
    s.setAttribute('aria-hidden', 'true');
    el.appendChild(s);
  });
  return el;
}

// ----------------------------------------------------
// 홈 화면 고객 후기 슬라이더 & 리뷰 탭 로직
// ----------------------------------------------------
let currentReviewFilter = 'all'; // all, media, 5, 4, 3, 2, 1
let currentReviewSort = 'latest'; // latest, high, low
let currentReviewPage = 1;
const REVIEWS_PER_PAGE = 12;

function scrollHomeReviews(direction) {
  const track = document.getElementById('home-reviews-track');
  if (track) {
    track.scrollBy({ left: direction * 330, behavior: 'smooth' });
  }
}

function renderHomeReviewsSlider() {
  const sec = document.getElementById('home-reviews-section');
  const track = document.getElementById('home-reviews-track');
  if (!sec || !track) return;

  const allRevs = typeof loadReviews === 'function' ? loadReviews() : [];
  const approved = allRevs.filter(r => r.status === 'approved');

  const isPreview = (typeof isPreviewMode !== 'undefined' && isPreviewMode) ||
                    (new URLSearchParams(window.location.search).get('preview') === '1');

  // 승인된 후기가 없거나, 모두 예시 후기인데 미리보기가 아니면 섹션 숨김
  const realCount = approved.filter(r => !r.isSample).length;
  if (approved.length === 0 || (!isPreview && realCount === 0 && approved.every(r => r.isSample))) {
    sec.classList.add('hidden');
    return;
  }
  sec.classList.remove('hidden');

  // 최신순 10개
  const list = approved.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 10);
  track.innerHTML = '';

  list.forEach(r => {
    const card = document.createElement('div');
    card.className = 'w-[280px] sm:w-[320px] shrink-0 bg-[#FAF7F2] border border-ink-black/10 rounded-sm p-4 space-y-3 cursor-pointer hover:border-seal-red/40 transition-colors flex flex-col justify-between';
    card.onclick = () => {
      if (typeof switchView === 'function') switchView('reviews');
    };

    let photoArr = [];
    try { photoArr = Array.isArray(r.photos) ? r.photos : JSON.parse(r.photos || '[]'); } catch (e) {}

    const starStr = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
    const dateStr = r.createdAt ? r.createdAt.slice(0, 10).replace(/-/g, '.') : '';

    card.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-amber-500 font-bold">${starStr}</span>
          <span class="text-ink-gray text-[11px]">${dateStr}</span>
        </div>
        <p class="text-xs font-bold text-ink-black truncate">${htmlText(r.productName || '설담화 꽃')}</p>
        <p class="text-xs text-ink-charcoal line-clamp-3 leading-relaxed">${htmlText(r.text || '')}</p>
      </div>
      <div class="pt-2 border-t border-ink-black/5 flex items-center justify-between text-[11px] text-ink-gray">
        <div class="flex items-center gap-1.5">
          ${photoArr.length > 0 ? `<span class="inline-flex items-center gap-0.5">📷 ${photoArr.length}</span>` : ''}
          ${r.video ? `<span>🎬 영상</span>` : ''}
        </div>
        ${r.adminReply ? `<span class="text-seal-red font-medium">답글 도착</span>` : ''}
      </div>
    `;
    track.appendChild(card);
  });
}

function setReviewFilter(filter) {
  currentReviewFilter = filter;
  currentReviewPage = 1;

  document.querySelectorAll('.review-filter-btn').forEach(btn => {
    const match = btn.dataset.filter === filter;
    btn.className = `review-filter-btn px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
      match ? 'bg-ink-black text-white' : 'bg-white border border-ink-black/15 text-ink-charcoal hover:bg-hanji'
    }`;
  });

  renderReviewsList();
}

function changeReviewSort(sort) {
  currentReviewSort = sort;
  currentReviewPage = 1;
  renderReviewsList();
}

function renderReviewsPage() {
  const allRevs = typeof loadReviews === 'function' ? loadReviews() : [];
  const approved = allRevs.filter(r => r.status === 'approved');

  // 통계 계산
  const total = approved.length;
  const avg = total > 0 ? (approved.reduce((s, r) => s + (Number(r.rating) || 5), 0) / total).toFixed(1) : '0.0';

  const avgRatingEl = document.getElementById('reviews-avg-rating');
  if (avgRatingEl) avgRatingEl.textContent = avg;

  const totalCountEl = document.getElementById('reviews-total-count');
  if (totalCountEl) totalCountEl.textContent = `${total}개의 후기`;

  const avgStarsEl = document.getElementById('reviews-avg-stars');
  if (avgStarsEl) {
    const rounded = Math.round(Number(avg) || 0);
    avgStarsEl.textContent = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  }

  // 5~1점 바 차트
  const barsWrap = document.getElementById('reviews-rating-bars') || document.getElementById('reviews-star-bars');
  if (barsWrap) {
    barsWrap.innerHTML = '';
    [5, 4, 3, 2, 1].forEach(star => {
      const count = approved.filter(r => (Number(r.rating) || 5) === star).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;

      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 text-xs';
      row.innerHTML = `
        <span class="w-7 text-right text-ink-gray font-medium">${star}점</span>
        <div class="flex-1 h-2 bg-ink-black/10 rounded-full overflow-hidden">
          <div class="h-full bg-amber-400 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
        </div>
        <span class="w-8 text-ink-gray text-[11px]">${count}건</span>
      `;
      barsWrap.appendChild(row);
    });
  }

  renderReviewsList();
}

function renderReviewsList() {
  const grid = document.getElementById('reviews-grid');
  const emptyState = document.getElementById('reviews-empty-state') || document.getElementById('reviews-empty');
  const pagesWrap = document.getElementById('reviews-pages');
  if (!grid) return;

  const allRevs = typeof loadReviews === 'function' ? loadReviews() : [];
  let list = allRevs.filter(r => r.status === 'approved');

  // 필터 적용
  if (currentReviewFilter === 'media') {
    list = list.filter(r => {
      let p = [];
      try { p = Array.isArray(r.photos) ? r.photos : JSON.parse(r.photos || '[]'); } catch (e) {}
      return p.length > 0 || !!r.video;
    });
  } else if (['1', '2', '3', '4', '5'].includes(currentReviewFilter)) {
    const star = Number(currentReviewFilter);
    list = list.filter(r => (Number(r.rating) || 5) === star);
  }

  // 정렬 적용
  if (currentReviewSort === 'high' || currentReviewSort === 'rating_high') {
    list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
  } else if (currentReviewSort === 'low' || currentReviewSort === 'rating_low') {
    list.sort((a, b) => (Number(a.rating) || 5) - (Number(b.rating) || 5));
  } else {
    // 최신순
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  if (list.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (pagesWrap) pagesWrap.innerHTML = '';
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  // 페이지네이션
  const totalPages = Math.ceil(list.length / REVIEWS_PER_PAGE);
  if (currentReviewPage > totalPages) currentReviewPage = 1;
  const startIdx = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
  const pageItems = list.slice(startIdx, startIdx + REVIEWS_PER_PAGE);

  grid.innerHTML = '';
  pageItems.forEach(r => {
    const card = document.createElement('article');
    card.className = 'relative bg-[#FAF7F2] border border-ink-black/10 rounded-sm p-5 md:p-6 space-y-4 shadow-xs flex flex-col justify-between';
    addCornerMarks(card, 'lotus');

    let photoArr = [];
    try { photoArr = Array.isArray(r.photos) ? r.photos : JSON.parse(r.photos || '[]'); } catch (e) {}

    const starStr = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
    const dateStr = r.createdAt ? r.createdAt.slice(0, 10).replace(/-/g, '.') : '';

    // 사진 썸네일 HTML
    let photosHtml = '';
    if (photoArr.length > 0) {
      photosHtml = `
        <div class="flex gap-2 pt-2 flex-wrap">
          ${photoArr.map(src => `
            <img src="${src}" alt="후기 사진" class="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xs border border-ink-black/10 cursor-pointer hover:opacity-90" onclick="openReviewPhotoModal('${src}')" />
          `).join('')}
        </div>
      `;
    }

    // 동영상 플레이어 HTML
    let videoHtml = '';
    if (r.video) {
      videoHtml = `
        <div class="pt-2">
          <video src="${r.video}" controls playsinline preload="metadata" class="w-full max-h-60 rounded-xs bg-black"></video>
        </div>
      `;
    }

    // 사장님 답글 HTML
    let replyHtml = '';
    if (r.adminReply) {
      const repDate = r.replyAt ? r.replyAt.slice(0, 10).replace(/-/g, '.') : '';
      replyHtml = `
        <div class="mt-4 p-3.5 bg-hanji/90 border-l-2 border-seal-red rounded-xs space-y-1.5 text-xs">
          <div class="flex items-center justify-between font-bold text-ink-black">
            <span class="flex items-center gap-1.5 text-seal-red">
              <span class="text-sm">🌸</span> 설담화의 답글
            </span>
            <span class="text-[11px] font-normal text-ink-gray">${repDate}</span>
          </div>
          <p class="text-ink-charcoal leading-relaxed whitespace-pre-wrap">${htmlText(r.adminReply)}</p>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-amber-500 font-bold text-base tracking-wide">${starStr}</span>
          <span class="text-ink-gray text-xs">${dateStr}</span>
        </div>
        <div class="text-xs font-bold text-ink-gray">
          <span>구매 상품: </span>
          <button type="button" class="underline text-ink-black hover:text-seal-red cursor-pointer" onclick="openProductDetail('${r.productId}')">${htmlText(r.productName || '설담화 꽃')}</button>
        </div>
        <p class="text-sm text-ink-black leading-relaxed whitespace-pre-wrap">${htmlText(r.text || '')}</p>
        ${photosHtml}
        ${videoHtml}
      </div>
      ${replyHtml}
    `;
    grid.appendChild(card);
  });

  // 페이지네이션 번호 버튼
  if (pagesWrap) {
    pagesWrap.innerHTML = '';
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-8 h-8 rounded-xs text-xs font-bold cursor-pointer transition-colors ${
          i === currentReviewPage ? 'bg-ink-black text-white' : 'bg-white border border-ink-black/15 text-ink-charcoal hover:bg-hanji'
        }`;
        btn.textContent = i;
        btn.onclick = () => {
          currentReviewPage = i;
          renderReviewsList();
          window.scrollTo({ top: 300, behavior: 'smooth' });
        };
        pagesWrap.appendChild(btn);
      }
    }
  }
}
