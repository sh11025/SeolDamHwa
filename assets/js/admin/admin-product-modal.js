// assets/js/admin/admin-product-modal.js
// 설담화 관리자: 상품 등록·수정 창
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 5. 상품 등록/수정 모달 로직
// 견적 문의 전용 여부에 따른 폼 필드 토글
function toggleInquiryOnlyFields() {
  const inquiry = document.getElementById('edit-prod-inquiry').checked;
  const priceWrap = document.getElementById('edit-prod-price-wrap');
  const stockWrap = document.getElementById('edit-prod-stock-wrap');
  const priceInput = document.getElementById('edit-prod-price');
  const stockInput = document.getElementById('edit-prod-stock-qty');

  // 사이즈가 있으면 가격은 사이즈별로 (판매 가격 칸 숨김)
  const hasSizes = editProdSizes.length > 0;
  const sizesWrap = document.getElementById('edit-prod-sizes-wrap');
  if (sizesWrap) sizesWrap.classList.toggle('hidden', inquiry);
  if (priceWrap) priceWrap.classList.toggle('hidden', inquiry || hasSizes);
  if (stockWrap) stockWrap.classList.toggle('hidden', inquiry);
  if (priceInput) priceInput.required = !inquiry && !hasSizes;
  if (stockInput) stockInput.required = !inquiry;
}

/* ---------- 사이즈 (S·M·L 등, 상품 페이지에서 손님이 고름) ---------- */
let editProdSizes = [];

function renderProductSizes() {
  const box = document.getElementById('edit-prod-sizes');
  if (!box) return;
  box.innerHTML = '';
  editProdSizes.forEach((sz, i) => {
    const row = document.createElement('div');
    row.className = 'flex flex-wrap items-center gap-2';
    const label = document.createElement('input');
    label.type = 'text';
    label.value = sz.label || '';
    label.placeholder = '이름 (예: M)';
    label.maxLength = 20;
    label.setAttribute('aria-label', `${i + 1}번 사이즈 이름`);
    label.className = 'w-24 bg-white border border-ink-black/20 p-1.5 rounded-xs font-bold';
    label.oninput = () => { editProdSizes[i].label = label.value; };
    const price = document.createElement('input');
    price.type = 'number';
    price.min = '0';
    price.step = '1000';
    price.value = sz.price || '';
    price.placeholder = '가격';
    price.setAttribute('aria-label', `${i + 1}번 사이즈 가격`);
    price.className = 'w-32 bg-white border border-ink-black/20 p-1.5 rounded-xs';
    price.oninput = () => { editProdSizes[i].price = Number(price.value) || 0; };
    const rec = document.createElement('label');
    rec.className = 'inline-flex items-center gap-1 text-ink-gray cursor-pointer';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'edit-prod-size-rec';
    radio.checked = !!sz.recommended;
    radio.onchange = () => { editProdSizes.forEach((x, j) => { x.recommended = j === i; }); };
    rec.append(radio, document.createTextNode('추천'));
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '✕';
    del.setAttribute('aria-label', `${i + 1}번 사이즈 빼기`);
    del.className = 'w-7 h-7 border border-ink-black/15 bg-white rounded-xs font-bold hover:border-red-400 hover:text-red-700 cursor-pointer';
    del.onclick = () => { editProdSizes.splice(i, 1); renderProductSizes(); };
    row.append(label, price, rec, del);
    box.appendChild(row);
  });
  toggleInquiryOnlyFields();
}

function addProductSize() {
  const base = Number(document.getElementById('edit-prod-price').value) || 0;
  editProdSizes.push({ label: '', price: base, recommended: editProdSizes.length === 0 });
  renderProductSizes();
  const inputs = document.querySelectorAll('#edit-prod-sizes input[type=text]');
  if (inputs.length) inputs[inputs.length - 1].focus();
}

// 이름과 가격이 있는 사이즈만 저장
function collectProductSizes() {
  const list = editProdSizes
    .map(x => ({ label: String(x.label || '').trim(), price: Number(x.price) || 0, ...(x.recommended ? { recommended: true } : {}) }))
    .filter(x => x.label && x.price > 0);
  if (list.length && !list.some(x => x.recommended)) list[0].recommended = true;
  return list;
}

// 상품 지우기 (수정 창에서만)
function deleteProductFromModal() {
  const prodId = document.getElementById('edit-prod-id').value;
  if (!prodId) return;
  const prod = loadProducts().find(p => p.id === prodId);
  if (!prod) return;
  if (!confirm(`'${prod.name}' 상품을 지울까요?\n쇼핑몰에서 바로 사라지고 되돌릴 수 없어요.\n잠깐 숨기기만 하려면 '비공개'로 바꿔 주세요.`)) return;
  saveProducts(loadProducts().filter(p => p.id !== prodId));
  closeProductModal(true);
  renderProductsTable();
  renderDashboard();
}

function togglePublishAtInput() {
  const radios = document.getElementsByName('edit-prod-visibility');
  let val = 'public';
  for (const r of radios) {
    if (r.checked) { val = r.value; break; }
  }
  const wrap = document.getElementById('edit-prod-publish-wrap');
  const input = document.getElementById('edit-prod-publish-at');
  if (wrap) {
    if (val === 'scheduled') {
      wrap.classList.remove('hidden');
      if (input) input.setAttribute('required', 'required');
    } else {
      wrap.classList.add('hidden');
      if (input) input.removeAttribute('required');
    }
  }
}

function sizesForEditor(prod) {
  return prod && Array.isArray(prod.sizes) ? prod.sizes.map(x => ({ ...x })) : [];
}

function openProductModal() {
  const prodForEditor = null;
  document.getElementById('modal-product-title').innerText = '신규 전통 꽃 상품 등록';
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('edit-prod-name').value = '';
  document.getElementById('edit-prod-eng').value = '';
  document.getElementById('edit-prod-poetic').value = '';
  document.getElementById('edit-prod-cat').value = 'bouquet';
  document.getElementById('edit-prod-price').value = 68000;
  document.getElementById('edit-prod-stock-qty').value = 10;
  document.getElementById('edit-prod-inquiry').checked = false;
  document.getElementById('edit-prod-meaning').value = '';
  document.getElementById('edit-prod-desc').value = '';
  document.getElementById('edit-prod-image').value = '';
  updateProductImagePreview();
  document.getElementById('edit-prod-show-home').checked = true;
  document.getElementById('edit-prod-home-order').value = '';

  // 신규 상품은 기본 비공개 (B2: NEW products default to 비공개, so the owner can check them first)
  const radios = document.getElementsByName('edit-prod-visibility');
  for (const r of radios) {
    r.checked = (r.value === 'private');
  }
  const pubInput = document.getElementById('edit-prod-publish-at');
  if (pubInput) pubInput.value = '';
  togglePublishAtInput();

  editProdSizes = sizesForEditor(prodForEditor);
  renderProductSizes();
  const delBtn = document.getElementById('edit-prod-delete-btn');
  if (delBtn) delBtn.classList.toggle('hidden', !prodForEditor);
  document.getElementById('admin-product-modal').classList.remove('hidden');
  document.getElementById('admin-product-modal').scrollTop = 0;
}

function editProduct(prodId) {
  const products = loadProducts();
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;
  const prodForEditor = prod;

  document.getElementById('modal-product-title').innerText = '꽃 상품 및 한 줄 글귀 수정';
  document.getElementById('edit-prod-id').value = prod.id;
  document.getElementById('edit-prod-name').value = prod.name || '';
  document.getElementById('edit-prod-eng').value = prod.englishName || '';
  document.getElementById('edit-prod-poetic').value = prod.poeticLine || '';
  document.getElementById('edit-prod-cat').value = prod.category || 'bouquet';
  document.getElementById('edit-prod-price').value = prod.price || (prod.sizes && prod.sizes.length > 0 ? prod.sizes[0].price : 0);
  document.getElementById('edit-prod-stock-qty').value = prod.stockQuantity ?? 0;
  document.getElementById('edit-prod-inquiry').checked = !!prod.inquiryOnly;
  document.getElementById('edit-prod-meaning').value = prod.flowerMeaning || '';
  document.getElementById('edit-prod-desc').value = prod.description || '';
  document.getElementById('edit-prod-image').value = prod.image || '';
  updateProductImagePreview();
  document.getElementById('edit-prod-show-home').checked = !prod.hideOnHome;
  document.getElementById('edit-prod-home-order').value = typeof prod.homeOrder === 'number' ? prod.homeOrder : '';

  const vis = prod.visibility || 'public';
  const radios = document.getElementsByName('edit-prod-visibility');
  for (const r of radios) {
    r.checked = (r.value === vis);
  }
  const pubInput = document.getElementById('edit-prod-publish-at');
  if (pubInput) pubInput.value = prod.publishAt || '';
  togglePublishAtInput();

  editProdSizes = sizesForEditor(prodForEditor);
  renderProductSizes();
  const delBtn = document.getElementById('edit-prod-delete-btn');
  if (delBtn) delBtn.classList.toggle('hidden', !prodForEditor);
  document.getElementById('admin-product-modal').classList.remove('hidden');
  document.getElementById('admin-product-modal').scrollTop = 0;
}

// 창을 연 직후 모습을 기억해 두고, 닫을 때 달라졌으면 물어봄 (저장·삭제 뒤에는 묻지 않음)
let productModalSnapshot = '';

function productModalState() {
  const form = document.querySelector('#admin-product-modal form');
  if (!form) return '';
  const vals = [...form.querySelectorAll('input, select, textarea')].map(el => (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value);
  const extra = typeof editProdImages !== 'undefined' ? JSON.stringify(editProdImages) : '';
  return JSON.stringify(vals) + extra + JSON.stringify(editProdSizes);
}

function rememberProductModalState() {
  productModalSnapshot = productModalState();
}

function closeProductModal(force) {
  const modal = document.getElementById('admin-product-modal');
  if (force !== true && !modal.classList.contains('hidden') && productModalSnapshot && productModalState() !== productModalSnapshot) {
    if (!confirm('고친 내용이 아직 저장되지 않았어요. 저장하지 않고 닫을까요?')) return;
  }
  modal.classList.add('hidden');
}

window.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && !document.getElementById('admin-product-modal').classList.contains('hidden')
    && document.getElementById('image-picker-modal')?.classList.contains('hidden') !== false
    && document.getElementById('admin-flower-modal')?.classList.contains('hidden') !== false) closeProductModal();
});

function doSaveProduct() {
  const prodId = document.getElementById('edit-prod-id').value;
  const name = document.getElementById('edit-prod-name').value.trim();
  if (!name) {
    alert('상품명을 입력해주세요.');
    return null;
  }
  const eng = document.getElementById('edit-prod-eng').value.trim();
  const poetic = document.getElementById('edit-prod-poetic').value.trim();
  if (!poetic) {
    alert('한 줄 글귀를 입력해주세요.');
    return null;
  }
  const cat = document.getElementById('edit-prod-cat').value;
  const inquiryOnly = document.getElementById('edit-prod-inquiry').checked;
  const sizes = inquiryOnly ? [] : collectProductSizes();
  const price = inquiryOnly ? 0 : (sizes.length ? Math.min(...sizes.map(x => x.price)) : Number(document.getElementById('edit-prod-price').value || 0));
  const stockQuantity = inquiryOnly ? null : Number(document.getElementById('edit-prod-stock-qty').value || 0);
  const meaning = document.getElementById('edit-prod-meaning').value.trim();
  const desc = document.getElementById('edit-prod-desc').value.trim();
  const image = document.getElementById('edit-prod-image').value.trim();
  if (!image) {
    alert('대표 이미지 경로를 입력해주세요.');
    return null;
  }
  // 사진 여러 장(첫 장 = 대표)과 사용한 꽃 (admin-flowers.js)
  const images = typeof collectProductImages === 'function' ? collectProductImages(image) : [image];
  const flowers = typeof collectProductFlowers === 'function' ? collectProductFlowers() : undefined;
  const extra = { images, sizes, ...(flowers ? { flowers } : {}) };

  // 홈 슬라이더: 숨김 여부와 순서 (비우면 자동)
  const hideOnHome = !document.getElementById('edit-prod-show-home').checked;
  const homeOrderRaw = document.getElementById('edit-prod-home-order').value.trim();
  const homeOrder = homeOrderRaw === '' ? null : Math.max(1, Math.round(Number(homeOrderRaw)) || 1);

  // 공개 설정 수집 및 검증
  const radios = document.getElementsByName('edit-prod-visibility');
  let visibility = 'public';
  for (const r of radios) {
    if (r.checked) { visibility = r.value; break; }
  }

  let publishAt = null;
  if (visibility === 'scheduled') {
    const pubInput = document.getElementById('edit-prod-publish-at');
    publishAt = pubInput ? pubInput.value : '';
    if (!publishAt) {
      alert('예약 공개 일시를 입력해주세요.');
      return null;
    }
    const currentKoreaISO = typeof getKoreaISOString === 'function' ? getKoreaISOString(new Date()) : new Date().toISOString().slice(0, 16);
    if (publishAt <= currentKoreaISO) {
      alert('예약 공개 일시는 현재 시각 이후(미래)로 설정해야 합니다.');
      return null;
    }
  }

  let products = loadProducts();
  let savedId = prodId;

  if (prodId) {
    // 기존 상품 수정 (그 밖의 기존 속성은 보존)
    products = products.map(p => p.id === prodId ? {
      ...p,
      name, 
      englishName: eng, 
      poeticLine: poetic, 
      category: cat, 
      price, 
      stockQuantity, 
      inquiryOnly,
      visibility,
      publishAt: visibility === 'scheduled' ? publishAt : null,
      hideOnHome,
      homeOrder,
      flowerMeaning: meaning, 
      description: desc,
      image,
      ...extra
    } : p);
  } else {
    // 신규 상품 등록
    savedId = `prod-${Date.now()}`;
    const newP = {
      id: savedId,
      name, 
      englishName: eng, 
      poeticLine: poetic, 
      category: cat, 
      price, 
      stockQuantity, 
      inquiryOnly,
      visibility,
      publishAt: visibility === 'scheduled' ? publishAt : null,
      hideOnHome,
      homeOrder,
      flowerMeaning: meaning, 
      description: desc,
      image,
      ...extra
    };
    products.unshift(newP);
  }

  const before = prodId ? loadProducts().find(p => p.id === prodId) : null;
  saveProducts(products);
  closeProductModal(true);
  renderProductsTable();
  renderDashboard();
  const waitingNow = typeof restockWaitingCount === 'function' && prodId ? restockWaitingCount(prodId) : 0;
  if (before && Number(before.stockQuantity) <= 0 && Number(stockQuantity) > 0 && waitingNow > 0) {
    setTimeout(() => {
      if (confirm(`재고를 채웠어요. 이 상품의 재입고 알림을 기다리는 손님이 ${waitingNow}명 있어요.\n지금 '고객 상담 문의 > 재입고 알림 신청'으로 갈까요?`)) {
        switchAdminTab('reviews');
        setTimeout(() => document.getElementById('admin-restock-list').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }, 50);
  }
  return savedId;
}

function saveProduct(e) {
  if (e) e.preventDefault();
  const prodId = document.getElementById('edit-prod-id').value;
  const isEdit = !!prodId;
  const name = document.getElementById('edit-prod-name').value.trim();
  const savedId = doSaveProduct();
  if (!savedId) return;

  if (isEdit) {
    alert(`'${name}' 상품 정보가 수정되었습니다!
쇼핑몰(index.html)에 즉시 반영됩니다.`);
  } else {
    alert(`신규 상품 '${name}' 등록 완료!
쇼핑몰(index.html)에서 바로 확인하실 수 있습니다.`);
  }
}

function saveAndPreviewProduct(e) {
  if (e) e.preventDefault();
  const savedId = doSaveProduct();
  if (savedId) {
    window.open('index.html?preview=' + encodeURIComponent(savedId), '_blank');
  }
}
