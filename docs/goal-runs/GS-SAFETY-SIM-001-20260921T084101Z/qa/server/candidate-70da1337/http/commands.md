# Actual HTTP execution commands and artifacts

All scripts are QA-owned under this directory; all imports resolve to the frozen candidate. Execute only with a new resource grant. These commands document the completed run; they are not instructions to restart a released resource.

Pinned runtime: `/home/b/.local/bin/node`. Candidate: `/home/b/.cache/gs-safety-ci.u7pR52`. Absolute QA root: `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/http`.

`setup.mjs` verifies candidate inputs/free4101, creates owner-only private credentials and an absolute freshDB, then executes candidate `src/server/db/migrate.ts` and `seed.ts` with pinned Node `--env-file-if-exists=.env --import tsx`. Logs and setup receipt are under the matching evidence/http directory. No private environment is printed.

`launch.mjs <attempt>` spawns pinned Node with candidate `node_modules/next/dist/bin/next start --hostname0.0.0.0 --port4101`, cwd candidate, private environment. Attempt labels: initial, restart-one, restart-two, restart-three. `stop.mjs <attempt>` checks the owned process receipt/cmdline, sends SIGTERM to that PID only and records absence. No provider process is stopped.

Typecheck form, cwd workspace:

```sh
/home/b/.local/bin/node /home/b/.cache/gs-safety-ci.u7pR52/node_modules/typescript/lib/tsc.js --project /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/http/tsconfig.json
```

Execution form, cwd candidate:

```sh
/home/b/.local/bin/node /home/b/.cache/gs-safety-ci.u7pR52/node_modules/tsx/dist/cli.mjs --tsconfig /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/http/tsconfig.json /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/http/auth-main.ts
```

Completed order after launchinitial: auth-main.ts, seed-support.ts, lifecycle-main.ts (preserved409 setup exit), continue.ts (remaining setup only), device-observation.ts. After stopinitial/launchrestart-one: recovery-one.ts then voice-os-prepare.ts. After stoprestart-one/launchrestart-two: voice-os-observe.ts first. After stoprestart-two/launchrestart-three: voice-os-observe.ts second then final-checks.ts. Each command has its named original redirected log, phase results and shared redacted HTTP ledger. `check` records per-case failures and continues; process exit0 alone never means all cases passed.

After finalstop: closeout.mjs verifies904source/471artifact hashes and private-byte absence; audio-captured-analysis.mjs corrects the scoped-projection interpretation using existing captured data only. No product edits, candidate builds, device/browser controls, provider restart or identical environment retry occurred.
