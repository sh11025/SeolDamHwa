// assets/js/site-pages.js
// 설담화(說談花) 안내 페이지 (정성 안내 · 약관) - 관리자에서 고치고 쇼핑몰에서 보여 줌
// 본문 쓰는 법: "## 제목" 은 소제목, "- 내용" 은 목록, 빈 줄은 문단 나눔.
// {상호} {대표자} {사업자등록번호} {통신판매업신고번호} {주소} {전화} {이메일} {개인정보보호책임자} 는 사업자 정보로 자동으로 바뀜.

var PAGES_STORAGE_KEY = DataStore.KEYS.pages;

const PAGE_ORDER = ['bojagi', 'care', 'delivery', 'faq', 'refund', 'terms', 'privacy'];

const DEFAULT_PAGES = {
  bojagi: {
    title: '전통 보자기 패키징 안내',
    group: 'guide',
    body: `버려지는 포장 대신, 오래 간직하는 복주머니 포장.
설담화의 꽃은 비닐과 일회용 포장 대신 한복 원단 보자기와 복주머니로 감쌉니다.

## 포장 종류
{포장종류}

## 꽃이 진 뒤에도
- 보자기는 손수건, 도시락 보자기, 선물 포장으로 다시 쓸 수 있어요.
- 복주머니는 작은 소지품 주머니로 오래 곁에 두실 수 있어요.

## 손질 방법
- 실크 보자기는 찬물에 손세탁 후 그늘에 말려 주세요.
- 다림질은 천을 덧대고 낮은 온도로 해 주세요.`
  },
  care: {
    title: '생화 관리 팁',
    group: 'guide',
    body: `꽃을 받으신 날부터 조금만 신경 써 주시면 더 오래 곁에 머뭅니다.

## 꽃다발
- 받으신 뒤 포장을 풀고, 줄기 끝을 사선으로 1~2cm 잘라 주세요.
- 깨끗한 화병에 줄기의 1/3 정도 잠길 만큼 물을 담아 주세요.
- 물에 잠기는 잎은 떼어 주세요. 물이 쉽게 상해요.
- 물은 하루나 이틀에 한 번 갈아 주세요.

## 꽃바구니
- 바구니 속 플로럴폼이 마르지 않게, 하루 한 번 폼 위에 천천히 물을 부어 주세요.

## 화병꽂이
- 화병의 물을 매일 깨끗한 찬물로 갈아 주시고, 화병 안쪽도 가볍게 헹궈 주세요.
- 물을 갈 때마다 줄기 끝을 살짝 잘라 주시면 물을 더 잘 마셔요.

## 화분·식물
- 겉흙이 바싹 말랐을 때 화분 밑으로 물이 흘러나올 만큼 흠뻑 주세요.
- 화분 받침에 고인 물은 뿌리가 썩지 않도록 바로 비워 주세요.
- 햇빛이 은은하게 들고 바람이 잘 통하는 곳에 두시면 좋아요.

## 드라이플라워
- 물을 주지 마시고, 습기가 많은 곳과 직사광선을 피해 주세요.
- 먼지가 앉았을 때는 입으로 살짝 불어내거나 부드러운 붓으로 털어 주세요.

## 두는 곳
- 직사광선, 에어컨·난방기 바람, 과일 옆은 피해 주세요. 꽃이 빨리 시들어요.
- 서늘하고 바람이 잘 통하는 곳이 가장 좋아요.

## 시든 꽃
- 시든 송이는 바로 빼 주시면 나머지 꽃이 더 오래가요.

꽃마다 어울리는 자세한 관리법은 [꽃 사전](#/dictionary)과 각 상품 안내에서 확인하실 수 있습니다.`
  },
  delivery: {
    title: '배송 안내',
    group: 'guide',
    body: `지정하신 날에 맞춰 손으로 지어 보내 드립니다.

## 배송 방법 및 배송비
{배송방법}
- {무료배송기준}

## 배송일·시간
- 주문하실 때 받고 싶은 날짜와 시간대(오전 10:00~13:00 / 오후 14:00~18:00 / 저녁 18:00~21:00)를 골라 주세요.
- 쉬는 날(정기 휴무·공휴일·임시 휴무)은 배송일로 고를 수 없어요.

## 받는 분이 안 계실 때
- 받는 분 연락처로 먼저 연락드리고, 경비실 등 안전한 곳에 맡겨 드려요.
- 주소나 연락처가 잘못 적혀 다시 보내야 하는 경우 추가 비용이 생길 수 있어요.

## 결제 안내
- 온라인 결제는 준비 중이에요.
- 주문서를 보내 주시면 매장에서 주문을 확인한 뒤 결제 방법을 남겨 주신 연락처로 안내해 드립니다.`
  },
  faq: {
    title: '자주 묻는 질문',
    group: 'guide',
    body: `설담화를 이용하시며 자주 묻는 질문들을 모았습니다.

## 오늘 받을 수 있나요?
퀵 배송의 경우 {당일마감시간} 이전 주문 시 오늘 받아보실 수 있습니다.
마감 시간 이후 주문하시거나 택배 배송인 경우 다음 날부터 배송일로 지정하실 수 있어요.
매장 상황과 정기 휴무일에는 당일 배송이 어려울 수 있으니 주문 전 달력의 배송 가능일을 확인해 주세요.

## 보내는 분 이름을 숨길 수 있나요?
네, 주문서에서 '카드에 보내는 분 이름을 적지 않을게요 (익명 선물)'를 선택하시면 카드에 보내는 분 이름을 적지 않습니다.
다만 배송 과정의 확인이나 연락을 위해 설담화에는 주문자 연락처를 남겨 주셔야 해요.

## 카드 메시지는 어떻게 쓰나요?
주문 결제 단계에서 마음을 담은 카드 메시지를 200자 이내로 자유롭게 적으실 수 있습니다.
적어 주신 소중한 글은 설담화의 단아한 한지 카드에 정갈하게 담아 꽃과 함께 전해 드려요.

## 주문을 확인하려면 어떻게 하나요?
모든 페이지 맨 아래 '고객센터' 칸의 '주문 조회' 버튼, 그리고 주문 완료 화면의 '주문 조회하기' 버튼에서 주문번호와 연락처를 입력하시면 언제든 주문 상태를 확인하실 수 있습니다.
제작 준비부터 배송 진행 상황과 운송장 번호까지 실시간으로 조회됩니다.

## 꽃 편지(후기)는 어떻게 쓰나요?
배송이 완료된 후 발송되는 후기 링크나 '주문 조회' 화면을 통해 소중한 사연과 사진, 영상을 담은 꽃 편지를 작성하실 수 있습니다.
남겨 주신 꽃 편지는 매장의 확인을 거쳐 후기 게시판에 아름답게 소개됩니다.

## 쿠폰은 어떻게 쓰나요?
주문 결제 화면의 쿠폰 코드 입력 칸에 보유하신 쿠폰 번호를 입력하고 적용하시면 즉시 할인이 적용됩니다.
단, 한 번의 주문에 하나의 쿠폰만 사용하실 수 있으며 유효기간을 꼭 확인해 주세요.

## 사진과 꽃이 조금 다를 수 있나요?
생화는 계절과 날씨, 당일 새벽 꽃시장의 수급 상황에 따라 종류와 색감이 사진과 조금씩 달라질 수 있습니다.
사진과 완전히 같지 않더라도 제철 가장 싱싱하고 아름다운 꽃으로 정성을 다해 지어 드립니다.`
  },
  refund: {
    title: '교환·환불 안내',
    group: 'legal',
    body: `생화는 시간이 지나면 다시 판매할 수 없는 상품이라, 관련 법령(전자상거래 등에서의 소비자보호에 관한 법률)에 따라 교환·환불이 제한될 수 있어요. 주문 전에 꼭 확인해 주세요.

## 주문 취소
- 받는 날 기준 2일 전까지: 전액 환불해 드려요.
- 받는 날 기준 1일 전부터: 꽃을 준비하기 시작해 취소가 어려워요. 꼭 필요하시면 연락 주세요.
- 주문 제작(1:1 맞춤) 상품은 제작을 시작한 뒤에는 취소할 수 없어요.

## 상품에 문제가 있을 때
- 꽃이 상했거나, 파손되었거나, 주문과 다른 상품이 왔다면 받은 날 안에 사진과 함께 연락 주세요.
- 확인 후 다시 지어 보내 드리거나 환불해 드려요.

## 교환·환불이 어려운 경우
- 받으신 뒤 단순히 마음이 바뀐 경우
- 받으신 뒤 관리 소홀로 꽃이 시든 경우
- 계절과 시장 상황에 따라 꽃 종류·색감이 사진과 조금 다른 경우 (같은 분위기의 제철 꽃으로 대신해요)

## 개인정보 보관 안내
- 관련 법령(전자상거래 등에서의 소비자보호에 관한 법률)에 따라 주문 및 결제 내역은 5년간 안전하게 보관됩니다.
- 5년이 지나면 주문자 및 받으시는 분의 이름, 연락처, 주소, 카드 메시지는 파기되며 결제 금액 기록만 보관됩니다.
- 자세한 내용은 [개인정보처리방침](#/legal/privacy)을 확인해 주세요.`
  },
  terms: {
    title: '이용약관',
    group: 'legal',
    body: `## 제1조 (목적)
이 약관은 {상호}(이하 "설담화")가 운영하는 온라인 쇼핑몰에서 상품을 사고파는 데 필요한 권리와 의무를 정합니다.

## 제2조 (주문과 계약)
- 고객이 상품을 고르고 주문서를 보내면, 설담화가 주문을 확인한 때 계약이 이루어집니다.
- 재고가 없거나 배송이 어려운 경우 설담화는 주문을 받지 않거나 취소할 수 있으며, 이때 받은 금액은 바로 돌려 드립니다.

## 제3조 (상품)
- 생화는 계절과 시장 상황에 따라 사진과 꽃 종류·색감이 조금 다를 수 있습니다.
- 상품 사진은 연출 예시이며, 같은 분위기로 지어 드립니다.

## 제4조 (배송)
- 배송은 고객이 고른 날짜와 시간대에 맞춰 진행합니다.
- 자세한 내용은 '배송 안내'를 따릅니다.

## 제5조 (취소·교환·환불)
취소·교환·환불은 '교환·환불 안내'와 관련 법령을 따릅니다.

## 제6조 (개인정보)
설담화는 '개인정보처리방침'에 따라 고객의 개인정보를 보호합니다.

## 제7조 (분쟁 해결)
설담화와 고객 사이에 생긴 분쟁은 서로 성실히 협의해 해결하며, 해결되지 않으면 관련 법령에 따릅니다.

## 사업자 정보
상호 {상호} · 대표 {대표자} · 사업자등록번호 {사업자등록번호} · 통신판매업 신고 {통신판매업신고번호}
주소 {주소} · 전화 {전화} · 이메일 {이메일}`
  },
  privacy: {
    title: '개인정보처리방침',
    group: 'legal',
    body: `{상호}(이하 "설담화")는 고객의 개인정보를 소중히 다루며, 개인정보 보호법 등 관련 법령을 지킵니다.

## 1. 모으는 개인정보와 목적
- 주문: 주문자·받는 분의 이름, 연락처, 배송지 주소, 카드 메시지 → 상품 제작과 배송, 주문 안내
- 1:1 상담: 이름, 연락처, 받고 싶은 날짜, 문의 내용 → 상담과 견적 안내
- 재입고 알림 신청: 이름(선택), 연락처 → 품절 상품 재입고 안내
- 손님 후기: 별점, 후기 글, 사진, 동영상 (작성자 이름은 쇼핑몰과 관리자 어디에도 저장·표시하지 않으며, 사진·동영상에 얼굴이나 타인의 개인정보가 나오지 않도록 주의해 주세요) → 상품 이용 후기 공유 및 품질 개선

## 2. 보관 기간
- 주문·대금 결제·재화 공급 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률. 5년이 지나면 주문자·받는 분의 이름, 연락처, 주소, 카드 메시지 등 개인정보는 파기되고 정산과 통계를 위한 결제 및 품목 기록만 보관됩니다)
- 소비자 불만·분쟁 처리 기록: 3년 (같은 법률)
- 상담 문의: 상담을 마친 날부터 1년
- 재입고 알림 신청: 알림 발송 완료 또는 신청 취소 시까지
- 손님 후기: 손님의 삭제 요청 또는 게시 중단 시까지
보관 기간이 끝나면 바로 파기합니다.

## 3. 다른 곳에 주는 경우
- 배송을 위해 배송 업체에 받는 분의 이름, 연락처, 주소를 전달합니다.
- 디스코드(Discord Inc.): 빠른 주문 접수·상담 확인 및 재입고 알림 관리를 위해 관리자 디스코드 채널로 실시간 알림을 전달합니다.
  - 주문: 주문번호, 배송일시, 주문자·받는 분 이름, 배송 방법, 결제 금액, 주문 상품, 카드 메시지
  - 상담: 이름, 문의 종류, 받고 싶은 날짜, 문의 상품, 문의 내용 (내용에 적으신 글은 그대로 전달돼요)
  - 재입고 알림: 이름(적은 경우), 상품 이름
  (전화번호와 상세 배송지 주소는 디스코드로 절대 전송하지 않습니다)
- 그 밖에는 고객의 동의나 법령에 따른 경우가 아니면 다른 곳에 주지 않습니다.

## 4. 파기 방법
전자 파일은 되살릴 수 없는 방법으로 지우고, 종이 문서는 분쇄하거나 태웁니다.

## 5. 고객의 권리
고객은 언제든 자신의 개인정보를 확인·수정·삭제하거나 처리를 멈춰 달라고 요청할 수 있습니다. 작성하신 후기의 삭제나 숨김을 원하시는 경우에도 언제든 요청해 주시면 지체 없이 조치합니다. 아래 연락처로 알려 주세요.

## 6. 브라우저 저장소 사용
쇼핑몰은 언어 설정, 장바구니 같은 편의 기능을 위해 이용하는 기기의 브라우저 저장소를 사용합니다.

## 7. 개인정보 보호책임자
- 책임자: {개인정보보호책임자}
- 연락처: {전화} · {이메일}`
  }
};

// 정성 안내 페이지의 사진·영상 (비율은 1:1 또는 4:3, 휴대폰에서도 같은 비율)
const DEFAULT_PAGE_MEDIA = {
  bojagi: { ratio: '4:3', images: [], video: 'assets/videos/bokjumeoni_packaging.mp4' }
};

function normalizePageMedia(m, id) {
  const base = DEFAULT_PAGE_MEDIA[id] || { ratio: '4:3', images: [], video: '' };
  const src = m && typeof m === 'object' ? m : base;
  return {
    ratio: src.ratio === '1:1' ? '1:1' : '4:3',
    images: Array.isArray(src.images) ? src.images.filter(x => typeof x === 'string' && x.trim()) : [],
    video: typeof src.video === 'string' ? src.video.trim() : ''
  };
}

function loadPages() {
  const stored = DataStore.read(PAGES_STORAGE_KEY, {}) || {};
  const pages = {};
  PAGE_ORDER.forEach(id => {
    const s = stored[id] || {};
    pages[id] = {
      ...DEFAULT_PAGES[id],
      title: typeof s.title === 'string' && s.title.trim() ? s.title : DEFAULT_PAGES[id].title,
      body: typeof s.body === 'string' && s.body.trim() ? s.body : DEFAULT_PAGES[id].body,
      edited: !!(s.title || s.body),
      updatedAt: s.updatedAt || '',
      media: normalizePageMedia(s.media, id)
    };
  });
  return pages;
}

function savePage(id, title, body, media) {
  const stored = DataStore.read(PAGES_STORAGE_KEY, {}) || {};
  const keepMedia = media || (stored[id] && stored[id].media);
  stored[id] = { title, body, updatedAt: new Date().toISOString(), ...(keepMedia ? { media: normalizePageMedia(keepMedia, id) } : {}) };
  DataStore.write(PAGES_STORAGE_KEY, stored);
}

function resetPage(id) {
  const stored = DataStore.read(PAGES_STORAGE_KEY, {}) || {};
  delete stored[id];
  DataStore.write(PAGES_STORAGE_KEY, stored);
}

// 사업자 정보 및 매장 설정으로 {자리표시} 바꾸기
function fillPagePlaceholders(text, settings) {
  const s = settings || (typeof loadSettings === 'function' ? loadSettings() : {});
  const b = s.business || {};
  const d = s.delivery || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS.delivery : {});
  const fullAddr = [s.address, s.addressDetail].filter(Boolean).join(' ');

  // 1. 배송 방법 목록 ({배송방법})
  const methodsLines = [];
  const until = typeof quickSameDayUntil === 'function' ? quickSameDayUntil(s) : (d.quick && d.quick.sameDayUntil);
  if (d.quick && d.quick.enabled) {
    const feeStr = Number(d.quick.fee) === 0 ? '무료' : `${Number(d.quick.fee).toLocaleString()}원`;
    const areaStr = d.quick.area ? ` (${d.quick.area})` : '';
    const cutoffStr = until ? ` · 당일 ${until} 이전 주문 시 당일 배송` : '';
    methodsLines.push(`- 퀵 배송: ${feeStr}${areaStr}${cutoffStr}`);
  }
  if (d.parcel && d.parcel.enabled) {
    const feeStr = Number(d.parcel.fee) === 0 ? '무료' : `${Number(d.parcel.fee).toLocaleString()}원`;
    const areaStr = d.parcel.area ? ` (${d.parcel.area})` : '';
    methodsLines.push(`- 택배: ${feeStr}${areaStr}`);
  }
  if (d.pickup && d.pickup.enabled) {
    const pickupAddr = fullAddr || '매장 주소';
    methodsLines.push(`- 매장 픽업: 무료 (방문 장소: ${pickupAddr} · 픽업 시간은 주문 확인 후 상담을 통해 조율)`);
  }
  const deliveryMethodsText = methodsLines.length > 0 ? methodsLines.join('\n') : '- 현재 이용 가능한 배송 방법은 상담을 통해 안내해 드립니다.';

  // 2. 무료 배송 기준 ({무료배송기준})
  const freeOverVal = Number(d.freeOver) || 0;
  const freeOverText = freeOverVal > 0 ? `${freeOverVal.toLocaleString()}원 이상 주문 시 배송비 무료` : '';

  // 3. 당일 퀵 마감 시간 ({당일마감시간})
  const sameDayUntilText = until ? `${until}` : '당일 마감 시간';

  // 4. 포장 종류 목록 ({포장종류})
  const packagingList = (typeof getEnabledPackaging === 'function' ? getEnabledPackaging(s) : (s.packaging || []).filter(p => p && p.enabled));
  const pkgLines = packagingList.map(p => {
    const pFee = Number(p.price) === 0 ? '무료' : `${Number(p.price).toLocaleString()}원`;
    const descStr = p.desc ? `: ${p.desc}` : '';
    return `- ${p.name} (${pFee})${descStr}`;
  });
  const packagingText = pkgLines.length > 0 ? pkgLines.join('\n') : '- 기본 단아 한지 포장 (무료)';

  const map = {
    '상호': b.companyName || '설담화',
    '대표자': b.ceo || '(등록 예정)',
    '사업자등록번호': b.bizNumber || '(등록 예정)',
    '통신판매업신고번호': b.mailOrderNumber || '(등록 예정)',
    '주소': b.bizAddress || fullAddr || '(등록 예정)',
    '전화': s.phone || '-',
    '이메일': s.email || '-',
    '개인정보보호책임자': b.privacyOfficer || b.ceo || '(등록 예정)',
    '배송방법': deliveryMethodsText,
    '무료배송기준': freeOverText,
    '당일마감시간': sameDayUntilText,
    '포장종류': packagingText
  };
  return String(text || '').replace(/\{(상호|대표자|사업자등록번호|통신판매업신고번호|주소|전화|이메일|개인정보보호책임자|배송방법|무료배송기준|당일마감시간|포장종류)\}/g, (_, k) => map[k]);
}

function pageEscape(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderMarkdownLinks(escapedStr) {
  return String(escapedStr || '').replace(/\[([^\]]+)\]\((#[^)]+|https?:\/\/[^)]+)\)/g, (_, label, href) => {
    return `<a href="${href}" class="underline hover:text-seal-red transition-colors">${label}</a>`;
  });
}

// 본문 → 안전한 HTML (관리자가 쓴 글은 글자 그대로만 표시)
function renderPageBody(body, settings) {
  const lines = fillPagePlaceholders(body, settings).split('\n');
  let html = '';
  let inList = false;
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  lines.forEach(raw => {
    const line = raw.trim();
    if (!line) { closeList(); return; }
    if (line.startsWith('## ')) {
      closeList();
      html += `<h3 class="page-h">${renderMarkdownLinks(pageEscape(line.slice(3)))}</h3>`;
    } else if (line.startsWith('- ')) {
      const content = line.slice(2).trim();
      if (!content) return; // 내용 없는 빈 글머리 기호는 건너뜀
      if (!inList) { html += '<ul class="page-ul">'; inList = true; }
      html += `<li>${renderMarkdownLinks(pageEscape(content))}</li>`;
    } else {
      closeList();
      html += `<p class="page-p">${renderMarkdownLinks(pageEscape(line))}</p>`;
    }
  });
  closeList();
  return html;
}

// 유튜브 주소면 퍼가기 주소로 (아니면 null)
function youtubeEmbedUrl(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

// 사진·영상 칸 그리기 (쇼핑몰 정성 안내와 관리자 미리보기에서 같이 사용)
// opts.locked: 손님 화면 - 영상은 소리 없이 저절로 반복 재생, 제어 막대·클릭·내려받기 없음
// opts.column: 한 줄로 쌓기 (정성 안내 PC 오른쪽 칸)
function renderPageMediaInto(box, media, opts = {}) {
  if (!box) return;
  box.innerHTML = '';
  const m = normalizePageMedia(media);
  const items = [...(m.video ? [{ video: m.video }] : []), ...m.images.map(src => ({ src }))];
  box.classList.toggle('hidden', !items.length);
  if (!items.length) return;
  box.className = opts.column ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';
  const aspect = m.ratio === '1:1' ? 'aspect-square' : 'aspect-[4/3]';
  items.forEach((it, i) => {
    const cell = document.createElement('div');
    cell.className = `${aspect} w-full overflow-hidden rounded-xs bg-[#ECE8E1] border border-ink-black/10${opts.column && it.video ? ' col-span-2' : ''}`;
    if (it.video) {
      const yt = youtubeEmbedUrl(it.video);
      if (yt) {
        const f = document.createElement('iframe');
        const id = yt.split('/').pop();
        f.src = opts.locked ? `${yt}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0&playsinline=1&disablekb=1` : yt;
        if (opts.locked) f.style.pointerEvents = 'none';
        f.title = '안내 영상';
        f.loading = 'lazy';
        f.allow = 'encrypted-media; picture-in-picture';
        f.allowFullscreen = true;
        f.className = 'w-full h-full border-0';
        cell.appendChild(f);
      } else {
        const v = document.createElement('video');
        v.src = it.video;
        v.muted = true;
        v.playsInline = true;
        if (opts.locked) {
          v.autoplay = true;
          v.loop = true;
          v.preload = 'auto';
          v.disablePictureInPicture = true;
          v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
          v.setAttribute('aria-hidden', 'true');
          v.tabIndex = -1;
          v.style.pointerEvents = 'none';
          v.addEventListener('contextmenu', e => e.preventDefault());
          v.play().catch(() => {});
        } else {
          v.controls = true;
          v.preload = 'metadata';
        }
        v.className = 'w-full h-full object-cover';
        cell.appendChild(v);
      }
    } else {
      const img = document.createElement('img');
      img.src = it.src;
      img.alt = `안내 사진 ${i + 1}`;
      img.loading = 'lazy';
      img.className = 'w-full h-full object-cover object-center';
      cell.appendChild(img);
    }
    box.appendChild(cell);
  });
}
