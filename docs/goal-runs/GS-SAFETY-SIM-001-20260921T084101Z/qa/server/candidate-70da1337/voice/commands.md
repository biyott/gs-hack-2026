# Commands and execution boundaries

The exact initial invocation used candidate cwd `/home/b/.cache/gs-safety-ci.u7pR52`. QA config explicitly places Vite cache and every database/output outside the candidate. No install/build/server command was run.

```bash
QA_RUN_TAG=attempt01 /home/b/.local/bin/node /home/b/.cache/gs-safety-ci.u7pR52/node_modules/vitest/vitest.mjs run --config /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/voice/vitest.config.mjs --configLoader runner --reporter verbose --reporter json --outputFile.json /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-70da1337/voice/attempt01-report.json
```

At that execution only `s17.test.ts` and `s23.test.ts` existed:24 tests passed. stdout/stderr were redirected to `attempt01.log` in the same evidence directory.

```bash
QA_RUN_TAG=extension02 /home/b/.local/bin/node /home/b/.cache/gs-safety-ci.u7pR52/node_modules/vitest/vitest.mjs run negative.test.ts recovery-durability.test.ts --config /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/voice/vitest.config.mjs --configLoader runner --reporter verbose --reporter json --outputFile.json /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-70da1337/voice/extension02-report.json
```

This ran only newly added cases; stdout/stderr were redirected to `extension02.log`. To reproduce later, use a new QA_RUN_TAG and new output filenames so original evidence is never overwritten. A run without positional filters now selects all38 cases; the initial24-case command above is historical provenance, not a promise that rerunning it selects the old file set.

Strict typecheck, from workspace root:

```bash
/home/b/.local/bin/node /home/b/.cache/gs-safety-ci.u7pR52/node_modules/typescript/bin/tsc --noEmit --project docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/voice/tsconfig.json
```

No credentials are passed in commands. The harness generates random secrets only in memory and uses real auth to obtain sessions; it records application snapshots and event/request identities without sessions/tokens.
