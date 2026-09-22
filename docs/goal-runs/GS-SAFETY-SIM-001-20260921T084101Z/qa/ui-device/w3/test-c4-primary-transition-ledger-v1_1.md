# C4 ledger checker v1.1 — narrow environment correction

Source preparation only. The parent alone owns any newly granted serial retry. No browser, helper, application, generator or model was executed during this change; only syntax checking is allowed. All v1 source, freezes and failure evidence are preserved.

This file is the scoped diagnostic journal for the three newly owned artifacts: `test-c4-primary-transition-ledger-v1_1.mjs`, `c4-primary-transition-ledger-checker-freeze-v1_1.json`, and this document. They are permanent review artifacts, not runtime residue. The derivative changes only temporary-directory allocation, environment lifetime, cleanup reporting and required original-failure provenance; the eight cases, fixtures, expectations, frozen helper paths/hashes and existing grant/deadline guards remain unchanged.

## Recorded failure and hypotheses

Existing evidence: `evidence/qa/ui-device/candidate-cd8a2428/timing-helper-check-01/ledger-2026-09-21T18-21-00-941Z-1003357/raw-output.json` and its `summary.json`, relative to the goal-run root. The recorded run began `2026-09-21T18:21:00.941Z`, ended `2026-09-21T18:21:01.785Z`, reported `FAIL`, `timedOut: false`, and `cases: []`.

1. **Socket-path capacity — supported by the actual fatal diagnostic.** Chromium PID `1003434` reported `FATAL:chrome/browser/process_singleton_posix.cc:313] Socket path too long` for the long evidence-root path ending in `/browser-tmp/org.chromium.Chromium.bBLFHh/SingletonSocket`, then exited with `signal=SIGABRT`. V1 assigns that long directory to `TMPDIR` before launch. Proposed correction: short temp root.
2. **Filesystem permissions — not supported as the observed failure.** The retained log shows an executable PID and process-singleton startup, with an explicit path-length fatal rather than `EACCES` or `EPERM`. This does not prove every future path is writable. The derivative will require its newly allocated directory to be canonical and private. Alternative correction, if demonstrated: repair ownership.
3. **Executable/runtime incompatibility — not supported as the observed failure.** The frozen executable starts and emits a specific socket-path diagnostic. Later missing CPU-frequency sysfs messages occur after that fatal. No evidence presently justifies replacing Chromium, flags, Playwright or helpers. Alternative correction, if demonstrated: rebind runtime.

The retained fatal identifies the immediate startup failure; successful short-path behavior remains **unverified** until the parent's single authorized environment retry. No toggle proof, helper PASS or product PASS is claimed. References read: debugging Node runtime, Playwright tooling, setup, investigation, fix and partial-runtime-evidence guidance.

## Prepared source and future execution

After all existing grant/freeze checks, v1.1 validates the original raw-output and summary hashes plus their FAIL/zero-case/socket-fatal/SIGABRT evidence. These original bindings are copied into both new output receipts. Original raw SHA-256 is `5124375651dfd460b40da65e53ba78876cfa64f29d958f87a35c2f01e19dc4f0`; original summary SHA-256 is `99c372e31b2d520a83c24df0bf662a040042d3d30a006d57995f0b93f88193c5`. Chromium's launch command and stderr are embedded in both JSON error arrays; there is no separate original log file.

Immediately before its owned `chromium.launchServer` call, the checker allocates `/tmp/gs-c4-ledger-XXXXXX` with `mkdtemp`, checks canonical location and private permissions, records the actual path and owner PID/UID, then temporarily assigns `TMPDIR`. The launch `finally` restores the original environment even if launch fails. Browser and server closure are attempted separately; after server closure the checker removes only the exact directory returned by `mkdtemp` and records the result. Evidence stays in the long grant-designated directory. The frozen Playwright launch code at `node_modules/playwright-core/lib/coreBundle.js:39760` and `:39768` reads `os.tmpdir()` when allocating its launch artifacts/profile, consistent with this launch-only override.

The existing hard watchdog remains at the earlier of 45 seconds, the grant maximum duration and its UTC end. At a hard timeout it restores the environment, signals the owned server and records the exact temp path as retained because process exit is not yet proven; it does not remove a live browser's directory. Closure/cleanup failures prevent PASS and remain visible in both receipts. Successful launch and cleanup are unverified until the parent's authorized retry.

Future command, **not executed**, requires a newly issued exact-freeze grant and an existing canonical evidence directory:

```sh
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/test-c4-primary-transition-ledger-v1_1.mjs \
  --grant /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-primary-transition-ledger-helper-check-grant-v1_1.json \
  --freeze /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-primary-transition-ledger-checker-freeze-v1_1.json
```
