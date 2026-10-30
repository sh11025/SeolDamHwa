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

  if (inquiry) {
    if (priceWrap) priceWrap.classList.add('hidden');
    if (stockWrap) stockWrap.classList.add('hidden');
    if (priceInput) priceInput.removeAttribute('required');
    if (stockInput) stockInput.removeAttribute('required');
  } else {
    if (priceWrap) priceWrap.classList.remove('hidden');
    if (stockWrap) stockWrap.classList.remove('hidden');
    if (priceInput) priceInput.setAttribute('required', 'required');
    if (stockInput) stockInput.setAttribute('required', 'required');
  }
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

function openProductModal() {
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

  // 신규 상품은 기본 비공개 (B2: NEW products default to 비공개, so the owner can check them first)
  const radios = document.getElementsByName('edit-prod-visibility');
  for (const r of radios) {
    r.checked = (r.value === 'private');
  }
  const pubInput = document.getElementById('edit-prod-publish-at');
  if (pubInput) pubInput.value = '';
  togglePublishAtInput();

  toggleInquiryOnlyFields();
  document.getElementById('admin-product-modal').classList.remove('hidden');
}

function editProduct(prodId) {
  const products = loadProducts();
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;

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

  const vis = prod.visibility || 'public';
  const radios = document.getElementsByName('edit-prod-visibility');
  for (const r of radios) {
    r.checked = (r.value === vis);
  }
  const pubInput = document.getElementById('edit-prod-publish-at');
  if (pubInput) pubInput.value = prod.publishAt || '';
  togglePublishAtInput();

  toggleInquiryOnlyFields();
  document.getElementById('admin-product-modal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('admin-product-modal').classList.add('hidden');
}

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
  const price = inquiryOnly ? 0 : Number(document.getElementById('edit-prod-price').value || 0);
  const stockQuantity = inquiryOnly ? null : Number(document.getElementById('edit-prod-stock-qty').value || 0);
  const meaning = document.getElementById('edit-prod-meaning').value.trim();
  const desc = document.getElementById('edit-prod-desc').value.trim();
  const image = document.getElementById('edit-prod-image').value.trim();
  if (!image) {
    alert('대표 이미지 경로를 입력해주세요.');
    return null;
  }

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
    // 기존 상품 수정 (sizes 등 기존 속성 보존)
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
      flowerMeaning: meaning, 
      description: desc,
      image
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
      flowerMeaning: meaning, 
      description: desc,
      image
    };
    products.unshift(newP);
  }

  const before = prodId ? loadProducts().find(p => p.id === prodId) : null;
  saveProducts(products);
  closeProductModal();
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
