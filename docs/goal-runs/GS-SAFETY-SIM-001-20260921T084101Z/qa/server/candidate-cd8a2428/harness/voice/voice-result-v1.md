C4 voice passed **74/74 cases in five files**, fresh attempt voice-01 under W1-C4-01. No failures, skips, retries or QA edits. Parent strict typecheck passed before launch. All seven voice TypeScript sources match the original C2 input hashes; C4 used 74 fresh QA SQLite databases.

Candidate `cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`; source `e17322b2faf5b5181f6a50bcd5cd4baeae2ca31f57f7bfd1653399b4e9e28efa`; manifest SHA-256 `a4ae231987936e6a91cc05ff380eb71a69597c7e689e315dd6e21e7222d0b53d`; BUILD_ID `czkc6DgDv3UUlTrSfDMqX`; HEAD `9dc020a7c0160af17e2ac9157dcb8c390890309a`. Actual UTC 2026-09-21T17:18:07.295Z–2026-09-21T17:18:34.007Z, PID 952693, exit0, Vitest26.22s. Before/after integrity checked 1475 bound entries each with no mismatch.

| Subcase | Passed | Scope |
| --- | ---: | --- |
| R01 | 8 | First/repeated pending/playing durable marker, both modes and constructor/synchronized seams |
| R02 | 2 | Genuine S20 latest target metadata through both recovery seams |
| R03 | 28 | Independent private metadata parser/restore and durable compatibility matrices |
| R04 | 12 | Actual separate-connection pause/reset/pause-resume winners and losing recovery reload |
| R05 | 8 | Synthetic unchanged-head conflict and actual SQLite TEMP-trigger transactional rollback |
| R06 | 16 | Genuine terminal facts/receipt/history/replay and idle/completed no-op reconstruction |

[Machine-readable report](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-cd8a2428/voice-01/voice-report-v1.json) indexes 110 C4/grant-matching observation records, 74 databases and 189 pre-report artifacts with hashes. JSON report SHA-256: `06d2997f162625e0c947a3bde284c572bdd87f28caf4d56e95e55b9ef9982cbb`. [Execution log](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-cd8a2428/voice-01/execution.log) records the test counts; [completion](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-cd8a2428/voice-01/completion.json) records command, identity, PID, times and exit. All four real rollback cases produced the injected SqliteError marker, captured rows stayed unchanged and published-frame counts were zero. Independent read-only review found no provenance contradiction.

This is imported runtime/SQLite subcase evidence, not an overall verdict. Reopen is same-process reconstruction; OS exit/start, HTTP/SSE, model, device and audio remain separate. Trigger rollback is not crash/power-loss proof. Real Date/performance were retained; envelope virtualClock is wall time and scenario elapsed time is snapshot.run.virtualTimeMs. This concurrent functional run makes no latency claim. No product or prior-candidate files changed. Execution is complete; no runtime resources remain active in this slice.
