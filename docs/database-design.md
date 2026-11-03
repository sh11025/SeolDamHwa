# 설담화(說談花) 데이터베이스 설계서 (Supabase / PostgreSQL)

> 이 문서는 설담화 쇼핑몰의 데이터를 파일(CSV)과 웹 브라우저에서 인터넷 데이터베이스(Supabase PostgreSQL)로 옮길 때 사용하는 공식 설계서입니다.
> 현재 운영 중인 `assets/js/csv-db.js`의 13개 표 구조와 새로 추가될 1개 표(후기)의 실제 데이터 형태를 빠짐없이 담았습니다.

---

## 1. 사장님을 위한 데이터 안내 (쉬운 설명)

설담화의 모든 정보는 앞으로 안전한 온라인 금고(데이터베이스)에 표 형태로 가지런히 보관됩니다.

- **어떤 표들이 있나요?**  
  꽃 상품 목록(`products`), 손님이 주문한 내역(`orders`), 주문 속 세부 상품들(`order_items`), 꽃집 운영에 쓴 지출(`expenses`), 1:1 맞춤 상담 신청(`inquiries`), 품절 꽃 재입고 알림 신청(`restock`), 홈페이지 공지 팝업(`popups`), 정성 안내·이용약관 글(`pages`), 영업시간·가게 주소 등 매장 설정(`settings`), 계절별 꽃 정보가 담긴 꽃 사전(`flowers`), 손님에게 드리는 할인 쿠폰(`coupons`), 지난 쿠폰 발행 내역(`coupon_history`), 등록된 사진 정보(`images`), 그리고 손님이 남겨주실 꽃 후기(`reviews`)까지 총 14개 표로 이루어집니다.

- **손님의 개인정보는 어디에 들어가나요?**  
  손님의 소중한 이름·전화번호·배송지 주소는 **주문(`orders`)**, **1:1 상담(`inquiries`)**, **재입고 알림(`restock`)** 단 3곳에만 저장됩니다. 나머지 표에는 개인정보가 일절 들어가지 않습니다.

- **누가 보고 고칠 수 있나요? (3단계 보안)**  
  1. **손님(방문자)**: 꽃 상품·꽃 사전·안내 글·공지 팝업은 누구나 자유롭게 볼 수 있습니다. 주문서 작성·1:1 상담 신청·재입고 알림 신청은 손님이 '새로 등록'만 할 수 있고, 남의 정보는 절대 볼 수 없습니다. (본인 주문은 주문번호와 연락처가 정확히 맞을 때만 조회가 가능합니다.)  
  2. **사장님(관리자 로그인)**: 모든 표의 데이터를 열람하고 수정할 수 있으며, 지출 내역이나 전체 주문 관리, 팝업 및 상품 수정 등 가게 운영에 필요한 모든 권한을 갖습니다.  
  3. **아무도 못 건드리는 것**: 쿠폰 할인 금액 계산이나 지난 주문 번호 같은 핵심 기록은 외부에서 임의로 조작하거나 변조할 수 없도록 시스템이 자동으로 엄격하게 잠급니다.

---

## 2. 식별자(ID) 및 고유 번호 규칙

1. **기존 데이터 식별자 (호환성 유지)**  
   - 상품 ID는 예전부터 사용해 온 영문 단어(`bohemian-autumn`, `snow-white` 등)를 그대로 유지합니다.
   - 기존 주문 ID(`ord-1730000000000`)나 사진 ID(`img-1730000000000`) 등도 변경 없이 그대로 들어갑니다.
   - 따라서 데이터베이스의 모든 ID 컬럼은 숫자가 아닌 **`text` 타입**을 사용하며, 이전 과정에서 이름을 바꾸지 않습니다.

2. **신규 생성 식별자**  
   - 새로 생성되는 레코드는 `makeId(prefix)`를 통해 접두사와 고유값이 결합된 형태(`ord-xxxx`, `inq-xxxx`, `exp-xxxx` 등)로 생성됩니다.

3. **손님용 주문번호 (`orderNumber`)**  
   - 내부 관리용 식별자(`id`)와 별개로, 손님이 조회하거나 사장님이 송장에 적는 주문번호는 **`SDH-YYMMDD-XXXX`** 형태(날짜와 영문·숫자 조합)를 유지합니다.
   - 이 번호는 테이블 전체에서 유일해야 하므로 고유값(`UNIQUE`) 제약 조건을 갖습니다.

---

## 3. 테이블 간 관계도 (텍스트 다이어그램)

```text
[ flowers ] (꽃 사전)
     ▲
     │ (products.flowers JSON 배열 내 ID 참조)
     │
[ products ] (상품) ───┬───< [ restock ] (재입고 신청: productId)
     ▲                 │
     │                 └───< [ reviews ] (상품 후기: productId)
     │                             ▲
     │ (order_items.productId)     │ (reviews.orderId)
     │                             │
[ order_items ] >───── [ orders ] ─┴─── (쿠폰 코드 조회) ───> [ coupons ]
 (주문 상품 목록)         (주문서)                                    ▲
                                                                     │ (batchId 묶음 연결)
                                                                     │
                                                             [ coupon_history ]
```

- **상품과 주문**: 하나의 주문(`orders`)에는 여러 개의 주문 상품(`order_items`)이 연결됩니다. (`1 : N`)
- **상품과 재입고 알림**: 하나의 상품(`products`)에 여러 명의 손님이 재입고 알림(`restock`)을 신청할 수 있습니다. (`1 : N`)
- **상품과 꽃 사전**: 상품의 `flowers` 컬럼에 꽃 사전(`flowers`)의 `id`들이 배열로 기록됩니다.
- **주문과 쿠폰**: 주문 시 사용된 쿠폰 코드는 `orders.couponCode`에 기록되며, 해당 쿠폰은 `coupons.usedAt`과 `coupons.orderNumber`로 사용 처리됩니다.
- **쿠폰과 쿠폰 이력**: 오프라인 배포 묶음(`coupons.batchId`)은 `coupon_history`에서 일괄 통계로 관리됩니다.
- **주문과 후기**: 배송 또는 수령이 완료(`status = 'completed'`)된 주문에 한하여 1건의 후기(`reviews`)를 작성할 수 있습니다.

---

## 4. 테이블별 상세 설계 (14개 테이블)

> **데이터 타입 작성 원칙**
> - 원화 금액: 소수점이 없는 통화이므로 `numeric(12,0)` 사용
> - 날짜/시각: 일자만 필요하면 `date`, 시분초/타임존이 필요하면 `timestamptz`
> - 복합 구조: 배열이나 객체 형태의 데이터는 PostgreSQL 전용 고성능 `jsonb` 사용

---

### 1) 상품 (`products`)
- **목적**: 쇼핑몰에 전시되고 판매되는 꽃다발·꽃바구니·화병 등 상품 정보
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 상품 고유 식별자 (영문 슬러그) | - |
  | `name` | `text` | NOT NULL | - | 상품명 (한국어) | - |
  | `englishName` | `text` | - | `''` | 상품 영문명 | - |
  | `category` | `text` | NOT NULL | `'bouquet'` | 분류 (`bouquet`, `basket`, `vase`, `dried`, `space`, `plant`, `goods`) | - |
  | `price` | `numeric(12,0)` | NOT NULL | `0` | 기본 판매 가격 (원) | - |
  | `sizes` | `jsonb` | NOT NULL | `'[]'::jsonb` | 사이즈별 추가 옵션 목록 (`[{ name, price, stockQuantity }]`) | - |
  | `inquiryOnly` | `boolean` | NOT NULL | `false` | 가격 상담 전용 상품 여부 | - |
  | `poeticLine` | `text` | - | `''` | 상품을 나타내는 시적인 한 줄 문구 | - |
  | `flowerMeaning` | `text` | - | `''` | 꽃말 및 상징 요약 | - |
  | `description` | `text` | - | `''` | 상품 상세 설명 본문 | - |
  | `stockQuantity` | `integer` | NOT NULL | `0` | 기본 재고 수량 | - |
  | `image` | `text` | NOT NULL | `''` | 대표 사진 주소 | - |
  | `visibility` | `text` | NOT NULL | `'public'` | 공개 상태 (`public`, `private`, `scheduled`) | - |
  | `publishAt` | `timestamptz` | - | NULL | 예약 공개 일시 (한국 시간 기준) | - |
  | `curationTags` | `jsonb` | NOT NULL | `'[]'::jsonb` | 상황·분위기 맞춤 태그 배열 (`['축하', '고백']`) | - |
  | `hideOnHome` | `boolean` | NOT NULL | `false` | 홈 화면 노출 제외 여부 | - |
  | `homeOrder` | `integer` | NOT NULL | `999` | 홈 슬라이더 노출 순서 (낮을수록 앞) | - |
  | `images` | `jsonb` | NOT NULL | `'[]'::jsonb` | 상세 사진 주소 배열 (`['assets/...', ...]`) | - |
  | `flowers` | `jsonb` | NOT NULL | `'[]'::jsonb` | 사용된 꽃 ID 목록 (`['rose-pink', ...]`) | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_products_category` ON (`category`)
  - `idx_products_visibility` ON (`visibility`, `publishAt`)
  - `idx_products_home` ON (`hideOnHome`, `homeOrder`)
- **JSONB 컬럼 분리 검토**:
  - `sizes`: 현재 상품당 0~3개 수준으로 적으므로 `jsonb`가 직관적이고 효율적입니다. 향후 사이즈별 개별 바코드나 독립 재고 관리가 필요해지면 `product_sizes` 테이블로 분리할 수 있습니다.
  - `curationTags`: 단순 문자열 태그 배열이므로 `jsonb` 유지가 적합합니다.
  - `images`: 순서가 보장된 사진 주소 목록이므로 `jsonb` 유지가 가장 가볍습니다.
  - `flowers`: 꽃 사전 ID의 단순 참조 배열이므로 `jsonb`로 충분합니다.

---

### 2) 주문 (`orders`)
- **목적**: 고객이 접수한 꽃 주문서 정보 (배송 정보, 결제 금액, 진행 상태 등)
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 주문 내부 고유 식별자 (`ord-...`) | - |
  | `orderNumber` | `text` | NOT NULL | - | 손님 안내용 주문번호 (`SDH-YYMMDD-XXXX`) | - |
  | `createdDate` | `date` | NOT NULL | `CURRENT_DATE` | 주문 접수 일자 | - |
  | `createdAt` | `timestamptz` | NOT NULL | `NOW()` | 주문 접수 일시 | - |
  | `status` | `text` | NOT NULL | `'preparing'` | 상태 (`preparing`, `packaged`, `delivering`, `completed`, `cancelled`) | - |
  | `ordererName` | `text` | NOT NULL | - | 주문자 성함 | **개인정보** |
  | `ordererPhone` | `text` | NOT NULL | - | 주문자 연락처 | **개인정보** |
  | `recipientName` | `text` | NOT NULL | - | 받는 분 성함 | **개인정보** |
  | `recipientPhone` | `text` | NOT NULL | - | 받는 분 연락처 | **개인정보** |
  | `customerName` | `text` | - | `''` | 구버전 호환용 고객명 | **개인정보** |
  | `phone` | `text` | - | `''` | 구버전 호환용 연락처 | **개인정보** |
  | `zipcode` | `text` | - | `''` | 우편번호 | **개인정보** |
  | `address` | `text` | NOT NULL | - | 배송지 주소 (상세주소 포함) | **개인정보** |
  | `deliveryMethod` | `text` | NOT NULL | `'parcel'` | 배송 방식 (`quick`, `parcel`, `pickup`) | - |
  | `deliveryMethodLabel` | `text` | - | `''` | 배송 방식 표시 명칭 | - |
  | `deliveryFee` | `numeric(12,0)` | NOT NULL | `0` | 배송비 (원) | - |
  | `itemsTotal` | `numeric(12,0)` | NOT NULL | `0` | 상품 합계 금액 (원) | - |
  | `totalAmount` | `numeric(12,0)` | NOT NULL | `0` | 최종 결제 금액 (상품+배송비-할인) | - |
  | `deliveryDate` | `date` | - | NULL | 배송/수령 희망 일자 | - |
  | `message` | `text` | - | `''` | 꽃에 동봉할 카드 메시지 | **개인정보** |
  | `hideSender` | `boolean` | NOT NULL | `false` | 보내는 분 익명 요청 여부 | - |
  | `request` | `text` | - | `''` | 배송 시 요청사항 | **개인정보** |
  | `courier` | `text` | - | `''` | 택배사 명칭 | - |
  | `trackingNumber` | `text` | - | `''` | 운송장 번호 | - |
  | `statusBeforeCancel` | `text` | - | `''` | 취소 전 이전 상태값 | - |
  | `isSample` | `boolean` | NOT NULL | `false` | 테스트용 예시 데이터 여부 | - |
  | `couponCode` | `text` | - | `''` | 사용된 할인 쿠폰 코드 | - |
  | `couponDiscount` | `numeric(12,0)` | NOT NULL | `0` | 쿠폰 할인 적용 금액 (원) | - |
- **기본키(PK)**: `id`
- **고유키(UNIQUE)**: `orderNumber`
- **인덱스**:
  - `idx_orders_number` ON (`orderNumber`)
  - `idx_orders_status` ON (`status`)
  - `idx_orders_created` ON (`createdAt` DESC)
  - `idx_orders_lookup` ON (`orderNumber`, `ordererPhone`)

---

### 3) 주문 품목 (`order_items`)
- **목적**: 주문서 하나에 포함된 세부 품목과 수량, 선택된 옵션 내역
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `orderId` | `text` | NOT NULL | - | 소속 주문 식별자 (`orders.id`) | - |
  | `lineNo` | `integer` | NOT NULL | `1` | 주문서 내 순번 (1부터 시작) | - |
  | `productId` | `text` | - | NULL | 주문 상품 식별자 (`products.id`) | - |
  | `productName` | `text` | NOT NULL | - | 주문 당시 상품명 (상품 삭제 대비) | - |
  | `sizeLabel` | `text` | - | `''` | 선택한 사이즈 명칭 (M, L 등) | - |
  | `price` | `numeric(12,0)` | NOT NULL | `0` | 품목 단가 (원) | - |
  | `optionName` | `text` | - | `''` | 추가 옵션 명칭 | - |
  | `optionPrice` | `numeric(12,0)` | NOT NULL | `0` | 추가 옵션 금액 (원) | - |
  | `quantity` | `integer` | NOT NULL | `1` | 주문 수량 | - |
- **기본키(PK)**: `(orderId, lineNo)`
- **외래키(FK)**:
  - `FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE`
  - `FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL`
- **인덱스**:
  - `idx_order_items_product` ON (`productId`)

---

### 4) 지출 (`expenses`)
- **목적**: 꽃 사입비, 부자재 구입비, 배송비 등 매장 운영 지출 내역
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 지출 고유 식별자 (`exp-...`) | - |
  | `date` | `date` | NOT NULL | `CURRENT_DATE` | 지출 일자 | - |
  | `category` | `text` | NOT NULL | `'flower'` | 지출 분류 (꽃사입, 포장재, 배송비, 기타) | - |
  | `amount` | `numeric(12,0)` | NOT NULL | `0` | 지출 금액 (원) | - |
  | `method` | `text` | NOT NULL | `'card'` | 결제 수단 (카드, 계좌이체, 현금) | - |
  | `memo` | `text` | - | `''` | 지출 메모 (구매처, 내역 등) | - |
  | `isSample` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_expenses_date` ON (`date` DESC)
  - `idx_expenses_category` ON (`category`)

---

### 5) 1:1 맞춤 상담 문의 (`inquiries`)
- **목적**: 손님이 웹사이트에서 신청한 맞춤 부케, 대형 꽃바구니, 행사 문의
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 문의 고유 식별자 (`inq-...`) | - |
  | `createdDate` | `date` | NOT NULL | `CURRENT_DATE` | 접수 일자 | - |
  | `status` | `text` | NOT NULL | `'new'` | 처리 상태 (`new`: 연락 대기, `done`: 연락 완료) | - |
  | `name` | `text` | NOT NULL | - | 손님 성함 | **개인정보** |
  | `phone` | `text` | NOT NULL | - | 손님 연락처 | **개인정보** |
  | `date` | `text` | - | `''` | 수령 희망일 | - |
  | `type` | `text` | - | `''` | 상담 유형 (맞춤 꽃다발, 웨딩, 정기구독 등) | - |
  | `productName` | `text` | - | `''` | 문의 관련 특정 상품명 | - |
  | `message` | `text` | NOT NULL | `''` | 손님이 남긴 상담 내용 본문 | **개인정보** |
  | `memo` | `text` | - | `''` | 사장님 전용 상담 기록 메모 | **개인정보** |
  | `contactedAt` | `timestamptz` | - | NULL | 사장님이 손님께 연락 완료한 시각 | - |
  | `replies` | `jsonb` | NOT NULL | `'[]'::jsonb` | 과거 답변 또는 상담 로그 (`[{ at, text }]`) | - |
  | `isSample` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_inquiries_status` ON (`status`, `createdDate` DESC)
- **JSONB 컬럼 분리 검토**:
  - `replies`: 사장님의 답변/통화 메모 로그 기록으로 건수가 적어 `jsonb`가 적합합니다.

---

### 6) 재입고 알림 신청 (`restock`)
- **목적**: 품절 상품에 대해 손님이 재입고 시 문자/연락을 받기 위해 등록한 알림 신청
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 알림 신청 고유 식별자 | - |
  | `productId` | `text` | NOT NULL | - | 대상 상품 식별자 (`products.id`) | - |
  | `productName` | `text` | NOT NULL | - | 대상 상품명 | - |
  | `name` | `text` | NOT NULL | - | 신청자 성함 | **개인정보** |
  | `phone` | `text` | NOT NULL | - | 알림받을 연락처 | **개인정보** |
  | `createdDate` | `date` | NOT NULL | `CURRENT_DATE` | 신청 일자 | - |
  | `status` | `text` | NOT NULL | `'waiting'` | 알림 상태 (`waiting`: 대기, `notified`: 발송 완료) | - |
  | `isSample` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
- **기본키(PK)**: `id`
- **외래키(FK)**:
  - `FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE`
- **인덱스**:
  - `idx_restock_product_status` ON (`productId`, `status`)

---

### 7) 공지/이벤트 팝업 (`popups`)
- **목적**: 쇼핑몰 첫 화면에 띄우는 슬라이더 형태의 공지 및 프로모션 안내
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 팝업 슬라이드 고유 식별자 | - |
  | `active` | `boolean` | NOT NULL | `true` | 슬라이드 활성화 여부 | - |
  | `order` | `integer` | NOT NULL | `0` | 슬라이드 정렬 순서 | - |
  | `image` | `text` | NOT NULL | - | 팝업 배경/대표 사진 주소 | - |
  | `title` | `text` | NOT NULL | - | 팝업 제목 (한국어) | - |
  | `text` | `text` | NOT NULL | `''` | 팝업 설명 문구 (한국어) | - |
  | `titleEn` | `text` | - | `''` | 영문 제목 | - |
  | `textEn` | `text` | - | `''` | 영문 설명 | - |
  | `titleJa` | `text` | - | `''` | 일문 제목 | - |
  | `textJa` | `text` | - | `''` | 일문 설명 | - |
  | `buttonLabel` | `text` | - | `'자세히 보기'` | 버튼 문구 | - |
  | `linkType` | `text` | NOT NULL | `'none'` | 링크 형식 (`none`, `url`, `internal`) | - |
  | `url` | `text` | - | `''` | 외부 링크 주소 | - |
  | `internalTarget` | `text` | - | `''` | 내부 이동 화면 (`shop`, `story`, `custom` 등) | - |
  | `startDate` | `date` | - | NULL | 팝업 게시 시작일 | - |
  | `endDate` | `date` | - | NULL | 팝업 게시 종료일 | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_popups_display` ON (`active`, `order`)

---

### 8) 정성 안내 및 약관 페이지 (`pages`)
- **목적**: 보자기 포장 안내, 생화 관리 팁, 배송 안내, 환불 정책, 이용약관, 개인정보처리방침 본문
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 페이지 고유 식별자 (`bojagi`, `care`, `terms` 등) | - |
  | `title` | `text` | NOT NULL | - | 페이지 제목 | - |
  | `body` | `text` | NOT NULL | - | 마크다운 포맷의 본문 내용 | - |
  | `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | 마지막 수정 일시 | - |
  | `media` | `jsonb` | - | `'{}'::jsonb` | 안내 사진/영상 구성 (`{ ratio, images, video }`) | - |
- **기본키(PK)**: `id`
- **JSONB 컬럼 분리 검토**:
  - `media`: 페이지별로 특화된 사진 목록과 영상 1개의 레이아웃 속성을 담으므로 `jsonb`가 이상적입니다.

---

### 9) 매장 설정 (`settings`)
- **목적**: 영업시간, 정기 휴무일, 임시 휴무, 배송비 기준, 사업자 정보 등 가게 운영 전반의 키-값 설정
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `key` | `text` | NOT NULL | - | 설정 항목 키 (예: `weeklyHours`, `delivery`, `business`) | - |
  | `value` | `jsonb` | NOT NULL | - | 해당 설정의 상세 값 객체 또는 값 | - |
- **기본키(PK)**: `key`

---

### 10) 꽃 사전 (`flowers`)
- **목적**: 설담화에서 다루는 62종 이상의 제철 꽃 정보, 꽃말, 관리법 도감
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 꽃 식별자 (영문 슬러그, 예: `rose-pink`) | - |
  | `name` | `text` | NOT NULL | - | 꽃 한글 명칭 | - |
  | `nameEn` | `text` | - | `''` | 꽃 영문 명칭 | - |
  | `nameJa` | `text` | - | `''` | 꽃 일문 명칭 | - |
  | `meaning` | `text` | NOT NULL | `''` | 꽃말 (한글) | - |
  | `meaningEn` | `text` | - | `''` | 꽃말 (영문) | - |
  | `meaningJa` | `text` | - | `''` | 꽃말 (일문) | - |
  | `months` | `jsonb` | NOT NULL | `'[]'::jsonb` | 제철 월 배열 (예: `[3, 4, 5]`) | - |
  | `yearRound` | `boolean` | NOT NULL | `false` | 연중 사계절 유통 여부 | - |
  | `colors` | `text` | - | `''` | 주요 화색 (쉼표 구분) | - |
  | `care` | `text` | - | `''` | 가정 내 손질 및 관리 방법 | - |
  | `image` | `text` | - | `''` | 꽃 사전 대표 사진 주소 | - |
  | `guideText` | `text` | - | `''` | 상세 관리 도감 텍스트 | - |
  | `guideImages` | `jsonb` | - | `'[]'::jsonb` | 관리 가이드 추가 사진 주소 배열 | - |
  | `guideVideo` | `text` | - | `''` | 관리 가이드 동영상 주소 | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_flowers_year_round` ON (`yearRound`)
- **JSONB 컬럼 분리 검토**:
  - `months`: 1~12 정수 배열로서 단순 필터링용이므로 `jsonb`가 유지보수에 매우 유리합니다.
  - `guideImages`: 가이드 전용 사진 목록으로 `jsonb` 유지가 적절합니다.

---

### 11) 오프라인 쿠폰 (`coupons`)
- **목적**: 인쇄물로 손님께 전달되어 결제 시 1회 사용되는 할인 쿠폰 코드
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `code` | `text` | NOT NULL | - | 쿠폰 코드 (`SDH-XXXX-XXXX`) | - |
  | `batchId` | `text` | NOT NULL | - | 쿠폰 묶음 식별자 (`batch-...`) | - |
  | `batchName` | `text` | NOT NULL | - | 쿠폰 묶음 명칭 | - |
  | `type` | `text` | NOT NULL | `'amount'` | 할인 유형 (`amount`: 정액 할인, `percent`: 정률 할인) | - |
  | `value` | `numeric(12,0)` | NOT NULL | `0` | 할인값 (금액 또는 할인율) | - |
  | `minOrder` | `numeric(12,0)` | NOT NULL | `0` | 최소 주문 가능 금액 (원) | - |
  | `startDate` | `date` | NOT NULL | - | 유효기간 시작일 | - |
  | `endDate` | `date` | NOT NULL | - | 유효기간 만료일 | - |
  | `active` | `boolean` | NOT NULL | `true` | 쿠폰 사용 가능 여부 | - |
  | `createdAt` | `timestamptz` | NOT NULL | `NOW()` | 쿠폰 발행 일시 | - |
  | `usedAt` | `timestamptz` | - | NULL | 쿠폰 사용 처리 일시 | - |
  | `orderNumber` | `text` | - | `''` | 쿠폰을 사용한 주문번호 | - |
- **기본키(PK)**: `code`
- **인덱스**:
  - `idx_coupons_batch` ON (`batchId`)
  - `idx_coupons_active_dates` ON (`active`, `startDate`, `endDate`)

---

### 12) 쿠폰 발행 묶음 이력 (`coupon_history`)
- **목적**: 관리자가 대량 생성한 쿠폰 묶음의 통계 및 발행 히스토리 보관
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 묶음 이력 고유 식별자 (`coupon_history.id`) | - |
  | `batchName` | `text` | NOT NULL | - | 쿠폰 묶음 명칭 | - |
  | `type` | `text` | NOT NULL | - | 할인 방식 (`amount` / `percent`) | - |
  | `value` | `numeric(12,0)` | NOT NULL | `0` | 할인 혜택 수치 | - |
  | `minOrder` | `numeric(12,0)` | NOT NULL | `0` | 최소 기준 금액 (원) | - |
  | `startDate` | `date` | NOT NULL | - | 행사 시작일 | - |
  | `endDate` | `date` | NOT NULL | - | 행사 종료일 | - |
  | `created` | `integer` | NOT NULL | `0` | 총 발행된 매수 | - |
  | `used` | `integer` | NOT NULL | `0` | 실제 사용된 매수 | - |
  | `usedDates` | `jsonb` | NOT NULL | `'[]'::jsonb` | 사용 일시 기록 배열 | - |
  | `archivedAt` | `timestamptz` | NOT NULL | `NOW()` | 묶음 생성/기록 일시 | - |
- **기본키(PK)**: `id`

---

### 13) 사진 보관함 (`images`)
- **목적**: 관리자가 직접 업로드한 상품 및 매장 사진 메타데이터 (실제 파일은 Storage에 저장)
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 사진 고유 식별자 (`img-...`) | - |
  | `name` | `text` | NOT NULL | - | 원본 파일명 | - |
  | `src` | `text` | NOT NULL | - | 저장소 파일 URL (예: Storage 공개 링크) | - |
  | `width` | `integer` | NOT NULL | `0` | 가로 해상도 (px) | - |
  | `height` | `integer` | NOT NULL | `0` | 세로 해상도 (px) | - |
  | `createdAt` | `timestamptz` | NOT NULL | `NOW()` | 업로드 일시 | - |
- **기본키(PK)**: `id`

---

### 14) 상품 후기 (`reviews` — 신규 계획 테이블)
- **목적**: 배송 완료 손님이 남겨주신 정성스러운 포토/텍스트 후기와 사장님의 답글
- **비즈니스 규칙**:
  1. 배송 또는 픽업 완료(`status = 'completed'`)된 주문에 한하여 작성 가능
  2. 사장님이 관리자에서 승인(`status = 'approved'`)한 후기만 일반 쇼핑몰에 노출
  3. 작성자 본인의 이름은 손님 보호를 위해 화면에 일절 노출하지 않음 (익명 표시)
  4. 사장님이 각 후기마다 따뜻한 감사 답글을 달 수 있음
  5. 사진(최대 3장, 1장당 300KB 내외)과 짧은 동영상(1개, 30초/20MB 내외) 첨부 가능
  6. 개별 상품 상세 화면이 아니라 쇼핑몰 상단 '리뷰' 탭과 홈 화면 추천 슬라이더에 노출
  7. 테스트용 가상 후기는 `isSample = true`로 구분
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 후기 고유 식별자 (`rev-...`) | - |
  | `orderId` | `text` | NOT NULL | - | 주문 식별자 (`orders.id`) | - |
  | `orderNumber` | `text` | NOT NULL | - | 주문번호 (검증용) | - |
  | `productId` | `text` | - | NULL | 후기 대상 상품 식별자 (`products.id`) | - |
  | `productName` | `text` | NOT NULL | - | 후기 대상 상품명 | - |
  | `rating` | `integer` | NOT NULL | `5` | 별점 (1~5점) | - |
  | `text` | `text` | NOT NULL | - | 손님이 쓴 후기 글 본문 | - |
  | `photos` | `jsonb` | NOT NULL | `'[]'::jsonb` | 첨부 사진 Storage URL 배열 (최대 3장) | - |
  | `video` | `text` | - | `''` | 첨부 영상 Storage URL (1개) | - |
  | `status` | `text` | NOT NULL | `'pending'` | 승인 상태 (`pending`: 승인대기, `approved`: 공개승인, `hidden`: 숨김) | - |
  | `adminReply` | `text` | - | `''` | 사장님 답글 본문 | - |
  | `replyAt` | `timestamptz` | - | NULL | 사장님 답글 등록 일시 | - |
  | `createdAt` | `timestamptz` | NOT NULL | `NOW()` | 후기 작성 일시 | - |
  | `isSample` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
- **기본키(PK)**: `id`
- **외래키(FK)**:
  - `FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL`
  - `FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL`
- **인덱스**:
  - `idx_reviews_public` ON (`status`, `createdAt` DESC)
  - `idx_reviews_order` ON (`orderId`)

---

## 5. 행 수준 보안 (Row Level Security, RLS) 접근 제어 계획

현재 `server.py`의 접근 권한 원칙(`PUBLIC_TABLES`, `REMOTE_INSERT_TABLES`, `COUPON_PUBLIC` 등)을 PostgreSQL RLS 정책으로 100% 동일하게 구현합니다.

| 대상 테이블 | 익명 방문자 (anon) | 주문 손님 (anon) | 관리자 (authenticated / 사장님) |
|---|---|---|---|
| `products` | **읽기 전용** (`visibility='public'` 또는 예약시간 도래 건만) | 읽기 전용 | 전체 읽기 / 쓰기 / 삭제 |
| `orders` | 접근 불가 (조회는 RPC 함수로 주문번호+연락처 일치 시 1건만 반환) | **새 주문 등록(INSERT)만 가능** | 전체 읽기 / 수정 / 관리 |
| `order_items` | 접근 불가 | **새 주문 품목 등록(INSERT)만 가능** | 전체 읽기 / 수정 / 관리 |
| `inquiries` | 접근 불가 | **새 상담 등록(INSERT)만 가능** | 전체 읽기 / 수정 / 답변 관리 |
| `restock` | 접근 불가 | **새 알림 등록(INSERT)만 가능** | 전체 읽기 / 수정 / 관리 |
| `popups` | **읽기 전용** (`active=true` 이고 기간 내인 슬라이드) | 읽기 전용 | 전체 읽기 / 쓰기 / 순서 변경 |
| `pages` | **읽기 전용** (누구나 조회 가능) | 읽기 전용 | 전체 읽기 / 수정 |
| `settings` | **읽기 전용** (단, 비밀번호나 연동 키 등 내부 설정 제외) | 읽기 전용 | 전체 읽기 / 수정 |
| `flowers` | **읽기 전용** (꽃 사전 도감 누구나 조회) | 읽기 전용 | 전체 읽기 / 쓰기 / 삭제 |
| `coupons` | 쿠폰 확인용 RPC (`/api/coupon`과 동일: 코드 일치 시 할인 정보만 반환) | 사용 처리만 가능 | 전체 쿠폰 발행 / 폐기 / 내역 조회 |
| `coupon_history` | 접근 불가 | 접근 불가 | 전체 읽기 / 등록 |
| `expenses` | **접근 불가 (철저한 보안)** | 접근 불가 | 전체 읽기 / 등록 / 삭제 |
| `images` | **읽기 전용** (공개 사진 주소 조회) | 읽기 전용 | 사진 등록 / 삭제 |
| `reviews` | **읽기 전용** (`status='approved'` 승인된 건만 노출) | **완료 주문 건에 한해 등록(INSERT)** | 승인/반려/답글 달기 전체 권한 |

---

## 6. 파일 및 이미지 저장소 (Supabase Storage) 계획

1. **저장소 버킷(Bucket) 구성**
   - `product-photos`: 상품 대표 사진 및 갤러리 상세 사진 (공개 읽기 허용)
   - `page-media`: 보자기 포장 영상, 매장 안내 사진 등 (공개 읽기 허용)
   - `review-media`: 손님이 올리는 후기 사진 및 짧은 영상 (공개 읽기, 파일 크기 제한 적용)
     - 사진: 최대 3장, 장당 약 300KB (클라이언트에서 리사이즈 후 업로드)
     - 영상: 1개, 30초 이내, 20MB 이하

2. **기존 base64 데이터(`data:image/...`)의 파일 변환 이전 계획**
   - 현재 브라우저 `images` 테이블이나 `products.image`에는 data URL 형태로 이미지 문자열이 들어있을 수 있습니다.
   - **이전 스크립트 실행 절차**:
     1. 마이그레이션 스크립트가 각 레코드의 base64 문자열을 디코딩하여 실제 바이너리 버퍼로 변환합니다.
     2. Supabase Storage의 `product-photos/` 경로에 고유 파일명(예: `prod-bohemian-1.jpg`)으로 업로드합니다.
     3. 반환받은 공식 CDN URL을 테이블의 `image` 및 `images` 배열 컬럼에 대체하여 저장합니다.

---

## 7. 데이터 이전 시 특별 주의사항

1. **재고 차감과 주문 생성의 단일 트랜잭션 보장**
   - 여러 손님이 동시에 남은 1개의 꽃을 주문할 때 재고가 음수가 되는 일을 막기 위해, 주문 등록과 재고 차감은 반드시 **단일 트랜잭션(PostgreSQL Function/RPC)**으로 묶어서 처리합니다.
2. **주문번호 중복 방지**
   - `orderNumber` 컬럼에 `UNIQUE` 제약 조건을 설정하고, 만에 하나 충돌 발생 시 즉시 새 번호를 채번하도록 서버 함수를 구성합니다.
3. **쿠폰 '1회 사용' 무결성 보장**
   - 쿠폰 사용 처리는 `UPDATE coupons SET usedAt = NOW(), orderNumber = ... WHERE code = ... AND usedAt IS NULL` 조건을 통해 동시 사용을 원천 차단합니다.
4. **타임존 기준 (KST, Asia/Seoul)**
   - 설담화의 꽃 예약과 배송일은 한국 시간 기준이므로, 데이터베이스의 기본 타임존을 `Asia/Seoul`로 구성하거나 `timestamptz` 저장 시 항상 한국 시간대를 기준으로 처리합니다.
5. **매장 설정(`settings`)의 키-값 처리**
   - `settings` 테이블의 `value` 컬럼은 `jsonb` 타입이므로 기존 자바스크립트 객체 구조를 100% 온전하게 보존합니다.
6. **예시 데이터(`isSample`) 구분**
   - 개발 및 테스트용 데이터는 `isSample = true`로 표시되므로, 실제 오픈 시 `DELETE FROM orders WHERE isSample = true` 등으로 한 번에 안전하게 청소할 수 있습니다.

---

## 8. 단계별 이전 로드맵 (Migration Steps)

```text
[1단계] CSV 내보내기 ──> [2단계] Supabase 테이블 생성 ──> [3단계] 의존성 순서 데이터 입력
                                                                      │
[6단계] 데이터 건수 검증 <── [5단계] DataStore 연동 전환 <── [4단계] Storage 파일 이전
       │
[7단계] 최종 CSV 백업 보관
```

1. **1단계: CSV 내보내기**  
   - 관리자 센터의 [지금 CSV로 저장] 또는 로컬 서버의 `DATA/*.csv` 최신본을 모두 수집합니다.
2. **2단계: 테이블 생성**  
   - `docs/supabase-schema.sql`을 실행하여 PostgreSQL 테이블, 인덱스, 제약조건을 생성합니다.
3. **3단계: 의존성 순서에 맞춘 데이터 입력**  
   - 외래키 오류가 나지 않도록 다음 순서로 데이터를 삽입합니다:  
     `settings` → `flowers` → `products` → `popups` → `pages` → `coupons` → `coupon_history` → `orders` → `order_items` → `expenses` → `inquiries` → `restock` → `images`
4. **4단계: 이미지를 Storage로 이전**  
   - 사진 파일들을 Supabase Storage에 업로드하고 주소를 CDN URL로 갱신합니다.
5. **5단계: DataStore 연동 전환**  
   - [65]에서 구축한 [`assets/js/data-store.js`](file:///c:/Users/504-19/Desktop/SeolDamHwa/assets/js/data-store.js)의 내부 구현을 Supabase JS 클라이언트 호출로 교체합니다. (화면 코드는 전혀 손댈 필요가 없습니다.)
6. **6단계: 데이터 건수 및 기능 검증**  
   - 이전 전 CSV 줄 수와 데이터베이스 테이블 행 수가 정확히 일치하는지 확인하고 결제 및 조회를 테스트합니다.
7. **7단계: 최종 CSV 백업 보관**  
   - 만약의 상황에 대비해 이전 직전의 CSV 파일들을 안전한 별도 보관소에 영구 보관합니다.
