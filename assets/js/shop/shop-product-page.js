// assets/js/shop/shop-product-page.js
// 설담화 쇼핑몰: 상품 상세 페이지(#/flower/<id>) · 사진 여러 장 · 자세한 설명 · 비슷한 꽃 · 최근 본 꽃 · 찜하기
// 상품 정보·구매 칸 그리기는 shop-product.js의 renderProductPage()가 하고, 이 파일은 페이지 이동과 아래쪽 내용을 맡습니다.

const WISHLIST_KEY = 'seoldamhwa_wishlist';
const RECENT_KEY = 'seoldamhwa_recent';

function ppT(key, fallback) {
  return typeof t === 'function' ? t(key, fallback) : fallback;
}

function readIdList(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
  } catch (e) {
    return [];
  }
}

function writeIdList(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* 저장 공간이 없으면 무시 */ }
}

function isWished(id) {
  return readIdList(WISHLIST_KEY).includes(id);
}

function toggleWish(id) {
  const list = readIdList(WISHLIST_KEY);
  const next = list.includes(id) ? list.filter(x => x !== id) : [id, ...list].slice(0, 50);
  writeIdList(WISHLIST_KEY, next);
  updateWishBadge();
  return next.includes(id);
}

function toggleWishCurrent() {
  if (!currentSelectedProduct) return;
  toggleWish(currentSelectedProduct.id);
  renderWishButton();
}

function renderWishButton() {
  const btn = document.getElementById('pdp-wish-btn');
  if (!btn || !currentSelectedProduct) return;
  const on = isWished(currentSelectedProduct.id);
  btn.textContent = on ? '♥' : '♡';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.setAttribute('aria-label', on ? ppT('wish_remove', '찜 해제') : ppT('wish_add', '찜하기'));
  btn.classList.toggle('text-seal-red', on);
  btn.classList.toggle('border-seal-red', on);
}

function rememberRecent(id) {
  writeIdList(RECENT_KEY, [id, ...readIdList(RECENT_KEY).filter(x => x !== id)].slice(0, 12));
}

function updateWishBadge() {
  const badge = document.getElementById('wish-count-badge');
  if (!badge) return;
  const products = loadProducts().filter(p => typeof isProductVisible !== 'function' || isProductVisible(p));
  const n = readIdList(WISHLIST_KEY).filter(id => products.some(p => p.id === id)).length;
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
  const floatBadge = document.getElementById('wish-float-badge');
  if (floatBadge) {
    floatBadge.textContent = n;
    floatBadge.classList.toggle('hidden', n === 0);
  }
  const fabBadge = document.getElementById('fab-toggle-badge');
  if (fabBadge) {
    fabBadge.textContent = n;
    fabBadge.classList.toggle('hidden', n === 0);
  }
  const panel = document.getElementById('wish-panel');
  if (panel && !panel.classList.contains('hidden')) renderWishPanel();
}

// 화면에 보이는 상품만
function visibleProducts() {
  return loadProducts().filter(p => typeof isProductVisible !== 'function' || isProductVisible(p));
}

function productPriceText(p) {
  if (p.inquiryOnly) return ppT('price_inquiry', '상담 후 견적');
  const prices = (p.sizes && p.sizes.length ? p.sizes.map(s => Number(s.price) || 0) : [Number(p.price) || 0]);
  const min = Math.min(...prices);
  return formatPrice(min) + (prices.length > 1 ? '~' : '');
}

// 작은 상품 카드 (비슷한 꽃·최근 본 꽃·찜 목록에서 함께 사용)
function miniProductCard(p) {
  const tp = typeof tProduct === 'function' ? tProduct(p) : p;
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'group text-left cursor-pointer';
  card.onclick = () => openProductDetail(p.id);
  const imgWrap = document.createElement('div');
  imgWrap.className = 'relative aspect-[4/5] overflow-hidden rounded-xs bg-[#ECE8E1] border border-ink-black/10';
  const img = document.createElement('img');
  img.src = (Array.isArray(p.images) && p.images[0]) || p.image;
  img.alt = tp.name;
  img.loading = 'lazy';
  img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500';
  imgWrap.appendChild(img);
  if (!p.inquiryOnly && typeof p.stockQuantity === 'number' && p.stockQuantity <= 0) {
    const so = document.createElement('span');
    so.className = 'absolute top-2 left-2 px-2 py-0.5 text-[11px] font-bold bg-ink-black/80 text-white rounded-xs';
    so.textContent = ppT('stock_soldout', '일시 품절');
    imgWrap.appendChild(so);
  }
  const name = document.createElement('p');
  name.className = 'mt-2 text-sm font-bold text-ink-black group-hover:text-seal-red line-clamp-1';
  name.textContent = tp.name;
  const price = document.createElement('p');
  price.className = 'text-xs text-ink-gray';
  price.textContent = productPriceText(p);
  card.append(imgWrap, name, price);
  return card;
}

// 사진 여러 장: images 배열(있으면) + 대표 사진
function productImages(p) {
  const list = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  if (p.image && !list.includes(p.image)) list.unshift(p.image);
  return list.length ? list : [p.image];
}

function renderThumbs(p) {
  const box = document.getElementById('pdp-thumbs');
  const main = document.getElementById('pdp-image');
  if (!box || !main) return;
  const imgs = productImages(p);
  main.src = imgs[0];
  box.innerHTML = '';
  box.classList.toggle('hidden', imgs.length < 2);
  imgs.forEach((src, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `aspect-square overflow-hidden rounded-xs border-2 cursor-pointer ${i === 0 ? 'border-seal-red' : 'border-transparent hover:border-ink-black/30'}`;
    b.setAttribute('aria-label', `${i + 1}번째 사진`);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.className = 'w-full h-full object-cover';
    b.appendChild(img);
    b.onclick = () => {
      main.src = src;
      box.querySelectorAll('button').forEach(x => x.className = x.className.replace('border-seal-red', 'border-transparent'));
      b.className = b.className.replace('border-transparent', 'border-seal-red');
    };
    box.appendChild(b);
  });
}

// 비슷한 분위기의 꽃: 같은 종류 + 겹치는 추천 태그가 많은 순
function relatedProducts(p, limit = 4) {
  const tagsOf = x => {
    const tg = (typeof CURATION_TAGS !== 'undefined' && CURATION_TAGS[x.id]) || x.curationTags || {};
    return [].concat(tg.recipients || [], tg.occasions || [], tg.feelings || [], tg.colors || []);
  };
  const mine = new Set(tagsOf(p));
  return visibleProducts()
    .filter(x => x.id !== p.id)
    .map(x => ({ x, score: (x.category === p.category ? 3 : 0) + tagsOf(x).filter(t2 => mine.has(t2)).length + ((x.stockQuantity ?? 1) > 0 ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(o => o.x);
}

function sectionTitle(text) {
  const h = document.createElement('h2');
  h.className = 'text-xl font-extrabold text-ink-black font-serif';
  h.textContent = text;
  return h;
}

// 아래쪽 자세한 설명
function renderProductDetails(p) {
  const root = document.getElementById('pdp-details');
  if (!root) return;
  root.innerHTML = '';
  const tp = typeof tProduct === 'function' ? tProduct(p) : p;

  // 1) 이 꽃에 담긴 이야기 (꽃 사전이 연결되면 사용한 꽃별 설명이 함께 나옴)
  const story = document.createElement('div');
  story.className = 'space-y-4';
  story.appendChild(sectionTitle(ppT('pdp_section_story', '이 꽃에 담긴 이야기')));
  // 설명 한 칸 + 그 아래 쓰인 꽃 이름 한 줄 (꽃이 많아도 칸이 길어지지 않음)
  const storyBox = document.createElement('div');
  storyBox.className = 'bg-white/70 border border-ink-black/10 rounded-xs p-5 space-y-4';
  const intro = document.createElement('div');
  intro.className = 'space-y-2 text-sm leading-relaxed';
  const poetic = document.createElement('p');
  poetic.className = 'font-serif text-seal-red font-semibold text-base';
  poetic.textContent = `"${tp.poeticLine || ''}"`;
  const desc = document.createElement('p');
  desc.className = 'text-ink-charcoal';
  desc.textContent = tp.description || '';
  intro.append(poetic, desc);
  storyBox.appendChild(intro);
  const flowersBox = document.createElement('div');
  flowersBox.id = 'pdp-flowers';
  flowersBox.className = 'space-y-2 pt-4 border-t border-ink-black/10';
  if (typeof renderProductFlowers === 'function' && renderProductFlowers(p, flowersBox)) {
    // 꽃 사전에서 채움 (shop-flowers.js)
  } else if (tp.flowerMeaning) {
    const m = document.createElement('div');
    m.className = 'text-sm';
    const label = document.createElement('p');
    label.className = 'text-xs font-bold text-ink-gray mb-1';
    label.textContent = ppT('pdp_flower_meaning', '꽃과 꽃말');
    const v = document.createElement('p');
    v.className = 'font-bold text-ink-black';
    v.textContent = tp.flowerMeaning;
    m.append(label, v);
    flowersBox.appendChild(m);
  }
  if (flowersBox.childNodes.length) storyBox.appendChild(flowersBox);
  addCornerMarks(storyBox, 'lotus');
  story.appendChild(storyBox);
  root.appendChild(story);

  // 1-2) 꽃별 관리 안내 (꽃 사전의 글·사진·영상)
  const guideSec = typeof buildFlowerGuideSection === 'function' ? buildFlowerGuideSection(p, sectionTitle) : null;
  if (guideSec) root.appendChild(guideSec);

  // 2) 포장·배송·관리·교환환불 (정성 안내 페이지 내용을 접어서)
  if (typeof loadPages === 'function') {
    const info = document.createElement('div');
    info.className = 'space-y-3';
    info.appendChild(sectionTitle(ppT('pdp_section_info', '받기 전에 알아 두세요')));
    const pages = loadPages();
    const titleKeys = { bojagi: 'footer_link_bojagi', delivery: 'footer_link_delivery', care: 'footer_link_care', refund: 'footer_link_refund' };
    ['bojagi', 'delivery', 'care', 'refund'].forEach((id, i) => {
      const d = document.createElement('details');
      d.className = 'group bg-white/70 border border-ink-black/10 rounded-xs';
      if (i === 0) d.open = true;
      const sm = document.createElement('summary');
      sm.className = 'cursor-pointer select-none px-5 py-3.5 font-bold text-ink-black flex items-center justify-between';
      sm.innerHTML = '<span></span><span class="text-ink-gray group-open:rotate-180 transition-transform">▾</span>';
      sm.firstChild.textContent = ppT(titleKeys[id], pages[id].title);
      const body = document.createElement('div');
      body.className = 'info-page-body px-5 pb-5 text-sm text-ink-charcoal leading-relaxed';
      body.innerHTML = renderPageBody(pages[id].body); // renderPageBody는 글자를 안전하게 바꿔 줌
      d.append(sm, body);
      info.appendChild(d);
    });
    root.appendChild(info);
  }

  // 3) 비슷한 분위기의 꽃
  const rel = relatedProducts(p);
  if (rel.length) {
    const sec = document.createElement('div');
    sec.className = 'space-y-4';
    sec.appendChild(sectionTitle(ppT('pdp_related', '비슷한 분위기의 꽃')));
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';
    rel.forEach(x => grid.appendChild(miniProductCard(x)));
    sec.appendChild(grid);
    root.appendChild(sec);
  }

  // 4) 최근 본 꽃
  const products = visibleProducts();
  const recent = readIdList(RECENT_KEY).filter(id => id !== p.id).map(id => products.find(x => x.id === id)).filter(Boolean).slice(0, 6);
  if (recent.length) {
    const sec = document.createElement('div');
    sec.className = 'space-y-4';
    sec.appendChild(sectionTitle(ppT('pdp_recent', '최근 본 꽃')));
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-3 md:grid-cols-6 gap-3';
    recent.forEach(x => grid.appendChild(miniProductCard(x)));
    sec.appendChild(grid);
    root.appendChild(sec);
  }
}

function hideMainViews() {
  ['view-shop', 'view-story', 'view-custom', 'view-guide', 'view-wishlist', 'view-flowers', 'view-dictionary', 'checkout-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn').forEach(btn => { btn.className = 'nav-btn py-1 text-ink-charcoal hover:text-seal-red transition-colors'; });
}

// 상품 페이지 열기 (주소 #/flower/<id>)
function openProductDetail(productId, isPreview = false, fromRoute = false) {
  renderProductPage(productId, isPreview);
  const page = document.getElementById('pdp-modal');
  if (!page || page.classList.contains('hidden') || !currentSelectedProduct || currentSelectedProduct.id !== productId) {
    if (fromRoute) goHomeWithNotice('route_no_product', '찾는 상품이 없거나 지금은 볼 수 없어요.'); // 없는 상품이나 비공개 상품 주소
    return;
  }
  hideMainViews();
  if (typeof toggleMobileMenu === 'function') toggleMobileMenu(false);
  const p = currentSelectedProduct;
  const tp = typeof tProduct === 'function' ? tProduct(p) : p;
  document.getElementById('pdp-crumb-name').textContent = tp.name;
  const crumbCat = document.getElementById('pdp-crumb-cat');
  crumbCat.textContent = ppT(`cat_${p.category}`, p.category);
  crumbCat.setAttribute('href', `#/flowers/${p.category}`);
  renderThumbs(p);
  renderProductDetails(p);
  renderWishButton();
  if (!isPreview) rememberRecent(p.id);
  document.title = `${tp.name} | 설담화`;
  if (!fromRoute) window.__seoldamhwaInternalNav = true;
  if (!fromRoute && !isPreview && typeof setRouteHash === 'function') setRouteHash(`#/flower/${encodeURIComponent(productId)}`);
  window.scrollTo({ top: 0 });
}

// 상품 페이지에서 나가기: 사이트 안에서 왔으면 바로 전 화면으로,
// 바로 들어왔으면(새로고침·공유 링크) 그 상품 종류의 꽃 둘러보기로
function leaveProductPage() {
  if (window.__seoldamhwaInternalNav) { history.back(); return; }
  const cat = currentSelectedProduct ? currentSelectedProduct.category : 'all';
  if (typeof openFlowersPage === 'function') openFlowersPage(cat);
  else switchView('shop');
}

// 찜한 꽃 · 최근 본 꽃 페이지 (#/wishlist)
function ensureWishlistView() {
  let view = document.getElementById('view-wishlist');
  if (view) return view;
  view = document.createElement('div');
  view.id = 'view-wishlist';
  view.className = 'hidden max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10';
  document.querySelector('main').appendChild(view);
  return view;
}

function showWishlistPage() {
  const view = ensureWishlistView();
  const page = document.getElementById('pdp-modal');
  if (page) page.classList.add('hidden');
  hideMainViews();
  view.classList.remove('hidden');
  view.innerHTML = '';
  const products = visibleProducts();
  const blocks = [
    [ppT('wish_title', '찜한 꽃'), readIdList(WISHLIST_KEY), ppT('wish_empty', '아직 찜한 꽃이 없어요. 상품 페이지의 ♡를 눌러 보세요.')],
    [ppT('pdp_recent', '최근 본 꽃'), readIdList(RECENT_KEY), ppT('recent_empty', '아직 본 꽃이 없어요.')]
  ];
  blocks.forEach(([title, ids, empty]) => {
    const sec = document.createElement('section');
    sec.className = 'space-y-4';
    sec.appendChild(sectionTitle(title));
    const items = ids.map(id => products.find(x => x.id === id)).filter(Boolean);
    if (!items.length) {
      const e = document.createElement('p');
      e.className = 'text-sm text-ink-gray py-6';
      e.textContent = empty;
      sec.appendChild(e);
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-2 md:grid-cols-4 gap-5';
      items.forEach(x => grid.appendChild(miniProductCard(x)));
      sec.appendChild(grid);
    }
    view.appendChild(sec);
  });
  document.title = `${ppT('wish_title', '찜한 꽃')} | 설담화`;
  window.scrollTo({ top: 0 });
}

function openWishlist() {
  showWishlistPage();
  if (typeof setRouteHash === 'function') setRouteHash('#/wishlist');
}

document.addEventListener('DOMContentLoaded', () => {
  // 다른 화면으로 가면 상품 페이지·찜 페이지 숨기기
  const originalShowView = showView;
  showView = function (view) {
    const page = document.getElementById('pdp-modal');
    if (page) page.classList.add('hidden');
    const wish = document.getElementById('view-wishlist');
    if (wish) wish.classList.add('hidden');
    const checkout = document.getElementById('checkout-modal');
    if (checkout) checkout.classList.add('hidden');
    ['view-flowers', 'view-dictionary'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    document.title = '설담화 (說談花) | 힙 트래디셔널 플로럴 아틀리에';
    originalShowView(view);
  };
  if (typeof SHOP_ROUTES !== 'undefined') {
    SHOP_ROUTES.flower = params => openProductDetail(params[0], false, true);
    SHOP_ROUTES.wishlist = () => showWishlistPage();
    SHOP_ROUTES.checkout = () => { if (cart.length) openCheckoutModal(); else goHomeWithNotice('route_cart_empty', '장바구니가 비어 있어요. 꽃을 먼저 담아 주세요.'); };
  }
  updateWishBadge();
});

/* ---------- 오른쪽 아래 ♡ 작은 창 (찜한 꽃·최근 본 꽃 사진 줄) ---------- */
function renderWishPanel() {
  const body = document.getElementById('wish-panel-body');
  if (!body) return;
  const products = visibleProducts();
  body.innerHTML = '';
  [
    [ppT('wish_title', '찜한 꽃'), readIdList(WISHLIST_KEY), ppT('wish_empty_short', '상품의 ♡를 누르면 여기에 모여요.')],
    [ppT('pdp_recent', '최근 본 꽃'), readIdList(RECENT_KEY), ppT('recent_empty', '아직 본 꽃이 없어요.')]
  ].forEach(([title, ids, empty]) => {
    const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
    const sec = document.createElement('section');
    sec.className = 'space-y-2';
    const h = document.createElement('p');
    h.className = 'font-bold text-ink-black';
    h.textContent = `${title} ${items.length ? `(${items.length})` : ''}`;
    sec.appendChild(h);
    if (!items.length) {
      const e = document.createElement('p');
      e.className = 'text-ink-gray';
      e.textContent = empty;
      sec.appendChild(e);
    } else {
      const row = document.createElement('div');
      row.className = 'flex gap-2 overflow-x-auto pb-1';
      items.slice(0, 10).forEach(p => {
        const tp = typeof tProduct === 'function' ? tProduct(p) : p;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'w-20 shrink-0 text-left cursor-pointer group';
        b.title = tp.name;
        b.onclick = () => { toggleWishPanel(false); openProductDetail(p.id); };
        const img = document.createElement('img');
        img.src = (Array.isArray(p.images) && p.images[0]) || p.image;
        img.alt = tp.name;
        img.loading = 'lazy';
        img.className = 'w-20 h-24 object-cover rounded-xs border border-ink-black/10 bg-[#ECE8E1] group-hover:border-seal-red';
        const n = document.createElement('span');
        n.className = 'block mt-1 text-[11px] font-bold text-ink-black line-clamp-1 group-hover:text-seal-red';
        n.textContent = tp.name;
        b.append(img, n);
        row.appendChild(b);
      });
      sec.appendChild(row);
    }
    body.appendChild(sec);
  });
}

function toggleWishPanel(open) {
  const panel = document.getElementById('wish-panel');
  const btn = document.getElementById('wish-toggle-btn');
  if (!panel) return;
  const show = typeof open === 'boolean' ? open : panel.classList.contains('hidden');
  if (show && typeof toggleChatPanel === 'function') toggleChatPanel(false);
  panel.classList.toggle('hidden', !show);
  if (btn) btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  if (show) renderWishPanel();
}

window.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') toggleWishPanel(false);
});
