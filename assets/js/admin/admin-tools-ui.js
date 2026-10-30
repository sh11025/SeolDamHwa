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
  if (!csvFolderSupported()) { status.innerText = '파일 내려받기 방식'; return; }
  if (!csvFolderHandle) csvFolderHandle = await getSavedDataFolder();
  const granted = csvFolderHandle ? await ensureFolderPermission(csvFolderHandle, false) : false;
  status.innerText = csvFolderHandle ? (granted ? `연결됨 · ${csvFolderHandle.name} 폴더` : `${csvFolderHandle.name} 폴더 (다시 허락 필요)`) : '연결 안 됨';
  status.className = `text-xs font-bold px-2 py-0.5 rounded ${granted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`;
  const auto = document.getElementById('csv-autosave');
  if (auto) auto.checked = localStorage.getItem('seoldamhwa_csv_autosave') === '1';
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
  localStorage.setItem('seoldamhwa_csv_autosave', on ? '1' : '0');
  if (on) handleSaveCsv();
}

// 데이터가 바뀌면 2초 뒤 자동 저장 (권한이 있을 때만, 묻지 않음)
function scheduleCsvAutoSave(key) {
  if (!key || !key.startsWith('seoldamhwa_') || /_(lang|csv_autosave|popup_dismissed_date|ai_settings|ai_key|integrations)$/.test(key)) return;
  if (localStorage.getItem('seoldamhwa_csv_autosave') !== '1' || !csvFolderSupported()) return;
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

function switchAdminTab(tabName) {
  ['dashboard', 'products', 'orders', 'finance', 'reviews', 'settings', 'popups', 'integrations', 'pages'].forEach(t => {
    document.getElementById(`panel-${t}`).classList.add('hidden');
    document.getElementById(`tab-btn-${t}`).className = 'sidebar-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-ink-gray hover:bg-[#EFECE6] hover:text-ink-black cursor-pointer transition-colors';
  });

  document.getElementById(`panel-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-btn-${tabName}`).className = 'sidebar-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm bg-ink-black text-hanji font-bold cursor-pointer transition-colors';
  if (tabName === 'popups') { try { initPopupsAdmin(); } catch (e) { console.error('initPopupsAdmin error:', e); } }
  if (tabName === 'dashboard') { try { renderDashboard(); } catch (e) { console.error('renderDashboard error:', e); } }
  if (tabName === 'finance') { try { renderFinance(); } catch (e) { console.error('renderFinance error:', e); } }
  if (tabName === 'settings') { try { renderDeliverySettings(); } catch (e) { console.error('renderDeliverySettings error:', e); } }
  if (tabName === 'reviews') { try { renderRestockList(); } catch (e) { console.error('renderRestockList error:', e); } }
  if (tabName === 'pages') { try { renderPagesAdmin(); } catch (e) { console.error('renderPagesAdmin error:', e); } }
  if (tabName === 'integrations') { try { refreshCsvStatus(); } catch (e) {} }
  if (tabName === 'integrations') { try { renderIntegrations(); } catch (e) { console.error('renderIntegrations error:', e); } }
}

// 60초마다 상품 목록 자동 새로고침 (예약 공개 전환 반영, 현재 필터 탭 유지)
setInterval(() => {
  try { renderProductsTable(); } catch(e){}
}, 60000);
  
