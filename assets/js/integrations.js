// assets/js/integrations.js
// 설담화(說談花) 외부 연동: 디스코드 알림
// 쇼핑몰(주문·상담 알림)과 관리자(테스트·내일 제작 목록) 모두 이 파일을 씁니다.
// 지금은 같은 브라우저 저장소의 웹훅 주소를 쓰므로, 같은 컴퓨터에서 들어온 주문만 알림이 갑니다.
// 서버를 붙일 때는 sendDiscord()만 서버 호출로 바꾸면 됩니다.

const INTEGRATIONS_STORAGE_KEY = 'seoldamhwa_integrations';

const DEFAULT_INTEGRATIONS = {
  discordWebhook: '',
  notifyOrders: true,
  notifyInquiries: true
};

function loadIntegrations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(INTEGRATIONS_STORAGE_KEY) || '{}');
    return { ...DEFAULT_INTEGRATIONS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch (e) {
    return { ...DEFAULT_INTEGRATIONS };
  }
}

function saveIntegrations(obj) {
  const merged = { ...DEFAULT_INTEGRATIONS, ...obj };
  localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

// 디스코드 웹훅 주소만 허용 (다른 주소로 주문 정보가 새지 않게)
function isValidDiscordWebhook(url) {
  return /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(String(url || '').trim());
}

async function sendDiscord(payload, webhookUrl) {
  const url = (webhookUrl || loadIntegrations().discordWebhook || '').trim();
  if (!isValidDiscordWebhook(url)) return { ok: false, reason: 'no-webhook' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '설담화 알림', allowed_mentions: { parse: [] }, ...payload })
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, reason: 'network' };
  }
}

function discordWon(n) {
  return `${(Number(n) || 0).toLocaleString('ko-KR')}원`;
}

// 디스코드 글에서 @everyone 같은 호출이나 서식이 섞이지 않게 정리
function discordSafe(text, max = 300) {
  return String(text ?? '').slice(0, max).replace(/([\\`*_~|>])/g, '\\$1').replace(/@/g, '@\u200b');
}

// 새 주문 알림 (전화번호·주소는 보내지 않음)
function notifyOrderToDiscord(order) {
  const cfg = loadIntegrations();
  if (!cfg.notifyOrders || !isValidDiscordWebhook(cfg.discordWebhook) || order.isSample) return Promise.resolve({ ok: false, reason: 'off' });
  const items = (order.items || []).map(i => `• ${discordSafe(i.product && i.product.name, 60)}${i.sizeLabel ? ` (${discordSafe(i.sizeLabel, 20)})` : ''} × ${Number(i.quantity) || 1}${i.optionName ? ` · ${discordSafe(i.optionName, 40)}` : ''}`).join('\n');
  return sendDiscord({
    embeds: [{
      title: `🌸 새 주문 ${discordSafe(order.orderNumber, 40)}`,
      color: 0xA8401A,
      fields: [
        { name: '주문자', value: discordSafe(order.customerName, 40) || '-', inline: true },
        { name: '금액', value: discordWon(order.totalAmount), inline: true },
        { name: '희망 배송일', value: discordSafe(order.deliveryDate, 60) || '-', inline: false },
        { name: '상품', value: items || '-', inline: false },
        ...(order.message ? [{ name: '카드 메시지', value: discordSafe(order.message, 300), inline: false }] : [])
      ],
      footer: { text: '자세한 연락처와 주소는 관리자 센터에서 확인하세요.' }
    }]
  });
}

// 새 상담 알림 (전화번호는 보내지 않음)
function notifyInquiryToDiscord(inq) {
  const cfg = loadIntegrations();
  if (!cfg.notifyInquiries || !isValidDiscordWebhook(cfg.discordWebhook) || inq.isSample) return Promise.resolve({ ok: false, reason: 'off' });
  return sendDiscord({
    embeds: [{
      title: '💬 새 1:1 상담 문의',
      color: 0x1F7FA3,
      fields: [
        { name: '이름', value: discordSafe(inq.name, 40) || '-', inline: true },
        { name: '상담 유형', value: discordSafe(inq.type, 40) || '-', inline: true },
        { name: '받고 싶은 날짜', value: discordSafe(inq.date, 30) || '-', inline: true },
        ...(inq.productName ? [{ name: '문의 상품', value: discordSafe(inq.productName, 60), inline: false }] : []),
        { name: '내용', value: discordSafe(inq.message, 900) || '-', inline: false }
      ],
      footer: { text: '연락처는 관리자 센터 > 고객 상담 문의에서 확인하세요.' }
    }]
  });
}

// 특정 배송일의 제작 목록 (디스코드 제작 지시서)
function buildProductionMessage(orders, dateStr) {
  const list = orders.filter(o => o.status !== 'cancelled' && String(o.deliveryDate || '').startsWith(dateStr));
  if (list.length === 0) {
    return { embeds: [{ title: `🧺 ${dateStr} 제작 목록`, description: '이날 배송할 주문이 없어요.', color: 0x4C8A3B }] };
  }
  const totals = {};
  list.forEach(o => (o.items || []).forEach(i => {
    const key = `${(i.product && i.product.name) || '꽃 상품'}${i.sizeLabel ? ` (${i.sizeLabel})` : ''}`;
    totals[key] = (totals[key] || 0) + (Number(i.quantity) || 1);
  }));
  const summary = Object.entries(totals).map(([k, v]) => `• ${discordSafe(k, 60)} × ${v}`).join('\n');
  const detail = list.map((o, idx) => {
    const time = String(o.deliveryDate || '').slice(dateStr.length).trim() || '시간 미정';
    const items = (o.items || []).map(i => `${discordSafe(i.product && i.product.name, 40)}${i.sizeLabel ? `(${discordSafe(i.sizeLabel, 10)})` : ''}×${Number(i.quantity) || 1} / ${discordSafe(i.optionName || '기본 포장', 30)}`).join(', ');
    return `**${idx + 1}. ${discordSafe(o.orderNumber, 30)}** · ${discordSafe(time, 30)}\n${items}${o.message ? `\n✉️ "${discordSafe(o.message, 150)}"` : ''}`;
  }).join('\n\n');
  return {
    embeds: [
      { title: `🧺 ${dateStr} 제작 목록 · 총 ${list.length}건`, description: `**만들 꽃 합계**\n${summary}`, color: 0x4C8A3B },
      { title: '주문별 상세', description: detail.slice(0, 4000), color: 0xC9850F }
    ]
  };
}
