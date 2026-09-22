# C4 app-origin source-site proposal

Status: **SOURCE_PROPOSAL_REQUIRES_TECH_CONCURRENCE**. This is static source evidence, not an approved binding, execution grant, runtime origin proof or performance result. The companion JSON is intentionally rejected by `verifyOriginRules` until Technical concurrence produces a separate exact-hash binding with status `APP_ORIGIN_SOURCE_BOUND` and a future performance grant binds that approved artifact.

Candidate: `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`; build: `czkc6DgDv3UUlTrSfDMqX`; root: `/home/b/.cache/gs-safety-c4.q2FD40`.

All spans below are one-based UTF-16 columns, inclusive, covering only the actual call expression. Semicolons and neighboring code are excluded. Independent static span review agreed. The two compiled snapshot expressions each occur once.

| Endpoint | Compiled chunk span | Exact compiled expression | Corresponding route.ts span | Expected property-call column |
| --- | --- | --- | --- | --- |
| `events-route-publish-enqueue` | line 5, columns 237–253 | `r.enqueue(w(e,t))` | line 68, columns 11–52 | compiled 239; mapped 22 |
| `events-route-pull-enqueue` | line 5, columns 486–502 | `e.enqueue(w(t,n))` | line 85, columns 29–70 | compiled 488; mapped 40 |

Both route expressions are `controller.enqueue(frame(snapshot, fresh))`. Static Base64-VLQ decoding maps the compiled receiver/property anchors to the exact source receiver/property anchors. The map's `sources[0]` is `../../../app/api/events/route.ts`; its UTF-8 `sourcesContent[0]` is byte-identical to the frozen route. The generated line contains no non-BMP characters before these sites, so the independently derived character and UTF-16 columns agree.

Expected V8 columns are the `enqueue` property-name positions and their source-map images. They are source-derived expectations, not observed stack output. A future process may emit compiled paths or source-mapped paths, including when `--enable-source-maps` applies. The JSON proposes both precisely mapped representations without assuming either will appear. Actual PID, prototype/controller identity and callsite representation still require authorized runtime evidence. Unexpected paths/columns fail closed; do not widen the window to make them fit.

Heartbeat is excluded in both representations: compiled line 5, columns 364–401 (`r.enqueue(c.encode(": heartbeat\\n\\n"))`, property column 366), and route line 76, columns 13–65 (property column 24). It encodes an SSE comment and is not a snapshot dispatch. `excludedSites` are explanatory only and never join the allowed `sites` array.

| Frozen artifact | SHA-256 |
| --- | --- |
| `.next/server/chunks/[root-of-the-server]__0rl-yj5._.js` | `1feca21806f2a135b3c39081d0dbd4468ddcb58e1a9513458847491f12048c96` |
| `.next/server/chunks/[root-of-the-server]__0rl-yj5._.js.map` | `69f3bf1cdca1654d36fe8f07423803b8cd060fa98a82ab1d80133c98d47cf667` |
| `app/api/events/route.ts` and map source content | `484f580f150f8d97cab3910b8c5a09b1694ffb9083f93f3d3befb0ab9f0b9e22` |

Only text/hash reads and offline static source-map parsing were performed. No Node import, compiled-artifact execution, checker, application, browser or network activity was performed. Candidate files and all previously frozen observer files remain unedited. Static origin mapping does not replace controlled-command, administrator/controller association, independent clock or log binding evidence.
