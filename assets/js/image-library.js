// assets/js/image-library.js
// 설담화(說談花) 관리자 이미지 고르기: 사이트에 있는 사진 + 내 컴퓨터에서 올린 사진
// 올린 사진은 크기를 줄여(가로·세로 최대 1200px, JPG) 이 브라우저에 저장합니다.
// 서버를 붙이면 saveUploadedImage()만 서버 업로드로 바꾸면 됩니다.

var IMAGE_LIBRARY_KEY = DataStore.KEYS.images;
const IMAGE_MAX_SIDE = 1200;
const IMAGE_QUALITY = 0.82;

// 사이트에 이미 있는 사진
const SITE_IMAGES = [
  { src: 'assets/images/products/signature-bouquet.jpg', name: '시그니처 꽃다발' },
  { src: 'assets/images/products/norigae-basket.jpg', name: '노리개 꽃바구니' },
  { src: 'assets/images/products/space-design.jpg', name: '공간 디자인' },
  { src: 'assets/images/products/bohemian-autumn.jpg', name: '가을 보헤미안' },
  { src: 'assets/images/products/pale-pink-rose.jpg', name: '연분홍 장미' },
  { src: 'assets/images/products/creamy-sunshine.jpg', name: '햇살 크림 바구니' },
  { src: 'assets/images/products/royal-blue-garden.jpg', name: '로열 블루 가든' },
  { src: 'assets/images/story_bojagi_gift.jpg', name: '보자기 선물' },
  { src: 'assets/images/story_bojagi_bouquet.jpg', name: '보자기 꽃다발' },
  { src: 'assets/images/hanji_bg.jpg', name: '한지 배경' }
];

function loadImageLibrary() {
  const list = DataStore.read(IMAGE_LIBRARY_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveImageLibrary(list) {
  DataStore.write(IMAGE_LIBRARY_KEY, list);
}

// 브라우저 저장 공간 사용량 (대략, MB)
function storageUsedMB() {
  return (typeof DataStore !== 'undefined' && DataStore.approximateSize ? DataStore.approximateSize() : 0) / 1024 / 1024;
}

// 파일 → 줄인 JPG dataURL
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      reject(new Error('TYPE'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('READ'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('READ'));
      img.onload = () => {
        const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; // 투명 PNG도 흰 바탕으로
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', IMAGE_QUALITY), width: w, height: h });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function saveUploadedImage(file) {
  const { dataUrl, width, height } = await resizeImageFile(file);
  const list = loadImageLibrary();
  const entry = {
    id: `img-${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, '').slice(0, 30) || '올린 사진',
    src: dataUrl,
    width,
    height,
    createdAt: new Date().toISOString()
  };
  list.unshift(entry);
  try {
    saveImageLibrary(list);
  } catch (e) {
    throw new Error('FULL');
  }
  return entry;
}

function deleteUploadedImage(id) {
  saveImageLibrary(loadImageLibrary().filter(x => x.id !== id));
}

/* ---------- 고르기 창 ---------- */
let imagePickerCallback = null;

function openImagePicker(onPick) {
  imagePickerCallback = onPick;
  renderImagePicker();
  document.getElementById('image-picker-modal').classList.remove('hidden');
}

function closeImagePicker() {
  document.getElementById('image-picker-modal').classList.add('hidden');
  imagePickerCallback = null;
}

function pickImage(src) {
  if (imagePickerCallback) imagePickerCallback(src);
  closeImagePicker();
}

function imageTile(src, name, removableId) {
  const safeName = String(name).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tile = document.createElement('div');
  tile.className = 'relative group';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'block w-full aspect-square rounded-xs overflow-hidden border border-ink-black/10 hover:border-seal-red hover:ring-2 hover:ring-seal-red/30 cursor-pointer bg-[#ECE8E1]';
  btn.title = name;
  const img = document.createElement('img');
  img.src = src;
  img.alt = name;
  img.loading = 'lazy';
  img.className = 'w-full h-full object-cover';
  btn.appendChild(img);
  btn.onclick = () => pickImage(src);
  tile.appendChild(btn);
  const label = document.createElement('p');
  label.className = 'mt-1 text-[11px] text-ink-gray truncate';
  label.innerHTML = safeName;
  tile.appendChild(label);
  if (removableId) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-ink-black text-xs font-bold shadow hidden group-hover:flex items-center justify-center cursor-pointer';
    del.innerText = '×';
    del.title = '이 사진 지우기';
    del.onclick = (e) => {
      e.stopPropagation();
      if (!confirm('올린 사진을 목록에서 지울까요? 이미 쓰고 있는 상품·팝업의 사진은 그대로 남아요.')) return;
      deleteUploadedImage(removableId);
      renderImagePicker();
    };
    tile.appendChild(del);
  }
  return tile;
}

function renderImagePicker() {
  const uploaded = loadImageLibrary();
  const upGrid = document.getElementById('image-picker-uploaded');
  const siteGrid = document.getElementById('image-picker-site');
  upGrid.innerHTML = '';
  siteGrid.innerHTML = '';
  uploaded.forEach(x => upGrid.appendChild(imageTile(x.src, x.name, x.id)));
  document.getElementById('image-picker-uploaded-empty').classList.toggle('hidden', uploaded.length > 0);
  SITE_IMAGES.forEach(x => siteGrid.appendChild(imageTile(x.src, x.name)));
  const used = storageUsedMB();
  const usage = document.getElementById('image-picker-usage');
  usage.innerText = `브라우저 저장 공간 약 ${used.toFixed(1)}MB / 5MB 사용 중`;
  usage.className = `text-xs ${used > 4 ? 'text-seal-red font-bold' : 'text-ink-gray'}`;
}

async function handleImageUpload(input) {
  const files = [...(input.files || [])];
  input.value = '';
  const msg = document.getElementById('image-picker-message');
  let last = null;
  for (const f of files) {
    msg.innerText = `${f.name} 줄이는 중…`;
    msg.className = 'text-xs text-ink-gray';
    try {
      last = await saveUploadedImage(f);
    } catch (e) {
      const reason = e.message === 'TYPE' ? '사진 파일(JPG·PNG·WEBP)만 올릴 수 있어요.'
        : e.message === 'FULL' ? '저장 공간이 가득 찼어요. 안 쓰는 사진을 지운 뒤 다시 올려 주세요.'
        : '사진을 읽지 못했어요.';
      msg.innerText = `${f.name}: ${reason}`;
      msg.className = 'text-xs text-seal-red font-bold';
      renderImagePicker();
      return;
    }
  }
  renderImagePicker();
  if (last) {
    msg.innerText = files.length > 1 ? `${files.length}장을 올렸어요. 쓸 사진을 눌러 고르세요.` : '올렸어요. 사진을 눌러 고르세요.';
    msg.className = 'text-xs text-emerald-700 font-bold';
  }
}
