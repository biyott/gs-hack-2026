# Liebherr 172 EC-B 8 Litronic 구성 검증

상태: 조사 완료, 미확인 항목 보존. 조사일 2026-09-21 UTC. 범위: **16 HC 175 / UC-0460m 첫 번째 열 / 11개 표준 구간 / 훅 높이 42.3m / 작업 반경 50m**. 설치·하중 검토가 아닌 시각화 근거 자료다.

## 원본과 판본

- **S1:** [Liebherr 공식 지정 PDF](https://assets-cdn.liebherr.com/versions/e947e028-e7d0-4341-b16a-15cb83217ac4/original/) — 16쪽. 표지 `EN 14439:2009 – C25`; 16쪽 인쇄 표기 `2025-02`, `TCS-001859-LBC-01`. 검색에 함께 나오는 **FEM 판은 채택하지 않았다**.
- **S2:** [Liebherr 공식 타워 시스템 자료](https://www-assets.liebherr.com/media/bu-media/lhbu-lbc/brochures/accessories/tower-systems/liebherr-towercranes-turmsysteme-broschuere-2025-de.pdf) — 30쪽. 30쪽 인쇄 코드 `LBC_859_03.25_de`. UC 명칭과 치수의 종류를 보완하며 S1의 설치 조합을 대체하지 않는다.
- 원본, HTTP 헤더, 내려받은 시간, SHA256, PDF 내부 날짜: [메타데이터](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/sources.metadata.json). PDF 생성일, HTTP 수정일, 인쇄 판본은 별개로 보존했다.
- [S1 원본](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/172ecb8-2025-02.pdf): SHA256 `3c8973aaaa1f5d68cc48d06d8f7ff3760248a8e3feadef498e3ea921df954567`, 1,051,150 bytes, fetchedAt `2026-09-21T08:47:55Z`.
- 원본·도면의 재배포 허용 라이선스는 확인하지 못했다. 원출처 저작권을 유지하는 검증용 증거다.

## 확인한 구성 치수

아래 수치는 원문 도면·표가 직접 제시한 값이다. 운송 치수와 조립 치수를 혼합하지 않았다.

| 항목 | 확인값 | 원문 위치·적용 경계 |
| --- | --- | --- |
| 타워 외형 폭 | 1.8m | S1 6쪽 오른쪽 16 HC 175, 13쪽 TS-0250c 포장 표도 1.80×1.80m |
| 표준 구간 | 11×2.5m | S1 6쪽. 전체 타워 부품 수 11개라는 뜻이 아님 |
| 하부 타워 구간 | TSB 10.0m | S1 6·8쪽, 14쪽 TSB 계열 부품 |
| 상단 구간 | 2.5m | S1 4·6쪽. 타워/클라이밍 구간 변형은 별도 확인 필요 |
| 훅 높이 | 42.3m*) | S1 8쪽 C25, UC-0460m **첫 번째** 열 11행; 두 번째 열은 41.8m*) |
| 선택 하부 높이 | 4.5m | S1 6·8쪽 첫 번째 UC-0460m 도면. 두 번째 열의 4.0m와 혼용 금지 |
| 하부 수평 치수 표기 | 4.5m 및 4.6m | S1 6·8쪽. 완전한 외곽/지지점 평면도는 없음 |
| 선택 작업 반경 | 50.0m | S1 4·5쪽 |
| 별도 지브 반경 표기 | r=51.5m | S1 5쪽 50m 행. 4쪽 도면과 함께 명목 전방 구조 반경으로 해석 가능 |
| 50m 지브 구성 | 구간 번호 1·2·3·6·7·9 | S1 4쪽 해당 행. 모든 번호를 연속 삽입하지 않음 |
| 후방 구조 치수 | 14.5m | S1 4쪽. 같은 도면의 13.4m와 구별. 여유거리 포함값 아님 |

[4쪽 지브 도면](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/page-04.png), [5쪽 반경표](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/page-05.png), [6쪽 구조](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/page-06.png), [8쪽 높이표](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/page-08.png).

## 지지 형식과 부품

**UC-0460m는 undercarriage(하부 프레임) 명칭이다.** S1 14~15쪽은 레일 보기, 긴/짧은 지지보, 경계보, 지지 스트럿, 하부 프레임 타워 구간을 별도 부품으로 제시한다. CB-0460r 십자 기초나 FAr 매입 앵커와 동일 구성으로 취급할 수 없다. S2 14쪽도 UC-0460m와 UC-0460mr를 구분하며 UC용 주행 장치를 별도 열거한다.

**4.6m를 완전한 외곽 치수라고 확정하면 안 된다.** S2 14쪽 UC 관련 중앙 밸러스트 항목의 `4,6 m Stützweite`는 명목 지지 폭을 뒷받침한다. S1의 4.5/4.6 치수선만으로 지지점 중심·패드 가장자리·직교 방향·전체 외곽을 모두 복원할 수 없다. 따라서 4.6×4.6m 실물 외곽 폴리곤 또는 콘크리트 기초 크기는 미확인이다.

S2 13쪽의 **1.60m Eckstielmaß**는 코너 기둥 기준 치수다. S1의 **1.80m 외형 폭**을 대체하지 않는다. S2는 타워 시스템 구성품 설명 자료이지 요청 크레인의 추가 설치 승인표가 아니다.

부품 연결 근거: [13쪽 지브/타워](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/page-13.png), [14쪽 하부·클라이밍](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/page-14.png), [15쪽 하부 프레임](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/page-15.png), [S2 14쪽](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/tower-systems-page-14.png).

## 조건과 미확인

- 42.3m 옆 `*)`는 하강 화살표가 붙은 클라이밍 장치 그림을 가리킨다. 텍스트 정의가 없으므로 조건을 삭제하지 않았다. “클라이밍 장치를 낮춘 상태”는 그림 해석이며 확정한 운용 규정이 아니다.
- 훅 높이 42.3m를 철골 전체 높이·선회축 높이로 사용하지 않는다. 두 높이는 미확인이다.
- 50m는 작업 반경이다. 물리적 전방 끝·매달린 하중·안전 여유·후방 회전 외곽은 별도 필드다. 14.5m는 측면 구조 치수이며 정확한 평면 회전 외곽은 미확인이다.
- 50m 지브의 카운터웨이트는 S1 11쪽 **24 kW FU** 조건에서 13.75t(A4+B2+E1)이다. 호이스트가 지정되지 않았으므로 무조건 적용하지 않는다. 타워 하부 중앙 밸러스트 수량/질량은 미확인이다.
- 첫 UC 열의 하부 구조에는 보기 도형이 있다. 데모에서 장비 원점을 고정하는 것은 시뮬레이션 선택이며 제조사가 주행 불가능한 설치라고 확인한 사실과 다르다.
- 지원점 XY, 기초 앵커/패드 치수, 지반 조건, 정확한 설치 부품 BOM, 전체 총중량, 타이·클라이밍 상세는 미확인이다.
- 17 HC의 4.14m 구간, 21 HC 폭, UC-0460mr, CB-0460r, FEM 판의 높이를 이 구성으로 옮기지 않는다.

[기계 판독용 확인값/null 목록](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/verified-configuration.json).

## 확인 절차와 인계

S1 원본 PDF를 내려받아 4·5·6·8·11~16쪽을 렌더링하여 시각 대조했다. 별도 읽기 전용 검토자가 4·5·6·8쪽을 다시 검토하여 42.3m, 구간 수, 50m/r51.5m와 지지 치수 해석의 한계에 동의했다. 서로 다른 사람/에이전트의 판독이며 독립된 제조사 출처 둘이라는 뜻은 아니다.

공식 도메인 대상으로 UC-0460m와 42.3m/50m의 반대·대체 근거를 검색했다. FEM 다른 판과 150/125 EC-B 자료가 나왔으나 대상 수치로 혼입하지 않았다. 이 검색으로 S2를 찾아 4.6m의 명칭을 보완했다. 두 자료는 같은 제조사 1차 자료라 **단일 제조사 출처 예외**로 인계한다. 실물 설치 최종 적합 판정은 이 조사 범위 밖이다.

조사 근거: 공식 PDF 2개, Liebherr 소유 2개 호스트/1개 조직. 시작 약 08:46 UTC, 원본·도면 검증과 인계 08:53 UTC. 별도 검토자 1명, 코드 변경 없음. [파일 무결성 목록](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/artifact-manifest.json).
