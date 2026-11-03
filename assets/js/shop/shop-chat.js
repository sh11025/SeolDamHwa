// assets/js/shop/shop-chat.js
// 설담화 쇼핑몰: 오른쪽 아래 💬 말풍선 상담 (작은 상담 창)
// 보낸 내용은 1:1 상담 문의와 같은 곳(seoldamhwa_inquiries)에 저장되고 디스코드 상담 채널로 알림이 가요.
// 실시간 채팅은 서버 연결 후에 붙일 수 있어요.

function chatT(key, fallback) {
  return typeof t === 'function' ? t(key, fallback) : fallback;
}

function isProductPageOpen() {
  const page = document.getElementById('pdp-modal');
  return !!(page && !page.classList.contains('hidden') && currentSelectedProduct);
}

// 영업 상태는 고객센터 띠에 그려진 것을 그대로 가져옴
function syncChatStatus() {
  const text = document.getElementById('store-status-text');
  const dot = document.getElementById('store-status-dot');
  const t1 = document.getElementById('chat-status-text');
  const d1 = document.getElementById('chat-status-dot');
  if (t1 && text) t1.textContent = text.textContent;
  if (d1 && dot) d1.className = dot.className.replace(/\bw-\S+|\bh-\S+/g, '') + ' w-2 h-2 rounded-full';
}

function toggleChatPanel(open) {
  const panel = document.getElementById('chat-panel');
  const btn = document.getElementById('chat-toggle-btn');
  if (!panel) return;
  const show = typeof open === 'boolean' ? open : panel.classList.contains('hidden');
  if (show && typeof toggleWishPanel === 'function') toggleWishPanel(false);
  panel.classList.toggle('hidden', !show);
  if (btn) btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  if (!show) return;
  syncChatStatus();
  // 상품 페이지에서 열면 보던 상품을 자동으로
  const about = document.getElementById('chat-product');
  if (isProductPageOpen()) {
    const tp = typeof tProduct === 'function' ? tProduct(currentSelectedProduct) : currentSelectedProduct;
    about.textContent = chatT('chat_about', '문의 상품: {name}').replace('{name}', tp.name);
    about.dataset.productName = currentSelectedProduct.name; // 저장은 한국어 원본
    about.classList.remove('hidden');
  } else {
    about.classList.add('hidden');
    about.dataset.productName = '';
  }
  document.getElementById('chat-done').classList.add('hidden');
  setTimeout(() => { const n = document.getElementById('chat-name'); if (n && !n.value) n.focus(); }, 50);
}

function submitChatInquiry(e) {
  e.preventDefault();
  const phone = document.getElementById('chat-phone').value.trim();
  if (!isValidPhone(phone)) {
    alert(chatT('co_phone_invalid', '연락처를 숫자 10~11자리로 적어 주세요. (예: 010-1234-5678)'));
    return;
  }
  const now = new Date();
  const productName = document.getElementById('chat-product').dataset.productName || '';
  const inquiry = {
    id: makeId('inq'),
    name: document.getElementById('chat-name').value.trim(),
    phone,
    date: '미정',
    type: productName ? '특정 상품 문의' : '빠른 상담 (말풍선)',
    productName,
    message: document.getElementById('chat-message').value.trim(),
    createdDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    status: 'new',
    source: 'chat'
  };
  const inquiries = loadInquiries();
  inquiries.unshift(inquiry);
  saveInquiries(inquiries);
  try { if (typeof notifyInquiryToDiscord === 'function') notifyInquiryToDiscord(inquiry); } catch (err) { console.error('discord notify error:', err); }
  document.getElementById('chat-message').value = '';
  document.getElementById('chat-consent').checked = false;
  const done = document.getElementById('chat-done');
  done.textContent = chatT('chat_done', '남겨 주셔서 고마워요. 확인하는 대로 연락드릴게요.');
  done.classList.remove('hidden');
}

// 상품 페이지(휴대폰)에서는 아래 구매 버튼과 겹치지 않게 표시 (CSS: body.on-product-page)
function updateProductPageFlag() {
  document.body.classList.toggle('on-product-page', isProductPageOpen());
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('hashchange', () => setTimeout(updateProductPageFlag, 0));
  const originalOpen = openProductDetail;
  openProductDetail = function (...args) {
    const r = originalOpen.apply(this, args);
    updateProductPageFlag();
    return r;
  };
  updateProductPageFlag();
  window.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      const panel = document.getElementById('chat-panel');
      if (panel && !panel.classList.contains('hidden')) toggleChatPanel(false);
    }
  });
});
