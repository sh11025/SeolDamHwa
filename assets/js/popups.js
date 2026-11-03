/**
 * 설담화 (說談花) - 공지/이벤트 팝업 슬라이더 모듈
 * 로컬 스토리지 키: seoldamhwa_popups
 */

var POPUPS_STORAGE_KEY = DataStore.KEYS.popups;

// 기본 팝업 설정 데이터 (마스터 스위치 OFF, 샘플 슬라이드 1개 미활성)
const DEFAULT_POPUPS_DATA = {
  enabled: false,
  slides: [
    {
      id: 'sample-bojagi',
      active: false,
      order: 1,
      image: 'assets/images/story_bojagi_gift.jpg',
      title: '복주머니 포장 안내',
      text: '버려지는 포장 대신, 오래 간직하는 복주머니 포장으로 마음을 전해 보세요.',
      titleEn: '',
      textEn: '',
      titleJa: '',
      textJa: '',
      buttonLabel: '자세히 보기',
      linkType: 'internal', // 'none' | 'url' | 'internal'
      url: '',
      internalTarget: 'story', // 'shop' | 'story' | 'custom' | 'product:<id>'
      startDate: '',
      endDate: ''
    }
  ]
};

/**
 * 팝업 데이터 불러오기
 */
function loadPopups() {
  try {
    const parsed = DataStore.read(POPUPS_STORAGE_KEY);
    if (!parsed || typeof parsed !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_POPUPS_DATA));
    }
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_POPUPS_DATA.enabled,
      slides: Array.isArray(parsed.slides) ? parsed.slides : JSON.parse(JSON.stringify(DEFAULT_POPUPS_DATA.slides))
    };
  } catch (e) {
    console.error('loadPopups error:', e);
    return JSON.parse(JSON.stringify(DEFAULT_POPUPS_DATA));
  }
}

/**
 * 팝업 데이터 저장 및 라이브 동기화 이벤트 발행
 */
function savePopups(data) {
  try {
    const safeData = {
      enabled: !!data.enabled,
      slides: Array.isArray(data.slides) ? data.slides : []
    };
    DataStore.write(POPUPS_STORAGE_KEY, safeData);
    window.dispatchEvent(new CustomEvent('seoldamhwa_popups_updated', { detail: safeData }));
    return true;
  } catch (e) {
    console.error('savePopups error:', e);
    return false;
  }
}

/**
 * 외부 링크 URL 유효성 검사 (http:// 또는 https:// 만 허용, javascript: 등 차단)
 */
function isValidPopupUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed);
}

/**
 * 슬라이드가 활성화 상태이고 현재 기간 내에 있는지 검사 (한국 시간 기준)
 */
function isSlideActiveAndInPeriod(slide, koreaDateStr) {
  if (!slide || !slide.active) return false;
  const todayStr = koreaDateStr || (typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts().dateStr : new Date().toISOString().slice(0, 10));

  if (slide.startDate && slide.startDate.trim()) {
    if (todayStr < slide.startDate.trim()) return false;
  }
  if (slide.endDate && slide.endDate.trim()) {
    if (todayStr > slide.endDate.trim()) return false;
  }
  return true;
}

// 탭 간 실시간 스토리지 동기화
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === POPUPS_STORAGE_KEY) {
      try {
        const parsed = JSON.parse(e.newValue || '{}');
        window.dispatchEvent(new CustomEvent('seoldamhwa_popups_updated', { detail: parsed }));
      } catch (err) {}
    }
  });
}

