---
documentId: "COMMON-002"
title: "선호 언어와 안내 이해 확인"
siteIds: ["SITE-CONSTRUCTION-01","SITE-INDUSTRIAL-01"]
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
approvalStatus: "draft"
effectiveFrom: "2026-01-01"
expiresAt: "2030-01-01"
sourceReference: "synthetic://safety-simulator/COMMON-002"
reviewedSupplementalExplanation: {"ko":"안내 언어는 작업자가 선택한 선호 언어에서 정해지며 수신과 이해는 별개의 기록입니다.","en":"The guidance language is selected from the worker's preferred language, and receipt and understanding are separate records."}
---

# COMMON-002 선호 언어와 안내 이해 확인

## 1. 목적

preferredLocale로 안내 언어를 선택하고 이해 확인을 다른 응답 상태와 분리하는 절차를 설명한다.

시뮬레이션 전용 합성 자료다. 실제 현장 사용 지침, 실제 승인·인증·법규 준수의 증거가 아니다. 위험·행동·경로·목적지는 서버 엔진이 결정하며 이 문서는 그 조건에 맞는 설명만 제공한다.

## 2. 적용 조건

현재 안내가 작업자에게 제공되고 선호 언어 및 지원 언어 상태를 확인할 수 있을 때 적용한다. 지원 언어는 ko와 en이다.

검색 적용 시 siteIds, 요청 모드 또는 common, 위험 유형, 역할, 구역·물질·행동·프로필 조건, 유효기간을 모두 확인한다. 합성 문서는 독립 검토 기록과 approved_for_demo 상태가 확인된 데모 검색에서만 사용할 수 있다. draft, retired, 기한 전·만료 문서는 검색 근거에서 제외한다.

## 3. 적용 제외 조건

국적에서 언어를 추정하거나 기기 수신 성공을 이해 완료로 취급하는 경우에는 적용하지 않는다. 다른 실행·작업자·만료 안내의 응답은 현재 확인으로 사용하지 않는다.

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
- `locale`
- `fallbackLocale`
- `deliveryStatus`
- `understandingStatus`

필수 입력이 없으면 추측으로 채우지 않고 미확인 또는 설정 필요로 남긴다. 이름·생년월일·의료 진단명은 본 검색 절차의 입력이 아니다.

## 5. 행동 코드와 설명

- `CONFIRM_UNDERSTANDING`: 작업자가 현재 버전 내용을 이해했다고 명시한 응답만 기록한다.
- `REQUEST_ASSISTANCE`: 이해 불가 또는 도움 요청을 별도 지원 요청으로 남긴다.

현재 엔진의 actionCode와 일치하는 설명만 사용한다. 본문은 하나의 절차 검색 단위로 유지하여 적용 조건·행동·예외를 함께 확인한다.

## 6. 개인화 적용

언어는 preferredLocale로 정한다. 미지원 언어는 지원 불가 표시와 사전 등록된 대체 언어·공통 표지를 사용하며 번역을 즉석 긴급 문구로 만들지 않는다.

언어는 preferredLocale을 사용하고 국적으로 추정하지 않는다. 나이·성별에서 이동 능력이나 이해 능력을 추정하지 않으며 미입력 프로필을 제약 없음으로 취급하지 않는다.

## 7. 예외 및 기본 안내

대체 언어가 미설정이면 설정 필요로 남긴다. TTS 실패는 화면 안내를 지우거나 이해 완료를 의미하지 않는다. 검토되지 않은 번역은 긴급 행동 문구로 사용하지 않는다.

검색 근거 없음·충돌·모델 지연·실패·잘못된 인용·행동 불일치에는 보조 설명을 생략하고 검토된 기본 안내를 유지한다. 실제 경로·목적지·연결 관계·장비 제어·임계값을 생성하지 않는다.

## 8. 한국어 안내 예시

> 안내 {guidanceVersion}을 이해했으면 이해 확인을 눌러 주세요. 이해하기 어렵다면 도움을 요청해 주세요. 수신 확인은 이해 확인과 다릅니다.

## 9. 영어 안내 예시

> If you understand guidance {guidanceVersion}, select understanding confirmation. If it is difficult to understand, request assistance. Receipt confirmation is separate from understanding confirmation.

## 10. 확인할 상태

- 선호 언어와 실제 표시·음성 언어
- 수신 확인
- 이해 확인
- 이해 불가와 도움 요청

기기 수신 확인, 작업자의 이해 확인, 담당자의 지원 수락, 작업자 또는 엔진의 도착 확인은 각각 별도 상태이며 서로 자동 대체하지 않는다.

## 11. 검색 키워드

선호 언어, 영어 안내, 한국어, 이해 확인, English guidance, preferredLocale, understanding

## 12. 관련 문서 ID

- `COMMON-001`
- `COMMON-003`
- `COMMON-004`

