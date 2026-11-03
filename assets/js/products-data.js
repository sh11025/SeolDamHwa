// assets/js/products-data.js
// 설담화(說談花) 단독 실행형 통합 상품 데이터 및 재고 관리 모듈

const DATA_VERSION = 2;

// 전화번호 유효성 검사 (공백·하이픈 제거 후 0으로 시작하는 10~11자리 또는 02 9자리 유선번호)
function isValidPhone(v) {
  const c = String(v || '').replace(/[-\s]/g, '');
  return /^0\d{9,10}$/.test(c) || /^02\d{7}$/.test(c);
}

// 고유 식별자 생성기 (crypto.randomUUID 지원, 미지원 시 타임스탬프+랜덤 16진수)
function makeId(prefix) {
  const p = prefix ? `${prefix}-` : '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${p}${crypto.randomUUID()}`;
  }
  const rand = Math.random().toString(16).slice(2, 10);
  return `${p}${Date.now().toString(36)}-${rand}`;
}

// 겹치지 않는 주문 번호 생성기 (SDH-YYMMDD-XXXX)
function makeOrderNumber() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const yy = (parts.find(p => p.type === 'year')?.value || '').slice(-2);
  const mm = parts.find(p => p.type === 'month')?.value || '';
  const dd = parts.find(p => p.type === 'day')?.value || '';
  const yymmdd = `${yy}${mm}${dd}`;

  let existingSet = new Set();
  try {
    const orders = (typeof loadOrders === 'function') ? (loadOrders() || []) : JSON.parse(localStorage.getItem('seoldamhwa_orders') || '[]');
    existingSet = new Set(orders.map(o => String(o.orderNumber || '').toUpperCase()).filter(Boolean));
  } catch (e) {
    /* 무시 */
  }

  let candidate = '';
  do {
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    candidate = `SDH-${yymmdd}-${rand}`;
  } while (existingSet.has(candidate));

  return candidate;
}

// 상품 종류 (꽃 둘러보기 탭·홈 거르기·관리자 선택·상품 페이지 표시가 모두 이 목록을 씀)
// goods: 꽃이 아닌 굿즈(디자인 화분·영양제·씨앗 등) → 제철·꽃 사전 없음, 택배로만
const PRODUCT_CATEGORIES = [
  { id: 'bouquet', key: 'cat_bouquet', label: '꽃다발' },
  { id: 'basket', key: 'cat_basket', label: '꽃바구니' },
  { id: 'vase', key: 'cat_vase', label: '화병꽂이·센터피스' },
  { id: 'dried', key: 'cat_dried', label: '드라이·프리저브드' },
  { id: 'space', key: 'cat_space', label: '웨딩·공간' },
  { id: 'plant', key: 'cat_plant', label: '화분·식물' },
  { id: 'goods', key: 'cat_goods', label: '굿즈' }
];

function categoryLabel(id) {
  const c = PRODUCT_CATEGORIES.find(x => x.id === id);
  if (!c) return id || '';
  return typeof t === 'function' ? t(c.key, c.label) : c.label;
}

const DEFAULT_PRODUCTS = [
  {
    id: 'signature-bouquet',
    name: '설담화 시그니처 꽃다발',
    englishName: 'Signature Bouquet',
    category: 'bouquet',
    price: 55000,
    sizes: [
      { label: 'S', price: 55000 },
      { label: 'M', price: 70000, recommended: true },
      { label: 'L', price: 100000 }
    ],
    poeticLine: '받는 이의 이야기를 듣고, 한 송이씩 엮은 꽃다발',
    flowerMeaning: '1:1 맞춤 제철 생화',
    description: '설담화만의 감성을 담은 1:1 맞춤형 꽃다발입니다. 생화의 화사함을 오래도록 간직할 수 있는 한복 원단 패키징도 곧 만나보실 수 있습니다. (출시 예정)',
    stockQuantity: 12,
    image: 'assets/images/products/signature-bouquet.jpg'
  },
  {
    id: 'norigae-basket',
    name: '노리개 꽃바구니',
    englishName: 'Flower Basket',
    category: 'basket',
    price: 150000,
    sizes: [
      { label: 'Special', price: 150000, recommended: true }
    ],
    poeticLine: '노리개 장식이 흔들리는, 풍성한 축하의 바구니',
    flowerMeaning: '프리미엄 생화 · 전통 라탄 바구니',
    description: '풍성한 꽃들과 단아한 오브제가 조화를 이루는 프리미엄 바구니 상품입니다. 소중한 분을 위한 특별한 날에 품격을 더해드립니다.',
    stockQuantity: 3,
    image: 'assets/images/products/norigae-basket.jpg'
  },
  {
    id: 'space-design',
    name: '센터피스 · 공간 디자인',
    englishName: 'Wedding and Space Design',
    category: 'space',
    inquiryOnly: true,
    price: 0,
    poeticLine: '공간의 결에 맞춰 짓는 꽃의 풍경',
    flowerMeaning: '웨딩 · 쇼룸 · 행사 맞춤 연출',
    description: '웨딩 부케부터 쇼룸, 행사장 테이블을 완성하는 센터피스까지 공간의 가치를 높이는 맞춤형 플라워 디렉팅 솔루션입니다.',
    stockQuantity: 99,
    image: 'assets/images/products/space-design.jpg'
  },
  {
    id: 'bohemian-autumn',
    name: '가을 보헤미안 핸드타이드',
    englishName: 'Bohemian Autumn Handtied',
    category: 'bouquet',
    price: 55000,
    sizes: [
      { label: 'S', price: 55000 },
      { label: 'M', price: 70000, recommended: true },
      { label: 'L', price: 100000 }
    ],
    poeticLine: '버건디 다알리아에 갈대가 스치는 가을의 결',
    flowerMeaning: '다알리아 · 호접란 · 장미 · 갈대',
    description: '진한 자주/버건디 색을 포인트로 갈대형 드라이 소재와 다크컬러의 잎소재가 고급스러운 핸드타이드 작품입니다.',
    stockQuantity: 8,
    image: 'assets/images/products/bohemian-autumn.jpg'
  },
  {
    id: 'pale-pink-rose',
    name: '연분홍 장미 부케',
    englishName: 'Pale Pink Rose Bouquet',
    category: 'bouquet',
    price: 150000,
    sizes: [
      { label: 'Standard', price: 150000, recommended: true }
    ],
    poeticLine: '맨스필드 장미 한 품종으로 완성한 단정한 고백',
    flowerMeaning: '맨스필드 장미 · 실크 리본',
    description: '맨스필드 장미 단일 품종의 클래식 라운드 쉐잎 부케',
    stockQuantity: 2,
    image: 'assets/images/products/pale-pink-rose.jpg'
  },
  {
    id: 'creamy-sunshine',
    name: '햇살 크림 꽃바구니',
    englishName: 'Creamy Sunshine Basket',
    category: 'basket',
    price: 100000,
    sizes: [
      { label: 'Standard', price: 100000, recommended: true }
    ],
    poeticLine: '거베라와 소국이 모여 앉은 따뜻한 오후',
    flowerMeaning: '파스타 거베라 · 폼폰국화 · 장미 · 소국',
    description: '중심부의 파스타 거베라를 포인트로 둥근 폼폰국화, 아이보리 장미, 소국 및 마트리카리아가 부드럽게 어우러지는 호불호 없을 화이트&옐로우 라탄 바구니 작품.',
    stockQuantity: 0,
    image: 'assets/images/products/creamy-sunshine.jpg'
  },
  {
    id: 'royal-blue-garden',
    name: '로열 블루 가든 센터피스',
    englishName: 'Royal Blue Garden',
    category: 'space',
    inquiryOnly: true,
    price: 0,
    poeticLine: '짙은 푸름으로 공간을 깨우는 정원',
    flowerMeaning: '블루 로즈 · 델피늄 · 리시안셔스',
    description: '짙은 블루 컬러를 포인트로 공간을 화사하게 밝혀줄 블루&라벤더&화이트 센터피스.',
    stockQuantity: 99,
    image: 'assets/images/products/royal-blue-garden.jpg'
  }
];

// 한국 시간(Asia/Seoul) 기준 "YYYY-MM-DDTHH:MM" ISO 형식 반환 헬퍼
function getKoreaISOString(d) {
  const date = (d && typeof d.getTime === 'function') ? d : (d ? new Date(d) : new Date());
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const p = {};
  parts.forEach(item => { p[item.type] = item.value; });
  const hour = p.hour === '24' ? '00' : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}

// 상품 공개 여부 판별 헬퍼 (public: 항상 공개, private: 항상 비공개, scheduled: 한국 시간 기준 예약 시각 도래 시 공개)
function isProductVisible(p, now = new Date()) {
  if (!p) return false;
  const vis = p.visibility || 'public';
  if (vis === 'public') return true;
  if (vis === 'private') return false;
  if (vis === 'scheduled') {
    if (!p.publishAt) return false;
    const currentKoreaISO = getKoreaISOString(now);
    return currentKoreaISO >= p.publishAt;
  }
  return true;
}

// 재고 상태 계산 함수 (0: 일시 품절, 1~3: 품절 임박, 4+: 정상 재고)
function getStockStatus(qty) {
  const q = Number(qty);
  if (isNaN(q) || q <= 0) return 'out_of_stock';
  if (q <= 3) return 'low_stock';
  return 'in_stock';
}

// 상품 데이터 로드 함수 (DATA_VERSION 검증하여 자동 동기화)
function loadProducts() {
  const currentVersion = localStorage.getItem('seoldamhwa_data_version');
  if (currentVersion !== String(DATA_VERSION)) {
    saveProducts(DEFAULT_PRODUCTS);
    localStorage.setItem('seoldamhwa_data_version', String(DATA_VERSION));
    return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  }
  const stored = localStorage.getItem('seoldamhwa_products');
  if (!stored) {
    saveProducts(DEFAULT_PRODUCTS);
    return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  }
}

// 상품 데이터 저장 함수
function saveProducts(list) {
  localStorage.setItem('seoldamhwa_products', JSON.stringify(list));
}

// 맞춤 담화 5단계 큐레이션 매칭 태그 (색상 및 가격 기반)
const CURATION_TAGS = {
  'signature-bouquet': {
    recipients: ['부모님·어른', '연인', '스승·은인'],
    occasions: ['생일', '기념일·프러포즈', '결혼·상견례', '어버이날·스승의날'],
    feelings: ['감사', '사랑', '축하'],
    colors: ['여러 색 섞어서', '옐로우·오렌지']
  },
  'norigae-basket': {
    recipients: ['부모님·어른', '스승·은인', '직장 동료·상사', '동료·상사'],
    occasions: ['어버이날·스승의날', '승진·개업', '결혼·상견례', '생일'],
    feelings: ['감사', '축하', '응원'],
    colors: ['핑크·피치', '레드·버건디']
  },
  'space-design': {
    recipients: ['공간·기업', '직장 동료·상사', '동료·상사'],
    occasions: ['결혼·상견례', '승진·개업'],
    feelings: ['공간 연출', '축하'],
    colors: ['화이트·그린']
  },
  'bohemian-autumn': {
    recipients: ['친구', '연인', '나에게'],
    occasions: ['생일', '기념일·프러포즈', '특별한 날 없이'],
    feelings: ['축하', '사랑', '응원'],
    colors: ['레드·버건디', '핑크·피치']
  },
  'pale-pink-rose': {
    recipients: ['연인', '나에게'],
    occasions: ['기념일·프러포즈', '생일', '특별한 날 없이'],
    feelings: ['사랑', '축하'],
    colors: ['핑크·피치']
  },
  'creamy-sunshine': {
    recipients: ['친구', '직장 동료·상사', '동료·상사', '나에게'],
    occasions: ['생일', '졸업·입학', '위로·병문안', '특별한 날 없이'],
    feelings: ['응원', '위로', '축하', '감사'],
    colors: ['옐로우·오렌지', '화이트·그린']
  },
  'royal-blue-garden': {
    recipients: ['공간·기업', '직장 동료·상사', '동료·상사'],
    occasions: ['승진·개업', '결혼·상견례'],
    feelings: ['축하', '감사', '공간 연출'],
    colors: ['블루·퍼플', '화이트·그린']
  }
};

// 상품 사진 주소가 깨졌을 때 빈 아이콘 대신 낙관 표시 (쇼핑몰·관리자 공통)
if (typeof document !== 'undefined') {
  document.addEventListener('error', e => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.fallback) return;
    if (!/assets\/images\/products\/|^data:image|^https?:/.test(img.getAttribute('src') || '')) return;
    img.dataset.fallback = '1';
    img.src = 'assets/images/seal.svg';
    img.classList.add('object-contain', 'p-[18%]', 'opacity-30');
  }, true);
}

// 화면에 글자를 넣을 때 < > & " ' 가 태그로 읽히지 않게 (상품 이름 등, 쇼핑몰·관리자 공통)
function htmlText(value) {
  return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// 브라우저 저장 공간(약 5MB)이 가득 차서 저장이 안 될 때 알려 줌 (사진을 많이 올렸을 때 등)
(function guardStorageQuota() {
  if (typeof Storage === 'undefined') return;
  const original = Storage.prototype.setItem;
  let lastAlert = 0;
  Storage.prototype.setItem = function (key, value) {
    try {
      return original.call(this, key, value);
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22) && Date.now() - lastAlert > 10000) {
        lastAlert = Date.now();
        alert('브라우저 저장 공간이 가득 차서 저장하지 못했어요.\n관리자 > 상품 사진 고르기 창에서 안 쓰는 사진을 지우거나, 사진 대신 이미지 주소(https://...)를 써 주세요.');
      }
      throw e;
    }
  };
})();
