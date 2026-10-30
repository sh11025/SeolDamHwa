// assets/js/shop/shop-browse.js
// 설담화 쇼핑몰: 꽃 둘러보기 페이지 (#/flowers, #/flowers/<종류>)
// 종류·가격대·색·상황으로 거르고, 정렬하고, 12개씩 더 보기. 상품 카드는 shop-core.js의 buildProductCard()를 씁니다.

const BROWSE_PAGE_SIZE = 12;
const BROWSE_CATEGORIES = [
  { id: 'all', key: 'cat_all', label: '전체 둘러보기' },
  { id: 'bouquet', key: 'cat_bouquet', label: '꽃다발' },
  { id: 'basket', key: 'cat_basket', label: '꽃바구니' },
  { id: 'space', key: 'cat_space', label: '웨딩·공간' }
];
const BROWSE_PRICES = [
  { id: 'all', key: 'price_all', label: '모든 가격' },
  { id: 'under5', key: 'price_under5', label: '5만 원 미만', test: p => !p.inquiryOnly && productMinPriceOf(p) < 50000 },
  { id: '5to10', key: 'price_5to10', label: '5만~10만 원', test: p => !p.inquiryOnly && productMinPriceOf(p) >= 50000 && productMinPriceOf(p) < 100000 },
  { id: 'over10', key: 'price_over10', label: '10만 원 이상', test: p => !p.inquiryOnly && productMinPriceOf(p) >= 100000 },
  { id: 'inquiry', key: 'price_inquiry', label: '상담 후 견적', test: p => !!p.inquiryOnly }
];
const BROWSE_SORTS = [
  { id: 'recommend', key: 'sort_recommend', label: '추천순' },
  { id: 'price_asc', key: 'sort_price_asc', label: '낮은 가격순' },
  { id: 'price_desc', key: 'sort_price_desc', label: '높은 가격순' }
];

let browseState = { category: 'all', price: 'all', color: '', occasion: '', sort: 'recommend', shown: BROWSE_PAGE_SIZE };

function brT(key, fallback) {
  return typeof t === 'function' ? t(key, fallback) : fallback;
}

function productMinPriceOf(p) {
  const prices = p.sizes && p.sizes.length ? p.sizes.map(s => Number(s.price) || 0) : [Number(p.price) || 0];
  return Math.min(...prices);
}

// 색·상황 태그: 기본 상품은 CURATION_TAGS, 관리자가 만든 상품은 p.curationTags
function productTagsOf(p) {
  return (typeof CURATION_TAGS !== 'undefined' && CURATION_TAGS[p.id]) || p.curationTags || {};
}

// 맞춤 담화 질문의 선택지를 그대로 사용 (색은 '잘 모르겠어요' 제외)
function curationOptions(field) {
  if (typeof CURATION_QUESTIONS === 'undefined') return [];
  const q = CURATION_QUESTIONS.find(x => x.field === field);
  return q ? q.options.filter(o => !o.isNeutral) : [];
}

function browseResults() {
  const s = browseState;
  const priceRule = BROWSE_PRICES.find(x => x.id === s.price);
  let list = loadProducts()
    .filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true)
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => s.category === 'all' || p.category === s.category)
    .filter(({ p }) => !priceRule || !priceRule.test || priceRule.test(p))
    .filter(({ p }) => !s.color || (productTagsOf(p).colors || []).includes(s.color))
    .filter(({ p }) => !s.occasion || (productTagsOf(p).occasions || []).includes(s.occasion));
  const priceKey = x => (x.p.inquiryOnly ? Infinity : productMinPriceOf(x.p));
  if (s.sort === 'price_asc') list.sort((a, b) => (priceKey(a) - priceKey(b)) || (a.i - b.i));
  else if (s.sort === 'price_desc') list.sort((a, b) => ((a.p.inquiryOnly ? 1 : 0) - (b.p.inquiryOnly ? 1 : 0)) || (productMinPriceOf(b.p) - productMinPriceOf(a.p)) || (a.i - b.i));
  else list.sort((a, b) => (homeOrderOf(a.p) - homeOrderOf(b.p)) || (a.i - b.i));
  return list.map(x => x.p);
}

function ensureFlowersView() {
  let view = document.getElementById('view-flowers');
  if (view) return view;
  view = document.createElement('div');
  view.id = 'view-flowers';
  view.className = 'hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14';
  document.querySelector('main').appendChild(view);
  return view;
}

function browseSelect(id, label, options, value, onChange) {
  const wrap = document.createElement('label');
  wrap.className = 'flex flex-col gap-1 text-[11px] font-bold text-ink-gray';
  wrap.textContent = label;
  const sel = document.createElement('select');
  sel.id = id;
  sel.className = 'bg-white border border-ink-black/20 py-2 px-2 rounded-xs text-sm font-semibold text-ink-black cursor-pointer';
  options.forEach(([v, text]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = text;
    sel.appendChild(o);
  });
  sel.value = value;
  sel.onchange = () => onChange(sel.value);
  wrap.appendChild(sel);
  return wrap;
}

function renderFlowersPage() {
  const view = ensureFlowersView();
  const s = browseState;
  view.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'text-center max-w-2xl mx-auto mb-8 space-y-2';
  const h = document.createElement('h1');
  h.className = 'text-2xl sm:text-3xl font-extrabold text-ink-black tracking-tight';
  h.textContent = brT('browse_title', '꽃 둘러보기');
  const d = document.createElement('p');
  d.className = 'text-sm text-ink-gray';
  d.textContent = brT('browse_desc', '종류·가격대·색·상황으로 골라 보세요.');
  head.append(h, d);
  view.appendChild(head);

  // 종류 (주소에도 반영: #/flowers/bouquet)
  const pills = document.createElement('div');
  pills.className = 'flex flex-wrap items-center justify-center gap-2 mb-5';
  BROWSE_CATEGORIES.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    const on = s.category === c.id;
    b.className = `px-4 py-2 text-xs sm:text-sm font-semibold rounded-xs cursor-pointer ${on ? 'bg-ink-black text-white shadow-xs' : 'bg-[#FAF7F2] text-ink-gray hover:text-ink-black border border-ink-black/10'}`;
    b.textContent = brT(c.key, c.label);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.onclick = () => {
      browseState.category = c.id;
      browseState.shown = BROWSE_PAGE_SIZE;
      if (typeof setRouteHash === 'function') setRouteHash(c.id === 'all' ? '#/flowers' : `#/flowers/${c.id}`, true);
      renderFlowersPage();
    };
    pills.appendChild(b);
  });
  view.appendChild(pills);

  // 가격대 · 색 · 상황 · 정렬
  const set = (key) => (v) => { browseState[key] = v; browseState.shown = BROWSE_PAGE_SIZE; renderFlowersPage(); };
  const bar = document.createElement('div');
  bar.className = 'grid grid-cols-2 md:grid-cols-4 gap-3 pb-6 border-b border-ink-black/10';
  bar.append(
    browseSelect('browse-price', brT('browse_price', '가격대'), BROWSE_PRICES.map(x => [x.id, brT(x.key, x.label)]), s.price, set('price')),
    browseSelect('browse-color', brT('browse_color', '색'), [['', brT('any_color', '모든 색')], ...curationOptions('color').map(o => [o.label, brT(o.i18nKey, o.label)])], s.color, set('color')),
    browseSelect('browse-occasion', brT('browse_occasion', '상황'), [['', brT('any_occasion', '모든 상황')], ...curationOptions('occasion').map(o => [o.label, brT(o.i18nKey, o.label)])], s.occasion, set('occasion')),
    browseSelect('browse-sort', brT('browse_sort', '정렬'), BROWSE_SORTS.map(x => [x.id, brT(x.key, x.label)]), s.sort, v => { browseState.sort = v; renderFlowersPage(); })
  );
  view.appendChild(bar);

  const results = browseResults();
  const filtered = s.price !== 'all' || s.color || s.occasion;

  const info = document.createElement('div');
  info.className = 'flex items-center justify-between gap-3 py-4 text-sm';
  const count = document.createElement('p');
  count.id = 'browse-count';
  count.className = 'font-bold text-ink-black';
  count.textContent = brT('browse_count', '{n}개의 꽃').replace('{n}', results.length);
  info.appendChild(count);
  if (filtered) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'text-xs font-bold text-seal-red underline cursor-pointer';
    reset.textContent = brT('browse_reset', '조건 지우기');
    reset.onclick = resetBrowseFilters;
    info.appendChild(reset);
  }
  view.appendChild(info);

  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'text-center py-20 space-y-4';
    const p = document.createElement('p');
    p.className = 'text-sm text-ink-gray';
    p.textContent = brT('browse_empty', '조건에 맞는 꽃이 없어요.');
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'px-5 py-2.5 text-sm font-bold border border-ink-black/20 bg-white rounded-xs hover:border-seal-red hover:text-seal-red cursor-pointer';
    go.textContent = brT('cta_btn', '맞춤 추천 받기 →');
    go.onclick = () => switchView('custom');
    empty.append(p, go);
    view.appendChild(empty);
  } else {
    const grid = document.createElement('div');
    grid.id = 'browse-grid';
    grid.className = 'grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-14 pt-2';
    results.slice(0, s.shown).forEach(p => grid.appendChild(buildProductCard(p)));
    view.appendChild(grid);
    if (results.length > s.shown) {
      const more = document.createElement('div');
      more.className = 'text-center pt-12';
      const b = document.createElement('button');
      b.type = 'button';
      b.id = 'browse-more-btn';
      b.className = 'px-8 py-3 text-sm font-bold border border-ink-black/25 bg-white rounded-xs hover:border-ink-black cursor-pointer';
      b.textContent = brT('browse_more', '더 보기 ({shown}/{total})').replace('{shown}', Math.min(s.shown, results.length)).replace('{total}', results.length);
      b.onclick = () => { browseState.shown += BROWSE_PAGE_SIZE; renderFlowersPage(); };
      more.appendChild(b);
      view.appendChild(more);
    }
  }
}

function resetBrowseFilters() {
  browseState = { ...browseState, price: 'all', color: '', occasion: '', shown: BROWSE_PAGE_SIZE };
  renderFlowersPage();
}

// 꽃 둘러보기 보이기 (주소에서 들어올 때도 사용)
function showFlowersPage(category) {
  const cat = BROWSE_CATEGORIES.some(c => c.id === category) ? category : 'all';
  if (cat !== browseState.category) browseState = { ...browseState, category: cat, shown: BROWSE_PAGE_SIZE };
  const page = document.getElementById('pdp-modal');
  if (page) page.classList.add('hidden');
  if (typeof hideMainViews === 'function') hideMainViews();
  if (typeof toggleMobileMenu === 'function') toggleMobileMenu(false);
  const view = ensureFlowersView();
  renderFlowersPage();
  view.classList.remove('hidden');
  const nav = document.getElementById('nav-shop');
  if (nav) nav.className = 'nav-btn py-1 text-seal-red font-bold border-b-2 border-seal-red transition-colors';
  document.title = `${brT('browse_title', '꽃 둘러보기')} | 설담화`;
  window.scrollTo({ top: 0 });
}

function openFlowersPage(category) {
  showFlowersPage(category || 'all');
  if (typeof setRouteHash === 'function') setRouteHash(browseState.category === 'all' ? '#/flowers' : `#/flowers/${browseState.category}`);
}

// 언어를 바꾸거나 상품이 바뀌면 보이는 중일 때만 다시 그림 (shop-core.js renderProducts에서 부름)
function refreshFlowersPage() {
  const view = document.getElementById('view-flowers');
  if (view && !view.classList.contains('hidden')) renderFlowersPage();
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof SHOP_ROUTES !== 'undefined') SHOP_ROUTES.flowers = params => showFlowersPage(params[0]);
  const grid = document.getElementById('product-grid');
  if (grid) {
    grid.addEventListener('scroll', () => updateHomeSliderArrows(), { passive: true });
    window.addEventListener('resize', () => updateHomeSliderArrows());
    window.addEventListener('load', () => updateHomeSliderArrows());
    window.addEventListener('hashchange', () => setTimeout(updateHomeSliderArrows, 50));
  }
});
