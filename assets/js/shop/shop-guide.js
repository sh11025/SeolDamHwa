// assets/js/shop/shop-guide.js
// 설담화 쇼핑몰: 검색·정성 안내·약관 페이지·사업자 정보·다른 탭과 동기화
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

function toggleSearchModal(open) {
  const modal = document.getElementById('search-modal');
  if (open) {
    modal.classList.remove('hidden');
    document.getElementById('search-input').focus();
  } else {
    modal.classList.add('hidden');
  }
}

function handleSearch(val) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';
  if (!val.trim()) return;

  const products = loadProducts().filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true);
  const query = val.toLowerCase().trim();
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';

  const matched = products.filter(p => {
    const tp = typeof tProduct === 'function' ? tProduct(p, lang) : p;
    return (
      (p.name && p.name.toLowerCase().includes(query)) ||
      (tp.name && tp.name.toLowerCase().includes(query)) ||
      (p.poeticLine && p.poeticLine.toLowerCase().includes(query)) ||
      (tp.poeticLine && tp.poeticLine.toLowerCase().includes(query)) ||
      (p.flowerMeaning && p.flowerMeaning.toLowerCase().includes(query)) ||
      (tp.flowerMeaning && tp.flowerMeaning.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (tp.description && tp.description.toLowerCase().includes(query))
    );
  });

  if (matched.length === 0) {
    const noRes = typeof t === 'function' ? t('search_no_results', '검색 결과가 없습니다.') : '검색 결과가 없습니다.';
    resultsContainer.innerHTML = `<div class="p-3 text-center text-ink-gray">${noRes}</div>`;
    return;
  }

  matched.forEach(p => {
    const tp = typeof tProduct === 'function' ? tProduct(p, lang) : p;
    const item = document.createElement('div');
    item.className = 'p-2 hover:bg-[#FAF7F2] rounded-xs flex items-center justify-between cursor-pointer';
    item.onclick = () => {
      toggleSearchModal(false);
      openProductDetail(p.id);
    };

    let priceText = '';
    if (p.inquiryOnly) {
      priceText = typeof t === 'function' ? t('inquiry_price_label', '상담 후 견적') : '상담 후 견적';
    } else if (p.sizes && p.sizes.length > 0) {
      const minPrice = Math.min(...p.sizes.map(s => s.price));
      const hasMultipleSizes = p.sizes.length >= 2;
      priceText = `${formatPrice(minPrice)}${hasMultipleSizes ? '~' : ''}`;
    } else {
      priceText = formatPrice(p.price || 0);
    }

    item.innerHTML = `
      <div class="flex items-center gap-3">
        <img loading="lazy" decoding="async" src="${p.image}" class="w-10 h-10 object-cover rounded-xs border border-ink-black/10">
        <div>
          <p class="font-bold text-ink-black">${tp.name}</p>
          <p class="font-serif text-seal-red text-[11px] italic">"${tp.poeticLine}"</p>
        </div>
      </div>
      <span class="font-bold text-ink-black text-xs">${priceText}</span>
    `;
    resultsContainer.appendChild(item);
  });
}


// 정성 안내 화면 탭
let currentGuideTab = 'bojagi';
const GUIDE_TITLE_KEYS = { bojagi: 'footer_link_bojagi', care: 'footer_link_care', delivery: 'footer_link_delivery', refund: 'footer_link_refund' };

function showGuideTab(id) {
  if (typeof loadPages !== 'function' || !GUIDE_TITLE_KEYS[id]) return;
  currentGuideTab = id;
  // 탭을 바꾸면 주소도 #/guide/<탭>으로 (공유 가능, 뒤로 가기 기록은 늘리지 않음)
  const guideView = document.getElementById('view-guide');
  if (guideView && !guideView.classList.contains('hidden') && typeof setRouteHash === 'function' && location.hash.startsWith('#/guide')) setRouteHash(`#/guide/${id}`, true);
  const page = loadPages()[id];
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  document.querySelectorAll('.guide-tab').forEach(b => {
    const on = b.dataset.guide === id;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    b.className = `guide-tab px-4 py-2 rounded-full border text-sm font-bold cursor-pointer transition-colors ${on ? 'bg-ink-black text-hanji border-ink-black' : 'bg-white text-ink-black border-ink-black/20 hover:border-seal-red hover:text-seal-red'}`;
  });
  document.getElementById('guide-title').textContent = lang !== 'ko' && typeof t === 'function' ? t(GUIDE_TITLE_KEYS[id], page.title) : page.title;
  const note = document.getElementById('guide-lang-note');
  note.textContent = typeof t === 'function' ? t('page_korean_only', '') : '';
  note.classList.toggle('hidden', lang === 'ko' || !note.textContent);
  document.getElementById('guide-body').innerHTML = renderPageBody(page.body);
}

// 맨 아래 정성 안내 링크 → 정성 안내 화면의 해당 탭
function openGuide(id) {
  currentGuideTab = id;
  switchView('guide');
}

// 정성 안내·약관 페이지 열기
function openInfoPage(id) {
  if (typeof loadPages !== 'function') return;
  const page = loadPages()[id];
  if (!page) return;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const titleKey = { bojagi: 'footer_link_bojagi', care: 'footer_link_care', delivery: 'footer_link_delivery', refund: 'footer_link_refund', terms: 'footer_terms', privacy: 'footer_privacy' }[id];
  document.getElementById('info-page-title').textContent = lang !== 'ko' && typeof t === 'function' ? t(titleKey, page.title) : page.title;
  const note = document.getElementById('info-page-lang-note');
  note.textContent = typeof t === 'function' ? t('page_korean_only', '') : '';
  note.classList.toggle('hidden', lang === 'ko' || !note.textContent);
  document.getElementById('info-page-body').innerHTML = renderPageBody(page.body);
  document.getElementById('info-page-modal').classList.remove('hidden');
}

function closeInfoPage() {
  document.getElementById('info-page-modal').classList.add('hidden');
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const lk = document.getElementById('order-lookup-modal');
    if (lk && !lk.classList.contains('hidden')) closeOrderLookup();
    const m = document.getElementById('info-page-modal');
    if (m && !m.classList.contains('hidden')) closeInfoPage();
  }
});

// 맨 아래 사업자 정보
function renderBusinessInfo() {
  const el = document.getElementById('footer-business-info');
  if (!el) return;
  const s = typeof loadSettings === 'function' ? loadSettings() : {};
  const b = s.business || {};
  const parts = [
    ['상호', b.companyName || '설담화'],
    ['대표', b.ceo],
    ['사업자등록번호', b.bizNumber],
    ['통신판매업 신고', b.mailOrderNumber],
    ['주소', b.bizAddress],
    ['개인정보보호책임자', b.privacyOfficer]
  ].filter(([, v]) => v);
  el.textContent = parts.map(([k, v]) => `${k} ${v}`).join(' · ') + (b.bizNumber ? '' : (parts.length ? ' · ' : '') + (typeof t === 'function' ? t('footer_biz_pending', '사업자 정보는 등록 준비 중입니다.') : '사업자 정보는 등록 준비 중입니다.'));
}

// 다른 창/탭과 실시간 동기화 (Live Sync)
window.addEventListener('seoldamhwa_settings_updated', () => { renderSiteSettings(); renderBusinessInfo(); });
window.addEventListener('storage', (e) => {
  if (e.key === 'seoldamhwa_products') {
    renderProducts(currentCategory);
    initInquiryProductOptions();
  try { initCurationUI(); } catch (e) { console.error('initCurationUI error:', e); }
  renderSiteSettings();
  initFloatingControls();
  }
  if (e.key === 'seoldamhwa_settings') {
    renderSiteSettings();
    renderBusinessInfo();
  }
  if (e.key === 'seoldamhwa_pages' && !document.getElementById('view-guide').classList.contains('hidden')) {
    showGuideTab(currentGuideTab);
  }
  if (e.key === 'seoldamhwa_orders') {
    // 주문 관련 갱신 필요시 대응
  }
});


// 매장 설정 및 고객센터/지도 렌더링

// 요일별 운영시간 상세 패널 토글
function toggleWeeklyHoursDetail() {
  const panel = document.getElementById('footer-hours-detail-panel');
  const arrow = document.getElementById('hours-detail-arrow');
  if (panel) {
    panel.classList.toggle('hidden');
    if (arrow) {
      arrow.style.transform = panel.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }
}

// 매장 설정 및 고객센터/지도 렌더링
