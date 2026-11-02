# 설담화 작업 이어받기 안내 (HANDOFF)

> 다음 작업자(Claude / Antigravity / 사람)가 바로 이어서 할 수 있도록 정리한 문서입니다. 마지막 업데이트: 2026-11-02 [51]

## 1. 프로젝트 한눈에
- `index.html`: 손님 쇼핑몰 / `admin-index.html`: 관리자 센터. 둘 다 Tailwind CDN + 순수 JS, 데이터는 브라우저 `localStorage`(키 `seoldamhwa_*`).
- [37]부터 화면 코드가 파일로 나뉨: 쇼핑몰 `assets/js/shop/*.js`(core→product→product-page→checkout→nav→curation→inquiry→guide→settings→browse→flowers→dictionary→router→chat 순서로 불러옴), 관리자 `assets/js/admin/*.js`(dashboard→…→tools-ui). 일반 script라 함수는 전역 공유, **불러오는 순서를 바꾸지 말 것**.
- 쇼핑몰 주소: `shop-router.js` — `switchView(view)`는 화면+주소를 함께 바꾸고, 실제 화면 그리기는 `showView(view)`. 새 페이지는 `SHOP_ROUTES['이름'] = params => {...}` 로 등록. 지금 주소: `#/`, `#/story`, `#/custom`, `#/guide/<탭>`, `#/flowers/<종류>`, `#/dictionary`(꽃 사전), `#/flower/<id>`, `#/wishlist`, `#/checkout`. 데스크톱 메뉴는 1280px 이상에서만, 그보다 좁으면 햄버거 메뉴.
- 공용 JS (`assets/js/`)
  - `flowers-data.js` 꽃 사전(`seoldamhwa_flowers`, 기본 `DEFAULT_FLOWERS` 26종)·제철 계산(`isProductInSeason`, 한국 시간 달 기준). 상품의 사용한 꽃은 `p.flowers`(없으면 `DEFAULT_PRODUCT_FLOWERS` — 기본 상품의 '꽃말 및 상징' 칸에 적힌 꽃)
  - `products-data.js` 상품·맞춤 담화 태그 (`DATA_VERSION`은 올리지 말 것: 올리면 저장된 상품·재고가 초기화됨)
  - `site-settings.js` 매장 설정·운영시간·공휴일·사업자·배송비(`delivery`) + `calcDeliveryFee()`
  - `i18n.js` KO/EN/JA 번역 (`t()`, `applyLanguage()`), 저장 데이터는 항상 한국어
  - `site-pages.js` 정성 안내·약관 페이지(관리자에서 수정, `renderPageBody()`는 HTML 이스케이프)
  - `popups.js` 공지 팝업 / `integrations.js` 디스코드(주문·상담 채널) / `restock.js` 재입고 알림 신청(`seoldamhwa_restock`)
  - `csv-db.js` CSV 데이터베이스(DATA 폴더): `CSV_TABLES`에 표 구조, 관리자 '연동·데이터'에서 폴더 연결·저장·불러오기·자동 저장. 표 설명은 `DATA/README.md`
  - 관리자 전용: `finance-data.js`(매출·지출·주문 도우미, `orderRecipient/orderOrderer`), `admin-tools.js`(예시 데이터·백업·AI Claude/GPT/Gemini), `image-library.js`(사진 고르기·올리기)
- 주문 데이터: `ordererName/Phone`(주문자), `recipientName/Phone`(받는 분), `customerName/phone`(예전 호환=주문자), `deliveryMethod/Fee`, `itemsTotal`, `totalAmount`(배송비 포함), `status`(preparing/packaged/delivering/completed/cancelled), `courier/trackingNumber`, `isSample`.

## 2. 작업 방식 (꼭 지키기)
0. **화면 클래스(Tailwind)를 새로 쓰거나 바꾸면 꼭 `npm run build:css`** (처음 한 번은 `npm install`). 예전 CDN 대신 `assets/css/tailwind.css`를 미리 만들어 쓰므로, 다시 만들지 않으면 새 클래스는 화면에 안 먹어요. 설정은 `tailwind.config.js`, 원본은 `src/tailwind.css`. 고치는 중에는 `npm run watch:css`를 켜 두면 저장할 때마다 자동으로 만들어져요.
1. 바꾸기 전 `git status` 확인, 끝나면 커밋 (커밋 메시지 끝에 공동 작성자 줄).
2. 변경 기록: `changelog/YYYY-MM-DD.md` 맨 위에 `## [번호] 제목 (HH:MM)` + 쉬운 한국어 3줄 이하 + `확인:` 1줄, `CHANGELOG.md` 건수 갱신. 다음 번호는 **[52]**.
3. 검증: `python -m http.server 5500`로 띄우고 브라우저에서 직접 클릭. 매번 확인할 것
   - 인라인 스크립트 문법(`node --check`), 모든 `getElementById` id 존재
   - 버튼이 부르는 함수가 모두 있는지: 콘솔에서 `[...new Set([...document.documentElement.outerHTML.matchAll(/on\w+="([A-Za-z_]\w*)\(/g)].map(m=>m[1]))].filter(n=>typeof window[n]!=='function')` → `[]` (예외: `if`)
   - 시험 데이터는 끝나면 지우기 (사용자 데이터 `localStorage.clear()` 금지)
4. 손님·관리자가 쓴 글은 화면에 넣을 때 반드시 `escapeHtml()` / `textContent`.

## 3. 사용자가 정한 방향
- 1:1 상담은 관리자에서 답변을 쓰지 않고 전화·문자로 직접 연락 (답변 쓰기·AI 답변 초안 없앰, 메모만).
- 데이터는 DATA 폴더 CSV로 보관 → 나중에 DB 테이블로 그대로 옮김. 개인정보 CSV는 .gitignore로 Git에 안 올림.
- DB는 지금 로컬, 서버는 나중. 결제(PG)는 사업자 등록 후. 관리자 로그인은 완성 후.
- 디스코드: 주문·상담 채널 분리, 제작 지시서는 디스코드로(인쇄 X).
- AI는 Claude·GPT·Gemini 모두 사용. 키는 관리자 브라우저에만 저장, 백업 제외.
- 가짜 후기·예시 주문은 실제처럼 보이면 안 됨 → 예시 데이터는 [예시] 표시 + 한 번에 지우기.

## 4. 남은 일 (우선순위 순)
1. ~~[35] 손님 편의~~ 완료 (재입고 알림, 공유 미리보기, 모바일 하단 구매 버튼, 사진 늦게 불러오기). 남은 것: 도메인이 정해지면 `index.html`의 `og:image`를 https 전체 주소로 바꾸고 `og:url` 추가, 영상(2.2MB·2.8MB) 압축(ffmpeg 필요), 쇼핑몰 맨 아래 '관리자 센터 로그인' 링크는 오픈 전에 숨기기.
2. ~~[36]~~ 완료 (CSV DB, 상담은 직접 연락 방식, 상품 검색·재고 ±, 꽃 사입 계획, 글씨 키움).
3. **쇼핑몰 페이지 구조 개편 (사용자 확정 계획, 2026-10-30)** — 한 화면에 창이 겹치는 구조 → 주소가 있는 페이지로 나누기
   - ~~[37] 기초 공사~~ 완료: 코드 나누기(`index.html` 약 19만 자 → 화면별 JS 파일)와 코드 정리(안 쓰는 코드·중복 함수·오류 제거), 페이지 이동 구조(`#/`, `#/flowers`, `#/flower/<id>`, `#/checkout`, `#/guide`, `#/custom` 등 해시 주소 + 뒤로 가기).
   - ~~[38] 상품 상세 페이지 + 결제 단계 페이지 + 말풍선 상담 + 최근 본 꽃·찜하기~~ 완료: `shop-product-page.js`(`#/flower/<id>`, `#/wishlist`, `#/checkout` 경로 등록), 결제 `goCheckoutStep()`, 말풍선 `shop-chat.js`(상담은 `seoldamhwa_inquiries`에 `source:"chat"`). 상세 페이지의 `#pdp-flowers` 칸은 [40]에서 `renderProductFlowers(p, box)`를 만들면 자동으로 채워짐.
     - 상세: 사진 여러 장 넘겨 보기, PC는 오른쪽 구매 칸이 따라다님, 아래에 사용한 꽃·꽃말·포장·배송·관리법·비슷한 꽃 추천. 상품 링크 카톡 공유 가능.
     - 결제: ① 장바구니 확인 → ② 받는 분·배송 → ③ 확인·결제 → 완료 (③에 나중 PG 연결).
     - 오른쪽 아래: 맨 위로 버튼 + 💬 말풍선 → 작은 상담 창(이름·연락처·내용·동의, 상세 페이지에서는 보던 상품 자동 입력, 영업 상태 표시, 카카오톡 채널 버튼은 이 안으로 합침). 기존 상담 문의·디스코드 상담 채널과 같은 곳에 저장. 실시간 채팅은 서버 연결 후.
     - 최근 본 꽃·찜하기: 로그인 없이 이 기기에 저장.
   - ~~[39] 홈 정리 + 꽃 둘러보기 페이지~~ 완료: 홈 슬라이더(`renderProducts()`→`#product-grid`, `homeProducts()`, 상품 `hideOnHome`·`homeOrder`), 상품 카드 `buildProductCard()`(shop-core.js, ♡ 포함), 맞춤 담화 띠(`#custom-cta`), 꽃 둘러보기 `shop-browse.js`(`#/flowers/<종류>`, 색·상황은 `CURATION_TAGS`/`p.curationTags` 사용). 순서: 홈 순서 → 지금 제철 → 목록 순서.
   - ~~[40] 꽃 사전 + 제철 자동 표시 + 상품 사진 여러 장 관리~~ 완료: 관리자 `admin-flowers.js`(꽃 사전 목록·추가/수정 창, 상품 창의 '사용한 꽃'·사진 갤러리 `p.images` 첫 장=대표=`p.image`), 쇼핑몰 `shop-flowers.js`(`renderProductFlowers`), CSV `flowers.csv` 추가.
   - ~~[41] 사용자 요청 정리~~ 완료: 꽃 둘러보기 거르기 = 맞춤 담화 5문항(`BROWSE_FILTERS`, 예산은 `getProductBudgetTiers`), 추천순 = 홈 순서 → 지금 제철 → 목록 순서. 꽃 사전 쇼핑몰 페이지 `shop-dictionary.js`, 관리자 탭 `panel-flowers`. 배송일은 결제 ②에서만: `getAvailableDeliveryDates()`(shop-core) + 달력 `renderDeliveryCalendar()`(shop-checkout), `#order-delivery-date`는 숨은 칸, 시간대는 `deliveryNeedsTime()`(퀵·픽업만). 관리자 상품 창은 상품 페이지 배치 + 사이즈 편집(`editProdSizes`) + `deleteProductFromModal()`.
4. **다음 로드맵 (2026-10-30 사용자가 [42]~[46] 모두 진행 요청 → 2026-11-02 모두 완료)** — 추천 순서대로. 관리자는 주로 PC·노트북에서 씀.
   - ~~[42] 화면 다듬기 묶음~~ 완료 (지도 `updateLocationSection()` in shop-settings.js, 안내 사진·영상 `page.media` + `renderPageMediaInto()` in site-pages.js, ♡ 창 `toggleWishPanel()` in shop-product-page.js)
     - 관리자 '매장 정보 및 고객센터 설정': 지금은 `panel-settings` 안의 `max-w-5xl` 때문에 넓은 화면에서 오른쪽이 빔 → 폭 제한을 풀고 2단 배치(왼쪽 연락처·운영시간, 오른쪽 공휴일·임시 휴무·배송 방법).
     - 정성 안내(특히 '전통 보자기 패키징 안내')에 사진·영상: 관리자 '사업자·안내 페이지'에서 페이지마다 사진 여러 장 + 영상 1개. **비율은 1:1 또는 4:3 중에서 고르고(사진 칸 `aspect-square` / `aspect-[4/3]`, 잘리는 부분은 가운데 기준), 휴대폰에서는 한 줄에 1장, PC는 2~3장.** 기본 영상은 `assets/videos/bokjumeoni_packaging.mp4`. 새 영상은 `assets/videos`에 넣고 주소 입력 또는 유튜브 링크(브라우저 저장소 약 5MB라 영상 직접 올리기는 서버 연결 후).
     - '설담화 아틀리에 오시는 길' 지도 정리: 지금 `#cs-section`이 `<main>` 바깥에 있어서 상품 페이지·결제·꽃 사전 등 **모든 화면 아래에 지도가 나옴**, 폭도 `max-w-4xl`이라 아래 푸터(`max-w-7xl`)와 좌우 폭이 다름. → 홈 맨 아래와 정성 안내의 '오시는 길' 탭에서만 보이게, 폭은 푸터와 같게, PC는 왼쪽 주소·찾아오는 길·운영시간·지도 앱 버튼 / 오른쪽 지도(4:3) 2단, 휴대폰은 위아래. 푸터 '정성 안내' 묶음에 '오시는 길' 링크 추가.
     - 오른쪽 아래 ♡ 버튼(말풍선 위): 누르면 작은 창에 찜한 꽃·최근 본 꽃 사진 줄, '전체 보기' → `#/wishlist`. 헤더 ♡와 같은 데이터.
   - ~~[43] 상품 30개 예시로 점검~~ 완료 (예시 상품 `SAMPLE_PRODUCTS` 30개, 홈 슬라이더 최대 `HOME_SLIDER_MAX`=12, 깨진 사진 대체는 products-data.js 끝): '예시 데이터 넣기'의 상품을 8 → 30개로. 종류 3가지, 가격대 전 구간, 사이즈 0~4개, 견적 상품, 품절·품절 임박, 비공개·예약, 아주 긴 이름, 사진 여러 장, 사진 주소가 깨진 것, 사용한 꽃·맞춤 담화 태그를 골고루. 사진은 지금 가진 7장을 돌려 쓰고 이름에 [예시]. 점검: 홈 슬라이더, 꽃 둘러보기(더 보기·거르기 조합), 상품 페이지(비슷한 꽃·최근 본 꽃), 꽃 사전 상품 링크, 맞춤 담화 결과, 관리자 상품 목록·대시보드, CSV 저장. 한 번에 지우기 유지.
   - ~~[44] DATA 폴더 CSV를 진짜 저장소로 (DB 연동 1단계)~~ 완료: `server.py`(표준 라이브러리만, `/api/csv` 읽기·`/api/sync` 바뀐 줄만 적용·`/api/backup`, DATA·.git 직접 열기 차단, 손님 기기 권한 제한), `assets/js/data-sync.js`(두 페이지 모두 csv-db.js 다음에 불러옴, 서버가 없으면 아무것도 안 함), `start-server.bat`. 서버 모드에서는 예전 폴더 자동 저장(`scheduleCsvAutoSave`)을 끔. 아래는 처음 계획:
     - 지금: 진짜 저장소는 브라우저 저장소(localStorage), CSV는 관리자가 폴더를 연결했을 때만 만드는 복사본. 브라우저마다 저장소가 따로라 손님 휴대폰에서 한 주문은 매장 컴퓨터 관리자 화면에 안 보임. 웹페이지는 손님 브라우저에서 사장님 컴퓨터 파일을 직접 못 씀 → 작은 서버 프로그램이 꼭 필요.
     - 할 일: 프로젝트에 `server.py`(파이썬, 이미 설치됨) — 사이트를 띄우고 `/api/<표 이름>`으로 DATA/*.csv를 읽고 씀(저장 전 `DATA/backup/날짜/` 자동 백업, 동시에 저장해도 안 깨지게). 쇼핑몰·관리자의 load/save 함수는 서버가 있으면 CSV, 없으면 지금처럼 브라우저 저장소. 같은 와이파이 휴대폰으로 주문 → 관리자에 바로 보이는지 확인. 개인정보가 오가므로 1단계는 매장 컴퓨터·내부망에서만.
     - 2단계(오픈 전): 같은 표 구조 그대로 실제 DB(예: Supabase/PostgreSQL) + 호스팅 + 관리자 로그인.
   - ~~[45] 오프라인 쿠폰~~ 완료: `assets/js/coupons.js`(저장·확인·할인 계산, 두 페이지 공통), 관리자 `admin-coupons.js`(`panel-coupons`, 인쇄는 qrcodejs 1.0.0 cdnjs), 결제 ③ `applyCouponCode()`(shop-checkout.js), 주문에 `couponCode`·`couponDiscount`. 서버 모드에서 손님 기기는 `/api/coupon?code=`로 한 장만 확인하고, 쿠폰을 쓴 주문이 들어오면 서버가 '사용됨' 처리(`mark_coupons_used`). 처음 계획 — [44] 다음(한 번만 쓰기를 확실히 막으려면 서버 저장소 필요)
     - 관리자 '쿠폰' 탭: 쿠폰 묶음 만들기(이름, 할인 금액 또는 %, 최소 주문 금액, 유효 기간, 장수) → 장마다 다른 코드(예: SDH-7K2P-QX) 자동 생성, A4 인쇄용 쿠폰 카드(코드 + QR, QR은 쇼핑몰 주소에 코드가 붙어 결제 때 자동 입력), 묶음별 사용 현황(몇 장 썼는지), 묶음 멈추기.
     - 손님: 결제 ③에서 코드 입력 → 할인 표시, 주문하면 '사용됨'(주문번호 기록). 주문·매출에 할인 금액 따로 기록. 쿠폰에는 손님 정보를 저장하지 않음.
   - ~~[46] 관리자 휴대폰·태블릿 화면~~ 완료: 1024px 미만은 `#admin-sidebar` 서랍 + `toggleAdminMenu()`(admin-tools-ui.js), 표는 최소 폭 760px로 옆으로 스크롤, 터치 기기는 버튼 최소 36px. 처음 계획: 왼쪽 메뉴 → 접는 메뉴, 넓은 표는 카드 목록, 주문 확인·상태 바꾸기·재고 ± 위주로 손가락으로 누르기 쉽게.
   - ~~[47] 사용자 오류·아이디어 묶음~~ 완료: 팝업은 홈에서만(`updatePopupVisibility`, 실제로 보였을 때만 '봤음' 표시), 주소 찾기는 다음 우편번호 `embed`(`#address-search-layer`), 받는 분 = 주문자 실시간 동기화, 꽃 사전 카드 사진+하얀 막(`flowerPhoto`, 꽃 사전 `image` 칸), 꽃으로 거르기 `openFlowersPageWithFlower()`(`browseState.flower`), 홈 맞춤 담화 띠 움직임 `startCtaPicker()`(shop-curation.js), 쿠폰 기간 끝 정리 `cleanupExpiredCoupons()` + 기록 `seoldamhwa_coupon_history`(coupon_history.csv) + 통계 `renderCouponStats()`.
     - 참고: 휴대폰에 팝업이 안 보인 원인은 팝업 설정이 브라우저마다 따로 저장되기 때문. `start-server.bat`으로 열면 DATA 폴더를 통해 같은 설정을 받음. 지금 저장된 팝업은 '꺼짐' 상태.
   - ~~단골·기념일~~: 손님 개인정보를 더 모으게 되어 하지 않기로 함 (2026-10-30 사용자 결정).
4-0. ~~[49] 꽃 사전 화면~~ 완료: 12폭 병풍 달 고르기(`#dict-folding-screen`, 절기 `SOLAR_TERMS`), 카드는 `hanok-card` + 꽃살 모서리 `.kkotsal`(index.html CSS). 사용자 결정: 오방색 색 거르기와 두루마리 펼침 상세는 쓰기 불편해서 하지 않음, 족자 모양·둥근 창도 쓰지 않음. [50] 카드 크기를 맞추려고 '이 꽃이 든 상품' 목록(상품 이름 버튼들)은 뺌(카드 `auto-rows-fr`, 관리 팁 두 줄). [51] '이 꽃이 든 상품 모두 보기' 버튼은 사용자 요청으로 다시 넣음 → `openFlowersPageWithFlower()`, 상품 없는 꽃은 안내 문구.
4-1. ~~[48] 전체 점검 결과 정리~~ 완료 (2026-11-02). 남은 것은 아래 "오픈 준비"의 사용자 결정 항목. 처음 정리:
   - 오류: ① 같은 상품을 여러 번 담으면 재고 초과 + 결제 직전 재고 재확인 없음 ② 손님 기기 주문은 디스코드 알림이 안 감(웹후크가 관리자 브라우저에만) → 서버가 대신 보냄 ③ 서버 모드에서 다른 기기 손님은 주문 조회 불가 → 서버에 주문번호+연락처 한 건 조회 ④ 상품 수정 창 바깥 누르면 고친 내용이 확인 없이 사라짐
   - 편의·가독성: 장바구니 새로고침 시 사라짐 → 이 기기에 저장 / '퀵 당일'인데 오늘 못 고름 → 당일 주문 마감 시각 설정 / 없는 상품·빈 장바구니 주소 → 안내 + 주소 정리 / 이야기·맞춤 담화·정성 안내 탭 제목 / 운영시간 표 입력칸 이름 / 상품 글자 안전 처리(관리자 입력) / 저장 공간이 가득 찼을 때 안내
   - 운영 편의: 새 주문 알림(소리·배지) / 서버 백업 되돌리기 버튼 / 하루 주문 마감 시각(= 당일 퀵 마감)
   - 오픈 준비: Tailwind CDN 대신 미리 만든 CSS / 다른 기기에서 관리자 쓰기용 비밀번호 로그인(서버 모드) / 영상 압축(ffmpeg 필요) / 공유 미리보기 전체 주소·실제 DB·호스팅·결제(사용자 결정 필요)
   - [48]에서 만든 것: 재고 `stockLeftFor()`·결제 직전 재확인, 장바구니 `seoldamhwa_cart`(서버·백업 제외), 상품 창 `closeProductModal(force)`·`rememberProductModalState()`, 서버 `/api/notify`(디스코드 대신 보내기, 웹후크는 `DATA/.integrations.json`), `/api/order-lookup`, `/api/backups`·`/api/restore`, `/api/login`·`/api/logout`·`/api/admin-password`(`DATA/.admin.json`, PBKDF2), 다른 기기 관리자 로그인 화면(data-sync.js `showAdminLogin`), 당일 퀵 `delivery.quick.sameDayUntil`, `showToast()`·`goHomeWithNotice()`, `htmlText()`, 저장 공간 가득 참 안내(products-data.js), 새 주문 알림(admin-orders.js 끝), Tailwind 미리 만들기(`npm run build:css`).
5. **오픈 준비(나중)**
   - 사용자 결정이 필요한 것 (2026-11-02 기준): ① 영상 압축 — ffmpeg 설치 필요(설치 허락 받으면 assets/videos 두 개를 1MB 안팎으로) ② 공유 미리보기 `og:image`·`og:url` — 도메인이 정해져야 함 ③ 실제 DB·호스팅·관리자 로그인(인터넷 공개용) — 업체 선택(예: Supabase, Cloudflare, 카페24 등) ④ 결제(PG) — 사업자 등록 후.: 서버·DB 연결(현재 load/save 함수만 교체하도록 분리돼 있음), 결제 연결, 관리자 로그인, 실제 후기 기능, 약관 전문가 검토.

## 5. 아직 사용자 확인이 필요한 것
- 꽃 사전 기본 26종의 꽃말·제철 달·관리 팁은 일반적인 정보로 채웠어요. 매장에서 실제로 들어오는 시기에 맞게 관리자 '꽃 사전'에서 고쳐 주세요. 기본 상품 4개의 '사용한 꽃'은 각 상품 '꽃말 및 상징' 칸에 적힌 꽃으로 넣었어요.
- 실제 디스코드 메시지 모양, AI 3종 실제 초안, 문자 앱 열기, PDF·운송장 실제 인쇄, 카카오 우편번호 창.
- GPT·Gemini 기본 모델명(`gpt-5`, `gemini-2.5-flash`)은 관리자에서 최신 이름으로 바꿀 수 있음.
