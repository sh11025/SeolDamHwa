// assets/js/flowers-data.js
// 설담화(說談花) 꽃 사전 - 꽃 이름·꽃말·제철 달·색·관리법을 한 번 등록해 두고 상품에서 '사용한 꽃'으로 골라 씁니다.
// 저장: localStorage 'seoldamhwa_flowers' (CSV는 DATA/flowers.csv). 제철 달(months)이 비어 있으면 '사계절'로 보고 제철 표시는 하지 않아요.

var FLOWERS_KEY = DataStore.KEYS.flowers;

const DEFAULT_FLOWERS = [
  { id: 'rose', name: '장미', nameEn: 'Rose', nameJa: 'バラ', meaning: '사랑, 열정, 기쁨', meaningEn: 'Love, passion, joy', meaningJa: '愛、情熱、喜び', months: [5, 6], yearRound: true, colors: '빨강 · 분홍 · 흰색 · 노랑 · 주황 · 보라', care: '줄기 끝을 사선으로 1~2cm 자르고, 물은 매일 갈아 주세요.' },
  { id: 'peony', name: '작약', nameEn: 'Peony', nameJa: 'シャクヤク', meaning: '수줍음, 부끄러움, 행복한 결혼', meaningEn: 'Bashfulness, a happy marriage', meaningJa: 'はにかみ、幸せな結婚', months: [5, 6], colors: '분홍 · 흰색 · 버건디 · 코랄', care: '봉오리로 받아 실온에 두면 하루이틀 사이 활짝 피어요.' },
  { id: 'tulip', name: '튤립', nameEn: 'Tulip', nameJa: 'チューリップ', meaning: '사랑의 고백, 영원한 애정', meaningEn: 'A declaration of love, lasting affection', meaningJa: '愛の告白、永遠の愛情', months: [2, 3, 4, 5], colors: '빨강 · 노랑 · 분홍 · 흰색 · 보라 · 망고', care: '물은 얕게, 서늘한 곳에 두세요. 줄기가 빛 쪽으로 휘어요.' },
  { id: 'freesia', name: '프리지아', nameEn: 'Freesia', nameJa: 'フリージア', meaning: '새로운 시작, 응원, 천진난만', meaningEn: 'New beginnings, cheering on, innocence', meaningJa: '新しい始まり、応援、無邪気', months: [1, 2, 3, 4], colors: '노랑 · 흰색 · 보라 · 분홍', care: '아래 꽃부터 피어요. 시든 꽃만 떼어 주면 위 봉오리가 계속 피어요.' },
  { id: 'ranunculus', name: '라넌큘러스', nameEn: 'Ranunculus', nameJa: 'ラナンキュラス', meaning: '매력, 매혹, 비난하다', meaningEn: 'Charm, fascination, reproach', meaningJa: '魅力、魅惑、非難', months: [12, 1, 2, 3, 4], colors: '분홍 · 노랑 · 흰색 · 주황 · 빨강', care: '줄기가 무르기 쉬워 물은 얕게(3~4cm) 담아 주세요.' },
  { id: 'anemone', name: '아네모네', nameEn: 'Anemone', nameJa: 'アネモネ', meaning: '기대, 기다림, 이루지 못할 사랑', meaningEn: 'Anticipation, waiting, unrequited love', meaningJa: '期待、待ち望む、叶わぬ恋', months: [12, 1, 2, 3, 4], colors: '보라 · 빨강 · 흰색 · 분홍 · 파랑', care: '따뜻하면 금방 피어요. 서늘한 곳에 두세요.' },
  { id: 'stock', name: '스톡', nameEn: 'Stock', nameJa: 'ストック', meaning: '영원한 아름다움, 변치 않는 사랑', meaningEn: 'Lasting beauty, unchanging love', meaningJa: '永遠の美、変わらぬ愛', months: [11, 12, 1, 2, 3, 4], colors: '흰색 · 분홍 · 보라 · 연노랑', care: '물이 쉽게 탁해져요. 물을 자주 갈아 주세요.' },
  { id: 'camellia', name: '동백', nameEn: 'Camellia', nameJa: 'ツバキ', meaning: '그 누구보다 그대를 사랑해', meaningEn: 'I love you more than anyone', meaningJa: '誰よりもあなたを愛す', months: [12, 1, 2, 3], colors: '빨강 · 분홍', care: '가지 끝을 십자로 갈라 주면 물을 잘 빨아들여요.' },
  { id: 'plum-blossom', name: '매화', nameEn: 'Plum blossom', nameJa: '梅', meaning: '고결한 마음, 인내', meaningEn: 'Noble heart, patience', meaningJa: '高潔な心、忍耐', months: [2, 3], colors: '흰색 · 분홍', care: '가지 끝을 비스듬히 자르고 물을 넉넉히 담아 주세요.' },
  { id: 'magnolia', name: '목련', nameEn: 'Magnolia', nameJa: 'モクレン', meaning: '고귀함', meaningEn: 'Nobility', meaningJa: '高貴', months: [3, 4], colors: '흰색 · 자주', care: '꽃잎이 상처에 약해요. 넉넉한 화병에 꽂아 주세요.' },
  { id: 'carnation', name: '카네이션', nameEn: 'Carnation', nameJa: 'カーネーション', meaning: '모정, 사랑, 존경, 감사', meaningEn: 'Mother\'s love, respect, gratitude', meaningJa: '母の愛、尊敬、感謝', months: [4, 5, 6], yearRound: true, colors: '빨강 · 분홍 · 흰색 · 주황 · 투톤', care: '마디 바로 위를 잘라 주면 더 오래가요.' },
  { id: 'delphinium', name: '델피늄', nameEn: 'Delphinium', nameJa: 'デルフィニウム', meaning: '왜 당신은 나를 싫어합니까, 자유', meaningEn: 'Why do you dislike me? Freedom', meaningJa: 'なぜ私を嫌うのですか、自由', months: [5, 6, 7, 8], colors: '파랑 · 하늘색 · 흰색 · 연보라', care: '꽃잎이 잘 떨어져요. 바람이 없는 곳에 두세요.' },
  { id: 'calla', name: '칼라', nameEn: 'Calla lily', nameJa: 'カラー', meaning: '천년의 사랑, 순수, 청결', meaningEn: 'A thousand-year love, purity', meaningJa: '千年の愛、純粋、清潔', months: [4, 5, 6, 7], colors: '흰색 · 분홍 · 노랑 · 자주 · 흑보라', care: '물은 얕게(5cm) 담아 줄기가 무르지 않게 해 주세요.' },
  { id: 'hydrangea', name: '수국', nameEn: 'Hydrangea', nameJa: 'アジサイ', meaning: '진심, 변덕, 처녀의 꿈', meaningEn: 'Sincerity, fickleness, a maiden\'s dream', meaningJa: '真心、移り気、乙女の夢', months: [6, 7, 8], yearRound: true, colors: '흰색 · 파랑 · 분홍 · 보라 · 연두', care: '물을 아주 좋아해요. 시들면 꽃송이를 물에 잠시 담가 주세요.' },
  { id: 'lily', name: '백합', nameEn: 'Lily', nameJa: 'ユリ', meaning: '순결, 변함없는 사랑', meaningEn: 'Purity, unchanging love', meaningJa: '純潔、変わらぬ愛', months: [5, 6, 7, 8], yearRound: true, colors: '흰색 · 분홍 · 노랑 · 주황', care: '꽃가루가 옷에 묻으면 잘 안 지워져요. 수술은 미리 떼어 주세요.' },
  { id: 'lisianthus', name: '리시안셔스', nameEn: 'Lisianthus', nameJa: 'トルコキキョウ', meaning: '변치 않는 사랑, 우아함', meaningEn: 'Everlasting love, grace', meaningJa: '変わらぬ愛、優雅', months: [6, 7, 8, 9], yearRound: true, colors: '흰색 · 분홍 · 보라 · 연두 · 샴페인', care: '오래가는 꽃이에요. 시든 송이만 떼어 주세요.' },
  { id: 'lotus', name: '연꽃', nameEn: 'Lotus', nameJa: 'ハス', meaning: '순결, 청결', meaningEn: 'Purity', meaningJa: '清らかさ', months: [7, 8], colors: '분홍 · 흰색', care: '아침에 피고 오후에 오므라들어요. 물을 넉넉히 담아 주세요.' },
  { id: 'sunflower', name: '해바라기', nameEn: 'Sunflower', nameJa: 'ヒマワリ', meaning: '일편단심, 동경, 기다림', meaningEn: 'Devotion, adoration, waiting', meaningJa: '一途な心、憧れ、待ち望む', months: [6, 7, 8, 9], colors: '노랑 · 주황 · 적갈색', care: '줄기가 굵어 물을 많이 마셔요. 물을 자주 채워 주세요.' },
  { id: 'dahlia', name: '다알리아', nameEn: 'Dahlia', nameJa: 'ダリア', meaning: '화려함, 감사, 우아', meaningEn: 'Splendor, gratitude, elegance', meaningJa: '華やかさ、感謝、優雅', months: [7, 8, 9, 10], colors: '빨강 · 분홍 · 주황 · 흰색 · 보라', care: '물이 쉽게 상해요. 매일 갈아 주세요.' },
  { id: 'cockscomb', name: '맨드라미', nameEn: 'Cockscomb', nameJa: 'ケイトウ', meaning: '시들지 않는 사랑, 열정', meaningEn: 'Unfading love, passion', meaningJa: '色あせぬ愛、情熱', months: [8, 9, 10], colors: '빨강 · 분홍 · 노랑 · 주황 · 연두', care: '말려도 색이 남아 드라이플라워로 오래 둘 수 있어요.' },
  { id: 'cosmos', name: '코스모스', nameEn: 'Cosmos', nameJa: 'コスモス', meaning: '순정, 조화', meaningEn: 'Innocence, harmony', meaningJa: '乙女の真心、調和', months: [9, 10], colors: '분홍 · 흰색 · 자주', care: '가녀린 꽃이라 서늘한 곳에서 더 오래가요.' },
  { id: 'chrysanthemum', name: '국화', nameEn: 'Chrysanthemum', nameJa: 'キク', meaning: '고결, 진실', meaningEn: 'Nobility, truth', meaningJa: '高潔、真実', months: [9, 10, 11], colors: '흰색 · 노랑 · 자주', care: '물에 잠기는 잎은 떼어 주세요. 2주 넘게 가는 꽃이에요.' },
  { id: 'gerbera', name: '거베라', nameEn: 'Gerbera', nameJa: 'ガーベラ', meaning: '신비, 수수께끼, 희망', meaningEn: 'Mystery, riddle, hope', meaningJa: '神秘、謎、希望', months: [4, 5, 6, 7, 8, 9, 10], yearRound: true, colors: '빨강 · 분홍 · 주황 · 노랑 · 흰색', care: '줄기가 무르기 쉬워요. 물은 3~4cm만 담아 주세요.' },
  { id: 'phalaenopsis', name: '호접란', nameEn: 'Moth orchid', nameJa: 'コチョウラン', meaning: '행복이 날아온다', meaningEn: 'Happiness flies to you', meaningJa: '幸福が飛んでくる', months: [11, 12, 1, 2, 3, 4], yearRound: true, colors: '흰색 · 분홍 · 자주 · 노랑', care: '사계절 만날 수 있어요. 직사광선을 피해 주세요.' },
  { id: 'babys-breath', name: '안개꽃', nameEn: 'Baby\'s breath', nameJa: 'カスミソウ', meaning: '맑은 마음, 사랑의 성공', meaningEn: 'A pure heart, love\'s success', meaningJa: '清らかな心、恋の成功', months: [5, 6, 7, 8], yearRound: true, colors: '흰색 (물들이면 여러 색)', care: '그대로 말리면 드라이플라워가 돼요.' },
  { id: 'eucalyptus', name: '유칼립투스', nameEn: 'Eucalyptus', nameJa: 'ユーカリ', meaning: '추억, 감사', meaningEn: 'Memories, gratitude', meaningJa: '思い出、感謝', months: [9, 10, 11, 12, 1, 2, 3, 4], yearRound: true, colors: '실버그린 · 초록 (잎 소재)', care: '향이 좋은 잎 소재예요. 말려도 모양이 오래가요.' },
  { id: 'gladiolus', name: '글라디올러스', nameEn: 'Gladiolus', nameJa: 'グラジオラス', meaning: '밀회, 주의, 견고함', meaningEn: 'Secret meetings, caution, strength', meaningJa: '密会、用心、堅固', months: [6, 7, 8, 9], colors: '빨강 · 분홍 · 흰색 · 노랑 · 연두', care: '아래 꽃부터 피어요. 맨 위 봉오리를 조금 잘라 주면 아래 꽃이 오래가요.' },
  { id: 'spray-mum', name: '소국·퐁퐁국화', nameEn: 'Spray mum', nameJa: '小菊・ポンポンマム', meaning: '진실, 성실, 고결', meaningEn: 'Truth, sincerity, nobility', meaningJa: '真実、誠実、高潔', months: [9, 10, 11], yearRound: true, colors: '흰색 · 노랑 · 분홍 · 연두 · 주황', care: '물에 잠기는 잎을 떼어 주면 2주 넘게 가요.' },
  { id: 'sweet-pea', name: '스위트피', nameEn: 'Sweet pea', nameJa: 'スイートピー', meaning: '나비처럼 날아오름, 기쁨, 출발', meaningEn: 'Taking wing, joy, a new start', meaningJa: '蝶のように飛び立つ、喜び、門出', months: [12, 1, 2, 3, 4], colors: '분홍 · 연보라 · 흰색 · 크림 · 코랄', care: '향이 좋고 여린 꽃이에요. 서늘한 곳에 두고 물은 얕게 담아 주세요.' },
  { id: 'oxypetalum', name: '옥시펜탈룸', nameEn: 'Oxypetalum (Blue star)', nameJa: 'オキシペタラム（ブルースター）', meaning: '청초한 마음, 믿는 사랑', meaningEn: 'A pure heart, trusting love', meaningJa: '清楚な心、信じ合う愛', months: [5, 6, 7, 8, 9], colors: '하늘색 · 파랑', care: '줄기를 자르면 흰 진액이 나와요. 물에 잠깐 헹군 뒤 꽂아 주세요.' },
  { id: 'statice', name: '스타티스', nameEn: 'Statice', nameJa: 'スターチス', meaning: '영원한 사랑', meaningEn: 'Everlasting love', meaningJa: '永遠の愛', months: [4, 5, 6, 7, 8], yearRound: true, colors: '보라 · 분홍 · 노랑 · 흰색', care: '그대로 말리면 색이 남는 드라이플라워가 돼요.' },
  { id: 'waxflower', name: '왁스플라워', nameEn: 'Waxflower', nameJa: 'ワックスフラワー', meaning: '변덕스러운 사랑, 귀여움', meaningEn: 'Fickle love, sweetness', meaningJa: '移り気な愛、可愛らしさ', months: [12, 1, 2, 3, 4, 5], colors: '분홍 · 흰색 · 자주', care: '작은 꽃이 오래가요. 물을 자주 갈아 주세요.' },
  { id: 'astrantia', name: '아스트란티아', nameEn: 'Astrantia', nameJa: 'アストランティア', meaning: '별의 눈물, 보호', meaningEn: 'Tears of stars, protection', meaningJa: '星の涙、守り', months: [5, 6, 7, 8], colors: '흰색 · 연분홍 · 와인', care: '물을 넉넉히 담고 줄기 끝을 자주 다듬어 주세요.' },
  { id: 'scabiosa', name: '스카비오사', nameEn: 'Scabiosa', nameJa: 'スカビオサ', meaning: '이루어질 수 없는 사랑, 매력', meaningEn: 'Unattainable love, charm', meaningJa: '叶わぬ恋、魅力', months: [4, 5, 6, 7, 8, 9, 10], colors: '보라 · 분홍 · 흰색 · 버건디', care: '줄기가 가늘어요. 물을 얕게 담고 자주 갈아 주세요.' },
  { id: 'alstroemeria', name: '알스트로메리아', nameEn: 'Alstroemeria', nameJa: 'アルストロメリア', meaning: '배려, 새로운 만남, 우정', meaningEn: 'Care, new encounters, friendship', meaningJa: '思いやり、新しい出会い、友情', months: [4, 5, 6, 7], yearRound: true, colors: '분홍 · 주황 · 노랑 · 흰색 · 빨강', care: '2주 가까이 가는 오래가는 꽃이에요. 누렇게 되는 잎은 떼어 주세요.' },
  { id: 'matricaria', name: '마트리카리아', nameEn: 'Matricaria', nameJa: 'マトリカリア', meaning: '어머님의 사랑, 순수', meaningEn: 'A mother\'s love, purity', meaningJa: '母の愛、純粋', months: [4, 5, 6, 7], colors: '흰색 (가운데 노랑)', care: '작은 꽃이 촘촘해요. 물을 자주 갈아 주세요.' },
  { id: 'bouvardia', name: '부바르디아', nameEn: 'Bouvardia', nameJa: 'ブバルディア', meaning: '나는 당신의 포로, 열정', meaningEn: 'I am your captive, passion', meaningJa: 'あなたのとりこ、情熱', months: [6, 7, 8, 9, 10], colors: '흰색 · 분홍 · 연분홍', care: '물을 잘 못 빨아요. 줄기를 사선으로 자주 다듬어 주세요.' },
  { id: 'veronica', name: '베로니카', nameEn: 'Veronica', nameJa: 'ベロニカ', meaning: '충실, 정절, 명예', meaningEn: 'Fidelity, faithfulness, honor', meaningJa: '忠実、貞節、名誉', months: [6, 7, 8, 9], colors: '보라 · 파랑 · 흰색 · 분홍', care: '끝이 빛 쪽으로 휘어요. 화병을 가끔 돌려 주세요.' },
  { id: 'mimosa', name: '미모사', nameEn: 'Mimosa', nameJa: 'ミモザ', meaning: '민감, 섬세함, 우정', meaningEn: 'Sensitivity, delicacy, friendship', meaningJa: '敏感、繊細、友情', months: [2, 3], colors: '노랑', care: '건조하면 꽃이 금방 오므라들어요. 그대로 말려 드라이로 즐겨도 좋아요.' },
  { id: 'ruscus', name: '루스커스', nameEn: 'Ruscus', nameJa: 'ルスカス', meaning: '간절한 희망, 열렬한 마음', meaningEn: 'Earnest hope, an ardent heart', meaningJa: '切なる希望、熱い心', months: [], yearRound: true, colors: '짙은 초록 (잎 소재)', care: '잎 소재라 3주 넘게 가요. 물만 가끔 갈아 주세요.' },
  { id: 'snow-willow', name: '설유화', nameEn: 'Spiraea (Snow willow)', nameJa: 'ユキヤナギ', meaning: '애교, 총명', meaningEn: 'Charm, wit', meaningJa: '愛嬌、聡明', months: [1, 2, 3, 4], colors: '흰색 꽃 (초봄) · 연두 잎', care: '1~4월은 꽃 가지, 5~8월은 잎 가지로 써요. 가지 끝을 갈라 물을 잘 빨게 해 주세요.' },
  { id: 'daffodil', name: '수선화', nameEn: 'Daffodil', nameJa: 'スイセン', meaning: '자존심, 고결', meaningEn: 'Self-respect, nobility', meaningJa: '自尊心、高潔', months: [12, 1, 2, 3], colors: '노랑 · 흰색', care: '줄기 진액이 다른 꽃을 시들게 해요. 하루 따로 꽂아 둔 뒤 섞어 주세요.' },
  { id: 'hyacinth', name: '히아신스', nameEn: 'Hyacinth', nameJa: 'ヒヤシンス', meaning: '겸손한 사랑, 기쁨', meaningEn: 'Modest love, joy', meaningJa: '控えめな愛、喜び', months: [2, 3, 4], colors: '보라 · 분홍 · 흰색 · 파랑', care: '향이 진해요. 서늘한 곳에 두면 더 오래가요.' },
  { id: 'lilac', name: '라일락', nameEn: 'Lilac', nameJa: 'ライラック', meaning: '첫사랑, 젊은 날의 추억', meaningEn: 'First love, memories of youth', meaningJa: '初恋、若き日の思い出', months: [4, 5], colors: '보라 · 흰색', care: '가지 끝을 십자로 갈라 물을 넉넉히 주세요.' },
  { id: 'lily-of-the-valley', name: '은방울꽃', nameEn: 'Lily of the valley', nameJa: 'スズラン', meaning: '틀림없이 행복해진다', meaningEn: 'Happiness will surely come', meaningJa: '必ず幸せになる', months: [5, 6], colors: '흰색', care: '여린 꽃이에요. 서늘하게 두고 물은 얕게 담아 주세요.' },
  { id: 'clematis', name: '클레마티스', nameEn: 'Clematis', nameJa: 'クレマチス', meaning: '고결, 당신의 마음은 아름답다', meaningEn: 'Nobility, your heart is beautiful', meaningJa: '高潔、美しい心', months: [5, 6, 7], colors: '보라 · 흰색 · 분홍', care: '줄기가 가늘어 꺾이기 쉬워요. 짧게 잘라 낮은 화병에 꽂아 주세요.' },
  { id: 'amaryllis', name: '아마릴리스', nameEn: 'Amaryllis', nameJa: 'アマリリス', meaning: '눈부신 아름다움, 침묵', meaningEn: 'Dazzling beauty, silence', meaningJa: '輝くばかりの美しさ、沈黙', months: [12, 1, 2], colors: '빨강 · 흰색 · 분홍', care: '줄기 속이 비어 있어요. 물을 얕게 담고 자주 갈아 주세요.' },
  { id: 'cymbidium', name: '심비디움', nameEn: 'Cymbidium', nameJa: 'シンビジウム', meaning: '귀부인, 미인', meaningEn: 'A noble lady, beauty', meaningJa: '貴婦人、美人', months: [12, 1, 2, 3], colors: '흰색 · 분홍 · 연두 · 노랑', care: '한 달 가까이 가요. 직사광선과 난방기 바람을 피해 주세요.' },
  { id: 'snapdragon', name: '금어초', nameEn: 'Snapdragon', nameJa: 'キンギョソウ', meaning: '수다쟁이, 욕망', meaningEn: 'Chatterbox, desire', meaningJa: 'おしゃべり、欲望', months: [4, 5, 6], colors: '분홍 · 흰색 · 노랑 · 주황 · 빨강', care: '끝이 빛 쪽으로 휘어요. 아래쪽 시든 꽃을 떼어 주세요.' },
  { id: 'globe-amaranth', name: '천일홍', nameEn: 'Globe amaranth', nameJa: 'センニチコウ', meaning: '변치 않는 사랑, 매혹', meaningEn: 'Unchanging love, fascination', meaningJa: '変わらぬ愛、魅惑', months: [7, 8, 9, 10], colors: '자주 · 분홍 · 흰색', care: '말려도 색과 모양이 그대로 남아요.' },
  { id: 'china-aster', name: '과꽃', nameEn: 'China aster', nameJa: 'エゾギク', meaning: '믿음직한 사랑, 추억', meaningEn: 'Trustworthy love, memories', meaningJa: '信頼の愛、思い出', months: [8, 9, 10], colors: '보라 · 분홍 · 흰색', care: '잎을 정리하고 물을 자주 갈아 주세요.' },
  { id: 'poppy', name: '꽃양귀비', nameEn: 'Poppy', nameJa: 'ポピー', meaning: '위로, 위안', meaningEn: 'Comfort, consolation', meaningJa: '慰め、いたわり', months: [4, 5, 6], colors: '빨강 · 주황 · 흰색 · 분홍', care: '봉오리로 꽂아도 물에서 피어나요. 줄기 끝을 잠깐 뜨거운 물에 담그면 오래가요.' },
  { id: 'cotton', name: '목화', nameEn: 'Cotton', nameJa: 'ワタ（綿花）', meaning: '어머니의 사랑', meaningEn: 'A mother\'s love', meaningJa: '母の愛', months: [9, 10, 11], colors: '흰색 (말린 소재)', care: '말린 소재라 물을 주지 않아요. 습기를 피해 주세요.' },
  { id: 'protea', name: '프로테아', nameEn: 'Protea', nameJa: 'プロテア', meaning: '왕의 위엄, 변화', meaningEn: 'Royal dignity, change', meaningJa: '王者の威厳、変化', months: [], yearRound: true, colors: '분홍 · 흰색 · 크림', care: '2~3주 가는 튼튼한 꽃이에요. 말려 두어도 멋져요.' },
  { id: 'pincushion', name: '핀쿠션', nameEn: 'Pincushion (Leucospermum)', nameJa: 'ピンクッション', meaning: '어디서나 성공', meaningEn: 'Success everywhere', meaningJa: 'どこでも成功', months: [], yearRound: true, colors: '주황 · 노랑 · 빨강', care: '물을 적게 담아도 오래가요.' },
  { id: 'sweet-william', name: '수염패랭이', nameEn: 'Sweet William', nameJa: 'ビジョナデシコ', meaning: '의협심, 재능', meaningEn: 'Gallantry, talent', meaningJa: '義侠心、才能', months: [4, 5, 6], colors: '빨강 · 분홍 · 흰색 · 투톤', care: '마디 바로 위를 잘라 주면 물을 잘 빨아요.' },
  { id: 'iris', name: '아이리스', nameEn: 'Iris', nameJa: 'アイリス', meaning: '좋은 소식, 기쁜 소식', meaningEn: 'Good news', meaningJa: '良い知らせ', months: [4, 5, 6], colors: '보라 · 파랑 · 흰색 · 노랑', care: '봉오리가 하루이틀 사이 피어요. 시든 꽃은 바로 떼어 주세요.' },
  { id: 'zinnia', name: '백일홍', nameEn: 'Zinnia', nameJa: 'ジニア', meaning: '인연, 떠나간 친구를 그리워함', meaningEn: 'A bond, missing an absent friend', meaningJa: '縁、去った友を想う', months: [6, 7, 8, 9, 10], colors: '빨강 · 분홍 · 주황 · 노랑 · 흰색', care: '줄기가 무르기 쉬워요. 물은 얕게 담아 주세요.' },
  { id: 'cherry-blossom', name: '벚꽃 가지', nameEn: 'Cherry blossom branch', nameJa: '桜の枝', meaning: '정신의 아름다움', meaningEn: 'Spiritual beauty', meaningJa: '精神の美', months: [3, 4], colors: '연분홍 · 흰색', care: '봉오리 가지로 꽂으면 실내에서 피어요. 가지 끝을 갈라 주세요.' },
  { id: 'lavender', name: '라벤더', nameEn: 'Lavender', nameJa: 'ラベンダー', meaning: '침묵, 기대', meaningEn: 'Silence, expectation', meaningJa: '沈黙、期待', months: [6, 7, 8], colors: '보라', care: '그대로 말리면 향이 오래 남아요.' },
  { id: 'marguerite', name: '마거리트', nameEn: 'Marguerite daisy', nameJa: 'マーガレット', meaning: '진실한 사랑, 마음속에 감춘 사랑', meaningEn: 'True love, a hidden love', meaningJa: '真実の愛、秘めた愛', months: [4, 5, 6], colors: '흰색 · 노랑 · 분홍', care: '물을 자주 갈아 주면 오래가요.' },
  { id: 'hypericum', name: '히페리쿰', nameEn: 'Hypericum', nameJa: 'ヒペリカム', meaning: '슬픔은 계속되지 않는다', meaningEn: 'Sorrow will not last', meaningJa: '悲しみは続かない', months: [], yearRound: true, colors: '빨강 · 분홍 · 초록 · 크림 (열매)', care: '열매 소재예요. 2주 넘게 가요.' }
];

// 꽃 사전 기본 목록 판 (올리면 이미 저장된 꽃 사전에 새 꽃을 더함)
const FLOWER_DEFAULTS_VERSION = 2;
// 판 2에서 꽃말·색·제철을 바꾼 꽃의 예전 값. 저장된 꽃이 이 값 그대로(사장님이 안 고침)일 때만 새 값으로 바꿈
const FLOWER_DEFAULTS_V1 = {"rose": {"meaning": "사랑, 아름다움", "colors": "빨강 · 분홍 · 흰색 · 노랑", "months": [5, 6, 9, 10]}, "peony": {"meaning": "수줍음, 부끄러움", "colors": "분홍 · 흰색 · 코랄", "months": [5, 6]}, "tulip": {"meaning": "사랑의 고백", "colors": "여러 색", "months": [2, 3, 4]}, "freesia": {"meaning": "새로운 시작, 천진난만", "colors": "노랑 · 흰색 · 보라", "months": [2, 3, 4]}, "ranunculus": {"meaning": "매력, 화사함", "colors": "분홍 · 주황 · 흰색", "months": [2, 3, 4, 5]}, "anemone": {"meaning": "기다림, 기대", "colors": "빨강 · 흰색 · 보라", "months": [2, 3, 4]}, "stock": {"meaning": "영원한 아름다움", "colors": "분홍 · 흰색 · 보라", "months": [1, 2, 3, 4]}, "carnation": {"meaning": "사랑, 존경", "colors": "빨강 · 분홍 · 흰색", "months": [4, 5]}, "delphinium": {"meaning": "당신을 행복하게 해 줄게요", "colors": "파랑 · 보라 · 흰색", "months": [5, 6, 7]}, "calla": {"meaning": "순수, 열정", "colors": "흰색 · 노랑 · 자주", "months": [5, 6, 7]}, "hydrangea": {"meaning": "진심", "colors": "파랑 · 분홍 · 흰색", "months": [6, 7, 8]}, "lily": {"meaning": "순결, 변함없는 사랑", "colors": "흰색 · 분홍", "months": [6, 7, 8]}, "lisianthus": {"meaning": "변치 않는 사랑", "colors": "흰색 · 보라 · 분홍", "months": [6, 7, 8, 9]}, "sunflower": {"meaning": "동경, 기다림", "colors": "노랑", "months": [7, 8, 9]}, "dahlia": {"meaning": "우아함, 감사", "colors": "빨강 · 주황 · 분홍 · 버건디", "months": [8, 9, 10]}, "cockscomb": {"meaning": "시들지 않는 사랑", "colors": "빨강 · 주황 · 자주", "months": [8, 9, 10]}, "gerbera": {"meaning": "신비, 풍부한 사랑", "colors": "여러 색", "months": [4, 5, 9, 10]}, "phalaenopsis": {"meaning": "행복이 날아온다", "colors": "흰색 · 분홍 · 자주", "months": []}, "babys-breath": {"meaning": "맑은 마음, 깨끗한 사랑", "colors": "흰색 · 분홍", "months": []}, "eucalyptus": {"meaning": "추억", "colors": "초록 (잎 소재)", "months": []}};

// 기본 상품에 쓰인 꽃 (상품의 '꽃말 및 상징' 칸에 적힌 꽃 이름 기준). 관리자에서 고르면 p.flowers로 바뀜
const DEFAULT_PRODUCT_FLOWERS = {
  'bohemian-autumn': ['dahlia', 'phalaenopsis', 'rose'],
  'pale-pink-rose': ['rose'],
  'creamy-sunshine': ['gerbera', 'chrysanthemum', 'rose'],
  'royal-blue-garden': ['rose', 'delphinium', 'lisianthus']
};

function loadFlowers() {
  const list = DataStore.read(FLOWERS_KEY);
  if (!list) return JSON.parse(JSON.stringify(DEFAULT_FLOWERS));
  return Array.isArray(list) ? upgradeSavedFlowers(list) : JSON.parse(JSON.stringify(DEFAULT_FLOWERS));
}

// 이미 저장된 꽃 사전을 새 기본 목록에 맞춤 (한 번만): 없는 꽃은 더하고,
// 사장님이 고치지 않은 꽃만 새 꽃말·색·제철로 바꿈. 직접 고치거나 추가한 꽃은 그대로
function upgradeSavedFlowers(list) {
  const KEY = DataStore.KEYS.flowersVersion;
  let ver = 1;
  try { ver = Number(DataStore.readRaw(KEY)) || 1; } catch (e) { /* 무시 */ }
  if (ver >= FLOWER_DEFAULTS_VERSION) return list;
  const sameMonths = (a, b) => JSON.stringify((a || []).map(Number)) === JSON.stringify((b || []).map(Number));
  const out = list.map(f => {
    const old = FLOWER_DEFAULTS_V1[f.id];
    const fresh = DEFAULT_FLOWERS.find(d => d.id === f.id);
    if (old && fresh && f.meaning === old.meaning && f.colors === old.colors && sameMonths(f.months, old.months)) {
      return { ...f, meaning: fresh.meaning, meaningEn: fresh.meaningEn, meaningJa: fresh.meaningJa, colors: fresh.colors, months: fresh.months, yearRound: !!fresh.yearRound };
    }
    return f;
  });
  DEFAULT_FLOWERS.forEach(d => {
    if (!out.some(f => f.id === d.id || f.name === d.name)) out.push(JSON.parse(JSON.stringify(d)));
  });
  try {
    DataStore.write(FLOWERS_KEY, out);
    DataStore.writeRaw(KEY, String(FLOWER_DEFAULTS_VERSION));
  } catch (e) { /* 저장 공간이 없으면 이번 화면에서만 */ }
  return out;
}

function saveFlowers(list) {
  DataStore.write(FLOWERS_KEY, list);
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

// 제철 + 연중 유통 표시 (예: '5~6월 · 연중 유통')
function formatFlowerSeason(f, lang = 'ko') {
  const base = formatFlowerMonths(f, lang);
  if (!f.yearRound) return base;
  const yr = lang === 'en' ? 'available all year' : lang === 'ja' ? '通年流通' : '연중 유통';
  return flowerMonths(f).length ? `${base} · ${yr}` : yr;
}

// 상품에 쓰인 꽃 id 목록 (관리자에서 고른 p.flowers 우선)
function productFlowerIds(p) {
  if (!p || p.category === 'goods') return [];
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
