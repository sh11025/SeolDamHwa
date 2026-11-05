# 설담화(說談花) 데이터베이스 설계서 (Supabase / PostgreSQL)

> 이 문서는 설담화 쇼핑몰의 데이터를 파일(CSV)과 웹 브라우저에서 인터넷 데이터베이스(Supabase PostgreSQL)로 옮길 때 사용하는 공식 설계서입니다.
> 현재 운영 중인 `assets/js/csv-db.js`의 13개 표 구조와 새로 추가된 1개 표(후기)의 실제 데이터 형태를 빠짐없이 담았습니다.
> `docs/supabase-schema.sql`과 내용 및 정책이 100% 동일하게 유지됩니다.

---

## 1. 사장님을 위한 데이터 안내 (쉬운 설명)

설담화의 모든 정보는 앞으로 안전한 온라인 금고(데이터베이스)에 표 형태로 가지런히 보관됩니다.

- **어떤 표들이 있나요?**  
  꽃 상품 목록(`products`), 손님이 주문한 내역(`orders`), 주문 속 세부 상품들(`order_items`), 꽃집 운영에 쓴 지출(`expenses`), 1:1 맞춤 상담 신청(`inquiries`), 품절 꽃 재입고 알림 신청(`restock`), 홈페이지 공지 팝업(`popups`), 정성 안내·이용약관 글(`pages`), 영업시간·가게 주소 등 매장 설정(`settings`), 계절별 꽃 정보가 담긴 꽃 사전(`flowers`), 손님에게 드리는 할인 쿠폰(`coupons`), 지난 쿠폰 발행 내역(`coupon_history`), 등록된 사진 정보(`images`), 그리고 손님이 남겨주실 꽃 후기(`reviews`)까지 총 14개 표로 이루어집니다.

- **손님의 개인정보는 어디에 들어가나요?**  
  손님의 소중한 이름·전화번호·배송지 주소는 **주문(`orders`)**, **1:1 상담(`inquiries`)**, **재입고 알림(`restock`)** 단 3곳에만 저장됩니다. 나머지 표에는 개인정보가 일절 들어가지 않습니다.

- **누가 보고 고칠 수 있나요? (3단계 보안 원칙)**  
  1. **손님(방문자)**: 꽃 상품·꽃 사전·안내 글·공지 팝업·승인된 후기는 누구나 자유롭게 볼 수 있습니다. 주문서 작성·1:1 상담 신청·재입고 알림 신청은 손님이 '새로 등록'만 할 수 있고, 남의 정보는 절대 볼 수 없습니다. (본인 주문은 주문번호와 연락처가 정확히 맞을 때 전용 조회 함수를 통해서만 마스킹된 안전한 정보 1건씩만 조회됩니다.)  
  2. **사장님(관리자 로그인)**: 모든 표의 데이터를 열람하고 수정할 수 있으며, 지출 내역이나 전체 주문 관리, 팝업 및 상품 수정, 후기 승인/답글 등 가게 운영에 필요한 모든 권한을 갖습니다.  
  3. **쿠폰 직접 수정 금지 (서버 트랜잭션 보장)**: 손님 기기는 쿠폰 표를 직접 바꿀 수 있는 권한이 전혀 없습니다. 손님이 주문을 제출하면, 서버 함수(`submit_order_transaction`)가 가격·배송비·쿠폰 유효성을 엄격히 재검증한 뒤 사장님 금고 안에서 안전하게 주문 등록과 쿠폰 사용을 한 번에 처리합니다.

- **사장님 계정은 어떻게 관리자 표시를 받나요?**  
  Supabase 시스템에서는 일반 로그인 토큰(`role`)에 무조건 'authenticated'(인증된 사용자)라는 이름만 붙고 'admin'이라는 이름은 자동으로 붙지 않습니다. 따라서 사장님 계정에는 관리자 표시를 별도로 달아주어야 합니다.  
  1. Supabase 관리 화면(대시보드)의 왼쪽 메뉴에서 **[Authentication] → [Users]**로 들어갑니다.  
  2. 가입된 사장님의 이메일 계정을 클릭합니다.  
  3. **[App Metadata]** 항목에 `{"role": "admin"}`을 적고 저장합니다. (User Metadata에 넣으면 안 됨 — 손님이 직접 고칠 수 있는 칸)  
  *(또는 SQL 에디터에서 `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE email = '사장님이메일';` 을 한 번만 실행하면 됩니다.)*  
  이렇게 해 두면 데이터베이스의 `is_admin()` 함수가 사장님임을 알아채고 모든 관리 권한을 열어줍니다.

---

## 2. 식별자(ID) 및 고유 번호 규칙

1. **기존 데이터 식별자 (호환성 유지)**  
   - 상품 ID는 예전부터 사용해 온 영문 단어(`bohemian-autumn`, `snow-white` 등)를 그대로 유지합니다.
   - 기존 주문 ID(`ord-1730000000000`)나 사진 ID(`img-1730000000000`) 등도 변경 없이 그대로 들어갑니다.
   - 따라서 데이터베이스의 모든 ID 컬럼은 숫자가 아닌 **`text` 타입**을 사용하며, 이전 과정에서 이름을 바꾸지 않습니다.

2. **신규 생성 식별자**  
   - 새로 생성되는 레코드는 `makeId(prefix)`를 통해 접두사와 고유값이 결합된 형태(`ord-xxxx`, `inq-xxxx`, `exp-xxxx`, `rev-xxxx` 등)로 생성됩니다.

3. **손님용 주문번호 (`orderNumber`)**  
   - 내부 관리용 식별자(`id`)와 별개로, 손님이 조회하거나 사장님이 송장에 적는 주문번호는 **`SDH-YYMMDD-XXXX`** 형태(날짜와 영문·숫자 조합)를 유지합니다.
   - 이 번호는 테이블 전체에서 유일해야 하므로 고유값(`UNIQUE`) 제약 조건을 갖습니다. (고유값 제약조건이 인덱스를 자동 생성하므로 별도의 중복 인덱스는 만들지 않습니다.)

---

## 3. 테이블 간 관계도 (텍스트 다이어그램)

```text
[ flowers ] (꽃 사전)
     ▲
     │ (products.flowers JSON 배열 내 ID 참조)
     │
[ products ] (상품) ───┬───< [ restock ] (재입고 신청: productId, 삭제 시 SET NULL)
     ▲                 │
     │                 └───< [ reviews ] (상품 후기: productId, 삭제 시 SET NULL)
     │                             ▲
     │ (order_items.productId,     │ (reviews.orderId, 삭제 시 SET NULL)
     │  삭제 시 SET NULL)           │
[ order_items ] >───── [ orders ] ─┴─── (쿠폰 코드 조회 RPC / 서버 트랜잭션) ───> [ coupons ]
 (주문 상품 목록)         (주문서)                                                ▲
                                                                                  │ (batchId 묶음 연결)
                                                                                  │
                                                                          [ coupon_history ]
```

- **상품과 주문**: 하나의 주문(`orders`)에는 여러 개의 주문 상품(`order_items`)이 연결됩니다. (`1 : N`)
- **상품과 재입고 알림**: 하나의 상품(`products`)에 여러 명의 손님이 재입고 알림(`restock`)을 신청할 수 있습니다. (`1 : N`)  
  *상품이 삭제되어도 손님의 신청 내역이 조용히 삭제되지 않도록 외래키는 `ON DELETE SET NULL`을 적용합니다.*
- **상품과 꽃 사전**: 상품의 `flowers` 컬럼에 꽃 사전(`flowers`)의 `id`들이 배열로 기록됩니다.
- **주문과 쿠폰**: 손님 기기는 쿠폰을 직접 바꿀 수 없으며, 주문 생성 RPC(`submit_order_transaction`)가 가격 검증과 함께 쿠폰의 `usedAt`과 `orderNumber`를 일괄 원자적으로 기록합니다.
- **쿠폰과 쿠폰 이력**: 오프라인 배포 묶음(`coupons.batchId`)은 `coupon_history`에서 일괄 통계로 관리됩니다.
- **주문과 후기**: 배송 완료(`status = 'completed'`)된 주문에 한하여 품목당 1건의 후기(`reviews`)를 작성할 수 있습니다.

---

## 4. 데이터베이스 작성 원칙 (필수 준수 규칙)

1. **칸 이름은 앱과 똑같이(대소문자 그대로) — SQL에서는 큰따옴표로 감쌈**  
   - PostgreSQL은 따옴표가 없는 영문 식별자를 모두 소문자로 강제 변환합니다(`englishName` → `englishname`).
   - 현재 설담화 앱 코드는 `englishName`, `stockQuantity`, `orderNumber` 등 카멜케이스(camelCase)를 읽으므로, 모든 카멜케이스 컬럼은 테이블 정의, 인덱스, 제약조건, 정책 등 SQL 전반에서 반드시 **큰따옴표(`"englishName"`)**로 감쌉니다.
2. **추측하지 않고 실제 저장 형식을 그대로 사용 (`text` 타입 원칙)**  
   - `orders.createdAt`은 타임스탬프가 아니라 `"오후 02:43"`과 같은 한국어 시각 문자열입니다.
   - `orders.deliveryDate`는 `"2026-11-05"` 또는 `"2026-11-05 오후 14:00~18:00"`처럼 시간대 슬롯이 붙어 있습니다.
   - `products.publishAt`은 타임존 표기가 없는 한국 로컬 시각(`"YYYY-MM-DDTHH:mm"`)입니다.
   - `inquiries.contactedAt`은 `"YYYY-MM-DDTHH:mm"` 또는 빈 문자열(`''`)입니다.
   - `coupons.usedAt`은 미사용 시 빈 문자열(`''`)입니다.
   - 기존 CSV 데이터를 오류 없이 안전하게 이전하기 위해 이러한 컬럼들은 우선 **`text` 타입**으로 온전히 보관하고, 이후 일회성 변환 작업을 통해 정돈합니다.
3. **실제 데이터와 일치하는 NULL 및 기본값 설정**  
   - 상담 전용 상품(`inquiryOnly = true`)은 재고가 없으므로 `stockQuantity`는 `NULL`을 허용하며 기본값 `0`을 강제하지 않습니다.
   - 상품 상황 태그(`curationTags`)는 배열이 아니라 객체(`{ recipients: [], ... }`)이므로 기본값은 `'{}'::jsonb`입니다.
   - `homeOrder`는 빈 값일 때 관리자에서 '자동 순서'로 처리되므로 999로 채우지 않고 `NULL`을 허용합니다.
   - 방문 수령(픽업) 주문 등 주소가 없는 주문이 있으므로 `orders.address`는 `NOT NULL`을 강제하지 않습니다.
   - 과거 주문 호환을 위해 `recipientName`, `ordererName` 등도 빈 문자열을 허용합니다.
4. **보안 린터(Linter) 규칙 및 최소 권한 준수**  
   - 모든 `SECURITY DEFINER` 함수는 `SET search_path = public`을 명시하여 검색 경로 가로채기 취약점을 차단합니다.
   - `REVOKE EXECUTE ... FROM PUBLIC`을 통해 기본 공개 실행을 차단하고, `anon`에게는 외부에 개방된 전용 RPC(`check_coupon`, `lookup_order`, `submit_order_transaction`)만 명시적으로 `GRANT`합니다.

---

## 5. 테이블별 상세 설계 (14개 테이블)

---

### 1) 상품 (`products`)
- **목적**: 쇼핑몰에 전시되고 판매되는 꽃다발·꽃바구니·화병 등 상품 정보
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 상품 고유 식별자 (영문 슬러그) | - |
  | `name` | `text` | NOT NULL | - | 상품명 (한국어) | - |
  | `"englishName"` | `text` | - | `''` | 상품 영문명 | - |
  | `category` | `text` | NOT NULL | `'bouquet'` | 분류 (`bouquet`, `basket`, `vase`, `dried`, `space`, `plant`, `goods`) | - |
  | `price` | `numeric(12,0)` | NOT NULL | `0` | 기본 판매 가격 (원) | - |
  | `sizes` | `jsonb` | NOT NULL | `'[]'::jsonb` | 사이즈별 추가 옵션 목록 (`[{ label, price, recommended }]`) | - |
  | `"inquiryOnly"` | `boolean` | NOT NULL | `false` | 가격 상담 전용 상품 여부 | - |
  | `"poeticLine"` | `text` | - | `''` | 상품을 나타내는 시적인 한 줄 문구 | - |
  | `"flowerMeaning"` | `text` | - | `''` | 꽃말 및 상징 요약 | - |
  | `description` | `text` | - | `''` | 상품 상세 설명 본문 | - |
  | `"stockQuantity"` | `integer` | - | NULL | 기본 재고 수량 (상담 상품은 NULL) | - |
  | `image` | `text` | NOT NULL | `''` | 대표 사진 주소 | - |
  | `visibility` | `text` | NOT NULL | `'public'` | 공개 상태 (`public`, `private`, `scheduled`) | - |
  | `"publishAt"` | `text` | - | NULL | 예약 공개 일시 (한국 로컬 시각 "YYYY-MM-DDTHH:mm") | - |
  | `"curationTags"` | `jsonb` | NOT NULL | `'{}'::jsonb` | 상황·분위기 맞춤 태그 객체 (`{ recipients: [], ... }`) | - |
  | `"hideOnHome"` | `boolean` | NOT NULL | `false` | 홈 화면 노출 제외 여부 | - |
  | `"homeOrder"` | `integer` | - | NULL | 홈 슬라이더 노출 순서 (빈 값은 자동 정렬) | - |
  | `images` | `jsonb` | NOT NULL | `'[]'::jsonb` | 상세 사진 주소 배열 (`['assets/...', ...]`) | - |
  | `flowers` | `jsonb` | NOT NULL | `'[]'::jsonb` | 사용된 꽃 ID 목록 (`['rose-pink', ...]`) | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_products_category` ON (`category`)
  - `idx_products_visibility` ON (`visibility`, `"publishAt"`)
  - `idx_products_home` ON (`"hideOnHome"`, `"homeOrder"`)

---

### 2) 주문 (`orders`)
- **목적**: 고객이 접수한 꽃 주문서 정보 (배송 정보, 결제 금액, 진행 상태 등)
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 주문 내부 고유 식별자 (`ord-...`) | - |
  | `"orderNumber"` | `text` | NOT NULL | - | 손님 안내용 주문번호 (`SDH-YYMMDD-XXXX`, UNIQUE) | - |
  | `"createdDate"` | `text` | NOT NULL | `CURRENT_DATE::text` | 주문 접수 일자 (`YYYY-MM-DD`) | - |
  | `"createdAt"` | `text` | NOT NULL | `''` | 주문 접수 시각 (한국어 문자열 "오후 02:43" 등) | - |
  | `status` | `text` | NOT NULL | `'preparing'` | 상태 (`preparing`, `packaged`, `delivering`, `completed`, `cancelled`) | - |
  | `"ordererName"` | `text` | - | `''` | 주문자 성함 | **개인정보** |
  | `"ordererPhone"` | `text` | - | `''` | 주문자 연락처 | **개인정보** |
  | `"recipientName"` | `text` | - | `''` | 받는 분 성함 | **개인정보** |
  | `"recipientPhone"` | `text` | - | `''` | 받는 분 연락처 | **개인정보** |
  | `"customerName"` | `text` | - | `''` | 구버전 호환용 고객명 | **개인정보** |
  | `phone` | `text` | - | `''` | 구버전 호환용 연락처 | **개인정보** |
  | `zipcode` | `text` | - | `''` | 우편번호 | **개인정보** |
  | `address` | `text` | - | `''` | 배송지 주소 (방문 수령 시 빈값) | **개인정보** |
  | `"deliveryMethod"` | `text` | NOT NULL | `'parcel'` | 배송 방식 (`quick`, `parcel`, `pickup`) | - |
  | `"deliveryMethodLabel"` | `text` | - | `''` | 배송 방식 표시 명칭 | - |
  | `"deliveryFee"` | `numeric(12,0)` | NOT NULL | `0` | 배송비 (원) | - |
  | `"itemsTotal"` | `numeric(12,0)` | NOT NULL | `0` | 상품 합계 금액 (원) | - |
  | `"totalAmount"` | `numeric(12,0)` | NOT NULL | `0` | 최종 결제 금액 (상품+배송비-할인) | - |
  | `"deliveryDate"` | `text` | - | `''` | 희망 일자 및 슬롯 ("YYYY-MM-DD" 또는 슬롯 포함) | - |
  | `message` | `text` | - | `''` | 꽃에 동봉할 카드 메시지 | **개인정보** |
  | `"hideSender"` | `boolean` | NOT NULL | `false` | 보내는 분 익명 요청 여부 | - |
  | `request` | `text` | - | `''` | 배송 시 요청사항 | **개인정보** |
  | `courier` | `text` | - | `''` | 택배사 명칭 | - |
  | `"trackingNumber"` | `text` | - | `''` | 운송장 번호 | - |
  | `"statusBeforeCancel"` | `text` | - | `''` | 취소 전 이전 상태값 | - |
  | `"isSample"` | `boolean` | NOT NULL | `false` | 테스트용 예시 데이터 여부 | - |
  | `"couponCode"` | `text` | - | `''` | 사용된 할인 쿠폰 코드 | - |
  | `"couponDiscount"` | `numeric(12,0)` | NOT NULL | `0` | 쿠폰 할인 적용 금액 (원) | - |
  | `"reviewRequestedAt"` | `text` | - | `''` | 후기 작성 요청 시각 ("YYYY-MM-DD HH:mm" 또는 ISO) | - |
- **기본키(PK)**: `id`
- **고유키(UNIQUE)**: `"orderNumber"` (별도의 인덱스 생성 불필요)
- **인덱스**:
  - `idx_orders_status` ON (`status`)
  - `idx_orders_created` ON (`"createdDate"` DESC, `"createdAt"` DESC)
  - `idx_orders_lookup` ON (`"orderNumber"`, `"ordererPhone"`)

---

### 3) 주문 품목 (`order_items`)
- **목적**: 주문서 하나에 포함된 세부 품목과 수량, 선택된 옵션 내역
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `"orderId"` | `text` | NOT NULL | - | 소속 주문 식별자 (`orders.id`) | - |
  | `"lineNo"` | `integer` | NOT NULL | `1` | 주문서 내 순번 (1부터 시작) | - |
  | `"productId"` | `text` | - | NULL | 주문 상품 식별자 (상품 삭제 대비 NULL 허용) | - |
  | `"productName"` | `text` | NOT NULL | - | 주문 당시 상품명 (상품 삭제 시에도 내역 보존) | - |
  | `"sizeLabel"` | `text` | - | `''` | 선택한 사이즈 명칭 (M, L 등) | - |
  | `price` | `numeric(12,0)` | NOT NULL | `0` | 품목 단가 (원) | - |
  | `"optionName"` | `text` | - | `''` | 추가 옵션 명칭 | - |
  | `"optionPrice"` | `numeric(12,0)` | NOT NULL | `0` | 추가 옵션 금액 (원) | - |
  | `quantity` | `integer` | NOT NULL | `1` | 주문 수량 | - |
- **기본키(PK)**: `("orderId", "lineNo")`
- **외래키(FK)**:
  - `FOREIGN KEY ("orderId") REFERENCES public.orders (id) ON DELETE CASCADE`
  - `FOREIGN KEY ("productId") REFERENCES public.products (id) ON DELETE SET NULL`
- **인덱스**:
  - `idx_order_items_product` ON (`"productId"`)

---

### 4) 지출 (`expenses`)
- **목적**: 꽃 사입비, 부자재 구입비, 배송비 등 매장 운영 지출 내역
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 지출 고유 식별자 (`exp-...`) | - |
  | `date` | `text` | NOT NULL | `CURRENT_DATE::text` | 지출 일자 (`YYYY-MM-DD`) | - |
  | `category` | `text` | NOT NULL | `'flower'` | 지출 분류 (꽃사입, 포장재, 배송비, 기타) | - |
  | `amount` | `numeric(12,0)` | NOT NULL | `0` | 지출 금액 (원) | - |
  | `method` | `text` | NOT NULL | `'card'` | 결제 수단 (카드, 계좌이체, 현금) | - |
  | `memo` | `text` | - | `''` | 지출 메모 (구매처, 내역 등) | - |
  | `"isSample"` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
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
  | `"createdDate"` | `text` | NOT NULL | `CURRENT_DATE::text` | 접수 일자 (`YYYY-MM-DD`) | - |
  | `status` | `text` | NOT NULL | `'new'` | 처리 상태 (`new`: 연락 대기, `done`: 연락 완료) | - |
  | `name` | `text` | NOT NULL | `''` | 손님 성함 | **개인정보** |
  | `phone` | `text` | NOT NULL | `''` | 손님 연락처 | **개인정보** |
  | `date` | `text` | - | `''` | 수령 희망일 ("미정" 또는 일자 문자열) | - |
  | `type` | `text` | - | `''` | 상담 유형 (맞춤 꽃다발, 웨딩, 정기구독 등) | - |
  | `"productName"` | `text` | - | `''` | 문의 관련 특정 상품명 | - |
  | `message` | `text` | NOT NULL | `''` | 손님이 남긴 상담 내용 본문 | **개인정보** |
  | `memo` | `text` | - | `''` | 사장님 전용 상담 기록 메모 | **개인정보** |
  | `"contactedAt"` | `text` | - | `''` | 사장님 연락 일시 ("YYYY-MM-DDTHH:mm" 또는 빈값) | - |
  | `replies` | `jsonb` | NOT NULL | `'[]'::jsonb` | 과거 답변 또는 상담 로그 (`[{ at, text }]`) | - |
  | `"isSample"` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_inquiries_status` ON (`status`, `"createdDate"` DESC)

---

### 6) 재입고 알림 신청 (`restock`)
- **목적**: 품절 상품에 대해 손님이 재입고 시 문자/연락을 받기 위해 등록한 알림 신청
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 알림 신청 고유 식별자 | - |
  | `"productId"` | `text` | - | NULL | 대상 상품 식별자 (상품 삭제 시 NULL) | - |
  | `"productName"` | `text` | NOT NULL | - | 대상 상품명 (상품 삭제 후에도 보존) | - |
  | `name` | `text` | - | `''` | 신청자 성함 (선택 입력) | **개인정보** |
  | `phone` | `text` | NOT NULL | `''` | 알림받을 연락처 | **개인정보** |
  | `"createdDate"` | `text` | NOT NULL | `CURRENT_DATE::text` | 신청 일자 (`YYYY-MM-DD`) | - |
  | `status` | `text` | NOT NULL | `'waiting'` | 알림 상태 (`waiting`: 대기, `notified`: 발송 완료) | - |
  | `"isSample"` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
- **기본키(PK)**: `id`
- **외래키(FK)**:
  - `FOREIGN KEY ("productId") REFERENCES public.products (id) ON DELETE SET NULL`
- **인덱스**:
  - `idx_restock_product_status` ON (`"productId"`, `status`)

---

### 7) 공지/이벤트 팝업 (`popups`)
- **목적**: 쇼핑몰 첫 화면에 띄우는 슬라이더 형태의 공지 및 프로모션 안내
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 팝업 슬라이드 고유 식별자 | - |
  | `active` | `boolean` | NOT NULL | `true` | 슬라이드 활성화 여부 | - |
  | `"order"` | `integer` | NOT NULL | `0` | 슬라이드 정렬 순서 (예약어) | - |
  | `image` | `text` | NOT NULL | `''` | 팝업 배경/대표 사진 주소 | - |
  | `title` | `text` | NOT NULL | - | 팝업 제목 (한국어) | - |
  | `text` | `text` | NOT NULL | `''` | 팝업 설명 문구 (한국어) | - |
  | `"titleEn"` | `text` | - | `''` | 영문 제목 | - |
  | `"textEn"` | `text` | - | `''` | 영문 설명 | - |
  | `"titleJa"` | `text` | - | `''` | 일문 제목 | - |
  | `"textJa"` | `text` | - | `''` | 일문 설명 | - |
  | `"buttonLabel"` | `text` | - | `'자세히 보기'` | 버튼 문구 | - |
  | `"linkType"` | `text` | NOT NULL | `'none'` | 링크 형식 (`none`, `url`, `internal`) | - |
  | `url` | `text` | - | `''` | 외부 링크 주소 | - |
  | `"internalTarget"` | `text` | - | `''` | 내부 이동 화면 (`shop`, `story`, `custom` 등) | - |
  | `"startDate"` | `text` | - | `''` | 팝업 게시 시작일 (`YYYY-MM-DD` 또는 빈값) | - |
  | `"endDate"` | `text` | - | `''` | 팝업 게시 종료일 (`YYYY-MM-DD` 또는 빈값) | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_popups_display` ON (`active`, `"order"`)

---

### 8) 정성 안내 및 약관 페이지 (`pages`)
- **목적**: 보자기 포장 안내, 생화 관리 팁, 배송 안내, 환불 정책, 이용약관, 개인정보처리방침 본문
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 페이지 고유 식별자 (`bojagi`, `care`, `terms` 등) | - |
  | `title` | `text` | NOT NULL | - | 페이지 제목 | - |
  | `body` | `text` | NOT NULL | - | 마크다운 포맷의 본문 내용 | - |
  | `"updatedAt"` | `text` | NOT NULL | `''` | 마지막 수정 일시 | - |
  | `media` | `jsonb` | - | `'{}'::jsonb` | 안내 사진/영상 구성 (`{ ratio, images, video }`) | - |
- **기본키(PK)**: `id`

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
  | `"nameEn"` | `text` | - | `''` | 꽃 영문 명칭 | - |
  | `"nameJa"` | `text` | - | `''` | 꽃 일문 명칭 | - |
  | `meaning` | `text` | NOT NULL | `''` | 꽃말 (한글) | - |
  | `"meaningEn"` | `text` | - | `''` | 꽃말 (영문) | - |
  | `"meaningJa"` | `text` | - | `''` | 꽃말 (일문) | - |
  | `months` | `jsonb` | NOT NULL | `'[]'::jsonb` | 제철 월 배열 (예: `[3, 4, 5]`) | - |
  | `"yearRound"` | `boolean` | NOT NULL | `false` | 연중 사계절 유통 여부 | - |
  | `colors` | `text` | - | `''` | 주요 화색 (쉼표 구분) | - |
  | `care` | `text` | - | `''` | 가정 내 손질 및 관리 방법 | - |
  | `image` | `text` | - | `''` | 꽃 사전 대표 사진 주소 | - |
  | `"guideText"` | `text` | - | `''` | 상세 관리 도감 텍스트 | - |
  | `"guideImages"` | `jsonb` | - | `'[]'::jsonb` | 관리 가이드 추가 사진 주소 배열 | - |
  | `"guideVideo"` | `text` | - | `''` | 관리 가이드 동영상 주소 | - |
- **기본키(PK)**: `id`
- **인덱스**:
  - `idx_flowers_year_round` ON (`"yearRound"`)

---

### 11) 오프라인 쿠폰 (`coupons`)
- **목적**: 인쇄물로 손님께 전달되어 결제 시 1회 사용되는 할인 쿠폰 코드
- **보안 규칙**: 손님 기기는 이 테이블에 대한 직접 수정(UPDATE) 권한이 전혀 없습니다. 쿠폰 조회는 `check_coupon` RPC로만 가능하며, 사용 처리는 주문 등록 시 `submit_order_transaction` 함수가 안전하게 검증 및 단일 트랜잭션으로 처리합니다.
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `code` | `text` | NOT NULL | - | 쿠폰 코드 (`SDH-XXXX-XXXX`) | - |
  | `"batchId"` | `text` | NOT NULL | - | 쿠폰 묶음 식별자 (`batch-...`) | - |
  | `"batchName"` | `text` | NOT NULL | - | 쿠폰 묶음 명칭 | - |
  | `type` | `text` | NOT NULL | `'amount'` | 할인 유형 (`amount`: 정액 할인, `percent`: 정률 할인) | - |
  | `value` | `numeric(12,0)` | NOT NULL | `0` | 할인값 (금액 또는 할인율) | - |
  | `"minOrder"` | `numeric(12,0)` | NOT NULL | `0` | 최소 주문 가능 금액 (원) | - |
  | `"startDate"` | `text` | NOT NULL | - | 유효기간 시작일 (`YYYY-MM-DD`) | - |
  | `"endDate"` | `text` | NOT NULL | - | 유효기간 만료일 (`YYYY-MM-DD`) | - |
  | `active` | `boolean` | NOT NULL | `true` | 쿠폰 사용 가능 여부 | - |
  | `"createdAt"` | `text` | NOT NULL | `''` | 쿠폰 발행 일시 (ISO 문자열) | - |
  | `"usedAt"` | `text` | - | `''` | 쿠폰 사용 일시 (미사용 시 빈값) | - |
  | `"orderNumber"` | `text` | - | `''` | 쿠폰을 사용한 주문번호 | - |
- **기본키(PK)**: `code`
- **인덱스**:
  - `idx_coupons_batch` ON (`"batchId"`)
  - `idx_coupons_active_dates` ON (`active`, `"startDate"`, `"endDate"`)

---

### 12) 쿠폰 발행 묶음 이력 (`coupon_history`)
- **목적**: 관리자가 대량 생성한 쿠폰 묶음의 통계 및 발행 히스토리 보관
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 묶음 이력 고유 식별자 (`coupon_history.id`) | - |
  | `"batchName"` | `text` | NOT NULL | - | 쿠폰 묶음 명칭 | - |
  | `type` | `text` | NOT NULL | - | 할인 방식 (`amount` / `percent`) | - |
  | `value` | `numeric(12,0)` | NOT NULL | `0` | 할인 혜택 수치 | - |
  | `"minOrder"` | `numeric(12,0)` | NOT NULL | `0` | 최소 기준 금액 (원) | - |
  | `"startDate"` | `text` | NOT NULL | - | 행사 시작일 (`YYYY-MM-DD`) | - |
  | `"endDate"` | `text` | NOT NULL | - | 행사 종료일 (`YYYY-MM-DD`) | - |
  | `created` | `integer` | NOT NULL | `0` | 총 발행된 매수 | - |
  | `used` | `integer` | NOT NULL | `0` | 실제 사용된 매수 | - |
  | `"usedDates"` | `jsonb` | NOT NULL | `'[]'::jsonb` | 사용 일시 기록 배열 | - |
  | `"archivedAt"` | `text` | NOT NULL | `''` | 묶음 생성/기록 일시 | - |
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
  | `"createdAt"` | `text` | NOT NULL | `''` | 업로드 일시 | - |
- **기본키(PK)**: `id`

---

### 14) 상품 후기 (`reviews` — 신규 계획 테이블)
- **목적**: 배송 완료 손님이 남겨주신 정성스러운 포토/텍스트 후기와 사장님의 답글
- **보안 및 개인정보**:
  - 작성자 이름 컬럼(`name`)은 일절 존재하지 않으며(익명성 보장), 화면에도 표시하지 않습니다.
  - `photos`는 저장된 사진 파일 경로 배열(`jsonb`), `video`는 저장된 영상 파일 경로(`text`)입니다.
  - 승인된(`status = 'approved'`) 후기만 일반에 공개되며, 승인 대기 중(`pending`)인 후기의 사진 및 영상 파일은 anon 사용자가 절대 열람할 수 없습니다 (Private Storage 유지).
- **컬럼 목록**:
  | 컬럼명 | PostgreSQL 타입 | NOT NULL | 기본값 | 설명 및 의미 | 개인정보 |
  |---|---|---|---|---|---|
  | `id` | `text` | NOT NULL | - | 후기 고유 식별자 (`rev-...`) | - |
  | `"orderId"` | `text` | - | NULL | 주문 식별자 (주문 삭제 시 NULL) | - |
  | `"orderNumber"` | `text` | NOT NULL | - | 주문번호 (완료 주문 검증용) | - |
  | `"productId"` | `text` | - | NULL | 후기 대상 상품 식별자 (상품 삭제 시 NULL) | - |
  | `"productName"` | `text` | NOT NULL | - | 후기 대상 상품명 | - |
  | `recipient` | `text` | NOT NULL | `'other'` | 꽃 선물 대상 사연 코드 (parents, lover, friend, celebrate, comfort, self, other) | - |
  | `rating` | `integer` | NOT NULL | `5` | 별점 (1~5점) | - |
  | `text` | `text` | NOT NULL | - | 손님이 쓴 후기 글 본문 (10~500자) | - |
  | `photos` | `jsonb` | NOT NULL | `'[]'::jsonb` | 첨부 사진 저장 경로 배열 (최대 3장) | - |
  | `video` | `text` | - | `''` | 첨부 영상 저장 경로 (최대 1개) | - |
  | `status` | `text` | NOT NULL | `'pending'` | 승인 상태 (`pending`: 대기, `approved`: 공개, `hidden`: 숨김) | - |
  | `"adminReply"` | `text` | - | `''` | 사장님 답글 본문 | - |
  | `"replyAt"` | `text` | - | NULL | 사장님 답글 등록 일시 | - |
  | `"createdAt"` | `text` | NOT NULL | `''` | 후기 작성 일시 (ISO 문자열) | - |
  | `"isSample"` | `boolean` | NOT NULL | `false` | 예시 데이터 여부 | - |
- **기본키(PK)**: `id`
- **외래키(FK)**:
  - `FOREIGN KEY ("orderId") REFERENCES public.orders (id) ON DELETE SET NULL`
  - `FOREIGN KEY ("productId") REFERENCES public.products (id) ON DELETE SET NULL`
- **인덱스**:
  - `idx_reviews_public` ON (`status`, `"createdAt"` DESC)
  - `idx_reviews_order` ON (`"orderId"`)

---

## 6. 행 수준 보안 (RLS) 및 RPC 보안 함수 설계

현재 `server.py`의 접근 제어 원칙을 Supabase RLS 정책과 RPC 함수로 100% 동일하게 구현합니다.

### 1) 접근 권한 매트릭스

| 대상 테이블 | 익명 방문자 (anon) | 주문 손님 (anon) | 관리자 (`is_admin()` / 사장님) |
|---|---|---|---|
| `products` | **읽기 전용** (`visibility='public'` 또는 예약시간 도래 건) | 읽기 전용 | 전체 읽기 / 쓰기 / 삭제 |
| `orders` | 직접 접근 불가 (조회는 `lookup_order` RPC 함수로만) | 직접 접근 불가 (`submit_order_transaction` 함수로 접수) | 전체 읽기 / 수정 / 관리 |
| `order_items` | 직접 접근 불가 | 직접 접근 불가 (`submit_order_transaction` 함수로 접수) | 전체 읽기 / 수정 / 관리 |
| `inquiries` | 직접 접근 불가 | **새 상담 등록(INSERT)만 가능** | 전체 읽기 / 수정 / 답변 관리 |
| `restock` | 직접 접근 불가 | **새 알림 등록(INSERT)만 가능** | 전체 읽기 / 수정 / 관리 |
| `popups` | **읽기 전용** (`active=true` 이고 기간 내인 슬라이드) | 읽기 전용 | 전체 읽기 / 쓰기 / 순서 변경 |
| `pages` | **읽기 전용** (누구나 조회 가능) | 읽기 전용 | 전체 읽기 / 수정 |
| `settings` | **읽기 전용** (내부 비밀번호 키 제외) | 읽기 전용 | 전체 읽기 / 수정 |
| `flowers` | **읽기 전용** (꽃 사전 도감 누구나 조회) | 읽기 전용 | 전체 읽기 / 쓰기 / 삭제 |
| `coupons` | 직접 접근 불가 (확인은 `check_coupon` RPC 함수로만) | **직접 수정 불가 (트랜잭션 함수 자동 처리)** | 전체 쿠폰 발행 / 폐기 / 내역 조회 |
| `coupon_history` | 접근 불가 | 접근 불가 | 전체 읽기 / 등록 |
| `expenses` | **접근 불가 (철저한 보안)** | 접근 불가 | 전체 읽기 / 등록 / 삭제 |
| `images` | **읽기 전용** (공개 사진 주소 조회) | 읽기 전용 | 사진 등록 / 삭제 |
| `reviews` | **읽기 전용** (`status='approved'` 승인 건만 노출) | **완료 주문 건에 한해 등록(INSERT)** | 승인/반려/답글 달기 전체 권한 |

---

### 2) 핵심 보안 RPC 함수 상세 및 보안 원칙

1. **관리자 판별 함수 (`is_admin`)**
   - 사장님 로그인 세션의 JWT 메타데이터(`auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`)를 판별하여 안전하게 관리자 여부를 반환합니다. `SET search_path = public` 적용.
2. **손님용 쿠폰 확인 함수 (`check_coupon(p_code)`)**
   - `server.py`의 `COUPON_PUBLIC` 원칙과 동일하게 코드 일치 시 `code`, `batchName`, `type`, `value`, `minOrder`, `startDate`, `endDate`, `active`, `used` 만 반환하여 쿠폰 테이블의 전체 내역이 외부에 노출되지 않도록 방어합니다.
3. **손님용 단건 주문 조회 함수 (`lookup_order(p_order_number, p_phone)`)**
   - 손님이 주문번호와 주문자 연락처(숫자만 비교)를 정확히 입력했을 때만 해당 주문 1건과 소속 품목 목록(`order_items`)을 안전하게 돌려줍니다.
   - **개인정보 보호**: 쇼핑몰 주문 조회 화면에 필요한 필드(`orderNumber`, `createdDate`, `status`, `deliveryMethodLabel`, `deliveryDate`, `itemsTotal`, `deliveryFee`, `couponDiscount`, `totalAmount`, `courier`, `trackingNumber`)만 반환하며, 받는 분 성함은 `김*희` 형태로 마스킹 처리합니다. 손님의 전화번호, 배송지 상세 주소, 관리자 메모 등은 절대 반환하지 않습니다.
4. **주문 통합 접수 단일 트랜잭션 함수 (`submit_order_transaction(p_order, p_items)`)**
   - **날짜별 주문 상한 검증**: 주문의 배송일자(`deliveryDate`)를 기준으로 `settings`의 `delivery` 설정에 등록된 특정일 상한(`dateLimits`) 또는 기본 일일 상한(`dailyLimit`)을 조회합니다. 취소 및 예시 주문을 제외한 해당 날짜의 유효 주문 건수가 상한에 도달한 경우 **주문 전체를 거부 및 롤백**합니다.
   - **금액 불신뢰 원칙**: 손님 기기에서 전달된 단가, 합계, 배송비, 할인금액, 총액을 일절 신뢰하지 않고 DB 내부에서 직접 재계산합니다.
   - **상품 및 가격 검증**: 각 품목의 `productId`로 상품을 조회하고 비공개/예약공개 미도래 건은 즉시 주문을 거부합니다. 품목의 `sizeLabel`이 일치하면 해당 사이즈 단가를, 없으면 기본 단가를 적용합니다.
   - **배송비 재계산**: `settings`의 `delivery` 설정을 읽어 무료배송 기준(`freeOver`)과 배송방식별 요금을 엄격히 계산하며 음수 값은 거부합니다.
   - **쿠폰 유효성 엄격 검증**: 쿠폰 코드가 제공된 경우 존재 여부, 활성 상태, 유효기간, 최소 주문금액, 기사용 여부를 검증하며 위반 시 **주문 전체를 즉시 롤백 및 거부**합니다. 유효한 경우에만 할인금액을 계산(퍼센트는 100원 단위 절사)하고 즉시 `usedAt`을 기록합니다.
   - **원자적 일괄 처리 및 중복 방지**: 중복 주문번호를 거부하고, `status='preparing'`, `isSample=false`를 강제 적용하며, "재고 차감 → 주문서 등록 → 주문 품목 등록 → 쿠폰 사용 처리"를 단일 트랜잭션으로 원자적으로 처리합니다.
   - **쿠폰 업데이트 방식**: 함수 내부에서 유효성 검증과 함께 단일 트랜잭션으로 쿠폰을 사용 처리하므로, 중복 실행을 막기 위해 별도의 주문 INSERT 트리거는 사용하지 않고 함수 내부 업데이트 방식을 유지합니다.

---

## 7. 파일 및 이미지 저장소 (Supabase Storage) 계획

1. **저장소 버킷(Bucket) 구성**
   - `product-photos`: 상품 대표 사진 및 갤러리 상세 사진 (공개 읽기 허용)
   - `page-media`: 보자기 포장 영상, 매장 안내 사진 등 (공개 읽기 허용)
   - `review-media`: 손님이 올리는 후기 사진 및 짧은 영상
     - **보안 규칙**: 사장님이 후기를 승인(`status = 'approved'`)하기 전까지는 **비공개(Private)** 상태로 보관되며, 승인된 후기의 미디어만 일반 손님에게 공개됩니다.
     - 파일 제한: 사진 최대 3장 (장당 300KB 이하 JPEG, 긴 축 1000px 이하로 브라우저 압축), 영상 최대 1개 (30초 이내, 20MB 이하, mp4/webm/mov).
   - `originals`: **비공개(Private) 원본 사진 보관소**
     - **보안 정책(RLS/Storage Policy)**: Public Read 정책 없음. Anon 및 Authenticated 정책 일체 없음. 오직 서버 권한의 `service_role` 키로만 업로드 및 조회가 가능합니다.
     - **운영 원칙**: 쇼핑몰 노출용 사진은 도장 낙관이 합성된 상태로 공개 버킷(`product-photos` 등)에 올라가며, 무낙관 고화질 원본은 본 `originals` 비공개 버킷에 안전하게 백업 보관됩니다.
     - **실 서비스 전환(Going Live) 시 보안 주의사항**: `service_role` 키는 반드시 서버 환경(`DATA/.supabase.json` 또는 서버 환경변수)에만 존재해야 하며, 브라우저·CSV·로그·백업 파일·Git 어디에도 절대 노출되어서는 안 됩니다. 만약 향후 로컬 `server.py`를 제거하고 완전한 서버리스 환경으로 이전할 경우, 이 원본 업로드 처리는 브라우저 코드가 아닌 **Supabase Edge Function**으로 이전하여 서버 키를 보호해야 합니다.

---

## 8. 데이터 이전 시 특별 주의사항 및 향후 정리 과제

### 1) 외래키 충돌 방지 및 안전한 데이터 이전 (Migration)
- 기존 CSV(`order_items.csv`, `restock.csv`)에는 테스트용 예시 상품이나 과거 삭제된 상품을 참조하는 레코드가 존재할 수 있습니다.
- **이전 처리 방안**:
  1. 마이그레이션 스크립트 실행 시 대상 상품이 `products` 테이블에 없는 경우 `productId`를 `NULL`로 설정하여 임포트합니다. (`productName` 컬럼에 당시 상품명이 그대로 보관되어 있으므로 과거 주문 내역이나 고객 신청 내역이 손상되지 않습니다.)
  2. 또는 외래키 제약조건(`CONSTRAINT fk_...`) 생성을 데이터 임포트 완료 및 정리 작업 이후에 적용합니다.

### 2) 나중에 정리할 것 (마이그레이션 완료 후 일회성 변환 과제)
기존 데이터가 안전하게 데이터베이스로 이전된 직후, 아래 항목에 대해 일회성 데이터 정돈 스크립트를 실행하여 정식 타입으로 변환합니다:
1. **배송 희망일 분리 (`orders.deliveryDate`)**:
   - 현재 `"YYYY-MM-DD 오후 14:00~18:00"` 형태로 결합되어 있는 텍스트를 날짜 컬럼(`deliveryDate` `date`)과 시간대 슬롯(`deliverySlot` `text`)으로 깔끔하게 분리합니다.
2. **주문 접수 일시 정식 타임스탬프화 (`orders.createdAt`)**:
   - 현재 한글 시각 문자열(`"오후 02:43"`)과 접수일자(`"2026-11-03"`)를 결합하여 실제 한국 표준시(`Asia/Seoul`, UTC+9)가 반영된 `timestamptz` 컬럼으로 변환합니다.
3. **상품 예약 공개 시각 타임존 부여 (`products.publishAt`)**:
   - 타임존 없는 로컬 문자열(`"YYYY-MM-DDTHH:mm"`)에 한국 시간대(`Asia/Seoul`)를 결합하여 `timestamptz`로 변환합니다.
4. **상담 연락 일시 정돈 (`inquiries.contactedAt`)**:
   - `"YYYY-MM-DDTHH:mm"` 문자열을 한국 시간 `timestamptz`로, 빈 문자열(`''`)은 `NULL`로 변환합니다.
5. **쿠폰 사용 일시 정돈 (`coupons.usedAt`)**:
   - 빈 문자열(`''`)은 `NULL`로, 사용된 건은 정식 `timestamptz`로 변환합니다.
6. **일자 컬럼의 정식 `date` 변환**:
   - `expenses.date`, `restock.createdDate`, `inquiries.createdDate` 등의 문자열 데이터를 검증 후 순수 `date` 타입으로 정돈합니다.

---

## 9. 단계별 이전 로드맵 (Migration Steps)

```text
[1단계] CSV 최신본 수집 ──> [2단계] Supabase 스키마 생성 ──> [3단계] 의존성 순서 데이터 입력
                                                                         │
[6단계] 데이터 건수 검증 <── [5단계] DataStore 연동 전환 <── [4단계] Storage 파일 이전
       │
[7단계] 일회성 데이터 정돈 (나중에 정리할 것)
       │
[8단계] 최종 CSV 백업 보관
```

1. **1단계: CSV 내보내기**  
   - 관리자 센터의 [지금 CSV로 저장] 또는 로컬 서버의 `DATA/*.csv` 최신본을 모두 수집합니다.
2. **2단계: 테이블 생성**  
   - `docs/supabase-schema.sql`을 실행하여 PostgreSQL 테이블, 인덱스, 함수 및 제약조건을 생성합니다.
3. **3단계: 의존성 순서에 맞춘 데이터 입력**  
   - 외래키 오류가 나지 않도록 다음 순서로 데이터를 삽입합니다:  
     `settings` → `flowers` → `products` → `popups` → `pages` → `coupons` → `coupon_history` → `orders` → `order_items` → `expenses` → `inquiries` → `restock` → `images`
4. **4단계: 이미지를 Storage로 이전**  
   - 사진 파일들을 Supabase Storage에 업로드하고 주소를 CDN URL로 갱신합니다.
5. **5단계: DataStore 연동 전환**  
   - [65]에서 구축한 [`assets/js/data-store.js`](file:///c:/Users/504-19/Desktop/SeolDamHwa/assets/js/data-store.js)의 내부 구현을 Supabase JS 클라이언트 호출로 교체합니다. (화면 코드는 전혀 손댈 필요가 없습니다.)
6. **6단계: 데이터 건수 및 기능 검증**  
   - 이전 전 CSV 줄 수와 데이터베이스 테이블 행 수가 정확히 일치하는지 확인하고 결제, 주문 조회, 쿠폰 적용을 테스트합니다.
7. **7단계: 일회성 데이터 정돈**  
   - 섹션 8-2의 계획에 따라 `orders.deliveryDate`, `orders.createdAt` 등의 컬럼을 정식 타입으로 분리 및 변환합니다.
8. **8단계: 최종 CSV 백업 보관**  
   - 만약의 상황에 대비해 이전 직전의 CSV 파일들을 안전한 별도 보관소에 영구 보관합니다.
