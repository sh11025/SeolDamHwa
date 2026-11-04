# 설담화 (說談花)

현대적 한국 전통(Modern Oriental / 힙 트래디셔널) 꽃 셀렉트샵 **설담화(說談花)** 웹 애플리케이션입니다.  
손님을 위한 온라인 쇼핑몰과 사장님을 위한 관리자 센터로 구성되어 있으며, 로컬 환경에서 간편하게 실행하고 매장 내부망(Wi-Fi)을 통해 여러 기기에서 실시간으로 함께 사용할 수 있습니다.

---

## 1. 프로젝트 소개

- **손님 쇼핑몰 (`index.html`)**
  - 감각적인 비움의 미학, 한옥 창살 프레임과 꽃살 무늬가 어우러진 꽃 상품 둘러보기
  - 상황과 대상에 맞는 꽃을 추천해 주는 '맞춤 담화'
  - 한국의 사계절 24절기와 꽃말을 담은 '꽃 사전' (62종)
  - 배송 방법(퀵 당일, 택배, 매장 픽업) 및 희망 배송일·시간대 지정 주문
  - 1:1 빠른 상담 문의 및 실시간 영업 상태 안내
  - 배송 완료 주문 손님의 후기 작성(별점, 후기글, 사진 최대 3장, 영상 1개) 및 쇼핑몰 후기 목록/홈 후기 슬라이더

- **사장님 관리자 센터 (`admin-index.html`)**
  - 대시보드 실시간 주문/매출 현황 및 오늘 할 일 안내
  - 주문 접수·배송 상태 관리 및 운송장 번호 입력
  - 꽃 상품 등록·수정, 품절 처리 및 실시간 재고 관리
  - 손님 후기 검수(게시 승인, 숨김, 삭제) 및 사장님 정성 답글 등록
  - 오프라인 인쇄용 QR 쿠폰 발행 및 사용 통계 관리
  - 꽃 사전 편집, 매장 운영시간·배송비·공휴일 및 안내 페이지 관리

---

## 2. 실행 방법

설담화는 매장 환경에 맞춰 두 가지 방식으로 실행할 수 있습니다.

### 방법 A: 서버 모드 (권장 — 매장 운영 및 다기기 연동)
매장 컴퓨터에서 `start-server.bat`을 더블 클릭하여 실행합니다. (또는 터미널에서 `python server.py --port 5600 --lan` 실행)

- **동작 특징:**
  - 파이썬 내장 라이브러리로 동작하는 로컬 API 서버(`server.py`)가 구동됩니다.
  - 매장 컴퓨터(`localhost:5600`)의 관리자 센터와 같은 와이파이(LAN IP)에 연결된 손님 스마트폰(`http://192.168.x.x:5600`) 사이에 데이터가 실시간으로 동기화됩니다.
  - 손님이 실제 사진(300KB 이하)과 동영상(20MB 이하) 후기를 업로드할 수 있으며, 서버의 `DATA/uploads/reviews/` 폴더에 안전하게 보관됩니다.
  - 손님 기기의 새 주문 접수 시 디스코드 알림이 자동으로 전송되고, 쿠폰 사용 시 즉시 사용 완료 처리됩니다.
  - 사장님이 승인한 후기의 사진·영상만 외부에 안전하게 공개(anon 200)되며, 승인되지 않은 미디어는 외부 접근이 철저히 차단(HTTP 404)됩니다.
  - 데이터 변경 시 `DATA/backup/` 폴더에 자동으로 안전 백업이 생성됩니다.

### 방법 B: 정적 서빙 모드 (단순 화면 확인)
터미널에서 `python -m http.server 5500` 등을 실행하여 브라우저로 접속합니다.

- **동작 특징:**
  - 별도 백엔드 서버 없이 브라우저 자체 기능만으로 동작합니다.
  - 모든 데이터는 접속한 브라우저의 `localStorage`에만 저장되며 기기 간 자동 동기화는 되지 않습니다.
  - 사진·영상 업로드 기능은 비활성화되며, 후기 작성 창에 "사진·영상은 매장 서버로 열었을 때 올릴 수 있어요"라는 친절한 오프라인 안내가 표시됩니다.

---

## 3. 주요 폴더 구조

```text
SeolDamHwa/
├── index.html                      # 손님용 쇼핑몰 메인 페이지
├── admin-index.html                # 사장님 관리자 센터 메인 페이지
├── server.py                       # 로컬 CSV 데이터베이스 및 미디어 API 서버
├── start-server.bat                # 서버 원클릭 실행 배치 파일
├── assets/
│   ├── css/
│   │   └── tailwind.css            # 사전 빌드된 Tailwind CSS 파일
│   ├── js/                         # 공용 자바스크립트 모듈
│   │   ├── data-store.js           # 브라우저 스토리지(DataStore) 유일 입출력 창구
│   │   ├── products-data.js        # 상품 기본 데이터 및 식별자/연락처 헬퍼
│   │   ├── flowers-data.js         # 꽃 사전 62종 기본 데이터 및 제철 판정 헬퍼
│   │   ├── site-settings.js        # 매장 운영시간, 배송비 및 한국 시간(KST) 헬퍼
│   │   ├── csv-db.js               # CSV 표 구조(CSV_TABLES) 및 파서/변환기
│   │   ├── data-sync.js            # 서버 모드 양방향 실시간 동기화 모듈
│   │   ├── coupons.js              # 할인 쿠폰 유효성 검증 및 계산 모듈
│   │   ├── i18n.js                 # 한국어/영어/일본어 다국어 번역 사전
│   │   ├── shop/                   # 쇼핑몰 전용 모듈 (코어, 결제, 꽃사전, 라우터 등)
│   │   └── admin/                  # 관리자 센터 전용 모듈 (대시보드, 주문, 상품 등)
│   └── images/                     # 로고, 전통 보자기, 꽃 사전 기본 이미지
├── DATA/                           # CSV 데이터베이스 저장 폴더 (실운영 데이터)
│   ├── products.csv                # 상품 목록 (공개)
│   ├── flowers.csv                 # 꽃 사전 목록 (공개)
│   ├── orders.csv                  # 주문 내역 (개인정보 보호, Git 제외)
│   ├── order_items.csv             # 주문 품목 상세 (개인정보 보호, Git 제외)
│   ├── reviews.csv                 # 손님 후기 내역 (Git 제외)
│   └── uploads/                    # 손님 업로드 후기 사진·영상 (Git 제외)
├── docs/
│   ├── database-design.md          # 향후 인터넷 DB(Supabase) 이전을 위한 상세 설계서
│   └── supabase-schema.sql         # Supabase PostgreSQL DDL 및 보안 RLS 스키마
└── changelog/                      # 일자별 변경 기록 문서
```

---

## 4. 데이터 저장 위치

1. **브라우저 저장소 (`DataStore`)**
   - 모든 화면 컴포넌트는 `assets/js/data-store.js`의 `DataStore` 객체를 통해서만 데이터를 읽고 씁니다.
   - 키 접두사: `seoldamhwa_*` (`seoldamhwa_products`, `seoldamhwa_orders`, `seoldamhwa_reviews` 등)
2. **DATA 폴더 CSV 파일**
   - 서버 모드 실행 시 `DATA/*.csv` 파일로 디스크에 저장되며, 브라우저와 실시간으로 동기화됩니다.
   - 데이터 구조는 향후 PostgreSQL/Supabase 테이블로 1:1 이관될 수 있도록 표준 규격으로 설계되었습니다.
3. **후기 미디어 파일**
   - 손님이 후기 등록 시 첨부한 최적화 사진(JPEG)과 동영상(MP4/WebM/MOV)은 `DATA/uploads/reviews/`에 저장됩니다.

---

## 5. Git에 절대 올리지 않는 항목 (.gitignore)

손님의 개인정보와 매장 보안을 위해 다음 항목은 Git 저장소에 절대 포함되지 않습니다:

- **손님 개인정보 및 주문 내역:** `DATA/orders.csv`, `DATA/order_items.csv`, `DATA/inquiries.csv`, `DATA/restock.csv`
- **지출 및 후기 데이터:** `DATA/expenses.csv`, `DATA/reviews.csv`
- **손님 첨부 미디어:** `DATA/uploads/`
- **쿠폰 정보:** `DATA/coupons.csv`, `DATA/coupon_history.csv`
- **보안 설정 파일:** `DATA/.integrations.json` (디스코드 웹후크), `DATA/.admin.json` (관리자 비밀번호 해시)
- **서버 백업 및 임시 파일:** `DATA/backup/`, `DATA/*.tmp`, `DATA_TEST*/`
- **프롬프트 및 압축 파일:** `prompts/`, `*.zip`

---

## 6. 개발 및 유지보수 명령어

CSS 클래스를 추가하거나 자바스크립트를 수정한 경우 아래 명령어를 사용합니다:

- **Tailwind CSS 빌드:**
  ```bash
  npm run build:css
  ```
  `src/tailwind.css`와 `tailwind.config.js`를 바탕으로 `assets/css/tailwind.css`를 생성 및 최적화합니다. 작업 중 실시간 감지는 `npm run watch:css`를 사용합니다.

- **브라우저 캐시 방지 버전 판올림:**
  ```bash
  npm run bump
  ```
  HTML 파일 내에 연결된 스크립트와 스타일시트의 버전 쿼리스트링(`?v=XX`)을 한 번에 올려, 손님과 사장님의 브라우저가 옛 캐시 파일과 새 파일을 섞어 쓰는 문제를 방지합니다.

---

## 7. 관련 문서 링크

- **[HANDOFF.md](HANDOFF.md)** : 개발 히스토리, 설계 원칙, 작업 규칙 및 다음 할 일 안내
- **[docs/database-design.md](docs/database-design.md)** : Supabase / PostgreSQL 인터넷 데이터베이스 이전 상세 설계서
- **[docs/supabase-schema.sql](docs/supabase-schema.sql)** : RLS 보안 정책 및 트랜잭션 함수가 포함된 SQL 스키마
- **[CHANGELOG.md](CHANGELOG.md)** 및 **[changelog/](changelog/)** : 전체 버전별 상세 변경 기록
