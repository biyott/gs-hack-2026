---
documentId: "NEG-EXPIRED"
title: "테스트 전용 만료 시각 경계"
siteIds: ["SITE-CONSTRUCTION-01"]
simulationType: "equipment"
hazardTypes: ["equipment"]
applicableRoles: ["worker"]
applicableZoneIds: []
substanceIds: []
profileConditions: {}
actionCodes: ["ALERT_HAZARD"]
requiredScenarioPolicy: null
decisionKey: null
language: "ko"
version: "0.1.0-fixture"
synthetic: true
approvalStatus: "approved_for_demo"
effectiveFrom: "2026-01-01"
expiresAt: "2026-09-21T09:30:00Z"
reviewedBy: "test-fixture-only-not-a-real-approval"
reviewedAt: "2026-09-20T00:00:00Z"
sourceReference: "synthetic://safety-simulator/negative-fixtures/NEG-EXPIRED"
reviewedContentHash: "2da6ed8d8d2053c77c423be5356b3959be8e2c56b08b4b38eb9466074c729c6b"
---

# NEG-EXPIRED

## 1. 목적

격리된 부정 fixture NEG-EXPIRED. 실제 현장 지침 또는 실제 승인 문서가 아니다.

## 2. 적용 조건

테스트가 명시적으로 이 ID를 선택한 경우에만 색인 후보에 삽입한다. 검증 조건: 만료 시각 경계.

## 3. 적용 제외 조건

정상 지식 디렉터리 순회, 사용자 안내, 운영 지식베이스에서 제외한다.

## 4. 필요한 입력 필드

siteId, simulationType, hazardTypes, role, zoneIds, substanceIds, actionCode, profile, scenarioPolicy, scope, now.

## 5. 행동 코드와 설명

기계 검증용 행동 코드: ALERT_HAZARD. 이 자료는 행동을 승인하거나 엔진 정책을 변경하지 않는다.

## 6. 개인화 적용

확인된 기능 제약만 비교하며 미입력 프로필은 미확인으로 유지한다.

## 7. 예외 및 기본 안내

메타데이터 배제·충돌·오염 시 설명을 제공하지 않고 기존 엔진 안내를 유지한다.

## 8. 한국어 안내 예시

테스트 전용 자료이며 현장 안내로 전달하지 않는다.

## 9. 영어 안내 예시

Test-only material; do not deliver it as operational guidance.

## 10. 확인할 상태

실제 검색 결과의 포함·배제, 충돌 상태, 출처 및 버전을 확인한다.

## 11. 검색 키워드

중장비 접근 경보 EQUIPMENT-A 가스 DEMO-GAS-X 동일 결정 이동 실내 대기 equipment approach gas guidance

## 12. 관련 문서 ID

정상 문서를 대체하지 않는 독립 부정 fixture다.
