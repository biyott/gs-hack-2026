---
documentId: "COMMON-003"
title: "이동 보조 및 지원 요청"
siteIds: ["SITE-CONSTRUCTION-01"]
simulationType: "common"
hazardTypes: ["equipment","fire","gas","combined","position-unknown","sensor-unknown"]
applicableRoles: ["worker"]
applicableZoneIds: []
substanceIds: []
profileConditions: {}
actionCodes: ["REQUEST_ASSISTANCE"]
requiredScenarioPolicy: null
language: "ko"
version: "0.1.0"
synthetic: true
approvalStatus: "approved_for_demo"
reviewedBy: "/root/rag_lead/knowledge_review"
reviewedAt: "2026-09-21T09:13:05.116Z"
reviewedContentHash: "ee8fb3e65e62508cbc27e1e6be145070c297254754dce7c4f932ef470468bd00"
effectiveFrom: "2026-01-01"
expiresAt: "2030-01-01"
sourceReference: "synthetic://safety-simulator/COMMON-003"
reviewedSupplementalExplanation: {"ko":"지원 요청, 담당자 배정, 지원 수락은 서로 다른 사건 상태로 기록됩니다.","en":"An assistance request, responder assignment, and acceptance are recorded as distinct incident states."}
---

# COMMON-003 이동 보조 및 지원 요청

## 1. 목적

보조 필요와 명시적인 도움 요청을 지원 배정·수락 절차에 연결하되 실제 수락을 추정하지 않는다.

시뮬레이션 전용 합성 자료다. 실제 현장 사용 지침, 실제 승인·인증·법규 준수의 증거가 아니다. 위험·행동·경로·목적지는 서버 엔진이 결정하며 이 문서는 그 조건에 맞는 설명만 제공한다.

## 2. 적용 조건

assistanceRequired가 확인된 true이거나 작업자가 현재 안내에 대해 명시적으로 도움을 요청한 경우에 적용한다.

검색 적용 시 siteIds, 요청 모드 또는 common, 위험 유형, 역할, 구역·물질·행동·프로필 조건, 유효기간을 모두 확인한다. 합성 문서는 독립 검토 기록과 approved_for_demo 상태가 확인된 데모 검색에서만 사용할 수 있다. draft, retired, 기한 전·만료 문서는 검색 근거에서 제외한다.

## 3. 적용 제외 조건

나이·성별로 보조 필요를 추정한 경우 또는 지원 요청·관리자 배정만으로 지원 수락을 기록하는 경우에는 적용하지 않는다.

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
- `assistanceRequired`
- `assistanceRequestId`
- `assistanceStatus`
- `assignedResponderId`

필수 입력이 없으면 추측으로 채우지 않고 미확인 또는 설정 필요로 남긴다. 이름·생년월일·의료 진단명은 본 검색 절차의 입력이 아니다.

## 5. 행동 코드와 설명

- `REQUEST_ASSISTANCE`: 현재 사건과 안내 버전에 연결해 도움 요청을 기록한다. 담당자의 명시적 수락은 별도 이벤트로 기록한다.

현재 엔진의 actionCode와 일치하는 설명만 사용한다. 본문은 하나의 절차 검색 단위로 유지하여 적용 조건·행동·예외를 함께 확인한다.

## 6. 개인화 적용

확인된 보조·동행 필요와 작업자의 요청을 전달한다. 진단명이나 불필요한 개인정보는 설명에 포함하지 않는다.

언어는 preferredLocale을 사용하고 국적으로 추정하지 않는다. 나이·성별에서 이동 능력이나 이해 능력을 추정하지 않으며 미입력 프로필을 제약 없음으로 취급하지 않는다.

## 7. 예외 및 기본 안내

담당자 미응답은 미응답으로 표시하고 등록된 관리자 지원 흐름에 남긴다. 재알림 주기나 연락 대상이 없으면 설정 필요로 표시한다. 지원 요청만으로 이동·대기·도착 상태를 바꾸지 않는다.

검색 근거 없음·충돌·모델 지연·실패·잘못된 인용·행동 불일치에는 보조 설명을 생략하고 검토된 기본 안내를 유지한다. 실제 경로·목적지·연결 관계·장비 제어·임계값을 생성하지 않는다.

## 8. 한국어 안내 예시

> 안내 {guidanceVersion}에 대한 도움 요청을 보낼 수 있습니다. 지원 요청과 담당자의 지원 수락은 별도로 표시됩니다.

## 9. 영어 안내 예시

> You can send an assistance request for guidance {guidanceVersion}. The request and the responder's acceptance are shown separately.

## 10. 확인할 상태

- 작업자의 지원 요청
- 관리자의 담당자 배정
- 담당자의 지원 수락
- 지원 미응답

기기 수신 확인, 작업자의 이해 확인, 담당자의 지원 수락, 작업자 또는 엔진의 도착 확인은 각각 별도 상태이며 서로 자동 대체하지 않는다.

## 11. 검색 키워드

보조 필요, 이동 보조, 도움 요청, 지원 미응답, assistance required, support request, acceptance

## 12. 관련 문서 ID

- `COMMON-001`
- `COMMON-002`
- `EQ-004`
- `FG-006`
