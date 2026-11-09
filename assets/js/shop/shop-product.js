// assets/js/shop/shop-product.js
// 설담화 쇼핑몰: 상품 상세(창)·재입고 알림 신청·사이즈·수량·장바구니 담기·바로 구매
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 상품 페이지 그리기 (주소 이동은 shop-product-page.js의 openProductDetail)
function renderProductPage(productId, isPreview = false) {
  const products = loadProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  const isVis = typeof isProductVisible === 'function' ? isProductVisible(prod) : true;
  if (!isVis && !isPreview && !isPreviewMode) {
    return; // 손님 화면에서는 비공개 상품 접근 불가
  }

  if (isPreview) {
    isPreviewMode = true;
  }

  currentSelectedProduct = prod;
  currentQty = 1;
  const tp = typeof tProduct === 'function' ? tProduct(prod) : prod;

  document.getElementById('pdp-image').src = prod.image;
  document.getElementById('pdp-title').innerText = tp.name;
  
  document.getElementById('pdp-category').innerText = categoryLabel(prod.category) || '전통 화훼';
  document.getElementById('pdp-poetic').innerText = `"${tp.poeticLine}"`;
  const meaningPrefix = typeof t === 'function' ? t('pdp_meaning_prefix', '꽃말: ') : '꽃말: ';
  document.getElementById('pdp-meaning').innerText = `${meaningPrefix}${tp.flowerMeaning}`;
  document.getElementById('pdp-desc').innerText = tp.description || '';
  document.getElementById('pdp-qty').innerText = '1';

  // 활성화된 포장 옵션 목록 렌더링 (첫 번째 활성 옵션이 기본값)
  const pkgOpt = document.getElementById('pdp-package-opt');
  if (pkgOpt) {
    const s = typeof loadSettings === 'function' ? loadSettings() : {};
    const pkgList = typeof getEnabledPackaging === 'function' ? getEnabledPackaging(s) : (typeof DEFAULT_PACKAGING !== 'undefined' ? DEFAULT_PACKAGING : []);
    pkgOpt.innerHTML = pkgList.map(p => {
      const priceText = p.price === 0 ? (typeof t === 'function' ? t('co_free', '무료') : '무료') : `+${formatPrice(p.price)}`;
      return `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}">${p.name} (${priceText})</option>`;
    }).join('');
    pkgOpt.selectedIndex = 0;
  }

  const stockNoticeEl = document.getElementById('pdp-stock-notice');
  const sizeContainer = document.getElementById('pdp-size-container');
  const sizeSelect = document.getElementById('pdp-size-select');
  const packageContainer = document.getElementById('pdp-package-container');
  const qtyContainer = document.getElementById('pdp-qty-container');
  const normalBtns = document.getElementById('pdp-normal-btns');
  const inquiryContainer = document.getElementById('pdp-inquiry-container');
  const normalTotalRow = document.getElementById('pdp-normal-total-row');
  const btnCart = document.getElementById('pdp-btn-cart');
  const btnBuy = document.getElementById('pdp-btn-buy');

  if (prod.inquiryOnly) {
    document.getElementById('pdp-price').innerText = typeof t === 'function' ? t('inquiry_price_label', '상담 후 견적') : '상담 후 견적';
    if (sizeContainer) sizeContainer.classList.add('hidden');
    if (packageContainer) packageContainer.classList.add('hidden');
    if (qtyContainer) qtyContainer.classList.add('hidden');
    if (normalTotalRow) normalTotalRow.classList.add('hidden');
    if (normalBtns) normalBtns.classList.add('hidden');
    if (inquiryContainer) inquiryContainer.classList.remove('hidden');
    if (stockNoticeEl) stockNoticeEl.innerText = '';
  } else {
    if (packageContainer) packageContainer.classList.remove('hidden');
    if (qtyContainer) qtyContainer.classList.remove('hidden');
    if (normalTotalRow) normalTotalRow.classList.remove('hidden');
    if (normalBtns) normalBtns.classList.remove('hidden');
    if (inquiryContainer) inquiryContainer.classList.add('hidden');

    if (prod.sizes && prod.sizes.length > 0) {
      if (sizeContainer) sizeContainer.classList.remove('hidden');
      const recLabel = typeof t === 'function' ? t('size_recommended_label', '추천') : '추천';
      sizeSelect.innerHTML = prod.sizes.map((s, idx) => {
        const recBadge = s.recommended ? ` · ${recLabel}` : '';
        return `<option value="${idx}">${s.label} - ${formatPrice(s.price)}${recBadge}</option>`;
      }).join('');
      
      const recIdx = prod.sizes.findIndex(s => s.recommended);
      const defaultIdx = recIdx !== -1 ? recIdx : 0;
      sizeSelect.value = String(defaultIdx);
      currentSelectedSize = prod.sizes[defaultIdx];
    } else {
      if (sizeContainer) sizeContainer.classList.add('hidden');
      currentSelectedSize = null;
    }

    const stockStatus = getStockStatus(prod.stockQuantity);
    const soldoutText = typeof t === 'function' ? t('stock_soldout', '일시 품절') : '일시 품절';
    if (stockStatus === 'out_of_stock') {
      if (stockNoticeEl) stockNoticeEl.innerText = soldoutText;
      if (btnCart) {
        btnCart.disabled = true;
        btnCart.innerText = soldoutText;
        btnCart.className = 'w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs bg-ink-gray/30 text-ink-light cursor-not-allowed';
      }
      if (btnBuy) {
        btnBuy.disabled = true;
        btnBuy.innerText = soldoutText;
        btnBuy.className = 'w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs bg-ink-gray/30 text-ink-light cursor-not-allowed';
      }
    } else if (stockStatus === 'low_stock') {
      const lowText = typeof t === 'function' ? t('stock_low_fmt', '품절 임박 (남은 수량: {qty}개)').replace('{qty}', prod.stockQuantity) : `품절 임박 (남은 수량: ${prod.stockQuantity}개)`;
      if (stockNoticeEl) stockNoticeEl.innerText = lowText;
      resetPDPButtons();
    } else {
      if (stockNoticeEl) stockNoticeEl.innerText = '';
      resetPDPButtons();
    }
  }

  // 미리보기 모드인 경우 상단 배너 노출 및 버튼 비활성화 (B3)
  if (isPreviewMode) {
    const banner = document.getElementById('preview-mode-banner');
    if (banner) {
      banner.classList.remove('hidden');
      updatePreviewBannerText(prod);
    }
    if (btnCart) {
      btnCart.disabled = true;
      btnCart.innerText = typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드 (주문 불가)';
      btnCart.className = 'w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs bg-ink-gray/30 text-ink-light cursor-not-allowed';
    }
    if (btnBuy) {
      btnBuy.disabled = true;
      btnBuy.innerText = typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드 (주문 불가)';
      btnBuy.className = 'w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs bg-ink-gray/30 text-ink-light cursor-not-allowed';
    }
  }

  updatePDPPrice();
  try { updateRestockBox(prod, typeof isPreviewMode !== 'undefined' && isPreviewMode); } catch (e) { console.error('restock box error:', e); }
  document.getElementById('pdp-modal').classList.remove('hidden');
  if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
}

function closeProductDetail() {
  const modal = document.getElementById('pdp-modal');
  if (modal) modal.classList.add('hidden');
  if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
}

// 재입고 알림 신청 (품절 상품, 상담 상품 제외)
function updateRestockBox(prod, preview) {
  const box = document.getElementById('pdp-restock-box');
  if (!box) return;
  const soldOut = prod && !prod.inquiryOnly && typeof prod.stockQuantity === 'number' && prod.stockQuantity <= 0;
  box.classList.toggle('hidden', !soldOut || !!preview);
  box.reset();
  document.getElementById('restock-message').classList.add('hidden');
  box.querySelector('button[type="submit"]').disabled = false;
}

function submitRestockRequest(e) {
  e.preventDefault();
  if (!currentSelectedProduct || typeof addRestockRequest !== 'function') return;
  const phone = document.getElementById('restock-phone').value.trim();
  if (!isValidPhone(phone)) {
    alert(typeof t === 'function' ? t('co_phone_invalid', '연락처를 숫자 10~11자리로 적어 주세요. (예: 010-1234-5678)') : '연락처를 숫자 10~11자리로 적어 주세요. (예: 010-1234-5678)');
    return;
  }
  const result = addRestockRequest({
    productId: currentSelectedProduct.id,
    productName: currentSelectedProduct.name, // 관리자 호환: 한국어 원본
    phone,
    name: document.getElementById('restock-name').value
  });
  if (!result.duplicate) {
    try { if (typeof notifyRestockToDiscord === 'function') notifyRestockToDiscord(result.request, restockWaitingCount(currentSelectedProduct.id)); } catch (err) { console.error(err); }
  }
  const msg = document.getElementById('restock-message');
  msg.textContent = result.duplicate
    ? (typeof t === 'function' ? t('restock_dup', '이미 신청해 주셨어요. 입고되면 바로 알려 드릴게요.') : '이미 신청해 주셨어요. 입고되면 바로 알려 드릴게요.')
    : (typeof t === 'function' ? t('restock_done', '신청됐어요. 다시 들어오면 문자로 알려 드릴게요.') : '신청됐어요. 다시 들어오면 문자로 알려 드릴게요.');
  msg.classList.remove('hidden');
  e.target.querySelector('button[type="submit"]').disabled = true;
}

function resetPDPButtons() {
  const btnCart = document.getElementById('pdp-btn-cart');
  const btnBuy = document.getElementById('pdp-btn-buy');
  if (isPreviewMode) {
    if (btnCart) {
      btnCart.disabled = true;
      btnCart.innerText = typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드 (주문 불가)';
      btnCart.className = 'w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs bg-ink-gray/30 text-ink-light cursor-not-allowed';
    }
    if (btnBuy) {
      btnBuy.disabled = true;
      btnBuy.innerText = typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드 (주문 불가)';
      btnBuy.className = 'w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs bg-ink-gray/30 text-ink-light cursor-not-allowed';
    }
    return;
  }
  if (btnCart) {
    btnCart.disabled = false;
    btnCart.innerText = typeof t === 'function' ? t('pdp_btn_cart', '장바구니 담기') : '장바구니 담기';
    btnCart.className = 'jakae-light-btn py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs cursor-pointer';
  }
  if (btnBuy) {
    btnBuy.disabled = false;
    btnBuy.innerText = typeof t === 'function' ? t('pdp_btn_buy', '바로 구매하기') : '바로 구매하기';
    btnBuy.className = 'jakae-btn py-3.5 px-4 text-xs sm:text-sm font-bold rounded-xs cursor-pointer shadow-md';
  }
}

function updatePDPPrice() {
  if (!currentSelectedProduct || currentSelectedProduct.inquiryOnly) return;
  const basePrice = currentSelectedSize ? currentSelectedSize.price : (currentSelectedProduct.price || 0);
  const optSelect = document.getElementById('pdp-package-opt');
  const selOpt = optSelect && optSelect.selectedIndex >= 0 ? optSelect.options[optSelect.selectedIndex] : null;
  const pkgVal = selOpt ? (parseInt(selOpt.dataset.price, 10) || 0) : 0;
  const unitPrice = basePrice + pkgVal;
  const totalPrice = unitPrice * currentQty;

  document.getElementById('pdp-price').innerText = formatPrice(unitPrice);
  document.getElementById('pdp-total').innerText = formatPrice(totalPrice);
}

// A1: 복원된 PDP 옵션 변경 및 수량 조절 함수
function onSizeChanged() {
  if (!currentSelectedProduct || !currentSelectedProduct.sizes) return;
  const sizeSelect = document.getElementById('pdp-size-select');
  if (!sizeSelect) return;
  const idx = parseInt(sizeSelect.value, 10);
  if (!isNaN(idx) && currentSelectedProduct.sizes[idx]) {
    currentSelectedSize = currentSelectedProduct.sizes[idx];
  }
  updatePDPPrice();
}

function changeQty(delta) {
  if (!currentSelectedProduct) return;
  let newQty = currentQty + delta;
  if (newQty < 1) newQty = 1;
  if (!currentSelectedProduct.inquiryOnly) {
    const maxStock = currentSelectedProduct.stockQuantity;
    if (typeof maxStock === 'number' && maxStock > 0 && newQty > maxStock) {
      newQty = maxStock;
    }
  }
  currentQty = newQty;
  const qtyEl = document.getElementById('pdp-qty');
  if (qtyEl) qtyEl.innerText = String(currentQty);
  updatePDPPrice();
}

// 장바구니 담기
function addToCartFromPDP() {
  if (isPreviewMode) {
    alert(typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드에서는 주문할 수 없습니다.');
    return;
  }
  if (!currentSelectedProduct || currentSelectedProduct.inquiryOnly) return;
  if (currentSelectedProduct.stockQuantity <= 0) {
    alert('현재 일시 품절된 상품입니다.');
    return;
  }

  const optSelect = document.getElementById('pdp-package-opt');
  const selOpt = optSelect && optSelect.selectedIndex >= 0 ? optSelect.options[optSelect.selectedIndex] : null;
  const packagingId = selOpt ? selOpt.value : '';
  const optPrice = selOpt ? (parseInt(selOpt.dataset.price, 10) || 0) : 0;
  const optName = selOpt ? (selOpt.dataset.name || (optPrice === 15000 ? '전통 실크 본견 보자기 & 노리개 포장' : '기본 단아 한지 포장')) : '기본 단아 한지 포장';

  const basePrice = currentSelectedSize ? currentSelectedSize.price : (currentSelectedProduct.price || 0);

  // 장바구니에 이미 담긴 수량까지 합쳐 재고를 넘지 않게
  const left = stockLeftFor(currentSelectedProduct.id);
  if (left <= 0) {
    alert(typeof t === 'function' ? t('stock_cart_full', '남은 재고만큼 이미 장바구니에 담겨 있어요.') : '남은 재고만큼 이미 장바구니에 담겨 있어요.');
    toggleCartDrawer(true);
    return;
  }
  if (currentQty > left) {
    alert((typeof t === 'function' ? t('stock_cart_limited', '남은 재고가 {n}개라 {n}개만 담았어요.') : '남은 재고가 {n}개라 {n}개만 담았어요.').replace(/\{n\}/g, left));
    currentQty = left;
  }

  cart.push({
    product: currentSelectedProduct,
    sizeLabel: currentSelectedSize ? currentSelectedSize.label : null,
    price: basePrice,
    packagingId: packagingId,
    optionName: optName,
    optionPrice: optPrice,
    quantity: currentQty
  });

  updateCartUI();
  toggleCartDrawer(true); // 상품 페이지에 머무른 채 장바구니 열기
  if (typeof updatePopupVisibility === 'function') updatePopupVisibility();
}

// 바로 구매하기
function buyNowFromPDP() {
  if (isPreviewMode) {
    alert(typeof t === 'function' ? t('preview_btn_disabled', '미리보기 모드 (주문 불가)') : '미리보기 모드에서는 주문할 수 없습니다.');
    return;
  }
  if (!currentSelectedProduct || currentSelectedProduct.inquiryOnly) return;
  if (currentSelectedProduct.stockQuantity <= 0) {
    alert('현재 일시 품절된 상품입니다.');
    return;
  }

  const optSelect = document.getElementById('pdp-package-opt');
  const selOpt = optSelect && optSelect.selectedIndex >= 0 ? optSelect.options[optSelect.selectedIndex] : null;
  const packagingId = selOpt ? selOpt.value : '';
  const optPrice = selOpt ? (parseInt(selOpt.dataset.price, 10) || 0) : 0;
  const optName = selOpt ? (selOpt.dataset.name || (optPrice === 15000 ? '전통 실크 본견 보자기 & 노리개 포장' : '기본 단아 한지 포장')) : '기본 단아 한지 포장';

  const basePrice = currentSelectedSize ? currentSelectedSize.price : (currentSelectedProduct.price || 0);
  const stock = currentSelectedProduct.stockQuantity;
  if (typeof stock === 'number' && currentQty > stock) currentQty = stock;

  cart = [{
    product: currentSelectedProduct,
    sizeLabel: currentSelectedSize ? currentSelectedSize.label : null,
    price: basePrice,
    packagingId: packagingId,
    optionName: optName,
    optionPrice: optPrice,
    quantity: currentQty
  }];

  updateCartUI();
  closeProductDetail();
  openCheckoutModal();
}

// 3. 장바구니 UI 업데이트
