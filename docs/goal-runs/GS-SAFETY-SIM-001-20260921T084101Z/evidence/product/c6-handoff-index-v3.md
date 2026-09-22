# C6 최종 실행·QA 인계 v3

작성 시각: **2026-09-22T00:36:43.962Z**. QA Lead /root/qa_resume의 2026-09-22T00:29:42.657Z 공식 판정은 **BLOCKED / accepted=false**입니다. 현재 C6는 전체 목표 인수가 완료되지 않았습니다. 판정 수: **PASS 4, FAIL 0, BLOCKED 7, NOT_RUN 5**. [공식 QA 원본](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/official-c6-qa-status-v1.json)의 범위·근거를 그대로 따르며 C5 PASS를 이월하지 않습니다.

## 지금 실행할 결과

**작성 시점 사용자 데모 시작 receipt는 아직 없습니다(START_RECEIPT_PENDING).** [준비 receipt](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/c6-user-demo-preparation.json)의 NOT_STARTED 계획을 실행 성공으로 표시하지 않습니다. Root 시작 승인 후 기술 담당자가 실제 시작 결과를 기록하고 있습니다. 예상 주소는 http://127.0.0.1:3000이며 시작 receipt가 성공을 확인하기 전에는 접속 가능하다고 단정하지 않습니다.

[QA 자원 해제](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/final-resource-release-v1.json)는 2026-09-22T00:34:11.784Z에 RELEASED를 기록했습니다. 이것은 사용자 데모 시작 성공과 별개입니다. 실행 기준은 [C6 패키지 launch](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/g3-launch-c6.md)이며, 패키지는 `/home/b/.cache/gs-safety-c6.pSgWxT`입니다. 비공개 접근 코드는 실제 생성된 경우에만 로컬 `/home/b/.local/state/gs-safety-demo/c6-20260922-ftb108/user.env`에서 확인합니다. 이 인계에는 값을 복사하지 않았습니다. DB는 `/home/b/.local/state/gs-safety-demo/c6-20260922-ftb108/database/safety.sqlite`로 계획되어 있으며 실제 생성 여부는 시작 receipt를 확인합니다.

수동 재현은 C6 launch에 따라 Node22/npm10, 새 절대 DATABASE_PATH, 비공개 GS_DEMO_PIN을 같은 shell에 설정하고 `npm run db:migrate` → `npm run db:seed` → `npm run start -- --port 3000` 순서입니다. 이미 시작된 데모와 중복 서버를 띄우지 않습니다. [선택 APK](/home/b/.cache/gs-safety-c6.pSgWxT/build/mobile-candidate/gs-safety-1.0.0-candidate-4-debug.apk)와 [mobile selector](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/mobile-build-binding.json)를 함께 확인합니다. 승인된 단말에만 설치하며 Mobile4 재사용은 네 폰 검증을 대신하지 않습니다.

## 현재 C6 검증 범위

[W1 제한된 서버 보고서](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-892f975f/w1-report.md)에는 14개 시나리오×3개 새 DB와 HTTP29+5+6=40개 검사가 포함됩니다. QD009는30PASS+6BLOCKED이며 전체 AC 완료로 합산하지 않습니다. 공식 QA가 현재 PASS로 발행한 AC와 미충족 AC는 아래 표를 기준으로 합니다.

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

판정의 원문 기준·개별 근거는 [공식 QA 원본](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/official-c6-qa-status-v1.json), 원래104행과 각 공식 AC 연결은 [104행 최종 QA 포인터](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-final-requirement-qa-pointers-v3.json), 구현 경로는 [C6 구현 지도](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-requirement-evidence-map.json)에서 확인합니다. 이 색인은 새로운 판정을 발행하지 않습니다.

G0 시도는00:20:53.074–00:20:59.375에 준비 상태 IDLE→pause409로 warmup 전에 멈췄으며 완료된 측정 구간은 없습니다. [시도와 마감 결정](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/orchestrator/resume-90min/c6-deadline-measurement-priority-01.json)을 보존합니다. READY 연속 카메라는 별도 capability 관측이며 active1x210초 G0를 대신하지 않습니다. 카메라·W4의 최종 결과는 위 QA 원본이 실제 포함한 범위만 인정합니다.

필수 네 폰/Controller+두Controlee,810개 실제 보정 관측, 성공한 현재 LAN, 실제 청취·진동·capture-to-render, 완전한 C6 화면/앱 흐름은 미충족·미실행 범위를 공식 QA대로 유지합니다. C6 화면 매트릭스67/155상태·140/330대상은 부분 실행이며 전체 완료가 아닙니다. PHONE-1카메라·두폰UWB 승인 범위, PHONE-2카메라 제외, 실제 픽셀 로컬 전용은 유지합니다.

## 식별·원문·자료

| 항목 | 정확한 값 |
| --- | --- |
| 후보 | `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b` |
| source | `a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411` |
| manifest | `2325d673562225a0daf24fb7da060a65e3aab6091e300971e3ea3a83842f1792` |
| Root G3 | `537c1411b1dc3a1328aa098a58e789361bd5e7982a23ff776f745fef13dd3f50` |
| BUILD_ID | `QS7DkAZLSyX00oQ4fvGHL` |
| APK SHA256 | `1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a` |
| launch SHA256 | `502251eb38eaf6daf6972029b1ceef73be8c6801f9c05670e203a9718e34370a` |
| 원문 SHA256 | `5acf113eee7b75724f5b9e9b3e7d92f8bf99d714f812a35c6946f7a2d4239796` |

[실제 goal 원문](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt) · [변경 이력](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal-changes.md) · [run](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/run.json) · [G3](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/g3-freeze-c6.json) · [manifest](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/candidate-manifest-c6.json). **목표 변경 없음.** DESIGN·G0·AC 기준도 변경하지 않았습니다.

[18개 지식·검토 이력](/home/b/.cache/gs-safety-c6.pSgWxT/knowledge/README.md) · [모델 inventory](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/models.json) · [고정6기종 catalog](/home/b/.cache/gs-safety-c6.pSgWxT/data/equipment/catalog.json) · [자산 manifest](/home/b/.cache/gs-safety-c6.pSgWxT/resources/blender/safety-simulator/artifact-manifest.json) · [보정 안내](/home/b/.cache/gs-safety-c6.pSgWxT/tools/calibration/README.md). 현재 실행 선택은 C6 launch이며 동결 runbook의 C4/C5 링크는 역사적 기록입니다.

[인계 v2](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-handoff-index-v2.md)와 [v1 표기 오류 정정 기록](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-product-hash-check-v2.json), C1–C5 실패·C6 미완료 기록은 그대로 보존합니다. 시연 가능한 소프트웨어와 전체 목표 인수는 구분하며 마감00:35:49가 남은 기준을 완화하지 않습니다.
