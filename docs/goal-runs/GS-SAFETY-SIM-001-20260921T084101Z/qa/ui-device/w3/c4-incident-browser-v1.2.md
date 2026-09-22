# Fresh C4 incident diagnostic v1.2

Source-only, runtime NOT_RUN. This additive derivative retains every v1.1 workflow and assertion. Originals remain frozen. Read `c4-incident-browser-v1.1.md` and `c4-incident-fresh-diagnostic-feasibility-v1.md` for the exact flow and limitations. No new grant is created here.

Only diagnostic binding and pre-failure evidence retention change. v1.2 requires a new direct evidence child named `incident-diagnostic-<id>`, a new `.private` DB/PIN, a new process receipt, and actual `/proc` start-time/cwd identity. PID 981422 and the original `.private/safety.sqlite`/`.private/credentials.json` are rejected. The launcher must independently prove database freshness; this script cannot infer it from a path. Source, build, candidate, base URL, process/script/fixture/binding/freeze hashes and all existing synthetic capture guards remain required.

The parent selected `evidence/qa/ui-device/candidate-cd8a2428/incident-diagnostic-01` and binding `qa/ui-device/w3/candidate-binding-c4.incident-diagnostic-v1.json`. The actual binding must use that fresh evidence root. All new grant, process, fixture and fixture-provenance files must resolve beneath it; new DB and explicitly named credentials file must resolve beneath its `.private` directory. Do not reuse, reset or modify the original C4 database. The fixed immutable application stage and port remain `/home/b/.cache/gs-safety-c4.q2FD40` and `http://127.0.0.1:4103`.

The browser grant retains all v1.1 required fields, except `phase` is `INCIDENT-DIAGNOSTIC-BROWSER`. Add finite `validFrom`, `launchGrant`, `databasePath` and `credentialsPath`. `grantedAt <= validFrom < expiresAt`, actual time must be inside that interval, and the new process receipt's `grant` must equal `launchGrant`. Its database and credential path strings must equal the grant's explicit paths. The process receipt also requires `startTimeTicks`, `sourceSha256`, `baseUrl`, new PID, stage, candidate/build, `freshDatabase: true`, `actualCameraInput: false` and `realPhoneSessionsIssued: 0`. A future explicit serial start grant remains necessary. Design has priority.

The actual fresh server may initialize E5, its corpus and Qwen/RAG on first requests or hazard evaluation. The parent has authorized incidental initialization, but the later runtime grant must own provider 8092 exclusively. This is not a no-model run. Do not suppress or alter legitimate RAG events to obtain the assignment result.

Immediately before the race, save the actual state. Before any race assertion throws, save both raw request bodies and HTTP outcomes, then the authoritative after-state with its events. The unchanged strict oracle still requires equal sent revisions, one 200 and one 409, and one matching assignment audit. If both requests return 409, preserve the strict failure and classify the diagnostic as inconclusive pending intervening-version/event review; do not call that a product assignment-winner defect, weaken the oracle or retry the race. Partial action responses and stream ledgers also remain in the final report.

```bash
/home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node \
  /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-incident-browser-v1.2.mjs \
  --binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c4.incident-diagnostic-v1.json \
  --grant /ABSOLUTE/incident-diagnostic-01/ACTUAL-BROWSER-GRANT.json \
  --fixture /ABSOLUTE/incident-diagnostic-01/ACTUAL-FG-FIRE-FIXTURE.json
```

The parent supplies a real paused FG-FIRE fixture with an active unacknowledged A and immutable first guidance; the script does not prepare the fixture. Actual camera mapping comes from frozen metadata and the observed fixture. Stock FG-FIRE provides no independent B.

Source preparation estimate: 2–3 minutes. Fresh launch/fixture estimate: 1–2 minutes plus possible model/corpus initialization. Full unchanged browser flow: 3–5 minutes; report/image review: 5–10 minutes separately. Do not promise a five-minute total. Preserve first failure. No phones, actual camera input, performance, C5 PASS transfer or overall acceptance claim. Successful assertions remain `INCOMPLETE_REVIEW_REQUIRED` with `productAcceptance: NOT_RUN`.

Preparation verification is syntax checking only; the script has not been imported or executed. Its freeze binds this script, this protocol, the unchanged v1.1 source and its source freeze. The fresh binding is supplied and hash-bound by the actual runtime grant.
