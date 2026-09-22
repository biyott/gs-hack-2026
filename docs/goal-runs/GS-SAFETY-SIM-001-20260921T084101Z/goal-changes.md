# 목표 변경 이력

목표 변경 없음. 목표 GS-SAFETY-SIM-001 v1.0.

사용자 실행 입력(goal.input.txt), 기존 작성 문서(goal.document.original.md), 실제 create_goal 도구의 축약 objective(goal.tool-objective.txt)를 구분해 보존한다. 작성 문서는 실행 기록으로 취급하지 않는다. 목표 도구의 축약 문자열은 인수 범위를 대체하지 않으며 전체 원문이 기준이다.

## 운영 지시 추가 — 2026-09-21T11:27:57.409Z

- 사용자 원문: “wifi가 되는데 신호가 됐다 안됐다 하니 계속 다시 시도해봐. .하면서 안되면 너 말대로 usb 검증등을 하고. 또 wifi 시도 해보고. 안되면 어쩔수 없고 가상으로 하던가”
- 변경 전: 동일 환경 오류 재시도1회를 기본으로 두고 LAN 연결 실패를 보고함.
- 변경 후: 간헐적인Wi-Fi에 한해 USB 시험 단계 사이에서 짧은 연결 재시도를 추가 허용. 실패 시 USB 및 가상 시뮬레이션의 가능한 검증을 계속함. 방화벽/라우터 변경은 승인되지 않음.
- 제안/승인자: 사용자 직접 지시. 수행: Orchestrator/Mobile/Technical.
- 범위/판정: 목표버전1.0 유지, 목표 변경 없음. LAN/실측 결과를 가상 성공으로 대체하거나 필수AC를면제한다는명시적변경은없어기존합격기준유지. 필요시별도변경안으로처리.
- 영향: AC01/09/11/13/15/16, 연결 시험 일정 및 증거. 실제LAN성공시별도HTTP/SSE/앱재검증하며추가재시도실패도보존.
- 실제하네스입력: goal.steering.wifi-20260921.input.txt, SHA-256 5fbd1a0a3a50bb62c6d72ebfb0ca09c3616cd3db6a4a6d2d281830dde8682b7e. 입력시각/수집경로는evidence/orchestrator/wifi-steering.json. 최초goal.input.txt와기존실패는불변.

## 기존 목표를 구현하는 기술 계약 변경 연결

아래는 목표 원문·버전·필수 결과·합격 기준의 변경이 아니다. 목표는 변경 전후 모두1.0이다. Technical Lead가 공통 계약을 소유하고 영향 Lead와 협의한 세부 결정은 해당 계약 원문에 보존한다. 원래 동결본과 실패 증거는 유지하며 새 최종 후보에서 QA가 영향 범위를 검증한다.

| 발행 시각 UTC | 계약 | 구현 전후의 핵심 구분 | 영향 및 재검증 |
| --- | --- | --- | --- |
| 2026-09-21T10:47:35.734Z | `docs/contracts/v1.0.1-addendum.md`, `freeze-v1.0.1.json` | 보조 설명 버전과 최초 긴급 행동 버전, 스트림 권위, 시나리오/실측 입력 및 관측 출처를 명시 | AC04/06–11/13–15; 재접속·음성 중복·출처·시간·입력 격리 |
| 2026-09-21T11:06:45.382Z | `docs/contracts/clarification-uwb-azimuth-v1.0.2.md`, `freeze-v1.0.2.json` | 원시 Android 시계방향 각도를 보존하고 서버 경계에서 지도 방향으로 변환; 물리 장착 확인 전 yaw는 null | AC12/13; 축 변환 수학 및 실제 각도·장착·오차 측정 별도 |
| 2026-09-21T11:55:56.536Z | `docs/contracts/clarification-playback-stop-v1.0.3.md`, `freeze-v1.0.3.json` | 과거 재생 시작과 현재 서버 중단 요청을 구분; stop-requested/voiceStopRequestedAt은 기기 음성 종료 확인이 아님 | AC04/09–11/15; pause·지연 ACK·빠른 resume·새 primary·재시작·현재 관제 문구 |

1.0.3은 Backend/Frontend/Mobile 협의와 Technical Lead 결정으로 진행했다. 기존 strict enum 앱은 새 상태를 처리하도록 다시 빌드한다. 이는 실기 성공의 대체, 기존 실패의 삭제 또는 사용자 승인 범위의 확대가 아니다. 권한 승인 원문은 `evidence/orchestrator/device-permission-approval.json`, 실패 수정은 `integration-observations.md`와 담당자 원시 증거를 따른다.

- 2026-09-21T14:00:35.867Z: 목표 변경 없음(목표v1.0·AC·G0유지). 위임된기술계약SEC01권한정규화1.0.4발행:docs/contracts/freeze-v1.0.4.json,contentSHA0dfda820ac09b8c075671f68416dac02d57c3751fa4ecbe48b2440b7c83d6205. 담당Tech/영향Backend·Frontend·Mobile·Tracking협의로불필요한worker/device조회·업로드응답제거및consumer호환반영. 이전freeze와C1실패보존,새통합후보에서권한/소비자/DB영향QA필수. 이는새사용자결과나합격조건변경이아님.

- 2026-09-21T15:30:07.225Z: 목표 변경 없음(목표v1.0/G0/AC유지). `docs/contracts/implementation-binding-v1.0.4-r2.json` SHA5f90a218c9dd43571046283076d6749c7c3728b846809a92e2a5e02ed27cf75a는기존addendum64/접근계약28의출처정규화를구현하는QD007수정결합이다. 기존요구의의미·wire/schema는변경하지않으며실제runtime동작수정임을명시한다. Tech결정/Backend·Tracking협의,기존C2/r1/FAIL보존;별도C3에서권한·provenance·DB및필수AC재검증.

- 2026-09-21T17:04:44.985Z — 목표 변경 없음. QD008 자동 수정01의 구현 결합 r3 발행(Tech): docs/contracts/implementation-binding-v1.0.4-r3.json SHA-256 371afc9fa891c57ed0c37ccc7132695bb2e633d9f3f452b8b1123871d67d66e3. 원래 절차 적용 조건을 이력·엔진 선택 정책으로 확인하고 선택적 RAG 작업을 최초 command stack 이후로 미루는 수정이다. runtimeBehaviorChanged=true, 기존 공통 계약 의미·공개 schema·goal v1.0·G0·AC·corpus·APK는 유지. Backend/RAG/소비자 Lead 합의 및 정확한 소스와 실패 증거는 r3에 연결. 새 C4에서 AC07/08 및 안내·권한·재현·UI 영향 회귀를 QA가 실제 실행하며 이전 후보 PASS를 재사용하지 않는다.

- 2026-09-21T19:29:36.320Z: 목표 변경 없음. 목표v1.0/G0/AC를 유지하며 기술 구현 결합만1.0.4-r3→r4로발행(실제19:26:55.815963Z, docs/contracts/implementation-binding-v1.0.4-r4.json SHAe2ae8f14061a8d7f96a2e1d8e2cee0e982abf49a064b05771d59fe0b22af4b39). 원인QD009현재장비안내의폐기된위험참조/QD010Maeda4단사각외피를기존5단오각요구에정합. Root기존범위승인QD009D1/D2및QD010correction01, Backend/Design/Tech·영향받는FE/Mobile/RAG협의기록유지. 공개schema/API/엔진끝점법칙불변; runtimeBehaviorChanged/assetGeometryBehaviorChanged true. 구버전·원FAIL·재시도횟수·만료뒤정적실행기록보존. 영향AC02/04/12및통합회귀는새C5실제QA필요; 과거PASS전환없음. 별도새후보생성진행중이며아직G3미발행.

2026-09-21T23:10:19.542Z: 목표 변경 없음. 사용자 마감·재개 지시 원문을 docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.steering.deadline-20260921T230549.input.txt에 보존(SHAb1e7aca814cfb89e76ee99ee1fd22878f8e48daa5d4f1568a66a94f238182c1b). 최초 관측23:05:49Z기준90분마감00:35:49Z; 실제입력도착시각은미확인. 범위·AC·G0·4대실기요구불변.
