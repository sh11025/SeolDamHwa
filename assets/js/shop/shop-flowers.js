// assets/js/shop/shop-flowers.js
// 설담화 쇼핑몰: 꽃 사전 보여 주기 - 상품 페이지 '이 상품에 쓰인 꽃'과 '지금이 제철' 표시
// 꽃 데이터와 제철 계산은 assets/js/flowers-data.js

function flT(key, fallback) {
  return typeof t === 'function' ? t(key, fallback) : fallback;
}

// 상품 카드·상품 페이지의 '지금이 제철' 작은 표시
function seasonBadge() {
  const b = document.createElement('span');
  b.className = 'season-badge inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs';
  b.textContent = flT('season_now', '🌿 지금이 제철');
  return b;
}

// 상품 페이지(shop-product-page.js)에서 부름. 채웠으면 true, 등록된 꽃이 없으면 false(기존 꽃말 한 줄로 대체)
function renderProductFlowers(p, box) {
  if (typeof productFlowers !== 'function') return false;
  const flowers = productFlowers(p);
  if (!flowers.length) return false;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const month = currentKoreaMonth();

  const label = document.createElement('p');
  label.className = 'text-xs font-bold text-ink-gray';
  label.textContent = flT('pdp_flowers_used', '이 상품에 쓰인 꽃');
  box.appendChild(label);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
  flowers.forEach(f => {
    const ft = flowerText(f, lang);
    const card = document.createElement('div');
    card.className = 'bg-[#FAF7F2] border border-ink-black/10 rounded-xs p-4 space-y-1.5 text-sm';
    const head = document.createElement('div');
    head.className = 'flex flex-wrap items-center gap-2';
    const name = document.createElement('p');
    name.className = 'font-bold text-ink-black';
    name.textContent = ft.name;
    head.appendChild(name);
    if (lang === 'ko' && f.nameEn) {
      const en = document.createElement('span');
      en.className = 'text-[11px] text-ink-gray';
      en.textContent = f.nameEn;
      head.appendChild(en);
    }
    if (isFlowerInSeason(f, month)) head.appendChild(seasonBadge());
    card.appendChild(head);

    const rows = [
      [flT('flower_meaning_label', '꽃말'), ft.meaning],
      [flT('flower_season', '제철'), formatFlowerSeason(f, lang)]
    ];
    if (lang === 'ko' && f.care) rows.push([flT('flower_care', '관리 팁'), f.care]);
    rows.forEach(([k, v]) => {
      if (!v) return;
      const row = document.createElement('p');
      row.className = 'text-ink-gray leading-relaxed';
      const strong = document.createElement('span');
      strong.className = 'font-bold text-ink-black mr-1.5';
      strong.textContent = k;
      row.append(strong, document.createTextNode(v));
      card.appendChild(row);
    });
    grid.appendChild(card);
  });
  box.appendChild(grid);
  return true;
}
