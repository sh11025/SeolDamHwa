// assets/js/admin/admin-tools-ui.js
// 설담화 관리자: CSV 저장소·재고 조절·꽃 사입 계획·메뉴 전환
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 11. CSV 데이터 저장소 (DATA 폴더)
let csvFolderHandle = null;
let csvAutoSaveTimer = null;
let csvSaving = false;

async function refreshCsvStatus() {
  const status = document.getElementById('csv-folder-status');
  if (!status) return;
  document.getElementById('csv-folder-actions').classList.toggle('hidden', !csvFolderSupported());
  document.getElementById('csv-fallback-actions').classList.toggle('hidden', csvFolderSupported());
  if (window.SDH_SERVER_MODE) {
    status.innerText = '서버 연결됨 · 바뀌면 DATA 폴더에 바로 저장';
    status.className = 'text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800';
    return;
  }
  if (!csvFolderSupported()) { status.innerText = '파일 내려받기 방식'; return; }
  if (!csvFolderHandle) csvFolderHandle = await getSavedDataFolder();
  const granted = csvFolderHandle ? await ensureFolderPermission(csvFolderHandle, false) : false;
  status.innerText = csvFolderHandle ? (granted ? `연결됨 · ${csvFolderHandle.name} 폴더` : `${csvFolderHandle.name} 폴더 (다시 허락 필요)`) : '연결 안 됨';
  status.className = `text-xs font-bold px-2 py-0.5 rounded ${granted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`;
  const auto = document.getElementById('csv-autosave');
  if (auto) auto.checked = DataStore.readRaw(DataStore.KEYS.csvAutosave) === '1';
}

async function handleConnectDataFolder() {
  try {
    csvFolderHandle = await connectDataFolder();
    if (csvFolderHandle.name !== 'DATA' && !confirm(`'${csvFolderHandle.name}' 폴더를 골랐어요. 프로젝트의 DATA 폴더가 맞나요?`)) { csvFolderHandle = null; return; }
    setIntegrationMessage('csv-message', `'${csvFolderHandle.name}' 폴더에 연결했어요. [지금 CSV로 저장]을 눌러 보세요.`, true);
  } catch (e) {
    if (e && e.name !== 'AbortError') setIntegrationMessage('csv-message', '폴더를 연결하지 못했어요.', false);
  }
  refreshCsvStatus();
}

async function handleSaveCsv(silent) {
  if (!csvFolderHandle) csvFolderHandle = await getSavedDataFolder();
  if (!csvFolderHandle) { if (!silent) setIntegrationMessage('csv-message', '먼저 [DATA 폴더 연결]을 눌러 주세요.', false); return; }
  if (!(await ensureFolderPermission(csvFolderHandle, !silent))) { if (!silent) setIntegrationMessage('csv-message', '폴더에 저장할 권한이 없어요. 다시 허락해 주세요.', false); refreshCsvStatus(); return; }
  if (csvSaving) return;
  csvSaving = true;
  try {
    const n = await writeCsvToFolder(csvFolderHandle);
    const now = new Date();
    setIntegrationMessage('csv-message', `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} CSV ${n}개 파일을 저장했어요.`, true);
  } catch (e) {
    setIntegrationMessage('csv-message', `저장하지 못했어요. (${String(e.message || e).slice(0, 60)})`, false);
  } finally {
    csvSaving = false;
    refreshCsvStatus();
  }
}

function applyImportedCsv(files) {
  const names = Object.keys(files);
  if (!names.length) { setIntegrationMessage('csv-message', '불러올 CSV 파일이 없어요.', false); return; }
  if (!confirm(`CSV 파일 ${names.length}개로 지금 데이터를 바꿀까요?\n(혹시 모르니 먼저 백업 파일을 내려받아 두세요.)`)) return;
  try {
    const result = importCsvTables(files);
    setIntegrationMessage('csv-message', `불러왔어요: ${result.join(', ')}. 화면을 새로 고칩니다.`, true);
    setTimeout(() => location.reload(), 800);
  } catch (e) {
    setIntegrationMessage('csv-message', `불러오지 못했어요. ${String(e.message || e).slice(0, 80)}`, false);
  }
}

async function handleLoadCsvFromFolder() {
  if (!csvFolderHandle) csvFolderHandle = await getSavedDataFolder();
  if (!csvFolderHandle) { setIntegrationMessage('csv-message', '먼저 [DATA 폴더 연결]을 눌러 주세요.', false); return; }
  if (!(await ensureFolderPermission(csvFolderHandle, true))) return;
  applyImportedCsv(await readCsvFromFolder(csvFolderHandle));
}

function handleDownloadCsv() {
  const n = downloadAllCsv();
  setIntegrationMessage('csv-message', `CSV ${n}개 파일을 내려받고 있어요. 프로젝트의 DATA 폴더에 넣어 주세요.`, true);
}

function handleLoadCsvFiles(input) {
  const list = [...(input.files || [])];
  input.value = '';
  Promise.all(list.map(f => f.text().then(text => [f.name, text]))).then(pairs => applyImportedCsv(Object.fromEntries(pairs)));
}

function toggleCsvAutosave(on) {
  DataStore.writeRaw(DataStore.KEYS.csvAutosave, on ? '1' : '0');
  if (on) handleSaveCsv();
}

// 데이터가 바뀌면 2초 뒤 자동 저장 (권한이 있을 때만, 묻지 않음)
function scheduleCsvAutoSave(key) {
  if (!key || !key.startsWith('seoldamhwa_') || /_(lang|csv_autosave|popup_dismissed_date|ai_settings|ai_key|integrations)$/.test(key)) return;
  if (window.SDH_SERVER_MODE) return; // server.py로 열면 data-sync.js가 DATA 폴더에 바로 저장
  if (DataStore.readRaw(DataStore.KEYS.csvAutosave) !== '1' || !csvFolderSupported()) return;
  clearTimeout(csvAutoSaveTimer);
  csvAutoSaveTimer = setTimeout(() => handleSaveCsv(true), 2000);
}
(function hookCsvAutoSave() {
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    original.call(this, key, value);
    if (this === window.localStorage) scheduleCsvAutoSave(key);
  };
  window.addEventListener('storage', e => scheduleCsvAutoSave(e.key)); // 쇼핑몰 탭에서 들어온 주문·상담도
})();

// 상품 목록에서 재고 바로 조절
function adjustStock(prodId, delta) {
  const products = loadProducts();
  const p = products.find(x => x.id === prodId);
  if (!p || p.inquiryOnly) return;
  const before = Number(p.stockQuantity) || 0;
  p.stockQuantity = Math.max(0, before + delta);
  saveProducts(products);
  renderProductsTable();
  renderDashboard();
  const waiting = typeof restockWaitingCount === 'function' ? restockWaitingCount(prodId) : 0;
  if (before <= 0 && p.stockQuantity > 0 && waiting > 0) {
    setTimeout(() => {
      if (confirm(`재고를 채웠어요. 이 상품의 재입고 알림을 기다리는 손님이 ${waiting}명 있어요.\n지금 알림 목록으로 갈까요?`)) {
        switchAdminTab('reviews');
        setTimeout(() => document.getElementById('admin-restock-list').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }, 50);
  }
}

// 꽃 사입 계획: 앞으로 3일 배송할 상품 합계 (취소·배송 완료 제외)
function purchasePlan(days = 3) {
  const today = financeToday();
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i));
  const rows = {};
  loadOrders().filter(o => o.status !== 'cancelled' && o.status !== 'completed').forEach(o => {
    const d = getDeliveryDate(o);
    const idx = dates.indexOf(d);
    if (idx < 0) return;
    (o.items || []).forEach(i => {
      const key = `${(i.product && i.product.name) || '꽃 상품'}${i.sizeLabel ? ` · ${i.sizeLabel}` : ''}`;
      rows[key] = rows[key] || { name: key, byDay: Array(days).fill(0), total: 0 };
      rows[key].byDay[idx] += Number(i.quantity) || 1;
      rows[key].total += Number(i.quantity) || 1;
    });
  });
  return { dates, rows: Object.values(rows).sort((a, b) => b.total - a.total) };
}

function renderPurchasePlan() {
  const box = document.getElementById('purchase-plan');
  if (!box) return;
  const { dates, rows } = purchasePlan(3);
  const head = ['오늘', '내일', '모레'].map((l, i) => `<th class="py-2 px-2 text-right">${l}<span class="block font-normal text-ink-gray">${shortDate(dates[i])}</span></th>`).join('');
  box.innerHTML = rows.length
    ? `<table class="w-full text-sm"><thead><tr class="border-b border-ink-black/10 text-xs text-ink-gray"><th class="py-2 px-2 text-left">상품 · 사이즈</th>${head}<th class="py-2 px-2 text-right">합계</th></tr></thead>
        <tbody class="divide-y divide-ink-black/5">${rows.map(r => `<tr><td class="py-2 px-2 font-bold text-ink-black">${escapeHtml(r.name)}</td>${r.byDay.map(n => `<td class="py-2 px-2 text-right ${n ? 'font-bold text-ink-black' : 'text-ink-light'}">${n || '-'}</td>`).join('')}<td class="py-2 px-2 text-right font-extrabold text-seal-red">${r.total}</td></tr>`).join('')}</tbody></table>`
    : '<p class="py-6 text-center text-sm text-ink-gray">앞으로 3일 동안 만들 주문이 없어요.</p>';
}

async function sendPurchasePlanToDiscord(btn) {
  const url = typeof getWebhookFor === 'function' ? getWebhookFor('order') : '';
  if (!url) { alert("먼저 '연동·데이터'에서 디스코드 주문 채널 주소를 넣어 주세요."); return; }
  const { dates, rows } = purchasePlan(3);
  const lines = rows.length ? rows.map(r => `☐ **${discordSafe(r.name, 60)}** × ${r.total}  (${r.byDay.map((n, i) => `${['오늘', '내일', '모레'][i]} ${n}`).join(' / ')})`).join('\n') : '앞으로 3일 동안 만들 주문이 없어요.';
  btn.disabled = true;
  const r = await sendDiscord({ embeds: [{ title: `🌷 꽃 사입 계획 (${shortDate(dates[0])}~${shortDate(dates[2])})`, description: lines.slice(0, 4000), color: 0x4C8A3B }] }, url);
  btn.disabled = false;
  alert(r.ok ? '디스코드 주문 채널로 보냈어요.' : '보내지 못했어요. 웹후크 주소를 확인해 주세요.');
}

// 휴대폰·태블릿: 왼쪽 메뉴 서랍 열고 닫기
function toggleAdminMenu(open) {
  const side = document.getElementById('admin-sidebar');
  if (!side) return;
  const show = typeof open === 'boolean' ? open : side.classList.contains('-translate-x-full');
  side.classList.toggle('-translate-x-full', !show);
  document.getElementById('admin-sidebar-backdrop').classList.toggle('hidden', !show);
  document.body.classList.toggle('admin-menu-open', show);
  const btn = document.getElementById('admin-menu-btn');
  if (btn) btn.setAttribute('aria-expanded', show ? 'true' : 'false');
}

window.addEventListener('keydown', ev => { if (ev.key === 'Escape') toggleAdminMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth >= 1024) toggleAdminMenu(false); });

function switchAdminTab(tabName) {
  if (window.innerWidth < 1024) toggleAdminMenu(false);
  window.scrollTo({ top: 0 });
  ['dashboard', 'products', 'flowers', 'orders', 'finance', 'coupons', 'reviews', 'reviews-admin', 'settings', 'popups', 'integrations', 'pages'].forEach(t => {
    const p = document.getElementById(`panel-${t}`);
    if (p) p.classList.add('hidden');
    const b = document.getElementById(`tab-btn-${t}`);
    if (b) {
      b.classList.remove('is-active');
      b.removeAttribute('aria-current');
    }
  });

  const targetPanel = document.getElementById(`panel-${tabName}`);
  if (targetPanel) targetPanel.classList.remove('hidden');
  const active = document.getElementById(`tab-btn-${tabName}`);
  if (active) {
    active.classList.add('is-active');
    active.setAttribute('aria-current', 'page');
  }
  if (tabName === 'popups') { try { initPopupsAdmin(); } catch (e) { console.error('initPopupsAdmin error:', e); } }
  if (tabName === 'dashboard') { try { renderDashboard(); } catch (e) { console.error('renderDashboard error:', e); } }
  if (tabName === 'finance') { try { renderFinance(); } catch (e) { console.error('renderFinance error:', e); } }
  if (tabName === 'settings') { try { renderDeliverySettings(); } catch (e) { console.error('renderDeliverySettings error:', e); } }
  if (tabName === 'reviews') { try { renderRestockList(); } catch (e) { console.error('renderRestockList error:', e); } }
  if (tabName === 'reviews-admin') { try { renderReviewsAdmin(); } catch (e) { console.error('renderReviewsAdmin error:', e); } }
  if (tabName === 'coupons') { try { renderCouponsAdmin(); } catch (e) { console.error('renderCouponsAdmin error:', e); } }
  if (tabName === 'flowers') { try { renderFlowerDictionary(); } catch (e) { console.error('renderFlowerDictionary error:', e); } }
  if (tabName === 'pages') { try { renderPagesAdmin(); } catch (e) { console.error('renderPagesAdmin error:', e); } }
  if (tabName === 'integrations') { try { refreshCsvStatus(); renderServerAdmin(); } catch (e) {} }
  if (tabName === 'integrations') { try { renderIntegrations(); } catch (e) { console.error('renderIntegrations error:', e); } }
}

// 60초마다 상품 목록 자동 새로고침 (예약 공개 전환 반영, 현재 필터 탭 유지)
setInterval(() => {
  try { renderProductsTable(); } catch(e){}
}, 60000);
  

/* ---------- 서버 관리 (server.py로 열었을 때) ---------- */
async function renderServerAdmin() {
  const card = document.getElementById('server-admin-card');
  if (!card) return;
  if (!window.SDH_SERVER_MODE) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  try {
    const ses = await (await fetch('/api/session', { cache: 'no-store' })).json();
    const st = document.getElementById('server-pw-state');
    st.textContent = ses.hasPassword ? '정해져 있음' : '아직 없음';
    st.className = `ml-1 text-[11px] font-bold ${ses.hasPassword ? 'text-emerald-700' : 'text-amber-700'}`;
    document.getElementById('server-logout-btn').classList.toggle('hidden', ses.local);
  } catch (e) { /* 서버가 잠깐 꺼져 있음 */ }
  const box = document.getElementById('server-backup-list');
  try {
    const res = await (await fetch('/api/backups', { cache: 'no-store' })).json();
    const list = res.backups || [];
    box.innerHTML = list.length ? '' : '<p class="p-3 text-ink-gray">아직 백업이 없어요.</p>';
    list.slice(0, 40).forEach(b => {
      const m = b.name.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-?(.*)$/);
      const label = m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}` : b.name;
      const kind = m ? ({ auto: '자동', 'before-restore': '되돌리기 전', 'browser-before-server': '처음 연결 전 브라우저' }[m[7]] || m[7]) : '';
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 px-3 py-2';
      row.innerHTML = `<span><span class="font-bold text-ink-black">${escapeHtml(label)}</span> <span class="text-ink-gray">${escapeHtml(kind)} · 파일 ${b.files}개</span></span>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'px-2.5 py-1 border border-ink-black/20 bg-white rounded-xs font-bold hover:border-seal-red hover:text-seal-red cursor-pointer';
      btn.textContent = '되돌리기';
      btn.onclick = () => restoreServerBackup(b.name, label);
      row.appendChild(btn);
      box.appendChild(row);
    });
  } catch (e) {
    box.innerHTML = '<p class="p-3 text-ink-gray">백업 목록을 불러오지 못했어요.</p>';
  }
}

async function saveAdminPassword(e) {
  e.preventDefault();
  const input = document.getElementById('server-pw');
  const msg = document.getElementById('server-pw-msg');
  const res = await (await fetch('/api/admin-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: input.value }) })).json().catch(() => ({ ok: false }));
  msg.textContent = res.ok ? '저장했어요. 다른 기기에서는 이 비밀번호로 로그인해요.' : (res.error || '저장하지 못했어요.');
  msg.className = `text-xs font-bold ${res.ok ? 'text-emerald-700' : 'text-red-700'}`;
  if (res.ok) { input.value = ''; renderServerAdmin(); }
}

async function restoreServerBackup(name, label) {
  if (!confirm(`${label} 백업으로 되돌릴까요?\n지금 데이터는 되돌리기 전에 따로 백업해 둬요. 되돌린 뒤 화면을 새로 불러와요.`)) return;
  const res = await (await fetch('/api/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: name }) })).json().catch(() => ({ ok: false }));
  if (!res.ok) { alert(res.error || '되돌리지 못했어요.'); return; }
  location.reload();
}

async function adminLogout() {
  await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
  location.reload();
}

/* ---------- 손님 후기 관리 (Admin Reviews) ---------- */
let currentAdminReviewTab = 'pending';

function filterReviewsAdmin(tab) {
  currentAdminReviewTab = tab;
  ['pending', 'approved', 'hidden', 'all'].forEach(t => {
    const btn = document.getElementById(`rev-admin-tab-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'rev-admin-tab px-3 py-1.5 rounded text-xs font-bold bg-ink-black text-white cursor-pointer';
      } else {
        btn.className = 'rev-admin-tab px-3 py-1.5 rounded text-xs font-bold bg-white text-ink-gray border border-ink-black/15 hover:bg-hanji cursor-pointer';
      }
    }
  });
  renderReviewsAdmin();
}

function updateAdminReviewCounts() {
  const allRevs = typeof loadReviews === 'function' ? loadReviews() : [];
  const counts = {
    pending: allRevs.filter(r => r.status === 'pending').length,
    approved: allRevs.filter(r => r.status === 'approved').length,
    hidden: allRevs.filter(r => r.status === 'hidden').length,
    all: allRevs.length
  };

  ['pending', 'approved', 'hidden', 'all'].forEach(t => {
    const cEl = document.getElementById(`rev-admin-count-${t}`);
    if (cEl) cEl.textContent = counts[t];
  });

  const sideBadge = document.getElementById('badge-review-admin-count');
  if (sideBadge) {
    if (counts.pending > 0) {
      sideBadge.textContent = counts.pending;
      sideBadge.classList.remove('hidden');
    } else {
      sideBadge.classList.add('hidden');
    }
  }
  return counts;
}

function renderReviewsAdmin() {
  const listEl = document.getElementById('admin-reviews-list');
  const emptyEl = document.getElementById('admin-reviews-empty');
  if (!listEl) return;

  const allRevs = typeof loadReviews === 'function' ? loadReviews() : [];
  updateAdminReviewCounts();

  // 필터링
  let filtered = allRevs;
  if (currentAdminReviewTab !== 'all') {
    filtered = allRevs.filter(r => r.status === currentAdminReviewTab);
  }
  // 최신순 정렬
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');

  listEl.innerHTML = '';
  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'bg-white border border-ink-black/10 rounded-sm p-5 space-y-4 shadow-xs';

    const starStr = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
    const dateStr = r.createdAt ? (typeof formatKoreaTime === 'function' ? formatKoreaTime(r.createdAt, { time: true }) : r.createdAt.slice(0, 16).replace('T', ' ')) : '';

    let photoArr = [];
    try { photoArr = Array.isArray(r.photos) ? r.photos : JSON.parse(r.photos || '[]'); } catch (e) {}

    const statusBadge = {
      pending: '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">확인 대기</span>',
      approved: '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">게시됨</span>',
      hidden: '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">숨김</span>'
    }[r.status] || `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">${escapeHtml(r.status)}</span>`;

    let mediaHtml = '';
    if (photoArr.length > 0) {
      mediaHtml += `
        <div class="flex gap-2 pt-1 flex-wrap">
          ${photoArr.map(src => {
            const url = typeof reviewMediaUrl === 'function' ? reviewMediaUrl(src) : src;
            return `
              <img loading="lazy" decoding="async" src="${url}" alt="후기 사진" class="w-16 h-16 object-cover rounded-xs border border-ink-black/10 cursor-pointer hover:opacity-80" onclick="window.open('${url}', '_blank')" />
            `;
          }).join('')}
        </div>
      `;
    }
    if (r.video) {
      const vUrl = typeof reviewMediaUrl === 'function' ? reviewMediaUrl(r.video) : r.video;
      mediaHtml += `
        <div class="pt-2 max-w-sm">
          <video src="${vUrl}" controls playsinline preload="metadata" class="w-full max-h-48 rounded-xs bg-black"></video>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-black/5 pb-3">
        <div class="flex items-center gap-2.5">
          ${statusBadge}
          <span class="text-amber-500 font-bold">${starStr}</span>
          <span class="text-xs text-ink-gray">${dateStr}</span>
        </div>
        <div class="text-xs text-ink-gray font-mono">
          주문번호: <span class="font-bold text-ink-black">${escapeHtml(r.orderNumber || '-')}</span>
        </div>
      </div>

      <div class="space-y-2">
        <div class="text-xs font-bold text-seal-red">
          꽃 상품: ${escapeHtml(r.productName || '설담화 꽃')}
        </div>
        <p class="text-sm text-ink-charcoal leading-relaxed whitespace-pre-wrap">${escapeHtml(r.text || '')}</p>
        ${mediaHtml}
      </div>

      <!-- 사장님 답글 영역 -->
      <div class="pt-3 border-t border-ink-black/5 space-y-2 bg-[#FAF7F2] p-3 rounded-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-ink-black flex items-center gap-1">🌸 설담화 사장님 답글</span>
          ${r.replyAt ? `<span class="text-[11px] text-ink-gray">${typeof formatKoreaTime === 'function' ? formatKoreaTime(r.replyAt) : r.replyAt.slice(0, 10)}</span>` : ''}
        </div>
        <div id="reply-box-${r.id}">
          ${r.adminReply ? `
            <p class="text-xs text-ink-charcoal leading-relaxed whitespace-pre-wrap">${escapeHtml(r.adminReply)}</p>
            <div class="pt-2 text-right">
              <button type="button" onclick="showReplyEditForm('${r.id}')" class="text-xs text-ink-gray hover:text-seal-red underline cursor-pointer">답글 수정</button>
            </div>
          ` : `
            <div class="flex gap-2">
              <input type="text" id="reply-input-${r.id}" placeholder="손님께 남길 정성스러운 답글을 입력해 주세요." class="flex-1 bg-white border border-ink-black/20 p-2 text-xs rounded-xs outline-none focus:border-seal-red" />
              <button type="button" onclick="handleReplySubmit('${r.id}')" class="px-3 py-1.5 bg-ink-black text-white text-xs font-bold rounded-xs hover:bg-seal-red cursor-pointer">답글 등록</button>
            </div>
          `}
        </div>
      </div>

      <!-- 관리자 액션 버튼 -->
      <div class="flex items-center justify-end gap-2 pt-2">
        ${r.status !== 'approved' ? `
          <button type="button" onclick="updateReviewStatus('${r.id}', 'approved')" class="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-xs hover:bg-emerald-800 cursor-pointer shadow-xs">
            게시 승인
          </button>
        ` : `
          <button type="button" onclick="updateReviewStatus('${r.id}', 'hidden')" class="px-3 py-1.5 bg-gray-600 text-white text-xs font-bold rounded-xs hover:bg-gray-700 cursor-pointer">
            숨기기
          </button>
        `}
        <button type="button" onclick="deleteReview('${r.id}')" class="px-3 py-1.5 border border-red-300 text-red-700 bg-white text-xs font-bold rounded-xs hover:bg-red-50 cursor-pointer">
          삭제
        </button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

function showReplyEditForm(id) {
  const box = document.getElementById(`reply-box-${id}`);
  if (!box) return;
  const allRevs = typeof loadReviews === 'function' ? loadReviews() : [];
  const target = allRevs.find(r => r.id === id);
  const currentReply = target ? (target.adminReply || '') : '';

  box.innerHTML = `
    <div class="space-y-2">
      <textarea id="reply-input-${id}" rows="2" class="w-full bg-white border border-ink-black/20 p-2 text-xs rounded-xs outline-none focus:border-seal-red">${escapeHtml(currentReply)}</textarea>
      <div class="flex justify-end gap-2">
        <button type="button" onclick="renderReviewsAdmin()" class="px-2.5 py-1 text-xs border border-ink-black/20 rounded-xs bg-white text-ink-gray hover:bg-hanji cursor-pointer">취소</button>
        <button type="button" onclick="handleReplySubmit('${id}')" class="px-3 py-1 text-xs font-bold rounded-xs bg-ink-black text-white hover:bg-seal-red cursor-pointer">수정 저장</button>
      </div>
    </div>
  `;
}

async function handleReplySubmit(id) {
  const input = document.getElementById(`reply-input-${id}`);
  if (!input) return;
  const text = input.value.trim();
  await saveAdminReply(id, text);
}

async function updateReviewStatus(id, newStatus) {
  const list = typeof loadReviews === 'function' ? loadReviews() : [];
  const target = list.find(r => r.id === id);
  if (!target) return;
  target.status = newStatus;
  if (typeof saveReviews === 'function') saveReviews(list);
  if (typeof DataSync !== 'undefined' && DataSync.enabled) {
    try { await DataSync.push(); } catch (e) { console.warn('리뷰 상태 동기화 실패:', e); }
  }
  renderReviewsAdmin();
}

async function deleteReview(id) {
  if (!confirm('이 후기를 삭제할까요? 등록된 사진·동영상도 함께 삭제됩니다.')) return;
  const list = typeof loadReviews === 'function' ? loadReviews() : [];
  const filtered = list.filter(r => r.id !== id);
  if (typeof saveReviews === 'function') saveReviews(filtered);
  if (typeof DataSync !== 'undefined' && DataSync.enabled) {
    try { await DataSync.push(); } catch (e) { console.warn('리뷰 삭제 동기화 실패:', e); }
  }
  renderReviewsAdmin();
}

async function saveAdminReply(id, replyText) {
  const list = typeof loadReviews === 'function' ? loadReviews() : [];
  const target = list.find(r => r.id === id);
  if (!target) return;
  target.adminReply = replyText;
  target.replyAt = new Date().toISOString();
  if (typeof saveReviews === 'function') saveReviews(list);
  if (typeof DataSync !== 'undefined' && DataSync.enabled) {
    try { await DataSync.push(); } catch (e) { console.warn('리뷰 답글 동기화 실패:', e); }
  }
  renderReviewsAdmin();
}

document.addEventListener('DOMContentLoaded', () => {
  try { updateAdminReviewCounts(); } catch (e) {}
});
