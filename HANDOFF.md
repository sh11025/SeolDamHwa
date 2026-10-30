# 설담화 작업 이어받기 안내 (HANDOFF)

> 다음 작업자(Claude / Antigravity / 사람)가 바로 이어서 할 수 있도록 정리한 문서입니다. 마지막 업데이트: 2026-10-30 [40]

## 1. 프로젝트 한눈에
- `index.html`: 손님 쇼핑몰 / `admin-index.html`: 관리자 센터. 둘 다 Tailwind CDN + 순수 JS, 데이터는 브라우저 `localStorage`(키 `seoldamhwa_*`).
- [37]부터 화면 코드가 파일로 나뉨: 쇼핑몰 `assets/js/shop/*.js`(core→product→product-page→checkout→nav→curation→inquiry→guide→settings→browse→flowers→router→chat 순서로 불러옴), 관리자 `assets/js/admin/*.js`(dashboard→…→tools-ui). 일반 script라 함수는 전역 공유, **불러오는 순서를 바꾸지 말 것**.
- 쇼핑몰 주소: `shop-router.js` — `switchView(view)`는 화면+주소를 함께 바꾸고, 실제 화면 그리기는 `showView(view)`. 새 페이지는 `SHOP_ROUTES['이름'] = params => {...}` 로 등록. 지금 주소: `#/`, `#/story`, `#/custom`, `#/guide/<탭>`, `#/flowers/<종류>`, `#/flower/<id>`, `#/wishlist`, `#/checkout`.
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
1. 바꾸기 전 `git status` 확인, 끝나면 커밋 (커밋 메시지 끝에 공동 작성자 줄).
2. 변경 기록: `changelog/YYYY-MM-DD.md` 맨 위에 `## [번호] 제목 (HH:MM)` + 쉬운 한국어 3줄 이하 + `확인:` 1줄, `CHANGELOG.md` 건수 갱신. 다음 번호는 **[41]**.
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
4. **그다음 관리자 편의**: 단골·기념일 목록, 할인 쿠폰, 관리자 폰·태블릿 화면.
5. **오픈 준비(나중)**: 서버·DB 연결(현재 load/save 함수만 교체하도록 분리돼 있음), 결제 연결, 관리자 로그인, 실제 후기 기능, 약관 전문가 검토.

## 5. 아직 사용자 확인이 필요한 것
- 꽃 사전 기본 26종의 꽃말·제철 달·관리 팁은 일반적인 정보로 채웠어요. 매장에서 실제로 들어오는 시기에 맞게 관리자 '꽃 사전'에서 고쳐 주세요. 기본 상품 4개의 '사용한 꽃'은 각 상품 '꽃말 및 상징' 칸에 적힌 꽃으로 넣었어요.
- 실제 디스코드 메시지 모양, AI 3종 실제 초안, 문자 앱 열기, PDF·운송장 실제 인쇄, 카카오 우편번호 창.
- GPT·Gemini 기본 모델명(`gpt-5`, `gemini-2.5-flash`)은 관리자에서 최신 이름으로 바꿀 수 있음.
