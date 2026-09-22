# C3 W3A partial execution and resource release

QA Lead stopped broad execution after confirming QD008. This packet preserves the work already collected on candidate `sha256:1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4`; replacement G3 and a new explicit resource grant are required before live work resumes. No overall acceptance verdict is issued.

## Actual collection and limits

Seven copied-source Blender reopen/export/reimport transactions completed at 16:25:55.659–16:26:33.871 UTC on 2026-09-21. All seven exited 0 and preserved frozen and copied source hashes. The LR source and independent reimport both recorded boom-pivot local x `1.2000000476837158`, with identity ROOT. This establishes the bounded source/reimport observation, not shipped production GLB rendering or complete dimensional acceptance. See [the completed Blender packet](c3-blender-execution-v1.md).

The actual Chromium matrix ran 16:29:14.558–16:33:40.084 UTC, stopping after the HOLD instruction. It recorded 127 of 155 semantic states, 380 completed capture records, and 425 PNG files. All completed capture records say helper-scope `PASS`; the overall raw helper report says `FAIL` and `productAcceptance: NOT_RUN`. Those fields remain unchanged. Nineteen semantic-state focus failures occurred before the HOLD, and one further state was interrupted when Chromium closed. The nineteen earlier errors remain unresolved pending stored-evidence review; neither completed capture assertions nor the later interruption erase them. This is incomplete collection, not a completed visual review.

The first fixture setup encountered a 409 version conflict; its error and the limitation that the helper had not yet persisted its full trace remain in `w3a-fixture-attempt-01-failure.json`. A separately recorded fixture-preparation attempt refreshed authoritative versions per command and wrote the trace immediately. This bounded setup behavior is not a product-case retry or a finding that all concurrency cases pass.

The production six-GLB/control comparison, complete dynamic incident/two-admin/role cases, broad performance collections, actual Android guidance, actual camera, audibility, haptics and physical calibration were not completed in this window. No phone or actual camera action occurred. Browser screenshots came from the fresh isolated synthetic runtime; both initial and pre-shutdown metadata preserve its no-real-frame provenance.

## Resource release

Owned Next server PID 915386 started at 16:24:26.395 UTC and stopped at 16:34:03.526 UTC following SIGTERM requested at 16:34:03.427 UTC; launcher exit was 0 and the server child exit was 143. Chromium and both capture runners also exited. The post-stop process probe found none of the owned app/browser/helper PIDs, and the listener probe showed 4101, 4102, 4103 and 8093 free. Existing provider 8092 PID 332445 was preserved. The QA database, history, logs, credentials and all partial outputs remain in their original locations; private credentials/session data remain in the ignored private directory.

The immediate release was sent to QA Lead, allowing the next owner's bounded work. Static reading/reporting may continue; no new browser, Blender, app, device, network or camera execution is authorized by this note.

## Evidence

Paths below are under this run's `evidence/qa/ui-device/candidate-1a7c95cd/`:

- `w3a-process-01.json`: actual launch identity, candidate, isolated DB and provider binding.
- `w3a-initial-tracking.json` and `w3a-hold-setup-state-01.json`: fresh and pre-shutdown metadata; the latter also retains both simulation snapshots and the pre-stop listener probe.
- `w3a-resource-release-01.json`: immediate process/resource release receipt.
- `w3a-hold-report-addendum-01.json`: preserves the original release receipt while correcting any implication that the whole raw FAIL resulted solely from HOLD; enumerates the 20 state errors.
- `w3a/2026-09-21T16-29-14-525Z/report.json`: original partial helper report, source hashes unchanged, exact errors and captures.
- `w3a/2026-09-21T16-29-14-525Z/independent-execution.json`: independent owner/grant/binding envelope, raw helper identity and sanitized execution output.
- `assets/c3-blender-execution-v1.jsonl` and `assets/c3-blender-summary-v1.json`: seven actual source-copy round trips and separate geometry observations.

Candidate-specific observations must not be retagged as behavior of a replacement candidate. Existing frozen G0 thresholds and physical workload requirements remain unchanged.
