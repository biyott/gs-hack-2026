# Acceptance registration and QA ledger

Goal: GS-SAFETY-SIM-001 v1.0. Run: GS-SAFETY-SIM-001-20260921T084101Z.

Registered before implementation: 2026-09-21T08:50:12.231Z by /root/qa_lead. G0 protocol: [qa/g0-protocol-v1.md](qa/g0-protocol-v1.md), version 1.0. The goal SHA-256 is `5acf113eee7b75724f5b9e9b3e7d92f8bf99d714f812a35c6946f7a2d4239796`.

All ACs are mandatory and are preserved verbatim below. Software/device/model/environment slices may have different statuses; no partial status upgrades a whole AC. Product implementation locations will be recorded from the G3 manifest; the responsibility names below are planned coverage, not a claim files exist. This document is QA-owned. Only QA Lead issues an overall PASS/FAIL/BLOCKED; current overall execution status is NOT_RUN (no candidate submitted).

## Original acceptance criteria, unchanged

- AC-01 재현성: 새 로컬 DB에 마이그레이션·seed 후 문서화된 명령으로 서버·웹·앱을 실행한다. 동일 시나리오·seed·가상 시간에서 핵심 위험·행동·경로 결과가 재현되고 센서 없이 두 모드가 완주한다.
- AC-02 중장비: 접근·속도 증가·방향 변경으로 영향 작업자와 경로가 실제로 갱신된다. 이동 제약이 다른 작업자는 허용 통로만 사용한다. 경로 없음·위치 단절·도착을 정상 이동과 구분한다.
- AC-03 화재·가스: 화재/DEMO-GAS-X/복합 위험·통로 차단·영역 변화가 정책과 경로에 반영된다. 명시된 정책에서만 실내 대기를 제공하고, 경로 없음·센서 단절·stale 상태를 처리한다. 위험 해제만으로 통행이 재개되지 않는다.
- AC-04 실행 격리: 초기화는 새 runId를 발급하고 과거 안내를 무효화한다. 모드 전환·재시작 시 타이머·구독·위험 상태가 섞이지 않는다. 다른 대상·실행, 중복·역순·만료 안내 및 지도 버전 불일치를 거부하거나 명시적으로 처리한다.
- AC-05 개인화: 한국어/영어, 계단 불가, 보조 필요, 미확인 프로필을 비교한다. 나이·성별만 바꿔도 확인된 이동 능력 판단은 바뀌지 않으며 국적으로 언어를 정하지 않는다. 수신·이해·지원 수락·도착이 서로 자동 대체되지 않는다.
- AC-06 합성 데이터: 18개 문서의 ID·메타데이터·허용 행동·본문 구성·양언어 의미를 검사하고 실제 검토 이력을 확인한다. draft/retired/기한 전·만료/타 현장/허용되지 않은 모드/다른 물질 문서가 안내 근거에 섞이지 않는다. common도 현장 범위를 지키고 approved_for_demo가 데모 범위에서만 허용되는지 검사한다. negative-fixtures는 정상 검색 범위에 들어가지 않는다.
- AC-07 검색: 최소 12개 사례로 중장비 접근·방향 변경·계단 불가·영어·위치 단절·화재 경로 변경·가스·실내 대기 정책 유무·타 현장 제외·근거 없음·충돌을 실행한다. expectedDocumentIds, forbiddenDocumentIds, expectedActionCodes, matched/no_match/conflict를 실제 검색 결과와 대조한다. 임베딩 모델명·버전·차원과 생성 벡터, FTS5·벡터의 개별 결과·결합 결과·필터 적용 결과를 기록해 실제 실행을 확인한다.
- AC-08 RAG 장애·오염: 지연·실패·잘못된 인용·행동 반전·문서 속 지시문·생성 중 경로/프로필 변경을 주입한다. 기본 경보·경로·관리자 기능이 계속 동작하고 잘못되거나 오래된 보조 설명은 전달되지 않는다. 정상 matched 사례의 evidence가 실제 검색 문서·버전·chunk에 존재해야 한다. 공급자·모델·버전·실제 호출/mock 구분을 기록하고, 장애 주입용 mock 결과를 정상 모델 호출 성공의 증거로 사용하지 않는다.
- AC-09 앱 실동작: 실제 Android에서 두 모드의 같은 안내 버전이 화면·음성·진동에 적용된다. 경로 변경은 옛 음성을 취소하고 중복 이벤트·재빌드·위치 갱신은 중복 발화하지 않는다. TTS 실패, 미지원 언어·진동, 지도 불일치, 만료, 통신 단절, 앱 복귀를 확인한다.
- AC-10 관제 사건 흐름: 위험 인지 → 구역·영상 확인 → 실제 최초 안내 확인 → 작업자 반응 → 관리자 지원 배정/수락·후속 안내 → 해제·통행 재개·종료를 실제 조작한다. incidentId와 안내 버전, 수행자·시각, 상태 변화와 DB 이력이 연결된다.
- AC-11 연결·동시 조작: 웹·앱 SSE 단절·재연결, 관제 새로고침, 관리자 2명 동시 접속과 조작을 실행한다. 최신 snapshot·유효 안내·최초 이력이 복구되고 중복 사건·충돌한 배정·옛 음성 재생이 발생하지 않는다. CCTV·소리·위치 장애를 각각 구분한다.
- AC-12 지도·3D: 책상 네 모서리·대표점의 좌표 변환과 축·단위를 검증한다. 008의 배치와 6종의 고정 제원판·선택 구성·형상·동작을 대조한다. 6종 교체 때마다 위험·경로·안내가 재계산되고 이전 버전이 남지 않는다. ±15° 제한과 전체 보기의 차이를 확인한다.
- AC-13 실측: 네 폰의 역할 선택·권한·준비 상태, Controller와 두 Controlee의 동시 수신, 거리/각도 null 처리, 가림·단절·장비 이동, 영상 표식 보정·좌표 오차·출처, CCTV 프레임률·지연을 실제 단말로 기록한다. 실제 기능 미지원 시 정확한 실패·대체 역할 안내도 확인한다. 지원 여부 표시만으로 정상 동시 측정 성공을 대신하지 않는다.
- AC-14 저장·권한: DB는 서버에서만 접근한다. 허용되지 않은 관리자 해제·종료 요청이 거부되고 허용된 조작은 수행자와 함께 기록된다. 비밀값·불필요한 개인정보가 클라이언트·LLM 요청·로그·증거에 노출되지 않는다.
- AC-15 화면 품질·성능: 실제 웹과 앱을 조작해 지도·경로·위험·CCTV·문구·버튼의 표시, 한국어/영어 잘림, 상태 구분, 소리 중단 중 화면 유지, 고빈도 위치 갱신 영향을 확인한다. 서버 기준 상태와 화면 보간이 분리되고 사전 고정한 성능·오차 기준을 충족한다.
- AC-16 최종 시연·인계: 같은 통합 후보에서 두 모드와 4대 실기 흐름을 재현하고, 다른 실행자가 문서로 설치·보정·시연할 수 있다. 필수 요구의 구현·검증 누락이 없으며 QA Lead의 종합 PASS와 근거 경로가 있다.

## Frozen inputs, expectations and environment

Detailed fixtures, workload, quantiles, fault cases and thresholds are fixed by protocol v1.0. Sources are archived under sources/emul-*.body.md with metadata/manifests. No original source can silently override the explicit goal normalization.

| AC | Input/procedure | Expected observable result | Environment | Planned implementation coverage | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | Fresh DB; every scenario and fixed seed/clock; repeat 3 times; both modes through arrival/release/end | Normalized hazard/action/path traces identical; documented local/LAN launch works | SW, DEVICE | Server integration / Mobile | NOT_RUN | Pending G3 candidate |
| AC-02 | Approach, speed increase, heading change; A/B/C profile fixtures; block route, drop position, arrive | Affected workers and safe constrained routes update; no-path/unknown/arrival distinct | SW | Engine | NOT_RUN | Pending G3 candidate |
| AC-03 | Fire/gas/combined hazard; expand zone; block route; disconnect/stale sensor; release then separately reopen | Policy/route correct; shelter only explicit policy; release does not reopen | SW | Engine | NOT_RUN | Pending G3 candidate |
| AC-04 | Reset/mode switch/restart; 1000 duplicate/reverse/expired/wrong-run/worker/map envelopes | Fresh runId; old guidance invalid; timers/subscriptions isolated; explicit rejection | SW, DEVICE | Engine / Mobile / Web | NOT_RUN | Pending G3 candidate |
| AC-05 | ko/en, stairs disabled, assisted and unknown profile; only age/gender/nationality changed; all responses separately | Capability/locale from reviewed profile; response lifecycle remains independent | SW, DEVICE | Engine / Mobile | NOT_RUN | Pending G3 candidate |
| AC-06 | All 18 docs; draft/retired/time/site/mode/material/common/negative fixtures and review ledger | Required content/IDs/actions/bilingual meaning; only eligible reviewed demo docs indexed | SW, MODEL | Knowledge / RAG | NOT_RUN | Pending G3 candidate |
| AC-07 | At least 12 frozen source004 cases including shelter-policy yes/no, no match and conflict | Expected/forbidden doc and action/status matches; FTS/vector/fused/filtered raw evidence | SW, MODEL | RAG | NOT_RUN | Pending G3 candidate |
| AC-08 | Delay/fail/citation/action/prompt injection; route/profile change while generation active; real normal matched call | Primary flow unaffected; invalid/stale supplement discarded; citations resolve to real retrieved chunks | SW, MODEL | RAG / Engine | NOT_RUN | Pending G3 candidate |
| AC-09 | Actual Android ko/en dual-mode guide; route replacement, dedupe, TTS/vibration/language failure; expiry/map/offline/resume | Same valid version for modalities; old queue/callback inert; latest snapshot recovery | DEVICE | Mobile | NOT_RUN | Pending G3 candidate |
| AC-10 | Actual event flow risk→CCTV→first guide→worker responses→support assignment/acceptance→follow-up→clear/reopen/close | IDs/versions/actors/time join to immutable first guidance and persisted current history | SW, DEVICE | Web / Engine | NOT_RUN | Pending G3 candidate |
| AC-11 | 2 admins conflicting actions; SSE outage/reconnect and refresh; separate CCTV/audio/position faults | Latest state plus original history restored; one assignment winner; no duplicate incident or old audio | SW, DEVICE | Web / Engine / Mobile | NOT_RUN | Pending G3 candidate |
| AC-12 | Four corners + 9 points; 008 layout; all 6 fixed crane configs and model swaps; ±15° versus full view | Units/axes/specs/allowed motion correct; old risk/route/guide invalidated and recalculated | SW, ASSET | Geometry / Web / Assets | NOT_RUN | Pending G3 candidate |
| AC-13 | Four actual roles and permissions; one Controller/two Controlees; 180s receive; angle-null/occlusion/movement/calibration/video | Actual concurrent reception logged; no invented 2D; error/source/age and failures shown; frame/latency measured | DEVICE | Mobile / Tracking | NOT_RUN | Pending G3 candidate |
| AC-14 | Denied and allowed role requests; actor/time DB audit; client/model/log canary scans | Server-only DB; denial and allowed audits; no secrets/unnecessary personal data | SW, MODEL | Server | NOT_RUN | Pending G3 candidate |
| AC-15 | Actual browser and Android; ko/en, small viewports, muted alarm, 10Hz input and measured 180s/mode | No clipping/lost action/state ambiguity; frozen latency/frame/coordinate checks pass | SW, DEVICE | Web / Mobile / Tracking | NOT_RUN | Pending G3 candidate |
| AC-16 | Second executor fresh setup with runbook, same manifest and all artifacts; dual-mode and 4-phone demo | All mandatory tests PASS; reproducible handoff; QA Lead overall PASS and evidence | HANDOFF, DEVICE, MODEL, ASSET | Integrated | NOT_RUN | Pending G3 candidate |

## Verdict and failure rules

Use PASS, FAIL, BLOCKED, NOT_RUN per test. A mandatory physical or real-model prerequisite missing at execution is BLOCKED even when mock software checks pass. Missing attempts are NOT_RUN. Preserve candidate IDs and prior results. Each defect has reproduction, owner, attempts (maximum two reworks), new candidate hash and retest; identical environment failure gets one retry. No final QA PASS is possible while any mandatory AC is FAIL/BLOCKED/NOT_RUN.

## G0 readiness and source coverage

G0 acceptance/input/expected/environment registration is complete. Technical Lead concurred on protocol targets before freeze. Actual phone identity, permissions, UWB sessions, camera measurements and provider/model resources remain unverified; registration is not execution evidence. See [evidence/qa/g0/baseline.md](evidence/qa/g0/baseline.md). The four source008 preparation phones are S24+ ×2, user phrase “Galaxy Z Fold8 와이드”, and Note20 Ultra; only actual execution can establish models/capabilities. All six cranes and all A–G deliverables remain mandatory.
