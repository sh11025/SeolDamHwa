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

// 상품 페이지(shop-product-page.js)에서 부름: 이 상품에 쓰인 꽃 이름 한 줄 (누르면 아래 관리 안내로)
// 채웠으면 true, 등록된 꽃이 없으면 false(기존 꽃말 한 줄로 대체)
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

  const row = document.createElement('div');
  row.className = 'flex flex-wrap gap-1.5';
  flowers.forEach(f => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F2] border border-ink-black/15 rounded-full text-sm font-bold text-ink-black hover:border-seal-red hover:text-seal-red cursor-pointer';
    chip.textContent = flowerText(f, lang).name;
    if (isFlowerInSeason(f, month)) {
      const leaf = document.createElement('span');
      leaf.textContent = '🌿';
      leaf.title = flT('season_now', '🌿 지금이 제철');
      chip.appendChild(leaf);
    }
    chip.onclick = () => openFlowerGuideItem(f.id);
    row.appendChild(chip);
  });
  box.appendChild(row);
  return true;
}

// 칩을 누르면 해당 꽃의 관리 안내를 펼치고 그 자리로
function openFlowerGuideItem(id) {
  const d = document.getElementById(`pdp-guide-${id}`);
  if (!d) return;
  d.open = true;
  d.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 꽃별 관리 안내: 꽃 사전에 넣은 글·사진·영상(유튜브 포함). 순서 = 관리자 '사용한 꽃' 순서, 맨 위 꽃만 펼침
// 채울 내용이 없으면 null
function buildFlowerGuideSection(p, makeTitle) {
  if (typeof productFlowers !== 'function') return null;
  const flowers = productFlowers(p);
  if (!flowers.length) return null;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  const sec = document.createElement('div');
  sec.className = 'space-y-3';
  sec.appendChild(makeTitle(flT('pdp_section_flower_guide', '꽃별 관리 안내')));
  flowers.forEach((f, i) => {
    const ft = flowerText(f, lang);
    const d = document.createElement('details');
    d.id = `pdp-guide-${f.id}`;
    d.className = 'group bg-white/70 border border-ink-black/10 rounded-xs scroll-mt-24';
    if (i === 0) d.open = true;
    const sm = document.createElement('summary');
    sm.className = 'cursor-pointer select-none px-5 py-3.5 flex items-center gap-3';
    const name = document.createElement('span');
    name.className = 'font-bold text-ink-black';
    name.textContent = ft.name;
    const mean = document.createElement('span');
    mean.className = 'flex-1 text-xs text-ink-gray truncate';
    mean.textContent = ft.meaning || '';
    const arrow = document.createElement('span');
    arrow.className = 'text-ink-gray group-open:rotate-180 transition-transform';
    arrow.textContent = '▾';
    sm.append(name, mean, arrow);

    const body = document.createElement('div');
    body.className = 'px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm';
    const media = document.createElement('div');
    const images = Array.isArray(f.guideImages) && f.guideImages.length ? f.guideImages : (f.image ? [f.image] : []);
    if (typeof renderPageMediaInto === 'function') renderPageMediaInto(media, { ratio: '4:3', images, video: f.guideVideo || '' }, { column: true });
    const text = document.createElement('div');
    text.className = 'space-y-2 text-ink-charcoal leading-relaxed';
    const facts = document.createElement('p');
    facts.className = 'text-xs text-ink-gray';
    facts.textContent = `${flT('flower_season', '제철')} · ${formatFlowerSeason(f, lang)}`;
    text.appendChild(facts);
    const guide = lang === 'ko' ? (f.guideText || f.care || '') : '';
    String(guide || flT('pdp_flower_guide_none', '받으신 날 줄기 끝을 사선으로 조금 잘라 시원한 물에 꽂아 주세요.')).split(/\n+/).forEach(line => {
      if (!line.trim()) return;
      const para = document.createElement('p');
      para.textContent = line;
      text.appendChild(para);
    });
    if (media.classList.contains('hidden')) body.className = 'px-5 pb-5 text-sm';
    else body.appendChild(media);
    body.appendChild(text);
    d.append(sm, body);
    if (typeof addCornerMarks === 'function') addCornerMarks(d, 'lotus', ['tl', 'br']);
    sec.appendChild(d);
  });
  return sec;
}
