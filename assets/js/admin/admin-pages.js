// assets/js/admin/admin-pages.js
// 설담화 관리자: 사업자 정보·안내 페이지·배송비·재입고 알림
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 10. 사업자 정보·안내 페이지
let currentEditPageId = 'bojagi';

function renderPagesAdmin() {
  const s = loadSettings();
  const b = s.business || {};
  const setVal = (id, v) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = v || ''; };
  setVal('biz-company', b.companyName);
  setVal('biz-ceo', b.ceo);
  setVal('biz-privacy-officer', b.privacyOfficer);
  setVal('biz-number', b.bizNumber);
  setVal('biz-mailorder', b.mailOrderNumber);
  setVal('biz-address', b.bizAddress);

  const pages = loadPages();
  const groupLabel = { guide: '정성 안내', legal: '약관·법적 안내' };
  let html = '';
  let lastGroup = '';
  PAGE_ORDER.forEach(id => {
    const pg = pages[id];
    if (pg.group !== lastGroup) {
      html += `<p class="px-2 pt-2 pb-1 text-[11px] font-bold text-ink-gray">${groupLabel[pg.group]}</p>`;
      lastGroup = pg.group;
    }
    const active = id === currentEditPageId;
    html += `<button type="button" onclick="selectPageForEdit('${id}')" class="w-full text-left px-3 py-2 rounded-xs text-sm font-bold flex items-center justify-between ${active ? 'bg-ink-black text-hanji' : 'hover:bg-[#EFECE6] text-ink-black'}">
      <span>${escapeHtml(pg.title)}</span>${pg.edited ? `<span class="text-[10px] ${active ? 'text-amber-300' : 'text-emerald-700'}">수정됨</span>` : ''}
    </button>`;
  });
  document.getElementById('page-list').innerHTML = html;
  fillPageEditor(currentEditPageId);
}

function fillPageEditor(id) {
  const pg = loadPages()[id];
  document.getElementById('page-edit-id').value = id;
  document.getElementById('page-edit-title').value = pg.title;
  document.getElementById('page-edit-body').value = pg.body;
  const badge = document.getElementById('page-edit-badge');
  badge.innerText = pg.edited ? '직접 고친 문구' : '처음 문구 (초안)';
  badge.className = `text-xs px-2 py-0.5 rounded font-bold ${pg.edited ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`;
  document.getElementById('page-legal-note').classList.toggle('hidden', pg.group !== 'legal');
  editPageMedia = pg.group === 'guide' ? { ...pg.media, images: pg.media.images.slice() } : null;
  document.getElementById('page-media-editor').classList.toggle('hidden', !editPageMedia);
  if (editPageMedia) {
    document.querySelectorAll('input[name="page-media-ratio"]').forEach(r => { r.checked = r.value === editPageMedia.ratio; });
    document.getElementById('page-media-video').value = editPageMedia.video;
  }
  renderPageMediaEditor();
  document.getElementById('page-message').innerText = '';
  updatePagePreview();
}

/* ---------- 정성 안내 사진·영상 ---------- */
let editPageMedia = null;

function renderPageMediaEditor() {
  const list = document.getElementById('page-media-list');
  const preview = document.getElementById('page-media-preview');
  if (!list || !preview) return;
  list.innerHTML = '';
  if (!editPageMedia) { renderPageMediaInto(preview, null); preview.classList.add('hidden'); return; }
  const aspect = editPageMedia.ratio === '1:1' ? 'aspect-square' : 'aspect-[4/3]';
  editPageMedia.images.forEach((src, i) => {
    const tile = document.createElement('div');
    tile.className = 'w-28 shrink-0 space-y-1';
    tile.innerHTML = `<div class="${aspect} w-full overflow-hidden rounded-xs bg-[#ECE8E1] border border-ink-black/10"><img src="${escapeHtml(src)}" alt="사진 ${i + 1}" class="w-full h-full object-cover"></div>`;
    const tools = document.createElement('div');
    tools.className = 'flex justify-between';
    [['◀', '앞으로', -1, i === 0], ['▶', '뒤로', 1, i === editPageMedia.images.length - 1]].forEach(([txt, label, d, dis]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = txt;
      b.disabled = dis;
      b.setAttribute('aria-label', `${i + 1}번 사진 ${label}`);
      b.className = 'w-7 py-0.5 border border-ink-black/15 bg-white rounded-xs font-bold disabled:opacity-30 cursor-pointer';
      b.onclick = () => { const [x] = editPageMedia.images.splice(i, 1); editPageMedia.images.splice(i + d, 0, x); renderPageMediaEditor(); };
      tools.appendChild(b);
    });
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '✕';
    del.setAttribute('aria-label', `${i + 1}번 사진 빼기`);
    del.className = 'w-7 py-0.5 border border-ink-black/15 bg-white rounded-xs font-bold hover:text-red-700 cursor-pointer';
    del.onclick = () => { editPageMedia.images.splice(i, 1); renderPageMediaEditor(); };
    tools.appendChild(del);
    tile.appendChild(tools);
    list.appendChild(tile);
  });
  const add = document.createElement('button');
  add.type = 'button';
  add.className = `w-28 ${aspect} shrink-0 border-2 border-dashed border-ink-black/20 rounded-xs text-ink-gray font-bold hover:border-seal-red hover:text-seal-red cursor-pointer`;
  add.textContent = '+ 사진 추가';
  add.onclick = () => openImagePicker(src => { editPageMedia.images.push(src); renderPageMediaEditor(); });
  list.appendChild(add);
  renderPageMediaInto(preview, editPageMedia);
}

function setPageMediaRatio(v) {
  if (!editPageMedia) return;
  editPageMedia.ratio = v === '1:1' ? '1:1' : '4:3';
  renderPageMediaEditor();
}

function setPageMediaVideo(v) {
  if (!editPageMedia) return;
  editPageMedia.video = v.trim();
  renderPageMediaEditor();
}

function selectPageForEdit(id) {
  currentEditPageId = id;
  renderPagesAdmin();
}

function updatePagePreview() {
  document.getElementById('page-preview').innerHTML = renderPageBody(document.getElementById('page-edit-body').value);
}

function savePageEditor(e) {
  e.preventDefault();
  const id = document.getElementById('page-edit-id').value;
  savePage(id, document.getElementById('page-edit-title').value.trim(), document.getElementById('page-edit-body').value, editPageMedia || undefined);
  renderPagesAdmin();
  setIntegrationMessage('page-message', '저장했어요. 쇼핑몰에 바로 반영돼요.', true);
}

function resetPageEditor() {
  const id = document.getElementById('page-edit-id').value;
  if (!confirm('이 페이지를 처음 문구로 되돌릴까요? 직접 고친 내용은 사라져요.')) return;
  resetPage(id);
  renderPagesAdmin();
  setIntegrationMessage('page-message', '처음 문구로 되돌렸어요.', true);
}

function saveBusinessInfo(e) {
  e.preventDefault();
  const val = id => document.getElementById(id).value.trim();
  const bizNumber = val('biz-number');
  if (bizNumber && !/^\d{3}-?\d{2}-?\d{5}$/.test(bizNumber)) {
    setIntegrationMessage('business-message', '사업자등록번호는 숫자 10자리예요 (예: 123-45-67890).', false);
    return;
  }
  const s = loadSettings();
  const digits = bizNumber.replace(/-/g, '');
  saveSettings({
    ...s,
    business: {
      companyName: val('biz-company') || '설담화',
      ceo: val('biz-ceo'),
      privacyOfficer: val('biz-privacy-officer'),
      bizNumber: digits ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` : '',
      mailOrderNumber: val('biz-mailorder'),
      bizAddress: val('biz-address')
    }
  });
  renderPagesAdmin();
  setIntegrationMessage('business-message', '저장했어요.', true);
}

function refreshAiProviderSelects() {
  document.querySelectorAll('.ai-provider-select').forEach(sel => { sel.innerHTML = aiProviderOptionsHtml(); });
}

function updateProductImagePreview() {
  refreshAiProviderSelects();
  const v = document.getElementById('edit-prod-image').value.trim();
  const img = document.getElementById('edit-prod-image-preview');
  if (img) img.src = v && !v.endsWith('/') ? v : '';
}

// 사이트 색 (쇼핑몰에만 적용)
function themeFormValue() {
  return { accent: document.getElementById('theme-accent').value, soft: document.getElementById('theme-soft').value };
}

function matchThemePreset(v) {
  return Object.keys(THEME_PRESETS).find(k => THEME_PRESETS[k].accent.toLowerCase() === v.accent.toLowerCase() && THEME_PRESETS[k].soft.toLowerCase() === v.soft.toLowerCase()) || 'custom';
}

function updateThemePreview() {
  const v = themeFormValue();
  const tab = document.getElementById('theme-preview-tab');
  const btn = document.getElementById('theme-preview-btn');
  const soft = document.getElementById('theme-preview-soft');
  tab.style.color = v.accent;
  tab.style.borderColor = v.accent;
  btn.style.backgroundColor = v.accent;
  soft.style.backgroundColor = v.soft;
  soft.style.color = v.accent;
  const warnings = [];
  if (themeContrast(v.accent, '#FFFFFF') < 4.5) warnings.push('대표색이 밝아서 버튼의 흰 글자가 잘 안 보일 수 있어요.');
  if (themeContrast(v.accent, v.soft) < 3) warnings.push('대표색과 보조색이 비슷해서 글자가 잘 안 보일 수 있어요.');
  const warn = document.getElementById('theme-warning');
  warn.textContent = warnings.join(' ');
  warn.classList.toggle('hidden', !warnings.length);
  const cur = matchThemePreset(v);
  document.querySelectorAll('#theme-presets button').forEach(b => {
    const on = b.dataset.preset === cur;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('border-ink-black', on);
    b.classList.toggle('border-ink-black/15', !on);
  });
}

function pickThemePreset(key) {
  const p = THEME_PRESETS[key];
  if (!p) return;
  document.getElementById('theme-accent').value = p.accent;
  document.getElementById('theme-soft').value = p.soft;
  setIntegrationMessage('theme-message', '', true);
  updateThemePreview();
}

function onThemeColorInput() {
  setIntegrationMessage('theme-message', '', true);
  updateThemePreview();
}

function renderThemeSettings() {
  const box = document.getElementById('theme-presets');
  if (!box) return;
  const t = normalizeSiteTheme(loadSettings().theme);
  box.innerHTML = '';
  Object.keys(THEME_PRESETS).forEach(key => {
    const p = THEME_PRESETS[key];
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.preset = key;
    b.className = 'flex items-center gap-2 px-3 py-2 bg-white border border-ink-black/15 rounded-xs text-xs font-bold cursor-pointer hover:border-ink-black';
    b.onclick = () => pickThemePreset(key);
    const dot = document.createElement('span');
    dot.className = 'w-5 h-5 rounded-full border border-ink-black/10';
    dot.style.backgroundColor = p.accent;
    const dot2 = document.createElement('span');
    dot2.className = 'w-5 h-5 -ml-3.5 rounded-full border border-ink-black/10';
    dot2.style.backgroundColor = p.soft;
    const label = document.createElement('span');
    label.textContent = p.label;
    b.append(dot, dot2, label);
    box.appendChild(b);
  });
  document.getElementById('theme-accent').value = t.accent;
  document.getElementById('theme-soft').value = t.soft;
  updateThemePreview();
}

function saveThemeSettings(e) {
  e.preventDefault();
  const v = themeFormValue();
  saveSettings({ theme: { preset: matchThemePreset(v), accent: v.accent, soft: v.soft } });
  setIntegrationMessage('theme-message', '저장했어요. 쇼핑몰을 새로 고치면 바뀐 색이 보여요.', true);
}

function resetThemeSettings() {
  const p = THEME_PRESETS.current;
  saveSettings({ theme: { preset: 'current', accent: p.accent, soft: p.soft } });
  renderThemeSettings();
  setIntegrationMessage('theme-message', '처음 색으로 되돌렸어요.', true);
}

// 배송 방법·배송비
let adminDateLimits = [];

function renderDateLimitsList() {
  const box = document.getElementById('date-limits-list');
  if (!box) return;
  box.innerHTML = '';
  if (!adminDateLimits || adminDateLimits.length === 0) {
    box.innerHTML = '<p class="p-3 text-ink-light text-center">등록된 특정일 상한이 없습니다.</p>';
    return;
  }
  adminDateLimits.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  adminDateLimits.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 hover:bg-black/[0.02]';
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="font-mono font-bold text-ink-black">${typeof escapeHtml === 'function' ? escapeHtml(item.date) : item.date}</span>
        <span class="text-ink-gray">최대 <strong class="text-seal-red">${item.limit}건</strong></span>
      </div>
      <button type="button" onclick="removeDateLimit(${idx})" class="text-ink-light hover:text-seal-red text-xs px-2 py-0.5 rounded font-bold cursor-pointer">삭제</button>
    `;
    box.appendChild(row);
  });
}

function addDateLimit() {
  const dateEl = document.getElementById('new-limit-date');
  const countEl = document.getElementById('new-limit-count');
  if (!dateEl || !dateEl.value) {
    alert('상한을 설정할 날짜를 선택해 주세요.');
    return;
  }
  const count = parseInt(countEl.value, 10);
  if (!count || count < 1) {
    alert('상한 건수는 1 이상의 숫자를 입력해 주세요.');
    return;
  }
  const date = dateEl.value;
  const existingIdx = adminDateLimits.findIndex(x => x.date === date);
  if (existingIdx !== -1) {
    adminDateLimits[existingIdx].limit = count;
  } else {
    adminDateLimits.push({ date, limit: count });
  }
  dateEl.value = '';
  countEl.value = '';
  renderDateLimitsList();
}

function removeDateLimit(idx) {
  if (idx >= 0 && idx < adminDateLimits.length) {
    adminDateLimits.splice(idx, 1);
    renderDateLimitsList();
  }
}

function renderDeliverySettings() {
  renderThemeSettings();
  const d = loadSettings().delivery;
  if (!d || !document.getElementById('dlv-quick-on')) return;
  ['quick', 'parcel', 'pickup'].forEach(k => {
    document.getElementById(`dlv-${k}-on`).checked = !!d[k].enabled;
    const fee = document.getElementById(`dlv-${k}-fee`);
    if (fee) fee.value = d[k].fee;
    document.getElementById(`dlv-${k}-area`).value = d[k].area || '';
  });
  document.getElementById('dlv-quick-sameday').value = (d.quick && d.quick.sameDayUntil) || '';
  document.getElementById('dlv-free-over').value = d.freeOver;
  document.getElementById('dlv-note').value = d.note || '';
  const dailyEl = document.getElementById('dlv-daily-limit');
  if (dailyEl) dailyEl.value = d.dailyLimit || 0;
  adminDateLimits = JSON.parse(JSON.stringify(d.dateLimits || []));
  renderDateLimitsList();
}

function saveDeliverySettings(e) {
  e.preventDefault();
  const on = k => document.getElementById(`dlv-${k}-on`).checked;
  if (!on('quick') && !on('parcel') && !on('pickup')) {
    setIntegrationMessage('delivery-message', '배송 방법을 하나 이상 켜 주세요.', false);
    return;
  }
  const s = loadSettings();
  if (on('pickup') && !s.showLocation && !confirm('매장 위치(오시는 길)가 아직 비공개예요. 그래도 매장 픽업을 켤까요?')) return;
  const num = id => Math.max(0, Math.round(Number(document.getElementById(id).value) || 0));
  const val = id => document.getElementById(id).value.trim();
  saveSettings({
    ...s,
    delivery: {
      quick: { enabled: on('quick'), fee: num('dlv-quick-fee'), area: val('dlv-quick-area'), sameDayUntil: val('dlv-quick-sameday') },
      parcel: { enabled: on('parcel'), fee: num('dlv-parcel-fee'), area: val('dlv-parcel-area') },
      pickup: { enabled: on('pickup'), fee: 0, area: val('dlv-pickup-area') },
      freeOver: num('dlv-free-over'),
      note: val('dlv-note'),
      dailyLimit: num('dlv-daily-limit'),
      dateLimits: adminDateLimits
    }
  });
  setIntegrationMessage('delivery-message', '저장했어요. 쇼핑몰 주문서에 바로 반영돼요.', true);
}

// 재입고 알림 신청 목록 (상품별로 묶어 보기)
function renderRestockList() {
  const box = document.getElementById('admin-restock-list');
  if (!box) return;
  const list = loadRestock();
  const waiting = list.filter(r => r.status === 'waiting');
  const badge = document.getElementById('restock-counter-badge');
  if (badge) badge.innerText = `${waiting.length}명 대기`;
  if (list.length === 0) {
    box.innerHTML = '<div class="p-6 text-center text-sm text-ink-gray bg-[#FAF7F2] border border-ink-black/10 rounded-sm">아직 신청이 없어요.</div>';
    return;
  }
  const products = loadProducts();
  const groups = {};
  list.forEach(r => { (groups[r.productId] = groups[r.productId] || []).push(r); });
  const s = loadSettings();
  box.innerHTML = Object.entries(groups).map(([pid, rs]) => {
    const prod = products.find(p => p.id === pid);
    const stock = prod && typeof prod.stockQuantity === 'number' ? prod.stockQuantity : null;
    const w = rs.filter(r => r.status === 'waiting');
    const name = (prod && prod.name) || rs[0].productName;
    const smsBody = `[설담화] 기다리시던 '${name}'이(가) 다시 들어왔어요. 쇼핑몰에서 주문하실 수 있어요. 문의 ${s.phone || ''}`;
    const phones = w.map(r => normalizePhone(r.phone)).join(',');
    return `<div class="admin-card rounded-sm p-4 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-bold text-ink-black">${escapeHtml(name)}</span>
        ${stock === null ? '' : stock > 0 ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">재고 ${stock}개 · 알릴 수 있어요</span>` : '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">아직 품절</span>'}
        <span class="text-xs text-ink-gray">대기 ${w.length}명</span>
        ${w.length ? `<a href="sms:${escapeHtml(phones)}?body=${encodeURIComponent(smsBody)}" class="ml-auto px-3 py-1.5 text-xs font-bold rounded-xs bg-ink-black text-white hover:bg-seal-red">대기 ${w.length}명에게 문자로 알리기</a>
          <button type="button" onclick="markRestockNotified('${escapeHtml(pid)}')" class="px-3 py-1.5 text-xs font-bold rounded-xs border border-ink-black/20 bg-white cursor-pointer hover:border-ink-black">모두 알림 완료</button>` : ''}
      </div>
      <table class="w-full text-left text-sm">
        <tbody class="divide-y divide-ink-black/5">${rs.map(r => `
          <tr class="${r.status === 'waiting' ? '' : 'opacity-50'}">
            <td class="py-1.5 pr-2">${escapeHtml(r.name || '-')}</td>
            <td class="py-1.5 pr-2"><a href="tel:${escapeHtml(normalizePhone(r.phone))}" class="underline">${escapeHtml(r.phone)}</a></td>
            <td class="py-1.5 pr-2 text-xs text-ink-gray">${escapeHtml(r.createdDate || '')} 신청</td>
            <td class="py-1.5 text-right text-xs">${r.status === 'waiting'
              ? `<button type="button" onclick="markRestockNotified('${escapeHtml(pid)}', '${escapeHtml(r.id)}')" class="underline text-ink-gray cursor-pointer">알림 완료</button>`
              : '<span class="font-bold text-emerald-700">알림 완료</span>'}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }).join('');
}

function markRestockNotified(productId, requestId) {
  saveRestock(loadRestock().map(r => (r.productId === productId && (!requestId || r.id === requestId) && r.status === 'waiting') ? { ...r, status: 'notified' } : r));
  renderRestockList();
  renderProductsTable();
}

function clearNotifiedRestock() {
  const done = loadRestock().filter(r => r.status !== 'waiting').length;
  if (!done) { alert('지울 신청이 없어요. 알림 완료로 바꾼 신청만 지워져요.'); return; }
  if (!confirm(`알림 완료된 신청 ${done}건의 연락처를 지울까요? (안내가 끝난 연락처는 지우는 게 안전해요)`)) return;
  saveRestock(loadRestock().filter(r => r.status === 'waiting'));
  renderRestockList();
}
