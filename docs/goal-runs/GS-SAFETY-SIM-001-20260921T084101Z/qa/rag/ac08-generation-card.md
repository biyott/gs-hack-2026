# Q-RAG AC-08 generation and contamination card v1

Owner/executor: /root/qa_lead/qa_rag. Frozen preparation input; candidate result NOT_RUN. Authority: acceptance.md AC-08; G0 RAG fault fixtures; source003 §§5–10; source004 §§5–10 and generation prompt §§4–7.

## Normal actual-model evidence

Run normal matched Korean and English cases through server integration: actual document ingestion → actual multilingual embeddings → FTS5/vector/fusion/filter retrieval → actual LLM adapter → production output/citation/semantic/freshness validation → accepted supplemental publication. Primary reviewed guidance is already available. A direct provider smoke call, hand-written valid response or producer unit test cannot prove this chain.

Record provider, model, exact model revision/version, actual/mock marker, a provider request ID or local call UUID, request and response timestamps/durations, sanitized request, raw response hash and safe response content, retrieved document/version/chunk hashes, validation outcome and accepted supplement event/DB evidence. Local actual inference is acceptable when its loaded model artifact/revision and inference call are proven; saying “actual” in a mock identity is insufficient.

For each normal case independently verify that every evidence tuple exists in the actual selected retrieval result, the cited procedure includes conditions/action/exceptions, the explanation has reviewed meaning, and the server action/route/profile/map/run/worker/guidance/hazard identities are unchanged. Review ko/en prohibitions, permission, movement/waiting, identifiers, placeholder names and numbers/units. Do not substitute a shape-only schema validator for action meaning.

## Fault procedures

Use [fault-cases.v1.json](fault-cases.v1.json), 30 independent normal/fault cases. Mutable provider fixtures live only in QA-owned test adapters and fresh QA DBs. Each injected result is explicitly mode mock; it proves only rejection/fallback/control flow.

- At 4999ms a valid response may be accepted before deadline; at 5000ms and 5001ms it is expired. RAG Lead explicitly confirmed elapsed>=5000ms is expired even if response callback was queued first. Use monotonic fake clock for exact boundary, then observe one real delayed call for integration timer/cancellation wiring.
- Capture AbortSignal state and timer/listener cleanup. A provider ignoring abort can finish internally but never publish late output. Repeat cancellation/reset 30 times and verify settled timers/listeners and supplemental publications.
- Reject valid-shape wrong document, version or chunk, changed action field, unchanged action field with opposite Korean/English behavior, invented route IDs, thresholds/units, mutated placeholders, wrong locale and unreviewed text copied from an unselected chunk.
- Put prompt-like instructions in a procedure in an explicitly isolated negative fixture. Its commands remain inert; record the model envelope and result to prove this. Safe fallback is acceptable. No normal approved knowledge directory is contaminated by the fixture.
- Advance route, profile, hazard, run, target, map and expiry separately during a delayed generation. Preserve old and new snapshots; the old supplement is discarded while the latest primary guide remains active.
- Use only synthetic personal-data/secret canaries. Observe actual outgoing model envelopes, logs and client output; unnecessary names, birth dates, diagnoses and secret canaries are absent.

## Primary flow and integration evidence

During each delayed/failed model operation trigger or observe primary warning, current route and an authorized administrator action. Match dispatch, UI visibility and supplemental events by incidentId/guidanceId/version. Q-WEB supplies actual rendered visibility and G0 p95<=1000ms evidence; a module promise returning promptly is not screen proof. Primary guidance must precede model completion and persist when the supplemental result is absent.

Join accepted/rejected model records to rag_runs, guidance_evidence, current guidance and emitted SSE/HTTP events. Rejected/stale explanation must be absent from accepted evidence and current/client/voice state. A fallback history row is allowed and expected. Receipt, understanding, assistance acceptance and arrival remain independent and cannot be fabricated by generated prose.

## Results and limits

Each case records candidate hash, source/protocol/input hashes, UTC and monotonic times, executor, environment, provider mode/identity, expected and observed reason/action/evidence/publication, exact command/actions, raw artifacts and PASS/FAIL/BLOCKED/NOT_RUN. A fallback reason may use a documented equivalent label, but observed behavior and exact evidence must meet the frozen requirement.

Real normal integrated model calls are mandatory. Mock delay and contamination successes cannot satisfy that slice. Missing real provider/model resources become BLOCKED only after concrete probing; cases awaiting G3 are NOT_RUN. Q-RAG reports individual observations to QA Lead and never issues the overall acceptance verdict.
