// assets/js/shop/shop-inquiry.js
// 설담화 쇼핑몰: 1:1 상담 신청서
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

function handleInquiryTypeChange() {
  const typeSelect = document.getElementById('inquiry-type');
  const wrap = document.getElementById('inquiry-product-wrap');
  const pSelect = document.getElementById('inquiry-product');
  if (!typeSelect || !wrap) return;

  if (typeSelect.value === '특정 상품 문의') {
    wrap.classList.remove('hidden');
    if (pSelect) pSelect.setAttribute('required', 'required');
  } else {
    wrap.classList.add('hidden');
    if (pSelect) pSelect.removeAttribute('required');
  }
}

// 특정 상품 문의용 select 옵션 초기화 (비공개 상품 제외)
function initInquiryProductOptions() {
  const select = document.getElementById('inquiry-product');
  if (!select) return;
  const prevVal = select.value;
  const products = loadProducts().filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true);
  select.innerHTML = products.map(p => `
    <option value="${p.id}">${p.name}</option>
  `).join('');
  if (prevVal && products.some(p => p.id === prevVal)) {
    select.value = prevVal;
  }
}

// 상품 상세(PDP) 또는 푸터 버튼에서 1:1 상담 문의로 바로 이동
function goToCustomInquiry(productId) {
  closeProductDetail();
  switchView('custom');
  initInquiryProductOptions();
  try { initCurationUI(); } catch (e) { console.error('initCurationUI error:', e); }
  renderSiteSettings();
  initFloatingControls();

  const typeSelect = document.getElementById('inquiry-type');
  const productSelect = document.getElementById('inquiry-product');
  const wrap = document.getElementById('inquiry-product-wrap');

  if (productId) {
    const products = loadProducts();
    const prod = products.find(p => p.id === productId);

    if (prod && prod.inquiryOnly) {
      // 견적 전용 상품: '웨딩·행사·공간 연출' 자동 선택
      if (typeSelect) typeSelect.value = '웨딩·행사·공간 연출';
      if (wrap) wrap.classList.add('hidden');
      if (productSelect) productSelect.removeAttribute('required');
    } else if (prod) {
      // 일반 상품: '특정 상품 문의' + 해당 상품 선택
      if (typeSelect) typeSelect.value = '특정 상품 문의';
      if (wrap) wrap.classList.remove('hidden');
      if (productSelect) {
        productSelect.setAttribute('required', 'required');
        productSelect.value = prod.id;
      }
    }
  } else {
    // 빈 인자(푸터 버튼 등): 기본 '맞춤 꽃다발·꽃바구니 제작'
    if (typeSelect && !typeSelect.value) {
      typeSelect.value = '맞춤 꽃다발·꽃바구니 제작';
    }
    handleInquiryTypeChange();
  }

  setTimeout(() => {
    const formSec = document.getElementById('custom-inquiry-section');
    if (formSec) {
      formSec.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}

// 1:1 맞춤 상담 문의 제출
function submitCustomInquiry(e) {
  e.preventDefault();
  const name = document.getElementById('inquiry-name').value.trim();
  const phone = document.getElementById('inquiry-phone').value.trim();
  const date = document.getElementById('inquiry-date').value || '미정';
  const typeSelect = document.getElementById('inquiry-type');
  const type = typeSelect ? typeSelect.value : '맞춤 꽃다발·꽃바구니 제작';

  let productName = '';
  if (type === '특정 상품 문의') {
    const pSelect = document.getElementById('inquiry-product');
    if (pSelect && pSelect.selectedIndex >= 0) {
      productName = pSelect.options[pSelect.selectedIndex].text;
    }
  }

  const message = document.getElementById('inquiry-message').value.trim();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const createdDate = `${year}-${month}-${day}`;

  const inquiry = {
    id: `inq-${Date.now()}`,
    name: name,
    phone: phone,
    date: date,
    type: type,
    productName: productName,
    message: message,
    createdDate: createdDate,
    status: 'new'
  };

  const inquiries = JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]');
  inquiries.unshift(inquiry);
  localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(inquiries));
  try { if (typeof notifyInquiryToDiscord === 'function') notifyInquiryToDiscord(inquiry); } catch (e) { console.error('discord notify error:', e); }

  alert(`[상담 신청 완료] ${name} 님의 맞춤 상담 문의가 정상 접수되었습니다!
설담화 화훼 장인이 확인 후 기재해주신 연락처(${phone})로 정성껏 안내드리겠습니다.`);
  document.getElementById('custom-inquiry-form').reset();
  handleInquiryTypeChange();
}

// 7. 검색 기능
