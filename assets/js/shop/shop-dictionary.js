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

// 달마다 대표 절기 (병풍 폭에 함께 적음)
const SOLAR_TERMS = {
  ko: ['소한', '입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설'],
  ja: ['小寒', '立春', '啓蟄', '清明', '立夏', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'],
  en: ['Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter', 'Winter']
};

function solarTermLabel(m, lang) {
  return (SOLAR_TERMS[lang] || SOLAR_TERMS.ko)[m - 1];
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
  d.textContent = flT('dict_desc', '설담화가 쓰는 꽃의 꽃말과 제철을 모았어요.');
  head.append(h, d);
  view.appendChild(head);

  // 달 고르기: [지금 제철] [전체] + 12폭 병풍 (폭마다 그 달의 절기)
  const current = currentKoreaMonth();
  const quick = document.createElement('div');
  quick.className = 'flex items-center justify-center gap-2 mb-3';
  const pill = (value, text) => {
    const b = document.createElement('button');
    b.type = 'button';
    const on = String(s.month) === String(value);
    b.className = `px-4 py-2 text-xs sm:text-sm font-bold rounded-xs cursor-pointer ${on ? 'bg-ink-black text-white' : 'bg-[#FAF7F2] text-ink-gray hover:text-ink-black border border-ink-black/10'}`;
    b.textContent = text;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.onclick = () => { dictionaryState.month = value; renderDictionaryPage(); };
    return b;
  };
  quick.append(pill('now', flT('dict_now', '🌿 지금 제철')), pill('all', flT('dict_all', '전체')));
  view.appendChild(quick);

  const screenWrap = document.createElement('div');
  screenWrap.className = 'home-slider overflow-x-auto mb-5 -mx-4 px-4 sm:mx-0 sm:px-0'; // home-slider: 스크롤 막대 숨김
  const screen = document.createElement('div');
  screen.id = 'dict-folding-screen';
  screen.setAttribute('role', 'group');
  screen.setAttribute('aria-label', flT('dict_screen_label', '달 고르기'));
  screen.className = 'grid grid-cols-12 min-w-[640px] border border-ink-black/20 rounded-xs overflow-hidden bg-[#FAF7F2]';
  const selected = s.month === 'now' ? current : s.month;
  for (let m = 1; m <= 12; m++) {
    const b = document.createElement('button');
    b.type = 'button';
    const on = s.month !== 'all' && Number(selected) === m;
    // 병풍 접힌 면처럼 폭마다 아주 옅게 번갈아
    b.className = `relative py-2.5 text-center cursor-pointer border-r last:border-r-0 border-ink-black/10 transition-colors ${on ? 'bg-seal-red text-white' : (m % 2 ? 'bg-[#FBF9F5]' : 'bg-[#F4F0E8]') + ' text-ink-gray hover:text-seal-red'}`;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    const num = document.createElement('span');
    num.className = `block text-sm font-extrabold ${on ? 'text-white' : 'text-ink-black'}`;
    num.textContent = monthLabel(m, lang);
    const term = document.createElement('span');
    term.className = 'block text-[11px] mt-0.5';
    term.textContent = solarTermLabel(m, lang);
    b.append(num, term);
    if (m === current) {
      const dot = document.createElement('span');
      dot.className = `absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${on ? 'bg-white' : 'bg-seal-red'}`;
      dot.title = flT('dict_this_month', '이번 달');
      b.appendChild(dot);
      b.setAttribute('aria-label', `${monthLabel(m, lang)} ${solarTermLabel(m, lang)} · ${flT('dict_this_month', '이번 달')}`);
    }
    b.onclick = () => { dictionaryState.month = m === current ? 'now' : m; renderDictionaryPage(); };
    screen.appendChild(b);
  }
  screenWrap.appendChild(screen);
  view.appendChild(screenWrap);
  // 휴대폰처럼 병풍이 화면보다 넓으면 고른 달이 가운데 오게
  requestAnimationFrame(() => {
    const on = screen.querySelector('[aria-pressed="true"]');
    if (on && screenWrap.scrollWidth > screenWrap.clientWidth) screenWrap.scrollLeft = on.offsetLeft - (screenWrap.clientWidth - on.offsetWidth) / 2;
  });

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
  // auto-rows-fr: 모든 줄의 카드 높이를 같게
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4';
  if (!flowers.length) {
    const e = document.createElement('p');
    e.className = 'col-span-full text-center text-sm text-ink-gray py-16';
    e.textContent = flT('dict_empty', '이 조건에 맞는 꽃이 아직 없어요.');
    grid.appendChild(e);
    return;
  }
  flowers.forEach(f => {
    const ft = flowerText(f, lang);
    const used = products.filter(p => productFlowerIds(p).includes(f.id));
    const photo = flowerPhoto(f, used);
    const card = document.createElement('article');
    card.className = 'hanok-card relative overflow-hidden flex flex-col';
    // 꽃 사진을 하얀 막 뒤에 깔아 글씨가 잘 읽히게
    if (photo) {
      const bg = document.createElement('img');
      bg.src = photo;
      bg.alt = '';
      bg.loading = 'lazy';
      bg.setAttribute('aria-hidden', 'true');
      bg.className = 'absolute inset-0 w-full h-full object-cover';
      const veil = document.createElement('div');
      veil.className = 'absolute inset-0 bg-gradient-to-b from-white/75 via-white/88 to-white/95';
      card.append(bg, veil);
    }
    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
      const c = document.createElement('span');
      c.className = `kkotsal ${pos}`;
      c.setAttribute('aria-hidden', 'true');
      card.appendChild(c);
    });
    const body = document.createElement('div');
    body.className = 'relative z-10 p-5 sm:p-6 flex flex-col gap-3 h-full';

    const top = document.createElement('div');
    top.className = 'flex items-start justify-between gap-2';
    const names = document.createElement('div');
    const n = document.createElement('h2');
    n.className = 'text-xl font-extrabold text-ink-black tracking-tight';
    n.textContent = ft.name;
    names.appendChild(n);
    if (lang === 'ko' && f.nameEn) {
      const en = document.createElement('p');
      en.className = 'text-xs font-semibold text-ink-gray tracking-wide';
      en.textContent = f.nameEn;
      names.appendChild(en);
    }
    top.appendChild(names);
    if (isFlowerInSeason(f, current)) top.appendChild(seasonBadge());
    body.appendChild(top);

    if (ft.meaning) {
      const meaning = document.createElement('p');
      meaning.className = 'font-serif text-lg leading-snug text-seal-red font-semibold';
      meaning.textContent = `"${ft.meaning}"`;
      body.appendChild(meaning);
    }

    const info = document.createElement('dl');
    info.className = 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm';
    const addRow = (k, v) => {
      if (!v) return;
      const dt = document.createElement('dt');
      dt.className = 'font-bold text-ink-black whitespace-nowrap';
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.className = 'text-ink-charcoal';
      dd.textContent = v;
      info.append(dt, dd);
    };
    addRow(flT('flower_season', '제철'), formatFlowerMonths(f, lang));
    if (lang === 'ko') addRow(flT('dict_colors', '색'), f.colors);
    body.appendChild(info);
    body.appendChild(monthStrip(f, current));

    if (lang === 'ko' && f.care) {
      const care = document.createElement('p');
      // 카드 크기가 같도록 관리 팁은 맨 아래 두 줄까지
      care.className = 'mt-auto text-[13px] text-ink-charcoal leading-relaxed bg-white/70 border border-ink-black/5 rounded-xs px-3 py-2 line-clamp-2';
      care.title = f.care;
      care.textContent = `💧 ${f.care}`;
      body.appendChild(care);
    }

    // 이 꽃이 든 상품 모두 보기 (없으면 안내 문구를 같은 자리에)
    const foot = document.createElement('div');
    foot.className = `${lang === 'ko' && f.care ? '' : 'mt-auto '}pt-1`;
    if (used.length) {
      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'w-full py-2 rounded-xs bg-ink-black text-white text-xs font-bold hover:bg-seal-red cursor-pointer';
      go.textContent = `${flT('dict_browse_flower', '이 꽃이 든 상품 모두 보기 →')} (${used.length})`;
      go.onclick = () => openFlowersPageWithFlower(f.id);
      foot.appendChild(go);
    } else {
      const none = document.createElement('p');
      none.className = 'py-2 text-xs text-ink-gray text-center';
      none.textContent = flT('dict_no_products', '아직 이 꽃이 든 상품이 없어요. 맞춤 상담으로 문의해 주세요.');
      foot.appendChild(none);
    }
    body.appendChild(foot);

    card.appendChild(body);
    grid.appendChild(card);
  });
}

// 카드 뒤 사진: 관리자가 정한 꽃 사진 → 없으면 그 꽃이 든 첫 상품 사진
function flowerPhoto(f, usedProducts) {
  if (f.image) return f.image;
  const p = usedProducts[0];
  return p ? ((Array.isArray(p.images) && p.images[0]) || p.image) : '';
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
