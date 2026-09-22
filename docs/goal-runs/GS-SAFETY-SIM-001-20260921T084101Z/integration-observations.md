# 통합 준비 관찰 기록

Goal GS-SAFETY-SIM-001 v1.0 / run GS-SAFETY-SIM-001-20260921T084101Z.
작성자 /root. 아래는 구현 중 읽기·담당자 보고에서 나온 수정 요청이며 독립 QA 판정이 아니다. G3 후보가 아직 동결되지 않았으므로 최종 PASS로 재사용할 수 없다.

## IO-001 — 사건 해제 범위

- 관찰: 2026-09-21T09:23Z, `src/server/simulation/evaluate.ts`는 최근 미종료 사건을 모든 후속 위험에 재사용했다. `runtime.ts`의 clear-hazard는 world 전체 위험을 비활성화하고 reopen-passage는 전체 blockedPathIds를 비웠다. 순수 incident reducer의 위험 ID 제한이 통합 계층에서 유지되지 않았다.
- 영향: AC10/11; 독립 사건을 함께 처리할 때 다른 사건의 위험·통행 제한까지 해제될 가능성.
- 담당: Backend Lead. 위험 ID 겹침에 따른 사건 분리, 통행 제한의 위험 소유권, 선택 사건의 해제만 적용하는 수정과 회귀 시험을 수락했다.
- 검증 요청: QA Lead에 동시 사건 두 개, 선택 사건 고정 중 신규 사건, 공유/독립 통로의 해제·재개 검증을 전달했다.
- 상태: 수정 중. 후보 해시와 실제 회귀 결과는 제출 후 연결한다.

## IO-002 — 크레인 구현 가능 동작

- 관찰: 2026-09-21T09:21Z Design 보고에서 Tadano/LTM/Maeda의 붐과 훅 일부가 고정 시각 형상이며 LR 붐 각도도 고정이라고 명시했다. 기존 export/load 자체 검사 성공은 해당 동작 구현을 증명하지 않는다.
- 영향: E, AC12. 미구현 동작을 물리적 미지원으로 표시해 범위를 줄일 수 없다.
- 담당: Design Lead가 모바일 크레인 붐 길이·각도·훅, LR 고정 32m 조립 붐의 각도·훅 구현을 계속하기로 수락했다. Tech/Backend/Frontend와 버전 있는 변환 계약을 협의한다. 타워 원점은 고정한다.
- 상태: 구현 중. 데모 동작 한계와 제조사 기계적 한계를 구분하며, 실제 미확인 제원은 null을 유지한다.

## IO-003 — 가상 시나리오 시각과 실제 지식 검토 시각

- 관찰: 2026-09-21T09:23Z RAG Lead 보고. G0 가상 시나리오 시작09:00보다 실제 문서 검토09:13이 늦어, 실제 검토 시각을 보존하는 검색이 해당 과거 시각 요청에서 no_match를 반환했다.
- 영향: AC06–08. 검토 시각을 거짓으로 앞당기거나 검색 승인 검사를 제거할 수 없다.
- 처리: QA/Technical Lead가 가상 시나리오 시계와 UTC wall-clock 문서 유효성의 명시적 시험 바인딩을 확인한다. 원래 G0, 최초 결과, 실제 검토 시각을 보존한다. 안내 generatedAt/expiresAt은 기존 계약상 wall-clock이다.
- 상태: 기술 해석 협의 중. 원래 기대/기준 변경이나 실패 삭제를 허가한 기록이 아니다.

## IO-004 — 실행 복구의 내부 상태와 최신 도착점

- 관찰: 2026-09-21T09:28Z 읽기 점검. `SimulationRun` 복구는 시나리오를 재생한 뒤 작업자 위치/프로필과 closedEdgeIds를 반영하지만 수동 장비 자세·위험 해제의 world 상태는 같은 방식으로 복구하지 않았다. `rememberDestinations`는 경로 없는 현재 도착 안내를 복구할 때 최초 안내 목적지로 돌아갈 수 있다.
- 영향 가설: AC04/10/11. 재시작 후 첫 평가에서 수동 상태가 시나리오 상태로 되돌거나 재경로 전의 도착점을 사용할 수 있다. 실제 재시작 실행 결과는 아직 없다.
- 담당: Backend Lead에 장비 교체/조작 후 DB 재시작, 관리자 해제/통행 재개 후 재시작, 변경된 목적지 도착 후 재시작 회귀 시험과 상태 보존을 요청했다.
- 상태: 구현 담당자 확인 및 실행 검증 대기. 독립 QA FAIL 판정이나 재현 완료로 기록하지 않는다.

### IO-003 결정 연결

- QA Lead가 2026-09-21T10:23:20.799Z `qa/clock-binding-v1.1.md` 및 `qa/test-refinements.md` QR-004를 발행했다. Technical 계약1.0.1에 근거해 가상 시나리오09:00과 문서 유효성 UTC를 분리한다. 결정적 검색 시험의 파생 fixture는 실제 검토 이후09:30을 사용하고 실시간 통합은 실제 UTC를 사용한다.
- 원래26사례/QA사례/관찰된 no_match/검토 시각/G0는 보존한다. 기대 문서·행동·결과 및5000ms 기한은 변경하지 않는다. 아직 실제 파생 시험 결과가 아니며 RAG/독립 QA가 실행할 부분이다.

## IO-005 — 관측 방식과 합성/실측 출처 구분

- 관찰: 2026-09-21T10:30Z 읽기 점검. UWB HTTP 경로는 운영자 fixture를 DB payloadJson의 source=synthetic으로 기록하지만, PositionObservation/TrackingSnapshot에는 관측 방식 uwb/camera-marker만 있고 해당 관측의 live/synthetic 구분이 없었다. 카메라 프레임에는 source가 있으나 파생 위치에도 전달되어야 한다.
- 영향: A/F, AC13/15. 실제 HTTP로 실행한 합성 거리/영상을 화면에서 실기 관측으로 오인할 가능성.
- 담당: Tracking/Technical Lead에 관측 방식과 입력 출처를 별도 보존하고 Backend/Frontend/Mobile에서 일관되게 표시하도록 요청했다. 공동 계약 변경은 소유 Lead 협의 후 발행한다.
- 상태: 구현 협의 중. 실제 측정 성공이나 독립 QA 실패를 주장하지 않는다.

## IO-006 — 센서 없는 재현과 계속 들어오는 실측 입력

- 관찰: 2026-09-21T10:39:10.967Z 기록, Backend 보고 기반. mock 초기화 뒤에도 실제 업로드가 계속되면 공유 추적 입력이 두 모드의 시나리오 위치를 덮는다. 업로드 중단만으로 stale이 지도/안내에 전파되지 않는 문제도 별도 회귀 시험으로 확인·수정 중이다.
- 영향: AC01/04/13/15의 센서 없는 재현, 실행 격리, 단절 처리 및 mock/실측 구분.
- 결정: 기존 사용자 결과를 구현하는 내부 선택으로 모드별 시나리오/실측 위치 입력을 명시한다. 기본 시나리오는 CCTV 표시와 독립적으로 재현된다. 실측 선택 시 미측정/단절은 unknown이며 mock으로 대체하지 않는다. 원관측 증거는 선택과 무관하게 보존한다. 변경은 이력/새 안내로 반영한다.
- 소유: Technical Lead 계약·영향 Lead 협의, Backend 상태/평가, Frontend 조작·표시, Mobile 계약 반영. 구현 범위나 AC 완화/추가 승인 사항이 아니다.
- 상태: 공통 계약 협의 및 구현 중; 독립 QA 미실행.

기록 시각 보충(2026-09-21T10:39:10.967Z): 이 문서의 분 단위 관찰 시각은 진행 메모이며 실행 증거의 정확한 시작·종료 시각이 아니다. IO-006의 최초10:40Z 표기는 작성 중 부정확한 예정 분이므로 아래에서 실제 기록 시각으로 바로잡았다. 최초본은 evidence/orchestrator/integration-observations-before-time-clarification.md에 보존했다. 실제 시험 시각/명령/후보 해시는 각 담당자의 원시 실행 기록과 QA 증거를 따른다.

## IO-007 — 위치 회복 후 이전 unknown 안내 잔류

- 기록: 2026-09-21T11:08:41.053Z. Backend Lead가 실제 측정 bridge의 실패/관측 결과를 조사하여 보고했다. WORKER-B 위치가 (90,40)으로 known이 됐지만, 위험 노출이 없으면 평가를 건너뛰어 이전 POSITION_UNKNOWN 안내가 남았다. 이 기록은 root의 독립 QA 판정이 아니다.
- 영향: AC04/09/11/13/15의 최신 상태·안내 정합성과 단절 회복.
- 결정: 각 unknown/unavailable 원인이 실제 해소됐을 때 검토된 GUIDANCE_UPDATED 정책을 적용하는 최소 회귀 수정. 유효 FOLLOW 경로, 최초 안내, 지원 요청, 사건, 위험 해제와 통행 재개 상태는 별도 유지한다. 안전 확인이나 복귀 허가로 해석하지 않는다.
- 소유/상태: Backend가 RED/GREEN과 실제 재검증을 기록한다. source-stable 선언을 철회하고 새 해시로 제출하기 전까지 미완료.

## IO-008 — Android UWB 원시 각도와 지도 방향 변환

- 기록: 2026-09-21T11:08:41.053Z. Tracking/Mobile이 AndroidX/GMS/AOSP 근거를 대조하여 raw azimuth가 시계방향임을 확인했다. 서버의 기존 +sin 투영은 지도 CCW 축과 불일치했다.
- 조치: raw radians는 보존하고 서버의 한 투영 경계에서만 부호를 바꾼다. 수학 fixture의 최초3FAIL과 수정 후26PASS는 제작자 증거이며 실기 측정 성공이 아니다.
- 계약: docs/contracts/clarification-uwb-azimuth-v1.0.2.md 및 freeze-v1.0.2.json 발행(11:06:45.382Z/contentSHA0908921f203e3e6a480562ad9bedeee6355eb8f02b9da0c9364f9d88a8e03655). 기존1.0.1 동결 파일은 보존. 사용자 목표/AC 변경 없음.
- 경계: 실제 각도 가용성·수직 장착 기준·좌우/zero/yaw 확인 전에는 uwbYawRad=null을 유지한다. 거리만 있는 정상 fallback을 보존하며 새로운 AoA 지원 의무를 추가하지 않는다.
- 실행 한계: 첫 live bridge는 수정 전 singleton이 남아 signed-angle FAIL을 냈다. 원인을 기록하고 소스 고정 후 재시작해 재검증한다. 무업로드 후 stale/빈 경로 관측과 기존 유효 경로의 실제 무효화 증거를 구분한다.

후속 상태(2026-09-21T11:08:41.053Z): IO005 관측 출처 및 IO006 입력 선택은 계약1.0.1/구현에 반영됐다. Tracking의 실제 합성 JPEG HTTP22검사 및 Backend HTTP/SSE27검사 통과 보고는 제작자 범위다. 최종 후보의 독립 QA 및4대 실기는 아직 미완료다.

## IO-009 — 앱 음성 취소와 관제의 마지막 음성 상태

- 기록 시각: 2026-09-21T11:47:33Z 재개 시 전달된 Mobile 실제 시험 보고. 두 폰의 voice-started는11:39:13.116/136Z, pause는11:39:13.188Z였다.11:40:35까지 수락된 native 완료 로그/voice-completed ACK가 없고 앱 UI는 cancelled를 표시했다. 서버 response.voiceStatus는 playing, spokenAt은 null이었다.
- 영향: AC09/10/11/15. 마지막으로 확인된 재생 시작과 현재 재생 상태가 같은 뜻으로 표시되는지 계약/소비자를 확인해야 한다. 현재 관측만으로 기기 취소 확인을 서버가 만들어 기록해서는 안 된다.
- 소유/상태: Backend가 계약과 FE 사용을 확인하고 최소 실제 재현을 담당한다. Mobile은 자체 native 증거를 보존한다. 실제 결함이면 RED/최소 수정/새 후보와 영향 회귀를 제출한다. 최종 G3 동결 전 조사 중이며 독립 QA 판정이 아니다.

### IO-009 내부 수정 결정

- Frontend 읽기 조사에서 WorkerCard/DeliveryStatus가 서버 playing을 현재 “재생 중”으로 표시하고 pause에 따른 한정 설명이 없음을 확인했다. Mobile의 cancelled는 큐 무효화/stop 명령 완료이며 물리적 무음 관측이 아니라는 점을 보존한다.
- Technical Lead와 Backend의 선택: stop-requested는 서버가 중단을 요청했다는 상태이며 기기 종료 확인으로 표시하지 않는다. 새로운 기기 성공 ACK를 만들어내지 않는다. 기존 첫 안내와 과거 재생 시작/진짜 terminal 관측은 보존한다. 영향 Frontend/Mobile 협의 후1.0.3 계약으로 발행할 예정이다.
- pause보다 voice-started ACK가 늦게 도착하고 그 사이 resume이 일어나는 순서도 검증한다. 서버가 pause 전에 playing을 봤는지 여부만으로 오래된 재생 콜백을 거부하면 불충분하다. 새 primary와 같은 primary의 늦은 콜백을 구분해야 한다.
- root는 기존 목표 안의 정확한 상태 표현/오래된 콜백 처리 수정으로 진행을 승인했다. 사용자 결과·필수 AC·성능 기준 변경은 없다. 수정 전 RED와 이전 실기 원기록을 보존하고 새 후보에서 영향 검증한다.

### 계약 발행 및 이전 관찰의 제출 상태

- 1.0.3은2026-09-21T11:55:56.536Z Technical Lead가 발행했다. `docs/contracts/clarification-playback-stop-v1.0.3.md`, `freeze-v1.0.3.json`; 현재21파일 contentSHA `65efcc79a230bba592dc0fc4b79771dcc1e8e565aa88b42488cb1e3509183812`. 변경 전19파일 바이트와 기존 동결 manifest는 별도 보존했다. 이전1.0.1 해시 검증은 당시 결과이며 변경 후 현재 파일 검증으로 재사용하지 않는다.
- snapshot에 stop-requested와 optional nullable voiceStopRequestedAt을 추가했다. Backend/Frontend/Mobile의 협의를 기록했고 공유 계약14검사가 통과했다는 제작자 보고다. 런타임·웹·새 APK의 영향 검증과 최종 QA는 남아 있다. 이전 엄격 enum 클라이언트는 새 상태를 처리할 수 없으므로 앱 업데이트가 필요하다.
- IO001/004의 사건 범위·복구와 IO005/006의 관측 출처·입력 선택은 Backend G2 인계 및 Tracking bridge 증거에 연결됐다. IO007은 자동2회+지시수정1회 이력과23회복/117영향/실제HTTP19/두관리자19 제작자 결과를 보존했다. [Backend 인계](evidence/backend/G2-handoff.md)는 IO009 이전 후보 제출이며 최종 후보 합격을 의미하지 않는다.
- IO002의6종 형상·동작은 `resources/blender/safety-simulator/HANDOFF.md`와 asset manifest에 제출됐다. IO003 시계 분리는 QR004, IO008 각도 축은1.0.2와 수학/bridge 증거에 연결됐다. 실기 물리 축·좌표 정확도는 별도 미검증이다. 모든 관찰의 최종 판정은 같은 통합 후보의 독립 QA를 따른다.

## QD-001 — QA candidate packaging omission

2026-09-21T13:19:13.477Z: Independent QA confirmed mandatory consistency-report.md and linked initial draft provenance absent from the frozen candidate while present in the working tree. Owner: tech_lead manifest/packaging, rag_lead provenance inventory. Automatic rework01 authorized, cap2; preserve70da and all first failures. Repair in a separately identified candidate, no mutation of the active QA stage, no provider/runtime competition. QA retains verdict/retest authority. This is implementation correction, not a goal or acceptance change.

- 2026-09-21T15:18:24.663Z: QA가QD007을15:16:33.369Z P2 FAIL_CONFIRMED(AC13/14)발행. 실제새CCTV synthetic요청은capture→receipt6ms,204/0bytes인데camera/3observations/신규SQLite모두synthetic;CCTVlive/adminoperatorfixture/adminlive403대조통과. Root가증거읽고기존자동2회범위correction01승인(evidence/orchestrator/qd007-correction-01.json). Backend는원요청권한확인뒤정규화한동일frame을ingest/DB에사용하는단일route+focusedtest소유,Tech는기존semantic유지·실제runtime수정표시r2및별도C3소유. C2불변/W2W3대기/모바일APK변경근거없음. QA독립C2context는18provenance/68archive/7inputcatalog검증범위PASS;종합판정아님. 실제LAN1회PHONE1→4101은15:12:24.675–27.077Z NoRoute/HTTP0,서버ready15:11:12.252 확인;앞두조율창은폰probe없어NOT_RUN이며실패로계산하지않음. 최종W3다시시도허용유지. 목표변경없음.
