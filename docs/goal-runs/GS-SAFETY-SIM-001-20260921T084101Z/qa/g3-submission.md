# G3 submission and QA execution handoff

Goal/run: GS-SAFETY-SIM-001 / GS-SAFETY-SIM-001-20260921T084101Z. This checklist implements G0 v1.0; it does not add user outcomes.

Technical Lead supplies the following before final execution:

1. A stable integrated candidate ID plus content manifest including uncommitted source, lockfiles, configuration template, migrations/seed, schemas/contracts, scenarios/policies/map, 18 reviewed knowledge documents and review ledger, normal/negative RAG tests, six catalogs/GLBs/source assets, Flutter APK/source. Do not include secrets, runtime SQLite databases, node_modules, build caches or QA evidence in the content hash. Record actual built artifacts separately with hashes.
2. Exact reproducible commands and package/runtime versions for clean migration/seed, server/web production start, Flutter build/install, and selected scenario seed/clock. Explain isolated DB path and port configuration, and any documented readiness endpoint. The example configuration names every required setting without containing credentials.
3. Functional API/contract reference for session roles, admin actions/concurrency, scenario engine, snapshot and SSE events, worker responses, profile updates, camera/position/UWB upload, equipment switching, knowledge indexing/querying and model configuration. Detail fault injection supported by test adapters, without implementing faults in production behavior.
4. Versioned API/map/asset/coordinate/design contracts and source traceability. Known gaps, failed self-tests and unrun checks remain visible; self-test success is submission evidence and never QA verdict.
5. Resource availability status: browser, Blender source-open/export evidence, local real embedding/model runtime or authorized provider access, Android toolchains, physically accessible four devices, table/markers and LAN. Physical/model blockers do not delay independent software tests; they prevent whole-goal PASS.
6. Actual candidate-freeze UTC and owner. Notify QA of every source, asset, schema, config or environment change during testing. QA determines affected retest scope, preserves earlier results and issues a new verdict only for the new candidate.

QA ports and DB ownership are reserved at execution after verifying they are unused; no test may use or reset the developer's current DB. The server slice owns its DB/temp artifacts under evidence/qa/server; RAG owns its DB/temp artifacts under evidence/qa/rag; UI/device owns browser profiles and screenshots under evidence/qa/ui-device. QA Lead owns cross-slice manifests and overall evidence index. Port choice is an environment detail, not an API requirement.

## Independent execution slices

| Agent | Responsibility | Exclusive write paths in this run |
| --- | --- | --- |
| /root/qa_lead/qa_server | AC01–05,10–11,14 server/recovery/security checks | qa/server; evidence/qa/server |
| /root/qa_lead/qa_rag | AC06–08 data/search/model checks | qa/rag; evidence/qa/rag |
| /root/qa_lead/qa_ui_device | AC09,12–13,15–16 UI/assets/devices checks | qa/ui-device; evidence/qa/ui-device |
| /root/qa_lead | Cross-slice audit, complete AC aggregation and only overall verdict issuer | acceptance.md; qa root; evidence/qa root/g0 |

Agents can report subcase PASS/FAIL/BLOCKED/NOT_RUN, never whole-goal acceptance. The initial card/readiness audit is concrete preparation and does not imply the candidate has been executed.

## Evidence record fields

Each test record includes: goalId, runId, taskId, testId, AC IDs, goal/protocol/contract version, candidate hash, artifact hashes, executor, timestamps, environment and device labels (without serials), input fixtures, exact command/actions, expected values, observed values, raw evidence paths, verdict, defect ID, and attempt number. A defect links original failure, owning implementation Lead, correction submission, and retest. Preserve all prior attempts.

Cross-device timing records include clock-offset measurements and uncertainty or independent filmed timer measurements. Actual model records include provider/model/version, mock:false, embedding dimensions/vectors, retrieved document/version/chunk identifiers and sanitized invocation evidence. A log flag saying mock:false without actual invocation evidence is insufficient.

## Final review identity and lanes

The [five-lane final review plan](review-work-plan-v1.md) retains the three existing execution owners and adds one-shot independent goal, hands-on, code, security and context perspectives after G3. Stamp the full repository HEAD together with the exact dirty source/candidate and built artifact hashes; a commit alone does not identify this uncommitted candidate. Include tracked and untracked input inventory, prior baseline attribution and the frozen isolated candidate root. Reviews do not modify product files or create commits. Missing review evidence and physical BLOCKED/NOT_RUN remain incomplete, never PASS; only QA Lead issues the overall verdict.
