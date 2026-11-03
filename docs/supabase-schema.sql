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
-- 쿠폰 확인은 check_coupon RPC로, 사용 처리는 주문 INSERT 시 실행되는 보안 트리거로 처리됩니다.
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
    "couponDiscount" numeric(12,0) NOT NULL DEFAULT 0
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
-- 자동화 트리거 및 서버 함수 (Functions & Triggers)
-- ==============================================================================

-- 1. 쿠폰 사용 자동 처리 트리거 (SECURITY DEFINER)
-- 손님 기기는 coupons 테이블을 직접 수정할 수 없으므로, 새 주문이 등록될 때 DB가 안전하게 처리합니다.
CREATE OR REPLACE FUNCTION public.trig_orders_mark_coupon_used()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW."couponCode" IS NOT NULL AND NEW."couponCode" <> '' THEN
        UPDATE public.coupons
        SET "usedAt" = to_char(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS'),
            "orderNumber" = NEW."orderNumber"
        WHERE code = NEW."couponCode"
          AND ("usedAt" IS NULL OR "usedAt" = '');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_coupon_used ON public.orders;
CREATE TRIGGER trg_mark_coupon_used
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trig_orders_mark_coupon_used();

-- 2. 손님용 쿠폰 확인 RPC (check_coupon)
-- server.py의 COUPON_PUBLIC과 동일하게 공개 가능한 최소 필드만 반환합니다.
CREATE OR REPLACE FUNCTION public.check_coupon(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- 3. 손님용 단건 주문 조회 RPC (lookup_order)
-- 주문번호와 주문자 연락처(숫자만 비교)가 정확히 일치할 때만 주문 1건과 품목 목록을 반환합니다.
CREATE OR REPLACE FUNCTION public.lookup_order(p_order_number text, p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_clean_phone text;
    v_order record;
    v_items jsonb;
BEGIN
    v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
    IF LENGTH(v_clean_phone) < 9 OR p_order_number IS NULL OR TRIM(p_order_number) = '' THEN
        RETURN jsonb_build_object('ok', false, 'error', '주문번호와 연락처를 정확히 입력해 주세요.');
    END IF;

    SELECT *
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

    SELECT COALESCE(jsonb_agg(to_jsonb(i)), '[]'::jsonb)
    INTO v_items
    FROM public.order_items i
    WHERE i."orderId" = v_order.id;

    RETURN jsonb_build_object(
        'ok', true,
        'order', to_jsonb(v_order),
        'items', v_items
    );
END;
$$;

-- 4. 주문 통합 접수 단일 트랜잭션 RPC (submit_order_transaction)
-- 주문 등록 + 주문 품목 등록 + 재고 차감 + 쿠폰 사용 처리를 한 번의 트랜잭션으로 원자적으로 처리합니다.
-- 재고 부족 등 예외 발생 시 전체 작업이 롤백되어 데이터 불일치를 원천 차단합니다.
CREATE OR REPLACE FUNCTION public.submit_order_transaction(
    p_order jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id text;
    v_item jsonb;
    v_prod_id text;
    v_qty int;
    v_curr_stock int;
    v_coupon_code text;
BEGIN
    v_order_id := p_order ->> 'id';
    v_coupon_code := TRIM(COALESCE(p_order ->> 'couponCode', ''));

    -- 1) 재고 확인 및 차감 (재고 관리가 필요한 품목)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := v_item ->> 'productId';
        v_qty := COALESCE((v_item ->> 'quantity')::int, 1);

        IF v_prod_id IS NOT NULL AND v_prod_id <> '' THEN
            SELECT "stockQuantity" INTO v_curr_stock
            FROM public.products
            WHERE id = v_prod_id
            FOR UPDATE; -- 동시 주문 동시성 제어 락

            -- stockQuantity가 NULL이 아닌 경우에만 수량 체크 및 차감 (상담 상품 등은 NULL)
            IF v_curr_stock IS NOT NULL THEN
                IF v_curr_stock < v_qty THEN
                    RAISE EXCEPTION '재고가 부족합니다 (상품 ID: %, 남은 재고: %, 요청 수량: %)', v_prod_id, v_curr_stock, v_qty;
                END IF;

                UPDATE public.products
                SET "stockQuantity" = "stockQuantity" - v_qty
                WHERE id = v_prod_id;
            END IF;
        END IF;
    END LOOP;

    -- 2) 주문서(orders) 삽입
    INSERT INTO public.orders (
        id, "orderNumber", "createdDate", "createdAt", status,
        "ordererName", "ordererPhone", "recipientName", "recipientPhone",
        "customerName", phone, zipcode, address, "deliveryMethod", "deliveryMethodLabel",
        "deliveryFee", "itemsTotal", "totalAmount", "deliveryDate", message,
        "hideSender", request, courier, "trackingNumber", "statusBeforeCancel",
        "isSample", "couponCode", "couponDiscount"
    ) VALUES (
        v_order_id,
        p_order ->> 'orderNumber',
        COALESCE(p_order ->> 'createdDate', CURRENT_DATE::text),
        COALESCE(p_order ->> 'createdAt', ''),
        COALESCE(p_order ->> 'status', 'preparing'),
        COALESCE(p_order ->> 'ordererName', ''),
        COALESCE(p_order ->> 'ordererPhone', ''),
        COALESCE(p_order ->> 'recipientName', ''),
        COALESCE(p_order ->> 'recipientPhone', ''),
        COALESCE(p_order ->> 'customerName', ''),
        COALESCE(p_order ->> 'phone', ''),
        COALESCE(p_order ->> 'zipcode', ''),
        COALESCE(p_order ->> 'address', ''),
        COALESCE(p_order ->> 'deliveryMethod', 'parcel'),
        COALESCE(p_order ->> 'deliveryMethodLabel', ''),
        COALESCE((p_order ->> 'deliveryFee')::numeric, 0),
        COALESCE((p_order ->> 'itemsTotal')::numeric, 0),
        COALESCE((p_order ->> 'totalAmount')::numeric, 0),
        COALESCE(p_order ->> 'deliveryDate', ''),
        COALESCE(p_order ->> 'message', ''),
        COALESCE((p_order ->> 'hideSender')::boolean, false),
        COALESCE(p_order ->> 'request', ''),
        COALESCE(p_order ->> 'courier', ''),
        COALESCE(p_order ->> 'trackingNumber', ''),
        COALESCE(p_order ->> 'statusBeforeCancel', ''),
        COALESCE((p_order ->> 'isSample')::boolean, false),
        v_coupon_code,
        COALESCE((p_order ->> 'couponDiscount')::numeric, 0)
    );

    -- 3) 주문 품목(order_items) 일괄 삽입
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            "orderId", "lineNo", "productId", "productName", "sizeLabel",
            price, "optionName", "optionPrice", quantity
        ) VALUES (
            v_order_id,
            COALESCE((v_item ->> 'lineNo')::int, 1),
            NULLIF(v_item ->> 'productId', ''),
            COALESCE(v_item ->> 'productName', ''),
            COALESCE(v_item ->> 'sizeLabel', ''),
            COALESCE((v_item ->> 'price')::numeric, 0),
            COALESCE(v_item ->> 'optionName', ''),
            COALESCE((v_item ->> 'optionPrice')::numeric, 0),
            COALESCE((v_item ->> 'quantity')::int, 1)
        );
    END LOOP;

    -- 4) 쿠폰 사용 처리 (트리거로도 처리되지만 트랜잭션 함수 내에서도 즉시 유효성 검증 및 반영)
    IF v_coupon_code <> '' THEN
        UPDATE public.coupons
        SET "usedAt" = to_char(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS'),
            "orderNumber" = p_order ->> 'orderNumber'
        WHERE code = v_coupon_code
          AND ("usedAt" IS NULL OR "usedAt" = '');
    END IF;

    RETURN jsonb_build_object('ok', true, 'orderId', v_order_id, 'orderNumber', p_order ->> 'orderNumber');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;


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

-- 2) 주문 (orders & order_items): 손님은 새 주문 등록(INSERT)만 가능, 관리는 사장님만
CREATE POLICY "손님 새 주문 등록" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "손님 새 주문 품목 등록" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

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
-- 주의: 손님은 coupons 테이블에 대한 직접 SELECT/UPDATE 권한이 없으며 RPC(check_coupon) 및 주문 트리거로만 간접 사용됩니다.
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

-- 7) 후기 (reviews): 승인된 후기만 공개, 등록은 손님 누구나 가능, 관리는 관리자
CREATE POLICY "승인된 후기 공개 조회" ON public.reviews
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

CREATE POLICY "손님 후기 등록" ON public.reviews
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending');

CREATE POLICY "관리자 후기 전체 관리" ON public.reviews
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
*/
