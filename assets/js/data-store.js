// assets/js/data-store.js
// 설담화(說談花) 통합 브라우저 저장소 모듈 (DataStore)
// 모든 브라우저 스토리지(localStorage) 읽기·쓰기를 단일 창구로 통합하여 나중에 Supabase 등 외부 데이터베이스로 전환할 때 이 모듈만 교체할 수 있도록 합니다.

const DataStore = (() => {
  const KEYS = Object.freeze({
    products: 'seoldamhwa_products',
    orders: 'seoldamhwa_orders',
    inquiries: 'seoldamhwa_inquiries',
    restock: 'seoldamhwa_restock',
    expenses: 'seoldamhwa_expenses',
    settings: 'seoldamhwa_settings',
    settingsUpdated: 'seoldamhwa_settings_updated',
    pages: 'seoldamhwa_pages',
    popups: 'seoldamhwa_popups',
    popupsUpdated: 'seoldamhwa_popups_updated',
    flowers: 'seoldamhwa_flowers',
    flowersVersion: 'seoldamhwa_flowers_version',
    coupons: 'seoldamhwa_coupons',
    couponHistory: 'seoldamhwa_coupon_history',
    images: 'seoldamhwa_images',
    integrations: 'seoldamhwa_integrations',
    aiSettings: 'seoldamhwa_ai_settings',
    aiKey: 'seoldamhwa_ai_key',
    cart: 'seoldamhwa_cart',
    wishlist: 'seoldamhwa_wishlist',
    recent: 'seoldamhwa_recent',
    lang: 'seoldamhwa_lang',
    dataVersion: 'seoldamhwa_data_version',
    csvAutosave: 'seoldamhwa_csv_autosave',
    csvDb: 'seoldamhwa_csvdb',
    adminSound: 'seoldamhwa_admin_sound',
    popupDismissedDate: 'seoldamhwa_popup_dismissed_date',
    popupViewedSession: 'seoldamhwa_popup_viewed_session',
    serverSynced: 'seoldamhwa_server_synced'
  });

  function read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function readRaw(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : raw;
    } catch (e) {
      return fallback;
    }
  }

  function writeRaw(key, string) {
    try {
      localStorage.setItem(key, String(string));
      return true;
    } catch (e) {
      return false;
    }
  }

  // 스토리지 덤프 (백업 생성용)
  function dump(filterFn) {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (!filterFn || filterFn(k))) {
          data[k] = localStorage.getItem(k);
        }
      }
    } catch (e) {}
    return data;
  }

  // 스토리지 일괄 원시 복원 (백업 복원용)
  function restoreRaw(data, keys) {
    const targetKeys = keys || Object.keys(data || {});
    targetKeys.forEach(k => {
      if (data[k] !== undefined && data[k] !== null) {
        writeRaw(k, data[k]);
      }
    });
  }

  // 전체 브라우저 스토리지 사용량(바이트 근사치)
  function approximateSize() {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        total += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
    } catch (e) {}
    return total;
  }

  return {
    KEYS,
    read,
    write,
    remove,
    readRaw,
    writeRaw,
    dump,
    restoreRaw,
    approximateSize
  };
})();

// 기존 상수명 호환성 보장
var RESTOCK_STORAGE_KEY = DataStore.KEYS.restock;
var FLOWERS_KEY = DataStore.KEYS.flowers;
var POPUPS_STORAGE_KEY = DataStore.KEYS.popups;
var PAGES_STORAGE_KEY = DataStore.KEYS.pages;
var INTEGRATIONS_STORAGE_KEY = DataStore.KEYS.integrations;
var EXPENSES_STORAGE_KEY = DataStore.KEYS.expenses;
var ORDERS_STORAGE_KEY = DataStore.KEYS.orders;
var COUPONS_KEY = DataStore.KEYS.coupons;
var COUPON_HISTORY_KEY = DataStore.KEYS.couponHistory;
var IMAGE_LIBRARY_KEY = DataStore.KEYS.images;
var AI_SETTINGS_KEY = DataStore.KEYS.aiSettings;

// 예전에 관리자 화면에 미리 들어 있던 예시 주문 (실제 판매하지 않는 상품) - 자동으로 정리
const SAMPLE_ORDER_NUMBERS = ['SDH-261029-01', 'SDH-261028-09', 'SDH-261028-04', 'SDH-261027-12'];

// 양쪽 페이지 공통 주문 데이터 함수 (finance-data.js에서 이동)
function loadOrders() {
  try {
    const list = DataStore.read(DataStore.KEYS.orders, []);
    if (!Array.isArray(list)) return [];
    const cleaned = list.filter(o => !SAMPLE_ORDER_NUMBERS.includes(o.orderNumber));
    if (cleaned.length !== list.length) saveOrders(cleaned);
    return cleaned;
  } catch (e) {
    return [];
  }
}

function saveOrders(list) {
  DataStore.write(DataStore.KEYS.orders, list);
}

// 양쪽 페이지 공통 1:1 상담 문의 데이터 함수
function loadInquiries() {
  try {
    const list = DataStore.read(DataStore.KEYS.inquiries, []);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveInquiries(list) {
  DataStore.write(DataStore.KEYS.inquiries, list);
}

// 브라우저 저장 공간(약 5MB)이 가득 차서 저장이 안 될 때 알려 줌 (products-data.js에서 이동)
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
