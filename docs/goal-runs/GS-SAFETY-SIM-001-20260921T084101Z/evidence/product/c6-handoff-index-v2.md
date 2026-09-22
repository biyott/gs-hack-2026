# C6 실행·요구사항·증거 인계 색인 v2

작성 시각: **2026-09-22T00:14:46.962Z**. 후보 외부의 인계 문서이며 동결 소스·runbook·AC를 수정하지 않습니다. **G3와 접수 무결성 확인은 제품 인수가 아닙니다.** 104개 원문 요구사항은 유지하며, 현재 행동 증거 연결과 공식 판정은 QA Lead `/root/qa_resume`가 담당합니다.

이 v2는 [보존된 v1](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-handoff-index.md)의 source·APK hash 표기 오류를 정정합니다. 아래 모든 64자리 hash는 실제 C6 G3 receipt와 연결된 manifest/selector/model 기록에서 읽어 출력했습니다. 후보·소스·빌드·요구사항·QA 결과를 변경한 수정이 아닙니다. 기존 104행 지도 JSON의 후보 정보는 그대로 유효하며, 지도에 남은 v1 인계 링크 대신 이 v2를 사용합니다.

## 현재 후보와 실행 기준

| 항목 | 값·근거 |
| --- | --- |
| Goal / run | `GS-SAFETY-SIM-001` v1.0 / `GS-SAFETY-SIM-001-20260921T084101Z` |
| 패키지 | `/home/b/.cache/gs-safety-c6.pSgWxT` |
| 후보 | `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b` |
| Root G3 | 2026-09-22T00:04:44.817Z · [발행 receipt](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/g3-freeze-c6.json) · SHA-256 `537c1411b1dc3a1328aa098a58e789361bd5e7982a23ff776f745fef13dd3f50` |
| source / manifest | `a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411` / `2325d673562225a0daf24fb7da060a65e3aab6091e300971e3ea3a83842f1792` · [패키지 manifest](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/candidate-manifest-c6.json) |
| 파일·빌드 | 1,026 source / 673 artifact · BUILD_ID `QS7DkAZLSyX00oQ4fvGHL` · HEAD만으로 후보를 식별하지 않음 |
| 실행 문서 | **[패키지 g3-launch-c6.md](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/g3-launch-c6.md)** · SHA-256 `502251eb38eaf6daf6972029b1ceef73be8c6801f9c05670e203a9718e34370a` |
| 기술 인계 | [기술 인계](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/g3-candidate-c6-handoff.md) · [최종 결합](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/c6-final-handoff-binding.json) |
| 원문 | [실제 goal 입력](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt) · SHA-256 `5acf113eee7b75724f5b9e9b3e7d92f8bf99d714f812a35c6946f7a2d4239796` |
| 목표·실행 이력 | **목표 변경 없음** · [변경 이력](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal-changes.md) · [run.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/run.json) |

동결된 [demo-runbook](/home/b/.cache/gs-safety-c6.pSgWxT/docs/demo-runbook.md) 안의 C4 후보·빌드·실행 링크는 과거 기록입니다. **현재 패키지 선택과 실행 명령은 위 C6 launch·G3 receipt를 우선합니다.** 기술 인계의 “Root 발행 대기” 문구도 작성 시점 기록이며 이후 발행 사실은 G3 receipt를 확인합니다.

## 실행·APK·데이터·모델

| 목적 | 위치·재현 순서 |
| --- | --- |
| 웹 실행 | 패키지 루트, Node 22/npm 10에서 C6 launch를 따릅니다. 후보 밖의 새 절대 `DATABASE_PATH`와 비공개 `GS_DEMO_PIN`을 같은 shell에 설정 → `npm run db:migrate` → `npm run db:seed` → `npm run start -- --port 3000`. 발행된 production build를 사용합니다. |
| DB·QA 분리 | DB는 서버 소유 SQLite입니다. 패키지의 과거 실행 DB를 재사용하지 않습니다. QA는 별도의 새 절대 DB·빈 `410x` 포트를 선택하며, 시연은 QA DB·포트·실행 창을 점유하지 않습니다. |
| 주소·연결 | 웹 `http://localhost:3000`, 폰 `http://<서버-LAN-IP>:3000`. 로컬 응답·bind·USB reverse는 성공한 LAN 증거가 아닙니다. 장치별 USB 대안은 승인된 기기에만 runbook 절차를 적용합니다. |
| APK 선택 | [C6 패키지 selector](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/mobile-build-binding.json)의 `selectedApk`, `sourceManifest`, `packagedProducerManifest`를 사용합니다. 저장소 문맥은 같은 selector의 `repositorySourceManifest`, `producerManifest`를 따르며 경로 실패 시 자동 전환하지 않습니다. |
| 선택 APK | [Mobile4 APK](/home/b/.cache/gs-safety-c6.pSgWxT/build/mobile-candidate/gs-safety-1.0.0-candidate-4-debug.apk) · SHA-256 `1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a`. hash 대조 후 승인된 폰에 `adb -s <authorized-device> install -r "$GS_DEMO_APK_PATH"`. Mobile4는 재사용 구성요소 번호이며 통합 C6 실기 검증을 대신하지 않습니다. |
| 모델·런타임 | [models.json](/home/b/.cache/gs-safety-c6.pSgWxT/runtime-artifacts/models.json)과 [모델 README](/home/b/.cache/gs-safety-c6.pSgWxT/data/knowledge/runtime/README.md). 모델 artifact-set SHA-256 `991e301bd5b6baddeef7218eb453cccaab41d7aeb223d822344e3bb173323539`. E5 multilingual-small q8/384차원, Qwen3-0.6B Q8_0, llama.cpp b10964가 선택되어 있습니다. |
| provider | `data/knowledge/runtime/start-llm.sh`를 따릅니다. 8092의 기존 provider·QA 측정 창은 자원 소유자를 확인하며, 과거 PID를 현재 실행 중이라는 증거로 사용하지 않습니다. Bash script는 `.env`를 자동 로드하지 않으므로 사용자 지정 모델 변수는 명시 export합니다. |
| 18개 지식 | [현재 문서·검토 색인](/home/b/.cache/gs-safety-c6.pSgWxT/knowledge/README.md): COMMON 4 + EQ 6 + FG 8. [초안](/home/b/.cache/gs-safety-c6.pSgWxT/data/knowledge/drafts), [수정](/home/b/.cache/gs-safety-c6.pSgWxT/data/knowledge/revisions), [검토](/home/b/.cache/gs-safety-c6.pSgWxT/data/knowledge/reviews), [일관성 보고](/home/b/.cache/gs-safety-c6.pSgWxT/consistency-report.md)를 함께 보존합니다. 합성 시연 지식이며 실제 현장 승인으로 승격하지 않습니다. |
| 지식 DB 준비 | 인증된 `GET /api/simulation?mode=equipment`가 초기화를 시작합니다. 모델 측정 전 새 DB의 문서/청크/FTS 각 18개, 완료된 ingestion, 고정 revision의 실제 384차원 embedding을 관측합니다. health만으로 완료를 추정하지 않습니다. launch의 HTTP verifier는 fire-gas 상태를 변경하고 paused로 남기므로 QA 소유 절차로 실행합니다. |

## 자산·두 모드·실측 준비

[고정 6기종 catalog](/home/b/.cache/gs-safety-c6.pSgWxT/data/equipment/catalog.json), [자산 manifest](/home/b/.cache/gs-safety-c6.pSgWxT/resources/blender/safety-simulator/artifact-manifest.json), [Blender 인계](/home/b/.cache/gs-safety-c6.pSgWxT/resources/blender/safety-simulator/HANDOFF.md), [GLB](/home/b/.cache/gs-safety-c6.pSgWxT/public/assets/cranes), [표식](/home/b/.cache/gs-safety-c6.pSgWxT/public/markers), [보정 절차](/home/b/.cache/gs-safety-c6.pSgWxT/tools/calibration/README.md)를 사용합니다. C6 이전 자산 수정의 [r4 구현 결합](/home/b/.cache/gs-safety-c6.pSgWxT/docs/contracts/implementation-binding-v1.0.4-r4.json)은 QD009의 제거 장비 참조 정리와 QD010의 Maeda 오각형 물리 셸 5개·이동 단 4개를 연결합니다. 제작자 검사·자산 보유는 현재 motion/render/위험 재계산 QA 판정이 아닙니다.

중장비·화재/가스는 독립 모드입니다. 초기 `scenario` 위치는 합성으로 표시하고, `measured`는 실제 현재 보정·관측이 있어야 합니다. 누락·stale은 unknown으로 남깁니다. 역할 변경 뒤 주소·역할·PIN과 UWB 준비를 다시 확인합니다. 재시작은 재연결/paused 확인 → 실측 보정 → 운영자 Resume → clock sync/카메라/UWB 재준비 → 새 관측 freshness 확인 순서이며 Start로 paused를 우회하지 않습니다.

[과거 장치 preflight](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/resume-physical-preflight-20260921/device-preflight-02.json)는 **2026-09-21T23:16:03.423Z에 승인된 두 폰 온라인**을 기록합니다: PHONE-1 SM-N986N Android 13/API 33, PHONE-2 SM-S926N Android 16/API 36. 과거 조회 기록이며 현재 C6 장치 연결·앱 실행·LAN·센서 성공을 뜻하지 않습니다. **필수 네 폰, Controller+두 Controlee 동시 ranging, 물리 보정/810개 관측, 성공한 LAN, 실제 청취/진동, camera capture-to-render 검증은 유지합니다.** 승인 범위는 두 폰 UWB와 PHONE-1 카메라이며 PHONE-2 카메라는 제외합니다. 실제 카메라 픽셀은 로컬 전용입니다.

## C6 수정·현재 QA·104개 요구사항

현재 [r5 구현 결합](/90-biyott@github/gs-hack-2026/docs/contracts/implementation-binding-v1.0.4-r5.json)은 QD011의 기존 44px 조작 영역·주석 hitbox/배치, QD012의 전체 선택 시나리오 이름 줄바꿈, QD013의 새 사고 알림 식별자를 연결합니다. 원래 목표·DESIGN·G0/AC는 그대로이며, C5는 실패 이력을 보존한 이전 후보입니다. [CJK 증거 복구](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/c6-cjk-proof-recovery.json)는 기존 r5와 같은 hash의 원본 증거 복구이며 r6·두 번째 build·소스 변경을 뜻하지 않습니다.

[현재 C6 접수](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/receipt-validation.json)는 2026-09-22T00:05:12.958Z–2026-09-22T00:05:15.018Z에 발행되었습니다. **접수 시점** 상태는 `RECEIPT_VERIFIED`, 제품 실행 `NOT_STARTED`, 종합 `NOT_ISSUED`입니다. 후속 행동 QA 결과가 아닙니다.

- [C6 자원 원장](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/resource-ledger.jsonl). 배정·접수는 실제 검증 결과가 아닙니다.
- [104행 C6 색인](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-requirement-evidence-map.md) / [전체 원문·파일·hash·QA 포인터 JSON](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c6-requirement-evidence-map.json): 현재 행동 증거는 **대기**, 완료·QA verdict는 모두 null입니다.
- [공식 acceptance](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/acceptance.md) · [QA 상태](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/g4-current-state.json) · [자원 제한·재개 조건](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/resource-blockers.md): 내부 후보 ID와 작성 시각을 확인합니다. C5 상태·PASS를 C6으로 이월하지 않습니다.

현재 stock 시나리오 12–34초로는 G0가 요구하는 **active 1x 카메라 210초** workload를 그대로 실행할 수 없다는 제한이 기록되어 있습니다. **READY 연속 카메라는 별도의 capability 관측이며 active G0를 대신하거나 기준을 완화하지 않습니다.** 실제 픽셀은 로컬 전용입니다.

[C5 인계](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c5-handoff-index.md)와 [C5 지도](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/product/c5-requirement-evidence-map.json), C4와 그 이전 실패·재작업·중단 기록은 보존합니다. 마감 **2026-09-22T00:35:49Z**가 미실행을 성공으로 바꾸지 않습니다. 최종 QA 증거는 별도 후속 버전에 연결합니다.
