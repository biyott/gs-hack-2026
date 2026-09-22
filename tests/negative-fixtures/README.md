# 격리된 RAG 부정 테스트 자료

이 디렉터리는 정상 지식베이스가 아니다. `knowledge/` 순회에 포함하지 않으며 테스트 또는 검증 실행기가 `context.negativeFixtureIds`에 지정된 파일만 명시적으로 읽어 별도 테스트 DB에 삽입한다. 모든 자료는 합성 데이터이고 `reviewedBy: test-fixture-only-not-a-real-approval`은 테스트 상태를 구성하는 값이다. 실제 검토나 현장 사용 승인을 뜻하지 않는다.

| Fixture | 검증할 배제 또는 실패 |
| --- | --- |
| NEG-DRAFT | draft 상태 |
| NEG-RETIRED | retired 상태 |
| NEG-FUTURE | 유효기간 시작 전 |
| NEG-EXPIRED | `now == expiresAt`인 만료 경계 |
| NEG-OTHER-SITE | 다른 현장 |
| NEG-COMMON-OTHER-SITE | common 문서에도 현장 필터 적용 |
| NEG-OTHER-MODE | 다른 시뮬레이션 모드 |
| NEG-OTHER-MATERIAL | DEMO-GAS-X와 다른 합성 물질 |
| NEG-OTHER-ZONE | 다른 구역 |
| NEG-OTHER-ROLE | 다른 역할 |
| NEG-PROFILE-RESTRICTED | 확인되지 않은 기능 제약 |
| NEG-UNREVIEWED | 데모 승인 표시는 있으나 검토자·시각 없음 |
| NEG-PRODUCTION-SYNTHETIC | approved 표시로도 합성 자료의 운영 사용 금지 |
| NEG-CONFLICT-MOVE / NEG-CONFLICT-SHELTER | 같은 decisionKey에서 서로 배타적인 행동 |
| NEG-PROMPT-INJECTION | 문서의 지시문 오염을 색인 전에 거부 |

충돌 두 문서는 동일한 적용 문맥과 `decisionKey`를 가진다. 요청 행동으로 먼저 하나를 제거하면 안 된다. 충돌 결과는 `trace.conflictDocumentIds`로 확인하고, 안내 근거 `chunks`는 비어 있어야 한다. 악성 지시문 파일은 parser 거부 테스트에만 사용하며 정상 검색 사례에 삽입하지 않는다.

[검색 사례](../rag-test-cases.json)는 최소 필수 포함 문서와 금지 문서를 정의한다. 반환 순서나 전체 후보 집합의 정확한 일치는 요구하지 않는다. `expectedActionCodes`는 보존할 엔진 행동이며 no_match/conflict에서도 바뀌지 않는다. matched 근거는 이 행동을 지원해야 하며 no_match/conflict는 근거를 반환하지 않는다. 검색 테스트가 새 행동을 결정하지 않는다. 생성 계층의 행동 의미 검증은 별도 실행한다.

`cases.test.ts`의 임베딩은 명시적으로 `mode: mock`인 상수 벡터다. 이 테스트는 실제 SQLite FTS·필터·충돌·출처 동작을 검증하지만 실제 임베딩 모델 실행이나 AC-07 정상 모델 성공 증거가 아니다. 실제 모델 검증 실행기는 모델명·판본·차원·생성 벡터·검색 단계별 trace를 별도로 저장해야 한다.
