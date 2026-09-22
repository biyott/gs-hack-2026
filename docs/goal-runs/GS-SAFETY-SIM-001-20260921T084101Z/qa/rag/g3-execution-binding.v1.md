# Q-RAG G3 execution binding v1

Preparation only. This document binds the existing independent 85-case QR-004 inputs to discovered implementation entry points. It is not a runnable test result, a substitute for a fixed candidate, or permission to run against a developer DB. Candidate ID, candidate root, production artifact and execution timestamps remain unassigned.

## Preconditions and independent inputs

Use [clock-binding-v1.1/README.md](clock-binding-v1.1/README.md) and its immutable input/field/bundle manifests. Preserve 81 earlier cases plus four clock cases and every expected/forbidden document, action and outcome. Document-test UTC is 2026-09-21T09:30:00.000Z; virtual scenario time remains 09:00 with seed 20260921; live HTTP/model integration uses fresh actual UTC. The actual 18-review ledger remains bound to ef2d2352527620d43d2a8ccd15a0f00bc740b3935dd995360c46382e1f3de00e. Recheck it, approved corpus hashes and all input hashes after receiving G3.

Technical Lead must supply the stable full candidate manifest/root/hash and production build hash. Contract freeze 1.0.1 has 19 files and contentSha256 379a4bee66b78f2df9aa8a792f18d2edf5d6b63b26c2b94e94df55e6e51f0c63; it freezes contracts, not every application implementation or artifact. Verify manifest before and after each slice, including uncommitted content.

QA owns the execution adapter and fixture materialization under qa/rag and evidence/qa/rag. The producer verify-model.ts runner consumes producer 26-case schema and writes root evidence/rag; it is not the independent 85-case entry point. The adapter has not been implemented or executed by this readiness audit. Its concrete API requirements are below, so it can be bound without changing expected outcomes once G3 fixes imports and configuration.

## Concrete startup commands, to execute only after G3 assignment

From the supplied candidate root, set DATABASE_PATH to an absolute newly allocated file under this run's evidence/qa/rag/<candidate>/<attempt>/ and supply the same isolated path to server and QA observer. Do not leave the default data/runtime/safety.sqlite. Use Node 22 and npm 10.9.8 from the G3 handoff.

```sh
DATABASE_PATH="$QA_RAG_DATABASE" npm run db:migrate
DATABASE_PATH="$QA_RAG_DATABASE" npm run db:seed
DATABASE_PATH="$QA_RAG_DATABASE" npm start -- --port 4102
```

QA_RAG_DATABASE is a future task-specific absolute path, not a configured current database. Port 4102 was confirmed through QA Lead as a supported example; check it is unused and reserve it before launch. PORT=4102 is also supported by the production command. Seed and server must use the same separately supplied GS_DEMO_PIN; do not print it, session tokens or login responses into evidence. Do not copy or commit real secrets. Production requires the supplied PIN setting.

Retain nonsecret RAG_ENABLED=true, RAG_LLM_BASE_URL=http://127.0.0.1:8092/v1, RAG_LLM_MODEL=Qwen3-0.6B-Q8_0, RAG_LLM_VERSION=23749fefcc72300e3a2ad315e1317431b06b590a, RAG_TIMEOUT_MS=5000, RAG_EMBEDDING_MODEL=Xenova/multilingual-e5-small, RAG_EMBEDDING_REVISION=761b726dd34fb83930e26aab4e9ac3899aa1fa78, RAG_EMBEDDING_DIMENSIONS=384 and the manifest-bound RAG_EMBEDDING_LOCAL_PATH. Record configuration presence/hash with secrets excluded. The normal adapter remains actual; mocks are explicitly injected only into separate fault fixtures.

Existing provider 8092 is owned by RAG Lead. Obtain the coordinated exclusive measurement window; do not terminate or duplicate that process. Runtime model setup/start commands are documented in data/knowledge/runtime/README.md. If a new environment needs installation after assignment, use ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci and the two pinned preparation scripts, then start-llm.sh with an agreed free port. Technical Lead is preparing model weights, executable and shared-library manifests; bind those to actual runtime paths.

## Model readiness and warmup boundary

GET /health and GET /v1/models on port 8092 are non-inference resource observations. The endpoint being healthy does not prove a fresh application process initialized its E5 session or that a real model call meets the deadline. A separate embedding probe process also does not warm the application's own resident session.

For direct isolated RAG execution, await createRagService(...).initialize(candidateRoot), capture its ingestion record, 18 approved chunks and actual vectors before normal matched tests. For an integrated application, attachRag exposes internal loading/ready/failed state; no public RAG-readiness endpoint was discovered during this audit. Technical Lead must identify a reproducible application readiness observation or confirm a fresh-DB completed-ingestion/vector check as the supported observation. New fresh ingestion generates E5 vectors in that process. Existing cached vectors on restart alone do not demonstrate resident model warmup.

Record explicit cold/warm preparation separately. Once assigned, a bounded actual normal-model warmup may prepare the LLM; preserve its provider response/call identity and label it warmup, not a tested acceptance case. Do not discard timeouts from mandatory tests or move initialization onto the primary action path. The one-slot, four-thread provider must be free of unrelated requests during measured runs. No inference warmup was performed by this readiness audit.

## Adapter entry points and records

| Independent slice | Discovered candidate entry point / requirement |
| --- | --- |
| Fresh application DB | src/server/db/index.ts createDatabase(absolutePath); migration folder resolves from candidate cwd. Close every connection. |
| Standalone retrieval store | src/server/rag/store.ts RagStore(nativeBetterSqliteConnection). Use a new QA DB per isolated dataset. Record SQLite version, FTS5 virtual-table definition, document/chunk/embedding rows. |
| Normal corpus ingestion | ingestKnowledgeDirectory(candidateOrQACopyRoot, store, {embedding, scope:"demo", now:documentUtc, signal}); real original metadata and approval ledger must join. Copy corpus only into QA ownership when isolation/mutation is required. |
| Actual embedding | TransformersEmbeddingProvider with manifest-bound model/revision/dimensions/local path. Save real document/query vectors; passage: and query: prefixes are implemented by production ingestion/retrieval. |
| Retrieval | retrieve(store, embedding, request): use original independent query/action/profile/site/mode/zone/material/limit and the QR-004 clock. Save filters, FTS, vectors, fused results and conflict witnesses. |
| Independent score check | Recompute cosine from saved real vectors. Current RRF formula is sum of 1/(60+rank+1) across FTS and vector ranks; vector admission threshold 0.35; ties use chunkId locale ordering. Bind final implementation constants at G3; no change to expected document/action/outcome. |
| Normal generation | createRagService({db,embedding,llm,wallNow?,monotonicNow?,timeoutMs:5000}); initialize(root); enrichGuidance({guidance,context},getCurrent). Actual normal calls use fresh real UTC and authoritative current guidance. |
| Fault injection | Separate LanguageModelProvider / EmbeddingProvider implementations, clearly mode mock. Inject completion shape/output or timing through public interfaces; do not change production modules or configure mocks for normal integration. |
| Semantic validation | Output is actual model reviewed-extractive selection, resolved to exact reviewed ko/en text plus selected chunk evidence. Preserve action semantics and cite actual retrieved versions. Label it selection, not free-form authored prose. |
| HTTP/SSE publication | Isolated app /api/session, /api/simulation and /api/events with scoped bearer session; capture ordered streamId/sequence, new immutable supplement guidanceVersion, unchanged primaryGuidanceVersion, first/current DB history and linked ragRunId. |
| Actual Android audio | Link Q-RAG-08-31 to UI09-09. Server records cannot establish physical no-beep/no-replay behavior; Q-UI supplies the actual device evidence on the same candidate. |

QA fixture-only locale and fixtureSet fields stay out of RetrievalRequest but remain in the complete recorded test input. Existing fixture policy tokens map by meaning: move→evacuation; shelter→shelter-per-scenario; null stays null. Do not map designated-refuge to shelter. Wire profile canUseStairs maps to stairsAllowed; needsAssistance or needsCompanion true yields assistanceRequired true, both false yields false, otherwise null; confirmedAt presence maps to verified. These aliases change representation only. Preserve unknowns.

Normal/isolated corpus roots contain only explicit knowledge/common, knowledge/equipment, knowledge/fire-gas and the matching ledger. Test-only negative records never enter normal production ingestion. Materialize QA fixture mutations, record base/derived hashes and review/approval-test provenance, and prove the intended exclusion independently from unrelated rejection. Do not alter actual corpus reviewedAt, validity or hashes to make a positive case eligible.

## Required execution evidence and remaining gates

Every attempt records actual start/end UTC, injected virtual/document UTC, candidate/contract/corpus/ledger/fixture hashes, exact invoked command or API call, provider/model identity and actual/mock marker, raw retrieval stages/vectors, generation call ID/response hash, expected/observed result and artifact paths. Keep first failures and strict 4999/5000/5001ms boundaries. A completed ingestion, healthy endpoint or producer report cannot substitute for actual independent retrieval/generation results.

Remaining gates: fixed G3 integration/build/runtime manifest; supported integrated readiness/warmup observation; confirmed isolated DB/port/environment; exclusive 8092 window; QA adapter bound to the G3 imports; coordinated same-candidate UI/Android execution. These are preparation tasks, not observed product failures. Candidate tests remain NOT_RUN.
