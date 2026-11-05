// assets/js/admin/admin-integrations.js
// 설담화 관리자: 연동·데이터 (예시 데이터·백업·디스코드·AI)
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 9. 연동·데이터 (예시 데이터, 백업, 디스코드, AI)
function refreshAllAdminViews() {
  ['renderDashboard', 'renderProductsTable', 'renderOrdersList', 'renderInquiriesList', 'renderFinance', 'renderSampleBanner', 'renderIntegrations'].forEach(fn => {
    try { window[fn](); } catch (e) { console.error(fn + ' error:', e); }
  });
}

function renderSampleBanner() {
  const banner = document.getElementById('sample-data-banner');
  if (banner) banner.classList.toggle('hidden', !hasSampleData());
  const shopNote = document.getElementById('sample-banner-shop');
  if (shopNote) shopNote.classList.toggle('hidden', !sampleProductsVisible());
  const empty = document.getElementById('dashboard-empty-cta');
  if (empty) empty.classList.toggle('hidden', loadOrders().length > 0 || hasSampleData());
}

function renderIntegrations() {
  const sampleStatus = document.getElementById('sample-status');
  if (sampleStatus) {
    const sOrders = loadOrders().filter(o => o.isSample).length;
    const sExp = loadExpenses().filter(e => e.isSample).length;
    const sRevs = (typeof loadReviews === 'function' ? loadReviews() : []).filter(r => r.isSample).length;
    sampleStatus.innerText = hasSampleData() ? `지금 예시 데이터가 들어 있어요 (예시 주문 ${sOrders}건 · 예시 지출 ${sExp}건 · 예시 후기 ${sRevs}건).` : '지금은 예시 데이터가 없어요.';
  }
  const cfg = loadIntegrations();
  const whO = document.getElementById('discord-webhook-order');
  const whI = document.getElementById('discord-webhook-inquiry');
  if (whO && document.activeElement !== whO) whO.value = cfg.orderWebhook || '';
  if (whI && document.activeElement !== whI) whI.value = cfg.inquiryWebhook || '';
  const no = document.getElementById('discord-notify-orders');
  const ni = document.getElementById('discord-notify-inquiries');
  if (no) no.checked = !!cfg.notifyOrders;
  if (ni) ni.checked = !!cfg.notifyInquiries;
  const pd = document.getElementById('production-date');
  if (pd && !pd.value) pd.value = addDays(financeToday(), 1);
  renderAiRows();
  renderOriginalsSection();
}

function renderAiRows() {
  const rows = document.getElementById('ai-provider-rows');
  if (!rows) return;
  const ai = loadAiSettings();
  document.querySelectorAll('input[name="ai-provider"]').forEach(r => { r.checked = r.value === ai.provider; });
  rows.innerHTML = Object.entries(AI_PROVIDERS).map(([id, p]) => {
    const key = ai.keys[id] || '';
    const status = key ? `<span class="text-emerald-700">저장됨 · ${escapeHtml(key.slice(0, 7))}…${escapeHtml(key.slice(-4))}</span>` : '<span class="text-ink-gray">키 없음</span>';
    return `<div class="p-3 bg-white border border-ink-black/10 rounded-xs space-y-1.5">
      <div class="flex items-center justify-between gap-2 text-xs">
        <span class="font-bold text-sm text-ink-black">${p.label} <span class="font-normal text-ink-gray">(${p.consoleName}에서 발급)</span></span>
        <span class="font-bold">${status}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-2">
        <input type="password" id="ai-key-${id}" autocomplete="off" placeholder="${key ? '새 키로 바꾸려면 입력' : p.keyHint + '...'}" class="min-w-0 bg-white border border-ink-black/20 p-2 rounded-xs font-mono text-xs">
        <input type="text" id="ai-model-${id}" value="${escapeHtml(ai.models[id] || '')}" placeholder="${p.defaultModel}" class="min-w-0 bg-white border border-ink-black/20 p-2 rounded-xs font-mono text-xs" aria-label="${p.label} 모델 이름">
        <button type="button" onclick="clearAiProviderKey('${id}')" ${key ? '' : 'disabled'} class="px-3 py-2 border border-ink-black/20 bg-white text-xs font-bold rounded-xs ${key ? 'cursor-pointer hover:border-ink-black' : 'opacity-40 cursor-not-allowed'}">키 지우기</button>
      </div>
    </div>`;
  }).join('');
}

function handleAddSampleData() {
  if (hasSampleData() && !confirm('이미 예시 데이터가 있어요. 지우고 새로 넣을까요?')) return;
  const showInShop = !!(document.getElementById('sample-show-in-shop') || {}).checked;
  const r = addSampleData({ showInShop });
  refreshAllAdminViews();
  alert(`예시 데이터를 넣었어요.\n상품 ${r.products}개(${r.showInShop ? '쇼핑몰에도 보임' : '관리자에서만 보임'}) · 주문 ${r.orders}건 · 지출 ${r.expenses}건 · 상담 ${r.inquiries}건 · 후기 ${r.reviews}건`);
}

function handleRemoveSampleData() {
  if (!hasSampleData()) { alert('지울 예시 데이터가 없어요.'); return; }
  if (!confirm('[예시]가 붙은 상품·주문·지출·상담·후기를 모두 지울까요?\n실제 데이터는 그대로 남아요.')) return;
  removeSampleData();
  refreshAllAdminViews();
}

function handleDownloadBackup() {
  const n = downloadBackup();
  document.getElementById('backup-message').innerText = `백업 파일을 내려받았어요 (${n}개 항목).`;
}

function handleRestoreBackup(input) {
  const file = input.files && input.files[0];
  const msg = document.getElementById('backup-message');
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = parseBackupText(String(reader.result || ''));
    input.value = '';
    if (!result.ok) { msg.innerText = result.error; msg.className = 'text-xs text-seal-red font-bold'; return; }
    const when = result.parsed.createdAt ? new Date(result.parsed.createdAt).toLocaleString('ko-KR') : '알 수 없음';
    if (!confirm(`${when}에 만든 백업으로 되돌릴까요?\n지금 있는 상품·주문·지출·설정이 백업 내용으로 바뀌어요.\n(혹시 모르니 먼저 [백업 파일 내려받기]로 지금 상태를 저장해 두세요.)`)) return;
    applyBackup(result.parsed, result.keys);
    msg.innerText = `복원했어요 (${result.keys.length}개 항목). 화면을 새로 고칩니다.`;
    msg.className = 'text-xs text-emerald-700 font-bold';
    setTimeout(() => location.reload(), 600);
  };
  reader.readAsText(file);
}

function setIntegrationMessage(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = text;
  el.className = `text-xs font-bold ${ok ? 'text-emerald-700' : 'text-seal-red'}`;
}

function saveDiscordSettings(e) {
  if (e) e.preventDefault();
  const orderUrl = document.getElementById('discord-webhook-order').value.trim();
  const inquiryUrl = document.getElementById('discord-webhook-inquiry').value.trim();
  for (const [label, url] of [['주문 채널', orderUrl], ['상담 채널', inquiryUrl]]) {
    if (url && !isValidDiscordWebhook(url)) {
      setIntegrationMessage('discord-message', `${label} 주소가 디스코드 웹후크가 아니에요. https://discord.com/api/webhooks/ 로 시작하는 주소를 넣어 주세요.`, false);
      return false;
    }
  }
  saveIntegrations({
    orderWebhook: orderUrl,
    inquiryWebhook: inquiryUrl,
    notifyOrders: document.getElementById('discord-notify-orders').checked,
    notifyInquiries: document.getElementById('discord-notify-inquiries').checked
  });
  setIntegrationMessage('discord-message', orderUrl || inquiryUrl ? '저장했어요.' : '웹후크 주소를 비워서 알림을 껐어요.', true);
  return true;
}

async function testDiscord(channel) {
  if (!saveDiscordSettings()) return;
  const url = getWebhookFor(channel);
  if (!url) { setIntegrationMessage('discord-message', '먼저 웹후크 주소를 넣어 주세요.', false); return; }
  setIntegrationMessage('discord-message', '보내는 중…', true);
  const label = channel === 'inquiry' ? '상담' : '주문';
  const r = await sendDiscord({ embeds: [{ title: `✅ ${label} 채널 연결 테스트`, description: `설담화 관리자 센터와 연결됐어요. 앞으로 ${label} 알림이 이 채널로 와요.`, color: channel === 'inquiry' ? DISCORD_COLORS.inquiry : DISCORD_COLORS.order }] }, url);
  setIntegrationMessage('discord-message', r.ok ? '테스트 메시지를 보냈어요. 디스코드 채널을 확인해 보세요.' : `보내지 못했어요 (${r.status || r.reason}). 주소가 맞는지 확인해 주세요.`, r.ok);
}

async function sendProductionList() {
  if (!saveDiscordSettings()) return;
  if (!getWebhookFor('order')) { setIntegrationMessage('discord-message', '먼저 주문 채널 웹후크 주소를 넣어 주세요.', false); return; }
  const date = document.getElementById('production-date').value;
  if (!date) { setIntegrationMessage('discord-message', '날짜를 골라 주세요.', false); return; }
  const payload = buildProductionMessage(loadOrders(), date);
  setIntegrationMessage('discord-message', '보내는 중…', true);
  const r = await sendDiscord(payload, getWebhookFor('order'));
  setIntegrationMessage('discord-message', r.ok ? `${date} 제작 목록을 디스코드로 보냈어요.` : `보내지 못했어요 (${r.status || r.reason}).`, r.ok);
}

function saveAiForm(e) {
  e.preventDefault();
  const ai = loadAiSettings();
  const checked = document.querySelector('input[name="ai-provider"]:checked');
  for (const [id, p] of Object.entries(AI_PROVIDERS)) {
    const newKey = document.getElementById(`ai-key-${id}`).value.trim();
    if (newKey && !p.keyPattern.test(newKey)) {
      setIntegrationMessage('ai-message', `${p.label} 키는 보통 ${p.keyHint} 로 시작해요. 다시 확인해 주세요.`, false);
      return;
    }
    if (newKey) ai.keys[id] = newKey;
    ai.models[id] = document.getElementById(`ai-model-${id}`).value.trim();
  }
  ai.provider = checked ? checked.value : ai.provider;
  storeAiSettings(ai);
  const hasKey = !!ai.keys[ai.provider];
  setIntegrationMessage('ai-message', hasKey ? `저장했어요. 기본 AI: ${AI_PROVIDERS[ai.provider].label}` : `저장했어요. 다만 기본 AI(${AI_PROVIDERS[ai.provider].label})의 키가 아직 없어요.`, hasKey);
  renderAiRows();
}

function clearAiProviderKey(id) {
  const ai = loadAiSettings();
  if (!ai.keys[id]) return;
  if (!confirm(`저장된 ${AI_PROVIDERS[id].label} 키를 지울까요?`)) return;
  ai.keys[id] = '';
  storeAiSettings(ai);
  setIntegrationMessage('ai-message', `${AI_PROVIDERS[id].label} 키를 지웠어요.`, true);
  renderAiRows();
}

// AI 버튼 옆 '어떤 AI로' 고르기 (키가 있는 AI만)
function aiProviderOptionsHtml() {
  const ai = loadAiSettings();
  return Object.entries(AI_PROVIDERS).map(([id, p]) => `<option value="${id}" ${id === ai.provider ? 'selected' : ''} ${ai.keys[id] ? '' : 'disabled'}>${p.label}${ai.keys[id] ? '' : ' (키 없음)'}</option>`).join('');
}

// 상품 등록 창: AI 문구 초안
async function aiDraftProductCopy(btn) {
  const name = document.getElementById('edit-prod-name').value.trim();
  if (!name) { alert('상품명을 먼저 적어 주세요.'); return; }
  const catSel = document.getElementById('edit-prod-cat');
  const original = btn.innerText;
  btn.disabled = true;
  btn.innerText = '쓰는 중…';
  try {
    const draft = await draftProductCopy({
      name,
      category: catSel ? catSel.options[catSel.selectedIndex].text : '',
      meaningHint: document.getElementById('edit-prod-meaning').value.trim(),
      priceText: document.getElementById('edit-prod-price').value ? `${Number(document.getElementById('edit-prod-price').value).toLocaleString()}원` : ''
    }, (document.getElementById('ai-provider-product') || {}).value || undefined);
    const filled = [];
    const fill = (id, value, label) => {
      const el = document.getElementById(id);
      if (!el || !value) return;
      if (el.value.trim() && !confirm(`${label}에 이미 적힌 내용이 있어요. AI 초안으로 바꿀까요?\n\n${value}`)) return;
      el.value = value;
      filled.push(label);
    };
    fill('edit-prod-poetic', draft.poeticLine, '한 줄 글귀');
    fill('edit-prod-meaning', draft.flowerMeaning, '꽃말');
    fill('edit-prod-desc', draft.description, '상품 설명');
    if (filled.length) alert(`${draft.providerLabel}가 쓴 초안을 채웠어요: ${filled.join(', ')}\n저장 전에 꼭 읽고 고쳐 주세요.`);
  } catch (err) {
    alert(aiErrorMessage(err));
  } finally {
    btn.disabled = false;
    btn.innerText = original;
  }
}

/* ---------- 원본 사진 및 Supabase Storage 관리 ---------- */

let originalsLoading = false;

async function renderOriginalsSection() {
  const isServer = !!window.SDH_SERVER_MODE;
  const staticHint = document.getElementById('originals-static-hint');
  const serverContent = document.getElementById('originals-server-content');
  if (!isServer) {
    if (staticHint) staticHint.classList.remove('hidden');
    if (serverContent) serverContent.classList.add('hidden');
    return;
  }
  if (staticHint) staticHint.classList.add('hidden');
  if (serverContent) serverContent.classList.remove('hidden');

  if (originalsLoading) return;
  originalsLoading = true;

  try {
    // 1. 세션 정보 조회 (로컬 여부 확인)
    const sessionRes = await fetch('/api/session').then(r => r.json()).catch(() => ({}));
    const isLocal = !!(sessionRes && sessionRes.local);
    const localConfig = document.getElementById('supabase-local-config');
    const remoteNotice = document.getElementById('supabase-remote-notice');
    if (localConfig) localConfig.classList.toggle('hidden', !isLocal);
    if (remoteNotice) remoteNotice.classList.toggle('hidden', isLocal);

    // 2. Supabase 설정 조회
    const cfgRes = await fetch('/api/supabase-config').then(r => r.json()).catch(() => ({}));
    const cfg = (cfgRes && cfgRes.ok) ? cfgRes : { configured: false, url: '', bucket: 'originals' };
    const statusBadge = document.getElementById('originals-supabase-status');
    if (statusBadge) {
      if (cfg.configured) {
        statusBadge.textContent = `연결됨 (${cfg.url})`;
        statusBadge.className = 'text-xs px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800';
      } else {
        statusBadge.textContent = '연결 안 됨';
        statusBadge.className = 'text-xs px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-700';
      }
    }
    const urlInput = document.getElementById('supabase-url-input');
    const bucketInput = document.getElementById('supabase-bucket-input');
    if (urlInput && document.activeElement !== urlInput) urlInput.value = cfg.url || '';
    if (bucketInput && document.activeElement !== bucketInput) bucketInput.value = cfg.bucket || 'originals';

    // 3. 원본 사진 목록 조회
    const origRes = await fetch('/api/originals').then(r => r.json()).catch(() => ({}));
    const items = (origRes && origRes.ok && Array.isArray(origRes.items)) ? origRes.items : [];

    const totalCount = items.length;
    const pendingCount = items.filter(x => !x.uploadedToSupabase).length;
    const totalBytes = items.reduce((acc, x) => acc + (x.size || 0), 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

    const elTotal = document.getElementById('originals-total-count');
    const elPending = document.getElementById('originals-pending-count');
    const elSize = document.getElementById('originals-total-size');
    if (elTotal) elTotal.textContent = String(totalCount);
    if (elPending) elPending.textContent = String(pendingCount);
    if (elSize) elSize.textContent = String(totalMb);

    // 대기 원본 올리기 버튼 제어
    const btnUpload = document.getElementById('btn-upload-pending-originals');
    const uploadStatusText = document.getElementById('originals-upload-status-text');
    if (btnUpload && uploadStatusText) {
      if (!cfg.configured) {
        btnUpload.disabled = true;
        uploadStatusText.textContent = 'Supabase 연결 설정이 필요해요.';
      } else if (pendingCount === 0) {
        btnUpload.disabled = true;
        uploadStatusText.textContent = '모든 원본이 클라우드에 백업되어 있어요.';
      } else {
        btnUpload.disabled = false;
        uploadStatusText.textContent = `${pendingCount}장의 원본이 대기 중이에요.`;
      }
    }

    // 4. 원본 사진 목록 렌더링 (createElement)
    const listContainer = document.getElementById('originals-list-container');
    const emptyMsg = document.getElementById('originals-empty-msg');
    if (listContainer) {
      listContainer.innerHTML = '';
      if (emptyMsg) emptyMsg.classList.toggle('hidden', items.length > 0);

      items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap items-center justify-between p-3 bg-white border border-ink-black/10 rounded-xs text-xs gap-2';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-2.5 min-w-0';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-bold text-ink-black truncate max-w-[200px] sm:max-w-[320px]';
        nameSpan.textContent = it.filename || it.name || it.path || '사진';
        infoDiv.appendChild(nameSpan);

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'text-ink-gray';
        const sz = it.size ? (it.size > 1024 * 1024 ? `${(it.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(it.size / 1024)} KB`) : '';
        sizeSpan.textContent = sz;
        infoDiv.appendChild(sizeSpan);

        if (it.createdAt) {
          const dateSpan = document.createElement('span');
          dateSpan.className = 'text-ink-light hidden sm:inline';
          dateSpan.textContent = it.createdAt.replace('T', ' ');
          infoDiv.appendChild(dateSpan);
        }

        row.appendChild(infoDiv);

        const actionDiv = document.createElement('div');
        actionDiv.className = 'flex items-center gap-3 shrink-0';

        const badge = document.createElement('span');
        if (it.uploadedToSupabase) {
          badge.className = 'px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800';
          badge.textContent = '클라우드 백업됨';
        } else {
          badge.className = 'px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800';
          badge.textContent = '대기 중';
        }
        actionDiv.appendChild(badge);

        if (it.path) {
          const link = document.createElement('a');
          link.href = `/api/originals/${it.path}`;
          link.target = '_blank';
          link.rel = 'noopener';
          link.className = 'text-seal-red hover:underline font-bold';
          link.textContent = '원본 보기';
          actionDiv.appendChild(link);
        }

        row.appendChild(actionDiv);
        listContainer.appendChild(row);
      });
    }
  } catch (err) {
    console.error('renderOriginalsSection error:', err);
  } finally {
    originalsLoading = false;
  }
}

async function saveSupabaseConfig(e) {
  if (e) e.preventDefault();
  const urlInput = document.getElementById('supabase-url-input');
  const keyInput = document.getElementById('supabase-key-input');
  const bucketInput = document.getElementById('supabase-bucket-input');
  const msgEl = document.getElementById('supabase-config-msg');
  if (!urlInput || !msgEl) return;

  const url = urlInput.value.trim();
  const serviceKey = keyInput ? keyInput.value.trim() : '';
  const bucket = bucketInput ? bucketInput.value.trim() : 'originals';

  msgEl.textContent = '저장 중…';
  msgEl.className = 'text-xs text-ink-gray';

  try {
    const res = await fetch('/api/supabase-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, serviceKey, bucket })
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      if (keyInput) keyInput.value = ''; // 키 입력창 비움 (보안)
      msgEl.textContent = '설정을 저장했어요.';
      msgEl.className = 'text-xs text-emerald-700 font-bold';
      await renderOriginalsSection();
    } else {
      msgEl.textContent = data.error || '저장하지 못했어요.';
      msgEl.className = 'text-xs text-seal-red font-bold';
    }
  } catch (err) {
    msgEl.textContent = '서버 통신에 실패했어요.';
    msgEl.className = 'text-xs text-seal-red font-bold';
  }
}

async function handleUploadPendingOriginals() {
  const btn = document.getElementById('btn-upload-pending-originals');
  const progress = document.getElementById('originals-upload-progress');
  const statusText = document.getElementById('originals-upload-status-text');
  if (!btn) return;

  btn.disabled = true;
  if (progress) progress.textContent = '올리는 중…';

  try {
    const res = await fetch('/api/supabase-upload-pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      if (statusText) {
        statusText.textContent = `${data.uploaded}장 올림` + (data.failed > 0 ? `, ${data.failed}장 실패` : '');
      }
    } else {
      if (statusText) statusText.textContent = data.error || '업로드 실패';
    }
  } catch (err) {
    if (statusText) statusText.textContent = '업로드 중 오류 발생';
  } finally {
    if (progress) progress.textContent = '';
    await renderOriginalsSection();
  }
}
