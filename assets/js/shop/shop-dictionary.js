// assets/js/shop/shop-dictionary.js
// 설담화 쇼핑몰: 꽃 사전 페이지 (#/dictionary) - 위쪽 메뉴 '꽃 사전'
// 꽃 데이터·제철 계산은 assets/js/flowers-data.js, 작은 표시(seasonBadge)·번역 도우미(flT)는 shop-flowers.js

let dictionaryState = { month: 'now', q: '' };

function ensureDictionaryView() {
  let view = document.getElementById('view-dictionary');
  if (view) return view;
  view = document.createElement('div');
  view.id = 'view-dictionary';
  view.className = 'hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14';
  document.querySelector('main').appendChild(view);
  return view;
}

// 1~12월 막대: 제철 달은 초록, 이번 달은 테두리
function monthStrip(f, current) {
  const strip = document.createElement('div');
  strip.className = 'grid grid-cols-12 gap-0.5';
  strip.setAttribute('aria-hidden', 'true');
  const ms = flowerMonths(f);
  for (let m = 1; m <= 12; m++) {
    const cell = document.createElement('span');
    const on = ms.includes(m);
    cell.className = `h-1.5 rounded-full ${on ? (m === current ? 'bg-emerald-600' : 'bg-emerald-300') : 'bg-ink-black/10'}${m === current ? ' ring-1 ring-offset-1 ring-ink-black/40' : ''}`;
    strip.appendChild(cell);
  }
  return strip;
}

function monthLabel(m, lang) {
  if (lang === 'en') return monthNameEn(m);
  return lang === 'ja' ? `${m}月` : `${m}월`;
}

function renderDictionaryPage() {
  const view = ensureDictionaryView();
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const s = dictionaryState;
  view.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'text-center max-w-2xl mx-auto mb-8 space-y-2';
  const h = document.createElement('h1');
  h.className = 'text-2xl sm:text-3xl font-extrabold text-ink-black tracking-tight';
  h.textContent = flT('dict_title', '꽃 사전');
  const d = document.createElement('p');
  d.className = 'text-sm text-ink-gray';
  d.textContent = flT('dict_desc', '설담화가 쓰는 꽃의 꽃말과 제철을 모았어요. 상품 이름을 누르면 그 꽃이 든 상품으로 가요.');
  head.append(h, d);
  view.appendChild(head);

  // 달 고르기: 지금 제철 / 전체 / 1~12월
  const months = document.createElement('div');
  months.className = 'flex flex-wrap items-center justify-center gap-1.5 mb-4';
  const pill = (value, text) => {
    const b = document.createElement('button');
    b.type = 'button';
    const on = String(s.month) === String(value);
    b.className = `px-3 py-1.5 text-xs font-bold rounded-xs cursor-pointer ${on ? 'bg-ink-black text-white' : 'bg-[#FAF7F2] text-ink-gray hover:text-ink-black border border-ink-black/10'}`;
    b.textContent = text;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.onclick = () => { dictionaryState.month = value; renderDictionaryPage(); };
    return b;
  };
  months.append(pill('now', flT('dict_now', '🌿 지금 제철')), pill('all', flT('dict_all', '전체')));
  for (let m = 1; m <= 12; m++) months.appendChild(pill(m, monthLabel(m, lang)));
  view.appendChild(months);

  const search = document.createElement('input');
  search.type = 'search';
  search.id = 'dict-search';
  search.value = s.q;
  search.placeholder = flT('dict_search_ph', '꽃 이름이나 꽃말로 찾기');
  search.setAttribute('aria-label', search.placeholder);
  search.className = 'block w-full max-w-sm mx-auto mb-8 bg-white border border-ink-black/20 py-2 px-3 rounded-xs text-sm';
  search.oninput = () => { dictionaryState.q = search.value; renderDictionaryGrid(); };
  view.appendChild(search);

  const grid = document.createElement('div');
  grid.id = 'dict-grid';
  view.appendChild(grid);
  renderDictionaryGrid();
}

function renderDictionaryGrid() {
  const grid = document.getElementById('dict-grid');
  if (!grid) return;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const current = currentKoreaMonth();
  const s = dictionaryState;
  const month = s.month === 'now' ? current : Number(s.month);
  const q = s.q.trim().toLowerCase();
  const products = loadProducts().filter(p => typeof isProductVisible !== 'function' || isProductVisible(p));
  const flowers = loadFlowers()
    .filter(f => s.month === 'all' || flowerMonths(f).includes(month))
    .filter(f => !q || [f.name, f.nameEn, f.nameJa, f.meaning, f.meaningEn, f.meaningJa].join(' ').toLowerCase().includes(q));
  grid.innerHTML = '';
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
  if (!flowers.length) {
    const e = document.createElement('p');
    e.className = 'col-span-full text-center text-sm text-ink-gray py-16';
    e.textContent = flT('dict_empty', '이 조건에 맞는 꽃이 아직 없어요.');
    grid.appendChild(e);
    return;
  }
  flowers.forEach(f => {
    const ft = flowerText(f, lang);
    const card = document.createElement('article');
    card.className = 'bg-white border border-ink-black/10 rounded-xs p-5 space-y-3';
    const top = document.createElement('div');
    top.className = 'flex items-start justify-between gap-2';
    const names = document.createElement('div');
    const n = document.createElement('h2');
    n.className = 'text-lg font-extrabold text-ink-black';
    n.textContent = ft.name;
    names.appendChild(n);
    if (lang === 'ko' && f.nameEn) {
      const en = document.createElement('p');
      en.className = 'text-xs text-ink-gray';
      en.textContent = f.nameEn;
      names.appendChild(en);
    }
    top.appendChild(names);
    if (isFlowerInSeason(f, current)) top.appendChild(seasonBadge());
    card.appendChild(top);

    if (ft.meaning) {
      const meaning = document.createElement('p');
      meaning.className = 'font-serif text-seal-red font-semibold';
      meaning.textContent = `"${ft.meaning}"`;
      card.appendChild(meaning);
    }

    const season = document.createElement('div');
    season.className = 'space-y-1.5';
    const sl = document.createElement('p');
    sl.className = 'text-xs text-ink-gray';
    sl.textContent = `${flT('flower_season', '제철')} · ${formatFlowerMonths(f, lang)}${f.colors && lang === 'ko' ? ` · ${f.colors}` : ''}`;
    season.append(sl, monthStrip(f, current));
    card.appendChild(season);

    if (lang === 'ko' && f.care) {
      const care = document.createElement('p');
      care.className = 'text-xs text-ink-gray leading-relaxed';
      care.textContent = `${flT('flower_care', '관리 팁')}: ${f.care}`;
      card.appendChild(care);
    }

    const used = products.filter(p => productFlowerIds(p).includes(f.id));
    if (used.length) {
      const links = document.createElement('div');
      links.className = 'pt-2 border-t border-ink-black/10 flex flex-wrap items-center gap-1.5 text-xs';
      const label = document.createElement('span');
      label.className = 'font-bold text-ink-gray mr-1';
      label.textContent = flT('dict_products', '이 꽃이 든 상품');
      links.appendChild(label);
      used.forEach(p => {
        const tp = typeof tProduct === 'function' ? tProduct(p) : p;
        const a = document.createElement('button');
        a.type = 'button';
        a.className = 'px-2 py-1 rounded-full bg-[#FAF7F2] border border-ink-black/10 font-bold text-ink-black hover:border-seal-red hover:text-seal-red cursor-pointer';
        a.textContent = tp.name;
        a.onclick = () => openProductDetail(p.id);
        links.appendChild(a);
      });
      card.appendChild(links);
    }
    grid.appendChild(card);
  });
}

function showDictionaryPage() {
  const page = document.getElementById('pdp-modal');
  if (page) page.classList.add('hidden');
  if (typeof hideMainViews === 'function') hideMainViews();
  if (typeof toggleMobileMenu === 'function') toggleMobileMenu(false);
  const view = ensureDictionaryView();
  renderDictionaryPage();
  view.classList.remove('hidden');
  const nav = document.getElementById('nav-dictionary');
  if (nav) nav.className = 'nav-btn py-1 text-seal-red font-bold border-b-2 border-seal-red transition-colors';
  document.title = `${flT('dict_title', '꽃 사전')} | 설담화`;
  window.scrollTo({ top: 0 });
}

function openDictionaryPage() {
  showDictionaryPage();
  if (typeof setRouteHash === 'function') setRouteHash('#/dictionary');
}

// 언어를 바꾸면 보이는 중일 때 다시 그림 (shop-core.js renderProducts에서 부름)
function refreshDictionaryPage() {
  const view = document.getElementById('view-dictionary');
  if (view && !view.classList.contains('hidden')) renderDictionaryPage();
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof SHOP_ROUTES !== 'undefined') SHOP_ROUTES.dictionary = () => showDictionaryPage();
});
