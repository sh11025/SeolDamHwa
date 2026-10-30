// assets/js/integrations.js
// 설담화(說談花) 외부 연동: 디스코드 알림 (주문 채널 / 상담 채널)
// 쇼핑몰(주문·상담 알림)과 관리자(테스트·제작 목록) 모두 이 파일을 씁니다.
// 지금은 같은 브라우저 저장소의 웹후크 주소를 쓰므로, 같은 컴퓨터에서 들어온 주문만 알림이 갑니다.
// 서버를 붙일 때는 sendDiscord()만 서버 호출로 바꾸면 됩니다.

const INTEGRATIONS_STORAGE_KEY = 'seoldamhwa_integrations';

const DEFAULT_INTEGRATIONS = {
  orderWebhook: '',     // 주문 알림·제작 목록 채널
  inquiryWebhook: '',   // 1:1 상담 알림 채널 (비우면 주문 채널로 보냄)
  notifyOrders: true,
  notifyInquiries: true
};

const DISCORD_COLORS = { order: 0xA8401A, inquiry: 0x1F7FA3, production: 0x4C8A3B, slot: 0xC9850F };

function loadIntegrations() {
  let parsed = {};
  try { parsed = JSON.parse(localStorage.getItem(INTEGRATIONS_STORAGE_KEY) || '{}') || {}; } catch (e) { parsed = {}; }
  // 예전 설정(웹후크 하나)은 주문 채널로 옮김
  if (parsed.discordWebhook && !parsed.orderWebhook) parsed.orderWebhook = parsed.discordWebhook;
  delete parsed.discordWebhook;
  return { ...DEFAULT_INTEGRATIONS, ...parsed };
}

function saveIntegrations(obj) {
  const merged = { ...DEFAULT_INTEGRATIONS, ...obj };
  delete merged.discordWebhook;
  localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

// 디스코드 웹후크 주소만 허용 (다른 주소로 주문 정보가 새지 않게)
function isValidDiscordWebhook(url) {
  return /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(String(url || '').trim());
}

// channel: 'order' | 'inquiry' (상담 채널이 비어 있으면 주문 채널 사용)
function getWebhookFor(channel) {
  const cfg = loadIntegrations();
  if (channel === 'inquiry') return (cfg.inquiryWebhook || cfg.orderWebhook || '').trim();
  return (cfg.orderWebhook || '').trim();
}

async function sendDiscord(payload, webhookUrl) {
  const url = String(webhookUrl || '').trim();
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

// 디스코드 서식 기호와 @호출이 섞이지 않게 정리 (본문용)
function discordSafe(text, max = 300) {
  return String(text ?? '').slice(0, max).replace(/([\\`*_~|>])/g, '\\$1').replace(/@/g, '@\u200b');
}

// 제목·작성자 칸은 서식이 적용되지 않으므로 @호출만 막음
function discordPlain(text, max = 200) {
  return String(text ?? '').slice(0, max).replace(/@/g, '@\u200b');
}

function discordWeekday(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y) return '';
  return ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
}

// "2026-11-02 오전 10:00~13:00" → "11월 2일(월) 오전 10:00~13:00"
function discordDeliveryText(deliveryDate, plain = false) {
  const clean = plain ? discordPlain : discordSafe;
  const s = String(deliveryDate || '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s*(.*)$/);
  if (!m) return clean(s, 60) || '-';
  return `${Number(m[2])}월 ${Number(m[3])}일(${discordWeekday(`${m[1]}-${m[2]}-${m[3]}`)}) ${clean(m[4], 40)}`.trim();
}

function discordItemLines(items) {
  return (items || []).map(i => {
    const name = discordSafe(i.product && i.product.name, 60) || '꽃 상품';
    const size = i.sizeLabel ? ` · ${discordSafe(i.sizeLabel, 20)}` : '';
    const opt = i.optionName ? `\n　└ ${discordSafe(i.optionName, 40)}` : '';
    return `🌷 **${name}**${size} × ${Number(i.quantity) || 1}${opt}`;
  }).join('\n') || '-';
}

// 새 주문 알림 (전화번호·주소는 보내지 않음)
function notifyOrderToDiscord(order) {
  const cfg = loadIntegrations();
  const url = getWebhookFor('order');
  if (!cfg.notifyOrders || !isValidDiscordWebhook(url) || order.isSample) return Promise.resolve({ ok: false, reason: 'off' });
  return sendDiscord({
    embeds: [{
      author: { name: '🌸 새 주문이 들어왔어요' },
      title: discordPlain(order.orderNumber, 40),
      color: DISCORD_COLORS.order,
      description: [
        `📅 **배송** ${discordDeliveryText(order.deliveryDate)}`,
        `👤 **주문자** ${discordSafe(order.customerName, 40) || '-'}`,
        `💳 **금액** ${discordWon(order.totalAmount)}`
      ].join('\n'),
      fields: [
        { name: '주문 상품', value: discordItemLines(order.items) },
        ...(order.message ? [{ name: '✉️ 카드 메시지', value: `> ${discordSafe(order.message, 300)}` }] : [])
      ],
      footer: { text: '연락처·주소는 관리자 센터 > 주문 관리에서 확인하세요' },
      timestamp: new Date().toISOString()
    }]
  }, url);
}

// 새 상담 알림 (전화번호는 보내지 않음)
function notifyInquiryToDiscord(inq) {
  const cfg = loadIntegrations();
  const url = getWebhookFor('inquiry');
  if (!cfg.notifyInquiries || !isValidDiscordWebhook(url) || inq.isSample) return Promise.resolve({ ok: false, reason: 'off' });
  const wanted = /^\d{4}-\d{2}-\d{2}$/.test(String(inq.date)) ? discordDeliveryText(inq.date) : (discordSafe(inq.date, 30) || '미정');
  return sendDiscord({
    embeds: [{
      author: { name: '💬 새 1:1 상담 문의' },
      title: `${discordPlain(inq.name, 40) || '고객'} 님 · ${discordPlain(inq.type, 40) || '상담'}`,
      color: DISCORD_COLORS.inquiry,
      description: [
        `📅 **받고 싶은 날짜** ${wanted}`,
        ...(inq.productName ? [`🌷 **문의 상품** ${discordSafe(inq.productName, 60)}`] : [])
      ].join('\n'),
      fields: [{ name: '문의 내용', value: `> ${discordSafe(inq.message, 900).replace(/\n/g, '\n> ') || '-'}` }],
      footer: { text: '답변은 관리자 센터 > 고객 상담 문의에서 남겨 주세요' },
      timestamp: new Date().toISOString()
    }]
  }, url);
}

// 특정 배송일의 제작 목록 (디스코드 제작 지시서) - 합계 + 시간대별 주문
function buildProductionMessage(orders, dateStr) {
  const list = orders.filter(o => o.status !== 'cancelled' && String(o.deliveryDate || '').startsWith(dateStr));
  const dayTitle = `🧺 ${discordDeliveryText(dateStr, true)} 제작 목록`;
  if (list.length === 0) {
    return { embeds: [{ title: dayTitle, description: '이날 배송할 주문이 없어요. 🍵', color: DISCORD_COLORS.production }] };
  }
  const totals = {};
  list.forEach(o => (o.items || []).forEach(i => {
    const key = `${(i.product && i.product.name) || '꽃 상품'}${i.sizeLabel ? ` · ${i.sizeLabel}` : ''}`;
    totals[key] = (totals[key] || 0) + (Number(i.quantity) || 1);
  }));
  const totalCount = Object.values(totals).reduce((a, b) => a + b, 0);
  const summary = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `☐ **${discordSafe(k, 60)}** × ${v}`)
    .join('\n');

  // 시간대별로 묶기 (오전 / 오후 / 그 외)
  const slots = {};
  list.forEach(o => {
    const time = String(o.deliveryDate || '').slice(dateStr.length).trim() || '시간 미정';
    (slots[time] = slots[time] || []).push(o);
  });
  const slotEmbeds = Object.entries(slots).sort((a, b) => a[0].localeCompare(b[0])).map(([time, os]) => ({
    title: `🕘 ${discordPlain(time, 40)} · ${os.length}건`,
    color: DISCORD_COLORS.slot,
    description: os.map((o, idx) => {
      const items = (o.items || []).map(i => `${discordSafe(i.product && i.product.name, 40)}${i.sizeLabel ? `(${discordSafe(i.sizeLabel, 10)})` : ''} × ${Number(i.quantity) || 1} — ${discordSafe(i.optionName || '기본 포장', 30)}`).join('\n　');
      return `**${idx + 1}. ${discordSafe(o.orderNumber, 30)}**\n　${items}${o.message ? `\n　✉️ _${discordSafe(o.message, 150)}_` : ''}`;
    }).join('\n\n').slice(0, 4000)
  }));

  return {
    embeds: [
      { title: dayTitle, description: `총 **${list.length}건 · 꽃 ${totalCount}개**\n\n${summary}`, color: DISCORD_COLORS.production },
      ...slotEmbeds.slice(0, 9)
    ]
  };
}
