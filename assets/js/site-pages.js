// assets/js/site-pages.js
// 설담화(說談花) 안내 페이지 (정성 안내 · 약관) - 관리자에서 고치고 쇼핑몰에서 보여 줌
// 본문 쓰는 법: "## 제목" 은 소제목, "- 내용" 은 목록, 빈 줄은 문단 나눔.
// {상호} {대표자} {사업자등록번호} {통신판매업신고번호} {주소} {전화} {이메일} {개인정보보호책임자} 는 사업자 정보로 자동으로 바뀜.

const PAGES_STORAGE_KEY = 'seoldamhwa_pages';

const PAGE_ORDER = ['bojagi', 'care', 'delivery', 'refund', 'terms', 'privacy'];

const DEFAULT_PAGES = {
  bojagi: {
    title: '전통 보자기 패키징 안내',
    group: 'guide',
    body: `버려지는 포장 대신, 오래 간직하는 복주머니 포장.
설담화의 꽃은 비닐과 일회용 포장 대신 한복 원단 보자기와 복주머니로 감쌉니다.

## 포장 종류
- 기본 단아 한지 포장 (무료): 한지와 면 끈으로 단정하게 감싸요.
- 전통 실크 본견 보자기 & 노리개 포장: 실크 보자기로 매듭을 짓고 작은 노리개를 달아 드려요.

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

## 두는 곳
- 직사광선, 에어컨·난방기 바람, 과일 옆은 피해 주세요. 꽃이 빨리 시들어요.
- 서늘하고 바람이 잘 통하는 곳이 가장 좋아요.

## 시든 꽃
- 시든 송이는 바로 빼 주시면 나머지 꽃이 더 오래가요.`
  },
  delivery: {
    title: '배송 안내',
    group: 'guide',
    body: `생화는 지정하신 날짜에 맞춰 그날 아침 손으로 지어 보내 드립니다.

## 배송일·시간
- 주문하실 때 받고 싶은 날짜와 시간대(오전 10:00~13:00 / 오후 14:00~18:00)를 골라 주세요.
- 쉬는 날(정기 휴무·공휴일·임시 휴무)은 배송일로 고를 수 없어요.

## 배송 지역·비용
- 배송 가능 지역과 배송비는 주소에 따라 달라 상담 시 안내드려요.
- 생화 특성상 먼 지역은 배송이 어려울 수 있어요.

## 받는 분이 안 계실 때
- 받는 분 연락처로 먼저 연락드리고, 경비실 등 안전한 곳에 맡겨 드려요.
- 주소나 연락처가 잘못 적혀 다시 보내야 하는 경우 추가 비용이 생길 수 있어요.

문의: {전화} · {이메일}`
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

문의: {전화} · {이메일}`
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

## 2. 보관 기간
- 주문·대금 결제·재화 공급 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
- 소비자 불만·분쟁 처리 기록: 3년 (같은 법률)
- 상담 문의: 상담을 마친 날부터 1년
보관 기간이 끝나면 바로 파기합니다.

## 3. 다른 곳에 주는 경우
- 배송을 위해 배송 업체에 받는 분의 이름, 연락처, 주소를 전달합니다.
- 그 밖에는 고객의 동의나 법령에 따른 경우가 아니면 다른 곳에 주지 않습니다.

## 4. 파기 방법
전자 파일은 되살릴 수 없는 방법으로 지우고, 종이 문서는 분쇄하거나 태웁니다.

## 5. 고객의 권리
고객은 언제든 자신의 개인정보를 확인·수정·삭제하거나 처리를 멈춰 달라고 요청할 수 있습니다. 아래 연락처로 알려 주세요.

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
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(PAGES_STORAGE_KEY) || '{}') || {}; } catch (e) { stored = {}; }
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
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(PAGES_STORAGE_KEY) || '{}') || {}; } catch (e) { stored = {}; }
  const keepMedia = media || (stored[id] && stored[id].media);
  stored[id] = { title, body, updatedAt: new Date().toISOString(), ...(keepMedia ? { media: normalizePageMedia(keepMedia, id) } : {}) };
  localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(stored));
}

function resetPage(id) {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(PAGES_STORAGE_KEY) || '{}') || {}; } catch (e) { stored = {}; }
  delete stored[id];
  localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(stored));
}

// 사업자 정보로 {자리표시} 바꾸기
function fillPagePlaceholders(text, settings) {
  const s = settings || (typeof loadSettings === 'function' ? loadSettings() : {});
  const b = s.business || {};
  const map = {
    '상호': b.companyName || '설담화',
    '대표자': b.ceo || '(등록 예정)',
    '사업자등록번호': b.bizNumber || '(등록 예정)',
    '통신판매업신고번호': b.mailOrderNumber || '(등록 예정)',
    '주소': b.bizAddress || [s.address, s.addressDetail].filter(Boolean).join(' ') || '(등록 예정)',
    '전화': s.phone || '-',
    '이메일': s.email || '-',
    '개인정보보호책임자': b.privacyOfficer || b.ceo || '(등록 예정)'
  };
  return String(text || '').replace(/\{(상호|대표자|사업자등록번호|통신판매업신고번호|주소|전화|이메일|개인정보보호책임자)\}/g, (_, k) => map[k]);
}

function pageEscape(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
      html += `<h3 class="page-h">${pageEscape(line.slice(3))}</h3>`;
    } else if (line.startsWith('- ')) {
      if (!inList) { html += '<ul class="page-ul">'; inList = true; }
      html += `<li>${pageEscape(line.slice(2))}</li>`;
    } else {
      closeList();
      html += `<p class="page-p">${pageEscape(line)}</p>`;
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
function renderPageMediaInto(box, media) {
  if (!box) return;
  box.innerHTML = '';
  const m = normalizePageMedia(media);
  const items = [...(m.video ? [{ video: m.video }] : []), ...m.images.map(src => ({ src }))];
  box.classList.toggle('hidden', !items.length);
  if (!items.length) return;
  box.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';
  const aspect = m.ratio === '1:1' ? 'aspect-square' : 'aspect-[4/3]';
  items.forEach((it, i) => {
    const cell = document.createElement('div');
    cell.className = `${aspect} w-full overflow-hidden rounded-xs bg-[#ECE8E1] border border-ink-black/10`;
    if (it.video) {
      const yt = youtubeEmbedUrl(it.video);
      if (yt) {
        const f = document.createElement('iframe');
        f.src = yt;
        f.title = '안내 영상';
        f.loading = 'lazy';
        f.allow = 'encrypted-media; picture-in-picture';
        f.allowFullscreen = true;
        f.className = 'w-full h-full border-0';
        cell.appendChild(f);
      } else {
        const v = document.createElement('video');
        v.src = it.video;
        v.controls = true;
        v.muted = true;
        v.playsInline = true;
        v.preload = 'metadata';
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
