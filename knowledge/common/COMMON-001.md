---
documentId: "COMMON-001"
title: "개인 프로필 적용 원칙"
siteIds: ["SITE-CONSTRUCTION-01"]
simulationType: "common"
hazardTypes: ["equipment","fire","gas","combined","position-unknown","sensor-unknown"]
applicableRoles: ["worker"]
applicableZoneIds: []
substanceIds: []
profileConditions: {}
actionCodes: ["CONFIRM_UNDERSTANDING","REQUEST_ASSISTANCE"]
requiredScenarioPolicy: null
language: "ko"
version: "0.1.0"
synthetic: true
approvalStatus: "approved_for_demo"
reviewedBy: "/root/rag_lead/knowledge_review"
reviewedAt: "2026-09-21T09:13:05.116Z"
reviewedContentHash: "ae59d5fd21cc087ad6e9609e88aaaf51216ffac9be86e36cfe9bd95a72ccdf6d"
effectiveFrom: "2026-01-01"
expiresAt: "2030-01-01"
sourceReference: "synthetic://safety-simulator/COMMON-001"
reviewedSupplementalExplanation: {"ko":"이 설명은 확인된 기능 제약만 사용하며 미입력 프로필은 미확인으로 유지됩니다.","en":"This explanation uses only confirmed functional constraints, and missing profile information remains unconfirmed."}
---

# COMMON-001 개인 프로필 적용 원칙

## 1. 목적

확인된 기능 제약과 선호 언어를 안내에 연결하는 이유를 설명하고, 미확인 프로필을 제약 없음으로 해석하는 오류를 검증한다.

시뮬레이션 전용 합성 자료다. 실제 현장 사용 지침, 실제 승인·인증·법규 준수의 증거가 아니다. 위험·행동·경로·목적지는 서버 엔진이 결정하며 이 문서는 그 조건에 맞는 설명만 제공한다.

## 2. 적용 조건

등록된 현장의 작업자이며 현재 실행·프로필 버전이 일치할 때 적용한다. 확인된 stairsAllowed, assistanceRequired, preferredLocale만 사용한다. 미입력 항목은 미확인으로 남긴다.

검색 적용 시 siteIds, 요청 모드 또는 common, 위험 유형, 역할, 구역·물질·행동·프로필 조건, 유효기간을 모두 확인한다. 합성 문서는 독립 검토 기록과 approved_for_demo 상태가 확인된 데모 검색에서만 사용할 수 있다. draft, retired, 기한 전·만료 문서는 검색 근거에서 제외한다.

## 3. 적용 제외 조건

다른 현장, 다른 작업자의 프로필, 이전 profileVersion, 국적·나이·성별에서 추정한 제약에는 적용하지 않는다.

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
- `preferredLocale`
- `stairsAllowed`
- `assistanceRequired`
- `profileConfirmedAt`

필수 입력이 없으면 추측으로 채우지 않고 미확인 또는 설정 필요로 남긴다. 이름·생년월일·의료 진단명은 본 검색 절차의 입력이 아니다.

## 5. 행동 코드와 설명

- `CONFIRM_UNDERSTANDING`: 현재 안내 내용을 이해했는지 별도로 확인한다. 수신 확인은 이해 확인을 대신하지 않는다.
- `REQUEST_ASSISTANCE`: 확인된 지원 필요 또는 작업자의 도움 요청을 지원 흐름에 연결한다. 필요 표시만으로 지원 수락을 만들지 않는다.

현재 엔진의 actionCode와 일치하는 설명만 사용한다. 본문은 하나의 절차 검색 단위로 유지하여 적용 조건·행동·예외를 함께 확인한다.

## 6. 개인화 적용

계단 이용 여부와 보조 필요는 확인된 값만 설명한다. 프로필 변경 시 경로 엔진이 새 제약으로 재계산하며 문서는 경로를 결정하지 않는다.

언어는 preferredLocale을 사용하고 국적으로 추정하지 않는다. 나이·성별에서 이동 능력이나 이해 능력을 추정하지 않으며 미입력 프로필을 제약 없음으로 취급하지 않는다.

## 7. 예외 및 기본 안내

프로필이 누락되면 미확인 상태와 기본 안내를 유지하고 필요한 정보 확인 대상으로 남긴다. 나이·성별을 바꾸어도 확인된 이동 능력 판단을 바꾸지 않는다.

검색 근거 없음·충돌·모델 지연·실패·잘못된 인용·행동 불일치에는 보조 설명을 생략하고 검토된 기본 안내를 유지한다. 실제 경로·목적지·연결 관계·장비 제어·임계값을 생성하지 않는다.

## 8. 한국어 안내 예시

> 안내 {guidanceVersion}에는 확인된 프로필만 반영됩니다. 안내를 이해했는지 확인해 주세요. 도움이 필요하면 요청해 주세요.

## 9. 영어 안내 예시

> Guidance {guidanceVersion} uses only confirmed profile information. Please confirm whether you understand the guidance. Request assistance if needed.

## 10. 확인할 상태

- profileVersion 일치 여부
- 프로필 확인·미확인 항목
- 이해 확인과 지원 요청

기기 수신 확인, 작업자의 이해 확인, 담당자의 지원 수락, 작업자 또는 엔진의 도착 확인은 각각 별도 상태이며 서로 자동 대체하지 않는다.

## 11. 검색 키워드

개인 프로필, 계단 이용, 미확인, preferred locale, confirmed constraints, profile

## 12. 관련 문서 ID

- `COMMON-002`
- `COMMON-003`
- `EQ-003`
