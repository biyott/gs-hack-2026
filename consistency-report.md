# 합성 지식 문서 일관성 검토

**문서 내용 검토: 18/18 통과, 데모 전용 승인. 전체 QA 판정은 아님.**

독립 검토자 `/root/rag_lead/knowledge_review`가 18개 문서의 전체 본문·메타데이터, 한국어/영어 예시와 보조 설명 후보를 실제로 읽었다. 검토 완료 시각은 `2026-09-21T09:13:05.116Z`이다. 검토자는 저작에 참여하지 않았으며, 문서 내용 수정은 작성자에게 반환했다. 승인 변경은 `approvalStatus`, `reviewedBy`, `reviewedAt`, `reviewedContentHash` 메타데이터에 한정했다.

기준은 [004 원본의 합성 문서 부록](docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-004.body.md), [목표 D](docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.document.original.md), [동결 현장 범위](docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/requirements/scope-freeze.v1.0.md), [G0 검증 조건](docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/g0-protocol-v1.md)다.

| 검토 항목 | 실제 수행 결과 | 근거 |
| --- | --- | --- |
| 문서 ID·주제·개수 | COMMON 4개, EQ 6개, FG 8개, 총 18개; 원본 지정 ID와 제목 일치 | [구조 검사](data/knowledge/reviews/structural-approved.json) |
| 메타데이터·형식 | 필수 키, synthetic true, version 0.1.0, 합성 출처, 허용 행동 11개, 순서대로 된 본문 12개 항목 확인 | [재실행 스크립트](data/knowledge/reviews/check-corpus.mjs) |
| 식별자·현장 범위 | 등록 식별자와 관련 문서 연결 확인. 최종 18개 모두 SITE-CONSTRUCTION-01 범위. 산업 현장 ID는 다른 현장 부정 사례용이며 현재 지식의 허용 범위가 아님 | [수정 전 발견사항](data/knowledge/reviews/initial-findings.md), [최종 검토](data/knowledge/reviews/semantic-review.md) |
| 행동·적용·예외 | 행동과 조건을 함께 검토. 경로·목적지·연결 관계·가스 기준·보호구·구조·응급처치·안전 보장 생성 없음. 경로 없음과 실내 대기, 위험 해제와 재개 승인 구분 | [문서별 의미 검토](data/knowledge/reviews/semantic-review.md) |
| 양언어 예시·보조 설명 | 18쌍의 예시와 18쌍의 설명 후보를 읽고 행동·금지·조건의 의미 일치를 확인. 예시 자리표시자와 식별자 자동 대조 통과 | [구조 검사](data/knowledge/reviews/structural-approved.json), [의미 검토](data/knowledge/reviews/semantic-review.md) |
| 원본 초안 보존 | 처음 생성된 18개 draft의 SHA-256이 최초 관측값과 동일 | [최초 해시](data/knowledge/reviews/structural-initial.json), [최종 무결성 검사](data/knowledge/reviews/integrity-approved.json) |
| 승인 이력과 내용 결합 | 승인 전 검토 결정 원장 작성 후 승인 전환. 내용 해시·최종 파일 해시·검토자·실제 시각·문서 버전 연결 | [결정 원장](data/knowledge/reviews/decisions.json), [승인 원장](data/knowledge/reviews/approvals.json) |

첫 검토에서 지원 요청만으로 경로 존재/부재를 단정할 수 있는 EQ-003/EQ-004/FG-006, 변경 원인을 단정하는 EQ-002/FG-002의 보조 설명을 발견했다. 작성자가 행동 메타데이터를 좁히고 조건부 설명으로 수정했고, 검토자가 5개 전체 수정본을 다시 읽었다. 이어 실제 두 모드의 공통 지도에 맞춰 공통·화재가스 12개 문서의 현장 범위를 좁혔다. 검토자는 최초 초안 대비 전체 diff를 확인했다. 수정 이력은 [revision001](data/knowledge/revisions/author-001-20260921T090443Z/revision.json), [revision002](data/knowledge/revisions/author-002-20260921T091009Z/revision.json)에 보존한다. 발견사항을 삭제하거나 최초 초안을 승인 문서로 덮어쓰지 않았다.

`reviewedContentHash`는 원시 Markdown의 첫 YAML 블록 안에서 `approvalStatus:`, `reviewedBy:`, `reviewedAt:`, `reviewedContentHash:`의 전체 루트 행만 제외한 SHA-256이다. 그 외 메타데이터와 본문은 모두 해시에 포함한다. `approvedFileHash`는 승인 후 전체 파일 바이트의 SHA-256이다. [해시 정의](data/knowledge/reviews/review-digest.mjs)와 [원장 검증](data/knowledge/reviews/verify-approval-ledger.mjs)으로 재확인할 수 있다. 내용이 바뀌면 기존 검토 승인을 재사용할 수 없다.

검토 시 실행한 명령:

```sh
node data/knowledge/reviews/check-corpus.mjs
node data/knowledge/reviews/verify-approval-ledger.mjs
```

두 명령의 실제 결과는 위 JSON 증거에 있으며, 명령에 의한 형식·해시 검사와 검토자의 의미 판독은 별도 근거다. `reviewedSupplementalExplanation`은 승인된 동일 내용의 ko/en 후보에 한해 사용할 수 있으며, 예시 전체를 현재 조건 확인 없이 긴급 행동 문구로 출력하는 승인이 아니다.

| 별도 실행이 필요한 항목 | 이 문서 검토에서의 상태 |
| --- | --- |
| draft/retired/기한 전·만료/타 현장·모드·물질/운영 범위 배제 | NOT_RUN — 문서에 필요한 조건이 있다는 사실만 확인 |
| 실제 FTS5·다국어 벡터·결합 검색과 최소 12개 사례 | NOT_RUN |
| 실제 공급자 임베딩·LLM 호출, 잘못된 인용·행동 반전·지연·실패·상태 변경 주입 | NOT_RUN |
| 엔진의 행동/경로 일치, 기본 안내 유지, 전체 절차 분할·색인, 정상/부정 자료 격리 | NOT_RUN |
| 웹·Android·휴대폰·센서 통합, 전체 AC-01~16 판정 | NOT_RUN |

이 보고서의 데모 승인은 실제 현장 안전 승인·인증·법규 준수 선언이 아니다. 런타임 검증은 담당 QA의 실행 증거와 별도 판정을 사용해야 하며, 이 문서만으로 AC-06 전체나 종합 QA PASS를 주장하지 않는다.

## 이후 작성자 실행 증거

위 표는 독립 문서 검토 당시의 범위를 그대로 보존한다. 이후 RAG 작성자는 QA가 발행한 [QR-004 시각 결합](docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/clock-binding-v1.1.md)을 적용한 별도 파생 사례를 실행했다. 실제 실행 UTC `2026-09-21T10:34:09.451Z`부터 `10:34:24.748Z`까지 실제 E5 임베딩과 SQLite FTS5·결합 검색으로 26/26 사례가 통과했고, 실제 Qwen 공급자의 검토된 후보 선택을 통해 영어 4028.11ms·한국어 689.05ms 보충 설명이 검증됐다. 정상 지식에는 실제 384차원 벡터 18개가 저장됐다.

[작성자 실행 보고서](docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/rag/RAG-ACTUAL-2026-09-21T10-34-09-385Z/report.json)와 같은 디렉터리의 사례별 조회·필터·벡터·호출 기록을 확인할 수 있다. 문서 유효성 입력 UTC 09:30은 실제 실행 시각과 다르며, 실시간 보충 설명 검사는 실제 현재 UTC를 사용했다. 원본 26개 사례와 실제 검토 시각은 변경하지 않았다. 최초 원본 26개 실패 출력 파일과 당시 구성요소 해시는 저장되지 않았다는 증거 공백을 [QA 기록](docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/clock-binding-v1.1.md)에 남겼다. 이 후속 기록은 작성자 실행 증거이며 독립 QA 판정을 대신하지 않는다.
