# 설담화 작업 이어받기 안내 (HANDOFF)

> 다음 작업자(Claude / Antigravity / 사람)가 바로 이어서 할 수 있도록 정리한 문서입니다. 마지막 업데이트: 2026-10-30 [35]

## 1. 프로젝트 한눈에
- `index.html`: 손님 쇼핑몰 / `admin-index.html`: 관리자 센터. 둘 다 Tailwind CDN + 순수 JS, 데이터는 브라우저 `localStorage`(키 `seoldamhwa_*`).
- 공용 JS (`assets/js/`)
  - `products-data.js` 상품·맞춤 담화 태그 (`DATA_VERSION`은 올리지 말 것: 올리면 저장된 상품·재고가 초기화됨)
  - `site-settings.js` 매장 설정·운영시간·공휴일·사업자·배송비(`delivery`) + `calcDeliveryFee()`
  - `i18n.js` KO/EN/JA 번역 (`t()`, `applyLanguage()`), 저장 데이터는 항상 한국어
  - `site-pages.js` 정성 안내·약관 페이지(관리자에서 수정, `renderPageBody()`는 HTML 이스케이프)
  - `popups.js` 공지 팝업 / `integrations.js` 디스코드(주문·상담 채널) / `restock.js` 재입고 알림 신청(`seoldamhwa_restock`)
  - 관리자 전용: `finance-data.js`(매출·지출·주문 도우미, `orderRecipient/orderOrderer`), `admin-tools.js`(예시 데이터·백업·AI Claude/GPT/Gemini), `image-library.js`(사진 고르기·올리기)
- 주문 데이터: `ordererName/Phone`(주문자), `recipientName/Phone`(받는 분), `customerName/phone`(예전 호환=주문자), `deliveryMethod/Fee`, `itemsTotal`, `totalAmount`(배송비 포함), `status`(preparing/packaged/delivering/completed/cancelled), `courier/trackingNumber`, `isSample`.

## 2. 작업 방식 (꼭 지키기)
1. 바꾸기 전 `git status` 확인, 끝나면 커밋 (커밋 메시지 끝에 공동 작성자 줄).
2. 변경 기록: `changelog/YYYY-MM-DD.md` 맨 위에 `## [번호] 제목 (HH:MM)` + 쉬운 한국어 3줄 이하 + `확인:` 1줄, `CHANGELOG.md` 건수 갱신. 다음 번호는 **[36]**.
3. 검증: `python -m http.server 5500`로 띄우고 브라우저에서 직접 클릭. 매번 확인할 것
   - 인라인 스크립트 문법(`node --check`), 모든 `getElementById` id 존재
   - 버튼이 부르는 함수가 모두 있는지: 콘솔에서 `[...new Set([...document.documentElement.outerHTML.matchAll(/on\w+="([A-Za-z_]\w*)\(/g)].map(m=>m[1]))].filter(n=>typeof window[n]!=='function')` → `[]` (예외: `if`)
   - 시험 데이터는 끝나면 지우기 (사용자 데이터 `localStorage.clear()` 금지)
4. 손님·관리자가 쓴 글은 화면에 넣을 때 반드시 `escapeHtml()` / `textContent`.

## 3. 사용자가 정한 방향
- DB는 지금 로컬, 서버는 나중. 결제(PG)는 사업자 등록 후. 관리자 로그인은 완성 후.
- 디스코드: 주문·상담 채널 분리, 제작 지시서는 디스코드로(인쇄 X).
- AI는 Claude·GPT·Gemini 모두 사용. 키는 관리자 브라우저에만 저장, 백업 제외.
- 가짜 후기·예시 주문은 실제처럼 보이면 안 됨 → 예시 데이터는 [예시] 표시 + 한 번에 지우기.

## 4. 남은 일 (우선순위 순)
1. ~~[35] 손님 편의~~ 완료 (재입고 알림, 공유 미리보기, 모바일 하단 구매 버튼, 사진 늦게 불러오기). 남은 것: 도메인이 정해지면 `index.html`의 `og:image`를 https 전체 주소로 바꾸고 `og:url` 추가, 영상(2.2MB·2.8MB) 압축(ffmpeg 필요), 쇼핑몰 맨 아래 '관리자 센터 로그인' 링크는 오픈 전에 숨기기.
2. **[36] 관리자 편의**: 글씨 크기(최소 13~14px)·영어 병기 정리, 상품 검색·재고 +/− 바로 조절, 꽃 사입 계획(앞으로 3일 상품별 합계), 단골·기념일 목록, 할인 쿠폰, 폰·태블릿 화면.
3. **오픈 준비(나중)**: 서버·DB 연결(현재 load/save 함수만 교체하도록 분리돼 있음), 결제 연결, 관리자 로그인, 실제 후기 기능, 약관 전문가 검토.

## 5. 아직 사용자 확인이 필요한 것
- 실제 디스코드 메시지 모양, AI 3종 실제 초안, 문자 앱 열기, PDF·운송장 실제 인쇄, 카카오 우편번호 창.
- GPT·Gemini 기본 모델명(`gpt-5`, `gemini-2.5-flash`)은 관리자에서 최신 이름으로 바꿀 수 있음.
