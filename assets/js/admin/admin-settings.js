// assets/js/admin/admin-settings.js
// 설담화 관리자: 매장 정보·운영시간·공휴일·임시 휴무 설정
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 7. 매장 정보 설정 관리 (주간 스케줄 및 임시 휴무일)
let adminWeeklyHours = [];
let adminClosures = [];
let adminHolidayClosed = true;
let adminHolidayOverrides = {};
let adminCustomHolidays = [];

const DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월(1), 화(2), 수(3), 목(4), 금(5), 토(6), 일(0)
const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const DAY_SHORT_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function renderAdminSettings() {
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

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('settings-phone', s.phone);
  setVal('settings-email', s.email);
  setVal('settings-kakao', s.kakaoChannelUrl);
  setVal('settings-shop-url', s.shopUrl || '');
  setVal('settings-address', s.address);
  setVal('settings-address-detail', s.addressDetail);
  setVal('settings-directions', s.directions);

  const locCheck = document.getElementById('settings-show-location');
  if (locCheck) {
    locCheck.checked = !!s.showLocation;
  }

  adminWeeklyHours = JSON.parse(JSON.stringify(s.weeklyHours || (typeof DEFAULT_WEEKLY_HOURS !== 'undefined' ? DEFAULT_WEEKLY_HOURS : [])));
  adminClosures = JSON.parse(JSON.stringify(s.closures || []));
  adminHolidayClosed = s.holidayClosed !== false;
  adminHolidayOverrides = JSON.parse(JSON.stringify(s.holidayOverrides || {}));
  adminCustomHolidays = JSON.parse(JSON.stringify(s.customHolidays || []));

  const holidaySwitch = document.getElementById('settings-holiday-closed');
  if (holidaySwitch) holidaySwitch.checked = adminHolidayClosed;
  const holidayWrap = document.getElementById('admin-holidays-wrapper');
  if (holidayWrap) {
    if (adminHolidayClosed) {
      holidayWrap.classList.remove('hidden');
      renderHolidaysList();
    } else {
      holidayWrap.classList.add('hidden');
    }
  }

  renderWeeklyHoursTable();
  renderClosuresList();
  updateAdminMapPreview();
}

// 주간 운영시간 테이블 렌더링 (월~일 순서)
const DAY_NAMES_KO = ['일', '월', '화', '수', '목', '금', '토'];

function renderWeeklyHoursTable() {
  const tbody = document.getElementById('admin-weekly-hours-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  DISPLAY_DAY_ORDER.forEach(dayIdx => {
    const h = adminWeeklyHours[dayIdx] || { open: false, start: '10:00', end: '18:00', lunch: false, lunchStart: '12:30', lunchEnd: '13:30' };
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-black/[0.02] transition-colors';

    const isWeekend = dayIdx === 0 || dayIdx === 6;
    const dayColor = dayIdx === 0 ? 'text-seal-red font-bold' : (dayIdx === 6 ? 'text-blue-600 font-bold' : 'text-ink-black font-bold');

    tr.innerHTML = `
      <td class="p-2.5 text-center ${dayColor}">${DAY_SHORT_NAMES[dayIdx]}</td>
      <td class="p-2.5 text-center">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="hours-open-${dayIdx}" aria-label="${DAY_NAMES_KO ? DAY_NAMES_KO[dayIdx] : ''}요일 영업" ${h.open ? 'checked' : ''} onchange="toggleDayOpen(${dayIdx}, this.checked)" class="sr-only peer">
          <div class="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-seal-red"></div>
        </label>
      </td>
      <td class="p-2.5">
        <div class="inline-flex items-center gap-1.5">
          <input type="time" id="hours-start-${dayIdx}" aria-label="${DAY_NAMES_KO ? DAY_NAMES_KO[dayIdx] : ''}요일 여는 시각" value="${h.start || '10:00'}" ${!h.open ? 'disabled' : ''} onchange="updateDayTime(${dayIdx}, 'start', this.value)" class="bg-white border border-ink-black/20 p-1.5 rounded-xs text-xs font-mono disabled:bg-gray-100 disabled:text-gray-400">
          <span class="text-ink-light">~</span>
          <input type="time" id="hours-end-${dayIdx}" aria-label="${DAY_NAMES_KO ? DAY_NAMES_KO[dayIdx] : ''}요일 닫는 시각" value="${h.end || '18:00'}" ${!h.open ? 'disabled' : ''} onchange="updateDayTime(${dayIdx}, 'end', this.value)" class="bg-white border border-ink-black/20 p-1.5 rounded-xs text-xs font-mono disabled:bg-gray-100 disabled:text-gray-400">
        </div>
      </td>
      <td class="p-2.5 text-center">
        <input type="checkbox" id="hours-lunch-${dayIdx}" aria-label="${DAY_NAMES_KO ? DAY_NAMES_KO[dayIdx] : ''}요일 점심시간 있음" ${h.lunch ? 'checked' : ''} ${!h.open ? 'disabled' : ''} onchange="toggleDayLunch(${dayIdx}, this.checked)" class="rounded-xs border-ink-black/20 text-seal-red focus:ring-seal-red disabled:opacity-40">
      </td>
      <td class="p-2.5">
        <div class="inline-flex items-center gap-1.5">
          <input type="time" id="hours-lunch-start-${dayIdx}" aria-label="${DAY_NAMES_KO ? DAY_NAMES_KO[dayIdx] : ''}요일 점심 시작" value="${h.lunchStart || '12:30'}" ${(!h.open || !h.lunch) ? 'disabled' : ''} onchange="updateDayTime(${dayIdx}, 'lunchStart', this.value)" class="bg-white border border-ink-black/20 p-1.5 rounded-xs text-xs font-mono disabled:bg-gray-100 disabled:text-gray-400">
          <span class="text-ink-light">~</span>
          <input type="time" id="hours-lunch-end-${dayIdx}" aria-label="${DAY_NAMES_KO ? DAY_NAMES_KO[dayIdx] : ''}요일 점심 끝" value="${h.lunchEnd || '13:30'}" ${(!h.open || !h.lunch) ? 'disabled' : ''} onchange="updateDayTime(${dayIdx}, 'lunchEnd', this.value)" class="bg-white border border-ink-black/20 p-1.5 rounded-xs text-xs font-mono disabled:bg-gray-100 disabled:text-gray-400">
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleDayOpen(dayIdx, isOpen) {
  if (!adminWeeklyHours[dayIdx]) return;
  adminWeeklyHours[dayIdx].open = isOpen;
  renderWeeklyHoursTable();
  validateWeeklyHours();
}

function toggleDayLunch(dayIdx, hasLunch) {
  if (!adminWeeklyHours[dayIdx]) return;
  adminWeeklyHours[dayIdx].lunch = hasLunch;
  renderWeeklyHoursTable();
  validateWeeklyHours();
}

function updateDayTime(dayIdx, field, val) {
  if (!adminWeeklyHours[dayIdx]) return;
  adminWeeklyHours[dayIdx][field] = val;
  validateWeeklyHours();
}

// 주간 운영시간 유효성 검사
function validateWeeklyHours() {
  const errEl = document.getElementById('settings-hours-error');
  let errorMsg = null;

  for (let i = 0; i < adminWeeklyHours.length; i++) {
    const h = adminWeeklyHours[i];
    if (!h.open) continue;

    const dayName = DAY_NAMES[i];
    if (!h.start || !h.end) {
      errorMsg = `${dayName}의 운영 시작 시간과 종료 시간을 모두 입력해 주세요.`;
      break;
    }
    if (h.start >= h.end) {
      errorMsg = `${dayName}의 종료 시간(${h.end})은 시작 시간(${h.start})보다 늦어야 합니다.`;
      break;
    }

    if (h.lunch) {
      if (!h.lunchStart || !h.lunchEnd) {
        errorMsg = `${dayName}의 점심시간 시작 및 종료 시간을 입력해 주세요.`;
        break;
      }
      if (h.lunchStart >= h.lunchEnd) {
        errorMsg = `${dayName}의 점심 종료 시간(${h.lunchEnd})은 시작 시간(${h.lunchStart})보다 늦어야 합니다.`;
        break;
      }
      if (h.lunchStart < h.start || h.lunchEnd > h.end) {
        errorMsg = `${dayName}의 점심시간(${h.lunchStart}~${h.lunchEnd})은 운영시간(${h.start}~${h.end}) 안에 포함되어야 합니다.`;
        break;
      }
    }
  }

  if (errEl) {
    if (errorMsg) {
      errEl.innerText = errorMsg;
      errEl.classList.remove('hidden');
    } else {
      errEl.innerText = '';
      errEl.classList.add('hidden');
    }
  }

  return errorMsg;
}

// 임시 휴무일 목록 렌더링
function renderClosuresList() {
  const container = document.getElementById('admin-closures-list');
  if (!container) return;
  container.innerHTML = '';

  adminClosures.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const todayStr = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts().dateStr : new Date().toISOString().slice(0, 10);

  if (adminClosures.length === 0) {
    container.innerHTML = '<div class="p-3 text-center text-ink-light">등록된 임시 휴무일이 없습니다.</div>';
    return;
  }

  adminClosures.forEach((c, idx) => {
    const isPast = c.date < todayStr;
    const row = document.createElement('div');
    row.className = `flex items-center justify-between p-2.5 ${isPast ? 'bg-gray-50 text-ink-light' : 'hover:bg-black/[0.02]'}`;

    let weekdayLabel = '';
    if (c.date && /^d{4}-d{2}-d{2}$/.test(c.date)) {
      const [y, m, d] = c.date.split('-').map(Number);
      const fakeUtc = new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
      const dayIdx = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(fakeUtc).day : fakeUtc.getDay();
      weekdayLabel = `(${DAY_SHORT_NAMES[dayIdx]})`;
    }

    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="font-mono font-bold ${isPast ? 'line-through text-gray-400' : 'text-ink-black'}">${c.date}</span>
        <span class="text-[11px] ${isPast ? 'text-gray-400' : 'text-ink-gray'}">${weekdayLabel}</span>
        <span class="text-xs ${isPast ? 'text-gray-400' : 'text-seal-red font-medium'}">${escapeHtml(c.reason || '임시 휴무')}</span>
        ${isPast ? '<span class="text-[10px] px-1.5 py-0.2 rounded-xs bg-gray-200 text-gray-600">지난 날짜</span>' : ''}
      </div>
      <button type="button" onclick="removeClosureDate(${idx})" class="text-ink-light hover:text-seal-red text-xs px-2 py-1 rounded-xs hover:bg-black/5 cursor-pointer font-bold">
        삭제
      </button>
    `;
    container.appendChild(row);
  });
}

function addClosureDate() {
  const dateEl = document.getElementById('new-closure-date');
  const reasonEl = document.getElementById('new-closure-reason');
  if (!dateEl || !dateEl.value) {
    alert('임시 휴무 날짜를 선택해 주세요.');
    return;
  }

  const date = dateEl.value;
  const reason = reasonEl ? reasonEl.value.trim() : '';

  const exists = adminClosures.some(c => c.date === date);
  if (exists) {
    alert('이미 등록된 날짜입니다.');
    return;
  }

  adminClosures.push({ date, reason: reason || '임시 휴무' });
  dateEl.value = '';
  if (reasonEl) reasonEl.value = '';

  renderClosuresList();
}

function removeClosureDate(idx) {
  if (idx >= 0 && idx < adminClosures.length) {
    adminClosures.splice(idx, 1);
    renderClosuresList();
  }
}

function cleanPastClosures() {
  const todayStr = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts().dateStr : new Date().toISOString().slice(0, 10);
  const beforeCount = adminClosures.length;
  adminClosures = adminClosures.filter(c => c.date >= todayStr);
  const removed = beforeCount - adminClosures.length;
  renderClosuresList();
  alert(removed > 0 ? `지난 임시 휴무일 ${removed}건을 정리했습니다.` : '정리할 지난 임시 휴무일이 없습니다.');
}

function updateAdminMapPreview() {
  const addrEl = document.getElementById('settings-address');
  const mapEl = document.getElementById('admin-map-preview');
  if (addrEl && mapEl && typeof mapEmbedUrl === 'function') {
    const addr = addrEl.value.trim();
    mapEl.src = mapEmbedUrl(addr);
  }
}

// 매장 설정 탭: showPanelTab 공통 헬퍼 래퍼
function showSettingsTab(name) {
  if (typeof showPanelTab === 'function') return showPanelTab('settings', name);
}

// 저장할 때 다른 탭에 잘못된 칸이 있으면 그 탭을 열어 알려 줌 (숨은 칸은 브라우저가 알려 주지 못함)
function checkSettingsFormValid() {
  if (typeof checkFormValid === 'function') return checkFormValid('admin-settings-form');
  const form = document.getElementById('admin-settings-form');
  const bad = form ? form.querySelector(':invalid') : null;
  if (!bad) return true;
  const tab = bad.closest('[data-panel-tab]') || bad.closest('[data-settings-tab]');
  if (tab) {
    const tabName = tab.dataset.panelTab ? tab.dataset.panelTab.split(':')[1] : tab.dataset.settingsTab;
    showSettingsTab(tabName);
  }
  bad.reportValidity();
  return false;
}

function saveStoreSettings(e) {
  e.preventDefault();
  if (!checkSettingsFormValid()) return;
  const phone = document.getElementById('settings-phone').value.trim();
  const address = document.getElementById('settings-address').value.trim();
  const showLocation = document.getElementById('settings-show-location').checked;

  if (!phone) {
    alert('대표 전화번호는 필수 입력 항목입니다.');
    return;
  }

  if (showLocation && !address) {
    alert('오프라인 매장 오시는 길을 공개하려면 도로명 주소를 입력해 주세요.');
    return;
  }

  const kakaoUrl = document.getElementById('settings-kakao').value.trim();
  if (kakaoUrl && !kakaoUrl.startsWith('http://') && !kakaoUrl.startsWith('https://')) {
    alert('카카오톡 채널 주소는 "http://" 또는 "https://"로 시작해야 합니다.');
    return;
  }

  // 주간 운영시간 유효성 검사
  const hoursError = validateWeeklyHours();
  if (hoursError) {
    alert('운영시간 설정을 확인해 주세요:\n' + hoursError);
    return;
  }

  const existing = typeof loadSettings === 'function' ? loadSettings() : {};

  const newSettings = {
    ...existing,
    phone,
    email: document.getElementById('settings-email').value.trim(),
    kakaoChannelUrl: kakaoUrl,
    shopUrl: (document.getElementById('settings-shop-url') ? document.getElementById('settings-shop-url').value.trim() : ''),
    weeklyHours: adminWeeklyHours,
    closures: adminClosures,
    holidayClosed: adminHolidayClosed,
    holidayOverrides: adminHolidayOverrides,
    customHolidays: adminCustomHolidays,
    address,
    addressDetail: document.getElementById('settings-address-detail').value.trim(),
    directions: document.getElementById('settings-directions').value.trim(),
    showLocation: showLocation
  };

  if (typeof saveSettings === 'function') {
    saveSettings(newSettings);
  } else {
    DataStore.write(DataStore.KEYS.settings, newSettings);
  }

  alert('저장되었습니다. 쇼핑몰에 바로 반영됩니다.');
  updateAdminMapPreview();
}

// 공휴일 휴무 스위치 토글
function toggleHolidayClosedSwitch() {
  const checkbox = document.getElementById('settings-holiday-closed');
  adminHolidayClosed = checkbox ? checkbox.checked : true;
  const wrap = document.getElementById('admin-holidays-wrapper');
  if (wrap) {
    if (adminHolidayClosed) {
      wrap.classList.remove('hidden');
      renderHolidaysList();
    } else {
      wrap.classList.add('hidden');
    }
  }
}

// 다가오는 공휴일 목록 렌더링
function renderHolidaysList() {
  const container = document.getElementById('admin-holidays-list');
  if (!container) return;
  container.innerHTML = '';

  const kp = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts() : { dateStr: new Date().toISOString().slice(0, 10) };
  const todayStr = kp.dateStr;

  const all = [
    ...(typeof KOREAN_HOLIDAYS !== 'undefined' ? KOREAN_HOLIDAYS : []),
    ...adminCustomHolidays
  ];

  // 오늘 이후 다가오는 공휴일만 필터링 및 날짜 오름차순 정렬
  const upcoming = all.filter(h => h.date >= todayStr);
  upcoming.sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    container.innerHTML = '<div class="p-3 text-center text-ink-gray">예정된 공휴일이 없습니다.</div>';
    return;
  }

  upcoming.forEach(h => {
    const [y, m, d] = h.date.split('-').map(Number);
    const fakeUtc = new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
    const dayIdx = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(fakeUtc).day : fakeUtc.getDay();
    const weekdayName = DAY_SHORT_NAMES[dayIdx] || '';

    const override = adminHolidayOverrides[h.date];
    let isClosed = false;
    if (override === 'open') {
      isClosed = false;
    } else if (override === 'closed') {
      isClosed = true;
    } else if (h.optional) {
      isClosed = false;
    } else {
      isClosed = adminHolidayClosed !== false;
    }

    const isCustom = adminCustomHolidays.some(c => c.date === h.date && c.name === h.name);

    const row = document.createElement('div');
    row.className = 'p-2.5 flex items-center justify-between hover:bg-black/[0.02] transition-colors';
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="font-mono font-bold text-ink-black">${h.date} (${weekdayName})</span>
        <span class="font-bold text-ink-charcoal">${escapeHtml(h.name)}</span>
        ${isCustom ? '<span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">사용자 추가</span>' : ''}
        ${h.optional ? '<span class="bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-bold">기본 영업</span>' : ''}
      </div>
      <div class="flex items-center gap-1.5">
        <button type="button" onclick="toggleHolidayOverride('${h.date}')" class="px-2.5 py-1 text-xs font-bold rounded-xs cursor-pointer transition-colors ${isClosed ? 'bg-red-50 text-seal-red border border-seal-red/30 hover:bg-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'}">
          ${isClosed ? '쉬기 (휴무)' : '영업 (정상)'}
        </button>
        ${isCustom ? `
          <button type="button" onclick="removeCustomHoliday('${h.date}')" class="text-ink-gray hover:text-seal-red p-1 cursor-pointer" title="삭제">
            ✕
          </button>
        ` : ''}
      </div>
    `;
    container.appendChild(row);
  });
}

function toggleHolidayOverride(dateStr) {
  const all = [
    ...(typeof KOREAN_HOLIDAYS !== 'undefined' ? KOREAN_HOLIDAYS : []),
    ...adminCustomHolidays
  ];
  const h = all.find(item => item.date === dateStr);
  const override = adminHolidayOverrides[dateStr];
  let isCurrentlyClosed = false;
  if (override === 'open') {
    isCurrentlyClosed = false;
  } else if (override === 'closed') {
    isCurrentlyClosed = true;
  } else if (h && h.optional) {
    isCurrentlyClosed = false;
  } else {
    isCurrentlyClosed = adminHolidayClosed !== false;
  }

  adminHolidayOverrides[dateStr] = isCurrentlyClosed ? 'open' : 'closed';
  renderHolidaysList();
}

function addCustomHoliday() {
  const dateEl = document.getElementById('new-holiday-date');
  const nameEl = document.getElementById('new-holiday-name');
  const date = dateEl ? dateEl.value : '';
  const name = nameEl ? nameEl.value.trim() : '';

  if (!date) {
    alert('공휴일 날짜를 선택해 주세요.');
    return;
  }
  if (!name) {
    alert('공휴일 이름을 입력해 주세요.');
    return;
  }

  if (adminCustomHolidays.some(c => c.date === date)) {
    alert('이미 등록된 공휴일 날짜입니다.');
    return;
  }

  adminCustomHolidays.push({ date, name });
  if (dateEl) dateEl.value = '';
  if (nameEl) nameEl.value = '';
  renderHolidaysList();
}

function removeCustomHoliday(dateStr) {
  adminCustomHolidays = adminCustomHolidays.filter(c => c.date !== dateStr);
  delete adminHolidayOverrides[dateStr];
  renderHolidaysList();
}

// ----------------------------------------------------
// 8. 포장 옵션 관리 (Packaging Settings)
// ----------------------------------------------------
function renderPackagingSettings() {
  const listEl = document.getElementById('admin-packaging-list');
  if (!listEl) return;
  const s = typeof loadSettings === 'function' ? loadSettings() : {};
  const list = (s && Array.isArray(s.packaging)) ? s.packaging : (typeof DEFAULT_PACKAGING !== 'undefined' ? DEFAULT_PACKAGING : []);

  if (!list.length) {
    listEl.innerHTML = '<p class="text-xs text-ink-gray py-4 text-center">등록된 포장 옵션이 없습니다.</p>';
    return;
  }

  // 첫 번째 활성화된 옵션 인덱스 (기본값)
  const firstEnabledIdx = list.findIndex(p => p.enabled);

  listEl.innerHTML = list.map((pkg, idx) => {
    const isFirstEnabled = idx === firstEnabledIdx;
    const priceText = Number(pkg.price) === 0 ? '무료' : `+${Number(pkg.price).toLocaleString()}원`;
    const photoHtml = pkg.photo
      ? `<img src="${escapeHtml(pkg.photo)}" alt="" class="w-12 h-12 object-cover rounded-xs border border-ink-black/10 shrink-0">`
      : `<div class="w-12 h-12 rounded-xs border border-dashed border-ink-black/20 bg-hanji/40 flex items-center justify-center text-ink-gray/40 text-[11px] shrink-0">사진 없음</div>`;

    return `
      <div class="p-3 bg-white border border-ink-black/15 rounded-xs flex flex-wrap items-center justify-between gap-3 ${pkg.enabled ? '' : 'opacity-60 bg-gray-50'}">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="flex flex-col gap-0.5 shrink-0">
            <button type="button" onclick="movePackagingOption('${pkg.id}', -1)" ${idx === 0 ? 'disabled' : ''} class="w-6 h-5 border border-ink-black/20 rounded-xs text-[10px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-20 cursor-pointer" aria-label="위로 이동">▲</button>
            <button type="button" onclick="movePackagingOption('${pkg.id}', 1)" ${idx === list.length - 1 ? 'disabled' : ''} class="w-6 h-5 border border-ink-black/20 rounded-xs text-[10px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-20 cursor-pointer" aria-label="아래로 이동">▼</button>
          </div>
          ${photoHtml}
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-bold text-ink-black text-xs">${escapeHtml(pkg.name)}</span>
              <span class="font-bold text-seal-red text-xs font-mono">${priceText}</span>
              ${isFirstEnabled ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-seal-red text-white">기본 옵션</span>' : ''}
              ${pkg.enabled ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">사용 중</span>' : '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">미사용</span>'}
            </div>
            ${pkg.desc ? `<p class="text-[11px] text-ink-gray truncate mt-0.5">${escapeHtml(pkg.desc)}</p>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="togglePackagingOption('${pkg.id}')" class="px-2.5 py-1 text-xs font-bold border border-ink-black/20 rounded-xs hover:border-ink-black cursor-pointer bg-white">${pkg.enabled ? '끄기' : '켜기'}</button>
          <button type="button" onclick="openPackagingModal('${pkg.id}')" class="px-2.5 py-1 text-xs font-bold border border-ink-black/20 rounded-xs hover:border-ink-black cursor-pointer bg-white">수정</button>
          <button type="button" onclick="deletePackagingOption('${pkg.id}')" class="px-2.5 py-1 text-xs font-bold border border-seal-red/30 text-seal-red rounded-xs hover:bg-seal-red/10 cursor-pointer bg-white">삭제</button>
        </div>
      </div>
    `;
  }).join('');
}

function openPackagingModal(pkgId) {
  const modal = document.getElementById('modal-packaging');
  if (!modal) return;
  const s = typeof loadSettings === 'function' ? loadSettings() : {};
  const list = (s && Array.isArray(s.packaging)) ? s.packaging : (typeof DEFAULT_PACKAGING !== 'undefined' ? DEFAULT_PACKAGING : []);
  const pkg = pkgId ? list.find(p => p.id === pkgId) : null;

  document.getElementById('modal-packaging-title').innerText = pkg ? '포장 옵션 수정' : '새 포장 옵션 추가';
  document.getElementById('pkg-id').value = pkg ? pkg.id : '';
  document.getElementById('pkg-name').value = pkg ? pkg.name : '';
  document.getElementById('pkg-desc').value = pkg ? (pkg.desc || '') : '';
  document.getElementById('pkg-price').value = pkg ? (pkg.price || 0) : 0;
  document.getElementById('pkg-photo').value = pkg ? (pkg.photo || '') : '';
  document.getElementById('pkg-enabled').checked = pkg ? (pkg.enabled !== false) : true;

  const preview = document.getElementById('pkg-photo-preview');
  if (preview) {
    if (pkg && pkg.photo) {
      preview.src = pkg.photo;
      preview.classList.remove('hidden');
    } else {
      preview.src = '';
      preview.classList.add('hidden');
    }
  }

  modal.classList.remove('hidden');
}

function closePackagingModal() {
  const modal = document.getElementById('modal-packaging');
  if (modal) modal.classList.add('hidden');
}

function pickPackagingPhoto() {
  if (typeof openImagePicker === 'function') {
    openImagePicker(src => {
      const inp = document.getElementById('pkg-photo');
      if (inp) inp.value = src;
      const preview = document.getElementById('pkg-photo-preview');
      if (preview) {
        preview.src = src;
        preview.classList.remove('hidden');
      }
    });
  }
}

function savePackagingOption(e) {
  e.preventDefault();
  const idInput = document.getElementById('pkg-id');
  const nameInput = document.getElementById('pkg-name');
  const descInput = document.getElementById('pkg-desc');
  const priceInput = document.getElementById('pkg-price');
  const photoInput = document.getElementById('pkg-photo');
  const enabledInput = document.getElementById('pkg-enabled');

  const name = nameInput.value.trim();
  if (!name) {
    alert('포장 옵션 이름을 입력해 주세요.');
    return;
  }
  const price = Math.max(0, parseInt(priceInput.value, 10) || 0);
  const desc = descInput.value.trim();
  const photo = photoInput.value.trim();
  const enabled = enabledInput.checked;

  const s = typeof loadSettings === 'function' ? loadSettings() : {};
  let list = (s && Array.isArray(s.packaging)) ? [...s.packaging] : (typeof DEFAULT_PACKAGING !== 'undefined' ? [...DEFAULT_PACKAGING] : []);

  const existingId = idInput.value;
  if (existingId) {
    const idx = list.findIndex(p => p.id === existingId);
    if (idx !== -1) {
      // 끄는 경우 최소 1개 활성화 검증
      if (!enabled && list.filter(p => p.enabled && p.id !== existingId).length === 0) {
        alert('최소 1개의 포장 옵션은 사용 중이어야 합니다.');
        return;
      }
      list[idx] = { ...list[idx], name, desc, price, photo, enabled };
    }
  } else {
    const newId = `pkg-${Date.now()}`;
    list.push({ id: newId, name, desc, price, photo, enabled });
  }

  // 최소 1개 활성화 보장
  if (!list.some(p => p.enabled)) {
    list[0].enabled = true;
  }

  if (typeof saveSettings === 'function') {
    saveSettings({ packaging: list });
  } else {
    DataStore.write(DataStore.KEYS.settings, { ...s, packaging: list });
  }

  closePackagingModal();
  renderPackagingSettings();
}

function togglePackagingOption(pkgId) {
  const s = typeof loadSettings === 'function' ? loadSettings() : {};
  let list = (s && Array.isArray(s.packaging)) ? [...s.packaging] : (typeof DEFAULT_PACKAGING !== 'undefined' ? [...DEFAULT_PACKAGING] : []);
  const item = list.find(p => p.id === pkgId);
  if (!item) return;

  if (item.enabled) {
    const enabledCount = list.filter(p => p.enabled).length;
    if (enabledCount <= 1) {
      alert('최소 1개의 포장 옵션은 사용 중이어야 합니다.');
      return;
    }
  }
  item.enabled = !item.enabled;

  if (typeof saveSettings === 'function') {
    saveSettings({ packaging: list });
  } else {
    DataStore.write(DataStore.KEYS.settings, { ...s, packaging: list });
  }
  renderPackagingSettings();
}

function deletePackagingOption(pkgId) {
  const s = typeof loadSettings === 'function' ? loadSettings() : {};
  let list = (s && Array.isArray(s.packaging)) ? [...s.packaging] : (typeof DEFAULT_PACKAGING !== 'undefined' ? [...DEFAULT_PACKAGING] : []);
  const item = list.find(p => p.id === pkgId);
  if (!item) return;

  if (item.enabled) {
    const enabledCount = list.filter(p => p.enabled).length;
    if (enabledCount <= 1) {
      alert('최소 1개의 포장 옵션은 사용 중이어야 합니다.');
      return;
    }
  }

  if (!confirm(`'${item.name}' 포장 옵션을 삭제하시겠습니까?`)) return;

  list = list.filter(p => p.id !== pkgId);
  if (!list.some(p => p.enabled) && list.length > 0) {
    list[0].enabled = true;
  }

  if (typeof saveSettings === 'function') {
    saveSettings({ packaging: list });
  } else {
    DataStore.write(DataStore.KEYS.settings, { ...s, packaging: list });
  }
  renderPackagingSettings();
}

function movePackagingOption(pkgId, dir) {
  const s = typeof loadSettings === 'function' ? loadSettings() : {};
  let list = (s && Array.isArray(s.packaging)) ? [...s.packaging] : (typeof DEFAULT_PACKAGING !== 'undefined' ? [...DEFAULT_PACKAGING] : []);
  const idx = list.findIndex(p => p.id === pkgId);
  if (idx === -1) return;
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;

  if (typeof saveSettings === 'function') {
    saveSettings({ packaging: list });
  } else {
    DataStore.write(DataStore.KEYS.settings, { ...s, packaging: list });
  }
  renderPackagingSettings();
}

// 6. 탭 전환

// ----------------------------------------------------
