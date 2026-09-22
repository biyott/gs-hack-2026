# Server HTTP/SQLite execution observations

Goal/run GS-SAFETY-SIM-001 / GS-SAFETY-SIM-001-20260921T084101Z. Executor `/root/qa_lead/qa_server`; contract1.0.3, G0 plus registered QR amendments. Candidate `70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`; source `af06052baf673b40b33f8a4bb9f095b4239ff622d82fec492de6d42caeb92584`; submitted HEAD `9dc020a7c0160af17e2ac9157dcb8c390890309a`; BUILD_ID `VEwOJr6BFk2kVq-L1cCiG`. Frozen cwd `/home/b/.cache/gs-safety-ci.u7pR52`; manifest SHA `bc87dfe5caf85654a2ab96b345d141f6f182c0332c88798dc2ceacb51fd83849`.

This report covers actual production Next HTTP/SSE and SQLite observations, with software-generated inputs. It is not a whole-AC or overall verdict. No browser, device, speaker, microphone, Blender, or physical sensor was controlled. API voice callbacks are labelled fixtures throughout.

## Execution identity and resource release

Fresh migrate/seed13:18:45.228–13:18:46.698Z. Owned Next started13:18:55.266Z/PID782156 on4101; tests13:23:57–13:41:45.283Z. Three distinct restarts used PID804488,805312,807018, with prior process absence recorded before each later launch. FinalPID807018 exited13:42:09.263Z. W1/model grant was explicitly released to QA Lead at that time. The release receipt shows4101 absent and existing llama-server8092/PID332445 retained. No provider restart occurred.

Pinned Node v22.23.2 used existing candidate dependencies. The sole HTTP DB is `evidence/qa/server/candidate-70da1337/http/http-main.sqlite`, an absolute path under the goal run, created fresh through documented production migration/seed. Nine canonical accounts were verified; a tenth QA-only support account was later added through production seeding to make two conflicting assignments concrete. Random private PIN/session tokens remain0600 under a private /tmp directory outside candidate/public evidence. Requests, responses and session fields are redacted before durable logging.

Normal RAG was enabled with the frozen configuration and exclusive8092. Actual initialization produced18 documents/chunks/embeddings/FTS rows,72 rag_runs and6 guidance_evidence rows by final observation; SQLite integrity was ok. These are actual readiness/audit counts, not an inference-quality or latency claim. RAG Lead owns those criteria. Scenario control used actual UTC and speed0.001; exact virtual-time reproduction belongs to scheduler-free CORE, not these HTTP timings. QA Lead allowed a small offline FE test during non-timing-critical lifecycle work; no latency thresholds are inferred.

Initial candidate attribution uses QA Lead's full receipt plus selected independent setup hashes. Final `candidate-after-integrity.json` independently checks all904 source files and471 build artifacts: zero mismatches. Manifest SHA and BUILD_ID match. All product files were read-only to the harness; no product edit/rework was performed.

## Recorded cases

Raw `assertions.jsonl` has30 records:26 initial PASS and4 observed failures. Two PASS records explicitly mean successful capture of security observations, not acceptable access control. One observed failure is a QA projection mistake, corrected by analysis of already-captured data below. Interpreted inventory:25 functional subcases pass within their stated scope;3 assertions demonstrate the same recovery durability defect;2 security projection captures expose the documented role-boundary problem.

| Card portion | Observation |
| --- | --- |
| S01 startup | Fresh documented migrate/seed/start succeeded; nine role-bound accounts; integrity ok. |
| S15 authentication | Unauthenticated protected read/write401; wrong credentials/role401; cookie cross-origin mutation403; operator/worker/observer clear/reopen/close403 with unchanged DB counts. Permitted counterparts are persisted separately. |
| S13/S15 replacement | Replacing worker-a session closes its old SSE stream; old token401; unrelated admin200. |
| S16 scoped simulation | worker-a snapshot contains only WORKER-A, no audit/events/CCTV; equipment device has no worker profiles. |
| S21 subscriptions | Three admin/admin2/observer streams appear as3 connectedSubscriptions while worker received/displayed/spoken/understood remain null. No target-device receipt is inferred. |
| S10 response facts | Received, displayed, synthetic voice-started/completed, understood and help are independent. Spoken does not fill understanding/arrival. Wrong-worker response403. |
| S11 lifecycle | Assign→support acceptance→support completion→follow-up→operator field check→clear→explicit reopen→close all execute as real HTTP/persisted actions. First-guidance digest remains unchanged. Clear alone leaves passageReopenedAt null. |
| S12 concurrency | Two distinct admins submit conflicting support targets at identical run/incident versions: one200, one409. Same request replay200 without duplicate rows; changed payload with sameID409. Separate concurrent follow-up, clear and reopen pairs each produce one200/one409. |
| S13 SSE | Reconnect with an old cursor receives latest current scoped snapshot, current sequence and original first-guidance digest. |
| S19 actual restart | SameDB/new Next process preserves Tadano preset, manual pose(36,24), heading30/slew10, tableLinked false, reviewed en/stairs-forbidden profile, clear state, path closure state, current history and private session validity. |
| S19 replay | Historical assignment receipt bytes stay identical; replay after later mutations/restart causes no DB row change and HTTP returns current envelope/version rather than rolling back to historical receipt. |
| S19 terminal persistence | Explicit passage reopen and close timestamps survive both later actual Next restarts, separately from hazard-cleared time; first-guidance digest stays equal. |
| S23 recovery durability | FAIL on both recovery observations and first-marker comparison. Exact finding below. |
| S14 independent failures | Explicit unsupported/failed voice callback facts remain separate from spoken/understood and do not clear hazards. A generated blank camera stream goes connected→stale after it stops, while hazard activity and independent worker voice/position state remain unchanged. No physical audio/camera evidence claimed. |
| S16 static/private checks | Three direct DB/API paths return404. Nineteen production static JS/CSS/map/JSON assets and HTTP evidence text were scanned for private QA PIN/session token bytes: zero hits. This narrow scan is not a general proof about every secret, model prompt, or personal field. |

## Recovery finding: VOICE-001 / QD003

Input: actual running fire-gas scenario with current pending primary and null stop marker; ordinary RAG enabled. The process is stopped; no pause command is sent. First recovery GET in PID805312 at13:39:12.374Z returns paused state and marker13:39:12.374Z. Read-only SQLite simultaneously shows latest persisted snapshot still running with marker null. PID805312 then exits. NewPID807018 opens the same DB without any intervening HTTP mutation. Recovery GET13:39:34.857Z returns the same guidanceID/primary version but marker13:39:34.857Z, replacing the first fact; persisted latest still running/null.

Expected under final1.0.3 marker lifetime: recovery requests stop and durably preserves its first timestamp before a later unrelated mutation. Actual runtime correctly exposes an unconfirmed stop request, but the transformation is not saved. This repeats the independent constructor finding for both modes/pending+playing; this HTTP extension uses fire-gas/pending and real OS boundaries. It does not claim that a device continued speaking, acknowledged cancellation, or emitted a late callback.

Raw evidence: `voice-os-before-stop.json`, `voice-os-first.json`, `voice-os-second.json`, their logs/results, and `process-*.json`/`stop-*.json`. Both raw snapshots and latest DB payloads are retained. Only GET snapshots/read-only SQL occur between the relevant recovery observations; the redacted complete HTTP ledger records that boundary. Background initialization was allowed normally; it did not persist the stop fact in this run.

## Security observations: SEC-01

Actual GET/api/tracking200 for worker-a, worker-b and equipment exposes both labelled synthetic WORKER-A and WORKER-B ranges. The initial ranges were0.31m/0.77m with no precise XY positions. Admin/support/observer also receive the full tracking shape as documented. GETsimulation applies stricter own-worker scope. QA Lead later conveyed Tech/root concurrence that worker/device are not intended tracking consumers; the actual unauthorized role projection is concrete. Do not inflate range-only evidence into a physical-coordinate observation.

Synthetic-only extension: equipment POST/api/tracking/uwb200 returns full tracking fields and both workers; CCTV POST/api/tracking/frame200 does likewise. The uploaded image is a generated blank16x16JPEG. GETframe returns image/jpeg200 to CCTV/equipment/admin/operator; support/worker receive403. Device UWB is forcibly labelled live by the product's role rule although QA's capabilities/ranges were fabricated; no live ranging success is claimed. Pairing credentials are redacted.

Artifacts: `tracking-role-projection.json`, `device-projection-observation.json`, `session-field-observation.json`, `session-post-field-observation-actual.json`. Cookie-auth GETsession and canonical POSTsession both include a token field; only field presence is recorded, consistent with the existing browser/native Session contract. The initial POST field list was a declaration; the additive actual-field artifact derives exact keys from original redacted responses. No new TLS/cookie scope was added.

## Preserved QA corrections

1. Strict compiler failure from missing `@gs-safety/contracts` alias occurred before lifecycle execution. Original diagnostics retained; QA config gained the same frozen contract binding. Subsequent strict checks pass.
2. Lifecycle setup's profile command received409 VERSION_CONFLICT after independent RAG publications advanced the run. The original request/response/failure remains. No passed case was rerun; continuation explicitly refreshed the revision once and finished remaining state preparation. This is successful optimistic conflict handling, not a product defect or changed oracle.
3. Initial S14 aggregate assertion sought WORKER-A inside worker-B's intentionally scoped response. Both actual callback requests had200. Original code/log remains. `audio-captured-analysis.json` checks the already-recorded authoritative admin snapshot at13:41:42.616Z: A unsupported, B failed, spoken/understood null, same active hazardIDs. No requests or runtime tests were rerun, and the required outcome was unchanged.

## Boundaries

No actual speech, overlap, vibration, user action, two physical phones, UI label, navigation rendering or camera acquisition was tested here. S17 audio timing remains cross-slice. S20 reroute departure was tested by CORE through separate constructor OS processes, not this Next lifecycle. Expired-session denial is in the independent runtime slice; HTTP slot revocation is exercised here. Combined measured-position loss and CCTV/audio simultaneous fault timing is not asserted by this HTTP fixture; position/sensor loss has separate CORE controls. Model prompt capture/demographic propagation and broad browser bundle import review remain with other leaves. No whole-AC/overall verdict follows from this report.
