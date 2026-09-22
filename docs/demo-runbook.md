# 안전 시뮬레이터 실행·시연 인계

목표 `GS-SAFETY-SIM-001` v1.0, 실행 `GS-SAFETY-SIM-001-20260921T084101Z`의 운영 문서입니다. **현재는 통합 중인 인계 문서이며, 아래 절차 전체의 실행 성공을 뜻하지 않습니다.** 구현 담당자의 실제 명령 실행, 통합 검증과 네 폰 실기 검증을 구분합니다. 최종 판정은 [AC 추적표](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/acceptance.md)를 확인합니다.

## 범위와 필요한 자료

이 프로젝트는 시뮬레이션 전용입니다. 실제 현장의 안전 승인이나 작업 안전을 보장하지 않습니다. 로컬 Node 서버 하나에 같은 네트워크의 관리자 웹과 Flutter Android 앱을 연결합니다. 센서 없는 두 모드와 네 폰 실측 시연을 각각 검증합니다.

- [원래 실행 입력](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt), [실행 메타데이터](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/run.json), [목표 변경 이력](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal-changes.md)
- [고정 범위·승인 경계](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/requirements/scope-freeze.v1.0.md), [요구사항 추적표](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/requirements/inventory.v1.0.md)
- [여섯 원문과 해시](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-manifest.json), [원문 연결표·18개 문서 명세](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/requirements/source-crosswalk.v1.0.md)
- [상세 시연 흐름](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/requirements/demo-flows.v1.0.md), [고정 QA 측정 방법](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/g0-protocol-v1.md)
- [18개 지식 문서 사용법](../knowledge/README.md), [식별자·행동·번역 검토 결과](../consistency-report.md), [실제 로컬 모델 준비](../data/knowledge/runtime/README.md)
- [기술 계약 원본](./contracts/v1.md), [기술 계약 1.0.1 추가 규칙](./contracts/v1.0.1-addendum.md), [영상 표식·보정 절차](../tools/calibration/README.md), [제조사 제원 근거](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/research/manufacturer/README.md), [타워 지지 치수의 불확실성](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/requirements/clarifications.v1.0.1.md)
- [계약 1.0.1의 19개 파일 동결 기록](./contracts/freeze-v1.0.1.json), [서버 실행·인증·API](../src/server/README.md), [Android 빌드·설치·기기 인계](../apps/mobile/README.md)
- [UWB 각도 의미 보완 1.0.2](./contracts/clarification-uwb-azimuth-v1.0.2.md), [각도 보완의 소스·시험 동결 기록](./contracts/freeze-v1.0.2.json)
- [재생 중지 요청 의미 보완 1.0.3](./contracts/clarification-playback-stop-v1.0.3.md), [1.0.3 동결 기록](./contracts/freeze-v1.0.3.json)
- [추적 데이터 접근 의미 보완 1.0.4](./contracts/clarification-tracking-access-v1.0.4.md), [1.0.4 동결 기록](./contracts/freeze-v1.0.4.json)
- [기존 영상 출처 규칙의 구현 수정 결합 r2](./contracts/implementation-binding-v1.0.4-r2.json): QD007 수정과 이전 C2·r1의 연결 기록. 계약·공통 schema·목표 기준은 유지하며 새 후보의 독립 재검증은 별도입니다.
- QD008의 기존 적용 조건 수정 결합 r3 예정 경로는 `docs/contracts/implementation-binding-v1.0.4-r3.json`입니다. 정확한 수정 소스와 Tech의 발행 기록이 생기기 전에는 `pending`으로 취급합니다. FG-002/EQ-002의 적용 조건을 권위 있는 비공개 이력과 현재 엔진 선택 정책으로 확인하는 수정이며, 공개 Flutter/wire 및 지식 corpus를 바꾸는 작업이 아닙니다. 구현 결합 발행과 독립 QA 결과는 별도로 확인합니다.

계약 동결은 최종 소스·웹 빌드·APK를 묶은 G3 후보 동결과 다릅니다. 이 문서의 예비 빌드·API·모델 호출 수치와 C1·C2·C3 기록은 각 실행 당시의 근거이며 C4의 실행 결과로 옮기지 않습니다. 준비 중인 C4의 선택·빌드·환경은 아래 문맥별 G3 인계와 상태 파일을 확인합니다. C4는 Root의 `g3-freeze-c4.json` 발행 전까지 `pending`이며, 준비 디렉터리만 있는 상태는 G3 제출이나 QA 인수가 아닙니다. 모바일도 번호를 추정하지 않고 같은 C4가 선택한 APK·소스·실제 기기 관측 범위를 확인합니다.

## 저장소와 패키지의 실행 문맥

먼저 **원본 저장소 루트**에서 실행할지, G3 인계가 지정한 **패키지 루트**에서 실행할지 하나를 정합니다. 아래 경로는 각각 선택한 루트 기준입니다. 두 문맥의 파일을 자동으로 번갈아 찾거나 다른 후보의 빠진 파일을 현재 저장소로 메우지 않습니다.

| 문맥 | C4 인계·상태 파일 | 후보 manifest·실행 문서 | APK 선택 기록 |
| --- | --- | --- | --- |
| 원본 저장소 | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/g3-candidate-c4-handoff.md`, 같은 폴더의 `candidate-c4-state.json` | 같은 폴더의 `candidate-manifest-c4.json`, `g3-launch-c4.md` | 같은 폴더의 `mobile-build-binding.json`; 제작자 기록은 그 파일의 `producerManifest` |
| 전달된 패키지 | `runtime-artifacts/g3-candidate-c4-handoff.md`, `runtime-artifacts/candidate-c4-state.json` | `runtime-artifacts/candidate-manifest-c4.json`, `runtime-artifacts/g3-launch-c4.md` | `runtime-artifacts/mobile-build-binding.json`; 제작자 기록은 그 파일의 `packagedProducerManifest` |

C4 인계·상태 파일은 후보 콘텐츠 해시 밖에서 Root의 G3 제출에 별도로 연결하는 기록입니다. Root 발행 기록은 저장소의 `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/g3-freeze-c4.json`, 패키지의 `runtime-artifacts/g3-freeze-c4.json`으로 별도 확인합니다. 위 경로는 준비 중인 C4의 예정 경로이며, 파일이 없거나 Root 발행 전이면 `pending`입니다. 인계가 명시한 후보 manifest·웹 빌드·선택 APK와 실제 경로를 대조합니다. 이 문서 안에 미래 후보 해시를 넣어 자기 참조를 만들지 않습니다. 인계·상태·Root 발행 기록이 아직 없거나 선택이 일치하지 않으면 해당 패키지를 최종 후보로 실행하지 않고 기술 인계를 기다립니다.

실행에 필요한 것은 후보의 `package.json`·잠금 파일·설정 예시, 앱/서버/공통 계약과 DB migration·seed, 지도·정책·시나리오·지식 및 검증 입력, `public` 자산·마커, 실제 모델 준비 스크립트와 선택된 모델/실행 파일, 선택 APK·소스 manifest·제작자 기록입니다. 패키지의 모델은 `runtime-artifacts/models.json`으로 확인하고, 지식 검증에 필요한 draft·revision·review 원문도 후보 manifest와 함께 확인합니다. Node/npm, 직접 앱을 빌드할 때의 Flutter/Android/JDK, adb, 비공개 환경 설정, 새 실행 DB와 실제 보정값은 운영 환경에서 준비합니다. 파일이 있다는 사실만으로 빌드·실행 성공을 주장하지 않습니다.

이 문서의 과거 실행·QA·제조사 조사 링크와 `.omo` 기록은 **원본 저장소의 실행 이력**이며 별도 제공되는 증거 자료입니다. 패키지에 모든 과거 기록이 포함된다고 가정하지 않습니다. 패키지 내부 링크 부재를 원본 저장소에서 열렸다는 이유로 해결됐다고 보고하지 않습니다. 반대로 APK 선택 기록·모델·DB 입력 등 현재 실행에 필요한 파일은 선택한 패키지 안에 실제로 있어야 하며 과거 이력으로 대신할 수 없습니다. C1·C2·C3 원문·산출물·실패 기록과 hash가 연결된 C3 인덱스·요구사항 지도는 보존합니다.

## 설치와 이 실행 호스트를 구분하기

새 설치에는 저장소 `package.json`이 지정한 Node.js `>=22 <23`, npm `10.9.8`, Flutter/Dart와 Android 빌드 도구, 기기 설치 수단이 필요합니다. 설치 기준 잠금 파일은 `package-lock.json`입니다. 초기 pnpm 설치 실패 후 담당자가 npm으로 전환했으므로 이전 pnpm 명령을 사용하지 않습니다. 현재 실행 호스트는 WSL2이며 Node `v22.23.2` 준비 결과가 [환경 기록](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/environment-g1.txt)에 있습니다. 이 호스트의 설치 경로나 SDK 상태를 다른 PC에 그대로 적용하지 않습니다.

서버 명령은 위에서 선택한 저장소 또는 패키지 루트에서 실행합니다. 새 환경에서는 [환경 예시](../.env.example)를 `.env`로 복사하고 `GS_DEMO_PIN`을 자신의 시연 접속 코드로 바꿉니다. 기존 `.env`가 있으면 덮어쓰지 않습니다. DB 기본 경로는 `data/runtime/safety.sqlite`입니다. 별도 재현 DB에는 새로운 절대 경로의 `DATABASE_PATH`를 지정합니다. 서버와 DB 스크립트는 루트 `.env`를 읽으며 실제 모델 설정도 같은 파일에 둡니다. 격리 실행은 동일한 `DATABASE_PATH`·비공개 `GS_DEMO_PIN`·모델 설정을 export하고 migrate·seed·start·HTTP 검증에서 유지합니다. 리스너 포트는 shell의 `PORT` 또는 `npm run start -- --port <port>`로 지정하며 `.env`만으로 포트가 적용된다고 가정하지 않습니다.

| 단계 | 저장소 명령 | 현재 기록 |
| --- | --- | --- |
| 잠금 파일 설치 | `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci` | 과거 캐시 설치 472패키지·exit 0/native 기록 보존. C4의 설치·환경·빌드 확인은 해당 G3 인계 참조 |
| 새 로컬 DB 마이그레이션 | `npm run db:migrate` | Technical Lead가 별도 `DATABASE_PATH`로 실행, exit 0 보고 |
| 시연 데이터 입력 | `npm run db:seed` | 같은 별도 DB에서 exit 0 보고; 최종 후보의 재현 검증은 별도 |
| 개발 서버 | `npm run dev` | 담당자가 `0.0.0.0:3000` 시작 보고; 새 프로세스의 HTTP/SSE 자체 점검 27개 관측 제출, 최종 후보·폰 흐름은 별도 |
| 배포용 로컬 빌드·실행 | `npm run build`, `npm start` | 예비 build 01과 이후 C1·C2·C3 결과는 과거 기록. C4 빌드·포트·DB·상태는 문맥별 G3 인계 참조 |
| 자체 확인 | `npm test`, `npm run typecheck`, `npm run lint` | 각 결과는 구현 자체 점검이며 QA 인수와 별개 |
| Flutter APK | `cd apps/mobile` 후 `flutter build apk --debug` | 현재 선택 APK·소스·빌드 연결은 기술 선택 기록, 실제 관측 상태는 Mobile manifest 확인. 이전 APK 보존; 네 폰 실기와 통합 인수는 별도 |
| 실제 임베딩·LLM | 아래의 로컬 모델 준비·검증 명령 | 제작자 실제 26개 검색 사례와 모델·서버 publication 확인 자료 제출; 최종 통합 QA와 구분 |

기존 사용자 DB를 지우는 방식으로 재현하지 않습니다. 새 DB 경로를 지정하고 현재 후보의 migration·seed를 적용합니다. 비밀값은 환경 설정에만 넣고 README, Git, 캡처, 모델 요청·로그·QA 증거에 복사하지 않습니다.

새 설치의 실행 순서는 다음과 같습니다. [보존된 설치/native 출력](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/npm-ci.log)과 [명령·현재 잠금 파일·환경 대조](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/bootstrap-reconciliation.json)를 함께 확인합니다. 출력 자체에는 명령·환경·시각이 내장돼 있지 않아 실행 담당자의 보고와 대조 기록을 따로 보존했습니다. 재시작 뒤 로그가 없다는 보고는 ignored 파일을 빠뜨린 검색 오류였으며 정정됐습니다. 캐시 설치와 native 모듈 확인을 캐시 없는 새 환경이나 최종 통합 후보의 빌드 성공으로 확대하지 않습니다.

```bash
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

서버 종료는 해당 터미널에서 Ctrl+C입니다. DB seed는 [인증 계약](../src/server/auth/README.md)의 로컬 시연 계정을 생성합니다. 관리자 웹은 admin/operator 권한, 작업자는 worker-a/b, 기기는 equipment/cctv에 연결됩니다. 폰의 역할 선택은 단말 기종을 제한하지 않으며, 서버는 선택한 역할에 해당하는 계정 권한을 검사합니다.

예비 생산용 검증은 별도 디렉터리·DB에서 `npm run build` 후 `npm run start -- --port 3100`으로 실행했습니다. [DB 준비 출력](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/production-db-preflight.log)과 [시작 출력](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/production-start-preflight.log)을 보존합니다. 담당자는 `DATABASE_PATH`, 로컬 `GS_DEMO_PIN`, 실제 임베딩 모델 경로와 실행 메모리 설정을 환경에 지정했습니다. 다른 설치에서는 자신의 경로와 접속 코드를 사용하며, 3100은 예비 점검 포트입니다. 최종 운영 포트와 후보 설정은 최종 기술 인계를 확인합니다.

## 관리자 로그인과 기본 조작

서버 주소 `/`를 열고 `역할`, `사용자 ID`, `접속 코드`를 입력한 뒤 `관제에 연결`을 누릅니다. 접속 코드는 현재 서버에 설정한 값입니다. 관리자 1은 안전관리자 역할과 `admin`, 관리자 2는 같은 역할과 `admin-2`를 사용합니다. 지원 수락 시연은 지원 담당자 역할과 `support`로 접속합니다. 각 계정에는 **쿠키가 격리된 브라우저 프로필 또는 브라우저 컨텍스트**를 사용합니다. 같은 프로필의 일반 창 여러 개는 로그인 쿠키를 공유하므로 서로 다른 관리자 세션으로 취급하지 않습니다. 운영자 `operator`는 실행·보정·일반 후속 조치를 담당할 수 있지만 위험 해제·통행 재개·사건 종료에는 관리자 권한이 필요합니다.

`중장비 접근 대응` 또는 `화재·가스 대응`을 선택합니다. 왼쪽 `실행 시나리오`, `주요 장비`, `실행 속도`를 설정하고 표시된 scenario ID·seed를 기록합니다. 화면에는 별도 seed 편집기가 없으며, 다른 seed가 필요한 재현은 [서버 API 예시](../src/server/README.md)의 `select` 명령을 사용합니다. 실행 버튼은 `시나리오 실행`, `일시정지`, `재개`, `초기화`, `5초 진행`입니다.

작업자 카드를 선택하면 `선택 작업자 프로필 · vN`에서 `선호 언어`를 한국어/English/미확인으로 바꿀 수 있습니다. 확인한 이동 조건을 입력하고 `프로필 확인 및 저장`을 누릅니다. 미확인은 제약 없음이 아니며 setup 화면 언어와 작업자 안내 언어를 혼동하지 않습니다. 실제 작업자 화면·TTS는 서버가 저장한 프로필 언어를 따릅니다.

이 조작 이름은 현재 Frontend Lead의 소스 인계에 따른 것입니다. 최종 생산용 후보의 UI 조작·스크린샷 검증과 인수는 별도로 남깁니다.

서버 담당자의 [새 프로세스 HTTP/SSE 관측](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/backend/sse/http-smoke-after-restart.json)은 인증·권한·연결 관련 27개 자체 확인을 기록합니다. 범위는 `software-http-only; no valid simulation mutations`이며 실제 폰이나 두 모드 전체 조작의 성공을 뜻하지 않습니다. 구현·수정 이력은 [Backend 인계](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/backend/G2-handoff.md)에 있습니다.

## 시나리오 위치와 장치 추적 위치 선택

모드마다 `위치 입력`을 따로 선택합니다. 새 실행·시나리오 선택·초기화 후 기본값은 `시나리오 위치 · 모의 입력`(`scenario`)입니다. 센서 없는 재현에서는 이 값을 유지합니다. 카메라가 연결돼도 모의 작업자 좌표를 자동으로 덮어쓰지 않습니다. raw 관측은 admin/operator/support/observer, 서버 JPEG는 admin/operator/observer 관제 계정에서 따로 확인합니다.

실기 시연은 먼저 사용할 시나리오를 선택하고 역할·카메라·보정을 준비한 뒤, 해당 모드에서 `장치 추적 위치 · 출처 확인`(`measured`)을 선택합니다. 누락·가림·단절·stale 또는 거리만 있는 관측은 위치 불명으로 처리하며 모의 좌표로 대체하지 않습니다. 다시 초기화하거나 시나리오를 바꿨으면 위치 입력 선택을 재확인합니다. 두 모드를 모두 실기로 시연하려면 각 모드에서 선택해야 합니다.

`measured`는 입력 경로 선택이지 실제 측정 인증이 아닙니다. 관측 기술(`camera-marker`, `uwb`)과 진위 출처(`live`, `synthetic`, `unknown`)를 함께 확인합니다. synthetic 영상 기준점을 사용해 계산한 UWB 위치는 실제 radio 거리라도 live 좌표가 아닙니다. UWB raw 거리의 `rangeInputSource`와 계산된 위치의 `inputSource`는 다를 수 있습니다. 원문 출처가 없는 관측은 `unknown`이며 live로 승격하지 않습니다.

172 EC-B 타워의 장비 원점은 장비 폰을 움직여도 고정됩니다. 이 고정 설계 좌표를 실측 장비 위치로 표시하지 않습니다. 작업자 위치는 measured 입력을 계속 사용할 수 있습니다. 선회·붐·트롤리·훅은 별도 장비 조작이며 폰 이동·표식 회전으로 임의 추정하지 않습니다.

## 초기화·재연결·서버 재시작

[기술 계약 1.0.1](./contracts/v1.0.1-addendum.md)은 최신 상태를 `streamId`와 모드별 `sequence`로 구분합니다. 시나리오 초기화는 새 `runId`를 발급하지만 같은 서버 실행의 `sequence`는 계속 증가합니다. 서버 자체가 재시작되면 `streamId`가 바뀝니다. 앱과 웹은 현재 SSE 연결에서 받은 기준 상태로 복구하고, 늦게 도착한 이전 실행의 HTTP 응답이나 중복·역순 상태로 되돌아가면 안 됩니다. 이전 음성을 전부 재생하지 말고 현재 유효 안내를 표시해야 합니다.

첫 SSE 기준 상태를 받기 전의 HTTP 응답은 현재 상태를 확정하지 않습니다. 재연결 후 같은 stream이면 이전보다 큰 sequence만 받아들이고, 새로운 server stream은 현재 연결의 첫 유효 snapshot으로 복구합니다. 재현 기록에는 모드·runId·streamId·sequence와 안내 버전을 함께 남깁니다. 표시용 상태 순서와 DB 수정용 `run.version`은 서로 다른 값입니다. wire snapshot의 `contractVersion`은 호환 추가이므로 1.0.0, 장비 catalog와 tracking schema는 1.0.1입니다. 최종 클라이언트와 서버의 실제 회복 동작은 같은 후보로 검증해야 합니다.

서버 재시작은 실행 중이던 시뮬레이션을 paused로 복구합니다. 임의로 자동 재개됐다고 가정하지 말고 현재 모드·위치 입력·유효 안내를 확인합니다. 카메라 보정과 pairing은 메모리 상태이므로 재시작 뒤 실측 보정 JSON을 다시 적용하고 세 UWB 역할을 재준비해야 합니다. DB에 이전 관측 이력이 있다는 사실은 현재 보정이나 위치를 복구했다는 뜻이 아닙니다.

## 시간의 의미

| 시간 | 사용하는 곳 | 시연 시 확인 |
| --- | --- | --- |
| 시나리오 가상 시간 | mock 이벤트와 mock `observedAtMs`의 freshness | 일시정지·속도·5초 진행에 따라 변함. 화면용 환산 시각도 synthetic이며 실제 캡처가 아님 |
| 실측 캡처·수신 시간 | 폰 카메라/UWB 관측, 업로드·렌더 지연 | raw 기기 UTC, 보정값·불확실성, 서버 수신 시각을 따로 보존 |
| 문서·안내 UTC | 실제 문서 검토·유효기간, 안내 생성·만료 | 가상 시간이 09:00이어도 실제 검토 시각을 과거로 바꾸지 않음. QA 문서 시험 clock 매핑은 별도 기록 |

## 실제 로컬 모델 준비

다음 명령은 Linux x86_64 CPU 공급자용입니다. 일반 서버의 Node 프로세스 안에서 다국어 임베딩을 실행하고, 별도 localhost `llama-server`는 모델 추론만 담당합니다. 앱·웹·DB를 맡는 서버는 계속 단일 Node 애플리케이션입니다. 준비 스크립트는 고정 revision과 SHA-256으로 공개 모델 파일을 확인하며, 모델·실행 파일은 Git에서 제외됩니다.

```bash
bash data/knowledge/runtime/prepare-embedding.sh
bash data/knowledge/runtime/prepare-llm.sh
bash data/knowledge/runtime/start-llm.sh
```

세 스크립트의 실행과 실제 로컬 LLM 호출은 RAG 담당자가 확인했습니다. 마지막 명령은 별도 터미널의 전경 프로세스로 유지합니다. 준비 확인 주소는 `http://127.0.0.1:8092/health`, API는 `http://127.0.0.1:8092/v1/chat/completions`입니다. 종료는 해당 터미널에서 Ctrl+C, 재시작은 같은 `start-llm.sh` 명령입니다. 모델 서버는 `127.0.0.1`에만 바인딩하며 폰에 직접 노출하지 않습니다.

현재 모델은 `Xenova/multilingual-e5-small` 384차원 ONNX와 `Qwen3-0.6B-Q8_0`입니다. 모델 파일은 약 118MB + 639MB, CPU 실행 파일은 약 17MB입니다. 실제 revision/hash와 제약은 [모델 실행 문서](../data/knowledge/runtime/README.md)를 따릅니다. `.env.example`의 모델명·revision·차원·로컬 경로를 함께 유지합니다. 공급자를 바꾸면 이 필드를 함께 바꾸고 검증을 다시 합니다.

실제 임베딩 어댑터 점검 명령은 다음과 같습니다. 의존성 최종 변경 뒤 재실행 결과를 확인해야 합니다.

```bash
node --experimental-strip-types data/knowledge/runtime/probe-embedding.mjs
```

현재 소형 LLM은 검색된 검토 완료 설명 중 하나를 선택하는 방식입니다. 모델이 자유 생성한 설명으로 표시하지 않습니다. 공급자 자체의 실제 호출 기록과 통합 앱의 FTS5·벡터·인용·행동 검증 결과는 구분합니다. 공급자 증거는 [런타임 아티팩트](../.omo/teams/team-08d29e60/artifacts/rag-model-runtime-embedding.json)와 같은 접두사의 기록에 있습니다. 모델이 느리거나 중단되더라도 기본 긴급 안내는 계속됩니다.

담당자는 다음 명령을 실제 실행해 18개 문서 색인, 실제 E5+FTS5 검색 26개 사례, 한국어/영어 보조 설명의 실제 모델 호출을 확인했습니다.

```bash
node --import tsx src/server/rag/verify-model.ts
```

[10:34 실행 기록](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/rag/RAG-ACTUAL-2026-09-21T10-34-09-385Z/run.json)과 [제작자 결과](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/rag/RAG-ACTUAL-2026-09-21T10-34-09-385Z/report.json)는 26/26 사례와 실제 양언어 설명 수용을 기록합니다. 문서 시험 clock은 별도 고정 매핑, 실제 생성은 실행 당시 UTC를 사용했습니다. 이전 09:24 `--models-only` 실행은 사례 수 0인 별도 과거 기록으로 남습니다. 제작자 component 결과를 최종 통합 후보나 독립 AC-06~08 판정으로 대신하지 않습니다.

실제 기본 안내가 먼저 나오고 RAG supplement가 나중에 연결되는 서버 경로도 제작자가 실행했습니다.

```bash
node --import tsx src/server/rag/verify-server.ts
```

이 명령의 [독립 DB·두 모드 runtime 결과](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/rag/server-publication-NklFUG/README.md)는 HTTP를 거치지 않은 실제 runtime/SnapshotBus 증거입니다. 별도의 [HTTP/SSE 결과](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/rag/server-publication-GCeveF/README.md)는 실행 중 서버를 검증한 기록입니다. 재현할 때는 서버와 같은 비공개 환경 설정을 명시적으로 읽습니다.

```bash
node --env-file-if-exists=.env --import tsx src/server/rag/verify-server.ts --http=http://127.0.0.1:3000 --mode=fire-gas
```

이 예시는 루트 `.env`의 `DATABASE_PATH`와 비공개 `GS_DEMO_PIN`을 읽습니다. 격리 서버를 shell 환경 변수로 시작했다면 그 서버에 사용한 두 값을 동일하게 export한 터미널에서 검증하며, export한 값은 `.env`보다 우선합니다. 대상 서버 주소·포트도 일치시킵니다. verifier 자체는 `.env`를 자동으로 읽지 않으므로 해당 옵션이나 같은 exported 환경 없이 실행하지 않습니다. 접속 코드 값은 명령 예시·로그·증거에 출력하지 않습니다.

HTTP 명령은 fire-gas 시나리오를 실제 변경하고 paused 상태로 남깁니다. 일반 초기 설치 명령이 아니며, 진행 중 시연에서 무심코 실행하지 않습니다. 별도 DB를 쓰는 서버라면 같은 경로를 지정해야 합니다. 각 결과의 후보 hash·전송 방식·시험 범위를 확인하고 최종 후보의 재사용 가능 여부는 QA가 판단합니다.

[모델 입력 경계](../knowledge/RAG-CONTRACT.md)에 따라 LLM에는 행동 코드, 언어, 검토된 설명 후보와 문서/버전/chunk 근거만 전달합니다. 이름·나이·성별·진단·생년월일·원본 개인 프로필은 전달하지 않습니다. 로컬 모델 실행 기록에도 비밀키를 저장하지 않습니다.

## Flutter 빌드와 설치 준비

Mobile Lead가 준비한 도구는 Flutter `3.47.5`, Dart `3.13.4`, JDK 17이며 현재 [모바일 인계](../apps/mobile/README.md)가 Gradle 8.14.3·AGP 8.12.1·Kotlin 2.2.20을 고정합니다. 이전 환경 기록의 AGP 값과 초기 실패는 보존돼 있습니다. 이 호스트에서만 `source /home/b/.local/share/gs-safety-sdk/env.sh`로 Android/JDK/Flutter 경로를 준비합니다. 다른 PC는 자신의 Flutter·Android SDK/JDK 경로를 사용합니다.

```bash
cd apps/mobile
flutter pub get
flutter analyze
flutter test --concurrency=2
flutter build apk --debug
```

빌드의 표준 출력 경로는 `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`입니다. 최종 제출 hash와 일치하는 산출물을 확인한 뒤 `apps/mobile`에서 아래 명령으로 각각의 승인된 기기에 설치하고 **GS Safety Demo**를 엽니다. `<authorized-device>`는 로컬 adb에서 선택하며 실제 serial은 증거에 남기지 않습니다.

```bash
adb -s <authorized-device> install -r build/app/outputs/flutter-apk/app-debug.apk
```

[예비 APK의 두 기기 시작 관측](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/preliminary-device/README.md), [초기 Mobile G2 인계](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/g2-candidate.md), [후보 2 기록](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/candidate-2.md), [후보 3 기록](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/candidate-3.md)은 각각의 APK에 대한 보존 기록입니다. 이름에 후보 번호가 없는 `build/mobile-candidate/gs-safety-1.0.0-debug.apk`는 초기 `8f617f…` 산출물이며 최신 APK가 아닙니다. `build/mobile-candidate/gs-safety-1.0.0-candidate-3-debug.apk`도 후보 3의 과거 결과를 재현할 때만 선택합니다.

인계받은 APK는 문맥별 선택 기록의 `selectedApk`(같은 값의 `artifact`)·`apkSha256`와 소스 manifest·`sourceManifestSha256`로 확인합니다. 소스 manifest 경로는 패키지의 `sourceManifest`, 저장소의 `repositorySourceManifest`를 사용하며 두 문맥의 기대 소스 해시는 같습니다. 제작자 manifest의 APK·소스 해시 및 C4 G3 인계의 선택과 일치해야 합니다. 파일명이나 이전 후보 번호로 선택하지 않습니다. **아래 두 설정 중 현재 문맥에 맞는 하나만** 선택한 루트에서 실행합니다.

전달된 패키지의 설정:

```bash
GS_DEMO_MOBILE_BINDING=runtime-artifacts/mobile-build-binding.json
GS_DEMO_PRODUCER_FIELD=packagedProducerManifest
GS_DEMO_SOURCE_FIELD=sourceManifest
```

원본 저장소의 설정:

```bash
GS_DEMO_MOBILE_BINDING=docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/mobile-build-binding.json
GS_DEMO_PRODUCER_FIELD=producerManifest
GS_DEMO_SOURCE_FIELD=repositorySourceManifest
```

선택 기록을 읽어 APK·소스 manifest·제작자 기록의 경로를 확인합니다. 경로가 없으면 다른 문맥으로 자동 전환하지 않습니다.

```bash
GS_DEMO_APK_PATH="$(node -p "require('./' + process.argv[1]).selectedApk" "$GS_DEMO_MOBILE_BINDING")"
GS_DEMO_SOURCE_MANIFEST="$(node -p "require('./' + process.argv[1])[process.argv[2]]" "$GS_DEMO_MOBILE_BINDING" "$GS_DEMO_SOURCE_FIELD")"
GS_DEMO_PRODUCER_MANIFEST="$(node -p "require('./' + process.argv[1])[process.argv[2]]" "$GS_DEMO_MOBILE_BINDING" "$GS_DEMO_PRODUCER_FIELD")"
sha256sum "$GS_DEMO_APK_PATH" "$GS_DEMO_SOURCE_MANIFEST"
```

출력 두 해시를 선택 기록의 `apkSha256`·`sourceManifestSha256`와 대조하고, `GS_DEMO_PRODUCER_MANIFEST`가 가리키는 JSON의 APK·소스 해시도 일치하는지 확인합니다. C4 인계가 같은 선택을 지시하고 모든 확인이 끝난 뒤에만 설치합니다.

```bash
adb -s <authorized-device> install -r "$GS_DEMO_APK_PATH"
```

직접 재빌드할 때는 앞의 표준 Flutter 출력 경로와 새 빌드 해시를 사용합니다. 선택 APK의 실제 기기 시험이 `PENDING`이면 그대로 미실행으로 남깁니다. [실제 기기 관측](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/final-device/README.md)의 각 결과도 해당 APK 해시와 연결해 읽습니다. `final-device`라는 디렉터리 이름, 두 폰 설치 또는 모바일 자체 점검을 최신 통합 후보·전체 시각 QA·네 폰 인수로 대신하지 않습니다.

## LAN 연결

웹과 폰은 서버 PC와 같은 네트워크에 연결합니다. 앱에 넣는 주소는 폰 자신을 가리키는 `localhost`가 아니라 서버 PC의 LAN 주소입니다. 이번 호스트에서 발견된 LAN 주소는 `10.15.82.5`, 별도 overlay 주소는 `100.95.210.25`입니다. 이 값은 발견 기록이며 폰에서 연결에 성공했다는 증거가 아닙니다. WSL2 mirrored networking 설정은 확인됐지만 실제 웹·폰 접속은 별도 시험합니다.

현재 서버 계약의 기본 포트는 3000입니다. 서버가 실제로 시작된 뒤 같은 LAN의 브라우저와 각 폰에서 `http://<서버-LAN-IP>:3000`을 확인하고, 접속 시각과 서버 측 연결 로그를 함께 기록합니다. 환경의 IP가 달라지면 새 주소를 사용합니다. 방화벽·계정 권한을 먼저 넓히지 말고 실제 연결 오류를 확인합니다. 필요한 권한 변경은 기존 승인 범위를 확인한 뒤 처리합니다.

[두 폰의 연결 기록](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/final-device/README.md)에서 LAN `10.15.82.5:3000`은 두 폰 모두 `No route to host`로 실패했습니다. 실제 앱 로그인은 각 승인된 USB 연결에서 `adb -s <authorized-device> reverse tcp:3000 tcp:3000`을 설정하고 앱 주소를 `http://127.0.0.1:3000`으로 둔 임시 경로에서 관측됐습니다. 이 주소는 reverse가 설정된 USB 시험에만 사용하며 LAN 성공으로 기록하지 않습니다. 종료 시 해당 기기의 전달 규칙은 `adb -s <authorized-device> reverse --remove tcp:3000`으로 정리합니다.

[사용자의 Wi-Fi 재시도 지시](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.steering.wifi-20260921.input.txt)에 따라 USB·가상 검증과 병행해 간격을 두고 Wi-Fi를 다시 확인합니다. 매 시도에서 전송 경로·시각·결과를 구분합니다. 이 지시는 필수 LAN·네 폰 AC를 면제하거나 방화벽·계정 권한을 넓히는 승인이 아니며 원래 목표 v1.0은 유지합니다.

## 네 폰의 역할과 준비

준비 대상은 원문 008의 **S24+ 두 대, 사용자 표현 “Galaxy Z Fold8 와이드”, Note20 Ultra**입니다. 각 단말의 설정에서 실제 모델·OS/API·앱 빌드를 확인합니다. 원문의 제조사 지원 표시는 현재 단말의 동작 성공 증거가 아닙니다. 모델명으로 역할을 고정하지 않습니다.

이번 실행에서 확인된 기기는 두 대입니다: `PHONE-1 = SM-N986N / Android 13 (API 33)`, `PHONE-2 = SM-S926N / Android 16 (API 36)`. [현재 환경 기록](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/mobile/environment-current.md) 이후 제출 APK의 USB 경로 로그인에서 WORKER-A 한국어·WORKER-B 영어 화면, 만료 안내 거부와 응답 비활성화, 전경 복귀가 관측됐습니다. 이는 유효 안내의 음성·진동, LAN 성공, 카메라/UWB 또는 네 역할 동시 성공을 뜻하지 않습니다. 최신 실행 범위는 각 APK 해시가 적힌 기기 기록을 따릅니다. 두 기기의 UWB/camera feature 선언도 ranging 성공이 아닙니다. 나머지 두 폰과 전체 네 역할 동시 시연은 미검증입니다.

이번 실행에서 사용자가 승인한 기기 기능은 PHONE-1의 UWB·CAMERA, PHONE-2의 UWB입니다. PHONE-2의 OS에 CAMERA 권한이 표시되더라도 카메라 사용 승인으로 취급하지 않습니다. 실제 카메라 픽셀은 로컬 시연 시스템 안에만 두고 모델·이미지 분석 도구나 외부 서비스에 보내지 않습니다. 카메라 증거는 프레임 식별자·크기·수신률·지연·권한 상태·UI 의미를 사용하며, 일반적인 네 폰 역할 설명이 이 실행의 승인 범위를 넓히지 않습니다.

| 역할 | 실제 동작 | 연결 대상 |
| --- | --- | --- |
| EQUIPMENT | UWB Controller, 장비 위치 입력 | 두 작업자와 동시 실제 거리 측정 |
| WORKER_1 | UWB Controlee, 안내 화면·음성·진동 | WORKER-A |
| WORKER_2 | UWB Controlee, 안내 화면·음성·진동 | WORKER-B |
| CCTV | 후면 카메라 JPEG 5–10fps 전송, 식별 표식 관측 | 관리자 영상·서버 영상 추적 |

같은 앱에서 역할을 하나씩 선택합니다. CCTV는 실제 준비 상태를 확인한 뒤 상대적으로 성능이 낮은 폰을 우선 사용합니다. 세 UWB 앱은 화면을 켜고 전경으로 유지합니다. UWB 지원·활성화·권한·해당 세션 개설을 확인하고, 미지원/실패 이유와 다른 역할 선택을 확인합니다. Controller에 두 Controlee가 **동시에 실제 거리값을 보내는 기록**이 필요합니다. WORKER-C는 선택적인 가상 작업자이며 세 번째 실측 작업자로 표시하지 않습니다.

현재 앱 연결 화면에서 서버 주소, `equipment`/`fire-gas` 모드, 네 역할 중 하나, 서버의 시연 접속 코드를 입력합니다. 주소의 기본 예시는 이 호스트의 LAN 값이므로 새 환경에서는 바꿉니다. 연결 후 `준비·다시 시도 / Start`, `측정 중지 / Stop`, `기능 확인 / Refresh`와 기기 권한 목록을 사용합니다. CCTV의 목표는 8fps로 표시되지만 실제 수신률·지연은 관제의 측정값으로 확인합니다. 기기 선택 UI와 목표 프레임 표시는 실제 측정 성공 증거가 아닙니다.

세 UWB 폰을 각각 EQUIPMENT, WORKER_1, WORKER_2로 연결하고 필요한 권한을 허용합니다. 앱은 준비된 참가자와 아직 필요한 역할을 표시합니다. 세 역할의 준비가 끝난 뒤 Controller에서 WORKER-A와 WORKER-B의 새 거리 관측이 모두 반복 수신되는지 확인합니다. CCTV 폰은 별도 역할로 연결해 **자체 후면 미리보기와 업로드 상태**를 확인합니다. 서버에서 받은 JPEG와 표식 관측은 권한 있는 관제 계정에서 확인합니다. CCTV 기기 세션으로 tracking GET이나 서버 JPEG를 읽지 않습니다. 권한 거부 상태라면 Android 설정에서 승인된 권한을 허용한 뒤 `Refresh`로 상태를 다시 읽고 `Start`로 준비를 재시도합니다. `Refresh`만으로 측정 재개가 완료됐다고 가정하지 않습니다. 이 순서는 구현 담당자의 인계이며 실제 네 폰 관측은 별도입니다.

앱의 서버 연결과 UWB 참가자 등록은 별개입니다. 한 폰의 역할을 교체하면 공유 pairing이 무효화될 수 있으므로, 남은 UWB 폰도 `Stop`→`Start` 또는 역할 재선택·재연결로 준비를 다시 수행합니다. Controller에 필요한 역할이 모두 다시 등록됐는지 확인한 뒤 실제 거리 수신을 확인합니다. 다른 작업자 앱이 계속 connected로 보여도 UWB 역할 등록이 유지됐다고 가정하지 않습니다.

다른 시뮬레이션으로 옮길 때는 작업자 화면의 `상세 정보 / Details`를 열어 `역할 변경 / Change role`을 누릅니다. 기기 준비 화면에서는 아래쪽 `역할 다시 선택 / Reselect role`을 누릅니다. 정리·로그아웃 후 연결 화면의 `시뮬레이션 / Simulation`에서 `중장비 / Equipment` 또는 `화재·가스 / Fire & gas`를 선택하고 역할·접속 코드로 다시 연결합니다. Android 뒤로 버튼만으로 모드 전환을 대신하지 않습니다. 앱은 관제의 모드 선택을 자동으로 따라가지 않으므로 참여하는 네 앱의 모드를 관제와 맞춥니다.

역할 변경 뒤 연결 폼은 기본 LAN 주소·WORKER_1로 돌아가고 접속 코드를 비웁니다. 서버 주소·역할·코드를 다시 확인합니다. USB reverse 시험을 계속할 때도 `http://127.0.0.1:3000`을 다시 입력해야 합니다.

경고음/TTS 시연 전에 각 폰의 미디어 음량과 음성 데이터를 확인합니다. 예비 관측에서 PHONE-2의 미디어 음량은 0이었으므로 초기화 로그만으로 음성이 들렸다고 기록하지 않습니다. 한 역할에 새로 로그인하면 이전 역할 사용자의 세션이 교체되므로 네 폰에 서로 다른 역할을 선택합니다.

## 책상과 좌표 보정

140cm × 50cm 책상의 왼쪽 아래를 `(0,0)`으로 정합니다. 긴 변이 +X, 짧은 변이 +Y입니다. 서버의 `/markers/sheet.html`을 100% 크기, 용지 맞춤 해제로 인쇄하고 검은 사각형이 실제 40mm인지 자로 확인합니다. 사전은 `ARUCO_MIP_36h12`이며 흰 여백을 유지합니다. [인쇄 원본](../public/markers/sheet.html)과 [보정 문서](../tools/calibration/README.md)를 함께 사용합니다.

모서리 **표식 중심** ID 0/1/2/3을 각각 `(0,0)`, `(140,0)`, `(140,50)`, `(0,50)`cm에 둡니다. 표식 종이는 책상 밖으로 나가도 중심 좌표는 유지합니다. 움직이는 표식 ID 10은 장비, 11은 WORKER-A, 12는 WORKER-B입니다. 카메라가 일곱 표식을 모두 볼 수 있게 고정하고, 표식은 책상과 평행하게 둡니다.

책상 cm 수치는 지도 m 수치와 같습니다. 책상 m 수치에는 100을 곱합니다. 장비는 1 unit=1m로 유지합니다. 폰 크기에 맞추기 위해 모델을 키우거나 줄이지 않습니다. 기본 장비 선회 중심은 `(30,25)m`, 작업자 시작점은 `(65,25)m`, `(90,40)m`입니다.

카메라의 네 모서리로 책상 평면을 보정하고 UWB 안테나, 시각 표식 중심, 3D 선회 중심의 오프셋과 표식 높이를 기록합니다. 보정에 쓴 모서리와 별도로 QA 지정 9개 점에서 오차를 측정합니다. 영상 좌표와 UWB 거리에는 각각 출처·관측 시각·오차·가림/단절 상태가 붙어야 합니다. 각도가 null이거나 거리만 있으면 2D 좌표를 만들어내지 않습니다. 장비 폰의 이동은 외부 책상 좌표로 반영하고 선회·붐·트롤리는 웹/시나리오 입력으로 따로 조작합니다.

[보정 JSON 예시](../tools/calibration/example-calibration.json)의 0은 합성 평면 예시입니다. 실제 폰의 측정값으로 취급하지 않습니다. `heightM`, `antennaHeightM`, 카메라 광학 중심의 `heightM`/`positionTableM`, 표식 로컬 축의 `markerToReferenceM`/`markerToAntennaM`를 m 단위로 실측합니다. `uwbYawRad`는 rad 단위이며 장비 표식 현재 방향에 더해집니다. `evaluationErrorM`는 독립 측정 전에는 null입니다.

UWB Controller는 세로 화면 방향으로 똑바로 세워 방위각 평면을 수평으로 맞춥니다. Android의 0 방향은 폰 뒷면에서 바깥으로 향하며, 양의 방위각은 위에서 볼 때 시계 방향입니다. 장비 표식은 별도 고정 지지대에서 계속 책상과 평행하게 두고, 표식 방향에서 센서 0 방향까지의 반시계 회전을 yaw로 실측합니다. 알려진 좌우 지점에서 센서 축·부호·0 방향을 실제로 확인하기 전에는 `uwbYawRad`를 null로 둡니다. 폰을 눕히거나 임의로 기울인 자세는 이 yaw 전용 보정으로 처리하지 않습니다. [보정 가이드](../tools/calibration/README.md), [각도 근거·소프트웨어 수정 기록](../.omo/teams/team-08d29e60/artifacts/tracking-angular-source.md), [의미 보완 1.0.2](./contracts/clarification-uwb-azimuth-v1.0.2.md)를 따릅니다. 원래 1.0.1 동결 파일과 wire 필드는 보존되며, 수정된 투영을 포함한 최종 후보·물리 검증은 별도입니다.

관제의 `장치·영상` → `실측 보정`에서 실측한 값을 입력하고 `실측 보정 저장`을 누릅니다. `마커 시트 인쇄`도 이 영역에서 사용할 수 있습니다. 현재 UI는 수치 입력형이며 JSON 파일 업로드·내보내기 화면은 없습니다. **입력한 실측값과 cameraId·보정 version을 별도 수치 기록 또는 완성한 JSON으로 저장**합니다. 서버 재시작 시 이 기록으로 다시 입력해야 합니다. 저장 뒤 표시되는 `보정 기록` 버전이 제출한 값과 일치하는지 확인합니다. API로 수행할 때는 [서버 로그인 예시](../src/server/README.md)로 인증한 admin/operator가 실측 JSON을 `POST /api/tracking/calibration`에 전달합니다. 보정이 바뀌면 다음 유효 관측까지 이전 좌표는 무효입니다. 적용된 calibration과 관측은 admin/operator/support/observer의 `GET /api/tracking`에서 확인합니다. worker/device 계정은 이 읽기 API에 403을 받습니다.

UWB 설정은 앱이 `POST /api/uwb/prepare`, `GET /api/uwb/config`를 통해 준비하며, 세 UWB 역할이 모두 필요합니다. 정리 요청은 현재 네이티브 generation을 포함한 `DELETE /api/uwb/prepare?generation=N`입니다. 이전 세션의 지연된 정리 요청으로 새 역할 준비를 지우지 않도록 앱이 generation을 관리합니다. 사용자가 role-only DELETE를 임의 호출하지 않습니다. 세션 키는 일반 snapshot·로그·증거에 넣지 않습니다. 이 인터페이스의 존재는 실제 동시 ranging 성공을 뜻하지 않습니다.

카메라는 `POST /api/tracking/frame`에 JSON JPEG를 보냅니다. [계약 1.0.4](./contracts/clarification-tracking-access-v1.0.4.md)의 접근 규칙은 다음과 같습니다. 서버에 저장된 인증 역할을 사용하며 화면에서 고른 역할로 권한을 늘리지 않습니다.

| 요청 | 허용 역할과 결과 |
| --- | --- |
| `GET /api/tracking` | admin/operator/support/observer: 전체 추적 snapshot; worker/device: 403 |
| `GET /api/tracking/frame` | admin/operator/observer: 식별자가 결합된 JPEG; support/worker/device: 403 |
| CCTV 기기의 `POST /api/tracking/frame`, 장비 기기의 `POST /api/tracking/uwb` | 해당 bound device만 업로드; 성공 응답은 204, JSON 본문 없음 |
| 승인된 admin/operator의 synthetic 업로드 | 기존 200 추적 snapshot 응답 유지; live로 표기하지 않음 |

미인증 요청은 401입니다. 기기의 204는 기존 처리 규칙 아래 요청이 끝났다는 뜻이며 새 관측의 순서·freshness·보정·위치 유효성, 안내 수신·이해·도착을 증명하지 않습니다. 작업자/기기 앱은 자신의 scoped simulation/SSE, 자체 미리보기·업로드·clock·UWB pairing을 사용합니다. 관제 계정의 역할 전환 뒤에도 이전 tracking/JPEG 캐시를 노출하면 안 됩니다.

프레임은 카메라별 순서, UWB는 작업자별 순서와 세션을 검사합니다. 새 카메라 uploader는 새 stream UUID와 새 순서를 사용합니다. 같은 카메라의 재보정은 현재 좌표·진행 중 처리를 무효화하지만 기존 프레임 순서와 폐기 stream 기록을 유지합니다. 다른 카메라·추적 서비스 초기화·서버 재시작은 새 서비스 수명으로 구분합니다. 보정·세션이 바뀐 뒤 이전 프레임의 늦은 처리 결과를 적용하면 안 됩니다. 1000ms 이상 새 관측이 없으면 좌표는 stale/사용 불가로 구분합니다.

지연 측정 전에 앱은 `/api/clock`으로 시계를 동기화합니다. 보정된 캡처 시각에도 왕복 시간에 따른 불확실성이 있으므로 정확한 단방향 지연이라고 해석하지 않습니다. 불확실성이 50ms를 넘으면 고정 QA 방법의 물리 타이머 촬영을 사용하거나 지연 판정을 미확정으로 남깁니다.

## 여섯 장비의 동작 확인

catalog 1.0.1과 기술 추가 계약은 다음 동작을 요구합니다. Design Lead는 rig 연결과 catalog 반영을 제출했으며, 최종 앱의 실제 GLB loader·동작·분석 형상·경로/안내 연결 검증은 진행 중입니다. 표의 동작 지원 선언을 QA 통과로 읽지 않습니다.

| 선택 기종 | 확인할 동작 | 유지할 구성 |
| --- | --- | --- |
| 구형 SK1265-AT6 | 차체 이동, 선회, 트롤리, 훅 | 60m 수평 지브; 책상 선회 ±15°는 데모 규칙 |
| Tadano GR-250N-4 | 차체 이동, 선회, 붐 각도·길이, 훅 | 선택된 한국어 IV 제원판 |
| Liebherr LTM 1050-3.1 | 차체 이동, 선회, 붐 각도·길이, 훅 | 선택 타이어·차체·지지 구성 |
| Maeda MC305C-5 | 차체 이동, 선회, 붐 각도·길이, 훅 | Metric CE 구성 |
| Liebherr LR 1100.1 | 차체 이동, 선회, 붐 각도, 훅 | 32m 조립 붐 고정 길이, 고정 지브 없음 |
| Liebherr 172 EC-B 8 | 선회, 트롤리, 훅 | 원점 고정, 16 HC 175/UC-0460m, 50m 지브, 42.3m 훅 구성 |

선택 가능한 동작 범위는 catalog의 **데모 제한**입니다. 제조사의 전체 기계 한계나 실제 작업 허가로 표시하지 않습니다. 시각 rig와 위험 엔진의 검증 형상은 별도이며, 모델·자세를 바꿀 때 현재 위험·경로·안내가 함께 재계산되는지 확인해야 합니다. 타워의 4.6m는 근거가 확인된 명목 지지 폭이며 정확한 외곽 폴리곤은 미확인 상태를 유지합니다.

LR 1100.1의 수정된 기준은 [제조사 치수 근거](./goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/research/manufacturer/liebherr/lr1100/report.md)에 따른 **선회축에서 붐 방향으로 1.2m인 수평 피벗 오프셋**입니다. 피벗 높이로 해석하지 않습니다. 32m 메인 붐·고정 지브 없음과 여섯 기종의 필수 구성은 그대로입니다. 이 수정은 C2에서 catalog·GLB·제작 원본·분석 형상에 함께 반영됐으며, C4의 선택도 해당 인계에서 대조합니다. 이전 피벗으로 실행한 동작·경로 근거를 수정 후 검증으로 옮기지 않습니다.

## 시연 순서

1. 새 실행의 ID, 지도/프로필 버전, scenario/seed, 각 모드의 `위치 입력`, 각 관측의 진위 출처를 기록합니다. 먼저 `scenario`로 두 모드를 센서 없이 실행합니다. 실제 폰 시연은 시나리오 선택·보정·역할 준비 후 해당 모드를 `measured`로 바꿔 반복합니다.
2. 중장비 모드에서 접근·속도 증가·방향 변경, 서로 다른 이동 제약, 경로 없음, 위치 단절, 도움 요청·지원 수락, 이해·도착 확인을 시연합니다.
3. 초기화 후 화재·가스 모드에서 화재·DEMO-GAS-X·복합 위험, 통로 차단, 명시 정책의 실내 대기, stale/단절, 위험 해제와 별도 통행 재개를 시연합니다.
4. 관리자에서 실제 최초 안내의 원문과 한국어 설명, 현재 안내 버전, 작업자 반응, 지원 배정, 후속 조치와 수행자/시각 이력을 확인합니다. 소리 정지 중에도 화면 경보가 유지되는지 확인합니다.
5. 여섯 장비를 모두 교체합니다: 구형 SK1265-AT6 60m, GR-250N-4, LTM 1050-3.1, MC305C-5, LR 1100.1 32m/고정 지브 없음, 172 EC-B 8 16 HC 175/UC-0460m·50m 지브·42.3m 훅 높이. 각 교체에서 이전 위험·경로·안내가 무효화되는지 확인합니다.
6. SK1265 책상 시연의 ±15° 선회와 전체 보기를 구분합니다. 전체 보기에서도 원래 크기를 유지하고 책상 밖에는 폰 실측이 없음을 표시합니다.
7. 실제 검색/모델 호출을 확인한 뒤 별도 장애 주입으로 RAG 지연·실패·오염·오래된 결과를 검사합니다. 기본 경보는 RAG를 기다리지 않습니다.
8. SSE 재연결, 앱 복귀, 가림·단절·stale·null 각도를 보여줍니다. CCTV 프레임률·전체 지연과 위치 오차를 별도로 기록합니다.

## 회복과 종료 절차

앱 전경 복귀는 구현상 권한 확인, 현재 소유 SSE 연결, clock 재동기화와 기기 준비를 수행합니다. idle/running 실행에서 준비를 재개하며 paused/completed 실행은 추적을 멈춘 상태로 유지합니다. 실제 복귀 뒤에는 새 유효 snapshot·안내, 시계 동기화, 카메라/UWB 준비 상태를 먼저 확인합니다. 장비 셋이 실제 거리를 보내기 전의 `waiting`/준비 완료 상태를 동시 ranging으로 기록하지 않습니다. 측정값이 돌아오지 않으면 지원·권한·연결 오류를 확인하고 `Start`로 준비를 재시도합니다. measured 모드에서 모의 위치로 바꾸어 실기 성공처럼 진행하지 않습니다. 역할 교체는 이전 기기의 중지·generation 정리·로그아웃을 마친 뒤 새 역할로 연결하는 절차입니다.

서버를 재시작했다면 다음 순서로 복구합니다.

1. 서버와 로컬 모델의 준비 상태를 확인하고 웹·폰 역할로 다시 인증합니다. 현재 SSE stream과 paused 실행 상태를 확인합니다.
2. 저장해 둔 **실측** 보정값을 관제에서 다시 입력하거나 같은 JSON을 API로 다시 적용합니다. 서버는 calibration을 메모리에 두므로 관측 이력 DB가 이를 대신 복원하지 않습니다.
3. 해당 모드의 `위치 입력`을 확인하고 관리자에서 `재개`합니다. 복원된 paused 상태에서는 앱의 `Start`도 기기 준비를 시작하지 않습니다. 최초 idle 상태의 준비와 서버 재시작 뒤의 복원을 구분합니다.
4. 전경 앱이 clock을 다시 동기화하고 CCTV의 새 uploader stream·세 UWB 역할의 pairing을 준비하도록 합니다. 실패 시 `Start`로 재시도합니다. measured 입력의 준비 중 누락 좌표는 unknown이며 모의 위치로 채우지 않습니다. 새 observation의 freshness·기술·진위 출처와 두 작업자의 동시 거리 수신을 확인한 뒤 실기 관측을 기록합니다. synthetic 개발 fixture를 실측 보정으로 재사용하지 않습니다.

종료 시 각 모드를 `일시정지`하고 실행 ID·관측 한계·증거 위치를 기록합니다. 폰의 `측정 중지 / Stop`으로 카메라/UWB를 정리하고 역할/계정 연결을 종료합니다. 관리자 웹은 `모드 선택으로 돌아가기` 후 `다른 계정으로 연결`로 로그아웃합니다. API 클라이언트는 `DELETE /api/session`으로 세션을 취소합니다. 마지막으로 Node 서버 터미널과 로컬 모델 터미널을 각각 Ctrl+C로 종료합니다. 이 절차는 DB나 과거 실패 이력을 삭제하지 않습니다.

서버의 `stop-requested` 표시는 일시정지 요청을 기록한 상태이며 **기기 중지 확인이 아닙니다**. 화면의 서버 상태만으로 실제 재생 중 음성, 진동, 카메라, UWB의 물리 취소가 완료됐다고 쓰지 않습니다. 기기 확인·관측이 없으면 unconfirmed로 남기고, 해당 APK·기기에서 실제 중지/재개 동작을 별도로 확인합니다. [계약 1.0.3](./contracts/clarification-playback-stop-v1.0.3.md)과 [동결 기록](./contracts/freeze-v1.0.3.json)은 발행됐습니다. wire 버전은 1.0.0을 유지하지만 상태 enum이 확장됐으므로 이를 처리하는 웹·서버·APK를 함께 사용해야 합니다. 이전 strict 클라이언트의 호환성을 가정하지 않습니다. 목표·AC 기준은 바꾸지 않으며 최종 후보의 실제 검증은 별도입니다.

## 증거와 인수

원본 입력/버전, 후보 해시, 환경·장치, 명령·조작, 기대 결과, 관측 결과, 시각과 산출물을 같은 실행 기록에 남깁니다. 실제 모델 호출과 장애 주입 mock, 센서 없는 소프트웨어 테스트와 네 폰 실기 테스트를 구분합니다. 다른 운영자가 이 문서로 새 DB 설치·LAN 연결·역할 배정·보정·두 모드를 재현해야 합니다.

실기·권한·모델·빌드 자원이 없거나 필수 기능을 실행하지 못한 항목은 BLOCKED/NOT_RUN입니다. 지원 여부 화면, 캡처나 작성 문서는 실제 동작의 대체 증거가 아닙니다. 모든 AC가 같은 후보에서 충족되고 QA Lead의 유효한 종합 PASS가 있어야 전체 완료입니다. 이 문서의 초안 작성은 인수 완료가 아닙니다.
