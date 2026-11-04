-- ==============================================================================
-- 설담화(說談花) Supabase / PostgreSQL 데이터베이스 스키마
-- 초안 — 아직 실행하지 않음. 실행 전 사장님 확인 필요
--
-- 대상: 13개 기존 테이블 (products, orders, order_items, expenses, inquiries,
--       restock, popups, pages, settings, flowers, coupons, coupon_history, images)
--       + 1개 신규 테이블 (reviews)
--
-- 규칙:
-- 1. 대소문자 유지: 앱이 camelCase 키를 읽으므로, 모든 camelCase 컬럼명은 큰따옴표로 감쌉니다.
-- 2. 실제 저장 형식 준수: 한글 시간 문자열("오후 02:43"), 시간대 슬롯("2026-11-05 오후 14:00~18:00"),
--    타임존 없는 한국 로컬 시각("2026-11-10T14:00"), 빈 문자열('') 등이 안전하게 임포트되도록 text 타입을 사용합니다.
-- 3. 관리자 권한 확인: Supabase JWT role은 항상 'authenticated'이므로 app_metadata를 확인하는
--    is_admin() 함수를 사용합니다.
-- 4. Supabase 보안 린터: 모든 SECURITY DEFINER 함수에 SET search_path = public 적용 및 최소 권한 GRANT.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 관리자 여부 확인 헬퍼 함수
-- 사장님 계정의 app_metadata -> role 값이 'admin'인지 안전하게 확인합니다.
-- 사장님 계정 설정: Supabase 대시보드 Authentication -> Users -> 사장님 계정 선택
-- -> App Metadata에 {"role": "admin"} 저장
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;


-- 1. 매장 설정 (settings)
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL
);

-- 2. 꽃 사전 (flowers)
CREATE TABLE IF NOT EXISTS public.flowers (
    id text PRIMARY KEY,
    name text NOT NULL,
    "nameEn" text DEFAULT '',
    "nameJa" text DEFAULT '',
    meaning text NOT NULL DEFAULT '',
    "meaningEn" text DEFAULT '',
    "meaningJa" text DEFAULT '',
    months jsonb NOT NULL DEFAULT '[]'::jsonb,
    "yearRound" boolean NOT NULL DEFAULT false,
    colors text DEFAULT '',
    care text DEFAULT '',
    image text DEFAULT '',
    "guideText" text DEFAULT '',
    "guideImages" jsonb DEFAULT '[]'::jsonb,
    "guideVideo" text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_flowers_year_round ON public.flowers ("yearRound");

-- 3. 상품 (products)
-- 주의: stockQuantity는 상담 상품(inquiryOnly)의 경우 재고가 없으므로 NULL을 허용합니다 (기본값 0 강제 금지).
-- curationTags는 객체({ recipients: [], occasions: [], ... })이므로 기본값은 '{}'::jsonb입니다.
-- homeOrder는 빈 값일 때 관리자 자동 정렬이므로 999 대신 NULL을 허용합니다.
-- publishAt은 타임존 없는 한국 로컬 시각 문자열("YYYY-MM-DDTHH:mm")이 저장되므로 text 타입입니다.
CREATE TABLE IF NOT EXISTS public.products (
    id text PRIMARY KEY,
    name text NOT NULL,
    "englishName" text DEFAULT '',
    category text NOT NULL DEFAULT 'bouquet',
    price numeric(12,0) NOT NULL DEFAULT 0,
    sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
    "inquiryOnly" boolean NOT NULL DEFAULT false,
    "poeticLine" text DEFAULT '',
    "flowerMeaning" text DEFAULT '',
    description text DEFAULT '',
    "stockQuantity" integer DEFAULT NULL,
    image text NOT NULL DEFAULT '',
    visibility text NOT NULL DEFAULT 'public',
    "publishAt" text DEFAULT NULL,
    "curationTags" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "hideOnHome" boolean NOT NULL DEFAULT false,
    "homeOrder" integer DEFAULT NULL,
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    flowers jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON public.products (visibility, "publishAt");
CREATE INDEX IF NOT EXISTS idx_products_home ON public.products ("hideOnHome", "homeOrder");

-- 4. 공지 팝업 (popups)
-- "order"는 SQL 예약어이므로 큰따옴표로 감쌉니다.
CREATE TABLE IF NOT EXISTS public.popups (
    id text PRIMARY KEY,
    active boolean NOT NULL DEFAULT true,
    "order" integer NOT NULL DEFAULT 0,
    image text NOT NULL DEFAULT '',
    title text NOT NULL,
    text text NOT NULL DEFAULT '',
    "titleEn" text DEFAULT '',
    "textEn" text DEFAULT '',
    "titleJa" text DEFAULT '',
    "textJa" text DEFAULT '',
    "buttonLabel" text DEFAULT '자세히 보기',
    "linkType" text NOT NULL DEFAULT 'none',
    url text DEFAULT '',
    "internalTarget" text DEFAULT '',
    "startDate" text DEFAULT '',
    "endDate" text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_popups_display ON public.popups (active, "order");

-- 5. 정성 안내 및 약관 페이지 (pages)
CREATE TABLE IF NOT EXISTS public.pages (
    id text PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    "updatedAt" text NOT NULL DEFAULT '',
    media jsonb DEFAULT '{}'::jsonb
);

-- 6. 할인 쿠폰 (coupons)
-- 손님 기기는 이 테이블에 대한 직접 UPDATE/SELECT 권한이 없습니다.
-- 쿠폰 확인은 check_coupon RPC로, 사용 처리는 submit_order_transaction 단일 트랜잭션 함수가 서버에서 안전하게 검증 및 처리합니다.
-- usedAt은 미사용 시 빈 문자열('')이 들어올 수 있으므로 text 타입으로 보관합니다.
CREATE TABLE IF NOT EXISTS public.coupons (
    code text PRIMARY KEY,
    "batchId" text NOT NULL,
    "batchName" text NOT NULL,
    type text NOT NULL DEFAULT 'amount',
    value numeric(12,0) NOT NULL DEFAULT 0,
    "minOrder" numeric(12,0) NOT NULL DEFAULT 0,
    "startDate" text NOT NULL,
    "endDate" text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    "createdAt" text NOT NULL DEFAULT '',
    "usedAt" text DEFAULT '',
    "orderNumber" text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_coupons_batch ON public.coupons ("batchId");
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates ON public.coupons (active, "startDate", "endDate");

-- 7. 쿠폰 발행 이력 (coupon_history)
CREATE TABLE IF NOT EXISTS public.coupon_history (
    id text PRIMARY KEY,
    "batchName" text NOT NULL,
    type text NOT NULL,
    value numeric(12,0) NOT NULL DEFAULT 0,
    "minOrder" numeric(12,0) NOT NULL DEFAULT 0,
    "startDate" text NOT NULL,
    "endDate" text NOT NULL,
    created integer NOT NULL DEFAULT 0,
    used integer NOT NULL DEFAULT 0,
    "usedDates" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "archivedAt" text NOT NULL DEFAULT ''
);

-- 8. 주문 (orders)
-- createdAt은 한글 시각 문자열("오후 02:43" 등)이므로 text 타입입니다.
-- deliveryDate는 시간대 슬롯("2026-11-05 오후 14:00~18:00")이 포함될 수 있으므로 text 타입입니다.
-- address는 픽업 주문의 경우 비어있으므로 NOT NULL을 요구하지 않습니다.
-- 과거 주문 데이터 호환을 위해 recipientName, recipientPhone, ordererName 등도 빈 문자열을 허용합니다.
-- orderNumber에 UNIQUE 제약조건이 있으므로 별도의 idx_orders_number 인덱스는 생성하지 않습니다.
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY,
    "orderNumber" text NOT NULL UNIQUE,
    "createdDate" text NOT NULL DEFAULT CURRENT_DATE::text,
    "createdAt" text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'preparing',
    "ordererName" text DEFAULT '',
    "ordererPhone" text DEFAULT '',
    "recipientName" text DEFAULT '',
    "recipientPhone" text DEFAULT '',
    "customerName" text DEFAULT '',
    phone text DEFAULT '',
    zipcode text DEFAULT '',
    address text DEFAULT '',
    "deliveryMethod" text NOT NULL DEFAULT 'parcel',
    "deliveryMethodLabel" text DEFAULT '',
    "deliveryFee" numeric(12,0) NOT NULL DEFAULT 0,
    "itemsTotal" numeric(12,0) NOT NULL DEFAULT 0,
    "totalAmount" numeric(12,0) NOT NULL DEFAULT 0,
    "deliveryDate" text DEFAULT '',
    message text DEFAULT '',
    "hideSender" boolean NOT NULL DEFAULT false,
    request text DEFAULT '',
    courier text DEFAULT '',
    "trackingNumber" text DEFAULT '',
    "statusBeforeCancel" text DEFAULT '',
    "isSample" boolean NOT NULL DEFAULT false,
    "couponCode" text DEFAULT '',
    "couponDiscount" numeric(12,0) NOT NULL DEFAULT 0,
    "reviewRequestedAt" text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders ("createdDate" DESC, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_lookup ON public.orders ("orderNumber", "ordererPhone");

-- 9. 주문 품목 (order_items)
-- 외래키: 과거 샘플 상품이나 삭제된 상품의 주문 기록을 보존하기 위해 productId는 NULL을 허용하고 ON DELETE SET NULL 처리합니다.
CREATE TABLE IF NOT EXISTS public.order_items (
    "orderId" text NOT NULL,
    "lineNo" integer NOT NULL DEFAULT 1,
    "productId" text DEFAULT NULL,
    "productName" text NOT NULL,
    "sizeLabel" text DEFAULT '',
    price numeric(12,0) NOT NULL DEFAULT 0,
    "optionName" text DEFAULT '',
    "optionPrice" numeric(12,0) NOT NULL DEFAULT 0,
    quantity integer NOT NULL DEFAULT 1,
    PRIMARY KEY ("orderId", "lineNo"),
    CONSTRAINT fk_order_items_order FOREIGN KEY ("orderId") REFERENCES public.orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY ("productId") REFERENCES public.products (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items ("productId");

-- 10. 지출 (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id text PRIMARY KEY,
    date text NOT NULL DEFAULT CURRENT_DATE::text,
    category text NOT NULL DEFAULT 'flower',
    amount numeric(12,0) NOT NULL DEFAULT 0,
    method text NOT NULL DEFAULT 'card',
    memo text DEFAULT '',
    "isSample" boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (category);

-- 11. 1:1 맞춤 상담 문의 (inquiries)
-- date는 "미정" 또는 희망 날짜 문자열이 들어오므로 text 타입입니다.
-- contactedAt은 관리자에서 "YYYY-MM-DDTHH:mm" 또는 빈값('')으로 저장되므로 text 타입입니다.
CREATE TABLE IF NOT EXISTS public.inquiries (
    id text PRIMARY KEY,
    "createdDate" text NOT NULL DEFAULT CURRENT_DATE::text,
    status text NOT NULL DEFAULT 'new',
    name text NOT NULL DEFAULT '',
    phone text NOT NULL DEFAULT '',
    date text DEFAULT '',
    type text DEFAULT '',
    "productName" text DEFAULT '',
    message text NOT NULL DEFAULT '',
    memo text DEFAULT '',
    "contactedAt" text DEFAULT '',
    replies jsonb NOT NULL DEFAULT '[]'::jsonb,
    "isSample" boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status, "createdDate" DESC);

-- 12. 재입고 알림 신청 (restock)
-- 외래키: 상품이 삭제되더라도 손님의 재입고 요청 내역이 조용히 지워지지 않도록
-- ON DELETE CASCADE 대신 ON DELETE SET NULL을 적용합니다 (productId는 NULL 허용).
CREATE TABLE IF NOT EXISTS public.restock (
    id text PRIMARY KEY,
    "productId" text DEFAULT NULL,
    "productName" text NOT NULL,
    name text DEFAULT '',
    phone text NOT NULL DEFAULT '',
    "createdDate" text NOT NULL DEFAULT CURRENT_DATE::text,
    status text NOT NULL DEFAULT 'waiting',
    "isSample" boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_restock_product FOREIGN KEY ("productId") REFERENCES public.products (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_restock_product_status ON public.restock ("productId", status);

-- 13. 사진 보관함 (images)
CREATE TABLE IF NOT EXISTS public.images (
    id text PRIMARY KEY,
    name text NOT NULL,
    src text NOT NULL,
    width integer NOT NULL DEFAULT 0,
    height integer NOT NULL DEFAULT 0,
    "createdAt" text NOT NULL DEFAULT ''
);

-- 14. 상품 후기 (reviews — 신규 계획)
-- 손님 보호를 위해 작성자 이름 컬럼(name)은 아예 두지 않습니다.
-- photos는 업로드된 사진 파일 경로 배열(jsonb), video는 동영상 파일 경로(text)입니다.
CREATE TABLE IF NOT EXISTS public.reviews (
    id text PRIMARY KEY,
    "orderId" text DEFAULT NULL,
    "orderNumber" text NOT NULL,
    "productId" text DEFAULT NULL,
    "productName" text NOT NULL,
    rating integer NOT NULL DEFAULT 5,
    text text NOT NULL,
    photos jsonb NOT NULL DEFAULT '[]'::jsonb,
    video text DEFAULT '',
    status text NOT NULL DEFAULT 'pending',
    "adminReply" text DEFAULT '',
    "replyAt" text DEFAULT NULL,
    "createdAt" text NOT NULL DEFAULT '',
    "isSample" boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_reviews_order FOREIGN KEY ("orderId") REFERENCES public.orders (id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_product FOREIGN KEY ("productId") REFERENCES public.products (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_public ON public.reviews (status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews ("orderId");


-- ==============================================================================
-- 자동화 서버 함수 및 보안 RPC (Security Definer RPCs)
-- ==============================================================================

-- 1. 손님용 쿠폰 확인 RPC (check_coupon)
-- server.py의 COUPON_PUBLIC과 동일하게 공개 가능한 최소 필드만 반환합니다.
CREATE OR REPLACE FUNCTION public.check_coupon(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row record;
BEGIN
    SELECT code, "batchName", type, value, "minOrder", "startDate", "endDate", active, "usedAt"
    INTO v_row
    FROM public.coupons
    WHERE code = UPPER(TRIM(p_code));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false);
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'coupon', jsonb_build_object(
            'code', v_row.code,
            'batchName', v_row."batchName",
            'type', v_row.type,
            'value', v_row.value,
            'minOrder', v_row."minOrder",
            'startDate', v_row."startDate",
            'endDate', v_row."endDate",
            'active', v_row.active,
            'used', (v_row."usedAt" IS NOT NULL AND v_row."usedAt" <> '')
        )
    );
END;
$$;

-- 2. 손님용 단건 주문 조회 RPC (lookup_order)
-- 주문번호와 주문자 연락처(숫자만 비교)가 일치할 때 쇼핑몰 주문 조회 화면에 필요한 필드만 안전하게 반환합니다.
-- 개인정보 보호: 전화번호, 상세 주소, 메모, 내부 관리 필드는 일절 반환하지 않으며 받는 분 성함은 마스킹(김*희) 처리합니다.
CREATE OR REPLACE FUNCTION public.lookup_order(p_order_number text, p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone text;
    v_order record;
    v_masked_recipient text;
    v_items jsonb;
    v_rec_len int;
BEGIN
    v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
    IF LENGTH(v_clean_phone) < 9 OR p_order_number IS NULL OR TRIM(p_order_number) = '' THEN
        RETURN jsonb_build_object('ok', false, 'error', '주문번호와 연락처를 정확히 입력해 주세요.');
    END IF;

    SELECT "orderNumber", "createdDate", status, "deliveryMethodLabel", "deliveryDate",
           "recipientName", "itemsTotal", "deliveryFee", "couponDiscount", "totalAmount",
           courier, "trackingNumber", id
    INTO v_order
    FROM public.orders
    WHERE UPPER(TRIM("orderNumber")) = UPPER(TRIM(p_order_number))
      AND (
          regexp_replace(COALESCE("ordererPhone", ''), '\D', '', 'g') = v_clean_phone
          OR regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = v_clean_phone
      );

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false);
    END IF;

    -- 받는 분 성함 마스킹 처리 (예: 김*희, 홍*동, 이*)
    v_rec_len := length(COALESCE(v_order."recipientName", ''));
    IF v_rec_len <= 1 THEN
        v_masked_recipient := COALESCE(v_order."recipientName", '');
    ELSIF v_rec_len = 2 THEN
        v_masked_recipient := substr(v_order."recipientName", 1, 1) || '*';
    ELSE
        v_masked_recipient := substr(v_order."recipientName", 1, 1) || repeat('*', v_rec_len - 2) || substr(v_order."recipientName", v_rec_len, 1);
    END IF;

    -- 주문 품목 정보 (쇼핑몰 노출 필드만 선택: productName, sizeLabel, quantity, price)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'productName', i."productName",
        'sizeLabel', i."sizeLabel",
        'quantity', i.quantity,
        'price', i.price
    )), '[]'::jsonb)
    INTO v_items
    FROM public.order_items i
    WHERE i."orderId" = v_order.id;

    RETURN jsonb_build_object(
        'ok', true,
        'order', jsonb_build_object(
            'orderNumber', v_order."orderNumber",
            'createdDate', v_order."createdDate",
            'status', v_order.status,
            'deliveryMethodLabel', v_order."deliveryMethodLabel",
            'deliveryDate', v_order."deliveryDate",
            'recipientName', v_masked_recipient,
            'itemsTotal', v_order."itemsTotal",
            'deliveryFee', v_order."deliveryFee",
            'couponDiscount', v_order."couponDiscount",
            'totalAmount', v_order."totalAmount",
            'courier', v_order.courier,
            'trackingNumber', v_order."trackingNumber"
        ),
        'items', v_items
    );
END;
$$;

-- 3. 주문 통합 접수 단일 트랜잭션 RPC (submit_order_transaction)
-- 보안 원칙: 손님 기기에서 전달된 금액(단가, 배송비, 할인금액, 총액)은 일절 신뢰하지 않고 DB 내부에서 직접 재계산 및 검증합니다.
-- 쿠폰 처리 방식 결정: 함수 내부에서 쿠폰 유효성 검증과 즉시 사용 처리를 단일 트랜잭션으로 원자적으로 처리하므로,
-- 중복 실행을 방지하기 위해 별도의 INSERT 트리거는 사용하지 않고 함수 내부 업데이트 방식을 유지합니다.
CREATE OR REPLACE FUNCTION public.submit_order_transaction(
    p_order jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id text;
    v_order_number text;
    v_coupon_code text;
    v_method text;
    v_delivery_settings jsonb;
    v_delivery_fee numeric := 0;
    v_items_total numeric := 0;
    v_coupon_discount numeric := 0;
    v_total_amount numeric := 0;
    v_today text;
    v_now_kst text;
    v_delivery_date text;
    v_date_limit int := 0;
    v_order_count int := 0;

    v_item jsonb;
    v_prod_id text;
    v_size_label text;
    v_qty int;
    v_prod record;
    v_matched_price numeric;
    v_size_elem jsonb;
    v_coupon record;
BEGIN
    v_order_id := p_order ->> 'id';
    v_order_number := UPPER(TRIM(COALESCE(p_order ->> 'orderNumber', '')));
    v_coupon_code := UPPER(TRIM(COALESCE(p_order ->> 'couponCode', '')));
    v_method := COALESCE(p_order ->> 'deliveryMethod', 'parcel');
    v_today := to_char(CURRENT_DATE, 'YYYY-MM-DD');
    v_now_kst := to_char(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI');

    IF v_order_id IS NULL OR v_order_id = '' OR v_order_number = '' THEN
        RAISE EXCEPTION '주문 식별자 및 주문번호는 필수입니다.';
    END IF;

    -- 중복 주문번호 거부
    IF EXISTS (SELECT 1 FROM public.orders WHERE "orderNumber" = v_order_number) THEN
        RAISE EXCEPTION '이미 존재하는 주문번호입니다: %', v_order_number;
    END IF;

    -- 0) 배송일 주문 상한 검증 (deliveryDate 기준, 취소·예시 주문 제외)
    v_delivery_date := SPLIT_PART(TRIM(COALESCE(p_order ->> 'deliveryDate', '')), ' ', 1);
    IF v_delivery_date <> '' THEN
        SELECT value INTO v_delivery_settings FROM public.settings WHERE key = 'delivery';
        IF v_delivery_settings IS NOT NULL THEN
            IF v_delivery_settings ? 'dateLimits' THEN
                SELECT COALESCE((elem ->> 'limit')::int, 0)
                INTO v_date_limit
                FROM jsonb_array_elements(v_delivery_settings -> 'dateLimits') AS elem
                WHERE elem ->> 'date' = v_delivery_date
                LIMIT 1;
            END IF;
            IF v_date_limit IS NULL OR v_date_limit <= 0 THEN
                v_date_limit := COALESCE((v_delivery_settings ->> 'dailyLimit')::int, 0);
            END IF;

            IF v_date_limit > 0 THEN
                SELECT COUNT(*)
                INTO v_order_count
                FROM public.orders
                WHERE status <> 'cancelled'
                  AND "isSample" = false
                  AND SPLIT_PART("deliveryDate", ' ', 1) = v_delivery_date;

                IF v_order_count >= v_date_limit THEN
                    RAISE EXCEPTION '해당 배송일(%)은 주문이 마감되었습니다. (상한: %건)', v_delivery_date, v_date_limit;
                END IF;
            END IF;
        END IF;
    END IF;

    -- 1) 품목 검증, 가격 조회 및 재고 차감 (손님 기기의 단가/금액 무시)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := v_item ->> 'productId';
        v_size_label := TRIM(COALESCE(v_item ->> 'sizeLabel', ''));
        v_qty := COALESCE((v_item ->> 'quantity')::int, 1);
        IF v_qty <= 0 THEN
            RAISE EXCEPTION '품목 수량은 1개 이상이어야 합니다.';
        END IF;

        IF v_prod_id IS NULL OR v_prod_id = '' THEN
            RAISE EXCEPTION '주문 품목의 상품 ID가 누락되었습니다.';
        END IF;

        -- 상품 행 조회 및 락 획득 (동시 주문 충돌 방지)
        SELECT id, price, sizes, visibility, "publishAt", "stockQuantity", name
        INTO v_prod
        FROM public.products
        WHERE id = v_prod_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION '존재하지 않는 상품입니다 (ID: %)', v_prod_id;
        END IF;

        -- 공개 상태 및 예약 공개 일시 검증
        IF v_prod.visibility = 'private' THEN
            RAISE EXCEPTION '판매 중단된 상품입니다 (%: %)', v_prod.name, v_prod_id;
        ELSIF v_prod.visibility = 'scheduled' AND (v_prod."publishAt" IS NULL OR v_prod."publishAt" > v_now_kst) THEN
            RAISE EXCEPTION '아직 공개되지 않은 상품입니다 (%: %)', v_prod.name, v_prod_id;
        END IF;

        -- 사이즈별 단가 조회 (sizeLabel 매칭 시 sizes JSON 배열에서 가격 확인)
        v_matched_price := NULL;
        IF v_size_label <> '' AND v_prod.sizes IS NOT NULL AND jsonb_array_length(v_prod.sizes) > 0 THEN
            FOR v_size_elem IN SELECT * FROM jsonb_array_elements(v_prod.sizes)
            LOOP
                IF COALESCE(v_size_elem ->> 'label', v_size_elem ->> 'name') = v_size_label THEN
                    v_matched_price := (v_size_elem ->> 'price')::numeric;
                    EXIT;
                END IF;
            END LOOP;
        END IF;

        IF v_matched_price IS NULL THEN
            v_matched_price := v_prod.price;
        END IF;

        -- 재고 확인 및 차감 (상담 상품 등 stockQuantity가 NULL인 경우는 재고 무제한)
        IF v_prod."stockQuantity" IS NOT NULL THEN
            IF v_prod."stockQuantity" < v_qty THEN
                RAISE EXCEPTION '재고가 부족합니다 (% 남은 재고: %, 주문 수량: %)', v_prod.name, v_prod."stockQuantity", v_qty;
            END IF;

            UPDATE public.products
            SET "stockQuantity" = "stockQuantity" - v_qty
            WHERE id = v_prod_id;
        END IF;

        v_items_total := v_items_total + (v_matched_price * v_qty);
    END LOOP;

    -- 2) 배송비 계산 (settings 테이블의 delivery 기준, 음수 거부)
    IF v_method = 'pickup' THEN
        v_delivery_fee := 0;
    ELSE
        SELECT value INTO v_delivery_settings FROM public.settings WHERE key = 'delivery';
        IF v_delivery_settings IS NOT NULL THEN
            -- 무료 배송 기준 (freeOver > 0 및 itemsTotal >= freeOver)
            IF COALESCE((v_delivery_settings ->> 'freeOver')::numeric, 0) > 0
               AND v_items_total >= (v_delivery_settings ->> 'freeOver')::numeric THEN
                v_delivery_fee := 0;
            ELSE
                v_delivery_fee := COALESCE((v_delivery_settings -> v_method ->> 'fee')::numeric, 0);
            END IF;
        ELSE
            -- TODO: settings 테이블에 delivery 설정이 없는 경우 매장 기본값(택배 4000원)을 적용할 수 있습니다.
            v_delivery_fee := 0;
        END IF;
    END IF;

    IF v_delivery_fee < 0 THEN
        RAISE EXCEPTION '배송비는 음수일 수 없습니다: %', v_delivery_fee;
    END IF;

    -- 3) 쿠폰 유효성 검증 및 할인 금액 계산 (실패 시 주문 전체 롤백)
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon FROM public.coupons WHERE code = v_coupon_code FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION '존재하지 않는 쿠폰입니다: %', v_coupon_code;
        END IF;

        IF v_coupon.active = false THEN
            RAISE EXCEPTION '사용이 중단된 쿠폰입니다: %', v_coupon_code;
        END IF;

        IF v_coupon."usedAt" IS NOT NULL AND v_coupon."usedAt" <> '' THEN
            RAISE EXCEPTION '이미 사용된 쿠폰입니다: %', v_coupon_code;
        END IF;

        IF (v_coupon."startDate" <> '' AND v_today < v_coupon."startDate")
           OR (v_coupon."endDate" <> '' AND v_today > v_coupon."endDate") THEN
            RAISE EXCEPTION '유효기간이 아니거나 만료된 쿠폰입니다: %', v_coupon_code;
        END IF;

        IF v_items_total < v_coupon."minOrder" THEN
            RAISE EXCEPTION '최소 주문 금액(%원)을 충족하지 못했습니다.', v_coupon."minOrder";
        END IF;

        -- 할인 금액 계산 (coupons.js 원칙: 퍼센트 할인은 100원 단위 절사)
        IF v_coupon.type = 'percent' THEN
            v_coupon_discount := floor((v_items_total * least(v_coupon.value, 100)) / 100 / 100) * 100;
        ELSE
            v_coupon_discount := v_coupon.value;
        END IF;

        v_coupon_discount := greatest(0, least(v_coupon_discount, v_items_total));

        -- 쿠폰 사용 처리 (함수 내 단일 트랜잭션으로 업데이트)
        UPDATE public.coupons
        SET "usedAt" = to_char(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS'),
            "orderNumber" = v_order_number
        WHERE code = v_coupon_code;
    ELSE
        v_coupon_discount := 0;
    END IF;

    -- 4) 최종 결제 금액 산정
    v_total_amount := v_items_total + v_delivery_fee - v_coupon_discount;

    -- 5) 주문서(orders) 삽입 (status='preparing', isSample=false 강제)
    INSERT INTO public.orders (
        id, "orderNumber", "createdDate", "createdAt", status,
        "ordererName", "ordererPhone", "recipientName", "recipientPhone",
        "customerName", phone, zipcode, address, "deliveryMethod", "deliveryMethodLabel",
        "deliveryFee", "itemsTotal", "totalAmount", "deliveryDate", message,
        "hideSender", request, courier, "trackingNumber", "statusBeforeCancel",
        "isSample", "couponCode", "couponDiscount"
    ) VALUES (
        v_order_id,
        v_order_number,
        COALESCE(p_order ->> 'createdDate', v_today),
        COALESCE(p_order ->> 'createdAt', ''),
        'preparing',
        COALESCE(p_order ->> 'ordererName', ''),
        COALESCE(p_order ->> 'ordererPhone', ''),
        COALESCE(p_order ->> 'recipientName', ''),
        COALESCE(p_order ->> 'recipientPhone', ''),
        COALESCE(p_order ->> 'customerName', ''),
        COALESCE(p_order ->> 'phone', ''),
        COALESCE(p_order ->> 'zipcode', ''),
        COALESCE(p_order ->> 'address', ''),
        v_method,
        COALESCE(p_order ->> 'deliveryMethodLabel', ''),
        v_delivery_fee,
        v_items_total,
        v_total_amount,
        COALESCE(p_order ->> 'deliveryDate', ''),
        COALESCE(p_order ->> 'message', ''),
        COALESCE((p_order ->> 'hideSender')::boolean, false),
        COALESCE(p_order ->> 'request', ''),
        COALESCE(p_order ->> 'courier', ''),
        COALESCE(p_order ->> 'trackingNumber', ''),
        COALESCE(p_order ->> 'statusBeforeCancel', ''),
        false,
        v_coupon_code,
        v_coupon_discount
    );

    -- 6) 주문 품목(order_items) 일괄 삽입 (검증된 단가 적용)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := v_item ->> 'productId';
        v_size_label := TRIM(COALESCE(v_item ->> 'sizeLabel', ''));
        v_qty := COALESCE((v_item ->> 'quantity')::int, 1);

        -- 단가 재조회
        SELECT price, sizes, name INTO v_prod FROM public.products WHERE id = v_prod_id;
        v_matched_price := NULL;
        IF v_size_label <> '' AND v_prod.sizes IS NOT NULL AND jsonb_array_length(v_prod.sizes) > 0 THEN
            FOR v_size_elem IN SELECT * FROM jsonb_array_elements(v_prod.sizes)
            LOOP
                IF COALESCE(v_size_elem ->> 'label', v_size_elem ->> 'name') = v_size_label THEN
                    v_matched_price := (v_size_elem ->> 'price')::numeric;
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        IF v_matched_price IS NULL THEN v_matched_price := v_prod.price; END IF;

        INSERT INTO public.order_items (
            "orderId", "lineNo", "productId", "productName", "sizeLabel",
            price, "optionName", "optionPrice", quantity
        ) VALUES (
            v_order_id,
            COALESCE((v_item ->> 'lineNo')::int, 1),
            v_prod_id,
            v_prod.name,
            v_size_label,
            v_matched_price,
            COALESCE(v_item ->> 'optionName', ''),
            COALESCE((v_item ->> 'optionPrice')::numeric, 0),
            v_qty
        );
    END LOOP;

    RETURN jsonb_build_object(
        'ok', true,
        'orderId', v_order_id,
        'orderNumber', v_order_number,
        'itemsTotal', v_items_total,
        'deliveryFee', v_delivery_fee,
        'couponDiscount', v_coupon_discount,
        'totalAmount', v_total_amount
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;


-- ==============================================================================
-- 함수 실행 권한 관리 (REVOKE / GRANT)
-- 최소 권한 원칙: 손님(anon)은 허용된 RPC만 호출 가능하며, 내부 함수나 트리거 함수는 직접 호출 불가
-- ==============================================================================

-- 기본 공개 실행 권한 회수
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_coupon(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_order(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_order_transaction(jsonb, jsonb) FROM PUBLIC;

-- 공개 실행 허용 (anon 및 authenticated)
GRANT EXECUTE ON FUNCTION public.check_coupon(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_order(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order_transaction(jsonb, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ==============================================================================
-- 행 수준 보안 정책 (Row Level Security, RLS) 초안
-- 주의: 아래 정책은 Supabase Auth(로그인) 시스템과 연동 시 적용할 수 있습니다.
-- ==============================================================================

/*
-- RLS 활성화
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1) 상품 (products): 일반 손님은 공개 상품만 읽기, 사장님(관리자)은 전체
CREATE POLICY "공개 상품 조회" ON public.products
    FOR SELECT TO anon, authenticated
    USING (visibility = 'public' OR (visibility = 'scheduled' AND "publishAt" <= to_char(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI')));

CREATE POLICY "관리자 상품 전체 권한" ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2) 주문 (orders & order_items): 손님은 직접 조회 불가(lookup_order RPC 사용), 관리는 사장님만
CREATE POLICY "관리자 주문 전체 권한" ON public.orders
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "관리자 주문 품목 전체 권한" ON public.order_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3) 1:1 상담 (inquiries) & 재입고 신청 (restock): 손님은 등록만 가능
CREATE POLICY "손님 상담 신청 등록" ON public.inquiries
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "관리자 상담 전체 권한" ON public.inquiries
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "손님 재입고 알림 신청 등록" ON public.restock
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "관리자 재입고 알림 전체 권한" ON public.restock
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4) 공지 팝업, 안내 페이지, 꽃 사전: 누구나 읽기 가능, 수정은 관리자만
CREATE POLICY "공지 팝업 공개 조회" ON public.popups
    FOR SELECT TO anon, authenticated
    USING (active = true AND ("startDate" = '' OR "startDate" <= to_char(CURRENT_DATE, 'YYYY-MM-DD')) AND ("endDate" = '' OR "endDate" >= to_char(CURRENT_DATE, 'YYYY-MM-DD')));

CREATE POLICY "안내 페이지 공개 조회" ON public.pages
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "꽃 사전 공개 조회" ON public.flowers
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "관리자 팝업 관리" ON public.popups FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 페이지 관리" ON public.pages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 꽃 사전 관리" ON public.flowers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5) 지출 (expenses) & 쿠폰 발행 이력 (coupon_history) & 쿠폰 (coupons): 관리자만 접근
-- 손님 기기는 coupons 테이블에 대한 직접 SELECT/UPDATE 권한이 일절 없으며 RPC(check_coupon) 및 주문 트랜잭션 함수로만 사용됩니다.
CREATE POLICY "관리자 쿠폰 전체 관리" ON public.coupons
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "관리자 전용 지출 관리" ON public.expenses
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "관리자 전용 쿠폰 이력" ON public.coupon_history
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6) 설정 (settings) & 사진 (images)
CREATE POLICY "설정 공개 읽기" ON public.settings
    FOR SELECT TO anon, authenticated
    USING (key NOT LIKE '__admin%');

CREATE POLICY "관리자 설정 전체 관리" ON public.settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "사진 보관함 공개 읽기" ON public.images
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "관리자 사진 관리" ON public.images
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7) 후기 (reviews): 승인된(approved) 후기만 일반 공개, 등록 및 대기 중(pending) 미디어는 보호
CREATE POLICY "승인된 후기 공개 조회" ON public.reviews
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

CREATE POLICY "손님 후기 등록" ON public.reviews
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending' AND "adminReply" = '' AND "replyAt" IS NULL AND "isSample" = false);

CREATE POLICY "관리자 후기 전체 관리" ON public.reviews
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
*/
