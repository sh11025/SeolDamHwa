// assets/js/admin/admin-finance.js
// 설담화 관리자: 매출·지출 관리·PDF 리포트
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 7. 매출·지출 관리
function initFinanceForm() {
  const cat = document.getElementById('expense-category');
  const method = document.getElementById('expense-method');
  if (cat && !cat.options.length) cat.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  if (method && !method.options.length) method.innerHTML = EXPENSE_METHODS.map(c => `<option value="${c}">${c}</option>`).join('');
  const monthEl = document.getElementById('finance-month');
  if (monthEl && !monthEl.value) monthEl.value = financeToday().slice(0, 7);
  resetExpenseForm();
}

function resetExpenseForm() {
  document.getElementById('expense-id').value = '';
  document.getElementById('expense-date').value = financeToday();
  document.getElementById('expense-category').selectedIndex = 0;
  document.getElementById('expense-method').selectedIndex = 0;
  document.getElementById('expense-amount').value = '';
  document.getElementById('expense-memo').value = '';
  document.getElementById('expense-form-title').innerText = '지출 적기';
  document.getElementById('expense-submit-btn').innerText = '지출 추가';
  document.getElementById('expense-cancel-edit').classList.add('hidden');
}

function saveExpense(e) {
  e.preventDefault();
  const id = document.getElementById('expense-id').value;
  const date = document.getElementById('expense-date').value.trim();
  if (!date) {
    alert('날짜를 입력해 주세요.');
    return;
  }
  const amtRaw = String(document.getElementById('expense-amount').value || '').replace(/,/g, '').trim();
  const amount = Number(amtRaw);
  if (!amtRaw || isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
    alert('금액을 1원 이상의 정수로 적어 주세요.');
    return;
  }
  const entry = {
    id: id || makeId('exp'),
    date,
    category: document.getElementById('expense-category').value,
    amount,
    method: document.getElementById('expense-method').value,
    memo: document.getElementById('expense-memo').value.trim()
  };
  const list = loadExpenses();
  const idx = list.findIndex(x => x.id === entry.id);
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  saveExpenses(list);
  // 방금 적은 지출이 보이도록 그 달로 이동
  document.getElementById('finance-month').value = entry.date.slice(0, 7);
  resetExpenseForm();
  renderFinance();
  renderDashboard();
}

function editExpense(id) {
  const x = loadExpenses().find(e => e.id === id);
  if (!x) return;
  document.getElementById('expense-id').value = x.id;
  document.getElementById('expense-date').value = x.date;
  document.getElementById('expense-category').value = x.category;
  document.getElementById('expense-method').value = x.method || EXPENSE_METHODS[0];
  document.getElementById('expense-amount').value = x.amount;
  document.getElementById('expense-memo').value = x.memo || '';
  document.getElementById('expense-form-title').innerText = '지출 고치기';
  document.getElementById('expense-submit-btn').innerText = '고친 내용 저장';
  document.getElementById('expense-cancel-edit').classList.remove('hidden');
  document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteExpense(id) {
  const x = loadExpenses().find(e => e.id === id);
  if (!x) return;
  if (!confirm(`${x.date} ${x.category} ${formatWon(x.amount)} 지출을 지울까요?`)) return;
  saveExpenses(loadExpenses().filter(e => e.id !== id));
  renderFinance();
  renderDashboard();
}

function renderFinance() {
  const monthEl = document.getElementById('finance-month');
  if (!monthEl) return;
  if (!monthEl.value) monthEl.value = financeToday().slice(0, 7);
  const [y, m] = monthEl.value.split('-').map(Number);
  const from = `${monthEl.value}-01`;
  const to = toDateStr(new Date(y, m, 0)); // 그 달 마지막 날
  const sum = summarizePeriod(from, to);

  document.getElementById('fin-revenue').innerText = formatWon(sum.revenue);
  document.getElementById('fin-expense').innerText = formatWon(sum.expense);
  const profitEl = document.getElementById('fin-profit');
  profitEl.innerText = (sum.profit < 0 ? '−' : '') + formatWon(Math.abs(sum.profit));
  profitEl.classList.toggle('text-seal-red', sum.profit < 0);

  // 분류별 지출 막대 (한 가지 색, 값은 글자로 함께 표시)
  const bars = document.getElementById('fin-category-bars');
  const max = Math.max(1, ...Object.values(sum.byCategory));
  bars.innerHTML = EXPENSE_CATEGORIES.map(c => {
    const v = sum.byCategory[c] || 0;
    const pct = Math.round(v / max * 100);
    return `<div class="grid grid-cols-[88px_1fr_96px] items-center gap-2">
      <span class="text-ink-gray">${c}</span>
      <span class="h-3 bg-black/5 rounded-sm overflow-hidden"><span class="block h-full rounded-sm" style="width:${pct}%;background:${CHART_COLORS.expense}"></span></span>
      <span class="text-right font-bold text-ink-black">${formatWon(v)}</span>
    </div>`;
  }).join('');

  const tbody = document.getElementById('fin-expense-table');
  const rows = sum.expenses.slice().sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById('fin-expense-count').innerText = `(${m}월 ${rows.length}건)`;
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-ink-gray">이 달에 적은 지출이 없어요. 왼쪽에서 지출을 적어 보세요.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(x => `
    <tr class="hover:bg-[#F3EDE3]/40">
      <td class="py-2 px-3 whitespace-nowrap">${escapeHtml(x.date)}</td>
      <td class="py-2 px-3">${escapeHtml(x.category)}</td>
      <td class="py-2 px-3 text-ink-gray">${escapeHtml(x.memo || '-')}</td>
      <td class="py-2 px-3">${escapeHtml(x.method || '-')}</td>
      <td class="py-2 px-3 text-right font-bold whitespace-nowrap">${formatWon(x.amount)}</td>
      <td class="py-2 px-3 text-center whitespace-nowrap space-x-1">
        <button onclick="editExpense('${x.id}')" class="px-2 py-0.5 border border-ink-black/20 bg-white rounded-xs text-xs font-bold cursor-pointer hover:border-seal-red hover:text-seal-red">수정</button>
        <button onclick="deleteExpense('${x.id}')" class="px-2 py-0.5 border border-ink-black/20 bg-white rounded-xs text-xs font-bold cursor-pointer hover:border-seal-red hover:text-seal-red">삭제</button>
      </td>
    </tr>`).join('');
}

// 8. PDF 리포트 (브라우저 인쇄 → 'PDF로 저장')
let reportPreset = 'today';

function openReportModal() {
  document.getElementById('report-modal').classList.remove('hidden');
  document.getElementById('report-error').classList.add('hidden');
  setReportPreset(reportPreset);
}

function closeReportModal() {
  document.getElementById('report-modal').classList.add('hidden');
}

function setReportPreset(preset) {
  reportPreset = preset;
  document.querySelectorAll('.report-preset').forEach(b => b.classList.toggle('active', b.dataset.preset === preset));
  const fromEl = document.getElementById('report-from');
  const toEl = document.getElementById('report-to');
  if (preset !== 'custom') {
    const r = getPeriodRange(preset);
    fromEl.value = r.from;
    toEl.value = r.to;
  }
  fromEl.disabled = toEl.disabled = preset !== 'custom';
}

function reportTable(headers, rows, numericCols = []) {
  const th = headers.map((h, i) => `<th class="${numericCols.includes(i) ? 'num' : ''}">${h}</th>`).join('');
  const body = rows.length
    ? rows.map(r => `<tr>${r.map((c, i) => `<td class="${numericCols.includes(i) ? 'num' : ''}">${c}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}" style="text-align:center;color:#888;padding:10px">기록이 없습니다.</td></tr>`;
  return `<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
}

// 인쇄용 차트는 그림(PNG)으로 넣어야 PDF에서 깨지지 않음
function renderReportChartImage(daily) {
  if (typeof Chart === 'undefined' || daily.length < 2) return '';
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;height:300px;';
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 300;
  holder.appendChild(canvas);
  document.body.appendChild(holder);
  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: daily.map(r => shortDate(r.date)),
      datasets: [
        { label: '매출', data: daily.map(r => r.revenue), backgroundColor: CHART_COLORS.revenue, borderRadius: 3, maxBarThickness: 16 },
        { label: '지출', data: daily.map(r => r.expense), backgroundColor: CHART_COLORS.expense, borderRadius: 3, maxBarThickness: 16 }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 2,
      plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 10, font: { family: 'Pretendard', size: 12 } } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 11 } } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: wonAxis, font: { family: 'Pretendard', size: 11 } } }
      }
    }
  });
  const url = canvas.toDataURL('image/png');
  chart.destroy();
  holder.remove();
  return `<div class="avoid-break"><h2>날짜별 매출·지출</h2><img src="${url}" alt="날짜별 매출과 지출 막대 차트" style="width:100%;height:auto"></div>`;
}

function generateReport() {
  const from = document.getElementById('report-from').value;
  const to = document.getElementById('report-to').value;
  const errEl = document.getElementById('report-error');
  const showErr = msg => { errEl.innerText = msg; errEl.classList.remove('hidden'); };
  if (!from || !to) return showErr('시작일과 종료일을 모두 골라 주세요.');
  if (from > to) return showErr('시작일이 종료일보다 늦어요.');
  if (daysBetween(from, to) > 366) return showErr('리포트는 최대 1년까지 만들 수 있어요.');

  const sum = summarizePeriod(from, to);
  const daily = dailySeries(from, to);
  const products = productRevenue(from, to);
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  const periodText = from === to ? `${from} (${weekdayLabel(from)})` : `${from} ~ ${to} (${daysBetween(from, to) + 1}일)`;
  const now = new Date();
  const made = `${toDateStr(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const summaryRows = [
    ['매출 (취소 제외)', formatWon(sum.revenue)],
    ['주문 수', `${sum.orderCount}건`],
    ['평균 주문 금액', formatWon(sum.avgOrder)],
    ['취소된 주문', `${sum.cancelled.length}건 · ${formatWon(sum.cancelledAmount)}`],
    ['지출', formatWon(sum.expense)],
    ['순이익 (매출 − 지출)', `<strong>${sum.profit < 0 ? '−' : ''}${formatWon(Math.abs(sum.profit))}</strong>`],
    ['이익률', sum.revenue > 0 ? `${Math.round(sum.profit / sum.revenue * 100)}%` : '-']
  ];

  const orderRows = sum.orders.concat(sum.cancelled)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map(o => [
      escapeHtml(getOrderDate(o)),
      escapeHtml(o.orderNumber),
      escapeHtml(o.customerName),
      escapeHtml((o.items || []).map(i => `${i.product && i.product.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ''} ×${Number(i.quantity) || 1}`).join(', ')),
      escapeHtml(getDeliveryDate(o) || o.deliveryDate || ''),
      escapeHtml(ORDER_STATUS_LABELS[o.status] || o.status),
      o.status === 'cancelled' ? `<s>${formatWon(o.totalAmount)}</s>` : formatWon(o.totalAmount)
    ]);

  const expenseRows = [];
  EXPENSE_CATEGORIES.forEach(c => {
    const items = sum.expenses.filter(x => x.category === c).sort((a, b) => a.date.localeCompare(b.date));
    if (!items.length) return;
    items.forEach(x => expenseRows.push([escapeHtml(x.date), escapeHtml(c), escapeHtml(x.memo || '-'), escapeHtml(x.method || '-'), formatWon(x.amount)]));
    expenseRows.push(['', `<strong>${escapeHtml(c)} 합계</strong>`, '', '', `<strong>${formatWon(sum.byCategory[c])}</strong>`]);
  });

  const sheet = document.getElementById('report-sheet');
  sheet.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1A1A1A;padding-bottom:8px">
      <div style="display:flex;align-items:center;gap:10px">
        <img src="assets/images/seal.svg" alt="" style="width:34px;height:34px">
        <div>
          <div style="font-size:18px;font-weight:800">설담화(說談花) 매출·지출 리포트</div>
          <div style="color:#555">기간: ${periodText}</div>
        </div>
      </div>
      <div style="text-align:right;color:#555;font-size:10px">
        작성: ${made}<br>${escapeHtml(settings.phone || '')} ${settings.email ? '· ' + escapeHtml(settings.email) : ''}
      </div>
    </div>
    <div class="avoid-break"><h2>요약</h2>${reportTable(['항목', '금액'], summaryRows, [1])}</div>
    ${renderReportChartImage(daily)}
    ${daily.length > 1 ? `<div><h2>날짜별 내역 <span style="font-weight:400;color:#888;font-size:10px">(주문·지출이 있던 날만)</span></h2>${reportTable(['날짜', '주문 수', '매출', '지출', '순이익'], daily.filter(r => r.orderCount || r.expense).map(r => [`${r.date} (${weekdayLabel(r.date)})`, `${r.orderCount}건`, formatWon(r.revenue), formatWon(r.expense), (r.profit < 0 ? '−' : '') + formatWon(Math.abs(r.profit))]), [1, 2, 3, 4])}</div>` : ''}
    <div><h2>상품별 매출</h2>${reportTable(['상품', '매출'], products.map(p => [escapeHtml(p.name), formatWon(p.amount)]), [1])}</div>
    <div><h2>주문 내역 (${sum.orderCount + sum.cancelled.length}건)</h2>${reportTable(['주문일', '주문번호', '주문자', '상품', '배송일', '상태', '금액'], orderRows, [6])}</div>
    <div><h2>지출 내역 (${sum.expenses.length}건)</h2>${reportTable(['날짜', '분류', '메모', '결제 수단', '금액'], expenseRows, [4])}</div>
    ${typeof hasSampleData === 'function' && hasSampleData() ? '<p style="margin-top:10px;padding:6px 8px;border:1px solid #d9a21b;background:#fff8e6;font-weight:700">⚠ [예시] 데이터가 포함된 리포트입니다. 실제 운영 기록이 아닙니다.</p>' : ''}
    <p style="margin-top:14px;color:#888;font-size:9px">이 리포트는 관리자 컴퓨터에 저장된 주문·지출 기록으로 만들었습니다. 매출은 주문일 기준이며 취소된 주문은 빠져 있습니다.</p>
  `;

  closeReportModal();
  const prevTitle = document.title;
  document.title = `설담화_리포트_${from}${from === to ? '' : '_' + to}`;
  const restore = () => { document.title = prevTitle; window.removeEventListener('afterprint', restore); };
  window.addEventListener('afterprint', restore);
  // 로고 이미지가 준비된 뒤 인쇄
  const imgs = [...sheet.querySelectorAll('img')];
  Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; })))
    .then(() => setTimeout(() => window.print(), 50));
}
