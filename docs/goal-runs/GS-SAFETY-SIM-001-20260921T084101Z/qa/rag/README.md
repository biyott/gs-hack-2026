# Independent RAG QA preparation

Owner: /root/qa_lead/qa_rag. Scope: AC-06–08 only. Status: FROZEN_INPUT_NOT_EXECUTED; G3 candidate not submitted.

| Card / input | Coverage |
| --- | --- |
| [ac06-corpus-card.md](ac06-corpus-card.md) | All 18 documents, metadata/body/actions, bilingual meaning and actual independent review provenance |
| [ac07-retrieval-card.md](ac07-retrieval-card.md) | Actual embedding, FTS5, vectors, fusion, filtering, provenance and model abuse |
| [retrieval-cases.v1.json](retrieval-cases.v1.json) | 20 source-derived retrieval oracles with expected/forbidden docs, actions and outcome |
| [filter-cases.v1.json](filter-cases.v1.json) | 30 independent eligibility/index/cache exclusions and boundaries |
| [ac08-generation-card.md](ac08-generation-card.md) | Actual integrated model evidence, failure/contamination and primary-flow independence |
| [fault-cases.v1.json](fault-cases.v1.json) | 30 normal/fault cases, semantic invalid-provider output, stale context, strict 5000ms deadline |
| [readiness.v1.md](../../evidence/qa/rag/readiness.v1.md) | Preparation observation and gaps, never candidate acceptance |

These inputs are independent of producer tests. No final candidate testing or verdict is issued before G3 manifest. Negative records and injected providers belong in isolated QA datasets; normal corpus cannot scan this directory. Do not place actual credentials or personal data here.

Source bytes are frozen by the run archive. Fixture revisions preserve the old version and reason; schema adapter mapping may change as contracts mature, but expected outcomes cannot be silently adjusted to implementation.
