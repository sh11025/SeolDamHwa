// assets/js/admin-tools.js
// 설담화(說談花) 관리자 도구: 예시 데이터, 백업·복원, AI 초안 (관리자 화면 전용)

/* ------------------------------------------------------------------
 * 1) 예시 데이터: 리포트·차트 확인용. 모두 isSample 표시가 붙고 한 번에 지울 수 있음
 * ------------------------------------------------------------------ */
const SAMPLE_PRODUCT_PREFIX = 'sample-';

const SAMPLE_PRODUCTS = [
  {
    id: 'sample-mini-bouquet', name: '[예시] 데일리 미니 꽃다발', englishName: 'Daily Mini Bouquet', category: 'bouquet',
    price: 29000, sizes: [{ label: 'One Size', price: 29000, recommended: true }], inquiryOnly: false,
    poeticLine: '책상 위에 놓인 작은 계절 하나', flowerMeaning: '소국 · 리시안셔스', description: '예시 상품입니다. 리포트와 차트 확인용으로만 쓰이며 손님에게는 보이지 않아요.',
    stockQuantity: 15, image: 'assets/images/products/signature-bouquet.jpg', visibility: 'private'
  },
  {
    id: 'sample-peony-armful', name: '[예시] 작약 한아름', englishName: 'Peony Armful', category: 'bouquet',
    price: 68000, sizes: [{ label: 'Standard', price: 68000, recommended: true }], inquiryOnly: false,
    poeticLine: '오월의 볕을 가득 안은 분홍빛 숨결', flowerMeaning: '작약 · 수줍음, 부귀', description: '예시 상품입니다. 리포트와 차트 확인용으로만 쓰이며 손님에게는 보이지 않아요.',
    stockQuantity: 6, image: 'assets/images/products/pale-pink-rose.jpg', visibility: 'private'
  },
  {
    id: 'sample-chrysanthemum-basket', name: '[예시] 소국 꽃바구니', englishName: 'Chrysanthemum Basket', category: 'basket',
    price: 45000, sizes: [{ label: 'Standard', price: 45000, recommended: true }], inquiryOnly: false,
    poeticLine: '가을 들판을 한 바구니에 담아', flowerMeaning: '소국 · 밝은 마음', description: '예시 상품입니다. 리포트와 차트 확인용으로만 쓰이며 손님에게는 보이지 않아요.',
    stockQuantity: 2, image: 'assets/images/products/creamy-sunshine.jpg', visibility: 'private'
  }
];

function hasSampleData() {
  const products = loadProducts();
  return products.some(p => String(p.id).startsWith(SAMPLE_PRODUCT_PREFIX))
    || loadOrders().some(o => o.isSample)
    || loadExpenses().some(e => e.isSample)
    || JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]').some(i => i.isSample);
}

function addSampleData() {
  removeSampleData(); // 두 번 눌러도 겹치지 않게
  const today = financeToday();

  // 상품 (비공개)
  const products = loadProducts();
  SAMPLE_PRODUCTS.forEach(p => products.push({ ...p }));
  saveProducts(products);

  // 주문: 최근 30일 + 앞으로 7일 배송 예정
  const catalog = products.filter(p => !p.inquiryOnly && (p.sizes?.length || p.price));
  const names = ['김하늘', '이도윤', '박서아', '최지우', '정민준', '강예린', '윤시우', '한소율'];
  const options = [['기본 단아 한지 포장', 0], ['전통 실크 본견 보자기 & 노리개 포장', 15000]];
  const times = ['오전 10:00~13:00', '오후 14:00~18:00'];
  const messages = ['생일 축하해, 늘 고마워.', '', '오늘도 수고 많았어요.', '', '결혼 기념일 축하드려요.', ''];
  const orders = loadOrders();
  let seq = 0;
  for (let d = -29; d <= 0; d++) {
    const count = [0, 1, 1, 2, 1, 0, 3][(d + 29) % 7];
    for (let k = 0; k < count; k++) {
      const orderDate = addDays(today, d);
      const p = catalog[(seq * 3 + k) % catalog.length];
      const size = p.sizes && p.sizes.length ? p.sizes[(seq + k) % p.sizes.length] : { label: null, price: p.price };
      const qty = seq % 5 === 0 ? 2 : 1;
      const [optName, optPrice] = options[seq % 4 === 0 ? 1 : 0];
      const delivery = addDays(orderDate, 2 + (seq % 3));
      const daysToDelivery = daysBetween(today, delivery);
      let status = 'completed';
      if (daysToDelivery > 1) status = 'preparing';
      else if (daysToDelivery === 1) status = 'packaged';
      else if (daysToDelivery === 0) status = 'delivering';
      if (seq === 7) status = 'cancelled';
      const ts = new Date(`${orderDate}T09:00:00`).getTime() + seq * 1800000;
      orders.push({
        id: `ord-${ts}`,
        orderNumber: `EX-${orderDate.slice(2).replace(/-/g, '')}-${String(seq + 1).padStart(2, '0')}`,
        customerName: `[예시] ${names[seq % names.length]}`,
        phone: '010-0000-0000',
        deliveryDate: `${delivery} ${times[seq % 2]}`,
        address: '예시 주소 (실제 주문 아님)',
        message: messages[seq % messages.length],
        items: [{ product: { id: p.id, name: p.name }, sizeLabel: size.label, price: size.price, optionName: optName, optionPrice: optPrice, quantity: qty }],
        totalAmount: (size.price + optPrice) * qty,
        status,
        createdAt: `${String(9 + (seq % 9)).padStart(2, '0')}:${String((seq * 7) % 60).padStart(2, '0')}`,
        createdDate: orderDate,
        isSample: true
      });
      seq++;
    }
  }
  saveOrders(orders);

  // 지출
  const expenses = loadExpenses();
  const plan = [
    [-28, '임대·공과금', 850000, '계좌이체', '월세'], [-27, '꽃 사입', 180000, '현금', '양재 꽃시장 장미·작약'],
    [-24, '포장재', 95000, '카드', '한지·리본'], [-21, '꽃 사입', 210000, '현금', '양재 꽃시장 소국·리시안셔스'],
    [-19, '배송·퀵', 42000, '카드', '퀵 배송 6건'], [-15, '꽃 사입', 165000, '현금', '양재 꽃시장 다알리아'],
    [-12, '포장재', 120000, '카드', '실크 보자기 10장'], [-10, '인건비', 400000, '계좌이체', '주말 아르바이트'],
    [-8, '꽃 사입', 190000, '현금', '양재 꽃시장 장미'], [-6, '배송·퀵', 38000, '카드', '퀵 배송 5건'],
    [-4, '기타', 27000, '카드', '물통·가위'], [-2, '꽃 사입', 175000, '현금', '양재 꽃시장 작약'], [0, '배송·퀵', 16000, '카드', '퀵 배송 2건']
  ];
  plan.forEach(([d, category, amount, method, memo], i) => {
    expenses.push({ id: `exp-sample-${i}`, date: addDays(today, d), category, amount, method, memo: `[예시] ${memo}`, isSample: true });
  });
  saveExpenses(expenses);

  // 상담 문의
  const inquiries = JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]');
  inquiries.unshift(
    { id: 'inq-sample-1', name: '[예시] 오지현', phone: '010-0000-0000', date: addDays(today, 10), type: '웨딩·행사·공간 연출', productName: '', message: '작은 야외 결혼식 테이블 센터피스 6개를 상담하고 싶어요. 예산은 60만원 정도입니다.', createdDate: today, status: 'new', isSample: true },
    { id: 'inq-sample-2', name: '[예시] 문태오', phone: '010-0000-0000', date: addDays(today, 3), type: '특정 상품 문의', productName: '노리개 꽃바구니', message: '어머니 칠순 선물로 노리개 꽃바구니를 생각 중인데 색감을 조금 더 밝게 할 수 있을까요?', createdDate: addDays(today, -1), status: 'done', isSample: true }
  );
  localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(inquiries));

  return { products: SAMPLE_PRODUCTS.length, orders: seq, expenses: plan.length, inquiries: 2 };
}

function removeSampleData() {
  saveProducts(loadProducts().filter(p => !String(p.id).startsWith(SAMPLE_PRODUCT_PREFIX)));
  saveOrders(loadOrders().filter(o => !o.isSample));
  saveExpenses(loadExpenses().filter(e => !e.isSample));
  const inquiries = JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]');
  localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(inquiries.filter(i => !i.isSample)));
}

/* ------------------------------------------------------------------
 * 2) 백업·복원: seoldamhwa_ 로 시작하는 저장 데이터 (AI 키·웨훅 주소는 제외)
 * ------------------------------------------------------------------ */
const BACKUP_EXCLUDED_KEYS = ['seoldamhwa_ai_key', 'seoldamhwa_integrations', 'seoldamhwa_lang', 'seoldamhwa_popup_dismissed_date'];

function collectBackupData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('seoldamhwa_') && !BACKUP_EXCLUDED_KEYS.includes(key)) {
      data[key] = localStorage.getItem(key);
    }
  }
  return { app: 'seoldamhwa', version: 1, createdAt: new Date().toISOString(), data };
}

function downloadBackup() {
  const backup = collectBackupData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `설담화_백업_${financeToday()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  return Object.keys(backup.data).length;
}

// 백업 파일 검사 → { ok, keys, error }
function parseBackupText(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) { return { ok: false, error: '백업 파일을 읽을 수 없어요. 설담화에서 내려받은 .json 파일인지 확인해 주세요.' }; }
  if (!parsed || parsed.app !== 'seoldamhwa' || typeof parsed.data !== 'object') {
    return { ok: false, error: '설담화 백업 파일이 아니에요.' };
  }
  const keys = Object.keys(parsed.data).filter(k => k.startsWith('seoldamhwa_') && !BACKUP_EXCLUDED_KEYS.includes(k) && typeof parsed.data[k] === 'string');
  if (keys.length === 0) return { ok: false, error: '백업 파일에 복원할 내용이 없어요.' };
  return { ok: true, keys, parsed };
}

function applyBackup(parsed, keys) {
  keys.forEach(k => localStorage.setItem(k, parsed.data[k]));
}

/* ------------------------------------------------------------------
 * 3) AI 초안 (Claude API) - 관리자 컴퓨터에서만, 키는 이 브라우저에만 저장
 * ------------------------------------------------------------------ */
const AI_KEY_STORAGE = 'seoldamhwa_ai_key';
const AI_MODEL = 'claude-opus-5-5';
let anthropicClientPromise = null;

function loadAiKey() {
  try { return localStorage.getItem(AI_KEY_STORAGE) || ''; } catch (e) { return ''; }
}

function saveAiKey(key) {
  if (key) localStorage.setItem(AI_KEY_STORAGE, key.trim()); else localStorage.removeItem(AI_KEY_STORAGE);
  anthropicClientPromise = null;
}

async function getAnthropicClient() {
  const key = loadAiKey();
  if (!key) throw new Error('NO_KEY');
  if (!anthropicClientPromise) {
    anthropicClientPromise = import('https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.134.0/+esm')
      .then(mod => new mod.default({ apiKey: key, dangerouslyAllowBrowser: true }));
  }
  return anthropicClientPromise;
}

const BRAND_SYSTEM_PROMPT = `당신은 서울의 꽃집 '설담화(說談花)'의 카피라이터이자 상담 도우미입니다.
설담화는 2030 세대를 위한 모던 한국 헤리티지 플로리스트입니다. 한지, 여백, 달항아리, 화조도의 정서를 담고,
버려지는 포장 대신 오래 간직하는 복주머니·보자기 포장을 씁니다.
말투는 정갈하고 따뜻하며, 과장 광고나 사실과 다른 약속(할인, 무료 배송, 특정 꽃 재고 보장 등)은 하지 않습니다.`;

// 공통 호출: JSON 스키마로 답을 받음
async function askClaudeJson(prompt, schema) {
  const client = await getAnthropicClient();
  const response = await client.beta.messages.create({
    model: AI_MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: BRAND_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    output_config: { format: { type: 'json_schema', schema } }
  });
  if (response.stop_reason === 'refusal') throw new Error('REFUSAL');
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(text);
}

function aiErrorMessage(err) {
  const msg = String(err && err.message || err);
  if (msg === 'NO_KEY') return 'AI 키가 없어요. [연동·데이터] 메뉴에서 Claude API 키를 먼저 저장해 주세요.';
  if (msg === 'REFUSAL') return 'AI가 이 요청에는 답하지 않았어요. 내용을 조금 바꿔 다시 시도해 주세요.';
  const status = err && err.status;
  if (status === 401) return 'AI 키가 올바르지 않아요. 키를 다시 확인해 주세요.';
  if (status === 429) return '요청이 많아 잠시 막혔어요. 1분쯤 뒤 다시 시도해 주세요.';
  if (status && status >= 500) return 'AI 서버가 잠시 불안정해요. 조금 뒤 다시 시도해 주세요.';
  if (/Failed to fetch|NetworkError|import/i.test(msg)) return '인터넷 연결을 확인해 주세요.';
  return `AI 초안을 만들지 못했어요. (${msg.slice(0, 80)})`;
}

async function draftProductCopy({ name, category, meaningHint, priceText }) {
  const schema = {
    type: 'object',
    properties: {
      poeticLine: { type: 'string', description: '상품명 아래 한 줄 글귀. 25자 안팎, 따옴표 없이' },
      flowerMeaning: { type: 'string', description: '주요 꽃과 꽃말. 예: 작약 · 수줍음, 부귀' },
      description: { type: 'string', description: '상품 설명 2~3문장' }
    },
    required: ['poeticLine', 'flowerMeaning', 'description'],
    additionalProperties: false
  };
  return askClaudeJson(
    `다음 꽃 상품의 쇼핑몰 문구 초안을 써 주세요.\n상품명: ${name}\n종류: ${category}\n가격: ${priceText || '미정'}\n참고(꽃 종류·꽃말): ${meaningHint || '없음'}`,
    schema
  );
}

async function draftInquiryReply(inq, settings) {
  const schema = {
    type: 'object',
    properties: { reply: { type: 'string', description: '고객에게 보낼 답변 초안. 5~8문장, 인사와 마무리 포함' } },
    required: ['reply'],
    additionalProperties: false
  };
  const result = await askClaudeJson(
    `다음 1:1 상담 문의에 보낼 답변 초안을 써 주세요. 가격·재고를 확정하지 말고, 확인 후 다시 연락드린다는 흐름으로 써 주세요.\n` +
    `[매장 정보] 전화 ${settings.phone || '-'} / 이메일 ${settings.email || '-'}\n` +
    `[문의] 이름: ${inq.name}\n상담 유형: ${inq.type || '-'}\n문의 상품: ${inq.productName || '-'}\n받고 싶은 날짜: ${inq.date || '-'}\n내용: ${inq.message || ''}`,
    schema
  );
  return result.reply;
}
