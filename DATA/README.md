# 설담화 DATA 폴더 (CSV 데이터베이스)

관리자 센터 **연동·데이터 → CSV 데이터 저장소**에서 이 폴더를 연결하면, 쇼핑몰 데이터가 표 하나당 CSV 파일 하나로 저장돼요.
엑셀로 열어 볼 수 있고(한글 깨짐 방지 BOM 포함), 나중에 서버 데이터베이스(MySQL·PostgreSQL·Supabase 등)로 옮길 때 **파일 이름 = 테이블 이름, 첫 줄 = 칸(컬럼) 이름**으로 그대로 가져가면 됩니다.

- 저장·불러오기 코드: `assets/js/csv-db.js` (`CSV_TABLES`에 표 구조가 있음)
- 브라우저는 보안 때문에 이 폴더를 처음 한 번 직접 골라 줘야 해요(크롬·엣지). 다른 브라우저는 파일을 내려받아 여기에 넣어 주세요.
- 화면이 실제로 쓰는 데이터는 브라우저 저장소에 있고, 이 폴더는 그 사본(저장소)이에요. CSV를 고친 뒤 **[DATA 폴더에서 불러오기]**를 누르면 화면에 반영돼요.
- 주의: `orders.csv`, `inquiries.csv`, `restock.csv`에는 손님 이름·연락처·주소가 들어 있어요. 이 폴더를 다른 곳에 올리거나 공유하지 마세요.

## 표 구조

| 파일 | 한 줄 = | 주요 칸 | DB로 옮길 때 |
|---|---|---|---|
| `products.csv` | 상품 1개 | id, name, category(bouquet/basket/space), price, sizes(JSON), inquiryOnly, stockQuantity, image, visibility(public/private/scheduled), publishAt, curationTags(JSON) | 기본 키 `id` |
| `orders.csv` | 주문 1건 | id, orderNumber, createdDate, status(preparing/packaged/delivering/completed/cancelled), ordererName/Phone, recipientName/Phone, zipcode, address, deliveryMethod(quick/parcel/pickup), deliveryFee, itemsTotal, totalAmount(배송비 포함), deliveryDate, message, hideSender, request, courier, trackingNumber | 기본 키 `id` |
| `order_items.csv` | 주문 속 상품 1줄 | orderId, lineNo, productId, productName, sizeLabel, price, optionName, optionPrice, quantity | `orderId` → orders.id, (orderId, lineNo) 기본 키 |
| `expenses.csv` | 지출 1건 | id, date, category, amount, method, memo | 기본 키 `id` |
| `inquiries.csv` | 1:1 상담 1건 | id, createdDate, status(new/done), name, phone, date, type, productName, message, memo, contactedAt | 기본 키 `id` |
| `restock.csv` | 재입고 알림 신청 1건 | id, productId, productName, name, phone, createdDate, status(waiting/notified) | `productId` → products.id |
| `popups.csv` | 팝업 슬라이드 1장 | id, active, order, image, title, text, titleEn/Ja, textEn/Ja, buttonLabel, linkType, url, internalTarget, startDate, endDate | 기본 키 `id` |
| `pages.csv` | 직접 고친 안내 페이지 1개 | id(bojagi/care/delivery/refund/terms/privacy), title, body, updatedAt | 기본 키 `id` |
| `settings.csv` | 매장 설정 항목 1개 | key, value(JSON) — 예: phone, weeklyHours, closures, business, delivery, `__popupsEnabled` | 키-값 표 |
| `images.csv` | 관리자에서 올린 사진 1장 | id, name, src(사진 데이터), width, height, createdAt | 서버에서는 파일 저장소로 옮기고 주소만 저장 |

- 참/거짓 칸은 `true` / `false`, 빈 칸은 값 없음이에요.
- `isSample = true` 인 줄은 [예시 데이터]예요. 실제 운영 전에 관리자에서 지워 주세요.
- AI 키·디스코드 주소는 보안 때문에 CSV에 저장하지 않아요.
