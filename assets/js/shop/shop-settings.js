// assets/js/shop/shop-settings.js
// 설담화 쇼핑몰: 고객센터·운영시간·오시는 길 표시·예약 공개 확인
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

function renderSiteSettings() {
  const s = typeof loadSettings === 'function' ? loadSettings() : {
    phone: '02-764-1920',
    email: 'contact@seoldamhwa.kr',
    address: '서울시 종로구 북촌로 42',
    addressDetail: '(임시 주소)',
    directions: '',
    kakaoChannelUrl: '',
    showLocation: false,
    weeklyHours: typeof DEFAULT_WEEKLY_HOURS !== 'undefined' ? DEFAULT_WEEKLY_HOURS : [],
    closures: []
  };

  if (typeof applySiteTheme === 'function') applySiteTheme(s.theme); // 관리자에서 고른 사이트 색

  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';

  // 1) 전화번호 & 이메일
  const bandPhone = document.getElementById('footer-band-phone');
  if (bandPhone) {
    bandPhone.href = `tel:${(s.phone || '').replace(/[^0-9]/g, '')}`;
    bandPhone.innerText = s.phone || '02-764-1920';
  }
  const bandEmail = document.getElementById('footer-band-email');
  if (bandEmail) {
    bandEmail.href = `mailto:${s.email || ''}`;
    bandEmail.innerText = s.email || 'contact@seoldamhwa.kr';
  }

  // 2) 카카오톡 채널 버튼
  const bandKakao = document.getElementById('footer-band-kakao');
  const floatKakao = document.getElementById('float-kakao-btn');
  const hasKakao = s.kakaoChannelUrl && s.kakaoChannelUrl.trim();
  if (bandKakao) {
    if (hasKakao) {
      bandKakao.classList.remove('hidden');
      bandKakao.href = s.kakaoChannelUrl.trim();
    } else {
      bandKakao.classList.add('hidden');
    }
  }
  if (floatKakao) {
    if (hasKakao) {
      floatKakao.classList.remove('hidden');
      floatKakao.href = s.kakaoChannelUrl.trim();
    } else {
      floatKakao.classList.add('hidden');
    }
  }

  // 3) 오늘 실시간 영업 상태 (한국 시간 기준)
  const now = new Date();
  const statusObj = typeof getStoreStatus === 'function' ? getStoreStatus(now, s) : { status: 'open', time: '18:00' };
  const dotEl = document.getElementById('store-status-dot');
  const textEl = document.getElementById('store-status-text');

  if (dotEl && textEl) {
    dotEl.className = 'w-2 h-2 rounded-full shrink-0';
    let statusText = '';

    switch (statusObj.status) {
      case 'open':
        dotEl.classList.add('bg-emerald-600');
        statusText = typeof t === 'function'
          ? t('cs_band_status_open', '지금 영업 중 · {time}까지').replace('{time}', statusObj.time)
          : `지금 영업 중 · ${statusObj.time}까지`;
        break;

      case 'lunch':
        dotEl.classList.add('bg-amber-500');
        statusText = typeof t === 'function'
          ? t('cs_band_status_lunch', '점심시간 · {time}부터 다시 열어요').replace('{time}', statusObj.time)
          : `점심시간 · ${statusObj.time}부터 다시 열어요`;
        break;

      case 'before-open':
        dotEl.classList.add('bg-gray-400');
        statusText = typeof t === 'function'
          ? t('cs_band_status_before_open', '영업 준비 중 · {time}에 열어요').replace('{time}', statusObj.time)
          : `영업 준비 중 · ${statusObj.time}에 열어요`;
        break;

      case 'closed-today':
        dotEl.classList.add('bg-gray-400');
        if (statusObj.isClosure && statusObj.reason) {
          statusText = typeof t === 'function'
            ? t('cs_band_status_closed_today_reason', '오늘은 쉬어요 · {reason}').replace('{reason}', statusObj.reason)
            : `오늘은 쉬어요 · ${statusObj.reason}`;
        } else {
          statusText = typeof t === 'function'
            ? t('cs_band_status_closed_today', '오늘은 쉬어요')
            : '오늘은 쉬어요';
        }
        break;

      case 'after-close':
      default:
        dotEl.classList.add('bg-gray-400');
        if (statusObj.nextOpen && statusObj.nextOpen.daysAhead === 1) {
          statusText = typeof t === 'function'
            ? t('cs_band_status_after_close_tomorrow', '오늘 영업 마감 · 내일 {time}에 열어요').replace('{time}', statusObj.nextOpen.openTime)
            : `오늘 영업 마감 · 내일 ${statusObj.nextOpen.openTime}에 열어요`;
        } else if (statusObj.nextOpen) {
          const dayName = typeof t === 'function' ? t('day_full_' + statusObj.nextOpen.dayIdx, '월요일') : '월요일';
          statusText = typeof t === 'function'
            ? t('cs_band_status_after_close_day', '오늘 영업 마감 · {day} {time}에 열어요').replace('{day}', dayName).replace('{time}', statusObj.nextOpen.openTime)
            : `오늘 영업 마감 · ${dayName} ${statusObj.nextOpen.openTime}에 열어요`;
        } else {
          statusText = typeof t === 'function' ? t('cs_band_status_closed_today', '오늘은 쉬어요') : '오늘은 쉬어요';
        }
        break;
    }

    textEl.innerText = statusText;
  }

  // 4) 주간 운영시간 요일 병합 리스트 렌더링 (월~일 순서)
  const schedListEl = document.getElementById('footer-weekly-schedule-list');
  if (schedListEl) {
    schedListEl.innerHTML = '';
    const weekly = s.weeklyHours || (typeof DEFAULT_WEEKLY_HOURS !== 'undefined' ? DEFAULT_WEEKLY_HOURS : []);
    const order = [1, 2, 3, 4, 5, 6, 0]; // 월, 화, 수, 목, 금, 토, 일

    // 연속된 동일 스케줄 그룹핑
    const groups = [];
    let curGroup = null;

    order.forEach(dayIdx => {
      const h = weekly[dayIdx] || { open: false };
      const key = h.open ? `open_${h.start}_${h.end}_${h.lunch}_${h.lunchStart}_${h.lunchEnd}` : 'closed';
      if (!curGroup || curGroup.key !== key) {
        curGroup = { key, days: [dayIdx], h };
        groups.push(curGroup);
      } else {
        curGroup.days.push(dayIdx);
      }
    });

    groups.forEach(g => {
      const dNames = g.days.map(d => typeof t === 'function' ? t('day_' + d, String(d)) : String(d));
      let daysLabel = '';
      if (dNames.length === 1) {
        daysLabel = dNames[0];
      } else if (dNames.length === 2 && (g.days.includes(6) && g.days.includes(0))) {
        // 토·일 표기
        daysLabel = dNames.join(lang === 'en' ? ' & ' : '·');
      } else {
        daysLabel = `${dNames[0]}–${dNames[dNames.length - 1]}`;
      }

      let text = '';
      const closedText = typeof t === 'function' ? t('cs_band_closed', '휴무') : '휴무';
      const lunchLabel = typeof t === 'function' ? t('cs_band_lunch_label', '점심') : '점심';

      if (!g.h.open) {
        text = `${daysLabel} ${closedText}`;
      } else {
        const timePart = `${g.h.start || '10:00'}–${g.h.end || '18:00'}`;
        const lunchPart = g.h.lunch ? ` (${lunchLabel} ${g.h.lunchStart || '12:30'}–${g.h.lunchEnd || '13:30'})` : '';
        text = `${daysLabel} ${timePart}${lunchPart}`;
      }

      const div = document.createElement('div');
      div.className = 'flex justify-between items-center py-0.5';
      div.innerHTML = `<span class="text-ink-black">${daysLabel}</span><span>${text.replace(daysLabel, '').trim()}</span>`;
      schedListEl.appendChild(div);
    });
  }

  // 5) 향후 30일 이내 임시 휴무 목록
  const closuresWrap = document.getElementById('footer-upcoming-closures-wrap');
  const closuresListEl = document.getElementById('footer-upcoming-closures-list');
  if (closuresWrap && closuresListEl) {
    closuresListEl.innerHTML = '';
    const closures = s.closures || [];
    const kp = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts() : { dateStr: new Date().toISOString().slice(0, 10) };
    const todayStr = kp.dateStr;

    const [curY, curM, curD] = todayStr.split('-').map(Number);
    const upcomingMap = new Map();

    // 1. 등록된 임시 휴무 수집
    closures.forEach(c => {
      if (c.date >= todayStr) {
        upcomingMap.set(c.date, { date: c.date, reason: c.reason || '', isTemp: true });
      }
    });

    // 2. 향후 30일간 공휴일 휴무 수집
    for (let i = 0; i <= 30; i++) {
      const dObj = new Date(Date.UTC(curY, curM - 1, curD + i, 3, 0, 0));
      const y = dObj.getUTCFullYear();
      const m = String(dObj.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dObj.getUTCDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;

      if (!upcomingMap.has(dStr) && typeof getDaySchedule === 'function') {
        const sched = getDaySchedule(dStr, s);
        if (!sched.open && sched.reason) {
          upcomingMap.set(dStr, { date: dStr, reason: sched.reason, isTemp: false });
        }
      }
    }

    const upcoming = Array.from(upcomingMap.values()).filter(c => {
      const diffDays = (new Date(c.date).getTime() - new Date(todayStr).getTime()) / (24 * 60 * 60 * 1000);
      return diffDays >= 0 && diffDays <= 30;
    });
    upcoming.sort((a, b) => a.date.localeCompare(b.date));

    if (upcoming.length > 0) {
      closuresWrap.classList.remove('hidden');
      upcoming.forEach(c => {
        const [y, m, d] = c.date.split('-').map(Number);
        const fakeUtc = new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
        const dayIdx = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(fakeUtc).day : fakeUtc.getDay();
        const dayName = typeof t === 'function' ? t('day_' + dayIdx, '') : '';
        const tempLabel = typeof t === 'function' ? t('cs_band_temp_closure_label', '임시 휴무') : '임시 휴무';
        const closedLabel = typeof t === 'function' ? t('cs_band_closed', '휴무') : '휴무';
        const translatedReason = typeof tHoliday === 'function' ? tHoliday(c.reason, lang) : c.reason;

        let line = '';
        if (c.isTemp) {
          if (lang === 'en') {
            line = `Closed on ${m}/${d} (${dayName})${c.reason ? ' · ' + c.reason : ''}`;
          } else if (lang === 'ja') {
            line = `${m}月${d}日(${dayName}) ${tempLabel}${c.reason ? ' · ' + c.reason : ''}`;
          } else {
            line = `${m}월 ${d}일(${dayName}) ${tempLabel}${c.reason ? ' · ' + c.reason : ''}`;
          }
        } else {
          // 공휴일 휴무 ("12월 25일(금) 성탄절 휴무")
          if (lang === 'en') {
            line = `Closed on ${m}/${d} (${dayName}) · ${translatedReason}`;
          } else if (lang === 'ja') {
            line = `${m}月${d}日(${dayName}) ${translatedReason} ${closedLabel}`;
          } else {
            line = `${m}월 ${d}일(${dayName}) ${translatedReason} ${closedLabel}`;
          }
        }

        const item = document.createElement('div');
        item.innerText = line;
        closuresListEl.appendChild(item);
      });
    } else {
      closuresWrap.classList.add('hidden');
    }
  }

  // 6) 오시는 길 섹션 토글
  const csSection = document.getElementById('cs-section');
  if (csSection) {
    csSection.dataset.enabled = s.showLocation ? '1' : '';
    const locTab = document.getElementById('guide-tab-location');
    if (locTab) locTab.classList.toggle('hidden', !s.showLocation);
    const locLink = document.getElementById('footer-location-link');
    if (locLink) locLink.classList.toggle('hidden', !s.showLocation);
    updateLocationSection();
    if (s.showLocation) {
      const addrEl = document.getElementById('cs-address');
      if (addrEl) addrEl.innerText = s.address || '서울시 종로구 북촌로 42';
      const addrDetailEl = document.getElementById('cs-address-detail');
      if (addrDetailEl) addrDetailEl.innerText = s.addressDetail || '';
      const dirEl = document.getElementById('cs-directions');
      if (dirEl) {
        if (s.directions && s.directions.trim()) {
          dirEl.innerText = s.directions.trim();
          dirEl.classList.remove('hidden');
        } else {
          dirEl.classList.add('hidden');
        }
      }
      const iframe = document.getElementById('cs-map-iframe');
      if (iframe && typeof mapEmbedUrl === 'function' && s.address) {
        iframe.src = mapEmbedUrl(s.address);
      }
      const kakaoMapBtn = document.getElementById('cs-btn-kakao-map');
      if (kakaoMapBtn && typeof kakaoMapUrl === 'function' && s.address) {
        kakaoMapBtn.href = kakaoMapUrl(s.address);
      }
      const naverMapBtn = document.getElementById('cs-btn-naver-map');
      if (naverMapBtn && typeof naverMapUrl === 'function' && s.address) {
        naverMapBtn.href = naverMapUrl(s.address);
      }
    }
  }

  // 7) 결제 페이지 배송일 달력 갱신 (휴무일이 바뀌었을 수 있음)
  if (typeof renderDeliveryCalendar === 'function') renderDeliveryCalendar();
}
  
// 60초마다 공개/비공개 예약 상태 확인 및 필요 시 재렌더링
let lastVisibleProductIdsStr = '';
function checkScheduledProductsVisibility() {
  try {
    const pdpModal = document.getElementById('pdp-modal');
    // PDP 모달이 열려 있는 동안에는 재렌더링하지 않음
    if (pdpModal && !pdpModal.classList.contains('hidden')) {
      return;
    }

    const products = typeof loadProducts === 'function' ? loadProducts() : [];
    const visibleIds = products
      .filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true)
      .map(p => p.id)
      .sort()
      .join(',');

    if (lastVisibleProductIdsStr === '') {
      lastVisibleProductIdsStr = visibleIds;
      return;
    }

    if (lastVisibleProductIdsStr !== visibleIds) {
      lastVisibleProductIdsStr = visibleIds;
      if (typeof renderProducts === 'function') {
        renderProducts(typeof currentCategory !== 'undefined' ? currentCategory : 'all');
      }
      if (typeof updateHeroRecommendButton === 'function') {
        updateHeroRecommendButton();
      }
      if (typeof initInquiryProductOptions === 'function') {
        initInquiryProductOptions();
      }
    }
  } catch (e) {
    console.error('checkScheduledProductsVisibility error:', e);
  }
}
setInterval(checkScheduledProductsVisibility, 60000);

  

// 오시는 길은 홈 맨 아래와 정성 안내 '오시는 길' 탭에서만 (매장 공개를 켰을 때)
function updateLocationSection() {
  const sec = document.getElementById('cs-section');
  if (!sec) return;
  const visible = id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); };
  const onHome = visible('view-shop');
  const onGuide = visible('view-guide') && typeof currentGuideTab !== 'undefined' && currentGuideTab === 'location';
  sec.classList.toggle('hidden', !(sec.dataset.enabled && (onHome || onGuide)));
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('hashchange', () => setTimeout(() => { updateLocationSection(); if (typeof updatePopupVisibility === 'function') updatePopupVisibility(); }, 0));
  const originalHide = typeof hideMainViews === 'function' ? hideMainViews : null;
  if (originalHide) {
    hideMainViews = function (...args) {
      const r = originalHide.apply(this, args);
      updateLocationSection();
      if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
      return r;
    };
  }
  const originalShowView = showView;
  showView = function (...args) {
    const r = originalShowView.apply(this, args);
    updateLocationSection();
    if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
    return r;
  };
});
