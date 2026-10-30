// assets/js/admin-tools.js
// 설담화(說談花) 관리자 도구: 예시 데이터, 백업·복원, AI 초안 (관리자 화면 전용)

/* ------------------------------------------------------------------
 * 1) 예시 데이터: 차트·리포트·쇼핑몰 동작 확인용. 모두 [예시]가 붙고 한 번에 지울 수 있음
 * ------------------------------------------------------------------ */
const SAMPLE_PRODUCT_PREFIX = 'sample-';
const SAMPLE_NOTE = '예시 상품입니다. 차트·리포트·쇼핑몰 동작 확인용이며, 관리자에서 [예시 데이터 모두 지우기]로 한 번에 지울 수 있어요.';

// 종류·가격대·재고 상태를 고르게 섞음 (2만원대 ~ 25만원, 품절·품절 임박·상담 상품 포함)
const SAMPLE_PRODUCTS = [
  {
    id: 'sample-mini-bouquet', name: '[예시] 데일리 미니 꽃다발', englishName: 'Daily Mini Bouquet', category: 'bouquet',
    price: 19000, sizes: [{ label: 'S', price: 19000, recommended: false }, { label: 'M', price: 29000, recommended: true }], inquiryOnly: false,
    poeticLine: '책상 위에 놓인 작은 계절 하나', flowerMeaning: '소국 · 리시안셔스', stockQuantity: 15,
    image: 'assets/images/products/signature-bouquet.jpg',
    curationTags: { recipients: ['친구', '나에게', '동료·상사'], occasions: ['특별한 날 없이', '생일'], feelings: ['응원', '감사'], colors: ['핑크·피치', '여러 색 섞어서'] }
  },
  {
    id: 'sample-sunflower', name: '[예시] 해바라기 축하 꽃다발', englishName: 'Sunflower Bouquet', category: 'bouquet',
    price: 39000, sizes: [{ label: 'Standard', price: 39000, recommended: true }], inquiryOnly: false,
    poeticLine: '한낮의 볕을 그대로 묶어 건네는 마음', flowerMeaning: '해바라기 · 동경, 빛나는 앞날', stockQuantity: 0,
    image: 'assets/images/products/creamy-sunshine.jpg',
    curationTags: { recipients: ['친구', '동료·상사'], occasions: ['졸업·입학', '승진·개업'], feelings: ['축하', '응원'], colors: ['옐로우·오렌지'] }
  },
  {
    id: 'sample-chrysanthemum-basket', name: '[예시] 소국 꽃바구니', englishName: 'Chrysanthemum Basket', category: 'basket',
    price: 45000, sizes: [{ label: 'Standard', price: 45000, recommended: true }], inquiryOnly: false,
    poeticLine: '가을 들판을 한 바구니에 담아', flowerMeaning: '소국 · 밝은 마음', stockQuantity: 2,
    image: 'assets/images/products/norigae-basket.jpg',
    curationTags: { recipients: ['부모님·어른', '스승·은인'], occasions: ['어버이날·스승의날', '위로·병문안'], feelings: ['감사', '위로'], colors: ['옐로우·오렌지', '화이트·그린'] }
  },
  {
    id: 'sample-peony-armful', name: '[예시] 작약 한아름', englishName: 'Peony Armful', category: 'bouquet',
    price: 68000, sizes: [{ label: 'Standard', price: 68000, recommended: true }], inquiryOnly: false,
    poeticLine: '오월의 볕을 가득 안은 분홍빛 숨결', flowerMeaning: '작약 · 수줍음, 부귀', stockQuantity: 6,
    image: 'assets/images/products/pale-pink-rose.jpg',
    curationTags: { recipients: ['연인', '부모님·어른'], occasions: ['기념일·프러포즈', '결혼·상견례'], feelings: ['사랑', '축하'], colors: ['핑크·피치'] }
  },
  {
    id: 'sample-subscription', name: '[예시] 계절 꽃 정기 배송 (월 4회)', englishName: 'Seasonal Subscription', category: 'basket',
    price: 89000, sizes: [{ label: '월 4회', price: 89000, recommended: true }], inquiryOnly: false,
    poeticLine: '매주 한 번, 계절이 문 앞에 도착합니다', flowerMeaning: '제철 꽃 · 일상의 기쁨', stockQuantity: 20,
    image: 'assets/images/products/bohemian-autumn.jpg',
    curationTags: { recipients: ['나에게', '공간·기업'], occasions: ['특별한 날 없이'], feelings: ['공간 연출', '응원'], colors: ['여러 색 섞어서', '잘 모르겠어요'] }
  },
  {
    id: 'sample-orchid', name: '[예시] 동양란 개업 화분', englishName: 'Oriental Orchid Pot', category: 'basket',
    price: 120000, sizes: [{ label: '1대', price: 120000, recommended: true }, { label: '2대', price: 180000, recommended: false }], inquiryOnly: false,
    poeticLine: '곧게 뻗은 잎처럼 오래 번창하시길', flowerMeaning: '동양란 · 번영, 고결함', stockQuantity: 4,
    image: 'assets/images/products/royal-blue-garden.jpg',
    curationTags: { recipients: ['동료·상사', '공간·기업'], occasions: ['승진·개업'], feelings: ['축하'], colors: ['화이트·그린'] }
  },
  {
    id: 'sample-rose-100', name: '[예시] 프러포즈 장미 100송이', englishName: '100 Roses', category: 'bouquet',
    price: 250000, sizes: [{ label: '100송이', price: 250000, recommended: true }], inquiryOnly: false,
    poeticLine: '백 번을 고쳐 써도 같은 고백', flowerMeaning: '빨간 장미 · 열렬한 사랑', stockQuantity: 1,
    image: 'assets/images/products/bohemian-autumn.jpg',
    curationTags: { recipients: ['연인'], occasions: ['기념일·프러포즈'], feelings: ['사랑'], colors: ['레드·버건디'] }
  },
  {
    id: 'sample-wedding-bouquet', name: '[예시] 웨딩 부케 (상담)', englishName: 'Wedding Bouquet', category: 'space',
    price: 0, sizes: [], inquiryOnly: true,
    poeticLine: '평생 한 번의 걸음에 어울리는 꽃', flowerMeaning: '은방울꽃 · 다시 찾은 행복', stockQuantity: null,
    image: 'assets/images/products/space-design.jpg',
    curationTags: { recipients: ['연인'], occasions: ['결혼·상견례'], feelings: ['사랑', '축하'], colors: ['화이트·그린'] }
  }
];

function hasSampleData() {
  const products = loadProducts();
  return products.some(p => String(p.id).startsWith(SAMPLE_PRODUCT_PREFIX))
    || loadOrders().some(o => o.isSample)
    || loadExpenses().some(e => e.isSample)
    || JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]').some(i => i.isSample);
}

function sampleProductsVisible() {
  return loadProducts().some(p => String(p.id).startsWith(SAMPLE_PRODUCT_PREFIX) && p.visibility !== 'private');
}

// showInShop: 예시 상품을 쇼핑몰에도 보이게 할지 (맞춤 담화·예산 구간 등 손님 화면 확인용)
function addSampleData({ showInShop = true } = {}) {
  removeSampleData(); // 두 번 눌러도 겹치지 않게
  const today = financeToday();

  // 상품
  const products = loadProducts();
  SAMPLE_PRODUCTS.forEach(p => products.push({ ...p, description: SAMPLE_NOTE, visibility: showInShop ? 'public' : 'private' }));
  saveProducts(products);

  // 주문: 최근 90일 + 앞으로 며칠 배송 예정 (요일별로 들쭉날쭉하게)
  const catalog = products.filter(p => !p.inquiryOnly && (p.sizes?.length || p.price));
  const names = ['김하늘', '이도윤', '박서아', '최지우', '정민준', '강예린', '윤시우', '한소율', '오다온', '서주원'];
  const options = [['기본 단아 한지 포장', 0], ['전통 실크 본견 보자기 & 노리개 포장', 15000]];
  const times = ['오전 10:00~13:00', '오후 14:00~18:00'];
  const messages = ['생일 축하해, 늘 고마워.', '', '오늘도 수고 많았어요.', '', '결혼 기념일 축하드려요.', '', '새 출발을 응원해요!', ''];
  const weekdayCounts = [1, 1, 2, 1, 2, 3, 2]; // 일~토
  const orders = loadOrders();
  let seq = 0;
  for (let d = -89; d <= 0; d++) {
    const orderDate = addDays(today, d);
    const [y, m, dd] = orderDate.split('-').map(Number);
    const dow = new Date(y, m - 1, dd).getDay();
    const count = Math.max(0, weekdayCounts[dow] - ((Math.abs(d) * 7) % 3 === 0 ? 1 : 0));
    for (let k = 0; k < count; k++) {
      const p = catalog[(seq * 5 + k * 3) % catalog.length];
      const size = p.sizes && p.sizes.length ? p.sizes[(seq + k) % p.sizes.length] : { label: null, price: p.price };
      const qty = seq % 6 === 0 ? 2 : 1;
      const [optName, optPrice] = options[seq % 4 === 0 ? 1 : 0];
      const delivery = addDays(orderDate, 1 + (seq % 4));
      const daysToDelivery = daysBetween(today, delivery);
      let status = 'completed';
      if (daysToDelivery > 1) status = 'preparing';
      else if (daysToDelivery === 1) status = 'packaged';
      else if (daysToDelivery === 0) status = 'delivering';
      if (seq % 23 === 7) status = 'cancelled';
      const ts = new Date(`${orderDate}T09:00:00`).getTime() + seq * 1800000;
      orders.push({
        id: `ord-${ts}`,
        orderNumber: `EX-${orderDate.slice(2).replace(/-/g, '')}-${String(seq + 1).padStart(3, '0')}`,
        customerName: `[예시] ${names[seq % names.length]}`,
        phone: '010-0000-0000',
        deliveryDate: `${delivery} ${times[seq % 2]}`,
        address: `서울특별시 종로구 예시로 ${10 + (seq % 40)} (실제 주문 아님)`,
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

  // 지출: 석 달치 (월세·인건비는 매달, 꽃 사입은 주 2회 정도)
  const expenses = loadExpenses();
  let ex = 0;
  const pushExp = (d, category, amount, method, memo) => {
    expenses.push({ id: `exp-sample-${ex++}`, date: addDays(today, d), category, amount, method, memo: `[예시] ${memo}`, isSample: true });
  };
  for (let monthAgo = 2; monthAgo >= 0; monthAgo--) {
    const base = -monthAgo * 30;
    pushExp(base - 28, '임대·공과금', 850000, '계좌이체', '월세');
    pushExp(base - 25, '임대·공과금', 64000, '계좌이체', '전기·수도');
    pushExp(base - 10, '인건비', 400000, '계좌이체', '주말 아르바이트');
    pushExp(base - 20, '포장재', 90000 + monthAgo * 15000, '카드', '한지·리본·실크 보자기');
  }
  for (let d = -88; d <= 0; d += 4) {
    pushExp(d, '꽃 사입', 140000 + ((Math.abs(d) * 13) % 9) * 10000, '현금', ['양재 꽃시장 장미·작약', '양재 꽃시장 소국·리시안셔스', '고속터미널 꽃시장 다알리아', '양재 꽃시장 계절 꽃'][Math.abs(d) % 4]);
    if (d % 8 === 0) pushExp(d + 1, '배송·퀵', 30000 + (Math.abs(d) % 5) * 4000, '카드', '퀵 배송');
  }
  pushExp(-40, '기타', 27000, '카드', '물통·가위');
  saveExpenses(expenses);

  // 상담 문의
  const inquiries = JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]');
  inquiries.unshift(
    { id: 'inq-sample-1', name: '[예시] 오지현', phone: '010-0000-0000', date: addDays(today, 10), type: '웨딩·행사·공간 연출', productName: '', message: '작은 야외 결혼식 테이블 센터피스 6개를 상담하고 싶어요. 예산은 60만원 정도입니다.', createdDate: today, status: 'new', isSample: true },
    { id: 'inq-sample-3', name: '[예시] 장하린', phone: '010-0000-0000', date: addDays(today, 5), type: '기업·단체 주문', productName: '', message: '회사 창립 기념일에 사무실 6곳에 놓을 꽃바구니를 주문하고 싶어요.', createdDate: addDays(today, -2), status: 'new', isSample: true },
    { id: 'inq-sample-2', name: '[예시] 문태오', phone: '010-0000-0000', date: addDays(today, 3), type: '특정 상품 문의', productName: '노리개 꽃바구니', message: '어머니 칠순 선물로 노리개 꽃바구니를 생각 중인데 색감을 조금 더 밝게 할 수 있을까요?', createdDate: addDays(today, -4), status: 'done', isSample: true,
      replies: [{ text: '문의 감사합니다. 칠순을 축하드려요. 노리개 꽃바구니는 노란 소국과 크림 장미를 더해 한층 밝게 지어 드릴 수 있어요. 원하시는 날짜에 맞춰 준비해 두겠습니다.', at: `${addDays(today, -3)}T11:20:00` }] }
  );
  localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(inquiries));

  // 재입고 알림 신청 (품절 예시 상품)
  if (typeof saveRestock === 'function') {
    const rs = loadRestock();
    rs.unshift(
      { id: 'rs-sample-1', productId: 'sample-sunflower', productName: '[예시] 해바라기 축하 꽃다발', name: '[예시] 남궁별', phone: '010-0000-0000', createdDate: addDays(today, -2), status: 'waiting', isSample: true },
      { id: 'rs-sample-2', productId: 'sample-sunflower', productName: '[예시] 해바라기 축하 꽃다발', name: '[예시] 류하늘', phone: '010-0000-0001', createdDate: addDays(today, -1), status: 'waiting', isSample: true }
    );
    saveRestock(rs);
  }

  return { products: SAMPLE_PRODUCTS.length, orders: seq, expenses: ex, inquiries: 3, showInShop };
}

function removeSampleData() {
  saveProducts(loadProducts().filter(p => !String(p.id).startsWith(SAMPLE_PRODUCT_PREFIX)));
  saveOrders(loadOrders().filter(o => !o.isSample));
  saveExpenses(loadExpenses().filter(e => !e.isSample));
  const inquiries = JSON.parse(localStorage.getItem('seoldamhwa_inquiries') || '[]');
  localStorage.setItem('seoldamhwa_inquiries', JSON.stringify(inquiries.filter(i => !i.isSample)));
  if (typeof saveRestock === 'function') saveRestock(loadRestock().filter(r => !r.isSample));
}

/* ------------------------------------------------------------------
 * 2) 백업·복원: seoldamhwa_ 로 시작하는 저장 데이터 (AI 키·웨훅 주소는 제외)
 * ------------------------------------------------------------------ */
const BACKUP_EXCLUDED_KEYS = ['seoldamhwa_ai_key', 'seoldamhwa_ai_settings', 'seoldamhwa_csv_autosave', 'seoldamhwa_integrations', 'seoldamhwa_lang', 'seoldamhwa_popup_dismissed_date'];

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
 * 3) AI 초안 (Claude · GPT · Gemini) - 관리자 컴퓨터에서만, 키는 이 브라우저에만 저장
 * ------------------------------------------------------------------ */
const AI_SETTINGS_KEY = 'seoldamhwa_ai_settings';
const AI_PROVIDERS = {
  claude: { label: 'Claude', keyHint: 'sk-ant-', keyPattern: /^sk-ant-/, defaultModel: 'claude-opus-5-5', consoleName: 'Anthropic 콘솔' },
  openai: { label: 'GPT', keyHint: 'sk-', keyPattern: /^sk-/, defaultModel: 'gpt-5', consoleName: 'OpenAI 플랫폼' },
  gemini: { label: 'Gemini', keyHint: 'AIza', keyPattern: /^AIza/, defaultModel: 'gemini-2.5-flash', consoleName: 'Google AI Studio' }
};
let anthropicClientPromise = null;

function loadAiSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) || '{}') || {}; } catch (e) { s = {}; }
  // 예전 Claude 키 하나만 저장하던 방식에서 옮기기
  try {
    const legacy = localStorage.getItem('seoldamhwa_ai_key');
    if (legacy && !(s.keys && s.keys.claude)) {
      s.keys = { ...(s.keys || {}), claude: legacy };
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(s));
    }
    if (legacy) localStorage.removeItem('seoldamhwa_ai_key');
  } catch (e) {}
  return {
    provider: AI_PROVIDERS[s.provider] ? s.provider : 'claude',
    keys: { claude: '', openai: '', gemini: '', ...(s.keys || {}) },
    models: { claude: '', openai: '', gemini: '', ...(s.models || {}) }
  };
}

function storeAiSettings(next) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(next));
  anthropicClientPromise = null;
}

function aiModelFor(provider, settings = loadAiSettings()) {
  return (settings.models[provider] || '').trim() || AI_PROVIDERS[provider].defaultModel;
}

// 예전 코드와의 호환 (Claude 키)
function loadAiKey() {
  return loadAiSettings().keys.claude || '';
}

async function getAnthropicClient(key) {
  if (!anthropicClientPromise) {
    anthropicClientPromise = import('https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.134.0/+esm')
      .then(mod => new mod.default({ apiKey: key, dangerouslyAllowBrowser: true }));
  }
  return anthropicClientPromise;
}

const BRAND_SYSTEM_PROMPT = `당신은 서울의 꽃집 '설담화(說談花)'의 카피라이터이자 상담 도우미입니다.
설담화는 2030 세대를 위한 모던 한국 헤리티지 플로리스트입니다. 한지, 여백, 달항아리, 화조도의 정서를 담고,
버려지는 포장 대신 오래 간직하는 복주머니·보자기 포장을 씁니다.
말투는 정갈하고 따뜻하며, 과장 광고나 사실과 다른 약속(할인, 무료 배송, 특정 꽃 재고 보장 등)은 하지 않습니다.
답은 반드시 한국어로 씁니다.`;

class AiHttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function askClaude(prompt, schema, key, model) {
  const client = await getAnthropicClient(key);
  const response = await client.beta.messages.create({
    model,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: BRAND_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    output_config: { format: { type: 'json_schema', schema } }
  });
  if (response.stop_reason === 'refusal') throw new Error('REFUSAL');
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('');
}

async function askOpenAI(prompt, schema, key, model) {
  // OpenAI는 키가 틀리면 브라우저에 오류 내용을 보여 주지 않아(연결 실패로 보임) 따로 표시
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: BRAND_SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      response_format: { type: 'json_schema', json_schema: { name: 'draft', strict: true, schema } }
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiHttpError(res.status, (data.error && data.error.message) || `HTTP ${res.status}`);
  const choice = data.choices && data.choices[0];
  if (choice && choice.message && choice.message.refusal) throw new Error('REFUSAL');
  return (choice && choice.message && choice.message.content) || '';
}

// Gemini 응답 스키마는 additionalProperties를 받지 않아 빼고 보냄
function geminiSchema(schema) {
  const { additionalProperties, ...rest } = schema;
  if (rest.properties) {
    rest.properties = Object.fromEntries(Object.entries(rest.properties).map(([k, v]) => [k, typeof v === 'object' ? geminiSchema(v) : v]));
  }
  return rest;
}

async function askGemini(prompt, schema, key, model) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: BRAND_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: geminiSchema(schema) }
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiHttpError(res.status, (data.error && data.error.message) || `HTTP ${res.status}`);
  const cand = data.candidates && data.candidates[0];
  if (!cand || cand.finishReason === 'SAFETY') throw new Error('REFUSAL');
  return ((cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
}

// 공통 호출: 고른 AI로 JSON 답을 받음 → { result, providerLabel }
async function askAiJson(prompt, schema, providerOverride) {
  const settings = loadAiSettings();
  const provider = providerOverride || settings.provider;
  const key = (settings.keys[provider] || '').trim();
  if (!key) throw new Error(`NO_KEY:${provider}`);
  const model = aiModelFor(provider, settings);
  const ask = { claude: askClaude, openai: askOpenAI, gemini: askGemini }[provider];
  let text;
  try {
    text = await ask(prompt, schema, key, model);
  } catch (e) {
    if (e && typeof e === 'object') e.provider = provider;
    throw e;
  }
  return { result: JSON.parse(text), providerLabel: `${AI_PROVIDERS[provider].label} (${model})` };
}

function aiErrorMessage(err) {
  const msg = String(err && err.message || err);
  if (msg.startsWith('NO_KEY')) {
    const p = AI_PROVIDERS[msg.split(':')[1]] || AI_PROVIDERS.claude;
    return `${p.label} 키가 없어요. [연동·데이터] 메뉴의 AI 도우미에서 키를 먼저 저장하거나, 다른 AI를 기본으로 골라 주세요.`;
  }
  if (msg === 'REFUSAL') return 'AI가 이 요청에는 답하지 않았어요. 내용을 조금 바꿔 다시 시도해 주세요.';
  const status = err && err.status;
  if (status === 400 && /api key/i.test(msg)) return 'AI 키가 올바르지 않아요. 키를 다시 확인해 주세요.';
  if (status === 400 && /model/i.test(msg)) return 'AI 모델 이름이 맞지 않아요. [연동·데이터]에서 모델 이름을 확인해 주세요.';
  if (err && err.provider === 'openai' && /Failed to fetch|NetworkError/i.test(msg)) return 'GPT에 연결하지 못했어요. 키가 틀리면 이렇게 보일 수 있어요. 키와 인터넷 연결을 확인해 주세요.';
  if (status === 401 || status === 403) return 'AI 키가 올바르지 않아요. 키를 다시 확인해 주세요.';
  if (status === 404) return 'AI 모델을 찾지 못했어요. [연동·데이터]에서 모델 이름을 확인해 주세요.';
  if (status === 429) return '요청이 많거나 사용 한도를 넘었어요. 잠시 뒤 다시 시도해 주세요.';
  if (status && status >= 500) return 'AI 서버가 잠시 불안정해요. 조금 뒤 다시 시도해 주세요.';
  if (/Failed to fetch|NetworkError|import/i.test(msg)) return '인터넷 연결을 확인해 주세요.';
  if (err instanceof SyntaxError) return 'AI 답을 읽지 못했어요. 한 번 더 눌러 주세요.';
  return `AI 초안을 만들지 못했어요. (${msg.slice(0, 80)})`;
}

async function draftProductCopy({ name, category, meaningHint, priceText }, providerOverride) {
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
  const { result, providerLabel } = await askAiJson(
    `다음 꽃 상품의 쇼핑몰 문구 초안을 써 주세요.\n상품명: ${name}\n종류: ${category}\n가격: ${priceText || '미정'}\n참고(꽃 종류·꽃말): ${meaningHint || '없음'}`,
    schema, providerOverride
  );
  return { ...result, providerLabel };
}

async function draftInquiryReply(inq, settings, providerOverride) {
  const schema = {
    type: 'object',
    properties: { reply: { type: 'string', description: '고객에게 보낼 답변 초안. 5~8문장, 인사와 마무리 포함' } },
    required: ['reply'],
    additionalProperties: false
  };
  const { result, providerLabel } = await askAiJson(
    `다음 1:1 상담 문의에 보낼 답변 초안을 써 주세요. 가격·재고를 확정하지 말고, 확인 후 다시 연락드린다는 흐름으로 써 주세요.\n` +
    `[매장 정보] 전화 ${settings.phone || '-'} / 이메일 ${settings.email || '-'}\n` +
    `[문의] 이름: ${inq.name}\n상담 유형: ${inq.type || '-'}\n문의 상품: ${inq.productName || '-'}\n받고 싶은 날짜: ${inq.date || '-'}\n내용: ${inq.message || ''}`,
    schema, providerOverride
  );
  return { reply: result.reply, providerLabel };
}
