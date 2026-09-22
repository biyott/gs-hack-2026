# C4 transition ledger helper checker — source preparation only

`test-c4-primary-transition-ledger-v1.mjs` is a future synthetic-HTML check of the exact existing `c4-primary-transition-ledger-v1.mjs` and `browser-observer-primary-v2.mjs`. Neither helper was changed. Preparation performed only file reads, hashing, source review and `node --check`; helper/browser/application/model execution is **NOT_RUN**. This is not product acceptance or performance evidence.

The separate `c4-primary-transition-ledger-checker-freeze-v1.json` binds the checker, both unchanged helpers, the C4 Playwright entry module, candidate manifest and Chromium executable. The runtime requires exactly `--grant <absolute-path> --freeze <absolute-path>`. Before any helper or Playwright import it checks the grant issuer `/root/qa_lead`, phase `QA-HELPER-CHECK`, `syntheticOnly: true`, `applicationAllowed: false`, `modelAllowed: false`, a nonempty `id`, strict UTC `notBefore`/`notAfter`, the exact `freezeSha256`, and every required frozen file hash. `maxDurationMs`, if provided, must be an integer from 1 to 45000. The deadline is the earliest of invocation plus that duration and `notAfter`; preflight consumes the same budget.

The grant must name `evidenceDirectory` as an existing absolute canonical directory with no symlink component. The checker creates one exclusive timestamp/PID child there. Raw output, summary and browser temporary files are confined to that child; normal Playwright shutdown removes its temporary profiles. A separate grant must be issued for execution. The expired primary-observer grant is not reusable, and this document grants no execution authority.

Future command, after `/root/qa_lead` writes a valid grant at the path below and creates its evidence directory:

```sh
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/test-c4-primary-transition-ledger-v1.mjs \
  --grant /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-primary-transition-ledger-helper-check-grant-v1.json \
  --freeze /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-primary-transition-ledger-checker-freeze-v1.json
```

Each case uses a fresh offline browser context, blocked service workers, an abort-all request route, a restrictive CSP and a self-contained `data:` HTML fixture. Browser control uses Playwright's own local WebSocket. All page request attempts or page errors fail the check. Mutations cross two real rAF callbacks before the next step. Every case stores initial/final HTML, the complete ledger result, first-qualified observer output and per-assertion booleans in `raw-output.json`; `summary.json` carries the verdict and case checks. The original first-qualified sample is read through the frozen stop API, resumed under the same phase, then compared byte-for-byte as JSON against the final prefix.

| Case | Required observation |
| --- | --- |
| A-v1 → A-v2 → A-v1 | All three ordered ledger states; only the first qualified sample for each of the two phase/identity keys. |
| Disappear/reappear | Record → empty → same record retained; one qualified identity. |
| Simultaneous duplicates | Both equal records retained in one ledger array; one first-qualified identity. |
| Original-only change | Only the original article changes; no added ledger state or original-qualified sample. |
| Supplement lineage | Envelope v2, primary v1, supplement classification in both observers; primary-qualified count remains one. |
| Slash ambiguity | Extra slash yields null incident/run IDs and an unqualified incomplete-identity attempt; valid return is retained by the ledger. |
| Reset/pane/run change | Empty reset, new run and pane-only selection remain ordered; the observer qualifies each complete run identity once. |
| Phase reuse | Same label restart adds a phase-start ledger state and no new qualification; different label adds one qualification while retaining the original unchanged sample. |

Limitations: the checker has not run. It deliberately yields between mutations and cannot establish behavior for coalesced synchronous intermediate DOM states. The ledger has no paint, visibility geometry or readability proof. The primary observer still provides only its documented DOM/text-range/hit-test proxy. Headless fixtures do not establish application correctness, real dispatch joins, independent clocks, physical devices, actual audibility or product performance. A new phase can requalify the same immutable envelope; it is not a new dispatch. Only the named Playwright entry and browser executable are frozen here, not all transitive Playwright code or OS/font libraries. Grant issuer identity relies on the trusted QA filesystem, not a cryptographic signature. The deadline watchdog records failure and kills the owned Chromium server process on timeout; host scheduling and cleanup of browser descendants after forced termination remain limitations. Invalid preflight grants fail before imports and do not produce a helper PASS report.
