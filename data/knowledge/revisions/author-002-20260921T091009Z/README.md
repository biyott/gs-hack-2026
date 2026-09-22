# 시뮬레이션 전용 합성 지식 문서

이 묶음은 원문 004와 목표 D에 맞춘 18개 합성 문서다. 실제 현장 대응 매뉴얼, 실제 안전 승인, 인증 또는 법규 준수 자료가 아니다. `DEMO-GAS-X`는 실제 물질과 연결하지 않는다. 실제 가스 농도·보호구·구조·응급처치 절차를 포함하지 않는다.

최초 작성본은 모두 `synthetic: true`, `approvalStatus: draft`, `version: 0.1.0`, `synthetic://safety-simulator/` 출처로 생성했다. 최초 바이트 복사본은 [data/knowledge/drafts](../data/knowledge/drafts/)에 보존하며 이후 검토·수정으로 덮어쓰지 않는다. 현재 문서 상태는 각 파일의 YAML을 확인한다. 작성자가 데모 승인을 대신하지 않으며 독립 검토자가 실제로 확인한 문서만 검토자·시각과 함께 `approved_for_demo`로 전환한다. 이는 실제 현장 승인 `approved`와 다르다.

## 문서 목록

| ID | 주제 | 위치 |
| --- | --- | --- |
| COMMON-001 | 개인 프로필 적용 원칙 | [문서](common/COMMON-001.md) |
| COMMON-002 | 선호 언어와 안내 이해 확인 | [문서](common/COMMON-002.md) |
| COMMON-003 | 이동 보조 및 지원 요청 | [문서](common/COMMON-003.md) |
| COMMON-004 | 안내 버전 변경과 오래된 안내 처리 | [문서](common/COMMON-004.md) |
| EQ-001 | 중장비 접근 경보 | [문서](equipment/EQ-001.md) |
| EQ-002 | 중장비 방향 변경에 따른 안내 갱신 | [문서](equipment/EQ-002.md) |
| EQ-003 | 개인 이동 제약을 반영한 회피 안내 | [문서](equipment/EQ-003.md) |
| EQ-004 | 유효한 회피 경로 없음 | [문서](equipment/EQ-004.md) |
| EQ-005 | 위치 수신 중단 | [문서](equipment/EQ-005.md) |
| EQ-006 | 지정 회피 지점 도착 확인 | [문서](equipment/EQ-006.md) |
| FG-001 | 가상 화재 감지와 통로 제한 | [문서](fire-gas/FG-001.md) |
| FG-002 | 화재로 인한 기존 이동 경로 변경 | [문서](fire-gas/FG-002.md) |
| FG-003 | 가상 가스 경보와 영향 구역 안내 | [문서](fire-gas/FG-003.md) |
| FG-004 | 시나리오 정책이 이동을 지정한 경우 | [문서](fire-gas/FG-004.md) |
| FG-005 | 시나리오 정책이 실내 대기를 지정한 경우 | [문서](fire-gas/FG-005.md) |
| FG-006 | 화재·가스 복합 위험으로 경로가 없는 경우 | [문서](fire-gas/FG-006.md) |
| FG-007 | 환경 센서 수신 중단 | [문서](fire-gas/FG-007.md) |
| FG-008 | 위험 해제와 별도 통행 재개 확인 | [문서](fire-gas/FG-008.md) |

## 메타데이터와 검색 범위

- `siteIds`: 공통·중장비·화재·가스 문서 모두 실제 데모의 공유 지도 현장인 `SITE-CONSTRUCTION-01`만 적용한다. common도 현장 필터를 통과해야 한다. 원문에 등록된 `SITE-INDUSTRIAL-01`은 대체 현장 식별자로 보존하며 타 현장 제외 검증에 사용할 수 있지만 이 정상 지식 묶음의 적용 현장은 아니다.
- `simulationType`: `common | equipment | fire-gas`. 단일 `siteId`를 받는 자료는 단일 원소 `siteIds`로 정규화하며 common과 승인 상태를 보존한다.
- `hazardTypes`: 공통 계약의 `equipment | fire | gas | combined | position-unknown | sensor-unknown`을 사용한다. 위치·센서 불명은 해당 모드 필터도 함께 적용한다.
- `applicableRoles`: 이 묶음은 `worker` 역할 설명이다. `applicableZoneIds: []`는 추가 구역 제한 없음이며 현장·모드 필터의 생략이 아니다. `substanceIds: []`는 물질 전용 절차가 아님을 뜻하며 가스 전용 문서는 `DEMO-GAS-X`를 명시한다.
- `profileConditions`: EQ-003은 확인된 `stairsAllowed: false`, 나머지는 빈 객체다. COMMON-003은 확인된 보조 필요 또는 사용자의 명시적 요청에 적용하므로 단일 `assistanceRequired: true` 필터로 요청자를 제외하지 않는다.
- `requiredScenarioPolicy`: FG-004는 `evacuation`, FG-005는 `shelter-per-scenario`, 나머지는 null이다. null은 이동·대기 정책을 문서가 선택할 권한이 아니다. `designated-refuge`는 별도 엔진 정책이며 FG-004 이동 절차의 승인으로 대신하지 않는다.
- `effectiveFrom: 2026-01-01`, `expiresAt: 2030-01-01`은 합성 데이터 유효기간이다. 승인 상태와 유효기간은 별도로 검사한다.
- `reviewedSupplementalExplanation`은 ko/en의 비긴급 설명 후보다. draft에 이 키가 있어도 검토 완료를 뜻하지 않는다. 독립 내용 검토와 승인 기록이 확인된 뒤에만 검토된 설명으로 취급한다.

합성 문서는 데모 검색 범위에서만 사용한다. `draft`, `retired`, 기한 전·만료, 타 현장·모드·물질의 문서는 근거에 섞지 않는다. `approved_for_demo`를 실제 운영용 `approved`로 자동 승격하지 않는다. 충돌·오염 테스트 자료는 [tests/negative-fixtures](../tests/negative-fixtures/)에서 분리하며 정상 지식 경로에 포함하지 않는다.

## 절차와 언어 보존

각 문서는 원문 순서의 12개 본문 항목을 포함한다. 분할·색인 시 적용 조건, 적용 제외, 행동, 예외를 하나의 절차 단위로 보존한다. 한국어·영어 예시는 같은 행동·금지·식별자·자리표시자를 유지한다. `{equipmentId}`, `{zoneId}`, `{nextWaypointLabel}`, `{destinationLabel}`, `{guidanceVersion}`은 엔진의 해당 값으로만 치환한다.

등록 식별자는 어휘이며 물리적 연결이나 현재 통행 가능성의 주장과 다르다. 문서는 지도·엔진을 대신해 경로·목적지·좌표·임계값을 만들지 않는다. 경로 없음은 일률적 현 위치 대기가 아니며 실내 대기는 명시된 시나리오 정책이 필요하다. 위험 해제와 통행 재개도 별개다. 수신·이해·지원 수락·도착은 독립 상태로 기록한다.

본문의 안내 예시는 합성 절차 검토용이다. 즉시 행동 문구는 별도로 검토된 메시지 카탈로그에서 보내며 RAG나 LLM 응답을 기다리지 않는다. 보조 설명 후보는 새 행동을 명령하지 않는다. 잘못된 인용, 행동 불일치, 버전 변경, 만료, 근거 부족·충돌·모델 실패에는 보조 설명을 생략하고 기본 안내를 유지한다.

## 검토와 검증 자료

저작 이후의 형식 검사·독립 내용 검토·데모 승인·색인·검색 검사는 별도 결과로 남긴다. 이 README의 존재는 검사 성공이나 데모 승인 증거가 아니다. [검색 사례](../tests/rag-test-cases.json)와 [일관성 보고서](../consistency-report.md)는 각각 실행 결과와 검토 범위를 확인하는 진입점이다.

원문: [004 합성 데이터 규격](../docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-004.body.md), [목표 D](../docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt).
