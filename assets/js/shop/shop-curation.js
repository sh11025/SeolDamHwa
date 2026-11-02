// assets/js/shop/shop-curation.js
// 설담화 쇼핑몰: 맞춤 담화 큐레이터 (질문·점수·추천 결과)
// index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

const RECIPIENT_PHRASES = {
  '연인': '연인에게',
  '부모님·어른': '부모님께',
  '친구': '친구에게',
  '동료·상사': '동료·상사분께',
  '직장 동료·상사': '동료·상사분께',
  '스승·은인': '스승님께',
  '나에게': '나를 위한',
  '공간·기업': '공간 연출에'
};

const OCCASION_PHRASES = {
  '생일': '생일 선물로',
  '기념일·프러포즈': '기념일에',
  '졸업·입학': '졸업·입학 축하로',
  '승진·개업': '개업·승진 축하로',
  '결혼·상견례': '결혼·상견례 자리에',
  '어버이날·스승의날': '어버이날·스승의날에',
  '위로·병문안': '병문안·위로의 마음으로',
  '특별한 날 없이': '일상의 선물로'
};

// 5단계 질문 및 선택지 정의
const CURATION_QUESTIONS = [
  {
    step: 1,
    titleKey: 'curation_q1',
    title: '누구에게 선물하시나요?',
    field: 'recipient',
    canSkip: false,
    options: [
      { label: '연인', i18nKey: 'opt_recipient_lover' },
      { label: '부모님·어른', i18nKey: 'opt_recipient_parent' },
      { label: '친구', i18nKey: 'opt_recipient_friend' },
      { label: '동료·상사', i18nKey: 'opt_recipient_colleague' },
      { label: '스승·은인', i18nKey: 'opt_recipient_mentor' },
      { label: '나에게', i18nKey: 'opt_recipient_me' },
      { label: '공간·기업', i18nKey: 'opt_recipient_space' }
    ]
  },
  {
    step: 2,
    titleKey: 'curation_q2',
    title: '어떤 날인가요?',
    field: 'occasion',
    canSkip: false,
    options: [
      { label: '생일', i18nKey: 'opt_occasion_birthday' },
      { label: '기념일·프러포즈', i18nKey: 'opt_occasion_anniversary' },
      { label: '졸업·입학', i18nKey: 'opt_occasion_grad' },
      { label: '승진·개업', i18nKey: 'opt_occasion_promote' },
      { label: '결혼·상견례', i18nKey: 'opt_occasion_wedding' },
      { label: '어버이날·스승의날', i18nKey: 'opt_occasion_parents_day' },
      { label: '위로·병문안', i18nKey: 'opt_occasion_comfort' },
      { label: '특별한 날 없이', i18nKey: 'opt_occasion_just' }
    ]
  },
  {
    step: 3,
    titleKey: 'curation_q3',
    title: '어떤 마음을 전하고 싶으세요?',
    field: 'feeling',
    canSkip: false,
    options: [
      { label: '축하', i18nKey: 'opt_feeling_congrat' },
      { label: '감사', i18nKey: 'opt_feeling_thanks' },
      { label: '사랑', i18nKey: 'opt_feeling_love' },
      { label: '응원', i18nKey: 'opt_feeling_cheer' },
      { label: '위로', i18nKey: 'opt_feeling_comfort' },
      { label: '공간 연출', i18nKey: 'opt_feeling_space' }
    ]
  },
  {
    step: 4,
    titleKey: 'curation_q4',
    title: '어떤 색이 좋으세요?',
    field: 'color',
    canSkip: true,
    options: [
      { label: '레드·버건디', i18nKey: 'opt_color_red', colorStyle: 'background-color: #8B1E2D;' },
      { label: '핑크·피치', i18nKey: 'opt_color_pink', colorStyle: 'background-color: #F2B8C6;' },
      { label: '화이트·그린', i18nKey: 'opt_color_white', colorStyle: 'background: linear-gradient(135deg, #EEF2E6 50%, #7A9A6A 50%);' },
      { label: '옐로우·오렌지', i18nKey: 'opt_color_yellow', colorStyle: 'background-color: #F4C542;' },
      { label: '블루·퍼플', i18nKey: 'opt_color_blue', colorStyle: 'background-color: #4B5FA8;' },
      { label: '여러 색 섞어서', i18nKey: 'opt_color_mix', colorStyle: 'background: conic-gradient(#8B1E2D, #F4C542, #7A9A6A, #4B5FA8, #F2B8C6, #8B1E2D);' },
      { label: '잘 모르겠어요', i18nKey: 'opt_color_neutral', isNeutral: true }
    ]
  },
  {
    step: 5,
    titleKey: 'curation_q5',
    title: '예산은 어느 정도 생각하세요?',
    field: 'budget',
    canSkip: true,
    options: [
      { label: '3만원 이하', i18nKey: 'opt_budget_under30' },
      { label: '3~5만원', i18nKey: 'opt_budget_30to50' },
      { label: '5~7만원', i18nKey: 'opt_budget_50to70' },
      { label: '7~10만원', i18nKey: 'opt_budget_70to100' },
      { label: '10만원 이상', i18nKey: 'opt_budget_over100' },
      { label: '상담 후 결정', i18nKey: 'opt_budget_consult' }
    ]
  }
];

let currentCurationStep = 1;
let curationAnswers = {
  recipient: null,
  occasion: null,
  feeling: null,
  color: null,
  budget: null
};

// 상품의 새로운 5단계 예산 티어 판별 헬퍼
function getProductBudgetTiers(p) {
  if (p.inquiryOnly) {
    return ['상담 후 결정'];
  }
  const prices = (p.sizes && p.sizes.length > 0)
    ? p.sizes.map(s => Number(s.price) || 0)
    : [Number(p.price) || 0];

  const tiers = new Set();
  prices.forEach(price => {
    if (price <= 30000) tiers.add('3만원 이하');
    else if (price <= 50000) tiers.add('3~5만원');
    else if (price <= 70000) tiers.add('5~7만원');
    else if (price <= 100000) tiers.add('7~10만원');
    else tiers.add('10만원 이상');
  });
  return Array.from(tiers);
}

// Stepper UI 초기화
function initCurationUI() {
  renderCurationStep(currentCurationStep);
}

// 특정 스텝 렌더링
function renderCurationStep(stepNum) {
  currentCurationStep = Math.max(1, Math.min(5, stepNum));
  const q = CURATION_QUESTIONS[currentCurationStep - 1];
  if (!q) return;

  // 프로그레스 바 (20% ~ 100%)
  const bar = document.getElementById('curation-progress-bar');
  if (bar) bar.style.width = `${currentCurationStep * 20}%`;

  // 뱃지 및 타이틀
  const badge = document.getElementById('curation-step-badge');
  if (badge) badge.innerText = typeof t === 'function' ? t('curation_step_fmt', '{step}단계 / 5단계').replace('{step}', currentCurationStep) : `${currentCurationStep}단계 / 5단계`;
  const title = document.getElementById('curation-question-title');
  if (title) title.innerText = typeof t === 'function' ? t(q.titleKey, q.title) : q.title;

  // [이전] 버튼 토글
  const prevBtn = document.getElementById('curation-prev-btn');
  if (prevBtn) {
    if (currentCurationStep > 1) prevBtn.classList.remove('hidden');
    else prevBtn.classList.add('hidden');
  }

  // [건너뛰기] 버튼 토글 (4~5단계)
  const skipBtn = document.getElementById('curation-skip-btn');
  if (skipBtn) {
    if (q.canSkip) skipBtn.classList.remove('hidden');
    else skipBtn.classList.add('hidden');
  }

  // 이전 선택된 태그 목록 렌더링 (클릭 시 해당 단계로 복귀)
  renderCurationTagsBar();

  // 3단계 이상 답변 시 [내게 어울리는 꽃 보기] 버튼 표시
  const finishWrap = document.getElementById('curation-finish-btn-wrap');
  if (finishWrap) {
    if (curationAnswers.recipient && curationAnswers.occasion && curationAnswers.feeling) {
      finishWrap.classList.remove('hidden');
    } else {
      finishWrap.classList.add('hidden');
    }
  }

  // 옵션 버튼 그리드 렌더링
  const grid = document.getElementById('curation-options-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const currentVal = curationAnswers[q.field];

  q.options.forEach(opt => {
    const isSelected = currentVal === opt.label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `min-h-[52px] text-xs sm:text-sm font-medium rounded-xs border p-3 flex items-center justify-center transition-all cursor-pointer text-center relative ${isSelected ? 'border-seal-red bg-[#FAF7F2] text-seal-red font-bold ring-1 ring-seal-red/20 shadow-xs' : 'border-ink-black/15 bg-white text-ink-black hover:border-seal-red/50 hover:bg-[#FAF7F2]/50'}`;

    let swatchHtml = '';
    if (opt.colorStyle) {
      swatchHtml = `<span class="w-4 h-4 rounded-full inline-block shrink-0 border border-black/10 shadow-2xs mr-2" style="${opt.colorStyle}"></span>`;
    } else if (opt.isNeutral) {
      swatchHtml = `<span class="w-4 h-4 rounded-full inline-block shrink-0 border border-dashed border-ink-black/40 mr-2 bg-black/5"></span>`;
    }

    const checkMark = isSelected ? '<span class="text-seal-red font-bold ml-1.5 shrink-0">✓</span>' : '';

    const optLabel = typeof t === 'function' && opt.i18nKey ? t(opt.i18nKey, opt.label) : opt.label;
    btn.innerHTML = `<span class="flex items-center justify-center">${swatchHtml}<span>${optLabel}</span>${checkMark}</span>`;

    btn.onclick = () => selectCurationAnswer(q.field, opt.label);
    grid.appendChild(btn);
  });
}

// 선택된 태그 바 렌더링
function renderCurationTagsBar() {
  const bar = document.getElementById('curation-tags-bar');
  if (!bar) return;
  bar.innerHTML = '';

  CURATION_QUESTIONS.forEach(q => {
    const val = curationAnswers[q.field];
    if (val) {
      const opt = q.options.find(o => o.label === val);
      const displayVal = (typeof t === 'function' && opt && opt.i18nKey)
        ? t(opt.i18nKey, val)
        : val;
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-seal-red/30 text-seal-red text-[11px] font-bold hover:bg-seal-red/10 cursor-pointer transition-colors';
      tag.innerHTML = `<span>${displayVal}</span><span class="text-seal-red/70">✕</span>`;
      tag.onclick = () => goToStep(q.step);
      bar.appendChild(tag);
    }
  });
}

// 특정 단계로 이동
function goToStep(stepNum) {
  renderCurationStep(stepNum);
}

// 이전 단계로 이동
function goToPrevStep() {
  if (currentCurationStep > 1) {
    goToStep(currentCurationStep - 1);
  }
}

// 건너뛰기 처리 (4단계 또는 5단계)
function skipCurrentStep() {
  const q = CURATION_QUESTIONS[currentCurationStep - 1];
  if (q) curationAnswers[q.field] = null;

  if (currentCurationStep === 4) {
    goToStep(5);
  } else if (currentCurationStep === 5) {
    executeCustomRecommendation();
  }
}

// 선택지 선택 핸들러 (선택 후 자동으로 다음 스텝 이동)
function selectCurationAnswer(field, value) {
  curationAnswers[field] = value;

  // 3단계 완료 시 결과 버튼 활성화
  const finishWrap = document.getElementById('curation-finish-btn-wrap');
  if (finishWrap && curationAnswers.recipient && curationAnswers.occasion && curationAnswers.feeling) {
    finishWrap.classList.remove('hidden');
  }

  // 태그 바 갱신
  renderCurationTagsBar();

  // UI에 선택 상태 즉시 반영 후 다음 스텝 이동
  renderCurationStep(currentCurationStep);

  setTimeout(() => {
    if (currentCurationStep < 5) {
      goToStep(currentCurationStep + 1);
    } else {
      executeCustomRecommendation();
    }
  }, 220);
}

// 처음부터 다시 고르기 리셋
function resetCuration() {
  curationAnswers = {
    recipient: null,
    occasion: null,
    feeling: null,
    color: null,
    budget: null
  };
  currentCurationStep = 1;
  const resSection = document.getElementById('curation-results-section');
  if (resSection) resSection.classList.add('hidden');
  renderCurationStep(1);

  const card = document.getElementById('curation-stepper-card');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 예산 안내 박스에서 1:1 상담 신청 폼으로 이동 및 값 자동 채움
function applyBudgetInquiry() {
  switchView('custom');
  initInquiryProductOptions();
  
  const typeSelect = document.getElementById('inquiry-type');
  if (typeSelect) typeSelect.value = '맞춤 꽃다발·꽃바구니 제작';
  handleInquiryTypeChange();

  const msgEl = document.getElementById('inquiry-message');
  if (msgEl) {
    msgEl.value = `[맞춤 담화 선택 조건]
- 대상: ${curationAnswers.recipient || '미선택'}
- 상황: ${curationAnswers.occasion || '미선택'}
- 마음: ${curationAnswers.feeling || '미선택'}
- 선호 색상: ${curationAnswers.color || '선택 안 함'}
- 희망 예산: ${curationAnswers.budget || '상담 후 결정'}

위 조건과 예산에 맞춰 1:1 꽃 제작 상담을 신청합니다.`;
  }

  setTimeout(() => {
    const formSec = document.getElementById('custom-inquiry-section');
    if (formSec) {
      formSec.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}


// 맞춤 추천 사유 언어별 서식 헬퍼
function formatCurationReason(answers, matchedParts, lang) {
  if (lang === 'en') {
    const rMapEn = {
      '연인': 'your partner',
      '부모님·어른': 'parents & elders',
      '친구': 'a friend',
      '동료·상사': 'colleagues',
      '스승·은인': 'your mentor',
      '나에게': 'yourself',
      '공간·기업': 'space styling'
    };
    const oMapEn = {
      '생일': 'a birthday celebration',
      '기념일·프러포즈': 'an anniversary & proposal',
      '졸업·입학': 'graduation & new beginnings',
      '승진·개업': 'promotion & opening',
      '결혼·상견례': 'wedding & celebration',
      '어버이날·스승의날': "Parents' & Teachers' Day",
      '위로·병문안': 'comfort & warm thoughts',
      '특별한 날 없이': 'everyday life'
    };
    const fMapEn = {
      '축하': 'celebration',
      '감사': 'gratitude',
      '사랑': 'love',
      '응원': 'cheering',
      '위로': 'comfort',
      '공간 연출': 'styling'
    };

    const parts = [];
    if (answers.recipient && rMapEn[answers.recipient]) {
      parts.push(`For ${rMapEn[answers.recipient]}`);
    }
    if (answers.occasion && oMapEn[answers.occasion]) {
      parts.push(`for ${oMapEn[answers.occasion]}`);
    }
    if (parts.length === 0 && answers.feeling && fMapEn[answers.feeling]) {
      parts.push(`With ${fMapEn[answers.feeling]}`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'Perfect Bespoke Choice';
  }

  if (lang === 'ja') {
    const rMapJa = {
      '연인': '大切な恋人',
      '부모님·어른': 'ご両親・目上の方',
      '친구': '親しいご友人',
      '동료·상사': '職場の同僚・上司',
      '스승·은인': '恩師・恩人',
      '나에게': '自分へのご褒美',
      '공간·기업': '空間・オフィス'
    };
    const oMapJa = {
      '생일': 'お誕生日のお祝い',
      '기념일·프러포즈': '記念日・プロポーズ',
      '졸업·입학': '卒業・入学の門出',
      '승진·개업': '昇進・開業の祝祭',
      '결혼·상견례': 'ご結婚・お顔合わせ',
      '어버이날·스승의날': '母の日・感謝の節目',
      '위로·병문안': 'お見舞い・安らぎ',
      '특별한 날 없이': '日常の彩り'
    };
    const fMapJa = {
      '축하': '祝福の想い',
      '감사': '感謝の心',
      '사랑': '溢れる愛',
      '응원': '温かなエール',
      '위로': '慰めと癒やし',
      '공간 연출': '空間の調和'
    };

    const parts = [];
    if (answers.recipient && rMapJa[answers.recipient]) {
      parts.push(`${rMapJa[answers.recipient]}への贈り物に`);
    }
    if (answers.occasion && oMapJa[answers.occasion]) {
      parts.push(`${oMapJa[answers.occasion]}に`);
    }
    if (parts.length === 0 && answers.feeling && fMapJa[answers.feeling]) {
      parts.push(`${fMapJa[answers.feeling]}を込めて`);
    }
    return parts.length > 0 ? parts.join(' · ') : '心に寄り添うお誂えの提案';
  }

  // ko
  if (matchedParts && matchedParts.length > 0) {
    return matchedParts.join(' · ');
  }
  const recipPhrase = (answers.recipient && RECIPIENT_PHRASES[answers.recipient]) || '소중한 분을 위한';
  return `${recipPhrase} 정갈한 선물로 추천해요`;
}

// 큐레이션 추천 알고리즘 실행
function executeCustomRecommendation() {
  const products = loadProducts();
  const tags = typeof CURATION_TAGS !== 'undefined' ? CURATION_TAGS : {};

  // 상담 전용 상품 노출 허용 조건 검증
  const isAllowedInquiryOnly = (
    curationAnswers.recipient === '공간·기업' ||
    curationAnswers.feeling === '공간 연출' ||
    curationAnswers.occasion === '결혼·상견례' ||
    curationAnswers.occasion === '승진·개업'
  );

  // 각 상품별 매칭 점수 계산
  const scored = [];

  products.forEach(p => {
    // 비공개 상품 및 예약 미도래 상품 제외 (B4)
    if (typeof isProductVisible === 'function' && !isProductVisible(p)) {
      return;
    }
    // inquiryOnly 상품 제한: 허용 조건에 맞지 않으면 완전히 제외
    if (p.inquiryOnly && !isAllowedInquiryOnly) {
      return;
    }

    let score = 0;
    const matchedParts = [];
    const pTags = tags[p.id] || p.curationTags;

    if (pTags) {
      // 누구에게 (가중치 3)
      let recipientPhrase = '';
      if (curationAnswers.recipient) {
        const r = curationAnswers.recipient;
        if (pTags.recipients?.includes(r) || (r === '동료·상사' && pTags.recipients?.includes('직장 동료·상사'))) {
          score += 3;
          recipientPhrase = RECIPIENT_PHRASES[r] || `${r}께`;
          matchedParts.push(recipientPhrase);
        }
      }
      // 어떤 날 (가중치 3)
      let occasionPhrase = '';
      if (curationAnswers.occasion && pTags.occasions?.includes(curationAnswers.occasion)) {
        score += 3;
        occasionPhrase = OCCASION_PHRASES[curationAnswers.occasion] || `${curationAnswers.occasion}에`;
        matchedParts.push(occasionPhrase);
      }
      // 어떤 마음 (가중치 2) - 중복 단어 방지
      if (curationAnswers.feeling && pTags.feelings?.includes(curationAnswers.feeling)) {
        score += 2;
        const f = curationAnswers.feeling;
        const isOverlap = recipientPhrase && (recipientPhrase.includes(f) || (f === '공간 연출' && recipientPhrase.includes('공간')));
        if (!isOverlap) {
          matchedParts.push(`${f}의 마음을 담기 좋아요`);
        } else if (matchedParts.length > 0) {
          const lastIdx = matchedParts.length - 1;
          if (matchedParts[lastIdx].endsWith('로') || matchedParts[lastIdx].endsWith('에')) {
            matchedParts[lastIdx] = matchedParts[lastIdx] + ' 좋아요';
          }
        }
      }
      // 어떤 색 (가중치 2)
      if (curationAnswers.color && curationAnswers.color !== '잘 모르겠어요' && pTags.colors?.includes(curationAnswers.color)) {
        score += 2;
      }
    } else {
      score = 1;
    }

    // 예산은? (가중치 2, 명백히 벗어나면 -2)
    if (curationAnswers.budget) {
      const tiers = getProductBudgetTiers(p);
      if (tiers.includes(curationAnswers.budget)) {
        score += 2;
      }
      if (p.inquiryOnly) {
        if (curationAnswers.budget !== '상담 후 결정') score -= 2;
      } else {
        const prices = (p.sizes && p.sizes.length > 0) ? p.sizes.map(s => Number(s.price) || 0) : [Number(p.price) || 0];
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        if (curationAnswers.budget === '상담 후 결정') score -= 2;
        else if (curationAnswers.budget === '10만원 이상' && maxP < 100000) score -= 2;
        else if (curationAnswers.budget === '3만원 이하' && minP > 30000) score -= 2;
        else if (curationAnswers.budget === '3~5만원' && (minP > 50000 || maxP < 30000)) score -= 2;
        else if (curationAnswers.budget === '5~7만원' && (minP > 70000 || maxP < 50000)) score -= 2;
        else if (curationAnswers.budget === '7~10만원' && (minP > 100000 || maxP < 70000)) score -= 2;
      }
    }

    // 자연스러운 추천 사유 구성 (언어별 대응)
    const curLang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
    const reasonText = formatCurationReason(curationAnswers, matchedParts, curLang);

    scored.push({
      product: p,
      score: score,
      reason: reasonText
    });
  });

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.score - a.score);

  // 상위 3위에 들 수 있었으나 품절(stockQuantity === 0)로 건너뛰어지는 상품 탐지
  const top3Candidates = scored.slice(0, 3);
  const skippedSoldOut = top3Candidates.find(item => item.product.stockQuantity === 0);

  // 실제 전시할 재고 보유 상품 상위 3개 선별
  const inStockItems = scored.filter(item => item.product.stockQuantity > 0);
  const displayTop3 = inStockItems.slice(0, 3);
  lastCuratedProducts = displayTop3.map(item => item.product);

  // 선택한 예산에 정확히 부합하는 상품이 있는지 검사
  let hasExactBudget = true;
  if (curationAnswers.budget && curationAnswers.budget !== '상담 후 결정') {
    hasExactBudget = products.some(p => getProductBudgetTiers(p).includes(curationAnswers.budget));
  }

  renderCurationResults(displayTop3, skippedSoldOut ? skippedSoldOut.product : null, hasExactBudget);
}

// 추천 결과 3개 카드 렌더링
function renderCurationResults(topItems, soldOutProduct, hasExactBudget) {
  const container = document.getElementById('curation-cards-grid');
  const section = document.getElementById('curation-results-section');
  const noticeEl = document.getElementById('curation-soldout-notice');
  const budgetNoticeBox = document.getElementById('curation-budget-notice-box');
  const headingEl = document.getElementById('curation-result-heading');
  const descEl = document.getElementById('curation-result-desc');
  if (!container || !section) return;

  // 예산 미달성/준비 중 안내 박스 처리
  if (!hasExactBudget) {
    if (budgetNoticeBox) budgetNoticeBox.classList.remove('hidden');
    if (headingEl) headingEl.innerText = typeof t === 'function' ? t('curation_res_alt_title', '예산보다 조금 높지만 잘 어울리는 꽃') : '예산보다 조금 높지만 잘 어울리는 꽃';
  } else {
    if (budgetNoticeBox) budgetNoticeBox.classList.add('hidden');
    if (headingEl) headingEl.innerText = typeof t === 'function' ? t('curation_res_title', '선택하신 마음에 어울리는 꽃 제안') : '선택하신 마음에 어울리는 꽃 제안';
  }
  if (descEl) {
    descEl.innerText = typeof t === 'function' ? t('curation_res_desc', '설담화 화훼 장인이 선별한 최적의 꽃과 선물 3가지입니다.') : '설담화 화훼 장인이 선별한 최적의 꽃과 선물 3가지입니다.';
  }

  container.innerHTML = '';

  topItems.forEach((item, index) => {
    const p = item.product;
    const tp = typeof tProduct === 'function' ? tProduct(p) : p;
    const isBest = index === 0;
    
    let priceText = '';
    if (p.inquiryOnly) {
      priceText = typeof t === 'function' ? t('inquiry_price_label', '상담 후 견적') : '상담 후 견적';
    } else if (p.sizes && p.sizes.length > 0) {
      const minPrice = Math.min(...p.sizes.map(s => s.price));
      priceText = `${formatPrice(minPrice)}${p.sizes.length >= 2 ? '~' : ''}`;
    } else {
      priceText = formatPrice(p.price || 0);
    }

    const isOutOfStock = p.stockQuantity === 0;

    const bestBadgeText = typeof t === 'function' ? t('curation_best_badge', '★ 가장 잘 어울려요') : '★ 가장 잘 어울려요';
    const recBadgeText = typeof t === 'function' ? t('curation_rec_fmt', '추천 {n}').replace('{n}', index + 1) : `추천 ${index + 1}`;
    const soldoutText = typeof t === 'function' ? t('stock_soldout', '일시 품절') : '일시 품절';
    const detailBtnText = typeof t === 'function' ? t('btn_detail', '자세히 보기') : '자세히 보기';
    const consultBtnText = typeof t === 'function' ? t('btn_consult', '1:1 상담') : '1:1 상담';
    const orderBtnText = typeof t === 'function' ? t('btn_order', '주문하기') : '주문하기';

    const card = document.createElement('div');
    card.className = `p-4 sm:p-5 rounded-xs border flex flex-col justify-between transition-all ${isBest ? 'bg-white border-seal-red shadow-md ring-1 ring-seal-red/20' : 'bg-[#FAF7F2] border-ink-black/10'}`;

    card.innerHTML = `
      <div class="space-y-3">
        <div class="relative aspect-[4/3] rounded-xs overflow-hidden bg-[#ECE8E1]">
          <img loading="lazy" decoding="async" src="${p.image}" alt="${tp.name}" class="w-full h-full object-cover">
          ${isBest ? `
            <span class="absolute top-2.5 left-2.5 bg-seal-red text-white text-[11px] font-bold px-2.5 py-1 rounded-xs shadow">
              ${bestBadgeText}
            </span>
          ` : `
            <span class="absolute top-2.5 left-2.5 bg-ink-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-xs shadow">
              ${recBadgeText}
            </span>
          `}
          ${isOutOfStock ? `
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span class="bg-ink-black text-white text-xs font-bold px-3 py-1 rounded-xs">${soldoutText}</span>
            </div>
          ` : ''}
        </div>

        <div class="space-y-1">
          <span class="inline-block text-[11px] font-bold text-seal-red bg-seal-red/10 px-2 py-0.5 rounded-full">
            ${item.reason}
          </span>
          <h4 class="font-bold text-base text-ink-black">${tp.name}</h4>
          <p class="font-serif text-xs text-seal-red italic line-clamp-1">"${tp.poeticLine}"</p>
          <p class="font-bold text-sm text-ink-black pt-1">${priceText}</p>
        </div>
      </div>

      <div class="pt-4 mt-2 border-t border-ink-black/10 flex gap-2">
        <button type="button" onclick="openProductDetail('${p.id}')" class="jakae-btn flex-1 py-2.5 px-3 text-xs font-bold rounded-xs cursor-pointer shadow-xs text-center">
          ${detailBtnText}
        </button>
        ${p.inquiryOnly ? `
          <button type="button" onclick="goToCustomInquiry('${p.id}')" class="jakae-light-btn flex-1 py-2.5 px-3 text-xs font-bold rounded-xs border border-seal-red/40 hover:border-seal-red cursor-pointer shadow-xs text-center">
            ${consultBtnText}
          </button>
        ` : `
          <button type="button" onclick="openProductDetail('${p.id}')" class="jakae-light-btn flex-1 py-2.5 px-3 text-xs font-bold rounded-xs border border-seal-red/40 hover:border-seal-red cursor-pointer shadow-xs text-center">
            ${orderBtnText}
          </button>
        `}
      </div>
    `;

    container.appendChild(card);
  });

  // 품절 상품 안내 문구 렌더링
  if (noticeEl) {
    if (soldOutProduct) {
      const soldOutTrans = typeof tProduct === 'function' ? tProduct(soldOutProduct) : soldOutProduct;
      noticeEl.textContent = typeof t === 'function'
        ? t('curation_soldout_fmt', "'{name}'도 잘 어울리지만 지금은 일시 품절이에요. 상담으로 입고 일정을 문의해 주세요.").replace('{name}', soldOutTrans.name)
        : `'${soldOutTrans.name}'도 잘 어울리지만 지금은 일시 품절이에요. 상담으로 입고 일정을 문의해 주세요.`;
      noticeEl.classList.remove('hidden');
    } else {
      noticeEl.textContent = '';
      noticeEl.classList.add('hidden');
    }
  }

  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

    function applyCurationToInquiry() {
  switchView('custom');
  initInquiryProductOptions();

  const typeSelect = document.getElementById('inquiry-type');
  if (typeSelect) typeSelect.value = '맞춤 꽃다발·꽃바구니 제작';
  handleInquiryTypeChange();

  const msgEl = document.getElementById('inquiry-message');
  if (msgEl) {
    const topProdNames = (lastCuratedProducts || []).map(p => p.name).join(', ');
    msgEl.value = `[맞춤 담화 추천 결과 기반 상담 신청]
- 추천된 상품: ${topProdNames || '없음'}
- 대상: ${curationAnswers.recipient || '미선택'}
- 상황: ${curationAnswers.occasion || '미선택'}
- 마음: ${curationAnswers.feeling || '미선택'}
- 선호 색상: ${curationAnswers.color || '선택 안 함'}
- 예산: ${curationAnswers.budget || '상담 후 결정'}

위 추천 결과를 바탕으로 1:1 맞춤 꽃 상담을 요청합니다.`;
  }

  setTimeout(() => {
    const formSec = document.getElementById('custom-inquiry-section');
    if (formSec) {
      formSec.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}
// 상담 유형 변경 핸들러

/* ---------- 홈 '맞춤 담화' 띠: 꽃을 하나씩 짚어 보다가 하나를 골라 주는 움직임 ---------- */
let ctaPickerTimer = null;

function ctaPickerCaptions() {
  const tt = (k, f) => (typeof t === 'function' ? t(k, f) : f);
  return [tt('cta_pick_1', '누구에게 주실까요?'), tt('cta_pick_2', '어떤 날인가요?'), tt('cta_pick_3', '어떤 마음을 담을까요?'), tt('cta_pick_4', '이 꽃이 어울려요 ✓')];
}

function startCtaPicker() {
  const row = document.getElementById('cta-picker-row');
  const caption = document.getElementById('cta-picker-caption');
  if (!row || !caption) return;
  clearInterval(ctaPickerTimer);
  const products = loadProducts().filter(p => (typeof isProductVisible === 'function' ? isProductVisible(p) : true) && p.image).slice(0, 5);
  row.innerHTML = '';
  if (products.length < 2) { row.parentElement.classList.add('hidden'); return; }
  row.parentElement.classList.remove('hidden');
  const items = products.map(p => {
    const img = document.createElement('img');
    img.src = (Array.isArray(p.images) && p.images[0]) || p.image;
    img.alt = '';
    img.loading = 'lazy';
    img.className = 'cta-pick relative w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-xs bg-[#ECE8E1]';
    row.appendChild(img);
    return img;
  });
  const captions = ctaPickerCaptions();
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { // 움직임을 줄인 기기: 고른 모습만 보여 줌
    items.forEach((el, i) => el.classList.toggle(i === 1 ? 'is-picked' : 'is-dim', true));
    caption.textContent = captions[3];
    return;
  }
  let step = 0;
  let pick = 0;
  const tick = () => {
    const visible = row.getBoundingClientRect().bottom > 0 && row.getBoundingClientRect().top < window.innerHeight;
    if (!visible || document.hidden) return; // 화면 밖에서는 쉬기
    items.forEach(el => el.classList.remove('is-looking', 'is-picked', 'is-dim'));
    if (step < 3) {
      // 질문마다 다른 꽃을 짚어 봄
      items[(pick + step + 1) % items.length].classList.add('is-looking');
      caption.textContent = captions[step];
    } else {
      // 하나를 골라 줌
      items.forEach((el, i) => el.classList.add(i === pick ? 'is-picked' : 'is-dim'));
      caption.textContent = captions[3];
    }
    step = (step + 1) % 5; // 마지막 한 번은 고른 모습을 조금 더 오래
    if (step === 0) pick = (pick + 2) % items.length;
  };
  tick();
  ctaPickerTimer = setInterval(tick, 1400);
}

document.addEventListener('DOMContentLoaded', () => {
  try { startCtaPicker(); } catch (e) { console.error('startCtaPicker error:', e); }
});
