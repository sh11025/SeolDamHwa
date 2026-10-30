// assets/js/shop/shop-nav.js
// 설담화 쇼핑몰: 모바일 메뉴·공지 팝업·화면 바꾸기(switchView)
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

function toggleMobileMenu(forceClose) {
  const panel = document.getElementById('mobile-menu-dropdown');
  if (!panel) return;
  if (forceClose === false || (forceClose === undefined && !panel.classList.contains('hidden'))) {
    panel.classList.add('hidden');
  } else {
    panel.classList.remove('hidden');
  }
}

function handleMobileNav(view) {
  toggleMobileMenu(false);
  if (view === 'flowers') { openFlowersPage(); return; }
  switchView(view);
}


// ----------------------------------------------------
// 팝업 슬라이더 상태 및 제어 로직 (Popup Slider)
// ----------------------------------------------------
let currentPopupSlides = [];
let currentPopupIndex = 0;
let popupAutoAdvanceTimer = null;
let isPopupActiveNow = false;
let isPopupTemporarilyHidden = false;

// 0번 요구사항: #inquiry-date min 속성 설정 함수
function onInquiryDateFocus(el) {
  if (!el) return;
  el.type = 'date';
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const kp = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(tomorrow) : null;
  el.min = kp ? kp.dateStr : tomorrow.toISOString().slice(0, 10);
}

function initPopupSlider() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const isPopupPreview = urlParams.get('popupPreview') === '1';
    const isProductPreview = !!urlParams.get('preview');

    // 상품 미리보기(?preview=) 페이지에서는 팝업을 표시하지 않음
    if (isProductPreview) return;

    const kp = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts() : { dateStr: new Date().toISOString().slice(0, 10) };
    const todayStr = kp.dateStr;

    // "오늘 그만 보기" 체크 (미리보기 모드 제외)
    if (!isPopupPreview) {
      try {
        const dismissedDate = localStorage.getItem('seoldamhwa_popup_dismissed_date');
        if (dismissedDate === todayStr) return;
      } catch (e) {}

      // 첫 페이지 뷰에서만 노출 (세션 스토리지 체크)
      try {
        if (sessionStorage.getItem('seoldamhwa_popup_viewed_session')) return;
      } catch (e) {}
    }

    const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
    if (!isPopupPreview && !popups.enabled) return;

    const allSlides = Array.isArray(popups.slides) ? popups.slides.slice() : [];
    allSlides.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    // 유효 슬라이드 선별
    let validSlides = [];
    if (isPopupPreview) {
      validSlides = allSlides; // 미리보기 시 중지된 슬라이드 포함
    } else {
      validSlides = allSlides.filter(s => typeof isSlideActiveAndInPeriod === 'function' ? isSlideActiveAndInPeriod(s, todayStr) : s.active);
    }

    if (validSlides.length === 0) return;

    currentPopupSlides = validSlides;
    currentPopupIndex = 0;

    if (isPopupPreview) {
      showPopupSlider();
    } else {
      setTimeout(showPopupSlider, 1500);
    }
  } catch (err) {
    console.error('initPopupSlider error:', err);
  }
}

function showPopupSlider() {
  if (currentPopupSlides.length === 0) return;
  isPopupActiveNow = true;

  try {
    sessionStorage.setItem('seoldamhwa_popup_viewed_session', '1');
  } catch (e) {}

  renderCurrentPopupSlide();
  updatePopupVisibility();

  if (currentPopupSlides.length >= 2) {
    startPopupAutoAdvance();
  }

  // 호버 및 터치 일시정지, 모바일 스와이프 이벤트 등록
  setupPopupInteractions();
}

function renderCurrentPopupSlide() {
  if (!isPopupActiveNow || currentPopupSlides.length === 0) return;
  const slide = currentPopupSlides[currentPopupIndex] || currentPopupSlides[0];
  if (!slide) return;

  const imgEl = document.getElementById('popup-slide-img');
  const titleEl = document.getElementById('popup-slide-title');
  const textEl = document.getElementById('popup-slide-text');
  const btnWrap = document.getElementById('popup-slide-btn-wrap');
  const btnEl = document.getElementById('popup-slide-btn');
  const navEl = document.getElementById('popup-slider-nav');
  const counterEl = document.getElementById('popup-slide-counter');
  const stoppedBadge = document.getElementById('popup-slide-stopped-badge');

  const curLang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';

  let displayTitle = slide.title || '';
  let displayText = slide.text || '';
  if (curLang === 'en') {
    if (slide.titleEn && slide.titleEn.trim()) displayTitle = slide.titleEn.trim();
    if (slide.textEn && slide.textEn.trim()) displayText = slide.textEn.trim();
  } else if (curLang === 'ja') {
    if (slide.titleJa && slide.titleJa.trim()) displayTitle = slide.titleJa.trim();
    if (slide.textJa && slide.textJa.trim()) displayText = slide.textJa.trim();
  }

  const defaultBtnLabel = typeof t === 'function' ? t('popup_view_details', '자세히 보기') : '자세히 보기';
  const displayBtnLabel = slide.buttonLabel && slide.buttonLabel.trim() ? slide.buttonLabel.trim() : defaultBtnLabel;

  if (imgEl) {
    imgEl.src = slide.image || 'assets/images/story_bojagi_gift.jpg';
    imgEl.alt = displayTitle;
  }
  if (titleEl) titleEl.textContent = displayTitle;
  if (textEl) textEl.textContent = displayText;

  if (btnWrap && btnEl) {
    if (slide.linkType === 'url' || slide.linkType === 'internal') {
      btnEl.textContent = displayBtnLabel;
      btnWrap.classList.remove('hidden');
    } else {
      btnWrap.classList.add('hidden');
    }
  }

  if (navEl && counterEl) {
    if (currentPopupSlides.length >= 2) {
      counterEl.textContent = `${currentPopupIndex + 1} / ${currentPopupSlides.length}`;
      navEl.classList.remove('hidden');
    } else {
      navEl.classList.add('hidden');
    }
  }

  if (stoppedBadge) {
    const urlParams = new URLSearchParams(window.location.search);
    const isPopupPreview = urlParams.get('popupPreview') === '1';
    if (isPopupPreview && !slide.active) {
      stoppedBadge.textContent = typeof t === 'function' ? t('popup_status_stopped', '중지됨') : '중지됨';
      stoppedBadge.classList.remove('hidden');
    } else {
      stoppedBadge.classList.add('hidden');
    }
  }
}

function nextPopupSlide() {
  if (currentPopupSlides.length <= 1) return;
  currentPopupIndex = (currentPopupIndex + 1) % currentPopupSlides.length;
  renderCurrentPopupSlide();
}

function prevPopupSlide() {
  if (currentPopupSlides.length <= 1) return;
  currentPopupIndex = (currentPopupIndex - 1 + currentPopupSlides.length) % currentPopupSlides.length;
  renderCurrentPopupSlide();
}

function startPopupAutoAdvance() {
  stopPopupAutoAdvance();
  if (currentPopupSlides.length >= 2) {
    popupAutoAdvanceTimer = setInterval(nextPopupSlide, 5000);
  }
}

function stopPopupAutoAdvance() {
  if (popupAutoAdvanceTimer) {
    clearInterval(popupAutoAdvanceTimer);
    popupAutoAdvanceTimer = null;
  }
}

function handlePopupSlideClick() {
  const slide = currentPopupSlides[currentPopupIndex];
  if (!slide) return;

  if (slide.linkType === 'url') {
    if (slide.url && typeof isValidPopupUrl === 'function' && isValidPopupUrl(slide.url)) {
      window.open(slide.url, '_blank', 'noopener,noreferrer');
    }
  } else if (slide.linkType === 'internal') {
    const target = slide.internalTarget || 'story';
    if (target === 'story') {
      if (typeof switchView === 'function') switchView('story');
    } else if (target === 'shop') {
      if (typeof switchView === 'function') switchView('shop');
    } else if (target === 'custom') {
      if (typeof switchView === 'function') switchView('custom');
    } else if (target.startsWith('product:')) {
      const prodId = target.split(':')[1];
      if (typeof openProductDetail === 'function') openProductDetail(prodId);
    }
    closePopupNow();
  }
}

function closePopupToday() {
  try {
    const kp = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts() : { dateStr: new Date().toISOString().slice(0, 10) };
    localStorage.setItem('seoldamhwa_popup_dismissed_date', kp.dateStr);
  } catch (e) {}
  closePopupNow();
}

function closePopupNow() {
  isPopupActiveNow = false;
  stopPopupAutoAdvance();
  const container = document.getElementById('popup-slider-container');
  const backdrop = document.getElementById('popup-slider-backdrop');
  if (container) container.classList.add('hidden');
  if (backdrop) backdrop.classList.add('hidden');
}

// 모달(PDP, 장바구니, 주문 결제) 열릴 때 팝업 숨김 처리
function updatePopupVisibility() {
  if (!isPopupActiveNow) return;
  const pdpModal = document.getElementById('pdp-modal');
  const cartDrawer = document.getElementById('cart-drawer');
  const checkoutModal = document.getElementById('checkout-modal');

  const isPdpOpen = pdpModal && !pdpModal.classList.contains('hidden');
  const isCartOpen = cartDrawer && !cartDrawer.classList.contains('hidden');
  const isCheckoutOpen = checkoutModal && !checkoutModal.classList.contains('hidden');

  const shouldHide = isPdpOpen || isCartOpen || isCheckoutOpen;
  const container = document.getElementById('popup-slider-container');
  const backdrop = document.getElementById('popup-slider-backdrop');

  if (container) {
    if (shouldHide) container.classList.add('hidden');
    else container.classList.remove('hidden');
  }
  if (backdrop) {
    if (shouldHide) backdrop.classList.add('hidden');
    else backdrop.classList.remove('hidden');
  }
}

let popupInteractionsSetup = false;
function setupPopupInteractions() {
  if (popupInteractionsSetup) return;
  popupInteractionsSetup = true;

  const container = document.getElementById('popup-slider-container');
  if (container) {
    container.addEventListener('mouseenter', stopPopupAutoAdvance);
    container.addEventListener('mouseleave', () => {
      if (isPopupActiveNow && currentPopupSlides.length >= 2) startPopupAutoAdvance();
    });

    // 모바일 터치 스와이프
    let touchStartX = 0;
    let touchEndX = 0;
    container.addEventListener('touchstart', (e) => {
      stopPopupAutoAdvance();
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) nextPopupSlide();
        else prevPopupSlide();
      }
      if (isPopupActiveNow && currentPopupSlides.length >= 2) startPopupAutoAdvance();
    }, { passive: true });
  }

  // Esc 키로 팝업 닫기
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPopupActiveNow) {
      const pdpModal = document.getElementById('pdp-modal');
      const checkoutModal = document.getElementById('checkout-modal');
      const isModalOpen = (pdpModal && !pdpModal.classList.contains('hidden')) || (checkoutModal && !checkoutModal.classList.contains('hidden'));
      if (!isModalOpen) {
        closePopupNow();
      }
    }
  });
}

// 화면 보여 주기 (주소는 shop-router.js의 switchView가 함께 바꿈)
function showView(view) {
  toggleMobileMenu(false);
  document.getElementById('view-shop').classList.add('hidden');
  document.getElementById('view-story').classList.add('hidden');
  document.getElementById('view-custom').classList.add('hidden');
  document.getElementById('view-guide').classList.add('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.className = 'nav-btn py-1 text-ink-charcoal hover:text-seal-red transition-colors';
  });

  if (view === 'shop') {
    document.getElementById('view-shop').classList.remove('hidden');
  } else if (view === 'story') {
    document.getElementById('view-story').classList.remove('hidden');
    document.getElementById('nav-story').className = 'nav-btn py-1 text-seal-red font-bold border-b-2 border-seal-red transition-colors';
  } else if (view === 'custom') {
    document.getElementById('view-custom').classList.remove('hidden');
    document.getElementById('nav-custom').className = 'nav-btn py-1 text-seal-red font-bold border-b-2 border-seal-red transition-colors';
    initInquiryProductOptions();
    try { initCurationUI(); } catch (e) { console.error('initCurationUI error:', e); }
  } else if (view === 'guide') {
    document.getElementById('view-guide').classList.remove('hidden');
    document.getElementById('nav-guide').className = 'nav-btn py-1 text-seal-red font-bold border-b-2 border-seal-red transition-colors';
    showGuideTab(currentGuideTab);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5단계 맞춤 추천 사유 한국어 맵
