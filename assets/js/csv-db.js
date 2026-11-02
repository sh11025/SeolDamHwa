// assets/js/csv-db.js
// 설담화(說談花) CSV 데이터베이스 - 브라우저 저장소의 데이터를 DATA 폴더의 CSV 파일(표 하나 = 파일 하나)로 저장·불러오기
// 나중에 서버 DB(MySQL·PostgreSQL·Supabase 등)로 옮길 때 이 표 구조(TABLES)를 그대로 테이블로 만들면 됩니다.
// 표 구조 설명은 DATA/README.md 참고.

const CSV_TABLES = {
  products: {
    file: 'products.csv',
    columns: ['id', 'name', 'englishName', 'category', 'price', 'sizes', 'inquiryOnly', 'poeticLine', 'flowerMeaning', 'description', 'stockQuantity', 'image', 'visibility', 'publishAt', 'curationTags', 'hideOnHome', 'homeOrder', 'images', 'flowers'],
    json: ['sizes', 'curationTags', 'images', 'flowers'], bool: ['inquiryOnly', 'hideOnHome'], num: ['price', 'stockQuantity', 'homeOrder'],
    read: () => loadProducts(),
    write: rows => saveProducts(rows)
  },
  orders: {
    file: 'orders.csv',
    columns: ['id', 'orderNumber', 'createdDate', 'createdAt', 'status', 'ordererName', 'ordererPhone', 'recipientName', 'recipientPhone', 'customerName', 'phone', 'zipcode', 'address', 'deliveryMethod', 'deliveryMethodLabel', 'deliveryFee', 'itemsTotal', 'totalAmount', 'deliveryDate', 'message', 'hideSender', 'request', 'courier', 'trackingNumber', 'statusBeforeCancel', 'isSample', 'couponCode', 'couponDiscount'],
    bool: ['hideSender', 'isSample'], num: ['deliveryFee', 'itemsTotal', 'totalAmount', 'couponDiscount'],
    read: () => JSON.parse(localStorage.getItem('seoldamhwa_orders') || '[]'),
    write: null // order_items와 합쳐서 저장 (아래 importCsvTables)
  },
  order_items: {
    file: 'order_items.csv',
    columns: ['orderId', 'lineNo', 'productId', 'productName', 'sizeLabel', 'price', 'optionName', 'optionPrice', 'quantity'],
    num: ['lineNo', 'price', 'optionPrice', 'quantity'],
    read: () => {
      const rows = [];
      JSON.parse(localStorage.getItem('seoldamhwa_orders') || '[]').forEach(o => (o.items || []).forEach((i, idx) => rows.push({
        orderId: o.id, lineNo: idx + 1, productId: i.product && i.product.id, productName: i.product && i.product.name,
        sizeLabel: i.sizeLabel, price: i.price, optionName: i.optionName, optionPrice: i.optionPrice, quantity: i.quantity
      })));
      return rows;
    },
    write: null
  },
  expenses: {
    file: 'expenses.csv',
    columns: ['id', 'date', 'category', 'amount', 'method', 'memo', 'isSample'],
    bool: ['isSample'], num: ['amount'],
    read: () => JSON.parse(localStorage.getItem('seoldamhwa_expenses') || '[]'),
    write: rows => localStorage.setItem('seoldamhwa_expenses', JSON.stringify(rows))
  },
  inquiries: {
    file: 'inquiries.csv',
    columns: ['id', 'createdDate', 'status', 'name', 'phone', 'date', 'type', 'productName', 'message', 'memo', 'contactedAt', 'replies', 'isSample'],
    json: ['replies'], bool: ['isSample'],
    read: () => JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]'),
    write: rows => localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(rows))
  },
  restock: {
    file: 'restock.csv',
    columns: ['id', 'productId', 'productName', 'name', 'phone', 'createdDate', 'status', 'isSample'],
    bool: ['isSample'],
    read: () => JSON.parse(localStorage.getItem('seoldamhwa_restock') || '[]'),
    write: rows => localStorage.setItem('seoldamhwa_restock', JSON.stringify(rows))
  },
  popups: {
    file: 'popups.csv',
    columns: ['id', 'active', 'order', 'image', 'title', 'text', 'titleEn', 'textEn', 'titleJa', 'textJa', 'buttonLabel', 'linkType', 'url', 'internalTarget', 'startDate', 'endDate'],
    bool: ['active'], num: ['order'],
    read: () => (typeof loadPopups === 'function' ? loadPopups().slides : []),
    write: null // settings의 popupsEnabled와 합쳐서 저장
  },
  pages: {
    file: 'pages.csv',
    columns: ['id', 'title', 'body', 'updatedAt', 'media'],
    json: ['media'],
    read: () => {
      let stored = {};
      try { stored = JSON.parse(localStorage.getItem('seoldamhwa_pages') || '{}') || {}; } catch (e) { stored = {}; }
      return Object.entries(stored).map(([id, v]) => ({ id, ...v }));
    },
    write: rows => {
      const obj = {};
      rows.forEach(r => { if (r.id) obj[r.id] = { title: r.title, body: r.body, updatedAt: r.updatedAt, ...(r.media ? { media: r.media } : {}) }; });
      localStorage.setItem('seoldamhwa_pages', JSON.stringify(obj));
    }
  },
  settings: {
    file: 'settings.csv',
    columns: ['key', 'value'],
    // 매장 설정은 항목 하나 = 한 줄 (값은 JSON)
    read: () => {
      const s = JSON.parse(localStorage.getItem('seoldamhwa_settings') || 'null') || (typeof loadSettings === 'function' ? loadSettings() : {});
      const rows = Object.entries(s).map(([key, value]) => ({ key, value: JSON.stringify(value) }));
      if (typeof loadPopups === 'function') rows.push({ key: '__popupsEnabled', value: JSON.stringify(!!loadPopups().enabled) });
      return rows;
    },
    write: null
  },
  flowers: {
    file: 'flowers.csv',
    columns: ['id', 'name', 'nameEn', 'nameJa', 'meaning', 'meaningEn', 'meaningJa', 'months', 'yearRound', 'colors', 'care', 'image'],
    json: ['months'], bool: ['yearRound'],
    read: () => (typeof loadFlowers === 'function' ? loadFlowers() : []),
    write: rows => localStorage.setItem('seoldamhwa_flowers', JSON.stringify(rows.map(r => ({ ...r, months: Array.isArray(r.months) ? r.months : [] }))))
  },
  coupons: {
    file: 'coupons.csv',
    columns: ['code', 'batchId', 'batchName', 'type', 'value', 'minOrder', 'startDate', 'endDate', 'active', 'createdAt', 'usedAt', 'orderNumber'],
    bool: ['active'], num: ['value', 'minOrder'],
    read: () => (typeof loadCoupons === 'function' ? loadCoupons() : []),
    write: rows => localStorage.setItem('seoldamhwa_coupons', JSON.stringify(rows))
  },
  coupon_history: {
    file: 'coupon_history.csv',
    columns: ['id', 'batchName', 'type', 'value', 'minOrder', 'startDate', 'endDate', 'created', 'used', 'usedDates', 'archivedAt'],
    json: ['usedDates'], num: ['value', 'minOrder', 'created', 'used'],
    read: () => (typeof loadCouponHistory === 'function' ? loadCouponHistory() : []),
    write: rows => localStorage.setItem('seoldamhwa_coupon_history', JSON.stringify(rows.map(r => ({ ...r, usedDates: Array.isArray(r.usedDates) ? r.usedDates : [] }))))
  },
  images: {
    file: 'images.csv',
    columns: ['id', 'name', 'src', 'width', 'height', 'createdAt'],
    num: ['width', 'height'],
    read: () => JSON.parse(localStorage.getItem('seoldamhwa_images') || '[]'),
    write: rows => localStorage.setItem('seoldamhwa_images', JSON.stringify(rows))
  }
};

/* ---------- CSV 글자 처리 (쉼표·따옴표·줄바꿈 안전) ---------- */
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function tableToCsv(name, rows) {
  const def = CSV_TABLES[name];
  const json = def.json || [];
  const lines = [def.columns.join(',')];
  rows.forEach(r => {
    lines.push(def.columns.map(c => {
      let v = r[c];
      if (json.includes(c) && v !== undefined && v !== null) v = JSON.stringify(v);
      return csvCell(v);
    }).join(','));
  });
  return '﻿' + lines.join('\r\n') + '\r\n'; // 엑셀에서 한글이 깨지지 않게 BOM
}

function parseCsv(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const rows = [];
  let row = [], cell = '', i = 0, quoted = false;
  while (i < src.length) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if (ch === '"') { quoted = true; i++; continue; }
    if (ch === ',') { row.push(cell); cell = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
    cell += ch; i++;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

function csvToTable(name, text) {
  const def = CSV_TABLES[name];
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim());
  const missing = def.columns.filter(c => !header.includes(c) && c !== 'isSample');
  if (missing.length > def.columns.length / 2) throw new Error(`${def.file}: 머리줄(칸 이름)이 맞지 않아요.`);
  return rows.slice(1).map(cells => {
    const obj = {};
    header.forEach((h, idx) => {
      if (!def.columns.includes(h)) return;
      let v = cells[idx] ?? '';
      if ((def.json || []).includes(h)) { try { v = v === '' ? (h === 'sizes' || h === 'replies' ? [] : undefined) : JSON.parse(v); } catch (e) { v = undefined; } }
      else if ((def.bool || []).includes(h)) v = v === 'true';
      else if ((def.num || []).includes(h)) v = v === '' ? null : Number(v);
      if (v !== undefined && !(v === '' && h !== 'message' && h !== 'memo')) obj[h] = v;
    });
    return obj;
  });
}

/* ---------- 전체 내보내기 / 가져오기 ---------- */
function buildAllCsv() {
  const out = {};
  Object.keys(CSV_TABLES).forEach(name => { out[CSV_TABLES[name].file] = tableToCsv(name, CSV_TABLES[name].read() || []); });
  return out;
}

// files: { 'products.csv': text, ... } → 브라우저 저장소에 반영
function importCsvTables(files) {
  const has = f => typeof files[f] === 'string';
  const result = [];
  ['products', 'expenses', 'inquiries', 'restock', 'pages', 'flowers', 'coupons', 'coupon_history', 'images'].forEach(name => {
    const f = CSV_TABLES[name].file;
    if (!has(f)) return;
    const rows = csvToTable(name, files[f]);
    CSV_TABLES[name].write(rows);
    result.push(`${f} ${rows.length}줄`);
  });
  if (has('orders.csv')) {
    const orders = csvToTable('orders', files['orders.csv']);
    const items = has('order_items.csv') ? csvToTable('order_items', files['order_items.csv']) : [];
    orders.forEach(o => {
      o.items = items.filter(i => i.orderId === o.id).sort((a, b) => a.lineNo - b.lineNo).map(i => ({
        product: { id: i.productId, name: i.productName }, sizeLabel: i.sizeLabel || null,
        price: i.price || 0, optionName: i.optionName || '', optionPrice: i.optionPrice || 0, quantity: i.quantity || 1
      }));
    });
    localStorage.setItem('seoldamhwa_orders', JSON.stringify(orders));
    result.push(`orders.csv ${orders.length}줄`);
  }
  if (has('settings.csv')) {
    const rows = csvToTable('settings', files['settings.csv']);
    const s = {};
    let popupsEnabled = null;
    rows.forEach(r => {
      try {
        const v = JSON.parse(r.value);
        if (r.key === '__popupsEnabled') popupsEnabled = !!v; else s[r.key] = v;
      } catch (e) { /* 깨진 줄은 건너뜀 */ }
    });
    if (Object.keys(s).length) localStorage.setItem('seoldamhwa_settings', JSON.stringify(s));
    if (has('popups.csv') && typeof savePopups === 'function') {
      const slides = csvToTable('popups', files['popups.csv']);
      savePopups({ enabled: popupsEnabled === null ? loadPopups().enabled : popupsEnabled, slides });
      result.push(`popups.csv ${slides.length}줄`);
    }
    result.push(`settings.csv ${rows.length}줄`);
  }
  return result;
}

/* ---------- DATA 폴더 연결 (크롬·엣지: 폴더에 바로 쓰기) ---------- */
const CSV_DB_IDB = 'seoldamhwa_csvdb';

function csvFolderSupported() {
  return typeof window.showDirectoryPicker === 'function';
}

function idbHandleStore(mode, fn) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CSV_DB_IDB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction('handles', mode);
      const r = fn(tx.objectStore('handles'));
      tx.oncomplete = () => resolve(r && r.result);
      tx.onerror = () => reject(tx.error);
    };
  });
}

async function getSavedDataFolder() {
  try { return await idbHandleStore('readonly', st => st.get('dataFolder')); } catch (e) { return null; }
}

async function connectDataFolder() {
  const handle = await window.showDirectoryPicker({ id: 'seoldamhwa-data', mode: 'readwrite' });
  await idbHandleStore('readwrite', st => st.put(handle, 'dataFolder'));
  return handle;
}

async function ensureFolderPermission(handle, ask) {
  if (!handle) return false;
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if (!ask) return false;
  return (await handle.requestPermission(opts)) === 'granted';
}

async function writeCsvToFolder(handle) {
  const files = buildAllCsv();
  for (const [name, text] of Object.entries(files)) {
    const fh = await handle.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    await w.close();
  }
  return Object.keys(files).length;
}

async function readCsvFromFolder(handle) {
  const files = {};
  for (const name of Object.values(CSV_TABLES).map(d => d.file)) {
    try {
      const fh = await handle.getFileHandle(name);
      files[name] = await (await fh.getFile()).text();
    } catch (e) { /* 없는 파일은 건너뜀 */ }
  }
  return files;
}

// 폴더 연결이 안 되는 브라우저: 파일을 하나씩 내려받기
function downloadAllCsv() {
  const files = buildAllCsv();
  Object.entries(files).forEach(([name, text], idx) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }, idx * 250);
  });
  return Object.keys(files).length;
}
