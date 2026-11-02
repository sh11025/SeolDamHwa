// assets/js/shop/shop-browse.js
// 설담화 쇼핑몰: 꽃 둘러보기 페이지 (#/flowers, #/flowers/<종류>)
// 맞춤 담화와 같은 5가지(누구에게·어떤 날·마음·색·예산)로 거르고, 정렬하고, 12개씩 더 보기.
// 선택지와 상품 태그는 맞춤 담화(shop-curation.js CURATION_QUESTIONS, products-data.js CURATION_TAGS)와 같은 것을 씁니다.
// 상품 카드는 shop-core.js의 buildProductCard()를 씁니다.

const BROWSE_PAGE_SIZE = 12;
const BROWSE_CATEGORIES = [
  { id: 'all', key: 'cat_all', label: '전체 둘러보기' },
  { id: 'bouquet', key: 'cat_bouquet', label: '꽃다발' },
  { id: 'basket', key: 'cat_basket', label: '꽃바구니' },
  { id: 'space', key: 'cat_space', label: '웨딩·공간' }
];
// 거르기 칸 = 맞춤 담화 질문 (field → 상품 태그 이름)
const BROWSE_FILTERS = [
  { field: 'recipient', tag: 'recipients', key: 'browse_recipient', label: '누구에게' },
  { field: 'occasion', tag: 'occasions', key: 'browse_occasion', label: '어떤 날' },
  { field: 'feeling', tag: 'feelings', key: 'browse_feeling', label: '마음' },
  { field: 'color', tag: 'colors', key: 'browse_color', label: '색' },
  { field: 'budget', key: 'browse_budget', label: '예산' }
];
// 추천순 기준은 browseResults() 참고
const BROWSE_SORTS = [
  { id: 'recommend', key: 'sort_recommend', label: '추천순' },
  { id: 'price_asc', key: 'sort_price_asc', label: '낮은 가격순' },
  { id: 'price_desc', key: 'sort_price_desc', label: '높은 가격순' }
];

const BROWSE_EMPTY_FILTERS = { recipient: '', occasion: '', feeling: '', color: '', budget: '' };
let browseState = { category: 'all', ...BROWSE_EMPTY_FILTERS, season: false, flower: '', sort: 'recommend', shown: BROWSE_PAGE_SIZE };

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

// 상품이 거르기 한 칸의 선택과 맞는지 (맞춤 담화 점수 계산과 같은 태그·예산 기준)
function productMatchesFilter(p, f, value) {
  if (!value) return true;
  if (f.field === 'budget') return typeof getProductBudgetTiers === 'function' && getProductBudgetTiers(p).includes(value);
  const tags = productTagsOf(p)[f.tag] || [];
  if (tags.includes(value)) return true;
  return f.field === 'recipient' && value === '동료·상사' && tags.includes('직장 동료·상사');
}

function browseResults() {
  const s = browseState;
  const flowers = typeof loadFlowers === 'function' ? loadFlowers() : [];
  const inSeason = p => typeof isProductInSeason === 'function' && isProductInSeason(p, flowers);
  let list = loadProducts()
    .filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true)
    .map((p, i) => ({ p, i, season: inSeason(p) ? 0 : 1 }))
    .filter(({ p }) => s.category === 'all' || p.category === s.category)
    .filter(({ p }) => BROWSE_FILTERS.every(f => productMatchesFilter(p, f, s[f.field])))
    .filter(({ p }) => !s.flower || (typeof productFlowerIds === 'function' && productFlowerIds(p).includes(s.flower)))
    .filter(({ season }) => !s.season || season === 0);
  const priceKey = x => (x.p.inquiryOnly ? Infinity : productMinPriceOf(x.p));
  if (s.sort === 'price_asc') list.sort((a, b) => (priceKey(a) - priceKey(b)) || (a.i - b.i));
  else if (s.sort === 'price_desc') list.sort((a, b) => ((a.p.inquiryOnly ? 1 : 0) - (b.p.inquiryOnly ? 1 : 0)) || (productMinPriceOf(b.p) - productMinPriceOf(a.p)) || (a.i - b.i));
  // 추천순 = 관리자 '홈 순서' → 지금 제철인 꽃이 든 상품 → 관리자 상품 목록 순서 (홈 슬라이더와 같음)
  else list.sort((a, b) => (homeOrderOf(a.p) - homeOrderOf(b.p)) || (a.season - b.season) || (a.i - b.i));
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
  bar.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pb-6 border-b border-ink-black/10';
  BROWSE_FILTERS.forEach(f => {
    bar.appendChild(browseSelect(`browse-${f.field}`, brT(f.key, f.label),
      [['', brT('browse_any', '전체')], ...curationOptions(f.field).map(o => [o.label, brT(o.i18nKey, o.label)])],
      s[f.field], set(f.field)));
  });
  bar.appendChild(browseSelect('browse-sort', brT('browse_sort', '정렬'), BROWSE_SORTS.map(x => [x.id, brT(x.key, x.label)]), s.sort, v => { browseState.sort = v; renderFlowersPage(); }));
  view.appendChild(bar);

  const seasonWrap = document.createElement('label');
  seasonWrap.className = 'inline-flex items-center gap-2 pt-4 text-sm font-bold text-emerald-800 cursor-pointer';
  const seasonBox = document.createElement('input');
  seasonBox.type = 'checkbox';
  seasonBox.id = 'browse-season';
  seasonBox.className = 'w-4 h-4 cursor-pointer';
  seasonBox.checked = !!s.season;
  seasonBox.onchange = () => { browseState.season = seasonBox.checked; browseState.shown = BROWSE_PAGE_SIZE; renderFlowersPage(); };
  seasonWrap.append(seasonBox, document.createTextNode(brT('browse_season_only', '🌿 지금 제철인 꽃만')));
  const extraRow = document.createElement('div');
  extraRow.className = 'flex flex-wrap items-center gap-x-4 gap-y-2';
  extraRow.appendChild(seasonWrap);
  // 꽃 사전에서 고른 꽃 (예: '장미가 든 꽃만 ✕')
  const chosen = s.flower && typeof loadFlowers === 'function' ? loadFlowers().find(f => f.id === s.flower) : null;
  if (chosen) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.id = 'browse-flower-chip';
    chip.className = 'mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-seal-red text-white text-xs font-bold cursor-pointer hover:opacity-90';
    chip.textContent = `${brT('browse_flower_chip', '{name} 들어간 꽃만').replace('{name}', flowerText(chosen).name)} ✕`;
    chip.setAttribute('aria-label', brT('browse_flower_clear', '꽃 거르기 지우기'));
    chip.onclick = () => { browseState.flower = ''; browseState.shown = BROWSE_PAGE_SIZE; renderFlowersPage(); };
    extraRow.appendChild(chip);
  }
  view.appendChild(extraRow);

  const results = browseResults();
  const filtered = BROWSE_FILTERS.some(f => s[f.field]) || s.season || s.flower;

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
  browseState = { ...browseState, ...BROWSE_EMPTY_FILTERS, season: false, flower: '', shown: BROWSE_PAGE_SIZE };
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

// 꽃 사전 → 그 꽃이 든 상품만 보기 (다른 거르기는 지우고 시작)
function openFlowersPageWithFlower(flowerId) {
  browseState = { ...browseState, ...BROWSE_EMPTY_FILTERS, season: false, flower: flowerId, category: 'all', shown: BROWSE_PAGE_SIZE };
  openFlowersPage('all');
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
