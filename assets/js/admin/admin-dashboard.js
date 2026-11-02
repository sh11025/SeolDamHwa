// assets/js/admin/admin-dashboard.js
// 설담화 관리자: 데이터 불러오기·첫 실행·대시보드(숫자 카드·차트·최근 주문)
// admin-index.html에서 순서대로 불러옵니다 (함수는 전역으로 공유).

// 데이터 가져오기 및 초기화
function loadAdminProducts() {
  return loadProducts();
}

// 주문 불러오기 (예전 예시 주문은 finance-data.js의 loadOrders()에서 자동 정리)
function loadAdminOrders() {
  return loadOrders();
}

// 초기 실행
document.addEventListener('DOMContentLoaded', () => {
  try { renderDashboard(); } catch (e) { console.error('renderDashboard error:', e); }
  try { renderProductsTable(); } catch (e) { console.error('renderProductsTable error:', e); }
  try { renderOrdersList(); } catch (e) { console.error('renderOrdersList error:', e); }
  try { renderInquiriesList(); } catch (e) { console.error('renderInquiriesList error:', e); }
  try { renderAdminSettings(); } catch (e) { console.error('renderAdminSettings error:', e); }
  try { initPopupsAdmin(); } catch (e) { console.error('initPopupsAdmin error:', e); }
  try { initFinanceForm(); renderFinance(); } catch (e) { console.error('renderFinance error:', e); }
  try { renderSampleBanner(); renderIntegrations(); } catch (e) { console.error('renderIntegrations error:', e); }
  try { renderDeliverySettings(); } catch (e) { console.error('renderDeliverySettings error:', e); }
  try { renderRestockList(); } catch (e) { console.error('renderRestockList error:', e); }
});

// 1. 대시보드 요약 렌더링

// 차트 색 (색약 검사 통과: 매출 #A8401A / 지출 #1F7FA3)
const CHART_COLORS = {
  revenue: '#A8401A',
  expense: '#1F7FA3',
  preparing: '#A8401A',
  packaged: '#C9850F',
  delivering: '#1F7FA3',
  completed: '#4C8A3B'
};
const ORDER_STATUS_STYLE = {
  preparing: 'bg-seal-red/15 text-seal-red',
  packaged: 'bg-amber-100 text-amber-800',
  delivering: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-200 text-gray-600 line-through'
};
let dashboardPeriod = 'today';
const dashboardCharts = {};

let dashboardCustomRange = null;

function toggleCustomPeriod() {
  const bar = document.getElementById('custom-period-bar');
  bar.classList.toggle('hidden');
  if (!bar.classList.contains('hidden') && !document.getElementById('dash-from').value) quickCustomPeriod('lastMonth', true);
}

function quickCustomPeriod(kind, fillOnly) {
  const today = financeToday();
  const [y, m] = today.split('-').map(Number);
  let from, to;
  if (kind === 'lastMonth') {
    const lm = new Date(y, m - 2, 1);
    from = toDateStr(lm);
    to = toDateStr(new Date(y, m - 1, 0));
  } else if (kind === '90d') {
    from = addDays(today, -89); to = today;
  } else {
    from = `${y}-01-01`; to = today;
  }
  document.getElementById('dash-from').value = from;
  document.getElementById('dash-to').value = to;
  if (!fillOnly) applyCustomPeriod();
}

function applyCustomPeriod() {
  const from = document.getElementById('dash-from').value;
  const to = document.getElementById('dash-to').value;
  const err = document.getElementById('custom-period-error');
  const fail = msg => { err.innerText = msg; err.classList.remove('hidden'); };
  if (!from || !to) return fail('시작일과 종료일을 골라 주세요.');
  if (from > to) return fail('시작일이 종료일보다 늦어요.');
  if (daysBetween(from, to) > 366) return fail('최대 1년까지 볼 수 있어요.');
  err.classList.add('hidden');
  dashboardCustomRange = { from, to, label: `${shortDate(from)}~${shortDate(to)}` };
  setDashboardPeriod('custom');
}

function setDashboardPeriod(preset) {
  if (preset !== 'custom') document.getElementById('custom-period-bar').classList.add('hidden');
  dashboardPeriod = preset;
  document.querySelectorAll('#panel-dashboard .period-btn').forEach(b => b.classList.toggle('active', b.dataset.period === preset));
  renderDashboard();
}

function shortDate(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}/${d}`;
}

function weekdayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
}

function wonAxis(v) {
  if (v >= 10000) return `${Math.round(v / 10000).toLocaleString('ko-KR')}만`;
  return v.toLocaleString('ko-KR');
}

function drawChart(key, canvasId, config) {
  if (typeof Chart === 'undefined') return null;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  if (dashboardCharts[key]) dashboardCharts[key].destroy();
  dashboardCharts[key] = new Chart(canvas, config);
  return dashboardCharts[key];
}

const CHART_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 250 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1A1A1A',
      padding: 10,
      titleFont: { family: 'Pretendard', weight: '700' },
      bodyFont: { family: 'Pretendard' }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#666', font: { family: 'Pretendard', size: 12 } } },
    y: { beginAtZero: true, grid: { color: 'rgba(26,26,26,0.06)' }, border: { display: false }, ticks: { color: '#666', font: { family: 'Pretendard', size: 12 } } }
  }
};

// 오늘 할 일: 오늘 배송 · 제작 중 · 새 상담 · 재입고 알림 대기 · 품절 임박
function renderTodayTasks(orders, products, inquiries, today) {
  const box = document.getElementById('today-tasks');
  if (!box) return;
  const dateEl = document.getElementById('today-tasks-date');
  if (dateEl) dateEl.textContent = `${Number(today.slice(5, 7))}월 ${Number(today.slice(8, 10))}일 (${weekdayLabel(today)})`;
  const active = o => o.status !== 'cancelled' && o.status !== 'completed';
  const todayDeliv = orders.filter(o => active(o) && getDeliveryDate(o) === today).length;
  const making = orders.filter(o => o.status === 'preparing').length;
  const newInq = inquiries.filter(i => i.status === 'new').length;
  const restock = typeof restockWaitingCount === 'function' ? restockWaitingCount() : 0;
  const low = products.filter(p => !p.inquiryOnly && getStockStatus(p.stockQuantity) === 'low_stock').length;
  const tasks = [
    { label: '오늘 배송', n: todayDeliv, unit: '건', go: () => goTodayTask('orders', 'today') },
    { label: '제작 중', n: making, unit: '건', go: () => goTodayTask('orders', 'preparing') },
    { label: '새 상담', n: newInq, unit: '건', go: () => goTodayTask('reviews') },
    { label: '재입고 알림 대기', n: restock, unit: '명', go: () => goTodayTask('restock') },
    { label: '품절 임박', n: low, unit: '개', go: () => goTodayTask('low') }
  ];
  box.innerHTML = '';
  tasks.forEach(tk => {
    const b = document.createElement('button');
    b.type = 'button';
    b.onclick = tk.go;
    b.className = `text-left p-3 rounded-xs border cursor-pointer transition-colors ${tk.n ? 'bg-white border-seal-red/40 hover:border-seal-red' : 'bg-[#FAF7F2] border-ink-black/10 hover:border-ink-black/30'}`;
    const l = document.createElement('p');
    l.className = 'text-xs font-bold text-ink-gray';
    l.textContent = tk.label;
    const v = document.createElement('p');
    v.className = `text-xl font-extrabold ${tk.n ? 'text-seal-red' : 'text-ink-light'}`;
    v.textContent = `${tk.n}${tk.unit}`;
    b.append(l, v);
    box.appendChild(b);
  });
}

function goTodayTask(kind, arg) {
  if (kind === 'orders') {
    switchAdminTab('orders');
    const dateSel = document.getElementById('order-date-filter');
    if (dateSel) dateSel.value = arg === 'today' ? 'today' : 'all';
    if (typeof setOrderStatusFilter === 'function') setOrderStatusFilter(arg === 'preparing' ? 'preparing' : 'all');
  } else if (kind === 'reviews') {
    switchAdminTab('reviews');
  } else if (kind === 'restock') {
    switchAdminTab('reviews');
    const el = document.getElementById('admin-restock-list');
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  } else if (kind === 'low') {
    switchAdminTab('products');
    const sel = document.getElementById('prod-stock-filter');
    if (sel) { sel.value = 'low'; renderProductsTable(); }
  }
}

function renderDashboard() {
  const orders = loadAdminOrders();
  const products = loadAdminProducts();
  const inquiries = loadAdminInquiries();
  const today = financeToday();
  const range = dashboardPeriod === 'custom' && dashboardCustomRange ? dashboardCustomRange : getPeriodRange(dashboardPeriod, today);
  const sum = summarizePeriod(range.from, range.to);

  // 1) 숫자 카드
  document.getElementById('metric-revenue').innerText = formatWon(sum.revenue);
  document.getElementById('metric-revenue-sub').innerText = `${range.label} 주문 ${sum.orderCount}건 · 평균 ${formatWon(sum.avgOrder)}` + (sum.cancelled.length ? ` · 취소 ${sum.cancelled.length}건` : '');
  document.getElementById('metric-expense').innerText = formatWon(sum.expense);
  document.getElementById('metric-expense-sub').innerText = `${range.label} 지출 ${sum.expenses.length}건`;
  const profitEl = document.getElementById('metric-profit');
  profitEl.innerText = (sum.profit < 0 ? '−' : '') + formatWon(Math.abs(sum.profit));
  profitEl.classList.toggle('text-seal-red', sum.profit < 0);
  document.getElementById('metric-profit-sub').innerText = sum.revenue > 0 ? `이익률 ${Math.round(sum.profit / sum.revenue * 100)}%` : `${range.label} 매출 없음`;

  const prepCount = orders.filter(o => o.status === 'preparing').length;
  const packCount = orders.filter(o => o.status === 'packaged').length;
  const delivCount = orders.filter(o => o.status === 'delivering').length;
  document.getElementById('metric-orders').innerText = `${prepCount + packCount + delivCount}건`;
  document.getElementById('metric-orders-sub').innerText = `제작 중 ${prepCount} · 포장 완료 ${packCount} · 배송 중 ${delivCount}`;
  const newInquiries = inquiries.filter(i => i.status === 'new').length + (typeof restockWaitingCount === 'function' ? restockWaitingCount() : 0);
  document.getElementById('metric-inquiries-sub').innerText = `새 상담 ${newInquiries}건 →`;

  try { renderTodayTasks(orders, products, inquiries, today); } catch (e) { console.error('renderTodayTasks error:', e); }

  // 사이드바 숫자
  document.getElementById('badge-order-count').innerText = prepCount + packCount + delivCount;
  document.getElementById('badge-prod-count').innerText = products.length;
  const inqBadge = document.getElementById('badge-inquiry-count');
  if (inqBadge) {
    inqBadge.innerText = newInquiries;
    inqBadge.className = newInquiries > 0 ? 'text-xs bg-seal-red text-white px-1.5 py-0.5 rounded font-bold' : 'text-xs bg-black/10 text-ink-gray px-1.5 py-0.5 rounded';
  }

  // 2) 차트 (대시보드가 보일 때만 그리기)
  const panel = document.getElementById('panel-dashboard');
  if (panel && !panel.classList.contains('hidden')) {
    renderDashboardCharts(range, today);
  }

  try { renderPurchasePlan(); } catch (e) { console.error('renderPurchasePlan error:', e); }

  // 3) 최근 주문
  const recentContainer = document.getElementById('dashboard-recent-orders');
  recentContainer.innerHTML = '';
  const tomorrow = addDays(today, 1);
  const recent = orders.slice().sort((a, b) => String(b.id).localeCompare(String(a.id))).slice(0, 8);
  if (recent.length === 0) {
    recentContainer.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-ink-gray">아직 들어온 주문이 없어요.</td></tr>';
    return;
  }
  recent.forEach(ord => {
    const tr = document.createElement('tr');
    const dDate = getDeliveryDate(ord);
    const soon = dDate === today ? '오늘' : dDate === tomorrow ? '내일' : '';
    tr.className = soon && ord.status !== 'cancelled' ? 'bg-amber-50/70' : 'hover:bg-[#F3EDE3]/40';
    const stLabel = ORDER_STATUS_LABELS[ord.status] || ord.status;
    const firstItem = (ord.items && ord.items[0] && ord.items[0].product && ord.items[0].product.name) || '꽃 상품';
    tr.innerHTML = `
      <td class="py-2.5 px-3 text-ink-gray whitespace-nowrap">${escapeHtml(getOrderDate(ord) || '-')} ${escapeHtml(ord.createdAt || '')}</td>
      <td class="py-2.5 px-3 font-mono text-xs text-ink-black">${escapeHtml(ord.orderNumber)}</td>
      <td class="py-2.5 px-3 font-bold text-ink-black">${escapeHtml(ord.customerName)}</td>
      <td class="py-2.5 px-3 text-ink-black">${escapeHtml(firstItem)}${ord.items && ord.items.length > 1 ? ` 외 ${ord.items.length - 1}건` : ''}</td>
      <td class="py-2.5 px-3 whitespace-nowrap">${soon ? `<span class="px-1.5 py-0.5 mr-1 rounded text-[11px] font-bold bg-amber-200 text-amber-900">${soon}</span>` : ''}<span class="font-bold text-ink-black">${escapeHtml(ord.deliveryDate)}</span></td>
      <td class="py-2.5 px-3 font-bold text-ink-black text-right whitespace-nowrap">${formatWon(ord.totalAmount)}</td>
      <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded text-xs font-bold ${ORDER_STATUS_STYLE[ord.status] || ''}">${escapeHtml(stLabel)}</span></td>
    `;
    recentContainer.appendChild(tr);
  });
}

function renderDashboardCharts(range, today) {
  // 날짜별 매출·지출: 오늘/이번 주는 최근 14일, 그 외는 선택 기간
  const spanFrom = (dashboardPeriod === 'today' || dashboardPeriod === 'week') ? addDays(today, -13) : range.from;
  const spanTo = dashboardPeriod === 'custom' ? range.to : today;
  let flow = dailySeries(spanFrom, spanTo);
  const weekly = flow.length > 62;
  if (weekly) {
    const buckets = [];
    for (let i = 0; i < flow.length; i += 7) {
      const chunk = flow.slice(i, i + 7);
      buckets.push(chunk.reduce((acc, r) => ({ date: acc.date, orderCount: acc.orderCount + r.orderCount, revenue: acc.revenue + r.revenue, expense: acc.expense + r.expense, profit: acc.profit + r.profit }), { date: chunk[0].date, orderCount: 0, revenue: 0, expense: 0, profit: 0 }));
    }
    flow = buckets;
  }
  document.getElementById('chart-flow-title').innerText = `${weekly ? '주별' : '날짜별'} 매출·지출 (${shortDate(spanFrom)} ~ ${shortDate(spanTo)})`;
  drawChart('flow', 'chart-flow', {
    type: 'bar',
    data: {
      labels: flow.map(r => shortDate(r.date)),
      datasets: [
        { label: '매출', data: flow.map(r => r.revenue), backgroundColor: CHART_COLORS.revenue, borderRadius: 4, maxBarThickness: 18, categoryPercentage: 0.7, barPercentage: 0.9 },
        { label: '지출', data: flow.map(r => r.expense), backgroundColor: CHART_COLORS.expense, borderRadius: 4, maxBarThickness: 18, categoryPercentage: 0.7, barPercentage: 0.9 }
      ]
    },
    options: {
      ...CHART_BASE,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...CHART_BASE.plugins,
        tooltip: {
          ...CHART_BASE.plugins.tooltip,
          callbacks: {
            title: items => { const r = flow[items[0].dataIndex]; return weekly ? `${shortDate(r.date)} 주 · 주문 ${r.orderCount}건` : `${shortDate(r.date)} (${weekdayLabel(r.date)}) · 주문 ${r.orderCount}건`; },
            label: c => ` ${c.dataset.label} ${formatWon(c.raw)}`,
            footer: items => `순이익 ${formatWon(flow[items[0].dataIndex].profit)}`
          }
        }
      },
      scales: { ...CHART_BASE.scales, y: { ...CHART_BASE.scales.y, ticks: { ...CHART_BASE.scales.y.ticks, callback: wonAxis } } }
    }
  });

  // 상품별 매출 (선택 기간)
  const prod = productRevenue(range.from, range.to).slice(0, 7);
  document.getElementById('chart-products-title').innerText = `상품별 매출 (${range.label})`;
  const prodCanvas = document.getElementById('chart-products');
  const prodEmpty = document.getElementById('chart-products-empty');
  prodCanvas.parentElement.classList.toggle('hidden', prod.length === 0);
  prodEmpty.classList.toggle('hidden', prod.length > 0);
  if (prod.length > 0) {
    drawChart('products', 'chart-products', {
      type: 'bar',
      data: {
        labels: prod.map(p => p.name.length > 9 ? p.name.slice(0, 9) + '…' : p.name),
        datasets: [{ label: '매출', data: prod.map(p => p.amount), backgroundColor: CHART_COLORS.revenue, borderRadius: 4, maxBarThickness: 16 }]
      },
      options: {
        ...CHART_BASE,
        indexAxis: 'y',
        plugins: { ...CHART_BASE.plugins, tooltip: { ...CHART_BASE.plugins.tooltip, callbacks: { title: items => prod[items[0].dataIndex].name, label: c => ` ${formatWon(c.raw)}` } } },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(26,26,26,0.06)' }, border: { display: false }, ticks: { color: '#666', font: { family: 'Pretendard', size: 12 }, callback: wonAxis } },
          y: { grid: { display: false }, ticks: { color: '#1A1A1A', font: { family: 'Pretendard', size: 12 } } }
        }
      }
    });
  }

  // 앞으로 7일 배송 일정 (상태별 누적)
  const sched = deliverySchedule(7, today);
  const statuses = ['preparing', 'packaged', 'delivering', 'completed'];
  drawChart('schedule', 'chart-schedule', {
    type: 'bar',
    data: {
      labels: sched.map((r, i) => i === 0 ? `오늘 ${shortDate(r.date)}` : i === 1 ? `내일 ${shortDate(r.date)}` : `${shortDate(r.date)} (${weekdayLabel(r.date)})`),
      datasets: statuses.map(s => ({
        label: ORDER_STATUS_LABELS[s],
        data: sched.map(r => r.counts[s]),
        backgroundColor: CHART_COLORS[s],
        borderColor: '#FAF7F2',
        borderWidth: { top: 2 },
        borderSkipped: false,
        maxBarThickness: 36
      }))
    },
    options: {
      ...CHART_BASE,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...CHART_BASE.plugins,
        tooltip: {
          ...CHART_BASE.plugins.tooltip,
          filter: c => c.raw > 0,
          callbacks: { label: c => ` ${c.dataset.label} ${c.raw}건`, footer: items => `합계 ${sched[items[0].dataIndex].total}건` }
        }
      },
      scales: {
        x: { ...CHART_BASE.scales.x, stacked: true },
        y: { ...CHART_BASE.scales.y, stacked: true, ticks: { ...CHART_BASE.scales.y.ticks, precision: 0, stepSize: 1 } }
      }
    }
  });
}
