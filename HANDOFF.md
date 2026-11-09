# 설담화 작업 이어받기 안내 (HANDOFF)

> 다음 작업자(Claude / Antigravity / 사람)가 바로 이어서 할 수 있도록 정리한 문서입니다. 마지막 업데이트: 2026-11-09 [99]

## 1. 프로젝트 한눈에
- `index.html`: 손님 쇼핑몰 / `admin-index.html`: 관리자 센터. 둘 다 Tailwind CDN + 순수 JS, 데이터는 브라우저 `localStorage`(키 `seoldamhwa_*`).
- [37]부터 화면 코드가 파일로 나뉨: 쇼핑몰 `assets/js/shop/*.js`(core→product→product-page→checkout→nav→curation→inquiry→guide→settings→browse→flowers→dictionary→router→chat 순서로 불러옴), 관리자 `assets/js/admin/*.js`(dashboard→…→tools-ui). 일반 script라 함수는 전역 공유, **불러오는 순서를 바꾸지 말 것**.
- 쇼핑몰 주소: `shop-router.js` — `switchView(view)`는 화면+주소를 함께 바꾸고, 실제 화면 그리기는 `showView(view)`. 새 페이지는 `SHOP_ROUTES['이름'] = params => {...}` 로 등록. 지금 주소: `#/`, `#/story`, `#/custom`, `#/guide/<탭>`, `#/flowers/<종류>`, `#/dictionary`(꽃 사전), `#/flower/<id>`, `#/wishlist`, `#/checkout`, `#/reviews`(꽃 편지함). 머리글 네비 및 모바일 메뉴에 리뷰(`nav-reviews`) 버튼 지원. 1280px 이상에서는 [88]에서 로고를 중심으로 좌우 탭 간격(xl 40px, 2xl 56px)과 로고 이격 거리(xl 56px, 2xl 72px)가 완벽한 거울 대칭(`[언어] ... [좌측 3탭] 로고 [우측 3탭] ... [아이콘]`)으로 정돈되었으며, 탭 글씨 17px(600), 로고 텍스트 40px, 낙관 38px, 언어 라벨 14px, 우측 아이콘 24px로 대화면에 최적화됨.
- 손님 후기(`reviews` 표 / 꽃 편지함):
  - 배송 완료(`status === 'completed'`) 주문 손님이 주문 조회 화면에서 품목별로 작성 (`shop-checkout.js` `openReviewModal`). [94]에서 주문 조회 창(`order-lookup-modal`, z-[60]) 위에 정상 노출되도록 후기 작성 모달(`modal-review`)을 `z-[70]`, 사진 확대 모달(`modal-review-photo`)을 `z-[80]`으로 보정.
  - 사연 대상(`recipient`, 7종: `parents`, `lover`, `friend`, `celebrate`, `comfort`, `self`, `other`) 필수 선택. 누락 시 제출 불가.
  - 사장님 승인제(`pending` → `approved` / `hidden`), 작성자 이름은 일체 저장·표시하지 않음.
  - 사진(최대 3장, 브라우저에서 1000px·300KB 이하 리사이즈 후 압축, JSON 문자열이 아닌 순수 배열 저장), 영상(최대 1개, 30초·20MB 이하).
  - 미디어 주소 생성: 반드시 `reviewMediaUrl(path)` 단일 헬퍼 사용 (`/api/review-media/reviews/<file>`).
  - 미디어 업로드 엔드포인트: `POST /api/review-media` (주문번호+전화번호 검증, 하루 4회 제한, `DATA/uploads/reviews/` 저장, .gitignore 및 백업 제외).
  - 미디어 조회 엔드포인트: `GET /api/review-media/<path>` (승인된 후기에 포함된 파일만 anon 서빙, 미승인은 404 차단, 관리자는 미승인도 200 서빙).
  - 쇼핑몰 노출: 홈 슬라이더("꽃과 함께 전해진 이야기") 및 리뷰 페이지(`#/reviews`)에 정갈한 편지 카드(`buildLetterCard`) 형태로 노출. [96]에서 고정 높이(340px)를 풀고 `h-full min-h-[320px]`, 사진 고정 높이(`h-44 sm:h-48`), 고정 라인클램프를 적용하여 글·별점·사연 라벨·인장이 화면 크기와 무관하게 온전히 표시되도록 개선. 카드 높이는 슬라이더 및 행별로 모두 일치하며 우하단에 인장 도장(`seal-stamp`) 고정.
  - 편지 뷰어(`#modal-letter`): 카드 클릭 시 열리며 사연 라벨, 전체 미디어(사진 확대 연동), 명조체 본문, 사장님 답글, 이전/다음 네비게이션 지원.
  - 관리자 후기 관리: 사이드바 `tab-btn-reviews-admin`(배지 `badge-review-admin-count`), 패널 `panel-reviews-admin`(사연 라벨 뱃지 표시, 확인 대기·게시됨·숨김·전체, 승인·숨김·삭제·답글 작성, `deleteReview` 시 서버 미디어 파일 동시 삭제). 대시보드 오늘 할 일(`renderTodayTasks`) 연동.
  - 후기 즉시 전송 시에는 `DataSync.push()`를 사용하며, 식별자는 `makeId('rev')` 사용.
- 공용 JS (`assets/js/`)
  - `data-store.js` 브라우저 저장소(`localStorage`)의 유일한 읽기/쓰기 창구 (`DataStore.read/write/readRaw/writeRaw`, `KEYS`, `loadOrders()`, `saveOrders()`, `loadInquiries()`, `saveInquiries()`, `guardStorageQuota()`). 두 페이지 모두 `products-data.js`보다 먼저 불러옴. **저장소는 반드시 DataStore로만 읽고 쓰기** (추후 Supabase DB 이전 대비).
  - `flowers-data.js` 꽃 사전(`seoldamhwa_flowers`, 기본 `DEFAULT_FLOWERS` 62종, `yearRound`=연중 유통, `formatFlowerSeason()`; 기본 목록을 바꾸면 `FLOWER_DEFAULTS_VERSION`을 올리고 `upgradeSavedFlowers()`가 저장된 꽃 사전에 새 꽃만 더하고 안 고친 꽃만 갱신)·제철 계산(`isProductInSeason`, 한국 시간 달 기준). 상품의 사용한 꽃은 `p.flowers`(없으면 `DEFAULT_PRODUCT_FLOWERS` — 기본 상품의 '꽃말 및 상징' 칸에 적힌 꽃)
  - `products-data.js` 상품·맞춤 담화 태그 (`DATA_VERSION`은 올리지 말 것: 올리면 저장된 상품·재고가 초기화됨), 고유 식별자 `makeId(prefix)`, 주문번호 `makeOrderNumber()` (SDH-YYMMDD-XXXX 형태), 전화번호 검증 `isValidPhone(v)` (공백·하이픈 제외 10~11자리 또는 02 9자리). [97]에서 신규 브라우저 첫 접속 시 서버 `products.csv` 불러오기 시 `dataVersion`을 함께 기록하여 `DEFAULT_PRODUCTS`로 덮어쓰여지는 문제를 원천 차단.
  - `site-settings.js` 매장 설정·운영시간·공휴일·사업자·배송비(`delivery`) + `calcDeliveryFee()`
  - `i18n.js` KO/EN/JA 번역 (`t()`, `applyLanguage()`), 저장 데이터는 항상 한국어
  - `site-pages.js` 정성 안내·약관 페이지(관리자에서 수정, `renderPageBody()`는 HTML 이스케이프)
  - `popups.js` 공지 팝업 / `integrations.js` 디스코드(주문·상담 채널) / `restock.js` 재입고 알림 신청(`seoldamhwa_restock`)
  - `csv-db.js` CSV 데이터베이스(DATA 폴더): `CSV_TABLES`에 표 구조, 관리자 '연동·데이터'에서 폴더 연결·저장·불러오기·자동 저장. 표 설명은 `DATA/README.md`, 향후 Supabase 이전 상세 설계는 `docs/database-design.md`와 `docs/supabase-schema.sql` 참고.
  - 관리자 전용: `finance-data.js`(매출·지출·주문 도우미, `orderRecipient/orderOrderer`), `admin-tools.js`(예시 데이터·백업·AI Claude/GPT/Gemini), `image-library.js`(사진 고르기·올리기)
- 주문 데이터: `ordererName/Phone`(주문자), `recipientName/Phone`(받는 분), `customerName/phone`(예전 호환=주문자), `deliveryMethod/Fee`, `itemsTotal`, `totalAmount`(배송비 포함), `status`(preparing/packaged/delivering/completed/cancelled), `courier/trackingNumber`, `isSample`. 주문 제출 시 `orderSubmitting` 가드 플래그(`shop-checkout.js`)로 더블 클릭 중복 주문을 방지.
- 사진 및 미디어 보호:
  - [89] 쇼핑몰(`index.html`)의 모든 `img`, `video`, 모달 뷰어 우클릭 및 드래그 방지 (`assets/js/shop/shop-media-guard.js`, `-webkit-touch-callout: none`, `controlslist="nodownload"`). 관리자 화면은 정상 작동.
  - 사이트 사진 9장의 원본(낙관 없음)은 바탕화면 `C:\Users\504-19\Desktop\SeolDamHwa_originals` 폴더에 원본 해상도와 구조 그대로 보존됨.
  - 사이트 신규/교체 사진 등록 시 반드시 우측 하단에 설담화 도장(`assets/images/seal.svg`) 낙관(짧은 변의 9% 크기, 3% 여백, 50% 투명도)을 적용할 것. 관리자 이미지 라이브러리(`image-library.js`) 업로드 시 기본 '설담화 도장 넣기' 옵션을 통해 자동 합성 지원.
  - [90] 관리자 사진 업로드 시 무낙관 고화질 원본은 서버 `DATA/originals/` 폴더에 안전하게 보관됨 (`index.json`으로 상태 관리, 전체 백업 zip 제외). 관리자 센터 '연동·데이터 > 원본 사진' 탭에서 Supabase Storage(Private Bucket `originals`) 접속 정보(`DATA/.supabase.json`)를 설정하면 클라우드에 비공개 자동 백업 지원. 기존 9장 원본은 `python server.py --import-originals "C:\Users\504-19\Desktop\SeolDamHwa_originals"`로 일괄 등록 가능.
  - [91] 외부 사이트 요청 차단(CSRF 방지) 및 원본 보관소 보안 강화: `server.py`의 모든 `do_POST` 최상단에서 `is_cross_site_request()`(Sec-Fetch-Site cross-site/same-site 차단, Origin Host 불일치 및 null 차단) 검사 적용. Supabase 설정 시 URL/버킷 변경 시 서비스키 재입력 강제 및 버킷 이름 정규식 검증(`^[a-z0-9][a-z0-9._-]{1,62}$`). 원본 다운로드 `GET /api/originals/<path>` 비인가 요청 시 파일 존재 여부와 무관하게 403 즉시 반환(정보 유출 방지). 원본 업로드 시 중복 응답(409 및 400 Duplicate) 업로드 완료 처리. `--import-originals` 실행 시 `index.json` 유실 시에도 기존 디스크 파일 재인덱싱 복구 지원.
  - [92] 매장 컴퓨터 접속 주소(Host) 위조 방지 및 관리자 신뢰성 강화: `is_local()` 검사 시 접속 IP(127.0.0.1/::1)와 함께 `Host` 헤더의 호스트명이 `localhost`, `127.0.0.1`, `[::1]`(대소문자 무시, 포트 분리 파싱)인지 함께 검증. 임의 도메인을 매장 IP로 연결하는 DNS 재바인딩 공격 차단.
  - 푸터 하단에 다국어 미디어 저작권 문구(`footer_media_copyright`) 배치.
- 관리자 모바일 화면: [83]의 5개 패널 탭 분할 및 [84] 모바일 최적화로 휴대폰에서도 관리자 센터를 원활히 사용 가능 (768px 미만 테이블 자동 카드 변환, 주문 화면 카드화 및 터치 펼침, 폼 입력 폰트 16px+, 터치 타겟 40px+, 모달 375px 맞춤, LAN 접속 시 비밀번호 로그인).
- [98] 관리자 및 주문 편의 기능 강화:
  - 오늘 할 일 카드 레이아웃: 모바일 2열, sm 3열, lg 6열(`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`)로 조정하여 어떤 해상도에서도 외톨이 카드 방지.
  - 오래된 개인정보 정리: '연동·데이터 > 개인정보 정리' 탭에서 5년 경과 주문(이름·연락처·주소 등 식별정보 삭제 및 "개인정보 정리됨" 표시, 매출·품목 유지), 1년 경과 완료 상담 삭제, 종료된 재입고 신청 삭제 지원 (정리 전 서버 자동 백업 생성). 대상 데이터 존재 시에만 대시보드 알림 표시.
  - 회계용 엑셀 다운로드: 재무 패널에서 SheetJS 기반 기간별 `.xlsx` 다운로드 지원 (주문·지출·월별 합계 3개 시트, 개인 식별정보 제외, 취소 주문 제외 집계).
  - 주문 영수증 이미지 저장 및 주문번호 복사: 주문 완료 화면에서 주문번호 원클릭 복사 및 3개 국어(KO/EN/JA) 지원 한지풍 영수증 캔버스 이미지 저장(Web Share API 연동).

- [99] 정성 안내 문구 개편, 수정 가능한 포장 옵션, 자주 묻는 질문(FAQ) 페이지:
  - 배송 안내 실시간 매장 설정 연동: 퀵·택배·픽업 활성화 여부, 배송비, 무료배송 기준, 당일 마감시간 및 방문 수령 안내가 동적 플레이스홀더(`{배송방법}`, `{무료배송기준}`, `{당일마감시간}`)로 자동 반영되며 비활성 방식은 노출되지 않음. 결제 안내 및 5년 보관 후 개인정보 파기 법정 고지 명시.
  - 수정 가능한 포장 옵션(`settings.packaging`): 관리자 매장 설정 '포장' 탭에서 포장 추가/수정/삭제/순서변경/활성화 지원(최소 1개 활성 유지). 상품 상세 동적 셀렉트, 장바구니/주문서/주문완료/주문조회/관리자 주문/라벨 출력/디스코드/엑셀에 동적 포장명 및 가격 연동, 주문 제출 시 포장 가격 변동 검증 차단, 보자기 페이지 `{포장종류}` 플레이스홀더 연동.
  - 자주 묻는 질문(FAQ) 신설: `#/guide/faq`에 당일 수령, 익명 선물, 꽃 편지, 보자기 재사용 등 7가지 핵심 질문 수록. 한국어·영어·일본어 3개 국어 탭 및 푸터 링크 연동, 관리자 편집 지원.
  - 식물 관리법(화병꽂이·화분·드라이플라워) 보강 및 점주 직접 수정 안내 페이지 보존(새 기본값 덮어쓰기 방지 및 되돌리기 알림 지원).

## 2. 작업 방식 (꼭 지키기)
0. **화면 클래스(Tailwind)를 새로 쓰거나 바꾸면 꼭 `npm run build:css`** (처음 한 번은 `npm install`). 예전 CDN 대신 `assets/css/tailwind.css`를 미리 만들어 쓰므로, 다시 만들지 않으면 새 클래스는 화면에 안 먹어요. 설정은 `tailwind.config.js`, 원본은 `src/tailwind.css`. 고치는 중에는 `npm run watch:css`를 켜 두면 저장할 때마다 자동으로 만들어져요.
   - **JS·CSS 파일을 바꾸면 커밋 전에 `npm run bump`** (브라우저가 옛 파일을 섞어 쓰지 않게).
1. 바꾸기 전 `git status` 확인, 끝나면 커밋 (커밋 메시지 끝에 공동 작성자 줄).
2. 변경 기록: `changelog/YYYY-MM-DD.md` 맨 위에 `## [번호] 제목 (HH:MM)` + 쉬운 한국어 3줄 이하 + `확인:` 1줄, `CHANGELOG.md` 건수 갱신. 다음 번호는 **[100]**.
3. 검증: `python -m http.server 5500`로 띄우고 브라우저에서 직접 클릭. 서버 모드 및 손님 기기 기능은 `python server.py --port 5600 --lan`으로 임시 DATA 사본(`SDH_DATA_DIR`)을 사용하고, 모의 API 호출 대신 실제 LAN IP 주소와 실기기/CDP 브라우저 조작(버튼 클릭, 폼 전송)으로 검증할 것. 매번 확인할 것
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
1. ~~[35] 손님 편의~~ 완료 (재입고 알림, 공유 미리보기, 모바일 하단 구매 버튼, 사진 늦게 불러오기). 남은 것: 도메인이 정해지면 `index.html`의 `og:image`를 https 전체 주소로 바꾸고 `og:url` 추가, 영상은 파일이 충분히 작아서 압축하지 않기로 함 (2026-11-05 사용자 결정), ~~쇼핑몰 맨 아래 '관리자 센터 로그인' 링크는 오픈 전에 숨기기~~ 완료 ([95] 기존 링크 제거 후 [96]에서 푸터 저작권 문구 끝에 은은한 '관리자' 링크 재배치 및 noindex 메타 태그 적용, 주소 직접 입력 접속도 유지).
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
4-000. ~~[56]·[57] 사용자 아이디어 (2026-11-02)~~ 완료:
   - 상품 종류 7가지: `PRODUCT_CATEGORIES`·`categoryLabel()`(products-data.js) 한 곳에서 정의 → 꽃 둘러보기 탭 `BROWSE_CATEGORIES`, 홈 종류 버튼 `renderCategoryPills()`(shop-core.js, `#home-category-pills`), 관리자 `edit-prod-cat`, 상품 페이지 표시. id: bouquet·basket·vase·dried·space·plant·goods.
   - 굿즈(`goods`): `productFlowerIds()`가 빈 목록 → 제철·꽃 이야기 없음. 결제는 장바구니가 모두 굿즈면 택배만(`checkoutAllGoods`, 택배가 꺼져 있으면 원래 방법 유지). 사용자 매장 설정은 지금 '퀵'만 켜져 있음.
   - 예시 상품 41개(admin-tools.js, 굿즈 4·드라이 4·화분 4·화병 4 포함).
   - 맞춤 담화 띠 `#custom-cta`: 한지 카드형(한지 바탕 + 인주색 테두리 + `.kkotsal` 모서리), 움직이는 꽃 고르기는 그대로.
   - 상품 페이지: 설명 + 쓰인 꽃 칩(`renderProductFlowers`) → '꽃별 관리 안내' 접기 목록 `buildFlowerGuideSection()`(shop-flowers.js, `#pdp-guide-<꽃id>`). 꽃 사전 새 칸 `guideText`·`guideImages`·`guideVideo`(flowers.csv에 추가), 관리자 꽃 사전 창에서 입력. 순서 = 상품 `flowers` 순서, 관리자 상품 창 `#edit-prod-flowers-order` ↑↓(`editProdFlowerOrder`).
   - [58] 관리자 상품 종류 거르기 `currentProductCategory`·`renderProductCategoryFilter()`(`#prod-cat-filter`). 맞춤 담화 띠는 왼쪽 글+버튼 / 오른쪽 꽃(이미지 w-16~w-24). `#curation-stepper-card`에 `.kkotsal`, 추천 결과 카드에 `corner-*`. 한글 줄바꿈 `word-break: keep-all`(src/tailwind.css base, `html:not([lang="ja"])`) + `text-wrap: pretty`.
   - [60] 맞춤 담화 띠: 글 `md:w-1/2` / 꽃 `md:w-1/2`, 이미지 `aspect-square` + 폭(w-16~xl:w-32, 좁으면 줄어듦). 모서리 무늬(`.kkotsal`, `.corner-*`)는 `margin:0 !important`(space-y 칸 띄우기 때문에 어긋났음), 맞춤 담화 두 카드는 모서리를 카드 맨 끝에 두고 둘 다 `.kkotsal`.
   - [61] 모서리 무늬: `.kkotsal.{tl,tr,bl,br}` + `mk-ajasal|cloud|gyeop|maedeup|ttisal|lotus`(index.html CSS, 데이터 URI). JS는 `addCornerMarks(el, mk, which)`(shop-core.js). 머리글 C: `.nav-btn` 15px, 활성 탭(`border-b-2`)은 밑줄 대신 `::after` 무늬(`#nav-*`별). 구름은 사용자가 C안(ㄱ자+말린 끝) 선택.
   - [62] 관리자 왼쪽 메뉴 모양은 CSS `.sidebar-btn`/`.is-active`/`.sidebar-group`(admin-index.html) 한 곳에서. `switchAdminTab()`은 `is-active`·`aria-current`만 바꿈. 표 공통: 머리줄 색·줄 hover·`min-width: 860px`(옆으로 밀어 보기).
4-00. ~~[59] 디자인 추천 10~13번~~ 완료: ⑩ 휴대폰 `#fab-group`(♡·💬) + `#fab-toggle-btn` / `toggleFabGroup()`(shop-nav.js), 찜 수는 `#fab-toggle-badge` ⑪ 머리글 언어 선택 `hidden sm:block` ⑫ 대시보드 '오늘 할 일' `renderTodayTasks()`·`goTodayTask()`(admin-dashboard.js, `#today-tasks`) ⑬ 왼쪽 메뉴 소제목(판매·주문·상담·매출·매장·연동). 8번 버튼 정리는 하지 않기로 함. 6번(홈 포장 소개)은 원래대로 — 복주머니는 차별점.
4-0. ~~[49] 꽃 사전 화면~~ 완료: 12폭 병풍 달 고르기(`#dict-folding-screen`, 절기 `SOLAR_TERMS`, 사계절 색 `SEASON_TONES` — 사용자가 4가지로 줄이길 원함), 카드는 `hanok-card` + 꽃살 모서리 `.kkotsal`(index.html CSS). 사용자 결정: 오방색 색 거르기와 두루마리 펼침 상세는 쓰기 불편해서 하지 않음, 족자 모양·둥근 창도 쓰지 않음. [50] 카드 크기를 맞추려고 '이 꽃이 든 상품' 목록(상품 이름 버튼들)은 뺌(카드 `auto-rows-fr`, 관리 팁 두 줄). [51] '이 꽃이 든 상품 모두 보기' 버튼은 사용자 요청으로 다시 넣음 → `openFlowersPageWithFlower()`, 상품 없는 꽃은 안내 문구.
4-1. ~~[48] 전체 점검 결과 정리~~ 완료 (2026-11-02). 남은 것은 아래 "오픈 준비"의 사용자 결정 항목. 처음 정리:
   - 오류: ① 같은 상품을 여러 번 담으면 재고 초과 + 결제 직전 재고 재확인 없음 ② 손님 기기 주문은 디스코드 알림이 안 감(웹후크가 관리자 브라우저에만) → 서버가 대신 보냄 ③ 서버 모드에서 다른 기기 손님은 주문 조회 불가 → 서버에 주문번호+연락처 한 건 조회 ④ 상품 수정 창 바깥 누르면 고친 내용이 확인 없이 사라짐
   - 편의·가독성: 장바구니 새로고침 시 사라짐 → 이 기기에 저장 / '퀵 당일'인데 오늘 못 고름 → 당일 주문 마감 시각 설정 / 없는 상품·빈 장바구니 주소 → 안내 + 주소 정리 / 이야기·맞춤 담화·정성 안내 탭 제목 / 운영시간 표 입력칸 이름 / 상품 글자 안전 처리(관리자 입력) / 저장 공간이 가득 찼을 때 안내
   - 운영 편의: 새 주문 알림(소리·배지) / 서버 백업 되돌리기 버튼 / 하루 주문 마감 시각(= 당일 퀵 마감)
   - 오픈 준비: Tailwind CDN 대신 미리 만든 CSS / 다른 기기에서 관리자 쓰기용 비밀번호 로그인(서버 모드) / 영상 압축(ffmpeg 필요) / 공유 미리보기 전체 주소·실제 DB·호스팅·결제(사용자 결정 필요)
   - [48]에서 만든 것: 재고 `stockLeftFor()`·결제 직전 재확인, 장바구니 `seoldamhwa_cart`(서버·백업 제외), 상품 창 `closeProductModal(force)`·`rememberProductModalState()`, 서버 `/api/notify`(디스코드 대신 보내기, 웹후크는 `DATA/.integrations.json`), `/api/order-lookup`, `/api/backups`·`/api/restore`, `/api/login`·`/api/logout`·`/api/admin-password`(`DATA/.admin.json`, PBKDF2), 다른 기기 관리자 로그인 화면(data-sync.js `showAdminLogin`), 당일 퀵 `delivery.quick.sameDayUntil`, `showToast()`·`goHomeWithNotice()`, `htmlText()`, 저장 공간 가득 참 안내(products-data.js), 새 주문 알림(admin-orders.js 끝), Tailwind 미리 만들기(`npm run build:css`).
4-2. ~~[70] 손님 후기 시스템~~ 완료 (2026-11-03): 주문 조회 연동 후기 작성, 사장님 승인제, 사진(1000px·300KB)·영상(30초·20MB) 업로드(`POST /api/review-media`), 미승인 미디어 anon 차단, `#/reviews` 리뷰 탭 및 홈 슬라이더, 사장님 답글, 관리자 `tab-btn-reviews-admin`·`panel-reviews-admin` 및 대시보드 오늘 할 일 연동, 이름 미저장 원칙 준수.
   - ~~[71] 손님 후기 고장 수정 (서버 모드 접수·사진 보기·홈 슬라이드)~~ 완료 (2026-11-04): 사진 배열 이중 인코딩 버그 해결, `DataSync.push()` 적용, `reviewMediaUrl(path)` 일원화, `self.is_admin()` 및 video 경로 정규식 검증, 일본어 다국어 번역 수정, Chrome CDP 기반 18단계 실제 화면 테스트(LAN IP, 주문조회, 2장 사진+1개 영상 업로드, 승인/노출/숨기기, 중복 차단, 텍스트 전용 후기, 관리자 삭제, 보안 경로 탈출 차단, 5601 정적 모드, 375px 모바일 뷰포트, 인라인 핸들러 검사, 콘솔 오류 0건) 100% 통과.
   - ~~[72] 후기 시각 바로잡기·사진 불러오기 개선·README 정리~~ 완료 (2026-11-04): 후기 시각/날짜 표시를 한국 표준시(Asia/Seoul)로 변환하는 `formatKoreaTime` 헬퍼 적용(관리자 12:09 및 자정 날짜 검증), 홈 후기 슬라이더 화살표 여백(`md:px-12`) 확보로 1024px/1680px/모바일 텍스트 가림 해결, 화면 밖 이미지 지연 로딩(`loading="lazy" decoding="async"`) 보강, 오늘날 실제 시스템 구조에 맞게 `README.md` 전면 재작성.
   - ~~[73] 쿠폰 할인율 상한 90%로 되돌림~~ 완료 (2026-11-04): 주문 무료화 방지를 위해 관리자 쿠폰 생성(`createCouponBatch`) 시 비율 할인율 상한을 90%로 되돌리고 안내 문구 갱신 (95% 입력 시 '할인율은 1~90% 사이로 적어 주세요.' 거부 및 90% 정상 발행 검증 통과).
   - ~~[74] README 실행 방법 바로잡기~~ 완료 (2026-11-04): start-server.bat의 기본 실행(포트 5500, 이 컴퓨터 전용)과 휴대폰 연동(`python server.py --lan`) 차이점을 명확히 하고, 10분 주기/최신 40개 보관 자동 백업 및 uploads 폴더 제외 규칙을 README.md에 정확히 반영.
   - ~~[75] 개인정보처리방침 보완·전체 백업 내려받기~~ 완료 (2026-11-04): 개인정보처리방침에 재입고 알림 신청, 후기 수집·보관(작성자 이름 미표시, 얼굴·개인정보 주의), 디스코드 전달 항목(주문자/받는분 성함, 카드 메시지 전달 / 연락처·상세주소 미전달) 및 후기 삭제/숨김 요청 권리를 보완. 서버 모드에서 모든 CSV 표와 후기 미디어를 압축하는 `GET /api/full-backup` 및 관리자 '연동·데이터' 탭 다운로드 버튼, 7일 경과 시 대시보드 알림을 구현.
   - ~~[76] 날짜별 주문 상한~~ 완료 (2026-11-04): 매장 설정에 기본 하루 주문 상한(`dailyLimit`, 0=무제한) 및 특정일 상한(`dateLimits`) 추가. 유효 주문(취소·예시 제외) 기반 마감 판정(`GET /api/full-dates`), 쇼핑몰 달력 마감일 비활성화/취소선 표시 및 14일 수집 보장, 주문 직전 마감 재확인, 서버 및 DB 트랜잭션(`submit_order_transaction`) 마감일 주문 거부 구현.
   - ~~[77] 후기 요청 및 화면 표시 개선~~ 완료 (2026-11-04): 매장 설정에 쇼핑몰 주소(`settings.shopUrl`) 추가, 관리자 주문 목록에 배송 출발 안내 및 후기 요청 문자 발송 패널 추가(문구 복사, `sms:` 링크, 수신자는 주문자 전화번호, 후기 링크는 shopUrl + `#/review/<orderNumber>`, 발송 시 `reviewRequestedAt` 기록 및 '후기 요청 보냄' 표시), 쇼핑몰 `#/review/<orderNumber>` 라우트(주문 조회 모달 자동 오픈 및 번호 채움), 5대 택배사 공식 배송조회 링크 연동, 홈 후기 카드 첫 사진 4:3 표시, 상품 사진 확대 뷰어(이전/다음, Esc/✕ 닫기, 핀치 줌, 1280px/375px 반응형), 히어로 영상 포스터(`assets/images/hero-poster.jpg`, 76.1KB < 200KB) 및 `prefers-reduced-motion` 대응.
   - ~~[93] 꽃 편지 실제 디자인을 보여주는 예시 후기 10건 개편~~ 완료 (2026-11-05): `admin-tools.js`의 옛 6건 예시 후기를 10건(부모님·연인·친구·축하·위로·나에게·기타 등 7개 사연 대상, 1~3장 사진/영상, 단문/중문/장문, 사장님 답글 5건, 4~5점 평점, 10번은 승인 대기)의 고품질 꽃 편지 샘플로 전면 개편. `shop-core.js`에 `shopVisibleReviews()` 헬퍼를 추가하여 승인 및 예시 노출 상태(또는 미리보기 모드)를 일관되게 검사하도록 홈 슬라이더/리뷰 페이지 등 5곳의 필터링을 통합. 관리자 연동 패널에서 예시 후기 10건 카운트 및 '예시 데이터 모두 지우기' 시 후기와 재입고 신청까지 완벽히 제거되도록 정리.
5. **오픈 준비(나중)**
   - 사용자 결정이 필요한 것 (2026-11-02 기준): ① 영상 압축 — 영상은 파일이 충분히 작아서 압축하지 않기로 함 (2026-11-05 사용자 결정) ② 공유 미리보기 `og:image`·`og:url` — 도메인이 정해져야 함 ③ 실제 DB·호스팅·관리자 로그인(인터넷 공개용) — 업체 선택(예: Supabase, Cloudflare, 카페24 등) ④ 결제(PG) — 사업자 등록 후.: 서버·DB 연결(현재 load/save 함수만 교체하도록 분리돼 있음), 결제 연결, 관리자 로그인, 실제 후기 기능, 약관 및 개인정보처리방침 전문가 검토.

## 5. 아직 사용자 확인이 필요한 것
- 꽃 사전 기본 62종: 사용자가 준 표(2026-11-02, 35종)의 꽃말·색·제철을 그대로 썼고, 나머지(동백·매화·목련·연꽃·코스모스·국화 + 꽃집에서 자주 쓰는 21종)와 관리 팁은 일반적인 정보로 채웠어요. 매장에서 실제로 들어오는 시기에 맞게 관리자 '꽃 사전'에서 고쳐 주세요. 기본 상품 4개의 '사용한 꽃'은 각 상품 '꽃말 및 상징' 칸에 적힌 꽃으로 넣었어요.
- 실제 디스코드 메시지 모양, AI 3종 실제 초안, 문자 앱 열기, PDF·운송장 실제 인쇄, 카카오 우편번호 창.
- GPT·Gemini 기본 모델명(`gpt-5`, `gemini-2.5-flash`)은 관리자에서 최신 이름으로 바꿀 수 있음.
