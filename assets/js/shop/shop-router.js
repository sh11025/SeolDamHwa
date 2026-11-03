// assets/js/shop/shop-router.js
// 설담화 쇼핑몰: 페이지 주소(#/...)와 뒤로 가기
// 주소 예: #/ (홈), #/story, #/custom, #/guide/care, #/flowers, #/flower/<상품 id>, #/checkout
// 화면 바꾸기는 기존처럼 switchView('shop' | 'story' | 'custom' | 'guide')를 부르면 주소도 함께 바뀝니다.

const ROUTE_HASHES = { shop: '#/', story: '#/story', custom: '#/custom', guide: '#/guide', reviews: '#/reviews' };
// 다른 화면(상품 상세·결제·꽃 둘러보기)은 각 파일에서 SHOP_ROUTES에 등록
const SHOP_ROUTES = {};
let routerSkipHash = null;

function viewHash(view) {
  if (view === 'guide' && typeof currentGuideTab !== 'undefined') return `#/guide/${currentGuideTab}`;
  return ROUTE_HASHES[view] || '#/';
}

// 화면을 바로 바꾸고 주소도 맞춤 (뒤로 가기 기록 남김)
function switchView(view) {
  showView(view);
  setRouteHash(viewHash(view));
}

function setRouteHash(hash, replace) {
  if (location.hash === hash || (hash === '#/' && (location.hash === '' || location.hash === '#'))) return;
  // replaceState는 hashchange가 안 일어나므로, 건너뛰기 표시는 location.hash로 바꿀 때만
  if (replace) {
    history.replaceState(null, '', hash);
  } else {
    routerSkipHash = hash;
    location.hash = hash;
  }
}

function parseRoute(hash = location.hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { name: parts[0] || '', params: parts.slice(1) };
}

function applyRoute() {
  const { name, params } = parseRoute();
  if (SHOP_ROUTES[name]) { SHOP_ROUTES[name](params); return; }
  if (name === 'guide') {
    if (params[0] && typeof GUIDE_TITLE_KEYS !== 'undefined' && GUIDE_TITLE_KEYS[params[0]]) currentGuideTab = params[0];
    showView('guide');
    return;
  }
  if (name === 'story' || name === 'custom' || name === 'reviews') { showView(name); return; }
  if (name) { goHomeWithNotice('route_unknown', '없는 페이지라 홈으로 왔어요.'); return; }
  showView('shop');
}

window.addEventListener('hashchange', () => {
  if (routerSkipHash && location.hash === routerSkipHash) { routerSkipHash = null; return; }
  routerSkipHash = null;
  applyRoute();
});

// 첫 화면: 주소에 맞는 화면으로 (예: 카톡으로 받은 #/guide/refund 링크)
document.addEventListener('DOMContentLoaded', () => {
  if (location.hash && location.hash !== '#' && location.hash !== '#/') {
    try { applyRoute(); } catch (e) { console.error('route error:', e); }
  }
});
