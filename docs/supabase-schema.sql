-- ==============================================================================
-- 설담화(說談花) Supabase / PostgreSQL 데이터베이스 스키마
-- 초안 — 아직 실행하지 않음. 실행 전 사장님 확인 필요
--
-- 대상: 13개 기존 테이블 (products, orders, order_items, expenses, inquiries,
--       restock, popups, pages, settings, flowers, coupons, coupon_history, images)
--       + 1개 신규 테이블 (reviews)
-- ==============================================================================

-- 1. 매장 설정 (settings)
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL
);

-- 2. 꽃 사전 (flowers)
CREATE TABLE IF NOT EXISTS public.flowers (
    id text PRIMARY KEY,
    name text NOT NULL,
    nameEn text DEFAULT '',
    nameJa text DEFAULT '',
    meaning text NOT NULL DEFAULT '',
    meaningEn text DEFAULT '',
    meaningJa text DEFAULT '',
    months jsonb NOT NULL DEFAULT '[]'::jsonb,
    yearRound boolean NOT NULL DEFAULT false,
    colors text DEFAULT '',
    care text DEFAULT '',
    image text DEFAULT '',
    guideText text DEFAULT '',
    guideImages jsonb DEFAULT '[]'::jsonb,
    guideVideo text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_flowers_year_round ON public.flowers (yearRound);

-- 3. 상품 (products)
CREATE TABLE IF NOT EXISTS public.products (
    id text PRIMARY KEY,
    name text NOT NULL,
    englishName text DEFAULT '',
    category text NOT NULL DEFAULT 'bouquet',
    price numeric(12,0) NOT NULL DEFAULT 0,
    sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
    inquiryOnly boolean NOT NULL DEFAULT false,
    poeticLine text DEFAULT '',
    flowerMeaning text DEFAULT '',
    description text DEFAULT '',
    stockQuantity integer NOT NULL DEFAULT 0,
    image text NOT NULL DEFAULT '',
    visibility text NOT NULL DEFAULT 'public',
    publishAt timestamptz DEFAULT NULL,
    curationTags jsonb NOT NULL DEFAULT '[]'::jsonb,
    hideOnHome boolean NOT NULL DEFAULT false,
    homeOrder integer NOT NULL DEFAULT 999,
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    flowers jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON public.products (visibility, publishAt);
CREATE INDEX IF NOT EXISTS idx_products_home ON public.products (hideOnHome, homeOrder);

-- 4. 공지 팝업 (popups)
CREATE TABLE IF NOT EXISTS public.popups (
    id text PRIMARY KEY,
    active boolean NOT NULL DEFAULT true,
    "order" integer NOT NULL DEFAULT 0,
    image text NOT NULL,
    title text NOT NULL,
    text text NOT NULL DEFAULT '',
    titleEn text DEFAULT '',
    textEn text DEFAULT '',
    titleJa text DEFAULT '',
    textJa text DEFAULT '',
    buttonLabel text DEFAULT '자세히 보기',
    linkType text NOT NULL DEFAULT 'none',
    url text DEFAULT '',
    internalTarget text DEFAULT '',
    startDate date DEFAULT NULL,
    endDate date DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_popups_display ON public.popups (active, "order");

-- 5. 정성 안내 및 약관 페이지 (pages)
CREATE TABLE IF NOT EXISTS public.pages (
    id text PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    updatedAt timestamptz NOT NULL DEFAULT NOW(),
    media jsonb DEFAULT '{}'::jsonb
);

-- 6. 할인 쿠폰 (coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
    code text PRIMARY KEY,
    batchId text NOT NULL,
    batchName text NOT NULL,
    type text NOT NULL DEFAULT 'amount',
    value numeric(12,0) NOT NULL DEFAULT 0,
    minOrder numeric(12,0) NOT NULL DEFAULT 0,
    startDate date NOT NULL,
    endDate date NOT NULL,
    active boolean NOT NULL DEFAULT true,
    createdAt timestamptz NOT NULL DEFAULT NOW(),
    usedAt timestamptz DEFAULT NULL,
    orderNumber text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_coupons_batch ON public.coupons (batchId);
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates ON public.coupons (active, startDate, endDate);

-- 7. 쿠폰 발행 이력 (coupon_history)
CREATE TABLE IF NOT EXISTS public.coupon_history (
    id text PRIMARY KEY,
    batchName text NOT NULL,
    type text NOT NULL,
    value numeric(12,0) NOT NULL DEFAULT 0,
    minOrder numeric(12,0) NOT NULL DEFAULT 0,
    startDate date NOT NULL,
    endDate date NOT NULL,
    created integer NOT NULL DEFAULT 0,
    used integer NOT NULL DEFAULT 0,
    usedDates jsonb NOT NULL DEFAULT '[]'::jsonb,
    archivedAt timestamptz NOT NULL DEFAULT NOW()
);

-- 8. 주문 (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY,
    orderNumber text NOT NULL UNIQUE,
    createdDate date NOT NULL DEFAULT CURRENT_DATE,
    createdAt timestamptz NOT NULL DEFAULT NOW(),
    status text NOT NULL DEFAULT 'preparing',
    ordererName text NOT NULL,
    ordererPhone text NOT NULL,
    recipientName text NOT NULL,
    recipientPhone text NOT NULL,
    customerName text DEFAULT '',
    phone text DEFAULT '',
    zipcode text DEFAULT '',
    address text NOT NULL,
    deliveryMethod text NOT NULL DEFAULT 'parcel',
    deliveryMethodLabel text DEFAULT '',
    deliveryFee numeric(12,0) NOT NULL DEFAULT 0,
    itemsTotal numeric(12,0) NOT NULL DEFAULT 0,
    totalAmount numeric(12,0) NOT NULL DEFAULT 0,
    deliveryDate date DEFAULT NULL,
    message text DEFAULT '',
    hideSender boolean NOT NULL DEFAULT false,
    request text DEFAULT '',
    courier text DEFAULT '',
    trackingNumber text DEFAULT '',
    statusBeforeCancel text DEFAULT '',
    isSample boolean NOT NULL DEFAULT false,
    couponCode text DEFAULT '',
    couponDiscount numeric(12,0) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders (orderNumber);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders (createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_lookup ON public.orders (orderNumber, ordererPhone);

-- 9. 주문 품목 (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    orderId text NOT NULL,
    lineNo integer NOT NULL DEFAULT 1,
    productId text DEFAULT NULL,
    productName text NOT NULL,
    sizeLabel text DEFAULT '',
    price numeric(12,0) NOT NULL DEFAULT 0,
    optionName text DEFAULT '',
    optionPrice numeric(12,0) NOT NULL DEFAULT 0,
    quantity integer NOT NULL DEFAULT 1,
    PRIMARY KEY (orderId, lineNo),
    CONSTRAINT fk_order_items_order FOREIGN KEY (orderId) REFERENCES public.orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (productId) REFERENCES public.products (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items (productId);

-- 10. 지출 (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id text PRIMARY KEY,
    date date NOT NULL DEFAULT CURRENT_DATE,
    category text NOT NULL DEFAULT 'flower',
    amount numeric(12,0) NOT NULL DEFAULT 0,
    method text NOT NULL DEFAULT 'card',
    memo text DEFAULT '',
    isSample boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (category);

-- 11. 1:1 맞춤 상담 문의 (inquiries)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id text PRIMARY KEY,
    createdDate date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'new',
    name text NOT NULL,
    phone text NOT NULL,
    date text DEFAULT '',
    type text DEFAULT '',
    productName text DEFAULT '',
    message text NOT NULL DEFAULT '',
    memo text DEFAULT '',
    contactedAt timestamptz DEFAULT NULL,
    replies jsonb NOT NULL DEFAULT '[]'::jsonb,
    isSample boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status, createdDate DESC);

-- 12. 재입고 알림 신청 (restock)
CREATE TABLE IF NOT EXISTS public.restock (
    id text PRIMARY KEY,
    productId text NOT NULL,
    productName text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    createdDate date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'waiting',
    isSample boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_restock_product FOREIGN KEY (productId) REFERENCES public.products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_restock_product_status ON public.restock (productId, status);

-- 13. 사진 보관함 (images)
CREATE TABLE IF NOT EXISTS public.images (
    id text PRIMARY KEY,
    name text NOT NULL,
    src text NOT NULL,
    width integer NOT NULL DEFAULT 0,
    height integer NOT NULL DEFAULT 0,
    createdAt timestamptz NOT NULL DEFAULT NOW()
);

-- 14. 상품 후기 (reviews — 신규 계획)
CREATE TABLE IF NOT EXISTS public.reviews (
    id text PRIMARY KEY,
    orderId text NOT NULL,
    orderNumber text NOT NULL,
    productId text DEFAULT NULL,
    productName text NOT NULL,
    rating integer NOT NULL DEFAULT 5,
    text text NOT NULL,
    photos jsonb NOT NULL DEFAULT '[]'::jsonb,
    video text DEFAULT '',
    status text NOT NULL DEFAULT 'pending',
    adminReply text DEFAULT '',
    replyAt timestamptz DEFAULT NULL,
    createdAt timestamptz NOT NULL DEFAULT NOW(),
    isSample boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_reviews_order FOREIGN KEY (orderId) REFERENCES public.orders (id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_product FOREIGN KEY (productId) REFERENCES public.products (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_public ON public.reviews (status, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews (orderId);


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
    USING (visibility = 'public' OR (visibility = 'scheduled' AND publishAt <= NOW()));

CREATE POLICY "관리자 상품 전체 권한" ON public.products
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 2) 주문 (orders & order_items): 손님은 새 주문 등록(INSERT)만 가능, 관리는 사장님만
CREATE POLICY "손님 새 주문 등록" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "손님 새 주문 품목 등록" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "관리자 주문 전체 권한" ON public.orders
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "관리자 주문 품목 전체 권한" ON public.order_items
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 3) 1:1 상담 (inquiries) & 재입고 신청 (restock): 손님은 등록만 가능
CREATE POLICY "손님 상담 신청 등록" ON public.inquiries
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "관리자 상담 전체 권한" ON public.inquiries
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "손님 재입고 알림 신청 등록" ON public.restock
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "관리자 재입고 알림 전체 권한" ON public.restock
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 4) 공지 팝업, 안내 페이지, 꽃 사전: 누구나 읽기 가능, 수정은 관리자만
CREATE POLICY "공지 팝업 공개 조회" ON public.popups
    FOR SELECT TO anon, authenticated
    USING (active = true AND (startDate IS NULL OR startDate <= CURRENT_DATE) AND (endDate IS NULL OR endDate >= CURRENT_DATE));

CREATE POLICY "안내 페이지 공개 조회" ON public.pages
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "꽃 사전 공개 조회" ON public.flowers
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "관리자 팝업/페이지/꽃사전 관리" ON public.popups FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "관리자 페이지 관리" ON public.pages FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "관리자 꽃 사전 관리" ON public.flowers FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- 5) 지출 (expenses) & 쿠폰 발행 이력 (coupon_history): 관리자만 접근
CREATE POLICY "관리자 전용 지출 관리" ON public.expenses
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "관리자 전용 쿠폰 이력" ON public.coupon_history
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 6) 후기 (reviews): 승인된 후기만 공개, 등록은 손님 누구나 가능, 관리는 관리자
CREATE POLICY "승인된 후기 공개 조회" ON public.reviews
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

CREATE POLICY "손님 후기 등록" ON public.reviews
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending');

CREATE POLICY "관리자 후기 전체 관리" ON public.reviews
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
*/
