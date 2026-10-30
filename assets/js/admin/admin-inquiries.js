// assets/js/admin/admin-inquiries.js
// 설담화 관리자: 1:1 상담 문의 (직접 연락·메모)
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 4. 맞춤 담화 1:1 상담 문의 관리
function loadAdminInquiries() {
  const stored = localStorage.getItem('seoldamhwa_inquiries');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

function renderInquiriesList() {
  const inquiries = loadAdminInquiries();
  const container = document.getElementById('admin-inquiries-list');
  const badge = document.getElementById('inquiry-counter-badge');
  if (!container) return;

  const newCount = inquiries.filter(i => i.status === 'new').length;
  if (badge) badge.innerText = `연락 대기 ${newCount}건`;

  container.innerHTML = '';
  if (inquiries.length === 0) {
    container.innerHTML = '<div class="p-8 text-center text-sm text-ink-gray bg-[#FAF7F2] border border-ink-black/10 rounded-sm">접수된 문의가 없어요.</div>';
    return;
  }

  const sorted = inquiries.slice().sort((a, b) => (a.status === 'new' ? 0 : 1) - (b.status === 'new' ? 0 : 1) || String(b.createdDate || '').localeCompare(String(a.createdDate || '')));
  sorted.forEach(inq => {
    const isNew = inq.status === 'new';
    const oldReplies = Array.isArray(inq.replies) ? inq.replies : [];
    const card = document.createElement('div');
    card.className = `p-4 sm:p-5 rounded-sm border ${isNew ? 'bg-white border-seal-red/40 shadow-xs' : 'bg-[#FAF7F2]/80 border-ink-black/10'}`;
    const phoneDigits = String(inq.phone || '').replace(/[^0-9+]/g, '');
    card.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 text-sm">
        ${isNew ? '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-seal-red text-white">연락 대기</span>' : `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">연락 완료${inq.contactedAt ? ` · ${escapeHtml(String(inq.contactedAt).replace('T', ' ').slice(5, 16))}` : ''}</span>`}
        <span class="font-bold text-ink-black">${escapeHtml(inq.name)} 님</span>
        <span class="text-ink-black font-mono">${escapeHtml(inq.phone)}</span>
        <span class="text-ink-light text-xs ml-auto">접수 ${escapeHtml(inq.createdDate || '-')}</span>
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-gray mt-2">
        <span>상담 유형: <strong class="text-ink-black">${escapeHtml(inq.type || inq.productName || '일반 상담')}</strong></span>
        ${inq.productName && inq.productName !== inq.type ? `<span>문의 상품: <strong class="text-seal-red">${escapeHtml(inq.productName)}</strong></span>` : ''}
        <span>받고 싶은 날짜: <strong class="text-seal-red">${escapeHtml(inq.date)}</strong></span>
      </div>
      <div class="mt-2 bg-[#FAF7F2] p-3 rounded-xs border border-ink-black/10 text-sm text-ink-black leading-relaxed">${escapeHtml(inq.message || '').replace(/\n/g, '<br>')}</div>
      ${oldReplies.length ? `<details class="mt-2 text-xs"><summary class="cursor-pointer text-ink-gray">지난 답변 기록 ${oldReplies.length}건</summary>${oldReplies.map(r => `<p class="mt-1 p-2 bg-emerald-50 border border-emerald-200 rounded-xs">${escapeHtml(String(r.at || '').replace('T', ' ').slice(0, 16))} · ${escapeHtml(r.text)}</p>`).join('')}</details>` : ''}

      <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <a href="tel:${escapeHtml(phoneDigits)}" class="px-3 py-1.5 bg-ink-black text-white font-bold rounded-xs hover:bg-seal-red">📞 전화하기</a>
        <a href="sms:${escapeHtml(phoneDigits)}" class="px-3 py-1.5 border border-ink-black/20 bg-white font-bold rounded-xs hover:border-ink-black">💬 문자 보내기</a>
        <button type="button" onclick="copyInquiryPhone('${inq.id}', this)" class="px-3 py-1.5 border border-ink-black/20 bg-white font-bold rounded-xs cursor-pointer hover:border-ink-black">번호 복사</button>
        ${isNew
          ? `<button type="button" onclick="markInquiryDone('${inq.id}')" class="ml-auto px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-xs cursor-pointer hover:opacity-90">✓ 연락 완료로 표시</button>`
          : `<button type="button" onclick="reopenInquiry('${inq.id}')" class="ml-auto px-3 py-1.5 text-ink-gray underline cursor-pointer">다시 연락 대기로</button>`}
      </div>
      <div class="mt-2 flex gap-1.5 text-xs">
        <input type="text" id="inq-memo-${inq.id}" value="${escapeHtml(inq.memo || '')}" maxlength="120" placeholder="메모 (손님에게는 안 보여요) 예: 11/3 통화, 60만원 견적 안내" class="flex-1 min-w-0 bg-white border border-ink-black/15 p-1.5 rounded-xs">
        <button type="button" onclick="saveInquiryMemo('${inq.id}', this)" class="px-3 py-1.5 border border-ink-black/20 bg-white font-bold rounded-xs cursor-pointer hover:border-ink-black">메모 저장</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function updateInquiry(inquiryId, patch) {
  const inquiries = loadAdminInquiries().map(inq => inq.id === inquiryId ? { ...inq, ...patch } : inq);
  localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(inquiries));
}

function copyInquiryPhone(inquiryId, btn) {
  const inq = loadAdminInquiries().find(i => i.id === inquiryId);
  if (!inq) return;
  navigator.clipboard.writeText(inq.phone || '').then(() => {
    btn.innerText = '복사했어요';
    setTimeout(() => { btn.innerText = '번호 복사'; }, 1500);
  }).catch(() => {});
}

function saveInquiryMemo(inquiryId, btn) {
  const memo = document.getElementById(`inq-memo-${inquiryId}`).value.trim();
  updateInquiry(inquiryId, { memo });
  btn.innerText = '저장했어요';
  setTimeout(() => { btn.innerText = '메모 저장'; }, 1500);
}

function reopenInquiry(inquiryId) {
  updateInquiry(inquiryId, { status: 'new', contactedAt: '' });
  renderInquiriesList();
  renderDashboard();
}

function markInquiryDone(inquiryId) {
  let inquiries = loadAdminInquiries();
  const now = new Date();
  const contactedAt = `${toDateStr(now)}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  inquiries = inquiries.map(inq => inq.id === inquiryId ? { ...inq, status: 'done', contactedAt } : inq);
  localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(inquiries));
  renderInquiriesList();
  renderDashboard();
}
