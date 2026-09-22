# Liebherr LR 1100.1 — 공식 원문·치수·32 m 주붐 근거 묶음

확인일: 2026-09-21 UTC. 적용 기종은 **LR 1100.1**, 문서판은 **8503.02.03 / v01.092022**이다. 파일명에 `lr-1100`이 있어도 표지·각 쪽 표기는 LR 1100.1이다. 구형 LR 1100 자료는 합치지 않았다.

## 원문과 재현 정보

| 출처 | 문서판·확인 위치 | 원본 PDF / 확인 시각 / SHA-256 |
| --- | --- | --- |
| [사용자 기록에 제시된 공식 EN-US PDF](https://www.liebherr.com/shared/media/mobile-and-crawler-cranes/brochures/crawler-cranes-up-to-300-tonnnes/data-sheets/lr/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-usa.pdf) | 20쪽; 표지 LR 1100.1, LR 8503.02.03; p20 `EN-US v01.092022`, 인쇄물 ID 13646718 | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/lr1100/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-usa.pdf`; fetchedAt `2026-09-21T08:48:32.618594Z`; `d0398be38dcc2c12ae0b8e5dc6e2b12b822184fc606011b0aa672179a6ae8e26` |
| [공식 EN 미터법 PDF](https://www.liebherr.com/shared/media/mobile-and-crawler-cranes/brochures/crawler-cranes-up-to-300-tonnnes/data-sheets/lr/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-english.pdf) | 20쪽; 표지 LR 1100.1, LR 8503.02.03; p20 `EN v01.092022`, 인쇄물 ID 13646717 | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/lr1100/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-english.pdf`; fetchedAt `2026-09-21T08:48:32.782594Z`; `843ac3a7fb711bd2fede5dc5f5ba2b2798cfbf3cb52faeff4515cacf1e082e52` |

두 원문 모두 제조사 도메인에서 HTTP 200 / application/pdf로 내려받았다. 원문 바이트는 수정하지 않았다. `source-manifest.json`에 URL, 최종 URL, fetchedAt, 크기, SHA-256, 페이지 수, PDF 메타데이터, 응답 헤더 경로가 있다. fetchedAt은 다운로드가 완료된 로컬 파일 mtime의 UTC 표현이다. PDF 메타데이터의 생성·수정일은 2022-09-14이며, 이를 현재 제품 출시일로 해석하지 않는다. 공개 접근이 가능하다는 사실은 재배포·이미지 재사용 허가를 뜻하지 않으며 별도 이용 허가는 확인하지 않았다.

두 언어판은 **같은 제조사의 같은 문서 계열**이므로 독립적인 교차 검증 2건으로 세지 않는다. 단위 대응과 구성 일치 확인에 사용했다. 아래 페이지 번호는 인쇄 쪽 번호와 PDF의 1부터 센 쪽 번호가 같다.

## 확인된 제원과 그림의 적용 범위

수치는 EN p8 도면의 mm 표기를 m로 변환한 것이다. 원문 p2는 치수가 반올림되며 실제 치수와 차이가 있을 수 있다고 설명한다. 이 표는 카탈로그의 도면 기준값이다.

| 항목 | 공식 도면 값 | 해석·구성 경계 | 원문 위치 / 로컬 시각 증거 |
| --- | --- | --- | --- |
| 궤도 외측 간 폭 | 5,000 mm = **5.000 m** | 정면도에서 좌우 궤도 바깥면 사이. 플랫폼 포함 최대 폭이 아니다. | EN p8; `english-p08.png`, `english-p08-detail-front.png` |
| 한쪽 flat track pad 폭 | 900 mm = **0.900 m** | EN p6의 flat track pad 폭과 p8 치수선이 일치한다. | EN p6·8 |
| 궤도 측면 전체 길이 치수 | 6,275 mm = **6.275 m** | 측면도에서 궤도 양 끝에 붙은 치수선. p9의 crawler side frame 운송 부품 길이도 6,275 mm다. 유효 접지 길이로 확정하지 않는다. | EN p8·9; `english-p08-detail-side.png` |
| 하부의 더 긴 외곽 치수선 | 6,600 mm = **6.600 m** | 같은 측면도에서 궤도 끝을 넘어선 하부 외곽까지의 치수선. 6.275 m 궤도 길이와 별개다. 32 m 붐과 후방 추를 포함한 장비 전체 길이가 아니다. | EN p8; `english-p08-detail-side.png` |
| 플랫폼·난간의 정면 외곽 폭 | 5,535 mm = **5.535 m** | 정면도에서 외측 플랫폼/난간까지의 span. **6.60 × 5.00 m를 장비 전체 작업 외곽으로 쓰면 이 돌출 부분을 누락한다.** 정확한 옵션 주문 상태는 도면만으로 확정하지 않는다. 아래쪽 발판/계단은 이 치수선보다 더 돌출되어 보이므로 5.535 m도 모든 부속을 포함한 최대 폭으로 확정하지 않는다. | EN p8; `english-p08-detail-front.png` |
| 후방 선회 반경 | **R 4,700 mm = 4.700 m** | 평면도의 후방 arc와 측면도 선회축→후방 끝 4,700이 일치한다. 도면에 그려진 후방 카운터웨이트 배치의 기하 값이다. 전체 붐 선회 영역을 의미하지 않는다. | EN p8; `english-p08.png` |
| 붐 피벗의 전후 오프셋 | **1,200 mm = 1.200 m**, 선회축보다 붐 방향 | 측면도 `1200*`와 별표의 boom pivot point 표기를 함께 확인했다. 피벗 **높이** 수치로 쓰면 안 된다. | EN p8; `english-p08-detail-side.png` |
| 주붐 계열 | **1512.21**, 명목 길이 **14–62 m** | 주붐 단독은 p13 Mode 1. 고정 지브를 포함한 Mode 3와 분리된다. | EN p13·14 |
| 32 m 주붐 구성 | **5.5 m foot ×1 + 6 m section ×1 + 12 m section ×1 + 8.5 m head ×1 = 32 m** | p14 구성표에서 32 m 열을 직접 확인. 이것이 요청한 주붐 길이의 직접 근거다. | EN p14; `english-p14.png` |
| 고정 지브 없는 구성 | **주붐 단독 Mode 1 지원 확인** | p13은 main boom Mode 1과 main boom + fixed jib Mode 3를 구분한다. 32 m 주붐만의 프리셋은 Mode 1에 대응한다. | EN p13·14 |

EN-US p8에는 같은 치수선에 21′8″ / 20′7″ / 16′5″ / 2′11″ / R15′5″가 표기된다. EN-US p14의 대응 주붐 길이는 **105 ft**이며, 실제 붐 섹션 길이는 미터법이고 feet는 근사 환산이라는 주석이 있다. 따라서 32 m 프리셋은 미국판의 반올림 값들을 역산하여 정의하지 않고 **EN 미터법의 32 m**를 사용한다.

## 지지 형상으로 사용할 때의 확인·산출·미확인 분리

**확인:** 두 궤도의 시각 외곽을 표현하는 데 필요한 5.000 m 전체 폭, 0.900 m 각 궤도 폭, 6.275 m 궤도 전체 길이는 도면에 있다. 제조사 도면은 네 아웃리거 패드 좌표를 제공하는 자료가 아니다.

**산출:** 도면의 좌우 대칭 배치를 채택하면 궤도 중심 간 거리는 `5.000 − 0.900 = 4.100 m`, 횡방향 중심은 선회축 기준 `±2.050 m`, 바깥/안쪽 측면은 `±2.500 / ±1.600 m`가 된다. 이는 도면 값으로 계산한 모델링 좌표이며 별도 제조사 좌표표가 아니다.

**산출:** +X를 붐 쪽, 원점을 선회축으로 정하면 측면 치수 연쇄에서 궤도 후단은 `−(4.700 − 1.570) = −3.130 m`, 전단은 `6.275 − 3.130 = +3.145 m`로 계산된다. 더 긴 6.600 m 하부 치수선의 후단은 `−(4.700 − 1.400) = −3.300 m`, 전단은 `+3.300 m`다. 각도·평면 해석과 카탈로그 반올림을 전제로 하는 **도면 파생 좌표**이다.

**미확인:** 궤도가 실제로 지면에 힘을 전달하는 유효 접촉 길이, 압력 분포, 전도 판단용 지지 다각형, 지반 조건별 경계는 이 치수도에서 확인하지 못했다. 전체 궤도 외곽 직사각형을 실제 지지 접촉면 또는 전도 경계라고 표시하면 안 된다. p4는 지압이 구성과 기계 위치에 따라 계산된다고 설명한다. p8의 별도 5,275 mm 치수도 임의로 ‘접지 길이’로 이름 붙이지 않는다.

## 프리셋에 넣을 값과 남겨야 할 null

- `model`: LR 1100.1; `specEdition`: 8503.02.03 / EN v01.092022 / 13646717.
- `boomFamily`: 1512.21; `mainBoomLengthM`: 32; `fixedJib`: absent (요청된 프리셋 선택).
- `trackOverallLengthM`: 6.275; `trackOutsideWidthM`: 5.000; `trackPadWidthM`: 0.900; `undercarriageLongitudinalEnvelopeM`: 6.600; `depictedPlatformHandrailSpanM`: 5.535.
- `tailSwingRadiusM`: 4.700, 단 p8의 그려진 후방 배치라는 범위 함께 저장.
- `slewOrigin`은 모델 좌표계를 정의할 때 위 **산출** 관계를 명시해서 사용. 카탈로그에 별도 3D 원점 좌표표가 있는 것으로 표시하지 않는다.
- `effectiveGroundContactLengthM`, `loadSupportPolygon`, `boomPivotHeightM`, 모든 전개 부속을 포함한 전체 `widthM`, 32 m 붐 구성의 완전한 장비 `lengthM/heightM`, 실제 기계의 정확한 카운터웨이트·운영 중량·리깅·부속 장착 상태는 **null / 미확인**.

p14에는 **auxiliary jib**가 선택 사양으로 별도 표시된다. ‘fixed jib 없음’만으로 auxiliary jib 유무까지 확정되지 않는다. 순수 주붐 실루엣이 목적이면 프리셋 정의에서 auxiliary jib도 생략한다는 **데모 구성 선택**을 따로 기록해야 한다. 도면에 있는 보조 장비를 선택하지 않은 프리셋에 자동으로 추가하지 않는다.

## 혼합하면 안 되는 값과 제한

- p8의 11,470 mm는 그림에 그려진 낮춘 붐 하부/전방 부속부터 후방 끝까지의 길이이며 **32 m 주붐 작업 상태의 전체 길이**가 아니다.
- p8의 R6,375는 측면도에 별도로 그려진 arc다. 후방 선회 반경 R4,700과 대체해서 쓰지 않는다.
- p6의 약 94.4 t 운영 중량은 **14 m 주붐**, 29.3 t 후방 추, 15.3 t carbody 추 등을 명시한 구성이다. 이를 32 m 프리셋 중량으로 전용하지 않는다.
- 15–84°는 p6의 주붐 기복 동작 설명이다. 특정 인양 반경·하중·부속 상태에서 모든 각도가 허용된다는 보증이나 안전 영역은 아니다.
- p15의 하중표는 참고용이며 실제 작업은 기계의 운전실/매뉴얼 하중표를 참조하도록 원문이 명시한다. 본 묶음은 **형상·시각화 참고**, 실제 양중·지반·안전 검증 자료가 아니다.

## 로컬 검증 증거

원문·메타데이터·선택 쪽 텍스트·직접 렌더한 쪽 이미지는 모두 `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/lr1100/`에 있다. 주요 파일:

- `source-manifest.json`: 두 원문의 URL, 시각, SHA-256, 문서 메타데이터.
- `official-en.headers.txt`, `official-usa.headers.txt`: 원문 다운로드 응답 헤더.
- `english-p08.png`, `english-p08-detail-side.png`, `english-p08-detail-front.png`: 치수선 직접 검토 자료.
- `english-p14.png`, `usa-p14.png`: 32 m / 105 ft 열과 단위 주석 검토 자료.
- `english-p20.png`, `usa-p20.png`: 문서판·인쇄물 ID 확인.
- `english-p01/02/06/08/09/13/14/15/20.txt`, `usa-p01/02/06/08/09/13/14/15/20.txt`: 각 원문 선택 쪽에서 추출한 텍스트.

확인 작업은 다운로드한 원문을 PyMuPDF 1.28.2로 열고 페이지 수·문서 메타데이터를 확인한 후, p8·14·20을 렌더하고 p8·14의 치수선과 구성 열을 직접 읽는 방식으로 수행했다. 웹 검색 스니펫만 보고 확인한 것으로 처리하지 않았다.

독립 도면 재검토: 별도 read-only 검토자가 p8·14 이미지를 확인하여 6,600/6,275/5,000/900/R4,700 치수 해석과 32 m 조합, 치수 연쇄 산출을 일치 확인했다. 5,535 mm보다 더 돌출된 아래쪽 발판/계단 때문에 최대 작업 폭은 여전히 미확인으로 남겼다. 이는 같은 원문을 별도 관찰한 것이며 독립 제조사 근거가 추가된 것은 아니다.

운송 크기 필드: `transportLengthM`, `transportWidthM`, `transportHeightM`, `selectedTransportConfiguration`은 모두 **null**로 보존한다. p9 「Transport dimensions and weights」에는 붐·카운터웨이트·탈착식 크롤러 제거 여부 등에 따라 구분된 운송 상태가 있다. 요청 프리셋은 32 m 주붐 작업 상태이므로 어느 운송 상태를 택할지 확정되지 않았다. p8의 작업 하부 6.600 × 5.000 m를 운송 크기로 복사하지 않는다.
