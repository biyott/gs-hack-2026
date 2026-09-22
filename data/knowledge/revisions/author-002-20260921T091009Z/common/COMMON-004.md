---
documentId: "COMMON-004"
title: "안내 버전 변경과 오래된 안내 처리"
siteIds: ["SITE-CONSTRUCTION-01"]
simulationType: "common"
hazardTypes: ["equipment","fire","gas","combined","position-unknown","sensor-unknown"]
applicableRoles: ["worker"]
applicableZoneIds: []
substanceIds: []
profileConditions: {}
actionCodes: ["GUIDANCE_UPDATED"]
requiredScenarioPolicy: null
language: "ko"
version: "0.1.0"
synthetic: true
approvalStatus: "draft"
effectiveFrom: "2026-01-01"
expiresAt: "2030-01-01"
sourceReference: "synthetic://safety-simulator/COMMON-004"
reviewedSupplementalExplanation: {"ko":"안내는 실행, 경로, 프로필의 현재 버전에 연결되며 이전 버전의 설명은 현재 안내의 근거가 아닙니다.","en":"Guidance is tied to the current run, route, and profile versions; explanations from earlier versions are not evidence for current guidance."}
---

# COMMON-004 안내 버전 변경과 오래된 안내 처리

## 1. 목적

최신 실행·경로·프로필에 맞는 안내만 표시하고 오래된 보조 설명과 응답을 분리하는 원칙을 설명한다.

시뮬레이션 전용 합성 자료다. 실제 현장 사용 지침, 실제 승인·인증·법규 준수의 증거가 아니다. 위험·행동·경로·목적지는 서버 엔진이 결정하며 이 문서는 그 조건에 맞는 설명만 제공한다.

## 2. 적용 조건

현재 runId에서 안내 버전이 변경되었거나 경로·프로필·지도 버전 변경으로 기존 안내의 유효성이 사라진 경우에 적용한다.

검색 적용 시 siteIds, 요청 모드 또는 common, 위험 유형, 역할, 구역·물질·행동·프로필 조건, 유효기간을 모두 확인한다. 합성 문서는 독립 검토 기록과 approved_for_demo 상태가 확인된 데모 검색에서만 사용할 수 있다. draft, retired, 기한 전·만료 문서는 검색 근거에서 제외한다.

## 3. 적용 제외 조건

다른 runId나 workerId의 안내, 만료 안내, 역순·중복 이벤트를 새 안내로 처리하는 경우에는 적용하지 않는다.

## 4. 필요한 입력 필드

- `siteId`
- `simulationType`
- `runId`
- `workerId`
- `actionCode`
- `guidanceId`
- `guidanceVersion`
- `profileVersion`
- `expiresAt`
- `routeVersion`
- `mapId`
- `mapVersion`
- `generatedAt`
- `eventId`

필수 입력이 없으면 추측으로 채우지 않고 미확인 또는 설정 필요로 남긴다. 이름·생년월일·의료 진단명은 본 검색 절차의 입력이 아니다.

## 5. 행동 코드와 설명

- `GUIDANCE_UPDATED`: 서버가 결정한 최신 안내로 화면과 음성 상태를 갱신한다. 이전 경로·음성·대기열은 새 안내의 근거로 재사용하지 않는다.

현재 엔진의 actionCode와 일치하는 설명만 사용한다. 본문은 하나의 절차 검색 단위로 유지하여 적용 조건·행동·예외를 함께 확인한다.

## 6. 개인화 적용

새 프로필이나 선호 언어가 적용되면 해당 버전에 연결된 문구를 표시한다. 이전 언어의 음성 완료 신호가 새 상태를 바꾸지 않도록 구분한다.

언어는 preferredLocale을 사용하고 국적으로 추정하지 않는다. 나이·성별에서 이동 능력이나 이해 능력을 추정하지 않으며 미입력 프로필을 제약 없음으로 취급하지 않는다.

## 7. 예외 및 기본 안내

생성 중 버전이 달라지면 생성 결과를 폐기하고 최신 기본 안내를 유지한다. 지도 불일치·만료·재연결은 표시하고 최신 snapshot으로 복구한다. 과거 이벤트를 모두 재생하지 않는다.

검색 근거 없음·충돌·모델 지연·실패·잘못된 인용·행동 불일치에는 보조 설명을 생략하고 검토된 기본 안내를 유지한다. 실제 경로·목적지·연결 관계·장비 제어·임계값을 생성하지 않는다.

## 8. 한국어 안내 예시

> 현재 안내는 {guidanceVersion}입니다. 이전 안내의 경로와 음성을 사용하지 마세요. 최신 안내의 내용을 확인해 주세요.

## 9. 영어 안내 예시

> The current guidance version is {guidanceVersion}. Do not use the route or audio from previous guidance. Check the content of the latest guidance.

## 10. 확인할 상태

- 현재 실행·안내·경로·프로필·지도 버전
- 만료와 중복·역순 여부
- 이전 음성 취소
- 최신 snapshot 복구

기기 수신 확인, 작업자의 이해 확인, 담당자의 지원 수락, 작업자 또는 엔진의 도착 확인은 각각 별도 상태이며 서로 자동 대체하지 않는다.

## 11. 검색 키워드

안내 갱신, 오래된 안내, 버전 변경, stale guidance, guidance updated, version

## 12. 관련 문서 ID

- `EQ-002`
- `FG-002`
- `COMMON-002`
