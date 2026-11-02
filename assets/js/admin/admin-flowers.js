// assets/js/admin/admin-flowers.js
// 설담화 관리자: 꽃 사전 관리 + 상품 수정 창의 '사용한 꽃' 고르기 + 상품 사진 여러 장(순서·대표 사진)
// 꽃 데이터·제철 계산은 assets/js/flowers-data.js, 상품 저장은 admin-product-modal.js의 doSaveProduct()

/* ---------- 꽃 사전 목록 (상품 및 한 줄 글귀 관리 아래) ---------- */
function renderFlowerDictionary() {
  const tbody = document.getElementById('admin-flowers-table');
  if (!tbody) return;
  const flowers = loadFlowers();
  const products = loadProducts();
  const month = currentKoreaMonth();
  const q = (document.getElementById('flower-search') || {}).value || '';
  const count = document.getElementById('flower-count');
  if (count) count.textContent = `${flowers.length}종 · 지금(${month}월) 제철 ${flowers.filter(f => isFlowerInSeason(f, month)).length}종`;
  const badge = document.getElementById('badge-flower-count');
  if (badge) badge.textContent = flowers.length;
  tbody.innerHTML = '';
  flowers
    .filter(f => !q.trim() || [f.name, f.nameEn, f.meaning, f.colors].join(' ').toLowerCase().includes(q.trim().toLowerCase()))
    .forEach(f => {
      const used = products.filter(p => productFlowerIds(p).includes(f.id)).length;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#FAF7F2]';
      const cells = [
        `<span class="font-bold text-ink-black">${escapeHtml(f.name)}</span> <span class="text-ink-gray">${escapeHtml(f.nameEn || '')}</span>`,
        escapeHtml(f.meaning || ''),
        `${escapeHtml(formatFlowerSeason(f))}${isFlowerInSeason(f, month) ? ' <span class="ml-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs">지금 제철</span>' : ''}`,
        escapeHtml(f.colors || ''),
        used ? `${used}개` : '<span class="text-ink-light">-</span>'
      ];
      tr.innerHTML = cells.map(c => `<td class="py-2.5 px-4">${c}</td>`).join('') +
        `<td class="py-2.5 px-4 text-center whitespace-nowrap space-x-1">
          <button type="button" onclick="openFlowerModal('${escapeHtml(f.id)}')" class="px-2.5 py-1 border border-ink-black/20 bg-white hover:border-seal-red hover:text-seal-red rounded-xs font-bold cursor-pointer">수정</button>
          <button type="button" onclick="deleteFlower('${escapeHtml(f.id)}')" class="px-2.5 py-1 border border-ink-black/20 bg-white hover:border-red-700 hover:text-red-700 rounded-xs font-bold cursor-pointer">삭제</button>
        </td>`;
      tbody.appendChild(tr);
    });
}

/* ---------- 꽃 추가·수정 창 ---------- */
function renderFlowerMonthButtons(selected) {
  const box = document.getElementById('flower-months');
  if (!box) return;
  box.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const label = document.createElement('label');
    label.className = 'inline-flex items-center gap-1 px-2 py-1 border border-ink-black/15 rounded-xs bg-white cursor-pointer has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-400 has-[:checked]:text-emerald-900 font-bold';
    const box1 = document.createElement('input');
    box1.type = 'checkbox';
    box1.value = m;
    box1.className = 'flower-month w-3.5 h-3.5';
    box1.checked = selected.includes(m);
    label.append(box1, document.createTextNode(`${m}월`));
    box.appendChild(label);
  }
}

function openFlowerModal(id) {
  const f = id ? loadFlowers().find(x => x.id === id) : null;
  document.getElementById('flower-modal-title').textContent = f ? `꽃 사전 수정 · ${f.name}` : '꽃 사전에 새 꽃 추가';
  document.getElementById('flower-edit-id').value = f ? f.id : '';
  ['name', 'nameEn', 'nameJa', 'meaning', 'meaningEn', 'meaningJa', 'colors', 'care', 'image', 'guideText', 'guideVideo'].forEach(k => {
    document.getElementById(`flower-${k}`).value = f ? (f[k] || '') : '';
  });
  flowerGuideImages = f && Array.isArray(f.guideImages) ? f.guideImages.slice() : [];
  renderFlowerGuideImages();
  renderFlowerMonthButtons(f ? flowerMonths(f) : []);
  document.getElementById('flower-yearround').checked = !!(f && f.yearRound);
  document.getElementById('admin-flower-modal').classList.remove('hidden');
  setFlowerImage(f ? (f.image || '') : '');
  setTimeout(() => document.getElementById('flower-name').focus(), 50);
}

function setFlowerImage(src) {
  document.getElementById('flower-image').value = src || '';
  const img = document.getElementById('flower-image-preview');
  img.src = src || '';
  img.classList.toggle('invisible', !src);
}

// 꽃별 관리 안내 사진 (여러 장)
let flowerGuideImages = [];

function renderFlowerGuideImages() {
  const box = document.getElementById('flower-guide-images');
  if (!box) return;
  box.innerHTML = '';
  flowerGuideImages.forEach((src, i) => {
    const cell = document.createElement('div');
    cell.className = 'relative w-16 h-16 rounded-xs overflow-hidden border border-ink-black/10 bg-[#ECE8E1]';
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.className = 'w-full h-full object-cover';
    const x = document.createElement('button');
    x.type = 'button';
    x.textContent = '✕';
    x.title = '빼기';
    x.className = 'absolute top-0 right-0 w-5 h-5 bg-black/60 text-white text-[10px] cursor-pointer';
    x.onclick = () => { flowerGuideImages.splice(i, 1); renderFlowerGuideImages(); };
    cell.append(img, x);
    box.appendChild(cell);
  });
}

function addFlowerGuideImage(src) {
  if (!src || flowerGuideImages.includes(src)) return;
  flowerGuideImages.push(src);
  renderFlowerGuideImages();
}

function closeFlowerModal() {
  document.getElementById('admin-flower-modal').classList.add('hidden');
}

function saveFlower(e) {
  if (e) e.preventDefault();
  const val = k => document.getElementById(`flower-${k}`).value.trim();
  const name = val('name');
  if (!name) { alert('꽃 이름을 적어 주세요.'); return; }
  const flowers = loadFlowers();
  const editId = document.getElementById('flower-edit-id').value;
  if (flowers.some(f => f.name === name && f.id !== editId)) { alert(`'${name}'은(는) 이미 꽃 사전에 있어요.`); return; }
  const months = [...document.querySelectorAll('#flower-months .flower-month:checked')].map(b => Number(b.value));
  const data = { name, nameEn: val('nameEn'), nameJa: val('nameJa'), meaning: val('meaning'), meaningEn: val('meaningEn'), meaningJa: val('meaningJa'), months, yearRound: document.getElementById('flower-yearround').checked, colors: val('colors'), care: val('care'), image: val('image'), guideText: val('guideText'), guideImages: flowerGuideImages.slice(), guideVideo: val('guideVideo') };
  if (editId) {
    saveFlowers(flowers.map(f => f.id === editId ? { ...f, ...data } : f));
  } else {
    saveFlowers([...flowers, { id: `flower-${Date.now()}`, ...data }]);
  }
  closeFlowerModal();
  renderFlowerDictionary();
  renderProductFlowerPicker(currentProductFlowerSelection());
}

function deleteFlower(id) {
  const f = loadFlowers().find(x => x.id === id);
  if (!f) return;
  const used = loadProducts().filter(p => productFlowerIds(p).includes(id));
  const msg = used.length
    ? `'${f.name}'을(를) 꽃 사전에서 지울까요?\n이 꽃을 쓴 상품 ${used.length}개(${used.map(p => p.name).join(', ')})의 상품 페이지에서도 빠져요.`
    : `'${f.name}'을(를) 꽃 사전에서 지울까요?`;
  if (!confirm(msg)) return;
  saveFlowers(loadFlowers().filter(x => x.id !== id));
  renderFlowerDictionary();
}

function resetFlowerDictionary() {
  if (!confirm(`꽃 사전을 처음 들어 있던 기본 목록(${DEFAULT_FLOWERS.length}종)으로 되돌릴까요? 직접 추가하거나 고친 꽃은 사라져요.`)) return;
  localStorage.removeItem(FLOWERS_KEY);
  localStorage.removeItem('seoldamhwa_flowers_version');
  renderFlowerDictionary();
}

/* ---------- 상품 수정 창: 사용한 꽃 ---------- */
// 고른 순서를 그대로 기억 (상품 페이지 '꽃별 관리 안내' 순서)
let editProdFlowerOrder = [];

function currentProductFlowerSelection() {
  const checked = new Set([...document.querySelectorAll('#edit-prod-flowers .prod-flower:checked')].map(b => b.value));
  editProdFlowerOrder = editProdFlowerOrder.filter(id => checked.has(id));
  checked.forEach(id => { if (!editProdFlowerOrder.includes(id)) editProdFlowerOrder.push(id); });
  return editProdFlowerOrder.slice();
}

function renderProductFlowerPicker(selected) {
  const box = document.getElementById('edit-prod-flowers');
  if (!box) return;
  const month = currentKoreaMonth();
  editProdFlowerOrder = selected.slice();
  box.innerHTML = '';
  loadFlowers().forEach(f => {
    const label = document.createElement('label');
    label.className = 'inline-flex items-center gap-1 px-2 py-1 border border-ink-black/15 rounded-full bg-white cursor-pointer has-[:checked]:bg-seal-red has-[:checked]:text-white has-[:checked]:border-seal-red';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = f.id;
    cb.className = 'prod-flower sr-only';
    cb.checked = selected.includes(f.id);
    cb.onchange = updateProductFlowerSummary;
    label.append(cb, document.createTextNode(`${f.name}${isFlowerInSeason(f, month) ? ' 🌿' : ''}`));
    box.appendChild(label);
  });
  updateProductFlowerSummary();
}

function updateProductFlowerSummary() {
  const out = document.getElementById('edit-prod-flowers-summary');
  if (!out) return;
  const ids = currentProductFlowerSelection();
  const flowers = loadFlowers().filter(f => ids.includes(f.id));
  const inSeason = flowers.filter(f => isFlowerInSeason(f));
  out.textContent = !flowers.length
    ? '고른 꽃이 없으면 상품 페이지에는 위 \'꽃말 및 상징\' 한 줄만 보여요.'
    : `${inSeason.length ? `지금 제철(${inSeason.map(f => f.name).join(', ')})이라 쇼핑몰에 '🌿 지금이 제철'로 보여요.` : ''}`;
  renderProductFlowerOrder(ids);
}

// 고른 꽃 순서 바꾸기: 위·아래 화살표 (맨 위 꽃이 상품 페이지에서 먼저·펼쳐져 보임)
function renderProductFlowerOrder(ids) {
  const box = document.getElementById('edit-prod-flowers-order');
  if (!box) return;
  box.innerHTML = '';
  if (!ids.length) return;
  const all = loadFlowers();
  const head = document.createElement('p');
  head.className = 'text-[11px] font-bold text-ink-black';
  head.textContent = '보이는 순서 (상품 페이지 꽃별 관리 안내 순서)';
  box.appendChild(head);
  ids.forEach((id, i) => {
    const f = all.find(x => x.id === id);
    if (!f) return;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 px-2 py-1 bg-white border border-ink-black/10 rounded-xs text-[11px]';
    const num = document.createElement('span');
    num.className = 'w-4 text-ink-gray font-bold';
    num.textContent = i + 1;
    const name = document.createElement('span');
    name.className = 'flex-1 font-bold text-ink-black';
    const hasGuide = f.guideText || (f.guideImages && f.guideImages.length) || f.guideVideo;
    name.textContent = f.name + (hasGuide ? '' : '  · 관리 안내 없음(관리 팁만 보여요)');
    row.append(num, name);
    [['↑', -1], ['↓', 1]].forEach(([label, d]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.disabled = (d < 0 && i === 0) || (d > 0 && i === ids.length - 1);
      b.className = 'w-6 h-6 border border-ink-black/20 rounded-xs cursor-pointer disabled:opacity-30 disabled:cursor-default hover:border-seal-red';
      b.setAttribute('aria-label', `${f.name} ${d < 0 ? '위로' : '아래로'}`);
      b.onclick = () => {
        const j = i + d;
        [editProdFlowerOrder[i], editProdFlowerOrder[j]] = [editProdFlowerOrder[j], editProdFlowerOrder[i]];
        renderProductFlowerOrder(editProdFlowerOrder.slice());
      };
      row.appendChild(b);
    });
    box.appendChild(row);
  });
}

// doSaveProduct()에서 부름
function collectProductFlowers() {
  return document.getElementById('edit-prod-flowers') ? currentProductFlowerSelection() : undefined;
}

/* ---------- 상품 수정 창: 사진 여러 장 ---------- */
let editProdImages = [];

function renderProductGallery() {
  const box = document.getElementById('edit-prod-gallery');
  if (!box) return;
  box.innerHTML = '';
  editProdImages.forEach((src, i) => {
    const tile = document.createElement('div');
    tile.className = 'relative w-[104px] shrink-0 space-y-1';
    const frame = document.createElement('div');
    frame.className = `w-full h-28 rounded-xs overflow-hidden bg-[#ECE8E1] border-2 ${i === 0 ? 'border-seal-red' : 'border-ink-black/10'}`;
    const img = document.createElement('img');
    img.src = src;
    img.alt = `사진 ${i + 1}`;
    img.className = 'w-full h-full object-cover';
    frame.appendChild(img);
    if (i === 0) {
      const tag = document.createElement('span');
      tag.className = 'absolute top-1 left-1 bg-seal-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs';
      tag.textContent = '대표';
      tile.appendChild(tag);
    }
    const tools = document.createElement('div');
    tools.className = 'flex justify-between text-[11px]';
    const btn = (text, title, fn, disabled) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.title = title;
      b.setAttribute('aria-label', `${i + 1}번 사진 ${title}`);
      b.disabled = !!disabled;
      b.className = 'w-6 py-0.5 border border-ink-black/15 bg-white rounded-xs font-bold hover:border-seal-red hover:text-seal-red disabled:opacity-30 disabled:pointer-events-none cursor-pointer';
      b.onclick = fn;
      return b;
    };
    tools.append(
      btn('◀', '앞으로', () => moveProductImage(i, -1), i === 0),
      btn('★', '대표로', () => moveProductImage(i, -i), i === 0),
      btn('▶', '뒤로', () => moveProductImage(i, 1), i === editProdImages.length - 1),
      btn('✕', '빼기', () => removeProductImage(i))
    );
    tile.prepend(frame);
    tile.appendChild(tools);
    box.appendChild(tile);
  });
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'w-[104px] h-28 shrink-0 border-2 border-dashed border-ink-black/20 rounded-xs text-ink-gray text-xs font-bold hover:border-seal-red hover:text-seal-red cursor-pointer';
  add.textContent = '+ 사진 추가';
  add.onclick = () => openImagePicker(src => { editProdImages.push(src); syncMainImageInput(); });
  box.appendChild(add);
  const note = document.getElementById('edit-prod-gallery-count');
  if (note) note.textContent = `${editProdImages.length}장`;
}

function moveProductImage(i, delta) {
  const j = i + delta;
  if (j < 0 || j >= editProdImages.length) return;
  const [src] = editProdImages.splice(i, 1);
  editProdImages.splice(j, 0, src);
  syncMainImageInput();
}

function removeProductImage(i) {
  editProdImages.splice(i, 1);
  syncMainImageInput();
}

// 갤러리 첫 장 = 대표 이미지 칸
function syncMainImageInput() {
  const input = document.getElementById('edit-prod-image');
  if (input) input.value = editProdImages[0] || '';
  if (typeof originalUpdateProductImagePreview === 'function') originalUpdateProductImagePreview();
  renderProductGallery();
}

// 대표 이미지 칸을 직접 고치면 갤러리 첫 장도 바뀜
function syncGalleryFromMainInput() {
  const v = (document.getElementById('edit-prod-image') || {}).value || '';
  const src = v.trim();
  if (editProdImages.length) {
    if (src) editProdImages[0] = src; else editProdImages.shift();
  } else if (src) {
    editProdImages = [src];
  }
  renderProductGallery();
}

// doSaveProduct()에서 부름: 대표 이미지 + 나머지 사진 (중복 제거)
function collectProductImages(main) {
  const list = [main, ...editProdImages.slice(1)].map(s => String(s || '').trim()).filter(Boolean);
  return [...new Set(list)];
}

function loadProductEditorExtras(prod) {
  const imgs = prod ? (Array.isArray(prod.images) && prod.images.length ? prod.images.slice() : [prod.image]) : [];
  editProdImages = imgs.filter(Boolean);
  if (prod && prod.image && editProdImages[0] !== prod.image) editProdImages = [prod.image, ...editProdImages.filter(s => s !== prod.image)];
  renderProductGallery();
  renderProductFlowerPicker(prod ? productFlowerIds(prod) : []);
}

let originalUpdateProductImagePreview = null;

document.addEventListener('DOMContentLoaded', () => {
  // 상품 목록을 그릴 때 꽃 사전도 같이
  const originalRenderTable = renderProductsTable;
  renderProductsTable = function (...args) {
    const r = originalRenderTable.apply(this, args);
    try { renderFlowerDictionary(); } catch (e) { console.error('renderFlowerDictionary error:', e); }
    return r;
  };
  // 상품 창을 열 때 사진·사용한 꽃 채우기
  const originalOpen = openProductModal;
  openProductModal = function (...args) {
    const r = originalOpen.apply(this, args);
    loadProductEditorExtras(null);
    if (typeof rememberProductModalState === 'function') rememberProductModalState();
    return r;
  };
  const originalEdit = editProduct;
  editProduct = function (prodId, ...rest) {
    const r = originalEdit.call(this, prodId, ...rest);
    loadProductEditorExtras(loadProducts().find(p => p.id === prodId) || null);
    if (typeof rememberProductModalState === 'function') rememberProductModalState();
    return r;
  };
  // 대표 이미지 칸과 갤러리 맞추기
  originalUpdateProductImagePreview = updateProductImagePreview;
  updateProductImagePreview = function () {
    originalUpdateProductImagePreview();
    syncGalleryFromMainInput();
  };
  renderFlowerDictionary();
});
