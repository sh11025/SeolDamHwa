// assets/js/data-sync.js
// 설담화(說談花) DATA 폴더 CSV 저장소 연결 - server.py로 열었을 때만 동작 (그냥 파일·다른 서버로 열면 아무것도 안 함)
// 1) 화면이 열릴 때: 서버의 DATA/*.csv를 읽어 브라우저 저장소에 채움 (화면 코드는 지금처럼 localStorage를 읽음)
// 2) 저장소가 바뀌면: 표마다 바뀐 줄·지운 줄만 골라 0.8초 뒤 서버로 보냄
// 3) 20초마다(그리고 창으로 돌아올 때) 다른 기기·탭에서 바뀐 내용을 다시 받아 옴
// 표 구조와 CSV 변환은 csv-db.js(CSV_TABLES, tableToCsv, importCsvTables)를 그대로 씀.

const DataSync = (() => {
  const KEYS = { order_items: r => `${r.orderId}#${r.lineNo}`, settings: r => String(r.key), coupons: r => String(r.code) };
  const keyOf = (table, row) => (KEYS[table] ? KEYS[table](row) : String(row.id));
  const SYNCED_FLAG = 'seoldamhwa_server_synced';
  const IGNORE = /_(lang|csv_autosave|popup_dismissed_date|ai_settings|ai_key|integrations|server_synced|wishlist|recent)$/;

  let enabled = false;
  let local = false;
  let readable = [];
  let snapshot = {};      // table → { key: '줄 내용' } (서버와 마지막으로 맞춘 상태)
  let lastFiles = {};     // 파일 이름 → 마지막으로 받은 글자
  let suppress = false;   // 서버에서 받은 내용을 넣는 중에는 다시 보내지 않음
  let timer = null;
  let pushing = false;

  // 한 줄을 CSV 칸 글자로 (tableToCsv와 같은 규칙)
  function rowCells(table, r) {
    const def = CSV_TABLES[table];
    const json = def.json || [];
    const out = {};
    def.columns.forEach(c => {
      let v = r[c];
      if (json.includes(c) && v !== undefined && v !== null) v = JSON.stringify(v);
      out[c] = v === undefined || v === null ? '' : String(v);
    });
    return out;
  }

  function currentRows(table) {
    try { return (CSV_TABLES[table].read() || []).map(r => rowCells(table, r)); } catch (e) { return []; }
  }

  function takeSnapshot(table) {
    const snap = {};
    currentRows(table).forEach(r => { snap[keyOf(table, r)] = JSON.stringify(r); });
    snapshot[table] = snap;
  }

  function diff(table) {
    const before = snapshot[table] || {};
    const now = {};
    const upserts = [];
    currentRows(table).forEach(r => {
      const k = keyOf(table, r);
      const s = JSON.stringify(r);
      now[k] = s;
      if (before[k] !== s) upserts.push(r);
    });
    const deletes = Object.keys(before).filter(k => !(k in now));
    return { table, columns: CSV_TABLES[table].columns, upserts, deletes, now };
  }

  function xhrJson(method, url, body) {
    const x = new XMLHttpRequest();
    x.open(method, url, false); // 처음 한 번만 동기 (화면이 데이터를 읽기 전에 채우려고)
    if (body) x.setRequestHeader('Content-Type', 'application/json');
    x.send(body ? JSON.stringify(body) : null);
    if (x.status !== 200) throw new Error(`HTTP ${x.status}`);
    return JSON.parse(x.responseText);
  }

  function importFiles(files) {
    suppress = true;
    try { importCsvTables(files); } finally { suppress = false; }
  }

  function hasLocalData() {
    return ['seoldamhwa_products', 'seoldamhwa_orders', 'seoldamhwa_settings'].some(k => localStorage.getItem(k));
  }

  // 처음 연결: 서버 파일로 채우고, 서버에 없는 표는 이 브라우저 내용으로 채워 넣음
  function start() {
    if (location.protocol === 'file:') return;
    let res;
    try { res = xhrJson('GET', '/api/csv'); } catch (e) { return; } // server.py가 아니면 그냥 지금처럼
    if (!res || !res.ok) return;
    enabled = true;
    local = !!res.local;
    readable = res.readable || [];
    window.SDH_SERVER_MODE = true;
    const serverFiles = res.files || {};
    const hasServerData = Object.keys(serverFiles).length > 0;

    // 이 컴퓨터에서 처음 연결: 브라우저 데이터와 DATA 폴더 중 무엇을 쓸지 (둘 다 백업해 둠)
    let useBrowser = false;
    if (local && !localStorage.getItem(SYNCED_FLAG) && hasLocalData() && hasServerData) {
      try { xhrJson('POST', '/api/backup', { label: 'browser-before-server', files: buildAllCsv() }); } catch (e) { /* 백업 실패해도 계속 */ }
      useBrowser = !confirm('DATA 폴더(서버)에 저장된 데이터를 불러올까요?\n\n[확인] DATA 폴더 내용을 씀 (이 브라우저에 있던 데이터는 DATA/backup 폴더에 따로 보관했어요)\n[취소] 이 브라우저 내용을 DATA 폴더에 저장 (DATA 폴더의 예전 파일도 백업돼요)');
    }

    Object.keys(CSV_TABLES).forEach(table => {
      const file = CSV_TABLES[table].file;
      const onServer = typeof serverFiles[file] === 'string';
      if (!readable.includes(table)) {
        takeSnapshot(table); // 못 읽는 표(손님 기기의 주문 등): 이 기기에서 새로 생긴 줄만 보냄
      } else if (useBrowser || !onServer) {
        snapshot[table] = {}; // 서버에 없거나 브라우저 내용을 쓰기로 함: 이 브라우저 내용을 모두 보냄
        if (useBrowser && onServer) {
          // 서버에만 있던 줄은 지워지도록 서버 줄을 기억
          const rows = csvToTable(table, serverFiles[file]).map(r => rowCells(table, r));
          rows.forEach(r => { snapshot[table][keyOf(table, r)] = '__server__'; });
        }
      }
    });
    if (!useBrowser) importFiles(serverFiles);
    Object.keys(CSV_TABLES).forEach(table => {
      const file = CSV_TABLES[table].file;
      if (readable.includes(table) && !useBrowser && typeof serverFiles[file] === 'string') takeSnapshot(table);
    });
    lastFiles = serverFiles;
    if (local) localStorage.setItem(SYNCED_FLAG, new Date().toISOString());
    schedule(50); // 서버에 없던 표 채워 넣기

    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      original.call(this, key, value);
      if (this === window.localStorage && !suppress && key.startsWith('seoldamhwa_') && !IGNORE.test(key)) schedule();
    };
    setInterval(pull, 20000);
    window.addEventListener('focus', () => pull());
  }

  function schedule(ms = 800) {
    if (!enabled) return;
    clearTimeout(timer);
    timer = setTimeout(push, ms);
    status('saving');
  }

  async function push() {
    if (pushing) { schedule(); return; }
    const changes = Object.keys(CSV_TABLES).map(diff).filter(c => c.upserts.length || c.deletes.length);
    if (!changes.length) { status('saved'); return; }
    pushing = true;
    try {
      const r = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: changes.map(({ now, ...c }) => c) })
      });
      const res = await r.json();
      if (!res.ok) throw new Error(res.error || 'sync');
      changes.forEach(c => { snapshot[c.table] = c.now; });
      if (res.rejected && res.rejected.length) console.warn('DATA 저장에서 빠진 줄:', res.rejected);
      status('saved');
    } catch (e) {
      console.error('DATA 폴더 저장 실패:', e);
      status('error');
      setTimeout(() => schedule(), 5000);
    } finally {
      pushing = false;
    }
  }

  // 다른 기기·탭에서 바뀐 내용 받아 오기 (보낼 것이 남아 있으면 건너뜀)
  async function pull() {
    if (!enabled || pushing || timer && status.state === 'saving') return;
    try {
      const res = await (await fetch('/api/csv', { cache: 'no-store' })).json();
      if (!res.ok) return;
      const files = res.files || {};
      const changed = Object.keys(files).filter(f => files[f] !== lastFiles[f]);
      if (!changed.length) return;
      if (Object.keys(CSV_TABLES).some(t => { const d = diff(t); return d.upserts.length || d.deletes.length; })) return; // 아직 안 보낸 내 변경이 있음
      const part = {};
      changed.forEach(f => { part[f] = files[f]; });
      // 주문은 주문 상품 표와 함께, 팝업은 설정과 함께 넣어야 함
      if (part['orders.csv'] || part['order_items.csv']) { part['orders.csv'] = files['orders.csv']; part['order_items.csv'] = files['order_items.csv']; }
      if (part['popups.csv'] || part['settings.csv']) { part['settings.csv'] = files['settings.csv']; part['popups.csv'] = files['popups.csv']; }
      importFiles(part);
      Object.keys(CSV_TABLES).forEach(t => { if (part[CSV_TABLES[t].file] !== undefined) takeSnapshot(t); });
      lastFiles = files;
      refreshScreens();
    } catch (e) { /* 서버가 잠깐 꺼져도 다음에 다시 */ }
  }

  function refreshScreens() {
    ['renderDashboard', 'renderProductsTable', 'renderOrdersList', 'renderCouponsAdmin', 'renderInquiriesList', 'renderRestockList', 'renderFinance', 'renderFlowerDictionary', 'renderProducts', 'updateWishBadge', 'renderSiteSettings']
      .forEach(fn => { try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { /* 그 화면이 없으면 건너뜀 */ } });
  }

  // 관리자 화면 왼쪽 아래 작은 저장 표시
  function status(state) {
    status.state = state;
    if (!local || !document.getElementById('panel-dashboard')) return;
    let el = document.getElementById('data-sync-status');
    if (!el) {
      if (!document.body) return;
      el = document.createElement('div');
      el.id = 'data-sync-status';
      el.setAttribute('role', 'status');
      el.className = 'fixed left-3 bottom-3 z-40 px-3 py-1.5 rounded-full text-[11px] font-bold shadow border bg-white';
      document.body.appendChild(el);
    }
    const text = { saving: '● DATA 폴더에 저장 중…', saved: '● DATA 폴더에 저장됨', error: '● 저장 실패 · 서버(server.py)가 켜져 있나요?' }[state] || '';
    el.textContent = text;
    el.style.color = state === 'error' ? '#b91c1c' : state === 'saving' ? '#92400e' : '#065f46';
  }

  start();
  document.addEventListener('DOMContentLoaded', () => { if (enabled) status(status.state || 'saved'); });
  return { get enabled() { return enabled; }, get local() { return local; }, push, pull };
})();
