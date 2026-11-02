// assets/js/admin/admin-popups.js
// 설담화 관리자: 공지·이벤트 팝업 관리
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 7. 팝업 슬라이더 관리 기능 (Admin Popups)
// ----------------------------------------------------
function initPopupsAdmin() {
  const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
  const masterToggle = document.getElementById('popup-master-toggle');
  const statusBadge = document.getElementById('popup-master-status-badge');
  if (masterToggle) masterToggle.checked = !!popups.enabled;
  if (statusBadge) {
    statusBadge.innerText = popups.enabled ? 'ON' : 'OFF';
    statusBadge.className = popups.enabled
      ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700'
      : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500';
  }

  renderPopupsTable();
  updateInternalTargetProductOptions();
}

function togglePopupMaster(checked) {
  const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
  popups.enabled = !!checked;
  savePopups(popups);
  initPopupsAdmin();
}

// 관리자 화면 표시용 HTML 이스케이프 (팝업 문구에 태그가 들어가도 그대로 글자로 보이게 함)
function escPopup(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function renderPopupsTable() {
  const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
  const tbody = document.getElementById('popups-table-body');
  const totalCountEl = document.getElementById('popups-total-count');
  const activeCountEl = document.getElementById('popups-active-count');
  const badgeEl = document.getElementById('popups-active-badge');

  const slides = popups.slides || [];
  // 순서 기준 정렬
  slides.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const activeCount = slides.filter(s => s.active).length;
  if (totalCountEl) totalCountEl.innerText = slides.length;
  if (activeCountEl) activeCountEl.innerText = activeCount;
  if (badgeEl) {
    badgeEl.innerText = activeCount;
    badgeEl.className = activeCount > 0
      ? 'text-[10px] bg-seal-red text-white font-bold px-1.5 py-0.5 rounded'
      : 'text-[10px] bg-ink-black/10 text-ink-black font-bold px-1.5 py-0.5 rounded';
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (slides.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-ink-light">등록된 팝업 슬라이드가 없습니다. [새 슬라이드]를 눌러 등록해 보세요.</td>
      </tr>
    `;
    return;
  }

  slides.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#FAF7F2] transition-colors';

    let periodText = '상시 노출';
    if (s.startDate && s.endDate) periodText = `${s.startDate} ~ ${s.endDate}`;
    else if (s.startDate) periodText = `${s.startDate}부터`;
    else if (s.endDate) periodText = `${s.endDate}까지`;

    let linkInfo = '링크 없음';
    if (s.linkType === 'url') linkInfo = '외부 링크';
    else if (s.linkType === 'internal') linkInfo = '사이트 내 메뉴';

    tr.innerHTML = `
      <td class="py-3 px-4 text-center font-bold text-ink-charcoal">${idx + 1}</td>
      <td class="py-3 px-4">
        <div class="w-12 h-12 rounded-xs bg-[#ECE8E1] border border-ink-black/10 overflow-hidden flex items-center justify-center">
          <img src="${escPopup(s.image)}" alt="${escPopup(s.title)}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/80x80?text=No+Img';">
        </div>
      </td>
      <td class="py-3 px-4">
        <div class="font-bold text-ink-black text-xs">${escPopup(s.title)}</div>
        <div class="text-[11px] text-ink-gray line-clamp-1 mt-0.5">${escPopup(s.text)}</div>
        <div class="text-[10px] text-ink-light mt-0.5">${linkInfo} · 버튼: "${escPopup(s.buttonLabel || '자세히 보기')}"</div>
      </td>
      <td class="py-3 px-4 text-[11px] text-ink-gray">${escPopup(periodText)}</td>
      <td class="py-3 px-4 text-center">
        <button onclick="toggleSlideActive('${escPopup(s.id)}')" class="px-2.5 py-1 text-[11px] font-bold rounded-xs transition-colors ${s.active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
          ${s.active ? '사용 중' : '중지됨'}
        </button>
      </td>
      <td class="py-3 px-4 text-center">
        <div class="flex items-center justify-center gap-1">
          <button onclick="moveSlideOrder('${escPopup(s.id)}', -1)" ${idx === 0 ? 'disabled' : ''} class="w-6 h-6 flex items-center justify-center border border-ink-black/10 rounded-xs text-[10px] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed">▲</button>
          <button onclick="moveSlideOrder('${escPopup(s.id)}', 1)" ${idx === slides.length - 1 ? 'disabled' : ''} class="w-6 h-6 flex items-center justify-center border border-ink-black/10 rounded-xs text-[10px] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed">▼</button>
        </div>
      </td>
      <td class="py-3 px-4 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="openSlideModal('${escPopup(s.id)}')" class="px-2 py-1 text-xs text-ink-black hover:text-seal-red font-bold">수정</button>
          <button onclick="deleteSlide('${escPopup(s.id)}')" class="px-2 py-1 text-xs text-gray-400 hover:text-rose-600 font-bold">삭제</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleSlideActive(id) {
  const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
  const slide = popups.slides.find(s => s.id === id);
  if (!slide) return;

  if (!slide.active) {
    const activeCount = popups.slides.filter(s => s.active).length;
    if (activeCount >= 5) {
      alert('활성 팝업 슬라이드는 최대 5개까지만 등록할 수 있습니다. 다른 슬라이드를 중지한 후 다시 시도해 주세요.');
      return;
    }
    slide.active = true;
  } else {
    slide.active = false;
  }

  savePopups(popups);
  renderPopupsTable();
}

function moveSlideOrder(id, direction) {
  const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
  const slides = popups.slides || [];
  slides.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const idx = slides.findIndex(s => s.id === id);
  if (idx === -1) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= slides.length) return;

  const temp = slides[idx];
  slides[idx] = slides[targetIdx];
  slides[targetIdx] = temp;

  slides.forEach((s, i) => s.order = i + 1);
  savePopups(popups);
  renderPopupsTable();
}

function updateInternalTargetProductOptions() {
  const select = document.getElementById('slide-internal-target');
  if (!select) return;
  const baseOptions = `
    <option value="story">설담화 이야기 (Story)</option>
    <option value="shop">꽃 둘러보기</option>
    <option value="custom">맞춤 담화 (큐레이터 & 상담)</option>
  `;

  const products = typeof loadAdminProducts === 'function' ? loadAdminProducts() : [];
  const visibleProducts = products.filter(p => typeof isProductVisible === 'function' ? isProductVisible(p) : true);

  let prodOptions = '';
  if (visibleProducts.length > 0) {
    prodOptions = '<optgroup label="상품 바로가기">' + visibleProducts.map(p => `
      <option value="product:${escapeHtml(p.id)}">상품: ${escapeHtml(p.name)}</option>
    `).join('') + '</optgroup>';
  }

  select.innerHTML = baseOptions + prodOptions;
}

function updateSlideImagePreview(url) {
  const preview = document.getElementById('slide-img-preview');
  if (preview) {
    preview.src = url || 'assets/images/story_bojagi_gift.jpg';
  }
}

function handleSlideLinkTypeChange() {
  const linkType = document.getElementById('slide-link-type')?.value || 'none';
  const urlWrap = document.getElementById('slide-url-wrap');
  const internalWrap = document.getElementById('slide-internal-wrap');

  if (urlWrap) {
    if (linkType === 'url') urlWrap.classList.remove('hidden');
    else urlWrap.classList.add('hidden');
  }
  if (internalWrap) {
    if (linkType === 'internal') internalWrap.classList.remove('hidden');
    else internalWrap.classList.add('hidden');
  }
}

function openSlideModal(id = null) {
  updateInternalTargetProductOptions();
  const modal = document.getElementById('slide-edit-modal');
  const modalTitle = document.getElementById('slide-modal-title');
  const form = document.getElementById('slide-edit-form');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('slide-edit-id').value = id || '';

  if (id) {
    const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
    const slide = popups.slides.find(s => s.id === id);
    if (slide) {
      if (modalTitle) modalTitle.innerText = '팝업 슬라이드 수정';
      document.getElementById('slide-image').value = slide.image || '';
      updateSlideImagePreview(slide.image);
      document.getElementById('slide-title').value = slide.title || '';
      document.getElementById('slide-text').value = slide.text || '';
      document.getElementById('slide-btn-label').value = slide.buttonLabel || '자세히 보기';
      document.getElementById('slide-title-en').value = slide.titleEn || '';
      document.getElementById('slide-text-en').value = slide.textEn || '';
      document.getElementById('slide-title-ja').value = slide.titleJa || '';
      document.getElementById('slide-text-ja').value = slide.textJa || '';

      const linkTypeSelect = document.getElementById('slide-link-type');
      if (linkTypeSelect) linkTypeSelect.value = slide.linkType || 'none';
      document.getElementById('slide-url').value = slide.url || '';
      const internalSelect = document.getElementById('slide-internal-target');
      if (internalSelect && slide.internalTarget) internalSelect.value = slide.internalTarget;

      document.getElementById('slide-start-date').value = slide.startDate || '';
      document.getElementById('slide-end-date').value = slide.endDate || '';
      document.getElementById('slide-active').checked = !!slide.active;
    }
  } else {
    if (modalTitle) modalTitle.innerText = '새 팝업 슬라이드 등록';
    document.getElementById('slide-image').value = 'assets/images/story_bojagi_gift.jpg';
    updateSlideImagePreview('assets/images/story_bojagi_gift.jpg');
    document.getElementById('slide-btn-label').value = '자세히 보기';
    document.getElementById('slide-link-type').value = 'internal';
    document.getElementById('slide-internal-target').value = 'story';
    document.getElementById('slide-active').checked = true;
  }

  handleSlideLinkTypeChange();
  modal.classList.remove('hidden');
}

function closeSlideModal() {
  const modal = document.getElementById('slide-edit-modal');
  if (modal) modal.classList.add('hidden');
}

function saveSlideForm(e) {
  e.preventDefault();
  const id = document.getElementById('slide-edit-id').value;
  const image = document.getElementById('slide-image').value.trim();
  const title = document.getElementById('slide-title').value.trim();
  const text = document.getElementById('slide-text').value.trim();
  const buttonLabel = document.getElementById('slide-btn-label').value.trim() || '자세히 보기';
  const titleEn = document.getElementById('slide-title-en').value.trim();
  const textEn = document.getElementById('slide-text-en').value.trim();
  const titleJa = document.getElementById('slide-title-ja').value.trim();
  const textJa = document.getElementById('slide-text-ja').value.trim();
  const linkType = document.getElementById('slide-link-type').value;
  const url = document.getElementById('slide-url').value.trim();
  const internalTarget = document.getElementById('slide-internal-target').value;
  const startDate = document.getElementById('slide-start-date').value;
  const endDate = document.getElementById('slide-end-date').value;
  const active = document.getElementById('slide-active').checked;

  if (!image || !title || !text) {
    alert('이미지 경로, 제목, 내용 문구는 필수 입력 항목입니다.');
    return;
  }

  if (linkType === 'url') {
    if (!url || typeof isValidPopupUrl !== 'function' || !isValidPopupUrl(url)) {
      alert('외부 링크는 반드시 https:// 또는 http:// 로 시작해야 합니다. 올바른 URL을 입력해 주세요.');
      return;
    }
  }

  const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
  const slides = popups.slides || [];

  // 활성 슬라이드 최대 5개 검증
  if (active) {
    const otherActiveCount = slides.filter(s => s.active && s.id !== id).length;
    if (otherActiveCount >= 5) {
      alert('활성 팝업 슬라이드는 최대 5개까지만 등록할 수 있습니다. 다른 슬라이드를 중지한 후 사용 설정해 주세요.');
      return;
    }
  }

  if (id) {
    const slide = slides.find(s => s.id === id);
    if (slide) {
      slide.image = image;
      slide.title = title;
      slide.text = text;
      slide.buttonLabel = buttonLabel;
      slide.titleEn = titleEn;
      slide.textEn = textEn;
      slide.titleJa = titleJa;
      slide.textJa = textJa;
      slide.linkType = linkType;
      slide.url = linkType === 'url' ? url : '';
      slide.internalTarget = linkType === 'internal' ? internalTarget : '';
      slide.startDate = startDate;
      slide.endDate = endDate;
      slide.active = active;
    }
  } else {
    const newOrder = slides.length > 0 ? Math.max(...slides.map(s => Number(s.order) || 0)) + 1 : 1;
    slides.push({
      id: 'slide-' + Date.now(),
      active,
      order: newOrder,
      image,
      title,
      text,
      buttonLabel,
      titleEn,
      textEn,
      titleJa,
      textJa,
      linkType,
      url: linkType === 'url' ? url : '',
      internalTarget: linkType === 'internal' ? internalTarget : '',
      startDate,
      endDate
    });
  }

  savePopups(popups);
  closeSlideModal();
  renderPopupsTable();
}

function deleteSlide(id) {
  if (!confirm('이 팝업 슬라이드를 삭제하시겠습니까?')) return;
  const popups = typeof loadPopups === 'function' ? loadPopups() : { enabled: false, slides: [] };
  popups.slides = (popups.slides || []).filter(s => s.id !== id);
  savePopups(popups);
  renderPopupsTable();
}

function previewPopupInShop() {
  window.open('index.html?popupPreview=1', '_blank');
}
