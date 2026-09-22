# Q-SERVER source and readiness audit v1.0

Prepared 2026-09-21 by `/root/qa_lead/qa_server`, with independent read-only source mapping by `/root/qa_lead/qa_server/source_cards`. Covers AC01–05,10–11,14. No G3 candidate has been submitted and no product acceptance execution occurred. Source gaps below distinguish explicit goal requirements from source examples; readiness gaps describe an evolving checkout, not a failed candidate.

## Sources and normalized expectations

The three archived body hashes are fixed in `fixtures-v1.json`. Source acquisition metadata records public retrieval at 2026-09-21T08:46:35Z and preserves title, source update time, raw JSON/HTML and body hashes. The explicit goal and frozen G0 protocol control where they strengthen or normalize the sources.

| Coverage | Source anchor | Required observation / normalization |
| --- | --- | --- |
| AC01 reproducibility | [002, 지도 및 시나리오 구성](../../sources/emul-002.body.md#지도-및-시나리오-구성), lines 187–216; implementation criteria lines 239–252 | Scenario ID/mode/map/version, profiles/positions, event schedule, policy, duration, seed and expected results are inputs. Goal AC01/G0 additionally fixes fresh DB and three repetitions. A scenario file's presence is not evidence the full run executes. |
| AC02 equipment | [002, 시뮬레이션 1](../../sources/emul-002.body.md#시뮬레이션-1-중장비작업자-위치-기반-위험-회피), lines 48–90 | Projected movement overlap with worker position/planned route; approach/speed/heading changes; constraints, no-route, position loss, arrival. Goal A additionally insists on graph-connected safe refuge candidates and rejects invented paths/universal wait. |
| AC03 fire/gas | [002, 시뮬레이션 2](../../sources/emul-002.body.md#시뮬레이션-2-화재가스-기반-위험-회피-및-행동-안내), lines 91–139 | Time-varying synthetic fire/gas/compound zones, blocked routes, explicit shelter policy, no route, disconnected/stale sensors, distinct release/reopen. DEMO-GAS-X has no real gas interpretation; no CCTV-only gas inference or diffusion claim. |
| AC04 isolation | 002 implementation criteria lines 239–252; [005, 화면·음성·진동](../../sources/emul-005.body.md), lines 84–130 and connection management lines 143–154 | Common envelope does not permit mode/run state mixing. Reset invalidates old guidance; stale identity/version/map/expiry cases stay inert. Goal/G0 makes the 1000-envelope series explicit. Server and client enforcement require separate evidence. |
| AC05 profiles | 002 common personalization lines 140–155; 005 personalization/RAG lines 132–141 | Structured confirmed capabilities, preference, assistance/escort, notification settings and verification time/version. No language or mobility inferred from nationality/age/gender. Missing data stays unknown. Receipt, understanding, support acceptance and arrival are separate facts. |
| AC10 first guide | [006, 위험 발생 시 동작 흐름](../../sources/emul-006.body.md), lines 28–55; first-action display lines 87–132; intervention lines 134–166 | First urgent guide precedes RAG/admin confirmation. Exact dispatched text, language, profile, path, destination and evidence are joined by guidance ID/version; later intervention creates a later version, preserves first history, and records actor/time. Showing only the latest guide cannot satisfy this. |
| AC11 recovery | 005 lines 143–154; 006 common completion criteria lines 168–177 | One client subscription, latest snapshot on reconnect/foreground, first-history recovery, deduplication and multi-admin consistency. CCTV/audio/position failures remain distinct. No stale audio or event replay may become current action. |
| AC14 auth/storage | 002 technology/server/implementation sections; 006 intervention lines 149–177; goal AC14 and constraints | Sources require permission-based release/close and actor/time records. They do not prescribe a complete role/ACL or login schema; the implementation must publish these. Goal explicitly adds denied-request tests, server-only DB and secret/minimal-profile boundaries. |

Source006's `PATH-D` in the explanatory first-action example (lines 118–121) is not a confirmed map identifier. The goal explicitly prevents adding it to the actual map solely from this example. Shared functions across modes do not authorize shared mutable risk/run state. A locale field required by a transport schema is a resolved rendering locale; it must not erase an unknown worker preference.

## Observed readiness at 08:54–08:56 UTC

Read-only inspection found `packages/contracts/src/core.ts`, `guidance.ts`, `state.ts`, and `commands.ts` with version 1.0.0. They provide useful names for later adapters: SimulationSnapshot, WorkerProfile, Guidance, SimulationCommand, IncidentAction and WorkerResponse. At this inspection time no published `docs/contracts` API guide, usable `app/api` route surface, map/scenario/policy files or seed/migration entrypoints were available to this slice. Such files may appear as implementation continues.

`src/server/db/index.ts` and `src/server/auth/sessions.ts` explicitly threw NOT_IMPLEMENTED, while scenario batching and geometry functions had placeholders. These are implementation-readiness observations only. No attempt was made to execute or grade these incomplete functions. Node v22.23.2 and pnpm were found; dependencies/build/startup were not attempted by QA.

| Gap | Why harness binding waits | Needed from technical/backend owner via QA Lead |
| --- | --- | --- |
| Session interface | Shared SessionRequest currently uses role/actor/accessCode while internal auth types use accountId/PIN. QA must not guess login behavior or emulate authorization. | Canonical public endpoint/request, bootstrap accounts, authenticated identity mapping, role matrix, session expiry/revocation and safe QA setup. |
| Fresh DB isolation | package scripts name db:migrate/db:seed, but implementation/env binding was not available at inspection. Importing a singleton before isolation is known may write the developer DB. | Documented SQLite path variable, migration/seed commands and reset behavior; no import side effects outside explicit QA path. |
| Deterministic runner | Clock types exist, but full engine/scenario contracts and expectations were not published. | How to select scenario/seed/clock, advance exact virtual time, pause/restart, access stable map/graph inputs and expected outputs. |
| HTTP/SSE recovery | Mutation shape exists, transport endpoints/cursor and snapshot consistency were not yet published. | Endpoint paths, SSE event names/payload, Last-Event-ID semantics, subscription cleanup, auth transport and recovery procedure. |
| Persistence audit | First/current guidance, versions and response fields are promising contracts; durable schema/queries were pending. | Incident/guidance/audit/response tables, immutable first-history constraint and recovery semantics. |
| Candidate freeze | Shared files were actively being authored. A Git commit would also miss uncommitted candidate content. | G3 candidate ID and complete content manifest, stable copy or before/after hash verification, nonsecret config and toolchain versions. |

The A/B profile conditions fit the then-current WorkerProfile contract. C's null preferred locale/capability/time fields are representable, but required resolved `locale` must use explicit documented fallback; no capability can silently become unrestricted. The public schema has no demographic fields, which is compatible with data minimization if rejected/ignored without changing confirmed behavior. This is a test binding issue, not a request to collect more personal data.

## Harness readiness

`test-cards-v1.md` and `fixtures-v1.json` are ready for QA Lead review. An executable HTTP/DB adapter is intentionally pending canonical contracts rather than inventing product endpoints. Once published, keep all adapter code under this `qa/server/` directory and all isolated outputs under `evidence/qa/server/`; import product definitions read-only and derive route expectations independently. Preparatory adapter checks do not become final QA evidence until QA Lead assigns the frozen G3 candidate.

Device speech/vibration, actual browser operation, physical phone roles and actual LLM calls remain other environment slices. The server cards supply joining evidence without promoting those slices to PASS.
