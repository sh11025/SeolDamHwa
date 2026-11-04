// assets/js/site-settings.js
// 설담화(說談花) 매장 정보, 주간 운영시간, 고객센터 및 지도 설정 공유 모듈

// 기본 주간 운영시간 (0: 일요일 ~ 6: 토요일)
// 기본값: 월~금 10:00~18:00 (점심 12:30~13:30), 토/일 휴무
const DEFAULT_WEEKLY_HOURS = [
  { open: false, start: '10:00', end: '18:00', lunch: false, lunchStart: '12:30', lunchEnd: '13:30' }, // 0: 일
  { open: true,  start: '10:00', end: '18:00', lunch: true,  lunchStart: '12:30', lunchEnd: '13:30' }, // 1: 월
  { open: true,  start: '10:00', end: '18:00', lunch: true,  lunchStart: '12:30', lunchEnd: '13:30' }, // 2: 화
  { open: true,  start: '10:00', end: '18:00', lunch: true,  lunchStart: '12:30', lunchEnd: '13:30' }, // 3: 수
  { open: true,  start: '10:00', end: '18:00', lunch: true,  lunchStart: '12:30', lunchEnd: '13:30' }, // 4: 목
  { open: true,  start: '10:00', end: '18:00', lunch: true,  lunchStart: '12:30', lunchEnd: '13:30' }, // 5: 금
  { open: false, start: '10:00', end: '18:00', lunch: false, lunchStart: '12:30', lunchEnd: '13:30' }  // 6: 토
];

// 대한민국 법정 공휴일 목록 (2026년 말 ~ 2027년 말)
const KOREAN_HOLIDAYS = [
  { date: "2026-12-25", name: "성탄절" },
  { date: "2027-01-01", name: "신정" },
  { date: "2027-02-06", name: "설날 연휴" },
  { date: "2027-02-07", name: "설날" },
  { date: "2027-02-08", name: "설날 연휴" },
  { date: "2027-02-09", name: "설날 대체공휴일" },
  { date: "2027-03-01", name: "삼일절" },
  { date: "2027-05-01", name: "노동절", optional: true },
  { date: "2027-05-05", name: "어린이날" },
  { date: "2027-05-13", name: "부처님오신날" },
  { date: "2027-06-06", name: "현충일" },
  { date: "2027-08-15", name: "광복절" },
  { date: "2027-08-16", name: "광복절 대체공휴일" },
  { date: "2027-09-14", name: "추석 연휴" },
  { date: "2027-09-15", name: "추석" },
  { date: "2027-09-16", name: "추석 연휴" },
  { date: "2027-10-03", name: "개천절" },
  { date: "2027-10-04", name: "개천절 대체공휴일" },
  { date: "2027-10-09", name: "한글날" },
  { date: "2027-10-11", name: "한글날 대체공휴일" },
  { date: "2027-12-25", name: "성탄절" },
  { date: "2027-12-27", name: "성탄절 대체공휴일" }
];

const DEFAULT_SETTINGS = {
  phone: '02-764-1920',
  hours: '평일 10:00 - 18:00',
  lunch: '점심시간 12:30 - 13:30',
  closed: '주말 · 공휴일 휴무',
  email: 'contact@seoldamhwa.kr',
  address: '서울시 종로구 북촌로 42',
  addressDetail: '(임시 주소)',
  directions: '',          // 예: "안국역 2번 출구 도보 7분"
  kakaoChannelUrl: '',     // 예: "https://pf.kakao.com/_xxxx"
  shopUrl: '',             // 후기 요청 링크용 쇼핑몰 주소
  showLocation: false,     // 오프라인 아틀리에 오시는 길 공개 여부 (기본 false: 비공개)
  business: { companyName: '설담화', ceo: '', bizNumber: '', mailOrderNumber: '', bizAddress: '', privacyOfficer: '' }, // 사업자 정보 (맨 아래·약관에 표시)
  // 배송 방법·배송비 (관리자 > 매장 정보 설정에서 수정)
  delivery: {
    quick: { enabled: true, fee: 15000, area: '서울 전 지역', sameDayUntil: '' }, // 퀵 배송 (sameDayUntil 'HH:MM'이면 그 시각 전 주문은 오늘 받기 가능)
    parcel: { enabled: false, fee: 4000, area: '전국 (생화 특성상 제주·도서 지역 제외)' }, // 택배
    pickup: { enabled: false, fee: 0, area: '' },                    // 매장 픽업 (매장 공개 후 켜기)
    freeOver: 100000,   // 이 금액 이상 주문하면 배송비 무료 (0이면 무료 조건 없음)
    note: '',           // 주문서에 함께 보여 줄 배송 안내 한 줄
    dailyLimit: 0,      // 하루 기본 주문 상한 (0 = 무제한)
    dateLimits: []      // 특정일 주문 상한 [{ date: "YYYY-MM-DD", limit: 20 }, ...]
  },
  weeklyHours: DEFAULT_WEEKLY_HOURS,
  closures: [],            // [ { date: "YYYY-MM-DD", reason: "" }, ... ]
  holidayClosed: true,     // 공휴일 휴무 여부 (기본: true)
  holidayOverrides: {},    // { "YYYY-MM-DD": "open" | "closed" }
  customHolidays: []       // [ { date: "YYYY-MM-DD", name: "" }, ... ]
};

/**
 * 한국 시간(Asia/Seoul, UTC+9) 기준 날짜/시간 구성요소 추출 헬퍼
 * 해외 방문자 브라우저 시계와 무관하게 항상 한국 시간으로 판정
 */
function getKoreaTimeParts(date = new Date()) {
  const d = (date && typeof date.getTime === 'function') ? new Date(date.getTime()) : (date ? new Date(date) : new Date());
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const map = {};
  parts.forEach(p => map[p.type] = p.value);

  const weekdayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const day = weekdayMap[map.weekday] ?? 0;
  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const dateNum = parseInt(map.day, 10);
  const hours = parseInt(map.hour, 10);
  const minutes = parseInt(map.minute, 10);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return { year, month, date: dateNum, day, hours, minutes, dateStr, timeStr };
}

/**
 * UTC ISO 시간 문자열을 한국 표준시(Asia/Seoul) 기준 날짜/시간 문자열로 변환하는 헬퍼
 * @param {string|Date} isoStr - UTC ISO 문자열 또는 Date 객체
 * @param {object} [options]
 * @param {boolean} [options.time=false] - 시각(HH:mm) 포함 여부
 * @param {string} [options.delimiter='-'] - 날짜 구분자 ('-' 또는 '.')
 * @returns {string} 변환된 문자열 (예: "2026-11-04 12:09" 또는 "2026.11.04")
 */
function formatKoreaTime(isoStr, { time = false, delimiter = '-' } = {}) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    const kp = getKoreaTimeParts(d);
    const ymd = `${kp.year}${delimiter}${String(kp.month).padStart(2, '0')}${delimiter}${String(kp.date).padStart(2, '0')}`;
    return time ? `${ymd} ${kp.timeStr}` : ymd;
  } catch (e) {
    return String(isoStr || '');
  }
}

/**
 * 특정 배송일의 주문 상한 수(0이면 무제한) 반환
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {object} [deliverySettings]
 * @returns {number} 0=무제한, >0=상한 건수
 */
function getDeliveryLimitForDate(dateStr, deliverySettings) {
  if (!dateStr) return 0;
  const d = deliverySettings || (typeof loadSettings === 'function' ? (loadSettings().delivery || {}) : (DEFAULT_SETTINGS.delivery || {}));
  if (Array.isArray(d.dateLimits)) {
    const found = d.dateLimits.find(x => x && x.date === dateStr);
    if (found && typeof found.limit === 'number') {
      return Math.max(0, found.limit);
    }
  }
  return typeof d.dailyLimit === 'number' ? Math.max(0, d.dailyLimit) : (parseInt(d.dailyLimit, 10) || 0);
}

/**
 * 특정 날짜에 이미 접수된 유효 주문 수 계산 (취소·예시 제외)
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {Array} [orders]
 * @returns {number}
 */
function getActiveOrderCountForDate(dateStr, orders) {
  if (!dateStr) return 0;
  const list = orders || (typeof loadOrders === 'function' ? loadOrders() : []);
  if (!Array.isArray(list)) return 0;
  return list.filter(o => {
    if (!o || o.status === 'cancelled' || o.isSample) return false;
    const d = (o.deliveryDate || (typeof getDeliveryDate === 'function' ? getDeliveryDate(o) : '') || '').slice(0, 10);
    return d === dateStr;
  }).length;
}

/**
 * 서버에서 동기화한 마감일 목록 캐시 (배송일 계산 및 달력 렌더링 시 공용 참조)
 */
let serverFullDatesCache = [];

/**
 * 특정 배송일이 마감되었는지 여부
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {object} [options]
 * @returns {boolean}
 */
function isDeliveryDateFull(dateStr, { orders, settings } = {}) {
  if (!dateStr) return false;
  if (Array.isArray(serverFullDatesCache) && serverFullDatesCache.includes(dateStr)) {
    return true;
  }
  const s = settings || (typeof loadSettings === 'function' ? loadSettings() : DEFAULT_SETTINGS);
  const limit = getDeliveryLimitForDate(dateStr, s.delivery);
  if (limit <= 0) return false; // 0은 무제한
  const count = getActiveOrderCountForDate(dateStr, orders);
  return count >= limit;
}

/**
 * 저장된 매장 설정 불러오기 (기본값과 병합 및 마이그레이션)
 */
function loadSettings() {
  const parsed = DataStore.read(DataStore.KEYS.settings);
  if (!parsed || typeof parsed !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
  try {
    const merged = { ...DEFAULT_SETTINGS, ...parsed };

    // 마이그레이션: weeklyHours가 없거나 형식이 맞지 않으면 기본값 부여
    if (!merged.weeklyHours || !Array.isArray(merged.weeklyHours) || merged.weeklyHours.length !== 7) {
      merged.weeklyHours = JSON.parse(JSON.stringify(DEFAULT_WEEKLY_HOURS));
    }
    // 마이그레이션: 배송 설정은 항목별로 기본값과 합치기
    const dd = DEFAULT_SETTINGS.delivery;
    const sd = parsed.delivery || {};
    merged.delivery = {
      quick: { ...dd.quick, ...(sd.quick || {}) },
      parcel: { ...dd.parcel, ...(sd.parcel || {}) },
      pickup: { ...dd.pickup, ...(sd.pickup || {}) },
      freeOver: typeof sd.freeOver === 'number' ? sd.freeOver : dd.freeOver,
      note: typeof sd.note === 'string' ? sd.note : dd.note,
      dailyLimit: typeof sd.dailyLimit === 'number' ? Math.max(0, sd.dailyLimit) : (parseInt(sd.dailyLimit, 10) || 0),
      dateLimits: Array.isArray(sd.dateLimits) ? sd.dateLimits.filter(x => x && x.date && typeof x.limit === 'number').map(x => ({ date: String(x.date), limit: Math.max(1, Math.round(Number(x.limit) || 1)) })) : []
    };
    // 마이그레이션: closures가 없으면 빈 배열
    if (!merged.closures || !Array.isArray(merged.closures)) {
      merged.closures = [];
    }
    // 마이그레이션: 공휴일 설정 기본값 보장
    if (merged.holidayClosed === undefined) {
      merged.holidayClosed = true;
    }
    if (!merged.holidayOverrides || typeof merged.holidayOverrides !== 'object') {
      merged.holidayOverrides = {};
    }
    if (!merged.customHolidays || !Array.isArray(merged.customHolidays)) {
      merged.customHolidays = [];
    }
    return merged;
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
}

/**
 * 매장 설정 저장 및 동기화 이벤트 발생
 */
function saveSettings(obj) {
  const current = loadSettings();
  const merged = { ...current, ...obj };
  DataStore.write(DataStore.KEYS.settings, merged);
  window.dispatchEvent(new CustomEvent('seoldamhwa_settings_updated', { detail: merged }));
  return merged;
}

/**
 * 특정 날짜의 스케줄 조회 (임시 휴무일 및 공휴일 여부 판정)
 * @param {string|Date} dateInput 'YYYY-MM-DD' 또는 Date
 * @param {Object} [settings] 매장 설정 (생략 시 loadSettings())
 */
function getDaySchedule(dateInput, settings = loadSettings()) {
  let dateStr = '';
  let dayIdx = 0;

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    dateStr = dateInput;
    // YYYY-MM-DD를 한국 시간 기준으로 파싱하여 요일 산출
    const [y, m, d] = dateInput.split('-').map(Number);
    const fakeUtc = new Date(Date.UTC(y, m - 1, d, 3, 0, 0)); // UTC 03:00 = KST 12:00
    dayIdx = getKoreaTimeParts(fakeUtc).day;
  } else {
    const kp = getKoreaTimeParts(dateInput);
    dateStr = kp.dateStr;
    dayIdx = kp.day;
  }

  // 1. 임시 휴무일(closures) 우선 확인
  const closures = settings.closures || [];
  const closure = closures.find(c => c.date === dateStr);
  if (closure) {
    return {
      open: false,
      start: '10:00',
      end: '18:00',
      lunch: false,
      lunchStart: '12:30',
      lunchEnd: '13:30',
      isClosure: true,
      isHoliday: false,
      reason: closure.reason || '',
      dateStr,
      day: dayIdx
    };
  }

  const weekly = settings.weeklyHours || DEFAULT_WEEKLY_HOURS;
  const daySchedule = weekly[dayIdx] || { open: false };

  // 2. 공휴일(KOREAN_HOLIDAYS + customHolidays) 확인
  const allHolidays = [
    ...(typeof KOREAN_HOLIDAYS !== 'undefined' ? KOREAN_HOLIDAYS : []),
    ...(settings.customHolidays || [])
  ];
  const holiday = allHolidays.find(h => h.date === dateStr);

  if (holiday) {
    const override = settings.holidayOverrides ? settings.holidayOverrides[dateStr] : null;
    let isHolidayClosed = false;

    if (override === 'open') {
      isHolidayClosed = false;
    } else if (override === 'closed') {
      isHolidayClosed = true;
    } else if (holiday.optional) {
      // 노동절: 기본 영업
      isHolidayClosed = false;
    } else {
      // 일반 공휴일: holidayClosed 설정(기본 true)에 따름
      isHolidayClosed = settings.holidayClosed !== false;
    }

    if (isHolidayClosed) {
      return {
        open: false,
        start: '10:00',
        end: '18:00',
        lunch: false,
        lunchStart: '12:30',
        lunchEnd: '13:30',
        isClosure: true,
        isHoliday: true,
        reason: holiday.name,
        dateStr,
        day: dayIdx
      };
    } else {
      // 공휴일이지만 영업하는 경우 (요일별 운영시간 적용)
      return {
        ...daySchedule,
        isClosure: false,
        isHoliday: true,
        reason: holiday.name,
        dateStr,
        day: dayIdx
      };
    }
  }

  // 3. 정기 요일별 스케줄 반환
  return {
    ...daySchedule,
    isClosure: false,
    isHoliday: false,
    reason: '',
    dateStr,
    day: dayIdx
  };
}

/**
 * 한국 시간 기준 현재 매장 영업 상태 산출
 * @param {Date} [now] 기준 시각 (생략 시 현재 시각)
 * @param {Object} [settings] 매장 설정
 * @returns {Object} { status, time, reason, isClosure, nextOpen }
 *   status: 'open' | 'lunch' | 'before-open' | 'closed-today' | 'after-close'
 */
function getStoreStatus(now = new Date(), settings = loadSettings()) {
  const kp = getKoreaTimeParts(now);
  const todaySched = getDaySchedule(kp.dateStr, settings);

  // 다음 오픈일(look ahead) 탐색 함수 (내일부터 최대 30일간)
  function findNextOpenDay() {
    const baseDate = (now && typeof now.getTime === 'function') ? new Date(now.getTime()) : (now ? new Date(now) : new Date());
    for (let i = 1; i <= 30; i++) {
      const nextDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      const nextKp = getKoreaTimeParts(nextDate);
      const nextSched = getDaySchedule(nextKp.dateStr, settings);
      if (nextSched.open) {
        return {
          dateStr: nextKp.dateStr,
          daysAhead: i,
          openTime: nextSched.start || '10:00',
          closeTime: nextSched.end || '18:00',
          dayIdx: nextKp.day
        };
      }
    }
    return null;
  }

  // 1. 오늘이 휴무인 경우 (정기 휴무 또는 임시 휴무)
  if (!todaySched.open) {
    return {
      status: 'closed-today',
      time: '',
      reason: todaySched.reason || '',
      isClosure: !!todaySched.isClosure,
      nextOpen: findNextOpenDay()
    };
  }

  const curTime = kp.timeStr;
  const startTime = todaySched.start || '10:00';
  const endTime = todaySched.end || '18:00';
  const hasLunch = !!todaySched.lunch;
  const lunchStart = todaySched.lunchStart || '12:30';
  const lunchEnd = todaySched.lunchEnd || '13:30';

  // 2. 오픈 이전
  if (curTime < startTime) {
    return {
      status: 'before-open',
      time: startTime,
      reason: '',
      isClosure: false,
      nextOpen: {
        dateStr: kp.dateStr,
        daysAhead: 0,
        openTime: startTime,
        dayIdx: kp.day
      }
    };
  }

  // 3. 마감 이후
  if (curTime >= endTime) {
    return {
      status: 'after-close',
      time: endTime,
      reason: '',
      isClosure: false,
      nextOpen: findNextOpenDay()
    };
  }

  // 4. 점심시간
  if (hasLunch && curTime >= lunchStart && curTime < lunchEnd) {
    return {
      status: 'lunch',
      time: lunchEnd,
      reason: '',
      isClosure: false,
      nextOpen: null
    };
  }

  // 5. 지금 영업 중
  return {
    status: 'open',
    time: endTime,
    reason: '',
    isClosure: false,
    nextOpen: null
  };
}

/**
 * 구글 지도 임베드 URL 생성
 */
function mapEmbedUrl(address) {
  return 'https://maps.google.com/maps?q=' + encodeURIComponent(address || '') + '&z=16&output=embed';
}

/**
 * 카카오맵 검색 링크 URL
 */
function kakaoMapUrl(address) {
  return 'https://map.kakao.com/link/search/' + encodeURIComponent(address || '');
}

/**
 * 네이버 지도 검색 링크 URL
 */
function naverMapUrl(address) {
  return 'https://map.naver.com/p/search/' + encodeURIComponent(address || '');
}


// 배송 방법 목록 (켜진 것만)
const DELIVERY_METHOD_ORDER = ['quick', 'parcel', 'pickup'];

// 당일 퀵 마감 시각 ('HH:MM' 또는 '')
function quickSameDayUntil(settings = loadSettings()) {
  const q = (settings.delivery || DEFAULT_SETTINGS.delivery).quick || {};
  return /^\d{2}:\d{2}$/.test(String(q.sameDayUntil || '')) ? q.sameDayUntil : '';
}

function getDeliveryMethods(settings = loadSettings()) {
  const d = settings.delivery || DEFAULT_SETTINGS.delivery;
  return DELIVERY_METHOD_ORDER.filter(k => d[k] && d[k].enabled).map(k => ({ id: k, ...d[k] }));
}

// 배송비 계산: 무료 조건(freeOver) 이상이면 0원, 픽업은 0원
function calcDeliveryFee(methodId, itemsTotal, settings = loadSettings()) {
  const d = settings.delivery || DEFAULT_SETTINGS.delivery;
  const m = d[methodId];
  if (!m || methodId === 'pickup') return 0;
  if (d.freeOver > 0 && itemsTotal >= d.freeOver) return 0;
  return Number(m.fee) || 0;
}

/**
 * 택배사별 공식 배송조회 URL 생성 (CJ대한통운, 우체국, 한진, 롯데, 로젠)
 */
function getCourierTrackingUrl(courier, trackingNumber) {
  if (!trackingNumber) return '';
  const num = String(trackingNumber).replace(/\D/g, '');
  if (!num) return '';
  const c = String(courier || '').toLowerCase().trim();
  if (c.includes('cj') || c.includes('대한통운')) {
    return `https://trace.cjlogistics.com/web/detail.jsp?slipno=${num}`;
  }
  if (c.includes('우체국') || c.includes('epost') || c.includes('post')) {
    return `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${num}`;
  }
  if (c.includes('한진') || c.includes('hanjin')) {
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum=${num}`;
  }
  if (c.includes('롯데') || c.includes('lotte')) {
    return `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${num}`;
  }
  if (c.includes('로젠') || c.includes('logen')) {
    return `https://www.ilogen.com/web/personal/trace/${num}`;
  }
  return `https://search.naver.com/search.naver?query=${encodeURIComponent((courier || '택배') + ' ' + num)}`;
}
