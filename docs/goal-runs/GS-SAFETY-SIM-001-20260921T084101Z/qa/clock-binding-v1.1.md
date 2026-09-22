# QA clock-domain binding v1.1 — QR-004

Issued by /root/qa_lead at 2026-09-21T10:23:20.799Z after interruption recovery. Goal GS-SAFETY-SIM-001 v1.0, run GS-SAFETY-SIM-001-20260921T084101Z. This is a versioned test-method clarification; original G0 v1.0, original fixtures, actual review timestamps and prior observed no_match results remain preserved. No user outcome, expected document/action/outcome, timeout or performance threshold is relaxed.

## Decision and basis

The original common fixture timestamp was ambiguous across clock domains. Published docs/contracts/v1.md already distinguishes scenario virtual time from UTC guidance generatedAt/expiresAt. docs/contracts/v1.0.1-addendum.md now explicitly assigns document approval/validity to UTC wall time and delegates the fixture mapping to QA. Technical Lead requested and concurred on this domain distinction before the interruption. Actual approval ledger contains 18 reviews at `2026-09-21T09:13:05.116Z`; treating the virtual scenario epoch `09:00` as an already-approved document lookup correctly produces no_match for those real documents. That observation is preserved and must not be changed into a past approval success.

QA authorizes an immutable derived test input set under this mapping:

| Clock | Binding | Purpose |
| --- | --- | --- |
| Scenario virtual clock | `2026-09-21T09:00:00.000Z`, seed20260921, existing elapsed event schedule | Unchanged deterministic simulation events, risk/action/route reproducibility |
| Deterministic document-test UTC clock | `2026-09-21T09:30:00.000Z` | Controlled UTC validity fixture after the genuine approved ledger; this is test input, not the actual execution timestamp |
| Live integration UTC clock | Actual observed UTC when the server/test starts each request; record it and its dependencies | Guidance generation/expiry, real-model/server publication, actual observations and document validity in the running system |
| Duration clock | Monotonic elapsed clock | Unchanged5000ms RAG deadline and frozen performance measurements |

The deterministic document reference is bound to approval ledger SHA-256 `ef2d2352527620d43d2a8ccd15a0f00bc740b3935dd995360c46382e1f3de00e`. If the ledger/corpus is re-reviewed after09:30, the derived normal fixture is no longer applicable: preserve it, report the changed prerequisite, and issue a new explicit mapping. Never backdate reviewedAt or skip approval validation. Live integrations use fresh actual UTC rather than the09:30 reference; their guidance expiry must not be tested against an already expired fixed envelope.

## Preservation and derived inputs

1. Preserve exact original producer26 cases (`tests/rag-test-cases.json`, SHA-256 `be54c02a5697048a29b07b425c6dad74773fcaee1ea56447e516217a0568f245`) and independent QA v1 cases, with hashes. Do not overwrite original fixtures or relabel earlier outcomes.
2. Derive a separate versioned producer/QA fixture set. Change only the document-validity clock binding from09:00 to09:30. Expected/forbidden document IDs, expected action codes, matched/no_match/conflict results and explanations of applicability stay identical.
3. For QA-owned temporal boundary records defined relative to09:00, shift their synthetic boundary values by the same+30minute delta so before/at/after validity relationships remain unchanged. Never shift real corpus validFrom/validUntil/reviewedAt or real audit/history data. Preserve each original-to-derived field diff and its reason. Non-temporal inputs stay identical.
4. Retain an explicit historical pre-review09:00 request against the genuine ledger: it must exclude the not-yet-reviewed documents. Add exact reviewedAt and adjacent-millisecond boundary checks using isolated fixtures without inventing historical approval.
5. Preserve original no_match execution artifacts and classify them accurately: real observed results under the earlier clock binding, not a model failure or a passed current-approval test. If the raw original result was never saved, record that evidence gap instead of fabricating a reconstruction. A new reproduction is separately timestamped.
6. Record every execution's actual start/end UTC separately from injected virtual/document-test times, alongside candidate, corpus, ledger and derived fixture hashes. Producer model smoke/self-checks remain producer evidence; official G4 remains independent.

This correction addresses input-domain ambiguity before G3. It does not authorize relaxed approval, deadline changes, missing actual-model evidence, removal of any case, or acceptance based on a partial component run. G0 original files remain unchanged.

## Interruption recovery

Before restart, QA sent the proposed mapping to RAG/Technical Leads but had not published QR-004; RAG was explicitly told to wait for its artifact. The pending read returned `Script running with cell ID35`, then recovery returned `exec cell35 not found`. No output or completed check is claimed for that lost cell. At10:21:59Z QA re-read durable files: original producer26 cases still all used09:00, approval ledger still had the18 genuine09:13 reviews, and test-refinements.md still ended atQR-003. This issuance resumes that pending decision without claiming execution during the interruption.

## Prior failure evidence preservation note

After issuance, RAG Lead identified surviving raw maker service failures at `evidence/rag/failures/rag-service-test.log`, reported as a09:18:45UTC run using09:00 requests. QA copied and hashed that artifact under `evidence/qa/g0/clock-preservation/` with reporter provenance. It contains no_match versus intended accepted/stale/timeout service behavior; it is not independent QA execution and is not the original26-case retrieval raw report.

RAG Lead explicitly reported that the original26-case raw output survives only in prior tool transcript/agent summary; no raw output file or original candidate hash was captured. That evidence gap remains visible. QA has preserved the original26 input file and hash, not fabricated missing output or candidate identity. A new09:00 historical exclusion run must have its own real timestamp/candidate and cannot be presented as the lost original run.
