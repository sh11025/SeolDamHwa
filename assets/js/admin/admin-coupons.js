// assets/js/admin/admin-coupons.js
// 설담화 관리자: 오프라인 쿠폰 (묶음 만들기 · 인쇄용 카드 · 사용 현황 · 멈추기)
// 쿠폰 데이터·확인 규칙은 assets/js/coupons.js

function couponBatches() {
  const map = new Map();
  loadCoupons().forEach(c => {
    if (!map.has(c.batchId)) map.set(c.batchId, { ...c, codes: [] });
    map.get(c.batchId).codes.push(c);
  });
  return [...map.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function couponBatchState(b) {
  const today = couponToday();
  if (b.active === false) return ['멈춤', 'bg-gray-100 text-gray-700'];
  if (b.endDate && today > b.endDate) return ['기간 끝', 'bg-gray-100 text-gray-700'];
  if (b.startDate && today < b.startDate) return ['시작 전', 'bg-amber-100 text-amber-800'];
  return ['사용 중', 'bg-emerald-100 text-emerald-800'];
}

function renderCouponsAdmin() {
  const tbody = document.getElementById('coupon-batch-table');
  if (!tbody) return;
  const batches = couponBatches();
  const badge = document.getElementById('badge-coupon-count');
  if (badge) badge.textContent = batches.filter(b => couponBatchState(b)[0] === '사용 중').length || '';
  tbody.innerHTML = '';
  if (!batches.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-ink-gray">아직 만든 쿠폰이 없어요. 위에서 첫 쿠폰 묶음을 만들어 보세요.</td></tr>';
    return;
  }
  batches.forEach(b => {
    const used = b.codes.filter(c => c.usedAt).length;
    const [state, cls] = couponBatchState(b);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#FAF7F2]';
    tr.innerHTML = `
      <td class="py-3 px-4 font-bold text-ink-black">${escapeHtml(b.batchName)}<p class="text-[11px] font-normal text-ink-gray">${escapeHtml(String(b.createdAt).slice(0, 10))} 만듦</p></td>
      <td class="py-3 px-4 font-bold text-seal-red">${escapeHtml(couponLabel(b))}${Number(b.minOrder) ? `<p class="text-[11px] font-normal text-ink-gray">${Number(b.minOrder).toLocaleString()}원 이상 주문</p>` : ''}</td>
      <td class="py-3 px-4 text-ink-gray whitespace-nowrap">${escapeHtml(b.startDate || '')} ~ ${escapeHtml(b.endDate || '')}</td>
      <td class="py-3 px-4"><span class="font-bold text-ink-black">${used}</span> / ${b.codes.length}장
        <div class="mt-1 h-1.5 w-24 bg-ink-black/10 rounded-full overflow-hidden"><div class="h-full bg-seal-red" style="width:${Math.round((used / b.codes.length) * 100)}%"></div></div></td>
      <td class="py-3 px-4"><span class="px-2 py-0.5 rounded font-bold ${cls}">${state}</span></td>
      <td class="py-3 px-4 text-center whitespace-nowrap space-x-1"></td>`;
    const actions = tr.lastElementChild;
    const btn = (text, fn, extra = '') => {
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = text;
      x.className = `px-2.5 py-1 border border-ink-black/20 bg-white rounded-xs font-bold hover:border-seal-red hover:text-seal-red cursor-pointer ${extra}`;
      x.onclick = fn;
      actions.appendChild(x);
    };
    btn('인쇄', () => printCouponBatch(b.batchId));
    btn('코드 목록', () => toggleCouponCodes(b.batchId, tr));
    btn(b.active === false ? '다시 쓰기' : '멈추기', () => setCouponBatchActive(b.batchId, b.active === false));
    btn('지우기', () => deleteCouponBatch(b.batchId), 'hover:border-red-400 hover:text-red-700');
    tbody.appendChild(tr);
  });
}

function toggleCouponCodes(batchId, row) {
  const next = row.nextElementSibling;
  if (next && next.dataset.codesFor === batchId) { next.remove(); return; }
  const codes = loadCoupons().filter(c => c.batchId === batchId);
  const tr = document.createElement('tr');
  tr.dataset.codesFor = batchId;
  const td = document.createElement('td');
  td.colSpan = 6;
  td.className = 'px-4 pb-4 bg-[#FAF7F2]';
  td.innerHTML = `<div class="flex flex-wrap gap-1.5 pt-2">${codes.map(c => `<span class="font-mono text-[11px] px-2 py-1 rounded-xs border ${c.usedAt ? 'bg-gray-100 text-gray-500 line-through border-gray-200' : 'bg-white border-ink-black/15 text-ink-black'}" title="${c.usedAt ? `사용됨 · ${escapeHtml(c.orderNumber || '')}` : '아직 안 씀'}">${escapeHtml(c.code)}${c.usedAt ? ` · ${escapeHtml(c.orderNumber || '')}` : ''}</span>`).join('')}</div>`;
  tr.appendChild(td);
  row.after(tr);
}

function createCouponBatch(e) {
  e.preventDefault();
  const val = id => document.getElementById(id).value.trim();
  const name = val('coupon-name');
  const type = document.querySelector('input[name="coupon-type"]:checked').value;
  const value = Number(val('coupon-value'));
  const count = Math.round(Number(val('coupon-count')));
  const startDate = val('coupon-start');
  const endDate = val('coupon-end');
  const minOrder = Number(val('coupon-min')) || 0;
  const msg = document.getElementById('coupon-form-message');
  const fail = text => { msg.textContent = text; msg.className = 'text-xs font-bold text-red-700'; };
  if (!name) return fail('쿠폰 이름을 적어 주세요.');
  if (!(value > 0) || (type === 'percent' && value > 90)) return fail(type === 'percent' ? '할인율은 1~90% 사이로 적어 주세요.' : '할인 금액을 적어 주세요.');
  if (!(count >= 1 && count <= 500)) return fail('장수는 1~500장 사이로 적어 주세요.');
  if (!startDate || !endDate || endDate < startDate) return fail('기간을 확인해 주세요 (끝나는 날이 시작일보다 뒤여야 해요).');
  const list = loadCoupons();
  const taken = new Set(list.map(c => c.code));
  const batchId = `cb-${Date.now()}`;
  const createdAt = new Date().toISOString();
  for (let i = 0; i < count; i++) {
    list.push({ code: randomCouponCode(taken), batchId, batchName: name, type, value, minOrder, startDate, endDate, active: true, createdAt, usedAt: '', orderNumber: '' });
  }
  saveCoupons(list);
  document.getElementById('coupon-form').reset();
  fillCouponFormDefaults();
  msg.textContent = `'${name}' 쿠폰 ${count}장을 만들었어요. 아래 목록에서 [인쇄]를 눌러 카드를 뽑으세요.`;
  msg.className = 'text-xs font-bold text-emerald-700';
  renderCouponsAdmin();
}

function setCouponBatchActive(batchId, active) {
  saveCoupons(loadCoupons().map(c => (c.batchId === batchId ? { ...c, active } : c)));
  renderCouponsAdmin();
}

function deleteCouponBatch(batchId) {
  const codes = loadCoupons().filter(c => c.batchId === batchId);
  if (!codes.length) return;
  const used = codes.filter(c => c.usedAt).length;
  const msg = used
    ? `'${codes[0].batchName}' 쿠폰 묶음을 지울까요?\n이미 ${used}장이 쓰였어요. 지워도 주문 기록의 할인 금액은 남지만, 아직 안 쓴 ${codes.length - used}장은 더 이상 쓸 수 없어요.\n잠깐 막기만 하려면 [멈추기]를 쓰세요.`
    : `'${codes[0].batchName}' 쿠폰 ${codes.length}장을 지울까요? 이미 나눠 준 카드는 쓸 수 없게 돼요.`;
  if (!confirm(msg)) return;
  saveCoupons(loadCoupons().filter(c => c.batchId !== batchId));
  renderCouponsAdmin();
}

function fillCouponFormDefaults() {
  const today = couponToday();
  const end = new Date(Date.now() + 90 * 864e5);
  const endStr = typeof getKoreaTimeParts === 'function' ? getKoreaTimeParts(end).dateStr : end.toISOString().slice(0, 10);
  const s = document.getElementById('coupon-start');
  const e = document.getElementById('coupon-end');
  if (s && !s.value) s.value = today;
  if (e && !e.value) e.value = endStr;
  updateCouponValueUnit();
}

function updateCouponValueUnit() {
  const type = (document.querySelector('input[name="coupon-type"]:checked') || {}).value;
  const unit = document.getElementById('coupon-value-unit');
  if (unit) unit.textContent = type === 'percent' ? '%' : '원';
}

// A4 인쇄용 쿠폰 카드 (한 장에 8장, 코드 + QR)
function printCouponBatch(batchId) {
  const codes = loadCoupons().filter(c => c.batchId === batchId && !c.usedAt);
  if (!codes.length) { alert('인쇄할 (아직 안 쓴) 쿠폰이 없어요.'); return; }
  const shopUrl = location.href.replace(/admin-index\.html.*$/, 'index.html');
  const w = window.open('', '_blank');
  if (!w) { alert('팝업이 막혔어요. 브라우저에서 이 사이트의 팝업을 허용해 주세요.'); return; }
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const b = codes[0];
  const cond = [Number(b.minOrder) ? `${Number(b.minOrder).toLocaleString()}원 이상 주문 시` : '', `${b.startDate} ~ ${b.endDate}`, '한 번만 사용 · 배송비 제외'].filter(Boolean).join(' · ');
  const cards = codes.map(c => `
    <div class="card">
      <div class="top"><span class="brand">설담화</span><span class="name">${esc(b.batchName)}</span></div>
      <div class="value">${esc(couponLabel(b))}</div>
      <div class="bottom">
        <div><div class="code">${esc(c.code)}</div><div class="cond">${esc(cond)}</div><div class="how">결제할 때 '쿠폰 코드'에 입력하거나 QR을 찍어 주세요.</div></div>
        <div class="qr" data-url="${esc(`${shopUrl}?coupon=${encodeURIComponent(c.code)}`)}"></div>
      </div>
    </div>`).join('');
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(b.batchName)} 쿠폰 인쇄</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; margin: 0; color: #1A1A1A; }
  .bar { padding: 10px; background: #FAF7F2; border-bottom: 1px solid #ddd; font-size: 13px; }
  .bar button { padding: 6px 14px; font-weight: bold; cursor: pointer; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; padding: 6mm; }
  .card { border: 1.5px dashed #8B2500; border-radius: 3mm; padding: 5mm; height: 58mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; break-inside: avoid; background: #FBF9F5; }
  .top { display: flex; justify-content: space-between; align-items: baseline; }
  .brand { font-size: 18px; font-weight: 800; color: #8B2500; letter-spacing: 2px; }
  .name { font-size: 11px; color: #555; }
  .value { font-size: 26px; font-weight: 800; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 4mm; }
  .code { font-family: Consolas, monospace; font-size: 17px; font-weight: bold; letter-spacing: 1px; }
  .cond, .how { font-size: 9.5px; color: #555; margin-top: 1mm; }
  .qr { width: 22mm; height: 22mm; flex-shrink: 0; }
  .qr img, .qr canvas { width: 22mm !important; height: 22mm !important; }
  @media print { .bar { display: none; } .grid { padding: 0; } }
</style></head><body>
<div class="bar">쿠폰 ${codes.length}장 (아직 안 쓴 것만) · QR은 쇼핑몰 주소 <b>${esc(shopUrl)}</b> 로 연결돼요. 사이트 주소가 바뀌면 다시 인쇄해 주세요. <button onclick="print()">인쇄하기</button></div>
<div class="grid">${cards}</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<script>
  document.querySelectorAll('.qr').forEach(el => { try { new QRCode(el, { text: el.dataset.url, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.M }); } catch (e) { el.textContent = ''; } });
<\/script>
</body></html>`);
  w.document.close();
}

document.addEventListener('DOMContentLoaded', () => {
  fillCouponFormDefaults();
  renderCouponsAdmin();
});
