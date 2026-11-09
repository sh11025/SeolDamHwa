// assets/js/i18n.js
// 설담화(說談花) 다국어 지원 모듈 (KO / EN / JA)

const I18N = {
  ko: {
    // 헤더 및 네비게이션
    nav_story: "설담화 이야기",
    nav_shop: "꽃 둘러보기",
    nav_custom: "맞춤 담화",
    nav_guide: "정성 안내",
    guide_subtitle: "주문 전후에 알아 두시면 좋은 이야기를 모았어요.",
    guide_cta: "더 궁금한 점은 1:1 상담으로 물어보세요",
    lang_label: "언어 선택",
    search_title: "검색",
    cart_title_badge: "장바구니",

    // 히어로 섹션
    hero_atelier_badge: "Contemporary Korean Floral Atelier · 2026 Collection",
    hero_tagline: "꽃으로 짓는 정갈한 이야기",
    hero_h1: "선조의 풍류와 여백,<br><span class=\"text-seal-red ink-stroke\">2030 감각</span>으로 피어나다",
    hero_sub: "버려지는 포장 대신, 오래 간직하는 아름다움.<br>설담화의 1:1 맞춤 꽃 선물",
    hero_btn_shop: "꽃 둘러보기",

    // 갤러리 섹션 (PLP)
    gallery_badge: "갤러리 담화(談花)",
    gallery_title: "사계와 절기를 담은 제철 꽃 컬렉션",
    gallery_desc: "한 점의 예술 작품을 감상하듯, 2030 세대의 모던한 취향을 만족시키는 정갈한 라인업입니다.",
    cat_all: "전체 둘러보기",
    cat_bouquet: "꽃다발",
    pdp_crumb_home: "홈",
    pdp_back: "← 뒤로",
    pdp_section_story: "이 꽃에 담긴 이야기",
    pdp_flower_meaning: "꽃과 꽃말",
    pdp_section_info: "받기 전에 알아 두세요",
    pdp_related: "비슷한 분위기의 꽃",
    pdp_recent: "최근 본 꽃",
    wish_add: "찜하기",
    wish_remove: "찜 해제",
    wish_title: "찜한 꽃",
    wish_empty: "아직 찜한 꽃이 없어요. 상품 페이지의 ♡를 눌러 보세요.",
    recent_empty: "아직 본 꽃이 없어요.",
    price_inquiry: "상담 후 견적",
    cat_basket: "꽃바구니",
    cat_space: "웨딩·공간",
    btn_detail: "자세히 보기",
    btn_order: "주문하기",
    btn_consult: "1:1 상담",
    inquiry_price_label: "상담 후 견적",

    // 패키징 섹션 (ReBloom Packaging)
    pack_badge: "ReBloom Packaging",
    pack_video_title: "꽃을<br>복주머니에 담다",
    pack_h2: "버려지는 포장 대신,<br>오래 간직하는 복주머니",
    pack_desc: "설담화가 꿈꾸는 선물은 물건을 건네는 것을 넘어, 버리지 않는 한국의 전통과 가치를 함께 나누는 일입니다. 꽃이 시든 뒤에도 남는 보자기와 복주머니처럼, 마음을 감싼 그릇까지 오래 곁에 머물도록 고민합니다.",
    pack_card1_tag: "다시 쓰는 보자기",
    pack_card1_title: "버리지 않는 포장",
    pack_card1_desc: "한복 원단 보자기와 복주머니로 감싸, 꽃이 진 뒤에도 일상에서 다시 쓰입니다.",
    pack_card2_tag: "한 사람을 위한 꽃",
    pack_card2_title: "1:1 맞춤 꽃",
    pack_card2_desc: "받는 분과 날의 의미를 듣고, 꽃과 색, 카드 문구까지 한 사람을 위해 짓습니다.",
    pack_card3_tag: "취향 큐레이션",
    pack_card3_title: "취향을 읽는 설계",
    pack_card3_desc: "다양한 취향 데이터를 바탕으로, 가장 한국적이면서 마음에 꼭 맞는 구성을 제안합니다.",

    // 브랜드 스토리 (View Story)
    story_header_sub: "말하지 않아도 꽃이 전하는 정갈한 온기",
    story_header_title: "설담화(說談花) 이야기",
    story_quote: "\"꽃 화(花), 말씀 설(說), 이야기 담(談)\"",
    story_p1: "옛 선조들은 처마 밑 한 됫박 흙에도 계절의 숨결을 얹고, 문살 너머 드리우는 꽃 그림자 하나에도 인생의 풍류와 철학을 노래했습니다. 서양식 꽃다발의 화려하고 빽빽한 채움 대신, 우리가 주목한 것은 '여백과 선의 아름다움'이었습니다.",
    story_p2: "설담화는 2030 세대의 현대적 라이프스타일 속에 조선 화조도(花鳥圖)의 생동감과 분청사기·달항아리의 담백한 품격을 불어넣습니다. 소중한 사람에게 마음을 전할 때, 단순한 장식품이 아니라 시간이 지나도 바래지 않는 하나의 이야기를 선물하세요.",
    story_side_tag: "Our Story",
    story_side_h2: "버려지는 포장 대신,<br>일상에 스며드는 아름다움",
    story_side_p1: "설담화가 꿈꾸는 선물은 물건을 건네는 것을 넘어, 버리지 않는 한국의 전통과 가치를 함께 나누는 일입니다.",
    story_side_p2: "꽃이 시든 뒤에도 남는 보자기와 복주머니처럼, 마음을 감싼 그릇까지 오래 곁에 머물도록 고민합니다.",
    story_rebloom_tag: "ReBloom",
    story_rebloom_h2: "꽃에서 시작해, 귀한 마음이 담기는 모든 곳으로",
    story_btn_shop: "설담화 꽃 컬렉션 보러가기",

    // 맞춤 담화 큐레이터 (View Custom)
    curation_badge: "맞춤 담화",
    curation_title: "어떤 꽃이 어울릴지 함께 찾아볼게요",
    curation_desc: "다섯 가지만 골라 주시면 설담화가 어울리는 꽃을 골라 드려요.",
    curation_step_fmt: "{step}단계 / 5단계",
    curation_prev: "← 이전",
    curation_skip: "건너뛰기 →",
    curation_finish_desc: "3가지 질문이 완료되어 바로 추천 꽃을 보실 수 있어요.",
    curation_finish_btn: "내게 어울리는 꽃 보기",

    curation_q1: "누구에게 선물하시나요?",
    curation_q2: "어떤 날인가요?",
    curation_q3: "어떤 마음을 전하고 싶으세요?",
    curation_q4: "어떤 색이 좋으세요?",
    curation_q5: "예산은 어느 정도 생각하세요?",

    // 큐레이터 선택지
    opt_recipient_lover: "연인",
    opt_recipient_parent: "부모님·어른",
    opt_recipient_friend: "친구",
    opt_recipient_colleague: "동료·상사",
    opt_recipient_mentor: "스승·은인",
    opt_recipient_me: "나에게",
    opt_recipient_space: "공간·기업",

    opt_occasion_birthday: "생일",
    opt_occasion_anniversary: "기념일·프러포즈",
    opt_occasion_grad: "졸업·입학",
    opt_occasion_promote: "승진·개업",
    opt_occasion_wedding: "결혼·상견례",
    opt_occasion_parents_day: "어버이날·스승의날",
    opt_occasion_comfort: "위로·병문안",
    opt_occasion_just: "특별한 날 없이",

    opt_feeling_congrat: "축하",
    opt_feeling_thanks: "감사",
    opt_feeling_love: "사랑",
    opt_feeling_cheer: "응원",
    opt_feeling_comfort: "위로",
    opt_feeling_space: "공간 연출",

    opt_color_red: "레드·버건디",
    opt_color_pink: "핑크·피치",
    opt_color_white: "화이트·그린",
    opt_color_yellow: "옐로우·오렌지",
    opt_color_blue: "블루·퍼플",
    opt_color_mix: "여러 색 섞어서",
    opt_color_neutral: "잘 모르겠어요",

    opt_budget_under30: "3만원 이하",
    opt_budget_30to50: "3~5만원",
    opt_budget_50to70: "5~7만원",
    opt_budget_70to100: "7~10만원",
    opt_budget_over100: "10만원 이상",
    opt_budget_consult: "상담 후 결정",

    // 큐레이터 결과
    curation_res_badge: "Curated Recommendation",
    curation_res_title: "선택하신 마음에 어울리는 꽃 제안",
    curation_res_alt_title: "예산보다 조금 높지만 잘 어울리는 꽃",
    curation_res_desc: "설담화 화훼 장인이 선별한 최적의 꽃과 선물 3가지입니다.",
    curation_best_badge: "★ 가장 잘 어울려요",
    curation_rec_fmt: "추천 {n}",
    curation_soldout_fmt: "'{name}'도 잘 어울리지만 지금은 일시 품절이에요. 상담으로 입고 일정을 문의해 주세요.",
    curation_budget_prep_title: "이 가격대 상품은 지금 준비 중이에요.",
    curation_budget_prep_desc: "예산에 맞춰 1:1로 꽃을 지어 드릴 수 있어요. 원하시는 이야기를 남겨주시면 맞춤 제작을 도와드립니다.",
    curation_budget_prep_btn: "이 예산으로 상담 신청하기 ↓",
    curation_fill_inquiry_btn: "선택한 조건으로 1:1 상담 신청서 채우기 ↓",
    curation_reset_btn: "처음부터 다시 고르기",

    // 1:1 상담 문의 폼
    inquiry_badge: "1:1 맞춤 상담 문의",
    inquiry_title: "설담화 화훼 장인과의 1:1 상담 신청",
    inquiry_desc: "공간 연출, 예식 스타일링, 특별한 맞춤 선물 등 정성을 다해 화훼 장인이 직접 상담해 드립니다.",
    inquiry_name_label: "신청자 성함",
    inquiry_name_placeholder: "성함을 입력하세요 (예: 홍길동)",
    inquiry_phone_label: "연락처",
    inquiry_phone_placeholder: "연락처를 입력하세요 (예: 010-1234-5678)",
    inquiry_date_label: "희망 일자 (선택)",
    inquiry_date_placeholder: "날짜 선택 (선택 사항)",
    popup_dont_show_today: "오늘 그만 보기",
    popup_close: "닫기",
    popup_view_details: "자세히 보기",
    popup_status_stopped: "중지됨",
    inquiry_type_label: "어떤 상담이 필요하세요?",
    inquiry_type_custom: "맞춤 꽃다발·꽃바구니 제작",
    inquiry_type_wedding: "웨딩·행사·공간 연출",
    inquiry_type_corp: "기업·단체 주문",
    inquiry_type_specific: "특정 상품 문의",
    inquiry_type_etc: "기타 문의",
    inquiry_product_label: "상품 선택",
    inquiry_msg_label: "문의 내용",
    inquiry_msg_placeholder: "원하시는 꽃의 분위기, 용도, 예산 등을 자유롭게 적어주세요.",
    inquiry_message_placeholder: "원하시는 분위기, 행사 규모, 좋아하는 꽃이나 색, 예산 등을 자유롭게 적어 주세요.",
    btn_submit_inquiry: "1:1 맞춤 상담 신청하기",
    inquiry_alert_success: "[상담 신청 완료] {name} 님의 맞춤 상담 문의가 정상 접수되었습니다!\n설담화 화훼 장인이 확인 후 기재해주신 연락처({phone})로 정성껏 안내드리겠습니다.",

    // 상품 상세 모달 (PDP)
    pdp_badge_fresh_title: "신선 직송 안심 보증",
    pdp_badge_fresh_desc: "전국 지정일 안전 특송 출고",
    pdp_badge_silk_title: "수공예 비단 보자기",
    pdp_badge_silk_desc: "오방색 양단 실크 & 옥노리개 패키징",
    pdp_price_label: "판매가",
    pdp_meaning_prefix: "꽃말: ",
    pdp_size_label: "크기 선택",
    pdp_delivery_time_morning: "오전 10:00~13:00",
    pdp_delivery_time_afternoon: "오후 14:00~18:00",
    pdp_delivery_time_evening: "저녁 18:00~21:00",
    pdp_package_label: "보자기 포장",
    pdp_package_basic: "기본 단아 한지 포장 (무료)",
    pdp_package_silk: "전통 실크 본견 보자기 & 노리개 포장 (+15,000원)",
    pdp_qty_label: "수량",
    pdp_total_label: "총 주문금액",
    pdp_btn_cart: "장바구니 담기",
    pdp_btn_buy: "바로 구매하기",
    pdp_inquiry_guide: "공간 연출 및 웨딩 스타일링은 공간 규모와 계절에 맞춘 1:1 상담 후 맞춤 견적서가 발행됩니다.",
    pdp_btn_inquiry: "1:1 맞춤 상담 문의하기",

    // 재고 안내 문구
    stock_ample: "재고 여유",
    stock_low_fmt: "품절 임박 (남은 수량: {qty}개)",
    stock_soldout: "일시 품절",
    restock_title: "🔔 다시 들어오면 알려 드릴게요",
    restock_desc: "연락처를 남겨 주시면 입고되는 대로 문자로 안내드려요.",
    restock_name_ph: "이름 (선택)",
    restock_consent: "[필수] 재입고 안내를 위한 연락처 수집·이용에 동의합니다 (안내 후 파기).",
    restock_btn: "재입고 알림 신청",
    restock_done: "신청됐어요. 다시 들어오면 문자로 알려 드릴게요.",
    restock_dup: "이미 신청해 주셨어요. 입고되면 바로 알려 드릴게요.",
    stock_inquiry_only: "상담 상품",
    size_recommended_label: "추천",

    // 장바구니 드로어
    cart_drawer_title: "담화 보따리 (장바구니)",
    cart_empty: "장바구니가 비어 있습니다.",
    cart_size_prefix: "크기: ",
    cart_delivery_prefix: "배송: ",
    cart_total_label: "최종 결제 금액",
    cart_btn_checkout: "주문 결제 진행하기",

    // 주문 결제 모달
    checkout_sub: "단정한 마음을 묶어 보내며",
    checkout_title: "주문 및 결제",
    co_orderer_title: "주문하시는 분",
    co_recipient_title: "받으시는 분",
    co_name: "이름",
    co_phone: "연락처",
    co_same_as_orderer: "주문하시는 분과 같아요",
    co_method_title: "배송 방법",
    co_method_quick: "퀵 당일 배송",
    co_method_parcel: "택배",
    co_method_pickup: "매장 픽업",
    co_free: "무료",
    co_zip: "우편번호",
    co_find_address: "주소 찾기",
    co_address_ph: "기본 주소 (주소 찾기를 누르거나 직접 적어 주세요)",
    co_address_detail_ph: "상세 주소 (동·호수, 층)",
    co_hide_sender: "카드에 보내는 분 이름을 적지 않을게요 (익명 선물)",
    co_request: "배송 요청 (선택)",
    co_request_ph: "예: 부재 시 경비실에 맡겨 주세요",
    co_items_total: "상품 금액",
    co_delivery_fee: "배송비",
    co_free_hint: "{amount} 더 담으면 배송비가 무료예요.",
    co_submit: "주문하기",
    co_placing_order: "주문 접수 중…",
    co_order_failed: "주문을 접수하지 못했어요. 입력 정보나 주문 번호를 확인해 주세요.",
    pdp_section_flower_guide: "꽃별 관리 안내",
    pdp_flower_guide_none: "받으신 날 줄기 끝을 사선으로 조금 잘라 시원한 물에 꽂아 주세요.",
    co_goods_parcel_only: "굿즈는 택배로만 보내 드려요.",
    cat_vase: "화병꽂이·센터피스",
    cat_dried: "드라이·프리저브드",
    cat_plant: "화분·식물",
    cat_goods: "굿즈",
    browse_pages: "쪽 넘기기",
    browse_prev: "이전 쪽",
    browse_next: "다음 쪽",
    pack_video_tag: "다시 피어나는 포장",
    pack_badge: "복주머니 포장",
    cs_location_tag: "설담화 아틀리에",
    cs_band_tag: "문의·상담",
    hero_btn_recommend_fmt: "이달의 추천 : {name} 보기",
    dict_browse_flower: "이 꽃이 든 상품 모두 보기 →",
    dict_no_products: "아직 이 꽃이 든 상품이 없어요. 맞춤 상담으로 문의해 주세요.",
    dict_screen_label: "달 고르기",
    dict_this_month: "이번 달",
    co_today: "오늘",
    co_method_quick_plain: "퀵 배송",
    co_quick_until: "오늘 {time}까지 주문하면 오늘 받아요",
    co_date_expired: "고른 날짜는 이제 받을 수 없어요. 달력에서 다시 골라 주세요.",
    route_no_product: "찾는 상품이 없거나 지금은 볼 수 없어요.",
    route_cart_empty: "장바구니가 비어 있어요. 꽃을 먼저 담아 주세요.",
    route_unknown: "없는 페이지라 홈으로 왔어요.",
    stock_cart_full: "남은 재고만큼 이미 장바구니에 담겨 있어요.",
    stock_cart_limited: "남은 재고가 {n}개라 {n}개만 담았어요.",
    stock_changed: "주문하는 사이 재고가 줄었어요. 장바구니 수량을 고쳐 주세요.",
    stock_left_n: "남은 수량 {n}개",
    cta_pick_1: "누구에게 주실까요?",
    cta_pick_2: "어떤 날인가요?",
    cta_pick_3: "어떤 마음을 담을까요?",
    cta_pick_4: "이 꽃이 어울려요 ✓",
    dict_colors: "색",
    browse_flower_chip: "{name} 들어간 꽃만",
    browse_flower_clear: "꽃 거르기 지우기",
    co_coupon_label: "쿠폰 코드 (선택)",
    co_coupon_ph: "예: SDH-7K2P-QX9A",
    co_coupon_apply: "적용",
    co_coupon_remove: "빼기",
    co_coupon_discount: "쿠폰 할인",
    coupon_ok: "{amount} 할인이 적용됐어요.",
    coupon_err_none: "없는 쿠폰 코드예요. 다시 확인해 주세요.",
    coupon_err_used: "이미 사용한 쿠폰이에요.",
    coupon_err_stopped: "지금은 쓸 수 없는 쿠폰이에요.",
    coupon_err_before: "{date}부터 쓸 수 있어요.",
    coupon_err_expired: "기간이 끝난 쿠폰이에요.",
    coupon_err_min: "상품 금액이 {amount} 이상이면 쓸 수 있어요.",
    wish_panel_title: "♡ 찜한 꽃 · 최근 본 꽃",
    wish_panel_all: "전체 보기",
    wish_empty_short: "상품의 ♡를 누르면 여기에 모여요.",
    guide_location: "오시는 길",
    guide_location_desc: "아래 지도와 지도 앱 버튼으로 찾아오실 수 있어요. 방문 전 운영시간을 꼭 확인해 주세요.",
    footer_col_browse: "둘러보기",
    footer_link_browse: "꽃 둘러보기",
    footer_link_wishlist: "찜한 꽃 · 최근 본 꽃",
    co_date_label: "생화 희망 배송일 (필수)",
    co_pickup_day_label: "픽업 날짜 (필수)",
    co_time_label: "받으실 시간대",
    co_pickup_time_label: "픽업 시간대",
    co_time_parcel_note: "택배는 시간을 고를 수 없어요. 고른 날짜에 도착하도록 보내 드려요.",
    co_date_note: "쉬는 날은 고를 수 없어요. 내일부터 영업일 기준 14일 안에서 골라 주세요.",
    co_date_required: "달력에서 날짜를 골라 주세요.",
    co_date_full: "이 날은 주문이 마감되었어요.",
    co_date_full_pick_other: "선택하신 날짜는 주문이 마감되었어요. 다른 날짜를 골라 주세요.",
    co_cal_prev: "이전 달",
    co_cal_next: "다음 달",
    nav_dictionary: "꽃 사전",
    dict_title: "꽃 사전",
    dict_desc: "설담화가 쓰는 꽃의 꽃말과 제철을 모았어요.",
    dict_now: "🌿 지금 제철",
    dict_all: "전체",
    dict_search_ph: "꽃 이름이나 꽃말로 찾기",
    dict_empty: "이 조건에 맞는 꽃이 아직 없어요.",
    browse_recipient: "누구에게",
    browse_feeling: "마음",
    browse_budget: "예산",
    browse_any: "전체",
    season_now: "🌿 지금이 제철",
    browse_season_only: "🌿 지금 제철인 꽃만",
    pdp_flowers_used: "이 상품에 쓰인 꽃",
    flower_meaning_label: "꽃말",
    flower_season: "제철",
    flower_care: "관리 팁",
    home_view_all: "꽃 전체 둘러보기 →",
    cta_badge: "맞춤 담화",
    cta_title: "어떤 꽃이 좋을지 모르겠다면",
    cta_desc: "누구에게, 어떤 날, 어떤 마음인지 몇 가지만 고르면 어울리는 꽃을 골라 드려요.",
    cta_btn: "맞춤 추천 받기 →",
    cta_btn_chat: "💬 바로 물어보기",
    browse_title: "꽃 둘러보기",
    browse_desc: "맞춤 담화와 같은 기준(누구에게·어떤 날·마음·색·예산)으로 골라 보세요.",
    browse_color: "색",
    browse_occasion: "어떤 날",
    browse_sort: "정렬",
    sort_recommend: "추천순",
    sort_price_asc: "낮은 가격순",
    sort_price_desc: "높은 가격순",
    browse_count: "{n}개의 꽃",
    browse_empty: "조건에 맞는 꽃이 없어요.",
    browse_reset: "조건 지우기",
    chat_title: "💬 설담화에 물어보기",
    chat_desc: "남겨 주시면 확인하는 대로 전화나 문자로 연락드려요.",
    chat_message_ph: "궁금한 점을 적어 주세요. (예: 내일 오후에 받을 수 있나요?)",
    chat_send: "보내기",
    chat_kakao: "카카오톡으로 문의",
    chat_done: "남겨 주셔서 고마워요. 확인하는 대로 연락드릴게요.",
    chat_about: "문의 상품: {name}",
    co_step1: "① 주문할 꽃",
    co_step2: "② 받는 분·배송",
    co_step3: "③ 확인·주문",
    co_edit_cart: "장바구니 고치기",
    co_next_to_2: "다음: 받는 분·배송 →",
    co_next_to_3: "다음: 확인 →",
    co_prev: "← 이전",
    co_anonymous: "익명",
    co_payment_note: "온라인 결제는 준비 중이에요. 주문을 확인한 뒤 결제 방법을 연락처로 안내드려요.",
    co_quick_area_warn: "퀵 당일 배송은 서울 지역만 가능해요. 다른 배송 방법을 고르거나 1:1 상담으로 문의해 주세요.",
    co_address_search_fail: "주소 찾기를 불러오지 못했어요. 주소를 직접 적어 주세요.",
    co_method_required: "배송 방법을 골라 주세요.",
    co_phone_invalid: "연락처를 숫자 10~11자리로 적어 주세요. (예: 010-1234-5678)",
    co_done_title: "주문이 접수됐어요",
    co_done_desc: "정성껏 지어 보내 드릴게요. 아래 주문번호로 언제든 주문 상태를 확인할 수 있어요.",
    co_order_number: "주문번호",
    co_copy: "복사하기",
    co_copied: "복사했어요",
    co_lookup_btn: "주문 조회하기",
    co_continue: "쇼핑 계속하기",
    co_pickup_date_short: "픽업일",
    co_delivery_date_short: "배송일",
    lookup_title: "주문 조회",
    lookup_number_ph: "주문번호 (예: SDH-12345678)",
    lookup_phone_ph: "주문하신 분 연락처",
    lookup_btn: "조회하기",
    lookup_not_found: "주문을 찾지 못했어요. 주문번호와 주문하신 분 연락처를 다시 확인해 주세요.",
    lookup_items: "상품",
    lookup_tracking: "운송장",
    st_preparing: "제작 중",
    st_packaged: "포장 완료",
    st_delivering: "배송 중",
    st_completed: "배송 완료",
    st_cancelled: "주문이 취소되었어요.",
    checkout_name_label: "받으시는 분 성함",
    checkout_phone_label: "연락처",
    checkout_address_label: "배송 주소",
    checkout_message_label: "보자기 동봉 전통 한지 메시지",
    checkout_message_placeholder: "동봉할 메시지를 적어주세요.",
    checkout_default_message: "소중한 인연에 깊은 감사와 행복을 담아 보냅니다.",
    checkout_total_label: "최종 결제 금액",
    checkout_btn_submit: "안전 결제 완료하기",
    order_alert_complete: "[주문 완료] {name} 님, 설담화의 정갈한 꽃 주문이 성공적으로 접수되었습니다.\n희망 배송일({date})에 맞추어 신선하게 지어 보내드리겠습니다.",
    order_alert_empty_cart: "장바구니가 비어 있습니다.",

    // 고객센터 밴드 & 아틀리에 오시는 길
    cs_location_badge: "Location & Atelier",
    cs_location_title: "설담화 아틀리에 오시는 길",
    cs_btn_kakaomap: "카카오맵에서 보기",
    cs_btn_navermap: "네이버 지도에서 보기",
    cs_band_badge: "Customer Center",
    cs_band_title: "고객센터",
    cs_band_hours_default: "평일 10:00 - 18:00",
    cs_band_lunch_default: "점심시간 12:30 - 13:30",
    cs_band_closed_default: "주말 · 공휴일 휴무",
    cs_band_email_label: "이메일 문의",
    cs_band_btn_consult: "1:1 상담 신청",
    cs_band_kakao_label: "카카오톡 채널",
    cs_band_toggle_hours: "요일별 운영시간 보기",
    cs_band_status_open: "지금 영업 중 · {time}까지",
    cs_band_status_lunch: "점심시간 · {time}부터 다시 열어요",
    cs_band_status_before_open: "영업 준비 중 · {time}에 열어요",
    cs_band_status_closed_today: "오늘은 쉬어요",
    cs_band_status_closed_today_reason: "오늘은 쉬어요 · {reason}",
    cs_band_status_after_close_tomorrow: "오늘 영업 마감 · 내일 {time}에 열어요",
    cs_band_status_after_close_day: "오늘 영업 마감 · {day} {time}에 열어요",
    cs_band_closed: "휴무",
    cs_band_lunch_label: "점심",
    cs_band_temp_closure_label: "임시 휴무",
    day_0: "일", day_1: "월", day_2: "화", day_3: "수", day_4: "목", day_5: "금", day_6: "토",
    day_full_0: "일요일", day_full_1: "월요일", day_full_2: "화요일", day_full_3: "수요일", day_full_4: "목요일", day_full_5: "금요일", day_full_6: "토요일",

    // 상품 미리보기 & 비공개 안내
    preview_banner_private: "미리보기 모드 · 손님에게는 아직 보이지 않는 상품이에요",
    preview_banner_scheduled: "미리보기 모드 · {time}에 공개 예정",
    preview_banner_public: "미리보기 모드 · 현재 공개 중인 상품이에요",
    preview_close: "닫기",
    preview_btn_disabled: "미리보기 모드 (주문 불가)",
    checkout_hidden_removed: "현재 판매가 중단(비공개)된 상품이 장바구니에서 제외되었습니다: {items}",

    // 푸터
    footer_tagline: "\"이야기를 나누는 꽃, 선조의 풍류와 여백을 담다\"",
    footer_desc: "설담화는 2030 세대를 위한 모던 오리엔탈 플로럴 셀렉트샵입니다. 조선 궁중 화조도와 달항아리의 여백, 그리고 제철 생화로 공간에 품격을 건넵니다.",
    footer_guide_title: "정성 안내",
    footer_link_bojagi: "전통 보자기 패키징 안내",
    footer_link_care: "생화 관리 팁",
    footer_link_admin: "관리자 센터 로그인",
    footer_link_admin_short: "관리자",
    footer_terms: "이용약관",
    footer_privacy: "개인정보처리방침",
    footer_media_copyright: "© 설담화(說談花). 사이트의 사진·영상은 허락 없이 사용할 수 없습니다.",
    footer_link_delivery: "배송 안내",
    footer_link_refund: "교환·환불 안내",
    footer_biz_pending: "사업자 정보는 등록 준비 중입니다.",
    consent_privacy_inquiry: "[필수] 상담을 위한 개인정보(이름·연락처·문의 내용) 수집·이용에 동의합니다.",
    consent_privacy_order: "[필수] 주문·배송을 위한 개인정보(이름·연락처·주소) 수집·이용 및 배송 업체 제공에 동의합니다.",
    consent_refund: "[필수] 생화 특성상 받는 날 1일 전부터는 취소·환불이 어렵다는 안내를 확인했습니다.",
    consent_view: "자세히",
    page_korean_only: "",

    // 검색 모달
    search_placeholder: "꽃 이름, 꽃말, 이야기 키워드를 검색하세요.",
    search_no_results: "검색 결과가 없습니다.",

    // 꽃 편지 (손님 후기)
    reviews_count_suffix: "통의 소중한 편지",
    reviews_rating_detail: "별점 자세히",
    nav_reviews: "리뷰",
    reviews_tag: "꽃 편지함",
    reviews_title: "꽃 편지",
    reviews_subtitle: "꽃과 함께 전해진 이야기를 모았습니다.",
    reviews_empty: "아직 게시된 후기가 없어요",
    home_reviews_tag: "꽃 편지함",
    home_reviews_title: "꽃과 함께 전해진 이야기",
    home_reviews_more: "편지 모두 보기",
    home_reviews_view_all: "편지 모두 보기",
    review_recipient_label: "누구에게 보낸 꽃인가요?",
    review_recipient_required: "누구에게 보낸 꽃인지 선택해 주세요.",
    letter_reply_title: "설담화의 답장",
    letter_video_badge: "영상",
    filter_story_all: "전체",
    filter_story_media: "사진·영상",
    empty_reviews_title: "아직 게시된 후기가 없어요.",
    empty_reviews_sub: "첫 번째 꽃 편지를 기다리고 있어요."
  },

  en: {
    // Header & Nav
    nav_story: "Our Story",
    nav_shop: "Floral Shop",
    nav_custom: "Curator",
    nav_guide: "Guide",
    guide_subtitle: "Helpful notes to read before and after your order.",
    guide_cta: "Have more questions? Ask us in a 1:1 consultation",
    lang_label: "Language",
    search_title: "Search",
    cart_title_badge: "Cart",

    // Hero Section
    hero_atelier_badge: "Contemporary Korean Floral Atelier · 2026 Collection",
    hero_tagline: "Poetic Stories Woven with Fresh Blooms",
    hero_h1: "Grace of Korean Heritage,<br>Blooming with <span class=\"text-seal-red ink-stroke\">Modern Poise</span>",
    hero_sub: "Beyond disposable wrapping, timeless beauty to cherish.<br>Seoldamhwa's Bespoke Floral Gifts",
    hero_btn_shop: "Explore Collection",

    // Gallery / PLP
    gallery_badge: "Floral Gallery Damhwa",
    gallery_title: "Seasonal Floral Collection of Four Seasons",
    gallery_desc: "Experience each piece like fine art—refined arrangements crafted for contemporary sensibilities.",
    cat_all: "View All",
    cat_bouquet: "Bouquets",
    pdp_crumb_home: "Home",
    pdp_back: "← Back",
    pdp_section_story: "The story in these flowers",
    pdp_flower_meaning: "Flowers & meanings",
    pdp_section_info: "Good to know",
    pdp_related: "You may also like",
    pdp_recent: "Recently viewed",
    wish_add: "Save",
    wish_remove: "Remove from saved",
    wish_title: "Saved flowers",
    wish_empty: "No saved flowers yet. Tap ♡ on a product page.",
    recent_empty: "Nothing viewed yet.",
    price_inquiry: "Quote on consultation",
    cat_basket: "Flower Baskets",
    cat_space: "Wedding & Space",
    btn_detail: "View Detail",
    btn_order: "Order Now",
    btn_consult: "Inquire 1:1",
    inquiry_price_label: "Quote upon Inquiry",

    // Packaging Section
    pack_badge: "ReBloom Packaging",
    pack_video_title: "Embracing Blooms in<br>Fortune Pouches",
    pack_h2: "Beyond Single-use Wraps,<br>Cherished Keepsake Pouches",
    pack_desc: "At Seoldamhwa, gifting goes beyond passing an object—it shares the enduring spirit and sustainability of Korean heritage. Like bojagi fabric and fortune pouches that remain long after blossoms fade, we design every layer to stay by your side.",
    pack_card1_tag: "Zero-waste Wrapping",
    pack_card1_title: "Zero-waste Wrapping",
    pack_card1_desc: "Wrapped in traditional hanbok silk and fortune pouches, easily repurposed for daily life.",
    pack_card2_tag: "Made for One",
    pack_card2_title: "Bespoke for One",
    pack_card2_desc: "Listening to your recipient and milestone, we craft flowers, colors, and notes solely for them.",
    pack_card3_tag: "Taste Analysis",
    pack_card3_title: "Taste-guided Design",
    pack_card3_desc: "Guided by nuanced preference curation, we propose the most authentic and harmonious floral styling.",

    // Brand Story
    story_header_sub: "Quiet warmth conveyed through unspoken blooms",
    story_header_title: "The Story of Seoldamhwa (說談花)",
    story_quote: "\"Hwa (Flower), Seol (Speak), Dam (Dialogue)\"",
    story_p1: "In ancient times, our ancestors found seasons breathing in a handful of soil beneath the eaves, chanting the poetic philosophy of life in the quiet shadow of blossoms cast upon paper doors. Instead of the opulent and crowded density of Western bouquets, we embrace the timeless beauty of empty space and organic line.",
    story_p2: "Seoldamhwa breathes the vitality of Joseon floral paintings and the serene dignity of moon jars into modern lifestyles. When sending your heart to someone precious, present not mere decoration, but an enduring story that never fades with time.",
    story_side_tag: "Our Story",
    story_side_h2: "Beyond Disposable Wraps,<br>Beauty Infused in Daily Life",
    story_side_p1: "Our gifting philosophy transcends delivering an item—it shares the cherished Korean heritage of mindful sustainability.",
    story_side_p2: "Just like silk bojagi and lucky pouches that endure after the petals fall, we ensure the vessels holding your thoughts remain cherished.",
    story_rebloom_tag: "ReBloom",
    story_rebloom_h2: "Beginning with flowers, reaching wherever precious hearts gather",
    story_btn_shop: "Explore Seoldamhwa Collection",

    // Curator (Custom)
    curation_badge: "Bespoke Curator",
    curation_title: "Let us discover the bloom that speaks for you",
    curation_desc: "Answer five brief questions, and Seoldamhwa will curate the finest flowers.",
    curation_step_fmt: "Step {step} / 5",
    curation_prev: "← Back",
    curation_skip: "Skip →",
    curation_finish_desc: "3 questions complete! You can view recommended blooms now.",
    curation_finish_btn: "View Recommended Blooms",

    curation_q1: "Who is this gift for?",
    curation_q2: "What is the occasion?",
    curation_q3: "What sentiment would you like to convey?",
    curation_q4: "Which color tone do you prefer?",
    curation_q5: "What is your intended budget?",

    // Curator Options
    opt_recipient_lover: "Partner / Lover",
    opt_recipient_parent: "Parents / Elders",
    opt_recipient_friend: "Friend",
    opt_recipient_colleague: "Colleague / Mentor",
    opt_recipient_mentor: "Teacher / Benefactor",
    opt_recipient_me: "For Myself",
    opt_recipient_space: "Space / Corporate",

    opt_occasion_birthday: "Birthday",
    opt_occasion_anniversary: "Anniversary / Proposal",
    opt_occasion_grad: "Graduation / New Start",
    opt_occasion_promote: "Promotion / Opening",
    opt_occasion_wedding: "Wedding / Family Gathering",
    opt_occasion_parents_day: "Parents / Teacher Day",
    opt_occasion_comfort: "Comfort / Get Well",
    opt_occasion_just: "Just Because",

    opt_feeling_congrat: "Celebration",
    opt_feeling_thanks: "Gratitude",
    opt_feeling_love: "Love",
    opt_feeling_cheer: "Support",
    opt_feeling_comfort: "Comfort",
    opt_feeling_space: "Atmosphere",

    opt_color_red: "Red & Burgundy",
    opt_color_pink: "Pink & Peach",
    opt_color_white: "White & Green",
    opt_color_yellow: "Yellow & Orange",
    opt_color_blue: "Blue & Purple",
    opt_color_mix: "Multi-color Blend",
    opt_color_neutral: "Not Sure / Open",

    opt_budget_under30: "Under ₩30,000",
    opt_budget_30to50: "₩30,000 ~ 50,000",
    opt_budget_50to70: "₩50,000 ~ 70,000",
    opt_budget_70to100: "₩70,000 ~ 100,000",
    opt_budget_over100: "Over ₩100,000",
    opt_budget_consult: "Consultation First",

    // Curator Results
    curation_res_badge: "Curated Recommendation",
    curation_res_title: "Curated Blooms Matching Your Heart",
    curation_res_alt_title: "Thoughtful Blooms Matching Your Story",
    curation_res_desc: "Three curated floral gifts hand-selected by Seoldamhwa florists.",
    curation_best_badge: "★ Best Match",
    curation_rec_fmt: "Pick {n}",
    curation_soldout_fmt: "'{name}' is an ideal match, but currently out of stock. Please inquire for replenishment schedules.",
    curation_budget_prep_title: "Collection for this budget is currently in preparation.",
    curation_budget_prep_desc: "We can craft a bespoke 1:1 floral arrangement tailored to your budget. Leave your story and our master florist will assist you.",
    curation_budget_prep_btn: "Request Inquiry for this Budget ↓",
    curation_fill_inquiry_btn: "Prefill 1:1 Inquiry with Chosen Options ↓",
    curation_reset_btn: "Start Over from the Beginning",

    // 1:1 Consultation Form
    inquiry_badge: "1:1 Bespoke Inquiry",
    inquiry_title: "1:1 Consultation with Seoldamhwa Master Florist",
    inquiry_desc: "From space styling and weddings to custom tailored gifts, our master florist consults with utmost care.",
    inquiry_name_label: "Your Name",
    inquiry_name_placeholder: "Enter your name (e.g., Jane Doe)",
    inquiry_phone_label: "Contact Number",
    inquiry_phone_placeholder: "Enter your phone number",
    inquiry_date_label: "Desired Date (Optional)",
    inquiry_date_placeholder: "Select a date (optional)",
    popup_dont_show_today: "Don't show today",
    popup_close: "Close",
    popup_view_details: "View Details",
    popup_status_stopped: "Stopped",
    inquiry_type_label: "What kind of consultation do you need?",
    inquiry_type_custom: "Bespoke Bouquet / Basket Crafting",
    inquiry_type_wedding: "Wedding, Event & Space Styling",
    inquiry_type_corp: "Corporate & Group Orders",
    inquiry_type_specific: "Inquiry on Specific Product",
    inquiry_type_etc: "Other Inquiries",
    inquiry_product_label: "Select Product",
    inquiry_msg_label: "Message",
    inquiry_msg_placeholder: "Feel free to share the desired mood, occasion, budget, or preferred flowers.",
    inquiry_message_placeholder: "Feel free to describe the desired atmosphere, event size, favorite flowers or colors, budget, etc.",
    btn_submit_inquiry: "Submit 1:1 Consultation Request",
    inquiry_alert_success: "[Consultation Received] Thank you, {name}! Your inquiry has been submitted.\nOur master florist will review your request and reach out via {phone}.",

    // PDP Modal
    pdp_badge_fresh_title: "Guaranteed Fresh Delivery",
    pdp_badge_fresh_desc: "Safe climate-controlled delivery on your scheduled date",
    pdp_badge_silk_title: "Handcrafted Silk Bojagi",
    pdp_badge_silk_desc: "Wrapped in traditional silk and finished with an authentic norigae",
    pdp_price_label: "Price",
    pdp_meaning_prefix: "Flower Meaning: ",
    pdp_size_label: "Select Size",
    pdp_delivery_time_morning: "Morning 10:00 - 13:00",
    pdp_delivery_time_afternoon: "Afternoon 14:00 - 18:00",
    pdp_delivery_time_evening: "Evening 18:00 - 21:00",
    pdp_package_label: "Packaging Option",
    pdp_package_basic: "Classic Hanji Paper Wrap (Complimentary)",
    pdp_package_silk: "Traditional Silk Bojagi & Jade Norigae (+₩15,000)",
    pdp_qty_label: "Quantity",
    pdp_total_label: "Total Amount",
    pdp_btn_cart: "Add to Cart",
    pdp_btn_buy: "Buy Now",
    pdp_inquiry_guide: "Space styling and wedding projects are custom estimated following a 1:1 consultation.",
    pdp_btn_inquiry: "Request 1:1 Consultation",

    // Stock labels
    stock_ample: "In Stock",
    stock_low_fmt: "Low Stock ({qty} left)",
    stock_soldout: "Out of Stock",
    restock_title: "🔔 Get notified when it is back",
    restock_desc: "Leave your number and we will text you as soon as it is restocked.",
    restock_name_ph: "Name (optional)",
    restock_consent: "[Required] I agree to the use of my phone number for the restock notice (deleted afterwards).",
    restock_btn: "Notify me",
    restock_done: "Done! We will text you when it is back.",
    restock_dup: "You are already on the list. We will text you when it is back.",
    stock_inquiry_only: "Consultation Only",
    size_recommended_label: "Recommended",

    // Cart Drawer
    cart_drawer_title: "Damhwa Bundle (Cart)",
    cart_empty: "Your cart is currently empty.",
    cart_size_prefix: "Size: ",
    cart_delivery_prefix: "Delivery: ",
    cart_total_label: "Total Order Amount",
    cart_btn_checkout: "Proceed to Checkout",

    // Checkout Modal
    checkout_sub: "Binding heartfelt sincerity into every knot",
    checkout_title: "Order & Checkout",
    co_orderer_title: "Your details",
    co_recipient_title: "Recipient",
    co_name: "Name",
    co_phone: "Phone",
    co_same_as_orderer: "Same as me",
    co_method_title: "Delivery method",
    co_method_quick: "Same-day courier",
    co_method_parcel: "Parcel delivery",
    co_method_pickup: "Store pickup",
    co_free: "Free",
    co_zip: "Postcode",
    co_find_address: "Find address",
    co_address_ph: "Address (use Find address or type it)",
    co_address_detail_ph: "Apt / unit / floor",
    co_hide_sender: "Leave my name off the card (anonymous gift)",
    co_request: "Delivery request (optional)",
    co_request_ph: "e.g. Leave with the building concierge if no one is home",
    co_items_total: "Items",
    co_delivery_fee: "Delivery",
    co_free_hint: "Add {amount} more for free delivery.",
    co_submit: "Place order",
    co_placing_order: "Placing your order…",
    co_order_failed: "Could not place order. Please check your details and try again.",
    pdp_section_flower_guide: "Care guide by flower",
    pdp_flower_guide_none: "On arrival, trim the stems at an angle and place them in cool water.",
    co_goods_parcel_only: "Goods are shipped by parcel only.",
    cat_vase: "Vase & Centerpieces",
    cat_dried: "Dried & Preserved",
    cat_plant: "Plants & Pots",
    cat_goods: "Goods",
    browse_pages: "Pages",
    browse_prev: "Previous page",
    browse_next: "Next page",
    pack_video_tag: "ReBloom Packaging",
    pack_badge: "ReBloom Packaging",
    cs_location_tag: "Location & Atelier",
    cs_band_tag: "Customer Center",
    hero_btn_recommend_fmt: "Featured : {name}",
    dict_browse_flower: "See all pieces with this flower →",
    dict_no_products: "No pieces with this flower yet. Ask us for a custom order.",
    dict_screen_label: "Choose a month",
    dict_this_month: "this month",
    co_today: "today",
    co_method_quick_plain: "Courier",
    co_quick_until: "Order by {time} today for same-day delivery",
    co_date_expired: "That date is no longer available. Please pick again.",
    route_no_product: "That product does not exist or is not available now.",
    route_cart_empty: "Your cart is empty. Please add flowers first.",
    route_unknown: "Page not found, so we brought you home.",
    stock_cart_full: "Your cart already holds all remaining stock.",
    stock_cart_limited: "Only {n} left, so {n} were added.",
    stock_changed: "Stock changed while you were ordering. Please adjust your cart.",
    stock_left_n: "{n} left",
    cta_pick_1: "Who is it for?",
    cta_pick_2: "What is the occasion?",
    cta_pick_3: "What feeling to share?",
    cta_pick_4: "This one suits you ✓",
    dict_colors: "Colors",
    browse_flower_chip: "With {name}",
    browse_flower_clear: "Clear flower filter",
    co_coupon_label: "Coupon code (optional)",
    co_coupon_ph: "e.g. SDH-7K2P-QX9A",
    co_coupon_apply: "Apply",
    co_coupon_remove: "Remove",
    co_coupon_discount: "Coupon discount",
    coupon_ok: "{amount} off applied.",
    coupon_err_none: "This coupon code does not exist. Please check it.",
    coupon_err_used: "This coupon has already been used.",
    coupon_err_stopped: "This coupon cannot be used right now.",
    coupon_err_before: "Usable from {date}.",
    coupon_err_expired: "This coupon has expired.",
    coupon_err_min: "Usable on orders of {amount} or more.",
    wish_panel_title: "♡ Saved & recently viewed",
    wish_panel_all: "See all",
    wish_empty_short: "Tap ♡ on a product to save it here.",
    guide_location: "Location",
    guide_location_desc: "Find us with the map and map-app buttons below. Please check our hours before visiting.",
    footer_col_browse: "Explore",
    footer_link_browse: "Browse flowers",
    footer_link_wishlist: "Saved & recently viewed",
    co_date_label: "Delivery date (required)",
    co_pickup_day_label: "Pickup date (required)",
    co_time_label: "Delivery time",
    co_pickup_time_label: "Pickup time",
    co_time_parcel_note: "Parcel delivery has no time slot. We ship so it arrives on the chosen date.",
    co_date_note: "Closed days cannot be chosen. Pick a day within the next 14 business days.",
    co_date_required: "Please pick a date on the calendar.",
    co_date_full: "Orders are closed for this date.",
    co_date_full_pick_other: "Orders are closed for this date. Please choose another date.",
    co_cal_prev: "Previous month",
    co_cal_next: "Next month",
    nav_dictionary: "Flower Guide",
    dict_title: "Flower Guide",
    dict_desc: "The meanings and seasons of the flowers we use.",
    dict_now: "🌿 In season",
    dict_all: "All",
    dict_search_ph: "Search by name or meaning",
    dict_empty: "No flowers match yet.",
    browse_recipient: "For",
    browse_feeling: "Feeling",
    browse_budget: "Budget",
    browse_any: "Any",
    season_now: "🌿 In season",
    browse_season_only: "🌿 In season now",
    pdp_flowers_used: "Flowers in this piece",
    flower_meaning_label: "Meaning",
    flower_season: "Season",
    flower_care: "Care tip",
    home_view_all: "Browse all flowers →",
    cta_badge: "Custom Damhwa",
    cta_title: "Not sure which flowers to choose?",
    cta_desc: "Pick who it is for, the occasion and the feeling, and we will suggest flowers that fit.",
    cta_btn: "Get a recommendation →",
    cta_btn_chat: "💬 Ask us now",
    browse_title: "Browse Flowers",
    browse_desc: "Filter the same way as Custom Damhwa: recipient, occasion, feeling, color and budget.",
    browse_color: "Color",
    browse_occasion: "Occasion",
    browse_sort: "Sort",
    sort_recommend: "Recommended",
    sort_price_asc: "Price: low to high",
    sort_price_desc: "Price: high to low",
    browse_count: "{n} flowers",
    browse_empty: "No flowers match these filters.",
    browse_reset: "Clear filters",
    chat_title: "💬 Ask Seoldamhwa",
    chat_desc: "Leave a message and we will call or text you soon.",
    chat_message_ph: "Your question (e.g. Can it arrive tomorrow afternoon?)",
    chat_send: "Send",
    chat_kakao: "Ask on KakaoTalk",
    chat_done: "Thank you! We will contact you soon.",
    chat_about: "About: {name}",
    co_step1: "① Your flowers",
    co_step2: "② Recipient & delivery",
    co_step3: "③ Review & order",
    co_edit_cart: "Edit cart",
    co_next_to_2: "Next: Recipient & delivery →",
    co_next_to_3: "Next: Review →",
    co_prev: "← Back",
    co_anonymous: "anonymous",
    co_payment_note: "Online payment is coming soon. After we confirm your order, we will contact you with payment details.",
    co_quick_area_warn: "Same-day courier is available in Seoul only. Please choose another method or ask us in a 1:1 consultation.",
    co_address_search_fail: "Could not load the address search. Please type the address.",
    co_method_required: "Please choose a delivery method.",
    co_phone_invalid: "Please enter a 10–11 digit phone number (e.g. 010-1234-5678).",
    co_done_title: "Your order has been received",
    co_done_desc: "We will craft it with care. Use the order number below to check your order anytime.",
    co_order_number: "Order number",
    co_copy: "Copy",
    co_copied: "Copied",
    co_lookup_btn: "Track order",
    co_continue: "Continue shopping",
    co_pickup_date_short: "Pickup",
    co_delivery_date_short: "Delivery",
    lookup_title: "Track Order",
    lookup_number_ph: "Order number (e.g. SDH-12345678)",
    lookup_phone_ph: "Your phone number",
    lookup_btn: "Search",
    lookup_not_found: "We could not find this order. Please check the order number and your phone number.",
    lookup_items: "Items",
    lookup_tracking: "Tracking",
    st_preparing: "Preparing",
    st_packaged: "Packed",
    st_delivering: "On the way",
    st_completed: "Delivered",
    st_cancelled: "This order was cancelled.",
    checkout_name_label: "Recipient Name",
    checkout_phone_label: "Contact Phone",
    checkout_address_label: "Shipping Address",
    checkout_message_label: "Traditional Hanji Note to Include",
    checkout_message_placeholder: "Enter the message to enclose with your gift.",
    checkout_default_message: "Sending deepest gratitude and warm joy to someone precious.",
    checkout_total_label: "Total Payment Amount",
    checkout_btn_submit: "Complete Secure Order",
    order_alert_complete: "[Order Complete] Thank you, {name}! Your order has been placed successfully.\nWe will freshly craft and deliver on your chosen arrival date ({date}).",
    order_alert_empty_cart: "Your cart is currently empty.",

    // CS Band & Location
    cs_location_badge: "Location & Atelier",
    cs_location_title: "Visit Seoldamhwa Atelier",
    cs_btn_kakaomap: "Open in Kakao Map",
    cs_btn_navermap: "Open in Naver Map",
    cs_band_badge: "Customer Center",
    cs_band_title: "Customer Center",
    cs_band_hours_default: "Weekdays 10:00 - 18:00",
    cs_band_lunch_default: "Lunch 12:30 - 13:30",
    cs_band_closed_default: "Closed on Weekends & Holidays",
    cs_band_email_label: "Email Inquiry",
    cs_band_btn_consult: "1:1 Consultation",
    cs_band_kakao_label: "KakaoTalk Channel",
    cs_band_toggle_hours: "View Weekly Hours",
    cs_band_status_open: "Open now · until {time}",
    cs_band_status_lunch: "Lunch break · reopens at {time}",
    cs_band_status_before_open: "Preparing to open · opens at {time}",
    cs_band_status_closed_today: "Closed today",
    cs_band_status_closed_today_reason: "Closed today · {reason}",
    cs_band_status_after_close_tomorrow: "Closed for today · opens tomorrow at {time}",
    cs_band_status_after_close_day: "Closed for today · opens {day} at {time}",
    cs_band_closed: "Closed",
    cs_band_lunch_label: "Lunch",
    cs_band_temp_closure_label: "Temporary closure",
    day_0: "Sun", day_1: "Mon", day_2: "Tue", day_3: "Wed", day_4: "Thu", day_5: "Fri", day_6: "Sat",
    day_full_0: "Sunday", day_full_1: "Monday", day_full_2: "Tuesday", day_full_3: "Wednesday", day_full_4: "Thursday", day_full_5: "Friday", day_full_6: "Saturday",

    // Preview Mode & Visibility
    preview_banner_private: "Preview Mode · This product is not yet visible to customers",
    preview_banner_scheduled: "Preview Mode · Scheduled to be published at {time}",
    preview_banner_public: "Preview Mode · This product is currently public",
    preview_close: "Close",
    preview_btn_disabled: "Preview Mode (Ordering Disabled)",
    checkout_hidden_removed: "Products that are currently private have been removed from your cart: {items}",

    // Footer
    footer_tagline: "\"Flowers that tell a story, embodying timeless Korean grace\"",
    footer_desc: "Seoldamhwa is a modern oriental floral select shop crafted for the contemporary generation. We bring dignity into everyday spaces through seasonal blooms, Joseon court art, and the calm curves of moon jars.",
    footer_guide_title: "Customer Guide",
    footer_link_bojagi: "Traditional Bojagi Packaging",
    footer_link_care: "Fresh Bloom Care Tips",
    footer_link_admin: "Admin Center Login",
    footer_link_admin_short: "Admin",
    footer_terms: "Terms of Service",
    footer_privacy: "Privacy Policy",
    footer_media_copyright: "© SeolDamHwa. Photos and videos on this site may not be used without permission.",
    footer_link_delivery: "Delivery Guide",
    footer_link_refund: "Exchange & Refund Policy",
    footer_biz_pending: "Business registration details will be added soon.",
    consent_privacy_inquiry: "[Required] I agree to the collection and use of my personal information (name, phone, inquiry) for this consultation.",
    consent_privacy_order: "[Required] I agree to the collection and use of my personal information (name, phone, address) for ordering and delivery, including sharing with the courier.",
    consent_refund: "[Required] I understand that fresh flowers cannot be cancelled or refunded from 1 day before the delivery date.",
    consent_view: "View",
    page_korean_only: "This page is currently available in Korean only.",

    // Search
    search_placeholder: "Search by flower name, meaning, or story keyword...",
    search_no_results: "No matched products found.",

    // Flower Letters
    reviews_count_suffix: " heartfelt letters",
    reviews_rating_detail: "Rating details",
    nav_reviews: "Reviews",
    reviews_tag: "FLOWER LETTERS",
    reviews_title: "Flower Letters",
    reviews_subtitle: "A collection of heartfelt stories delivered with our flowers.",
    reviews_empty: "No letters published yet.",
    home_reviews_tag: "FLOWER LETTERS",
    home_reviews_title: "Stories Delivered with Flowers",
    home_reviews_more: "View all letters",
    home_reviews_view_all: "View all letters",
    review_recipient_label: "Who was this flower for?",
    review_recipient_required: "Please select who this flower was for.",
    letter_reply_title: "SeolDamHwa's Reply",
    letter_video_badge: "Video",
    filter_story_all: "All",
    filter_story_media: "Photos & Videos",
    empty_reviews_title: "No reviews published yet.",
    empty_reviews_sub: "Waiting for the first flower letter."
  },

  ja: {
    // ヘッダー＆ナビゲーション
    nav_story: "說談花の物語",
    nav_shop: "花を愛でる",
    nav_custom: "お誂え談花",
    nav_guide: "ご案内",
    guide_subtitle: "ご注文の前後に知っておきたいことをまとめました。",
    guide_cta: "ご不明な点は1:1相談でお気軽にどうぞ",
    lang_label: "言語選択",
    search_title: "検索",
    cart_title_badge: "買い物かご",

    // ヒーローセクション
    hero_atelier_badge: "Contemporary Korean Floral Atelier · 2026 Collection",
    hero_tagline: "花で紡ぐ、端正なる物語",
    hero_h1: "先人の風流と余白の美、<br><span class=\"text-seal-red ink-stroke\">現代の感性</span>で咲き誇る",
    hero_sub: "使い捨ての包装ではなく、心に残る美しさを。<br>說談花が贈る、一対一のお誂え花ギフト",
    hero_btn_shop: "花を愛でる",

    // ギャラリー / PLP
    gallery_badge: "ギャラリー 談花(談花)",
    gallery_title: "四季と節気を映した旬の生花コレクション",
    gallery_desc: "一幅の美術品を鑑賞するように。洗練された現代の感性に寄り添う、端正なラインナップです。",
    cat_all: "すべて見る",
    cat_bouquet: "花束 (ブーケ)",
    pdp_crumb_home: "ホーム",
    pdp_back: "← 戻る",
    pdp_section_story: "この花に込めた物語",
    pdp_flower_meaning: "花と花言葉",
    pdp_section_info: "お届け前にご確認ください",
    pdp_related: "雰囲気の似た花",
    pdp_recent: "最近見た花",
    wish_add: "お気に入り",
    wish_remove: "お気に入り解除",
    wish_title: "お気に入りの花",
    wish_empty: "まだお気に入りはありません。商品ページの♡を押してください。",
    recent_empty: "まだ見た花はありません。",
    price_inquiry: "ご相談後お見積り",
    cat_basket: "花かご",
    cat_space: "空間・ウエディング",
    btn_detail: "詳しく見る",
    btn_order: "注文する",
    btn_consult: "個別相談",
    inquiry_price_label: "お見積り相談",

    // パッケージングセクション
    pack_badge: "ReBloom Packaging",
    pack_video_title: "福を呼ぶ小袋に<br>花を包んで",
    pack_h2: "捨てられる包装ではなく、<br>暮らしに寄り添う福小袋",
    pack_desc: "說談花が大切にする贈り物とは、単に花を手渡すことにとどまりません。花が枯れた後も日常で愛される風呂敷や福小袋のように、想いを包んだ器までもが長く傍らに残る伝統の知恵を分かち合います。",
    pack_card1_tag: "繰り返し使う風呂敷",
    pack_card1_title: "捨てない伝統包装",
    pack_card1_desc: "上質な韓服の絹風呂敷と小袋で包み、花を愛でた後も日常の小物入れとして再利用いただけます。",
    pack_card2_tag: "ただ一人のための花",
    pack_card2_title: "ただ一人のためのお誂え",
    pack_card2_desc: "受け取る方と記念日の物語に耳を傾け、花、色合い、手紙の言葉までその方のためだけに紡ぎます。",
    pack_card3_tag: "好みのキュレーション",
    pack_card3_title: "好みを読み解く設計",
    pack_card3_desc: "繊細な対話データをもとに、伝統の気品と好みに調和した最高の一品をご提案します。",

    // ブランドストーリー
    story_header_sub: "言葉にしなくとも、花が伝える端正なぬくもり",
    story_header_title: "說談花(ソンダムファ)の物語",
    story_quote: "\"花(花)が語り(說)、物語(談)となる\"",
    story_p1: "先人たちは、軒下のひと握りの土にも季節の息吹を感じ、障子越しに揺れる花の影ひとつにも人生の風流と哲学を見出しました。華やかさで隙間なく埋め尽くすのではなく、私たちが求めたのは『余白と線の美学』でした。",
    story_p2: "說談花は、朝鮮宮廷の花鳥画に宿る生命力と、月壺や粉青沙器の素朴な気品を現代のライフスタイルへと吹き込みます。大切な人へ心を届けるとき、単なる装飾品ではなく、歳月を重ねても色褪せない物語を贈ってください。",
    story_side_tag: "Our Story",
    story_side_h2: "使い捨ての包装ではなく、<br>日常に溶け込む美しさ",
    story_side_p1: "說談花が夢見る贈り物は、物を届けることを超え、大切に使い続ける伝統の心を分かち合うことです。",
    story_side_p2: "花が咲き誇った後も手元に残る風呂敷のように、想いを包んだ器まで長く愛されるよう心を配ります。",
    story_rebloom_tag: "ReBloom",
    story_rebloom_h2: "一輪の花から、尊い心が集うすべての空間へ",
    story_btn_shop: "說談花の花コレクションを見る",

    // キュレーター (カスタム)
    curation_badge: "お誂え談花",
    curation_title: "心に似合う花を、ご一緒にお探しします",
    curation_desc: "5つの質問にお答えいただくだけで、說談花がぴったりの花をお選びします。",
    curation_step_fmt: "{step}段階 / 5段階",
    curation_prev: "← 前へ",
    curation_skip: "スキップ →",
    curation_finish_desc: "3つの質問にお答えいただきました。今すぐおすすめの花をご覧いただけます。",
    curation_finish_btn: "似合う花を見る",

    curation_q1: "どなたへの贈り物ですか？",
    curation_q2: "どのような日ですか？",
    curation_q3: "どのような想いを届けたいですか？",
    curation_q4: "お好みの色合いはございますか？",
    curation_q5: "ご予算はどのくらいですか？",

    // キュレーター選択肢
    opt_recipient_lover: "恋人・パートナー",
    opt_recipient_parent: "ご両親・目上の方",
    opt_recipient_friend: "ご友人",
    opt_recipient_colleague: "同僚・上司",
    opt_recipient_mentor: "恩師・恩人",
    opt_recipient_me: "ご自身へ",
    opt_recipient_space: "空間・法人",

    opt_occasion_birthday: "お誕生日",
    opt_occasion_anniversary: "記念日・プロポーズ",
    opt_occasion_grad: "ご卒業・ご入学",
    opt_occasion_promote: "ご昇進・開店祝い",
    opt_occasion_wedding: "ご結婚・顔合わせ",
    opt_occasion_parents_day: "母の日・父の日・感謝の日",
    opt_occasion_comfort: "お見舞い・励まし",
    opt_occasion_just: "特別な日ではなく日常に",

    opt_feeling_congrat: "お祝い",
    opt_feeling_thanks: "感謝",
    opt_feeling_love: "愛・想い",
    opt_feeling_cheer: "応援",
    opt_feeling_comfort: "安らぎ・慰め",
    opt_feeling_space: "空間演出",

    opt_color_red: "レッド・バーガンディ",
    opt_color_pink: "ピンク・ピーチ",
    opt_color_white: "ホワイト・グリーン",
    opt_color_yellow: "イエロー・オレンジ",
    opt_color_blue: "ブルー・パープル",
    opt_color_mix: "多彩な彩り（ミックス）",
    opt_color_neutral: "おまかせ・指定なし",

    opt_budget_under30: "3万ウォン以下",
    opt_budget_30to50: "3〜5万ウォン",
    opt_budget_50to70: "5〜7万ウォン",
    opt_budget_70to100: "7〜10万ウォン",
    opt_budget_over100: "10万ウォン以上",
    opt_budget_consult: "相談して決める",

    // キュレーター結果
    curation_res_badge: "Curated Recommendation",
    curation_res_title: "あなたの想いに寄り添う花の提案",
    curation_res_alt_title: "物語に優しく寄り添う花々",
    curation_res_desc: "說談花のフローリストが厳選した、3つの最適な花と贈り物です。",
    curation_best_badge: "★ 最も似合う花",
    curation_rec_fmt: "おすすめ {n}",
    curation_soldout_fmt: "『{name}』も大変よく似合いますが、現在は一時品切れ中です。入荷時期はお気軽にお問い合わせください。",
    curation_budget_prep_title: "この価格帯の商品は現在ご準備中です。",
    curation_budget_prep_desc: "ご予算に合わせて1対1で個別にお花をお誂えいたします。ご希望の物語をお聞かせいただければ幸いです。",
    curation_budget_prep_btn: "この予算で相談を申し込む ↓",
    curation_fill_inquiry_btn: "選択した条件で相談フォームに入力する ↓",
    curation_reset_btn: "初めから選び直す",

    // 1:1 相談フォーム
    inquiry_badge: "1:1 お誂え相談窓口",
    inquiry_title: "說談花の匠による 1:1 お誂え相談",
    inquiry_desc: "空間装花、ウエディング、特別なお誂えギフトまで、フローリストが真心込めて直接ご案内いたします。",
    inquiry_name_label: "お名前",
    inquiry_name_placeholder: "お名前をご入力ください",
    inquiry_phone_label: "ご連絡先",
    inquiry_phone_placeholder: "お電話番号をご入力ください",
    inquiry_date_label: "ご希望日（任意）",
    inquiry_date_placeholder: "日付を選択（任意）",
    popup_dont_show_today: "今日は表示しない",
    popup_close: "閉じる",
    popup_view_details: "詳細を見る",
    popup_status_stopped: "停止中",
    inquiry_type_label: "どのようなご相談でしょうか？",
    inquiry_type_custom: "お誂え花束・花かごの制作",
    inquiry_type_wedding: "ウエディング・式典・空間装花",
    inquiry_type_corp: "法人・団体様のご注文",
    inquiry_type_specific: "特定商品についてのお問い合わせ",
    inquiry_type_etc: "その他のお問い合わせ",
    inquiry_product_label: "商品を選択",
    inquiry_msg_label: "ご相談内容",
    inquiry_msg_placeholder: "ご希望の雰囲気、ご用途、ご予算などをご自由にご記入ください。",
    inquiry_message_placeholder: "ご希望の雰囲気、イベントの規模、お好みの花や色、ご予算などを自由にご記入ください。",
    btn_submit_inquiry: "1:1 お誂え相談を申し込む",
    inquiry_alert_success: "【相談受付完了】{name} 様、お誂え相談を承りました。\nフローリストが内容を確認の上、ご連絡先（{phone}）へ丁寧にご案内いたします。",

    // PDP モーダル
    pdp_badge_fresh_title: "産地直送の安心品質",
    pdp_badge_fresh_desc: "全国ご指定日への安全な特急出荷",
    pdp_badge_silk_title: "手仕事による絹風呂敷",
    pdp_badge_silk_desc: "五方色の絹と玉ノリゲの伝統パッケージ",
    pdp_price_label: "販売価格",
    pdp_meaning_prefix: "花言葉: ",
    pdp_size_label: "サイズ選択",
    pdp_delivery_time_morning: "午前 10:00〜13:00",
    pdp_delivery_time_afternoon: "午後 14:00〜18:00",
    pdp_delivery_time_evening: "夕方 18:00〜21:00",
    pdp_package_label: "風呂敷包装",
    pdp_package_basic: "基本 端麗韓紙包装（無料）",
    pdp_package_silk: "伝統 絹風呂敷＆ノリゲ包装（+₩15,000）",
    pdp_qty_label: "数量",
    pdp_total_label: "合計金額",
    pdp_btn_cart: "買い物かごに入れる",
    pdp_btn_buy: "今すぐ購入する",
    pdp_inquiry_guide: "空間装花およびウエディングは、空間規模や季節に合わせた事前相談後にお見積もり書を発行いたします。",
    pdp_btn_inquiry: "1:1 個別相談を申し込む",

    // 在庫ラベル
    stock_ample: "在庫あり",
    stock_low_fmt: "残りわずか (残数: {qty}点)",
    stock_soldout: "一時品切れ",
    restock_title: "🔔 再入荷をお知らせします",
    restock_desc: "ご連絡先を残していただければ、入荷次第SMSでお知らせします。",
    restock_name_ph: "お名前（任意）",
    restock_consent: "【必須】再入荷のご案内のための連絡先の収集・利用に同意します（ご案内後に破棄）。",
    restock_btn: "再入荷を通知",
    restock_done: "受け付けました。入荷次第SMSでお知らせします。",
    restock_dup: "すでにお申し込み済みです。入荷次第お知らせします。",
    stock_inquiry_only: "相談商品",
    size_recommended_label: "おすすめ",

    // カートドロワー
    cart_drawer_title: "談花の風呂敷包み (買い物かご)",
    cart_empty: "買い物かごに商品がございません。",
    cart_size_prefix: "サイズ: ",
    cart_delivery_prefix: "お届け: ",
    cart_total_label: "最終お支払い金額",
    cart_btn_checkout: "ご注文手続きへ進む",

    // 注文決済モーダル
    checkout_sub: "端正な真心を結んでお届けします",
    checkout_title: "ご注文とお支払い",
    co_orderer_title: "ご注文者",
    co_recipient_title: "お届け先",
    co_name: "お名前",
    co_phone: "電話番号",
    co_same_as_orderer: "ご注文者と同じ",
    co_method_title: "配送方法",
    co_method_quick: "当日バイク便",
    co_method_parcel: "宅配便",
    co_method_pickup: "店頭受け取り",
    co_free: "無料",
    co_zip: "郵便番号",
    co_find_address: "住所検索",
    co_address_ph: "住所（住所検索または直接入力）",
    co_address_detail_ph: "建物名・部屋番号",
    co_hide_sender: "カードに差出人の名前を書かない（匿名ギフト）",
    co_request: "配送のご要望（任意）",
    co_request_ph: "例：不在時は管理人室へお預けください",
    co_items_total: "商品金額",
    co_delivery_fee: "送料",
    co_free_hint: "あと{amount}で送料無料です。",
    co_submit: "注文する",
    co_placing_order: "ご注文を受付中…",
    co_order_failed: "ご注文を受付できませんでした。入力内容をご確認の上、再度お試しください。",
    pdp_section_flower_guide: "花ごとのお手入れ",
    pdp_flower_guide_none: "届いた日に茎の先を斜めに少し切り、涼しい水に生けてください。",
    co_goods_parcel_only: "グッズは宅配便のみでお届けします。",
    cat_vase: "花瓶アレンジ・センターピース",
    cat_dried: "ドライ・プリザーブド",
    cat_plant: "鉢植え・植物",
    cat_goods: "グッズ",
    browse_pages: "ページ",
    browse_prev: "前のページ",
    browse_next: "次のページ",
    pack_video_tag: "ReBloom パッケージ",
    pack_badge: "福袋（ポクチュモニ）包装",
    cs_location_tag: "說談花アトリエ",
    cs_band_tag: "お問い合わせ",
    hero_btn_recommend_fmt: "今月のおすすめ : {name}",
    dict_browse_flower: "この花を使った商品をすべて見る →",
    dict_no_products: "この花を使った商品はまだありません。オーダー相談でお問い合わせください。",
    dict_screen_label: "月を選ぶ",
    dict_this_month: "今月",
    co_today: "本日",
    co_method_quick_plain: "バイク便",
    co_quick_until: "本日{time}までのご注文は本日お届け",
    co_date_expired: "選んだ日はもう選べません。カレンダーから選び直してください。",
    route_no_product: "お探しの商品がないか、現在は表示できません。",
    route_cart_empty: "カートが空です。先にお花を入れてください。",
    route_unknown: "ページが見つからないため、ホームに戻りました。",
    stock_cart_full: "残りの在庫分はすでにカートに入っています。",
    stock_cart_limited: "在庫が残り{n}点のため、{n}点だけ入れました。",
    stock_changed: "ご注文の間に在庫が減りました。カートの数量を直してください。",
    stock_left_n: "残り{n}点",
    cta_pick_1: "どなたへ贈りますか？",
    cta_pick_2: "どんな日ですか？",
    cta_pick_3: "どんな気持ちを込めますか？",
    cta_pick_4: "この花が似合います ✓",
    dict_colors: "色",
    browse_flower_chip: "{name}を使った花だけ",
    browse_flower_clear: "花の絞り込みを解除",
    co_coupon_label: "クーポンコード（任意）",
    co_coupon_ph: "例：SDH-7K2P-QX9A",
    co_coupon_apply: "適用",
    co_coupon_remove: "外す",
    co_coupon_discount: "クーポン割引",
    coupon_ok: "{amount}の割引を適用しました。",
    coupon_err_none: "存在しないクーポンコードです。ご確認ください。",
    coupon_err_used: "すでに使用されたクーポンです。",
    coupon_err_stopped: "現在使用できないクーポンです。",
    coupon_err_before: "{date}から使用できます。",
    coupon_err_expired: "有効期限が切れたクーポンです。",
    coupon_err_min: "商品金額が{amount}以上で使用できます。",
    wish_panel_title: "♡ お気に入り・最近見た花",
    wish_panel_all: "すべて見る",
    wish_empty_short: "商品の♡を押すとここに集まります。",
    guide_location: "アクセス",
    guide_location_desc: "下の地図と地図アプリのボタンでお越しください。ご来店前に営業時間をご確認ください。",
    footer_col_browse: "見る",
    footer_link_browse: "花を探す",
    footer_link_wishlist: "お気に入り・最近見た花",
    co_date_label: "お届け希望日（必須）",
    co_pickup_day_label: "受け取り日（必須）",
    co_time_label: "お届け時間帯",
    co_pickup_time_label: "受け取り時間帯",
    co_time_parcel_note: "宅配便は時間帯を指定できません。選んだ日に届くようにお送りします。",
    co_date_note: "定休日は選べません。明日から営業日14日以内でお選びください。",
    co_date_required: "カレンダーから日付を選んでください。",
    co_date_full: "この日の注文は締め切られました。",
    co_date_full_pick_other: "ご指定の日は注文が締め切られました。別の日をお選びください。",
    co_cal_prev: "前の月",
    co_cal_next: "次の月",
    nav_dictionary: "花図鑑",
    dict_title: "花図鑑",
    dict_desc: "說談花で使う花の花言葉と旬をまとめました。",
    dict_now: "🌿 今が旬",
    dict_all: "すべて",
    dict_search_ph: "花の名前や花言葉で検索",
    dict_empty: "条件に合う花はまだありません。",
    browse_recipient: "贈る相手",
    browse_feeling: "気持ち",
    browse_budget: "ご予算",
    browse_any: "すべて",
    season_now: "🌿 今が旬",
    browse_season_only: "🌿 今が旬の花だけ",
    pdp_flowers_used: "この商品に使った花",
    flower_meaning_label: "花言葉",
    flower_season: "旬",
    flower_care: "お手入れ",
    home_view_all: "すべての花を見る →",
    cta_badge: "おまかせ談花",
    cta_title: "どの花がいいか迷ったら",
    cta_desc: "贈る相手・場面・気持ちを選ぶだけで、似合う花をご提案します。",
    cta_btn: "おすすめを受ける →",
    cta_btn_chat: "💬 今すぐ質問する",
    browse_title: "花を探す",
    browse_desc: "おまかせ談花と同じ基準（贈る相手・場面・気持ち・色・ご予算）で絞り込めます。",
    browse_color: "色",
    browse_occasion: "シーン",
    browse_sort: "並び替え",
    sort_recommend: "おすすめ順",
    sort_price_asc: "価格の安い順",
    sort_price_desc: "価格の高い順",
    browse_count: "{n}件の花",
    browse_empty: "条件に合う花がありません。",
    browse_reset: "条件をクリア",
    chat_title: "💬 說談花に質問する",
    chat_desc: "メッセージを残していただければ、お電話またはSMSでご連絡します。",
    chat_message_ph: "ご質問をどうぞ（例：明日の午後に届きますか？）",
    chat_send: "送信",
    chat_kakao: "カカオトークで問い合わせ",
    chat_done: "ありがとうございます。確認次第ご連絡します。",
    chat_about: "お問い合わせ商品：{name}",
    co_step1: "① ご注文の花",
    co_step2: "② お届け先・配送",
    co_step3: "③ 確認・注文",
    co_edit_cart: "カートを編集",
    co_next_to_2: "次へ：お届け先・配送 →",
    co_next_to_3: "次へ：確認 →",
    co_prev: "← 戻る",
    co_anonymous: "匿名",
    co_payment_note: "オンライン決済は準備中です。ご注文を確認後、お支払い方法をご連絡いたします。",
    co_quick_area_warn: "当日バイク便はソウル市内のみです。他の配送方法を選ぶか、1:1相談でお問い合わせください。",
    co_address_search_fail: "住所検索を読み込めませんでした。住所を直接入力してください。",
    co_method_required: "配送方法を選んでください。",
    co_phone_invalid: "電話番号を10〜11桁で入力してください。(例: 010-1234-5678)",
    co_done_title: "ご注文を承りました",
    co_done_desc: "心を込めてお作りします。下記の注文番号でいつでも状況をご確認いただけます。",
    co_order_number: "注文番号",
    co_copy: "コピー",
    co_copied: "コピーしました",
    co_lookup_btn: "注文を確認",
    co_continue: "買い物を続ける",
    co_pickup_date_short: "受け取り日",
    co_delivery_date_short: "お届け日",
    lookup_title: "注文照会",
    lookup_number_ph: "注文番号（例：SDH-12345678）",
    lookup_phone_ph: "ご注文者の電話番号",
    lookup_btn: "照会する",
    lookup_not_found: "ご注文が見つかりませんでした。注文番号と電話番号をご確認ください。",
    lookup_items: "商品",
    lookup_tracking: "送り状",
    st_preparing: "制作中",
    st_packaged: "梱包完了",
    st_delivering: "配送中",
    st_completed: "配達完了",
    st_cancelled: "ご注文はキャンセルされました。",
    checkout_name_label: "お届け先のお名前",
    checkout_phone_label: "ご連絡先電話番号",
    checkout_address_label: "お届け先住所",
    checkout_message_label: "風呂敷に同封する伝統韓紙メッセージ",
    checkout_message_placeholder: "同封するメッセージをご記入ください。",
    checkout_default_message: "かけがえのないご縁に、深い感謝と幸福を込めてお届けします。",
    checkout_total_label: "最終お支払い金額",
    checkout_btn_submit: "安全に決済を完了する",
    order_alert_complete: "【注文完了】{name} 様、ご注文を承りました。\nご希望の到着日（{date}）に合わせて、みずみずしい花を丹精込めてお届けいたします。",
    order_alert_empty_cart: "買い物かごが空です。",

    // CS 案内 & アクセス
    cs_location_badge: "Location & Atelier",
    cs_location_title: "說談花アトリエへのアクセス",
    cs_btn_kakaomap: "Kakaoマップで見る",
    cs_btn_navermap: "Naverマップで見る",
    cs_band_badge: "Customer Center",
    cs_band_title: "お客様センター",
    cs_band_hours_default: "平日 10:00 - 18:00",
    cs_band_lunch_default: "昼休み 12:30 - 13:30",
    cs_band_closed_default: "土・日・祝日 休業",
    cs_band_email_label: "メールでのお問い合わせ",
    cs_band_btn_consult: "1:1 相談申込",
    cs_band_kakao_label: "KakaoTalk チャンネル",
    cs_band_toggle_hours: "曜日別営業時間を見る",
    cs_band_status_open: "営業中 · {time}まで",
    cs_band_status_lunch: "昼休み · {time}より営業再開",
    cs_band_status_before_open: "開店準備中 · {time}にオープン",
    cs_band_status_closed_today: "本日は定休日です",
    cs_band_status_closed_today_reason: "本日は定休日です · {reason}",
    cs_band_status_after_close_tomorrow: "本日の営業は終了しました · 明日 {time}にオープン",
    cs_band_status_after_close_day: "本日の営業は終了しました · {day} {time}にオープン",
    cs_band_closed: "休業",
    cs_band_lunch_label: "昼休み",
    cs_band_temp_closure_label: "臨時休業",
    day_0: "日", day_1: "月", day_2: "火", day_3: "水", day_4: "木", day_5: "金", day_6: "土",
    day_full_0: "日曜日", day_full_1: "月曜日", day_full_2: "火曜日", day_full_3: "水曜日", day_full_4: "木曜日", day_full_5: "金曜日", day_full_6: "土曜日",

    // プレビューモード＆非公開案内
    preview_banner_private: "プレビューモード · お客様にはまだ表示されていない商品です",
    preview_banner_scheduled: "プレビューモード · {time}に公開予定",
    preview_banner_public: "プレビューモード · 現在公開中の商品です",
    preview_close: "閉じる",
    preview_btn_disabled: "プレビューモード (注文不可)",
    checkout_hidden_removed: "現在非公開となっている商品がカートから除外されました: {items}",

    // フッター
    footer_tagline: "\"物語を語る花、先人の風流と余白を包む\"",
    footer_desc: "說談花は、現代のライフスタイルに寄り添うモダンオリエンタルなフローラルセレクトショップです。朝鮮宮廷絵画や月壺の余白、そして旬の生花を通して空間に気品をお届けします。",
    footer_guide_title: "ご利用案内",
    footer_link_bojagi: "伝統風呂敷包装のご案内",
    footer_link_care: "生花のお手入れのコツ",
    footer_link_admin: "管理者センター ログイン",
    footer_link_admin_short: "管理者",
    footer_terms: "利用規約",
    footer_privacy: "個人情報処理方針",
    footer_media_copyright: "© 雪潭花. 当サイトの写真・動画の無断使用を禁じます。",
    footer_link_delivery: "配送のご案内",
    footer_link_refund: "交換・返品のご案内",
    footer_biz_pending: "事業者情報は現在登録準備中です。",
    consent_privacy_inquiry: "【必須】ご相談のための個人情報（お名前・連絡先・お問い合わせ内容）の収集・利用に同意します。",
    consent_privacy_order: "【必須】ご注文・配送のための個人情報（お名前・連絡先・住所）の収集・利用および配送業者への提供に同意します。",
    consent_refund: "【必須】生花の特性上、お届け日の1日前からはキャンセル・返金ができないことを確認しました。",
    consent_view: "詳しく",
    page_korean_only: "このページは現在韓国語のみでご案内しています。",

    // 検索
    search_placeholder: "花の名前、花言葉、物語のキーワードで検索...",
    search_no_results: "該当する商品が見つかりませんでした。",

    // 花のお手紙
    reviews_count_suffix: "通の心温まるお手紙",
    reviews_rating_detail: "評価の内訳",
    nav_reviews: "レビュー",
    reviews_tag: "花のお手紙箱",
    reviews_title: "花のお手紙",
    reviews_subtitle: "花と共に届いた心温まる物語を集めました。",
    reviews_empty: "まだ掲載されたお手紙がありません。",
    home_reviews_tag: "花のお手紙箱",
    home_reviews_title: "花と共に届いた物語",
    home_reviews_more: "すべてのお手紙を見る",
    home_reviews_view_all: "すべてのお手紙を見る",
    review_recipient_label: "どなたへ贈られたお花ですか？",
    review_recipient_required: "どなたへ贈られたか選択してください。",
    letter_reply_title: "説談花からのお返事",
    letter_video_badge: "動画",
    filter_story_all: "すべて",
    filter_story_media: "写真・動画",
    empty_reviews_title: "まだ公開されたレビューがありません。",
    empty_reviews_sub: "最初のお花のお手紙をお待ちしています。"
  }
};

// 7개 정규 상품별 다국어 번역 사전
const PRODUCT_I18N = {
  'signature-bouquet': {
    en: {
      name: "Seoldamhwa Signature Bouquet",
      poeticLine: "Listening to your story, woven blossom by blossom",
      flowerMeaning: "1:1 bespoke dialogue, warmth of everyday seasons",
      description: "An artistic bouquet composed of fresh seasonal blooms sourced at dawn, arranged with Korean balance and empty space."
    },
    ja: {
      name: "說談花 シグネチャーブーケ",
      poeticLine: "大切な物語に耳を傾け、一輪ずつ紡ぐ花束",
      flowerMeaning: "一期一会の対話、季節が運ぶ日々のぬくもり",
      description: "早朝に仕入れた旬の生花を、余白と線の美学で束ねた說談花の代表作です。"
    }
  },
  'norigae-basket': {
    en: {
      name: "Norigae Heritage Flower Basket",
      poeticLine: "A wooden woven basket adorned with hand-knotted silk norigae",
      flowerMeaning: "Filial devotion, celebration of long life and peaceful days",
      description: "Seasonal Korean blooms arranged in a natural wooden basket, finished with a traditional jade norigae ornament."
    },
    ja: {
      name: "ノリゲ 花かご",
      poeticLine: "手編みのかごに、翡翠のノリゲを添えて",
      flowerMeaning: "敬愛と感謝、健やかな長寿と安らぎ",
      description: "丁寧にあつらえた木かごに旬の花をあふれるように盛り、伝統のノリゲ飾りで気品を添えました。"
    }
  },
  'space-design': {
    en: {
      name: "Moon Jar Centerpiece & Floral Styling",
      poeticLine: "Bringing tranquil grace and timeless elegance to the space",
      flowerMeaning: "Celebration, dignity of harmony, breath of space",
      description: "Custom centerpiece and banquet styling drawing inspiration from the curves of Joseon white porcelain moon jars."
    },
    ja: {
      name: "月壺センターピース・空間スタイリング",
      poeticLine: "空間にそっと寄り添う、静けさと優雅な気品",
      flowerMeaning: "祝祭の喜び、調和の品格、息づく余白",
      description: "白磁月壺の素朴な美しさに着想を得た、展示・式典・特別な宴のための空間装花です。"
    }
  },
  'bohemian-autumn': {
    en: {
      name: "Autumn Bohemian Hand-tied Bouquet",
      poeticLine: "A poetic autumn gift dyed in deep crimson and amber",
      flowerMeaning: "Passionate romance, yearning, deep connection",
      description: "Rich autumn hues blending calla lilies and garden roses, wrapped in an elegant silk bojagi cloth."
    },
    ja: {
      name: "秋のボヘミアン・ハンドタイド",
      poeticLine: "深みある夕焼け色で染め上げた、詩的な秋の贈り物",
      flowerMeaning: "情熱的な愛、切なる慕情、深まる絆",
      description: "深いバーガンディとアンバーの生花を重ね、上品な絹の風呂敷で包み上げた秋限定の花束です。"
    }
  },
  'pale-pink-rose': {
    en: {
      name: "Pale Pink Garden Rose Bouquet",
      poeticLine: "Gentle rose petals resembling fresh morning dew",
      flowerMeaning: "Eternal love, happy smile, tender affection",
      description: "A graceful bouquet composed of pastel garden roses and delicate ranunculus, exuding romantic romance."
    },
    ja: {
      name: "ペールピンク ローズブーケ",
      poeticLine: "朝露に濡れた花びらのように、やわらかな桜色",
      flowerMeaning: "永遠の愛、幸せな笑顔、澄んだときめき",
      description: "淡く咲き誇るガーデンローズとラナンキュラスが織りなす、清楚でロマンティックなブーケです。"
    }
  },
  'creamy-sunshine': {
    en: {
      name: "Creamy Sunshine Flower Basket",
      poeticLine: "Delivering the warm comfort of spring morning light",
      flowerMeaning: "Bright hope, cheering, joyful celebration",
      description: "A radiant basket combining buttery yellow and warm cream blossoms, perfect for birthdays and housewarmings."
    },
    ja: {
      name: "陽だまりクリーム 花かご",
      poeticLine: "春の朝の光のように、あたたかな笑顔を届ける",
      flowerMeaning: "明るい希望、心からの応援、喜ばしい門出",
      description: "バターイエローと温かなクリーム色の花々が調和した、お誕生日や新築祝いに寄り添う花かごです。"
    }
  },
  'royal-blue-garden': {
    en: {
      name: "Royal Blue Garden Centerpiece",
      poeticLine: "A noble garden arrangement inspired by Joseon royal court art",
      flowerMeaning: "Splendor, success, deep and steadfast trust",
      description: "An exquisite floral centerpiece combining rare blue hydrangea and delphinium with noble heritage ceramics."
    },
    ja: {
      name: "ロイヤルブルーガーデン センターピース",
      poeticLine: "宮廷絵画に描かれた、深青の気品ある庭園",
      flowerMeaning: "栄華と成功、揺るぎなき信頼、高貴な品格",
      description: "深みのある青い紫陽花とデルフィニウムを格調高い陶器にあしらった、祝賀・昇進・開業の特別作です。"
    }
  }
};

// 현재 언어 조회 (기본값 'ko')
function getCurrentLang() {
  const saved = DataStore.readRaw(DataStore.KEYS.lang);
  return (saved === 'en' || saved === 'ja') ? saved : 'ko';
}

// 다국어 텍스트 번역 헬퍼 (키 미발견 시 한국어 -> 기본 텍스트(fallback) 순으로 대체하며 원본 키를 절대 노출하지 않음)
function t(key, fallback = '') {
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko';
  if (I18N[lang] && I18N[lang][key] !== undefined) {
    return I18N[lang][key];
  }
  if (I18N.ko && I18N.ko[key] !== undefined) {
    return I18N.ko[key];
  }
  return fallback || '';
}

// 상품 다국어 번역 헬퍼
function tProduct(p, lang = getCurrentLang()) {
  if (!p) return p;
  if (lang === 'ko') return p;
  const trans = PRODUCT_I18N[p.id]?.[lang];
  if (!trans) return p;
  return {
    ...p,
    name: trans.name || p.name,
    poeticLine: trans.poeticLine || p.poeticLine,
    flowerMeaning: trans.flowerMeaning || p.flowerMeaning,
    description: trans.description || p.description
  };
}

// 가격 포맷 헬퍼 (ko: "55,000원", en/ja: "₩55,000")
function formatPrice(price, lang = getCurrentLang()) {
  const num = Number(price) || 0;
  if (lang === 'ko') {
    return `${num.toLocaleString()}원`;
  }
  return `₩${num.toLocaleString()}`;
}

// 배송일 요일 및 텍스트 언어별 포맷
function formatDeliveryDateOption(d, lang = getCurrentLang()) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dayIdx = d.getDay();

  if (lang === 'en') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[dayIdx]}, ${m}/${day}`;
  } else if (lang === 'ja') {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${m}月${day}日 (${dayNames[dayIdx]})`;
  }
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return `${m}월 ${day}일 (${dayNames[dayIdx]})`;
}

// 언어 전환 드롭다운 토글
function toggleLangDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('lang-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

// 외부 클릭 시 드롭다운 닫기 이벤트 등록
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('lang-dropdown');
  const btn = document.getElementById('lang-switch-btn');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  }
});

// 언어 변경 핸들러
function changeLanguage(lang) {
  if (!['ko', 'en', 'ja'].includes(lang)) lang = 'ko';
  DataStore.writeRaw(DataStore.KEYS.lang, lang);

  const dropdown = document.getElementById('lang-dropdown');
  if (dropdown) dropdown.classList.add('hidden');

  applyLanguage(lang);
}

// 전체 화면 언어 적용 함수
function applyLanguage(lang = getCurrentLang()) {
  // 1. html lang 속성 설정
  document.documentElement.lang = lang;

  // 2. 일본어 전용 폰트 클래스 토글 (ja일 때 Noto Sans JP 적용)
  if (lang === 'ja') {
    document.body.classList.add('font-ja');
    document.body.style.fontFamily = "'Noto Sans JP', 'Noto Serif KR', sans-serif";
  } else {
    document.body.classList.remove('font-ja');
    document.body.style.fontFamily = "";
  }

  // 3. 헤더 언어 코드 배지 갱신 (KO / EN / JA)
  const codeEl = document.getElementById('current-lang-code');
  if (codeEl) codeEl.innerText = lang.toUpperCase();

  // 4. 언어 선택 드롭다운 및 모바일 메뉴 하이라이트 갱신
  document.querySelectorAll('.lang-select-btn').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.classList.add('text-seal-red', 'font-bold');
      btn.classList.remove('text-ink-charcoal');
    } else {
      btn.classList.remove('text-seal-red', 'font-bold');
      btn.classList.add('text-ink-charcoal');
    }
  });

  // 5. 붓글씨 태그라인 영문/일문 대응 (한글 캘리그라피 폰트에 글리프가 없으므로 EN/JA에서는 세리프로 전환)
  const brushTagline = document.getElementById('hero-brush-tagline');
  if (brushTagline) {
    if (lang === 'ko') {
      brushTagline.classList.remove('font-serif', 'italic', 'font-semibold');
      brushTagline.classList.add('font-brush');
    } else {
      brushTagline.classList.remove('font-brush');
      brushTagline.classList.add('font-serif', 'italic', 'font-semibold');
    }
  }

  // 6. data-i18n 태그 텍스트 일괄 갱신 (누락 시 엘리먼트 원본 텍스트로 폴백)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let fallback = el.getAttribute('data-original-html');
    if (fallback === null) {
      fallback = el.innerHTML;
      el.setAttribute('data-original-html', fallback);
    }
    const trans = t(key, fallback);
    if (trans) {
      if (trans.includes('<') && trans.includes('>')) {
        el.innerHTML = trans;
      } else {
        el.textContent = trans;
      }
    }
  });

  // 7. data-i18n-placeholder 입력란 갱신 (누락 시 엘리먼트 원본 플레이스홀더로 폴백)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    let fallback = el.getAttribute('data-original-ph');
    if (fallback === null) {
      fallback = el.getAttribute('placeholder') || '';
      el.setAttribute('data-original-ph', fallback);
    }
    const trans = t(key, fallback);
    if (trans) {
      el.setAttribute('placeholder', trans);
    }
  });

  // 8. 결제 페이지 배송일 달력 (요일·달 이름)
  if (typeof renderDeliveryCalendar === 'function') renderDeliveryCalendar();

  // 9. 주요 동적 컴포넌트 재렌더링
  if (typeof renderProducts === 'function') {
    renderProducts(typeof currentCategory !== 'undefined' ? currentCategory : 'all');
  }
  if (typeof updateCartUI === 'function') {
    updateCartUI();
  }
  if (typeof renderCurationStep === 'function' && typeof currentCurationStep !== 'undefined') {
    renderCurationStep(currentCurationStep);
  }
  if (typeof executeCustomRecommendation === 'function') {
    const resSection = document.getElementById('curation-results-section');
    if (resSection && !resSection.classList.contains('hidden')) {
      executeCustomRecommendation();
    }
  }
  if (typeof renderSiteSettings === 'function') {
    renderSiteSettings();
  }
  if (typeof renderBusinessInfo === 'function') {
    renderBusinessInfo();
  }
  // 주문서가 열려 있으면 배송 방법·금액 문구도 다시 그리기
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal && !checkoutModal.classList.contains('hidden') && typeof renderDeliveryMethodOptions === 'function') {
    renderDeliveryMethodOptions();
    if (typeof renderDeliveryCalendar === 'function') renderDeliveryCalendar();
    if (typeof recalcCheckout === 'function') recalcCheckout();
    recalcCheckout();
  }
  if (typeof showGuideTab === 'function' && typeof currentGuideTab !== 'undefined') {
    const guideView = document.getElementById('view-guide');
    if (guideView && !guideView.classList.contains('hidden')) showGuideTab(currentGuideTab);
  }
  if (typeof updatePDPPrice === 'function' && currentSelectedProduct) {
    updatePDPPrice();
  }
  if (typeof updatePreviewBanner === 'function') {
    updatePreviewBanner();
  }
  if (typeof renderCurrentPopupSlide === 'function') {
    renderCurrentPopupSlide();
  }
  // 10. 꽃 편지 (후기) 컴포넌트 언어 즉시 반영
  if (typeof renderHomeReviewsSlider === 'function') {
    renderHomeReviewsSlider();
  }
  if (typeof renderReviewsPage === 'function') {
    renderReviewsPage();
  }
  if (typeof renderReviewRecipientChips === 'function') {
    renderReviewRecipientChips();
  }
  const letterModal = document.getElementById('modal-letter');
  if (letterModal && !letterModal.classList.contains('hidden') && typeof currentLetterList !== 'undefined' && typeof currentLetterIndex !== 'undefined' && currentLetterList && currentLetterList[currentLetterIndex] && typeof renderLetterModalContent === 'function') {
    renderLetterModalContent(currentLetterList[currentLetterIndex]);
  }
}

// 공휴일 명칭 다국어 번역 맵
const HOLIDAY_TRANSLATIONS = {
  '신정': { ko: '신정', en: "New Year's Day", ja: '元日' },
  '설날 연휴': { ko: '설날 연휴', en: 'Lunar New Year Holiday', ja: '旧正月連休' },
  '설날': { ko: '설날', en: 'Lunar New Year', ja: '旧正月' },
  '삼일절': { ko: '삼일절', en: 'Independence Movement Day', ja: '三一節' },
  '어린이날': { ko: '어린이날', en: "Children's Day", ja: 'こどもの日' },
  '부처님오신날': { ko: '부처님오신날', en: "Buddha's Birthday", ja: '釈迦誕生日' },
  '현충일': { ko: '현충일', en: 'Memorial Day', ja: '顕忠日' },
  '광복절': { ko: '광복절', en: 'Liberation Day', ja: '光復節' },
  '추석 연휴': { ko: '추석 연휴', en: 'Chuseok Holiday', ja: '秋夕連休' },
  '추석': { ko: '추석', en: 'Chuseok', ja: '秋夕' },
  '개천절': { ko: '개천절', en: 'National Foundation Day', ja: '開天節' },
  '한글날': { ko: '한글날', en: 'Hangeul Day', ja: 'ハングルの日' },
  '성탄절': { ko: '성탄절', en: 'Christmas', ja: 'クリスマス' },
  '대체공휴일': { ko: '대체공휴일', en: 'Substitute Holiday', ja: '振替休日' },
  '노동절': { ko: '노동절', en: 'Labor Day', ja: '労働者の日' },
  '근로자의 날': { ko: '근로자의 날', en: 'Labor Day', ja: '労働者の日' }
};

function tHoliday(name, lang) {
  if (!name) return '';
  const l = lang || (typeof getCurrentLang === 'function' ? getCurrentLang() : 'ko');
  if (HOLIDAY_TRANSLATIONS[name] && HOLIDAY_TRANSLATIONS[name][l]) {
    return HOLIDAY_TRANSLATIONS[name][l];
  }
  for (const [key, trans] of Object.entries(HOLIDAY_TRANSLATIONS)) {
    if (name.includes(key) && trans[l]) {
      return name.replace(key, trans[l]);
    }
  }
  return name;
}
