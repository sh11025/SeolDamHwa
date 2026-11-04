// assets/js/site-theme.js
// 설담화(說談花) 쇼핑몰 색 - 관리자 > 매장 정보 설정 > 사이트 색에서 고른 값을 화면에 입힘
// 대표색·보조색은 CSS 변수(--sdh-accent, --sdh-accent-2, --sdh-soft)로만 바뀌고,
// 도장(seal.svg)과 오류 글자(text-seal-stamp)는 언제나 붉은색으로 둠.

const THEME_PRESETS = {
  current: { label: '지금 색', accent: '#8B2500', soft: '#F3EDE3' },
  indigo: { label: '쪽빛', accent: '#2B3A67', soft: '#E9E6F3' },
  purple: { label: '자주보라', accent: '#5A4A8A', soft: '#ECE7F5' }
};

function isThemeHex(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ''));
}

function themeHexToRgb(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// 두 색의 글자 대비 (1~21, 높을수록 잘 보임)
function themeContrast(hexA, hexB) {
  const lum = hex => {
    const [r, g, b] = themeHexToRgb(hex).map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(hexA);
  const b = lum(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// 저장값이 비었거나 형식이 틀리면 기본 색으로
function normalizeSiteTheme(theme) {
  const base = THEME_PRESETS.current;
  const t = theme && typeof theme === 'object' ? theme : {};
  return {
    preset: Object.prototype.hasOwnProperty.call(THEME_PRESETS, t.preset) ? t.preset : 'custom',
    accent: isThemeHex(t.accent) ? t.accent : base.accent,
    soft: isThemeHex(t.soft) ? t.soft : base.soft
  };
}

function applySiteTheme(theme) {
  const t = normalizeSiteTheme(theme);
  const root = document.documentElement;
  const accent = themeHexToRgb(t.accent);
  const hover = accent.map(v => Math.round(v + (255 - v) * 0.14)); // 대표색보다 조금 밝게
  root.style.setProperty('--sdh-accent', accent.join(' '));
  root.style.setProperty('--sdh-accent-2', hover.join(' '));
  root.style.setProperty('--sdh-soft', themeHexToRgb(t.soft).join(' '));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.accent);
}
