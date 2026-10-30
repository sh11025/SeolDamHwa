// assets/js/flowers-data.js
// 설담화(說談花) 꽃 사전 - 꽃 이름·꽃말·제철 달·색·관리법을 한 번 등록해 두고 상품에서 '사용한 꽃'으로 골라 씁니다.
// 저장: localStorage 'seoldamhwa_flowers' (CSV는 DATA/flowers.csv). 제철 달(months)이 비어 있으면 '사계절'로 보고 제철 표시는 하지 않아요.

const FLOWERS_KEY = 'seoldamhwa_flowers';

const DEFAULT_FLOWERS = [
  { id: 'rose', name: '장미', nameEn: 'Rose', nameJa: 'バラ', meaning: '사랑, 아름다움', meaningEn: 'Love, beauty', meaningJa: '愛、美しさ', months: [5, 6, 9, 10], colors: '빨강 · 분홍 · 흰색 · 노랑', care: '줄기 끝을 사선으로 1~2cm 자르고, 물은 매일 갈아 주세요.' },
  { id: 'peony', name: '작약', nameEn: 'Peony', nameJa: 'シャクヤク', meaning: '수줍음, 부끄러움', meaningEn: 'Bashfulness', meaningJa: 'はにかみ', months: [5, 6], colors: '분홍 · 흰색 · 코랄', care: '봉오리로 받아 실온에 두면 하루이틀 사이 활짝 피어요.' },
  { id: 'tulip', name: '튤립', nameEn: 'Tulip', nameJa: 'チューリップ', meaning: '사랑의 고백', meaningEn: 'A declaration of love', meaningJa: '愛の告白', months: [2, 3, 4], colors: '여러 색', care: '물은 얕게, 서늘한 곳에 두세요. 줄기가 빛 쪽으로 휘어요.' },
  { id: 'freesia', name: '프리지아', nameEn: 'Freesia', nameJa: 'フリージア', meaning: '새로운 시작, 천진난만', meaningEn: 'New beginnings', meaningJa: '新しい始まり', months: [2, 3, 4], colors: '노랑 · 흰색 · 보라', care: '아래 꽃부터 피어요. 시든 꽃만 떼어 주면 위 봉오리가 계속 피어요.' },
  { id: 'ranunculus', name: '라넌큘러스', nameEn: 'Ranunculus', nameJa: 'ラナンキュラス', meaning: '매력, 화사함', meaningEn: 'Charm, radiance', meaningJa: '魅力、華やかさ', months: [2, 3, 4, 5], colors: '분홍 · 주황 · 흰색', care: '줄기가 무르기 쉬워 물은 얕게(3~4cm) 담아 주세요.' },
  { id: 'anemone', name: '아네모네', nameEn: 'Anemone', nameJa: 'アネモネ', meaning: '기다림, 기대', meaningEn: 'Anticipation', meaningJa: '期待', months: [2, 3, 4], colors: '빨강 · 흰색 · 보라', care: '따뜻하면 금방 피어요. 서늘한 곳에 두세요.' },
  { id: 'stock', name: '스톡', nameEn: 'Stock', nameJa: 'ストック', meaning: '영원한 아름다움', meaningEn: 'Lasting beauty', meaningJa: '永遠の美', months: [1, 2, 3, 4], colors: '분홍 · 흰색 · 보라', care: '물이 쉽게 탁해져요. 물을 자주 갈아 주세요.' },
  { id: 'camellia', name: '동백', nameEn: 'Camellia', nameJa: 'ツバキ', meaning: '그 누구보다 그대를 사랑해', meaningEn: 'I love you more than anyone', meaningJa: '誰よりもあなたを愛す', months: [12, 1, 2, 3], colors: '빨강 · 분홍', care: '가지 끝을 십자로 갈라 주면 물을 잘 빨아들여요.' },
  { id: 'plum-blossom', name: '매화', nameEn: 'Plum blossom', nameJa: '梅', meaning: '고결한 마음, 인내', meaningEn: 'Noble heart, patience', meaningJa: '高潔な心、忍耐', months: [2, 3], colors: '흰색 · 분홍', care: '가지 끝을 비스듬히 자르고 물을 넉넉히 담아 주세요.' },
  { id: 'magnolia', name: '목련', nameEn: 'Magnolia', nameJa: 'モクレン', meaning: '고귀함', meaningEn: 'Nobility', meaningJa: '高貴', months: [3, 4], colors: '흰색 · 자주', care: '꽃잎이 상처에 약해요. 넉넉한 화병에 꽂아 주세요.' },
  { id: 'carnation', name: '카네이션', nameEn: 'Carnation', nameJa: 'カーネーション', meaning: '사랑, 존경', meaningEn: 'Love, respect', meaningJa: '愛、尊敬', months: [4, 5], colors: '빨강 · 분홍 · 흰색', care: '마디 바로 위를 잘라 주면 더 오래가요.' },
  { id: 'delphinium', name: '델피늄', nameEn: 'Delphinium', nameJa: 'デルフィニウム', meaning: '당신을 행복하게 해 줄게요', meaningEn: 'I will make you happy', meaningJa: 'あなたを幸せにします', months: [5, 6, 7], colors: '파랑 · 보라 · 흰색', care: '꽃잎이 잘 떨어져요. 바람이 없는 곳에 두세요.' },
  { id: 'calla', name: '칼라', nameEn: 'Calla lily', nameJa: 'カラー', meaning: '순수, 열정', meaningEn: 'Purity, passion', meaningJa: '純粋、情熱', months: [5, 6, 7], colors: '흰색 · 노랑 · 자주', care: '물은 얕게(5cm) 담아 줄기가 무르지 않게 해 주세요.' },
  { id: 'hydrangea', name: '수국', nameEn: 'Hydrangea', nameJa: 'アジサイ', meaning: '진심', meaningEn: 'Sincerity', meaningJa: '真心', months: [6, 7, 8], colors: '파랑 · 분홍 · 흰색', care: '물을 아주 좋아해요. 시들면 꽃송이를 물에 잠시 담가 주세요.' },
  { id: 'lily', name: '백합', nameEn: 'Lily', nameJa: 'ユリ', meaning: '순결, 변함없는 사랑', meaningEn: 'Purity, unchanging love', meaningJa: '純潔、変わらぬ愛', months: [6, 7, 8], colors: '흰색 · 분홍', care: '꽃가루가 옷에 묻으면 잘 안 지워져요. 수술은 미리 떼어 주세요.' },
  { id: 'lisianthus', name: '리시안셔스', nameEn: 'Lisianthus', nameJa: 'トルコキキョウ', meaning: '변치 않는 사랑', meaningEn: 'Everlasting love', meaningJa: '変わらぬ愛', months: [6, 7, 8, 9], colors: '흰색 · 보라 · 분홍', care: '오래가는 꽃이에요. 시든 송이만 떼어 주세요.' },
  { id: 'lotus', name: '연꽃', nameEn: 'Lotus', nameJa: 'ハス', meaning: '순결, 청결', meaningEn: 'Purity', meaningJa: '清らかさ', months: [7, 8], colors: '분홍 · 흰색', care: '아침에 피고 오후에 오므라들어요. 물을 넉넉히 담아 주세요.' },
  { id: 'sunflower', name: '해바라기', nameEn: 'Sunflower', nameJa: 'ヒマワリ', meaning: '동경, 기다림', meaningEn: 'Adoration', meaningJa: '憧れ', months: [7, 8, 9], colors: '노랑', care: '줄기가 굵어 물을 많이 마셔요. 물을 자주 채워 주세요.' },
  { id: 'dahlia', name: '다알리아', nameEn: 'Dahlia', nameJa: 'ダリア', meaning: '우아함, 감사', meaningEn: 'Elegance, gratitude', meaningJa: '優雅、感謝', months: [8, 9, 10], colors: '빨강 · 주황 · 분홍 · 버건디', care: '물이 쉽게 상해요. 매일 갈아 주세요.' },
  { id: 'cockscomb', name: '맨드라미', nameEn: 'Cockscomb', nameJa: 'ケイトウ', meaning: '시들지 않는 사랑', meaningEn: 'Unfading love', meaningJa: '色あせぬ愛', months: [8, 9, 10], colors: '빨강 · 주황 · 자주', care: '말려도 색이 남아 드라이플라워로 오래 둘 수 있어요.' },
  { id: 'cosmos', name: '코스모스', nameEn: 'Cosmos', nameJa: 'コスモス', meaning: '순정, 조화', meaningEn: 'Innocence, harmony', meaningJa: '乙女の真心、調和', months: [9, 10], colors: '분홍 · 흰색 · 자주', care: '가녀린 꽃이라 서늘한 곳에서 더 오래가요.' },
  { id: 'chrysanthemum', name: '국화', nameEn: 'Chrysanthemum', nameJa: 'キク', meaning: '고결, 진실', meaningEn: 'Nobility, truth', meaningJa: '高潔、真実', months: [9, 10, 11], colors: '흰색 · 노랑 · 자주', care: '물에 잠기는 잎은 떼어 주세요. 2주 넘게 가는 꽃이에요.' },
  { id: 'gerbera', name: '거베라', nameEn: 'Gerbera', nameJa: 'ガーベラ', meaning: '신비, 풍부한 사랑', meaningEn: 'Mystery, abundant love', meaningJa: '神秘、豊かな愛', months: [4, 5, 9, 10], colors: '여러 색', care: '줄기가 무르기 쉬워요. 물은 3~4cm만 담아 주세요.' },
  { id: 'phalaenopsis', name: '호접란', nameEn: 'Moth orchid', nameJa: 'コチョウラン', meaning: '행복이 날아온다', meaningEn: 'Happiness flies to you', meaningJa: '幸福が飛んでくる', months: [], colors: '흰색 · 분홍 · 자주', care: '사계절 만날 수 있어요. 직사광선을 피해 주세요.' },
  { id: 'babys-breath', name: '안개꽃', nameEn: "Baby's breath", nameJa: 'カスミソウ', meaning: '맑은 마음, 깨끗한 사랑', meaningEn: 'Pure heart', meaningJa: '清らかな心', months: [], colors: '흰색 · 분홍', care: '그대로 말리면 드라이플라워가 돼요.' },
  { id: 'eucalyptus', name: '유칼립투스', nameEn: 'Eucalyptus', nameJa: 'ユーカリ', meaning: '추억', meaningEn: 'Memories', meaningJa: '思い出', months: [], colors: '초록 (잎 소재)', care: '향이 좋은 잎 소재예요. 말려도 모양이 오래가요.' }
];

// 기본 상품에 쓰인 꽃 (상품의 '꽃말 및 상징' 칸에 적힌 꽃 이름 기준). 관리자에서 고르면 p.flowers로 바뀜
const DEFAULT_PRODUCT_FLOWERS = {
  'bohemian-autumn': ['dahlia', 'phalaenopsis', 'rose'],
  'pale-pink-rose': ['rose'],
  'creamy-sunshine': ['gerbera', 'chrysanthemum', 'rose'],
  'royal-blue-garden': ['rose', 'delphinium', 'lisianthus']
};

function loadFlowers() {
  try {
    const raw = localStorage.getItem(FLOWERS_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_FLOWERS));
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : JSON.parse(JSON.stringify(DEFAULT_FLOWERS));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_FLOWERS));
  }
}

function saveFlowers(list) {
  localStorage.setItem(FLOWERS_KEY, JSON.stringify(list));
}

// 한국 시간 기준 이번 달 (1~12)
function currentKoreaMonth() {
  try {
    return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'numeric' }).format(new Date()));
  } catch (e) {
    return new Date().getMonth() + 1;
  }
}

function flowerMonths(f) {
  return (Array.isArray(f.months) ? f.months : []).map(Number).filter(m => m >= 1 && m <= 12);
}

function isFlowerInSeason(f, month = currentKoreaMonth()) {
  return flowerMonths(f).includes(month);
}

// '3~5월', '12~3월', '5·6·9·10월', 비어 있으면 '사계절'
function formatFlowerMonths(f, lang = 'ko') {
  const ms = flowerMonths(f);
  if (!ms.length) return lang === 'en' ? 'All year' : lang === 'ja' ? '通年' : '사계절';
  const set = new Set(ms);
  // 연속된 달이면 범위로 (12월→1월 넘어가는 것도)
  const start = ms.find(m => !set.has(m === 1 ? 12 : m - 1));
  if (start !== undefined) {
    const run = [start];
    while (set.has((run[run.length - 1] % 12) + 1) && run.length < ms.length) run.push((run[run.length - 1] % 12) + 1);
    if (run.length === ms.length && ms.length > 1) {
      const a = run[0], b = run[run.length - 1];
      if (lang === 'en') return `${monthNameEn(a)}–${monthNameEn(b)}`;
      return lang === 'ja' ? `${a}〜${b}月` : `${a}~${b}월`;
    }
  }
  if (lang === 'en') return ms.map(monthNameEn).join(', ');
  return lang === 'ja' ? `${ms.join('・')}月` : `${ms.join('·')}월`;
}

function monthNameEn(m) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
}

// 상품에 쓰인 꽃 id 목록 (관리자에서 고른 p.flowers 우선)
function productFlowerIds(p) {
  if (!p) return [];
  if (Array.isArray(p.flowers)) return p.flowers;
  return DEFAULT_PRODUCT_FLOWERS[p.id] || [];
}

function productFlowers(p, flowers = loadFlowers()) {
  return productFlowerIds(p).map(id => flowers.find(f => f.id === id)).filter(Boolean);
}

// 상품에 지금 제철인 꽃이 하나라도 있으면 true
function isProductInSeason(p, flowers = loadFlowers(), month = currentKoreaMonth()) {
  return productFlowers(p, flowers).some(f => isFlowerInSeason(f, month));
}

// 화면 언어에 맞는 꽃 이름·꽃말
function flowerText(f, lang) {
  const l = lang || (typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko');
  if (l === 'en') return { name: f.nameEn || f.name, meaning: f.meaningEn || f.meaning };
  if (l === 'ja') return { name: f.nameJa || f.name, meaning: f.meaningJa || f.meaning };
  return { name: f.name, meaning: f.meaning };
}
