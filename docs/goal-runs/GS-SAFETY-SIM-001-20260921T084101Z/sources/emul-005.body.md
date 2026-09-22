

## Flutter 기반 공통 개인 맞춤 안전 안내 모듈

중장비 위험과 화재·가스 위험 모두 같은 화면·음성·진동 처리 구조를 사용한다.

### 1. 기능 목표

서버에서 전달받은 개인별 안내를 Flutter 앱에서 화면과 음성으로 함께 제공하고 진동으로 보완한다.

| 기능 | 중장비 위험 | 화재·가스 위험 |
| --- | --- | --- |
| 지도 | 장비·작업자 위치와 위험 영역 | 작업자 위치와 위험 구역 |
| 경로 | 지정 회피 지점까지 이동 경로 | 출구·집결지·지정 공간까지 이동 경로 |
| 화면 문구 | 접근 위험과 다음 회피 행동 | 위험 종류와 다음 대응 행동 |
| 음성 | 개인 언어로 접근·행동 안내 | 개인 언어로 대피·대응 안내 |
| 공통 조작 | 다시 듣기·이해 확인·도움 요청 | 다시 듣기·이해 확인·도움 요청 |

이동 대신 대기가 지정된 경우에는 경로를 표시하지 않고 해당 행동 지침을 표시한다.

### 2. Flutter 기술 구성

| 항목 | 구현 방식 |
| --- | --- |
| 앱 | Flutter, Dart |
| 구조 | View·ViewModel·Repository·Service 분리 |
| 안내 상태 | 불변 상태 모델과 `ChangeNotifier` |
| 고빈도 위치 표시 | 별도 `ValueNotifier`와 지도 레이어 |
| 실내 지도 | `CustomPainter` 기반 2D 지도 |
| 확대·이동 | `InteractiveViewer` |
| 음성 합성 | `flutter_tts` |
| 진동 | `vibration` |
| 경고음 | Android 네이티브 재생을 MethodChannel로 연결 |
| 실시간 수신 | SSE 스트림 |
| 확인·요청 전송 | HTTP API |
| 언어 | Flutter localization과 검토된 메시지 카탈로그 |
| 앱 상태 감지 | `AppLifecycleListener` |
| 실제 UWB | 기존 Kotlin·MethodChannel·EventChannel 유지 |

UI와 데이터 처리를 분리한다. 음성·진동·네트워크는 서비스 인터페이스로 감싸 테스트 시 대체할 수 있게 한다. [Flutter 아키텍처 가이드](https://docs.flutter.dev/app-architecture/guide)

### 3. 공통 모듈 구조

```
lib/
├─ features/
│  └─ safety_guidance/
│     ├─ models/
│     │  ├─ guidance_event.dart
│     │  └─ guidance_state.dart
│     ├─ data/
│     │  ├─ guidance_repository.dart
│     │  ├─ guidance_sse_service.dart
│     │  └─ guidance_api_service.dart
│     ├─ application/
│     │  ├─ guidance_coordinator.dart
│     │  └─ guidance_view_model.dart
│     └─ presentation/
│        ├─ guidance_screen.dart
│        ├─ indoor_map.dart
│        └─ action_panel.dart
├─ services/
│  ├─ speech_service.dart
│  ├─ alert_sound_service.dart
│  ├─ vibration_service.dart
│  └─ uwb_service.dart
└─ l10n/
```

각 모듈의 역할은 다음과 같다.

| 모듈 | 역할 |
| --- | --- |
| Repository | 최신 안내·연결 상태 관리, 재연결과 snapshot 복구 |
| Coordinator | 안내 우선순위·버전 검사, 화면·음성·진동 실행 조정 |
| ViewModel | 안내를 화면 표시 상태로 변환 |
| View | 지도·문구·버튼 표시 |
| Speech Service | 음성 재생·중단·완료·실패 상태 관리 |
| Sound Service | 경고음 재생과 중단 |
| Vibration Service | 진동 실행과 기기 지원 여부 확인 |

음성 재생을 Widget의 `build()` 안에서 호출하지 않는다. 화면이 다시 그려질 때 같은 안내가 반복 재생되지 않도록 Coordinator가 처리한다.

### 4. 화면·음성·진동 동작 기준

안내를 수신하면 다음 순서로 처리한다.

1. 대상 작업자·실행 ID·안내 버전·만료 여부를 검사한다.
2. 최신 안내 상태를 한 번에 갱신해 화면에 즉시 표시한다.
3. 같은 안내 이벤트에서 진동과 소리 출력을 시작한다.
4. 위험 발생 시 짧은 경고음 후 행동 음성을 재생한다.
5. 화면 표시·음성 실행 상태와 사용자 확인을 구분해 서버에 전달한다.

“동시 제공”은 동일한 안내를 기준으로 함께 시작한다는 의미로 정의한다. 음성 준비를 기다리느라 화면 표시를 지연하지 않는다.

추가 동작 규칙은 다음과 같다.

- 새 경로가 이전 경로를 무효화하면 기존 음성과 재생 대기열을 취소한다.
- 위치 좌표가 갱신될 때마다 음성을 읽지 않는다.
- 위험 발생·이동 단계 변경·경로 변경·도착 등 의미 있는 변화에서만 발화한다.
- 동일 이벤트를 다시 수신해도 경고음·음성을 중복 실행하지 않는다.
- 서로 다른 위험은 서버가 정한 우선순위와 행동 정책에 따라 처리한다.
- 오래된 음성 완료 알림이 최신 안내 상태를 변경하지 못하도록 버전을 확인한다.
- 음성 실패 시 화면·진동을 유지하고 음성 이용 불가 상태를 표시한다.

`flutter_tts`는 언어 확인·설정, 발화 중지, 완료 감지를 제공한다. 진동은 기기 지원 여부를 확인한 뒤 실행한다. [flutter_tts](https://pub.dev/packages/flutter_tts), [vibration](https://pub.dev/packages/vibration)

### 5. 서버 안내 데이터

두 위험 유형을 동일한 데이터 모델로 처리한다.

| 필드 | 용도 |
| --- | --- |
| `eventId`, `runId` | 중복 이벤트·이전 실행 구분 |
| `guidanceId`, `guidanceVersion` | 안내의 식별과 갱신 |
| `workerId` | 안내 대상 |
| `hazardType`, `priority` | 위험 종류와 전달 우선순위 |
| `actionCode` | 이동·대기·지원 요청 등 결정된 행동 |
| `routeVersion`, `stepId` | 경로와 현재 이동 단계 |
| `mapId`, `mapVersion`, `floorId` | 지도 일치 여부 |
| `waypoints`, `destinationId` | 안내 경로와 목적지 |
| `locale`, `messageKey`, `messageArgs` | 개인별 언어 문구 선택 |
| `profileVersion` | 적용한 개인 조건 |
| `expiresAt` | 안내 유효기간 |
| `supplementalExplanation` | 검증된 RAG 보조 설명 |

- 경로가 없는 행동에서는 `waypoints`와 목적지를 비워 둔다.
- 지도 버전이 맞지 않으면 임의로 경로를 그리지 않는다.
- 화면의 핵심 문구와 음성 문구는 같은 행동 코드와 번역 자료에서 생성한다.
- 음성은 다음 행동에 필요한 짧은 문장으로 구성한다.

### 6. 개인화와 RAG 적용

- 선호 언어를 화면과 TTS에 함께 적용한다.
- 계단 이용 여부·이동 속도·지원 필요 여부는 서버 경로 엔진에 반영한다.
- 나이·성별만으로 이동 능력을 추정하지 않는다.
- 초기 지원 언어는 한국어·영어로 설정한다.
- 필요한 음성 데이터와 재생 가능 여부를 사용 전에 점검한다.
- 기본 경보와 행동 안내는 RAG 응답을 기다리지 않는다.
- RAG 설명은 현재 안내 버전과 일치할 때만 추가한다.
- 긴 보조 설명이 긴급 행동 음성을 가리지 않도록 우선순위를 낮춘다.

### 7. Flutter 성능·연결 관리 기준

- 고정 지도와 움직이는 작업자·장비 레이어를 분리해 다시 그리는 범위를 줄인다.
- 위치 변화만으로 전체 화면이나 프로필 패널을 다시 만들지 않는다.
- 지도 보간은 화면 표현에만 사용하고 위험 판단에는 사용하지 않는다.
- 앱 전체에서 안내 SSE 연결을 중복 생성하지 않는다.
- 재연결 시 최신 snapshot을 받아 현재 경로와 안내를 복구한다.
- 연결 단절 시 마지막 갱신 시각과 위치 불명 상태를 표시한다.
- 복구 후 이전 이벤트를 모두 읽지 않고 현재 유효한 안내를 기준으로 재생한다.
- 화면 종료·로그아웃·시나리오 초기화 시 구독·타이머·음성 대기열을 정리한다.

초기 데모는 앱 전면 실행을 기준으로 한다. `AppLifecycleListener`로 복귀 시점을 감지해 상태를 다시 동기화한다. 백그라운드·잠금 화면에서의 지속 안내는 Android 실행 정책과 알림 기능을 별도로 설계한다. [Flutter 앱 생명주기 API](https://api.flutter.dev/flutter/widgets/AppLifecycleListener-class.html)

### 8. 완료 기준

중장비 위험과 화재·가스 위험 모두에서 다음 항목을 확인한다.

- 같은 안내 버전의 화면·음성·진동 실행
- 선호 언어 일치와 개인 이동 제약 반영
- 경로 변경 시 이전 음성 중단
- 중복 이벤트의 중복 재생 방지
- 음성 실패·연결 단절·만료 안내 처리
- 앱 복귀 시 최신 상태 복구
- 수신·이해·도움 요청·도착 상태의 분리 기록


