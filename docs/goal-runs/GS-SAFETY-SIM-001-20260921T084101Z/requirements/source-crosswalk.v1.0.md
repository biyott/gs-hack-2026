# Source crosswalk v1.0

Goal GS-SAFETY-SIM-001 v1.0; run GS-SAFETY-SIM-001-20260921T084101Z. This crosswalk records product requirements, not test execution. Source titles, original bodies, fetched/source-update times and SHA-256 values are in [emul-manifest.json](../sources/emul-manifest.json). Read-only scope omission review by `/root/product_lead/scope_audit` confirmed the six-crane/four-phone, normalization, model-evidence and completion boundaries; this is an editorial self-check, not independent QA.

| Original source sections | Requirement inventory mapping | AC coverage | Implementation surfaces / evidence to be linked by owning Lead and QA |
| --- | --- | --- | --- |
| [002](../sources/emul-002.body.md): goals, two simulation purposes/inputs/flows/scenarios/scope | REQ-A-01–06 | AC-01–04 | `src/server/` simulation, risk, routing; scenario JSON; deterministic engine/API runs for both modes |
| 002: full stack | REQ-K-01–03 | AC-01,09,12–15 | root manifests, Next route handlers, Flutter/Kotlin build files; actual builds/runtime |
| 002: personalisation table and rules | REQ-B-01, REQ-K-05 | AC-05,09 | profile storage/version and routes; demographic invariance and explicit unknown-profile cases |
| 002: server module responsibilities, map/scenario contents | REQ-A-03,06, REQ-K-03 | AC-01–04 | Technical Lead chooses actual paths while preserving module responsibility boundaries; scenario schema/seed |
| 002: operator controls and implementation criteria | REQ-A-01–06, REQ-B-06, REQ-C-01,07 | AC-01–04,10,11,15 | controls invoke actual server transitions; SSE snapshot, new run ID, timer cleanup and persisted events |
| [003](../sources/emul-003.body.md): RAG purpose, provider stack, personalisation inputs | REQ-D-01,02, REQ-K-05,06 | AC-05,07,08,14 | `src/server/rag/`, structured profiles, configurable providers; real model/version/vector evidence and minimum data |
| 003: knowledge metadata, procedure chunking, processing/filter pipeline | REQ-META-13, REQ-D-02,03,05,09,10 | AC-06–08 | normalized schema, persisted document/chunk/vector/rag-run/evidence records; FTS5, vector and fused results with filters |
| 003: guidance output contract | REQ-K-04, REQ-D-09 | AC-04,08–11 | versioned `packages/contracts/src/` plus compatibility mapping for 005 fields; stale generated result rejection |
| 003: bilingual rules, fallback, validation and model failures | REQ-B-04, REQ-D-09,10 | AC-05,07–09 | bilingual reviewed templates, semantic validation, citation checks, latency/failure/prompt-injection tests |
| [004](../sources/emul-004.body.md): repeated RAG content before synthetic authoring instructions | Same 003 mappings above | AC-05–08,14 | duplicate source content does not create a second incompatible schema |
| 004: environment IDs and document list | REQ-D-04,06–08 | AC-06,07 | exact 18 document IDs/topics below; common IDs; map-driven physical links |
| 004: creation prompt sections 4–7, body/YAML/examples | REQ-D-04–07, REQ-K-05,06 | AC-05,06,08 | exact metadata and twelve-part procedure body; no invented safety authority, field facts or routes |
| 004: prompt sections 8–9 and registration process | REQ-D-05,08–10 | AC-06–08 | dataset README, consistency report, twelve-case minimum, isolated negative fixtures, review transition history |
| [005](../sources/emul-005.body.md): module goal, stack, layers and responsibilities | REQ-B-01–06, REQ-K-02 | AC-05,09,15 | `apps/mobile/` View/ViewModel/Repository/Service; immutable guidance ChangeNotifier, position ValueNotifier, map layers |
| 005: output sequence, deduplication/cancellation and guidance fields | REQ-B-02–05, REQ-K-04 | AC-04,08,09,11 | real Android logs/screen/audio/vibration by same guidance version; obsolete callback and queued speech cancellation |
| 005: RAG/personalisation, performance, SSE/lifecycle, completion | REQ-B-04–06, REQ-K-03,09 | AC-05,09,11,15 | foreground lifecycle recovery, exactly one guidance SSE, snapshot recovery, no build-triggered speech |
| [006](../sources/emul-006.body.md): layout and incident delivery flow | REQ-C-01,04,05,07 | AC-10,15 | web panels joined by incidentId and exact sent guidance/version; server facts distinct from generated explanation |
| 006: auto-fit/floor/camera and alert controls | REQ-C-02,03,07 | AC-10,11,15 | camera coverage and mode/age state; fixed/follow/full/hazard views; nonoverlapping sounds, mute retains alert |
| 006: first action, state separation, manager intervention and recovery | REQ-C-04–07 | AC-05,10,11,14 | real DB audit and two-manager conflict handling; actor/time, immutable first guidance, new follow-up versions |
| 006: PATH-D illustrative screen | REQ-META-13, REQ-D-06 | AC-06,12 | excluded from fixed map ID set; example is not new topology authority |
| [008](../sources/emul-008.body.md): site selection and modeling layers | REQ-E-01, REQ-K-08 | AC-12,15 | synthetic map label, simplified public-reference background; no measured-plant claims |
| 008: six-crane table, dimensional interpretation | REQ-E-04–07 | AC-12 | `data/equipment/`, six GLBs and Blender sources, manufacturer edition/page references; uncertainty separate |
| 008: scale, coordinate formulae, layout, graph and table/full reach | REQ-E-02,03,08 | AC-02,03,12,13 | calibrated boundary transforms and fixed map layout; shape-valid destinations; table-only ±15° |
| 008: four devices, roles, actual UWB and marker tracking | REQ-F-01–06 | AC-09,12,13,15 | actual per-device model/OS/permissions/session evidence; video coordinates and UWB distance provenance |
| 008: links to RAG, source checks and remaining limits | REQ-D-06, REQ-E-06,07, REQ-F-06 | AC-06–08,12,13 | canonical IDs, analytic risk independent of GLB, invalidate old versions, source assertions distinct from present verification |

## Exact 004 dataset manifest

| ID | Required topic |
| --- | --- |
| COMMON-001 | 개인 프로필 적용 원칙 |
| COMMON-002 | 선호 언어와 안내 이해 확인 |
| COMMON-003 | 이동 보조 및 지원 요청 |
| COMMON-004 | 안내 버전 변경과 오래된 안내 처리 |
| EQ-001 | 중장비 접근 경보 |
| EQ-002 | 중장비 방향 변경에 따른 안내 갱신 |
| EQ-003 | 개인 이동 제약을 반영한 회피 안내 |
| EQ-004 | 유효한 회피 경로 없음 |
| EQ-005 | 위치 수신 중단 |
| EQ-006 | 지정 회피 지점 도착 확인 |
| FG-001 | 가상 화재 감지와 통로 제한 |
| FG-002 | 화재로 인한 기존 이동 경로 변경 |
| FG-003 | 가상 가스 경보와 영향 구역 안내 |
| FG-004 | 시나리오 정책이 이동을 지정한 경우 |
| FG-005 | 시나리오 정책이 실내 대기를 지정한 경우 |
| FG-006 | 화재·가스 복합 위험으로 경로가 없는 경우 |
| FG-007 | 환경 센서 수신 중단 |
| FG-008 | 위험 해제와 별도 통행 재개 확인 |

Required YAML fields: `documentId`, `title`, `siteIds`, `simulationType` (`common|equipment|fire-gas`), `hazardTypes`, `applicableRoles`, `profileConditions`, `actionCodes`, `language`, `version`, `synthetic`, `approvalStatus`, `sourceReference`. Creation values are language `ko`, version `0.1.0`, `synthetic: true`, `approvalStatus: draft`, `sourceReference: synthetic://safety-simulator/`. Runtime normalisation additionally retains 003 site/simulation/status compatibility, roles/zones/substances, validity dates and real review records without discarding information.

Required body order: 목적; 적용 조건; 적용 제외 조건; 필요한 입력 필드; 행동 코드와 설명; 개인화 적용; 예외 및 기본 안내; 한국어 안내 예시; 영어 안내 예시; 확인할 상태; 검색 키워드; 관련 문서 ID. Keep conditions, action and exceptions together within a procedure chunk. Examples use applicable placeholders such as `{equipmentId}`, `{zoneId}`, `{nextWaypointLabel}`, `{destinationLabel}`, `{guidanceVersion}`; Korean and English meaning, prohibitions, identifiers and placeholders agree.

Only action codes: `ALERT_HAZARD`, `FOLLOW_VALIDATED_ROUTE`, `GUIDANCE_UPDATED`, `ROUTE_UNAVAILABLE`, `POSITION_UNKNOWN`, `SENSOR_UNKNOWN`, `REQUEST_ASSISTANCE`, `SHELTER_PER_SCENARIO`, `CONFIRM_UNDERSTANDING`, `CONFIRM_ARRIVAL`, `AWAIT_REOPEN_AUTHORIZATION`.

Test case fields: `testId`, `simulationType`, `context`, `query`, `expectedDocumentIds`, `forbiddenDocumentIds`, `expectedActionCodes`, `expectedOutcome` (`matched|no_match|conflict`), `reason`. Minimum twelve cases cover approach, direction change, no stairs, English, unknown position, fire route change, DEMO-GAS-X, shelter policy present, shelter policy absent, wrong site, no evidence and conflicts. Negative fixtures stay outside normal indexes. Required package paths are README, `knowledge/common/`, `knowledge/equipment/`, `knowledge/fire-gas/`, `tests/rag-test-cases.json`, `tests/negative-fixtures/`, and `consistency-report.md`.

Review metadata records actual reviewer, timestamp and reviewed version. Do not describe format-only checks as semantic review or draft creation as demo approval. `approved_for_demo` is usable only in the isolated demo corpus and is never an actual-site approval.

## Interpretation register

No unresolved source disagreement currently requires an outcome-changing decision. Exact device model identity, present hardware access, provider resources, unavailable manufacturer dimensions, and calibration measurements are factual verification tasks. Preserve unknowns and report blocked checks; do not invent them. The G0 performance and tolerance specification is delegated to QA/Technical Leads and resides in [QA protocol](../qa/g0-protocol-v1.md). These details do not authorize changing the user result or mandatory tests.
