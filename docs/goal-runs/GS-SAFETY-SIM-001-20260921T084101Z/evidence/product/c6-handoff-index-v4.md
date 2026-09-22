# C6 사용자 실행 안내·최종 QA 인계 v4

작성 시각: **2026-09-22T00:43:37.871Z**.

## 바로 사용하기

1. 이 컴퓨터에서 **[http://localhost:3000](http://localhost:3000)**을 엽니다. 직접 주소는 [http://127.0.0.1:3000](http://127.0.0.1:3000)입니다.
2. 역할은 **관리자**를 선택합니다. 접근 코드는 로컬 편집기로 `/home/b/.local/state/gs-safety-demo/c6-20260922-ftb108/user.env`의 `GS_DEMO_PIN` 값을 확인해 입력합니다. **UI의 기본값 2026 안내보다 실제 user.env 값이 우선합니다.** 이 문서에는 접근 코드 값을 넣지 않았습니다.
3. **중장비** 모드에서 시나리오를 선택해 시작하고 지도·위험·안내를 확인합니다. 이어 **화재·가스** 모드에서도 시나리오를 선택해 시작합니다. 완료·일시정지 상태면 화면의 초기화/재개 상태를 확인합니다. `scenario` 위치는 합성 입력이며 `measured`는 실제 보정과 관측이 필요합니다.
4. Android는 [C6에서 선택한 Mobile4 APK](/home/b/.cache/gs-safety-c6.pSgWxT/build/mobile-candidate/gs-safety-1.0.0-candidate-4-debug.apk)를 사용합니다. [선택·hash 기록](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/mobile-build-binding.json)을 확인하고 승인된 폰에 설치합니다. 휴대폰 주소는 실제 도달 가능한 서버 주소를 사용하며 PC의 localhost와 혼동하지 않습니다. USB reverse와 LAN 성공은 별도입니다.

현재 [실제 시작 receipt](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/c6-user-demo-started.json)의 상태는 **STARTED**, 시작 시각은 **2026-09-22T00:36:57.501Z**입니다. 새 사용자 DB는 `/home/b/.local/state/gs-safety-demo/c6-20260922-ftb108/database/safety.sqlite`이며 QA DB와 분리되어 있습니다. 서버가 실행 중이므로 중복으로 시작하지 않습니다. 재시작·새 DB 재현은 [C6 launch](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/g3-launch-c6.md)를 따릅니다.

Root의 [현재 사용자 데모 기능 확인](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/orchestrator/final-user-demo/attempt-02/functional-check.json)은 **PASS_SELF_CHECK**, 완료 시각 **2026-09-22T00:42:29.197Z**입니다. 실제 브라우저에서 관리자 로그인 후 EQ-APPROACH와 FG-FIRE를 기본1x로 각각 실행해 완료·사건·최초 안내를 확인하고 두 모드를 초기화했습니다. 페이지 오류는0개이며, Windows의 localhost와127.0.0.1 접속은 각HTTP200입니다. 이는 Root의 사용자 실행 자체 점검이며 독립 QA나16개AC의 승격이 아닙니다. 최초 helper의 로그인 locator timeout은 [과거 기록](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/orchestrator/final-user-demo/functional-check.json)에 보존했습니다.

## 최종 QA 결과와 남은 범위

QA Lead /root/qa_resume의 **2026-09-22T00:40:27.224Z 공식 v2 판정은 BLOCKED / accepted=false**입니다. **4 PASS · 7 BLOCKED · 5 NOT_RUN**으로 전체 목표 인수는 미완료입니다. [공식 최종 QA JSON](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/official-c6-qa-status-v2.json) / [읽기용 보고서](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/official-c6-qa-status-v2.md). 실행 중인 로컬 데모와 전체 AC 인수는 별개이며 C5 PASS를 이월하지 않았습니다.

| AC | 공식 판정 |
| --- | --- |
| AC-01 | NOT_RUN |
| AC-02 | PASS |
| AC-03 | PASS |
| AC-04 | BLOCKED |
| AC-05 | NOT_RUN |
| AC-06 | PASS |
| AC-07 | BLOCKED |
| AC-08 | BLOCKED |
| AC-09 | BLOCKED |
| AC-10 | NOT_RUN |
| AC-11 | NOT_RUN |
| AC-12 | NOT_RUN |
| AC-13 | BLOCKED |
| AC-14 | PASS |
| AC-15 | BLOCKED |
| AC-16 | BLOCKED |

현재 C6 W1은14개 시나리오×3개 새 DB와 실제 HTTP40개 검사 등 제한된 서버 범위를 검증했습니다. [W1 보고서](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-892f975f/w1-report.md)의 범위를 전체 AC로 확대하지 않습니다. W4는 복사 환경 연결 복구 후 새 DB·센서 없는 두 모드·OS 재시작/이력 보존을 실행했으나 전체 설치·보정·Android 두 모드 완료를 증명하지 못했습니다.

카메라는 **중장비 READY 한 모드에서210초(워밍업30초+측정180초),1,289수신 프레임·평균7.1611fps**의 별도 capability를 관측했습니다. 전부 미보정이고 렌더 연결 증거가 없으며 두 번째 모드는 NOT_RUN입니다. 이를 active1x G0 통과로 바꾸지 않습니다. G0 본 시도는 준비 pause409로 warmup 전에 멈춰 완료 측정 구간이0개입니다.

필수 네 폰·Controller+두Controlee·810개 물리 보정, 실제 LAN 성공, 사람의 청취/진동 확인, 전체 capture-to-render, Android 장애/두 모드 흐름, 모든6기종 앱 조작, 사건·지원·해제·재개·종료의 전체 관제 흐름이 남았습니다. C6 화면 검증은67/155상태·140/330대상이며 검색/RAG의 원본 실패·연결 공백도 보존합니다. 정확한 개별 미충족 사유는 공식 QA16개 항목의 원문을 따릅니다.

[104개 원문과 최종 QA 연결](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-final-requirement-qa-pointers-v4.json) · [C6 구현 경로 지도](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-requirement-evidence-map.json). 원문104개·DESIGN·G0·AC는 변경하지 않았습니다.

## C6 소스·원문·재현 자료

| 항목 | 정확한 값 |
| --- | --- |
| 패키지·소스 | `/home/b/.cache/gs-safety-c6.pSgWxT` |
| 후보 | `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b` |
| source SHA256 | `a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411` |
| manifest SHA256 | `2325d673562225a0daf24fb7da060a65e3aab6091e300971e3ea3a83842f1792` |
| BUILD_ID | `QS7DkAZLSyX00oQ4fvGHL` |
| APK SHA256 | `1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a` |
| launch SHA256 | `502251eb38eaf6daf6972029b1ceef73be8c6801f9c05670e203a9718e34370a` |
| 실제 goal SHA256 | `5acf113eee7b75724f5b9e9b3e7d92f8bf99d714f812a35c6946f7a2d4239796` |

[실제 goal 원문](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt) · [목표 변경 이력](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal-changes.md) · [run](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/run.json) · [C6 G3](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/g3-freeze-c6.json) · [소스·산출물 manifest](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/candidate-manifest-c6.json) · [C6 실행 명령](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/g3-launch-c6.md). **목표 변경 없음.** 동결 runbook의 C4/C5 실행 링크는 과거 기록이며 현재 선택은 C6 launch입니다.

[18개 지식·검토](/home/b/.cache/gs-safety-c6.pSgWxT/knowledge/README.md) · [모델 inventory](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/models.json) · [6기종 catalog](/home/b/.cache/gs-safety-c6.pSgWxT/data/equipment/catalog.json) · [3D 자산 manifest](/home/b/.cache/gs-safety-c6.pSgWxT/resources/blender/safety-simulator/artifact-manifest.json) · [보정 안내](/home/b/.cache/gs-safety-c6.pSgWxT/tools/calibration/README.md). PHONE-1카메라·두폰UWB 승인만 유지하고 PHONE-2카메라는 사용하지 않습니다. 실제 카메라 픽셀과 접근 코드는 로컬에만 둡니다.

[v3 작성 시점 인계](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-handoff-index-v3.md)와 [v1 hash 오류 정정 기록](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-product-hash-check-v2.json) 및 과거 실패는 보존했습니다. 추가15분의 종료 시각00:51:07도 미실행을 성공으로 바꾸거나 필수 기준을 완화하지 않습니다.
