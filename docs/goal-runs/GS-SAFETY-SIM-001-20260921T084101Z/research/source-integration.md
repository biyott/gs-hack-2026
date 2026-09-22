# Six-source integration evidence

Goal: GS-SAFETY-SIM-001 v1.0. Run: GS-SAFETY-SIM-001-20260921T084101Z. Research owner: R, `/root/research_sources`. Prepared 2026-09-21. This is a source interpretation and handoff, not an implementation or QA acceptance claim.

## Original source preservation

The six public Docmost pages were captured through the same unauthenticated `POST /api/shares/page-info` operation used by their public JavaScript. The request body contains only the page slug ID. All responses contain a complete TipTap document, page title, and original creation/update timestamps. HTML shells are preserved separately; an HTML shell alone was not counted as a captured document.

The authoritative retrieval index is [`../sources/emul-manifest.json`](../sources/emul-manifest.json). Per document, `.original.json` contains the exact API response bytes, `.original.html` the exact public page HTML, `.metadata.json` the URL, retrieval timestamp, source update timestamp, and SHA-256 values, and `.body.md` the readable complete text extraction. Every original text node is present in the readable extraction. There are no embedded image nodes in these six documents. Document 008 has one attachment, also captured as original bytes: [`emul-008-references.zip`](../sources/emul-008-references.zip), with extracted original files in `sources/emul-008-attachment/`. Its public download URL is a time-limited URL supplied by the page; no account credentials or private access were used.

| ID | Exact title | Scope and reference |
|---|---|---|
| 002 | 002-두개의 시뮬레이션 | [Independent engines, stack, simulation controls, profiles, server authority](../sources/emul-002.body.md) |
| 003 | 003- RAG | [Retrieval, generation, validation, knowledge and guidance contracts](../sources/emul-003.body.md) |
| 004 | 004-RAG에 필요한 data 만들기 | [Repeats 003, then adds synthetic knowledge production specification](../sources/emul-004.body.md) |
| 005 | 005- 폰에서 알림처리 방안 | [Flutter guidance coordinator, multimodal lifecycle, event contract](../sources/emul-005.body.md) |
| 006 | 006- 안전관리자 web 서비스 내용 | [Incident-centered administrator flow and immutable first guidance](../sources/emul-006.body.md) |
| 008 | 008-시연 현장·크레인 후보·축척 | [Six crane presets, exact table layout, four device roles and measured input](../sources/emul-008.body.md) |

004 includes a quoted document-generation prompt. Its content is preserved as source data. It is not an authority to change agent rules, source scope, or safety policy. Implementation authorization comes from the user's goal, which explicitly incorporates its data specification.

## Explicit differences and controlling interpretation

The user goal explicitly states how these documents combine. The following rows record that precedence; they do not invent changes to the goal.

| Difference | Source statements | Required integrated treatment | Affected AC |
|---|---|---|---|
| Site cardinality | 003 knowledge contract has `siteId: string`; 004 synthetic YAML has `siteIds: []`. | Normalize `siteId` into a single-element `siteIds` array without losing the original source value. All retrieval applies the requested site filter, including common documents. | 06–08 |
| Common documents | 003 mode type is `equipment \| fire-gas`; 004 adds `common`. | Runtime simulation has two modes. Document kind preserves `common`; eligible documents match requested mode OR common, still under site/approval/time/role/hazard/action filters. Common is not a third simulation and not a site wildcard. | 01,04,06,07 |
| Approval vocabulary | 003 uses `status: draft \| approved \| retired`; 004 creates `approvalStatus: draft`, followed by reviewed `approved_for_demo`. | Preserve four distinct values: draft, approved_for_demo, approved, retired. Synthetic material is searchable in demo only after an actual recorded review and approved_for_demo transition. Never promote it to actual-site approved. Draft, retired, not-yet-effective and expired documents are excluded. | 06–08 |
| Metadata union | 003 includes effectiveFrom/expiresAt, applicableZoneIds and optional substanceIds; 004 YAML adds profileConditions/actionCodes/synthetic/siteIds. | Retain both sets in the canonical knowledge contract. A shorter YAML example does not delete scope, expiry or substance restrictions. | 06,07 |
| Guidance field union | 003 defines `hazardIds`, `primaryMessageKey`, evidence, mode and generatedAt; 005 adds event/version, hazardType/priority, step, map/floor, waypoints/destination, messageKey/args. 006 requires incidentId. | Carry the full union. `primaryMessageKey` and `messageKey` require explicit compatibility mapping. `hazardIds` is an identifier array; `hazardType` is the event category. Preserve separate incident/run/event/guidance identifiers and versions. | 04,08–11 |
| Missing route | 003 allows absent routeVersion; 005 says route-less actions clear waypoints and destination. | No-path, unknown position and explicit shelter are distinct outcomes. A path-free action must not retain a previous route or destination. Do not generate a route or universal stay-put order to fill a missing route. | 02–05,09 |
| First guidance and RAG | 003 delays only supplemental explanation; 006 calls the first transmission “AI 최초 조치.” | “AI” is a product label, not an LLM dependency. Engine action/template goes immediately; administrator acknowledgement and RAG generation are not prerequisites. First transmitted text/version is immutable history. | 08–11 |
| Illustrative extra identifiers | 006 contains a sample warehouse/forklift incident and `PATH-D`; 004 fixes PATH-A/B/C. | Treat 006 sample as an explanation of UI behavior. Do not add PATH-D, a forklift preset, or a new fixed site to the domain inventory. | 06,10,12 |
| Optional or future sensing wording | 002 describes real equipment/UWB integration as future/optional or last in order; 008 describes visual tracking as an added implementation proposal. | The current goal explicitly requires four-phone integration, simultaneous UWB workers and visual-marker tracking. These are required scope; earlier sequencing language does not waive AC-13/16. | 09,13,16 |
| Four versus six crane priority | 008 suggests building 1–4 before 5–6. | Priority is sequencing only. Six presets are required, one placed at a time, default older 60m SK1265. | 12,16 |
| Legacy/current manufacturer variants | 008 fixes old SK1265, Korean Tadano IV, LTM tire/drawing choice, Maeda CE, LR EN-US, tower 2025-02. | Preserve the selected edition/configuration; do not mix current eLift or alternate tire/configuration dimensions. Manufacturer corrections must be explicit evidence, not silent model changes. | 12 |
| Work envelope versus danger envelope | 008 gives max radius, dimensions, support and tail measurements. | Keep transport envelope, deployed support envelope, support centers, pad outer edges, boom length, working radius and hook height distinct. Do not use maximum working radius as a universal danger radius. Verified geometry and implemented motion determine demo risk. | 02,12 |
| Site fact versus reconstructed map | 008 identifies a real HVO/SAF project, but the 140×50m local layout is synthetic. | Label “서산 HVO 현장 참고 / 상세 배치 재구성”, preserve synthetic=true and source references. No real internal survey, installed-equipment or safety approval claim. | 12,16 |
| Fixed scale versus whole crane range | 008 notes 60m full sweep exceeds the table width and mentions theoretical alternative scales. | Keep approved 1:100. Table-linked SK1265 slew is demo-limited to ±15°. Whole-site view keeps full real size/range and marks outside-table areas unobserved. The hypothetical 1:240/1:300 is explanatory, not an approved scale. | 12,13 |
| Device inventory versus capabilities | 008 records S24+ ×2, user wording “Galaxy Z Fold8 와이드”, and Note20 Ultra, with source claims of UWB support. | These are preparation inventory, not a whitelist or permanent role assignment. Actual model/OS/permissions/session capacity and two-worker simultaneous results must be measured. A vendor support listing does not pass device tests. | 09,13,16 |
| Measurement versus coordinate | 008 permits nullable distance/angles and warns range alone cannot fix 2D position. | Preserve tableDistanceM/worldDistanceM and source, last observation and error status. Do not synthesize xy from range alone or label visual-marker coordinates as UWB. Device/world offsets require calibration. | 13,15 |
| Risk clear versus passage reopen | 002 and 004 explicitly separate risk release from reopening; 006 has administrator release/closure. | Incident acknowledgement, mute, hazard-clear, passage-reopen, closure and worker receipt/understanding/arrival/support acceptance remain separate recorded transitions. | 03,05,10,11,14 |

## Literal identifiers and values for contract owners

- Simulation modes: `equipment`, `fire-gas`; knowledge-only additional kind: `common`.
- Guidance generation modes: `template`, `rag-assisted`.
- Sites: `SITE-CONSTRUCTION-01`, `SITE-INDUSTRIAL-01`; fixed detail map identifier stays SITE-CONSTRUCTION-01.
- Equipment instance: `EQUIPMENT-A`. Physical worker roles WORKER_1→WORKER-A and WORKER_2→WORKER-B. WORKER-C is optional virtual data, never a third measured worker.
- Paths: PATH-A/B/C; zones: ZONE-A/B/C; refuge candidates: REFUGE-01/02; destination concepts: ASSEMBLY-01, SHELTER-01; synthetic substance: DEMO-GAS-X.
- Allowed action codes: ALERT_HAZARD, FOLLOW_VALIDATED_ROUTE, GUIDANCE_UPDATED, ROUTE_UNAVAILABLE, POSITION_UNKNOWN, SENSOR_UNKNOWN, REQUEST_ASSISTANCE, SHELTER_PER_SCENARIO, CONFIRM_UNDERSTANDING, CONFIRM_ARRIVAL, AWAIT_REOPEN_AUTHORIZATION.
- Initial synthetic document version: 0.1.0; original approvalStatus: draft; sourceReference prefix: synthetic://safety-simulator/. Required set: COMMON-001…004, EQ-001…006, FG-001…008 (18). Required section sequence and exact topics are in the latter half of 004.
- Retrieval outcomes: matched, no_match, conflict. Each test includes testId, simulationType, context, query, expectedDocumentIds, forbiddenDocumentIds, expectedActionCodes, expectedOutcome, reason.

## Source statements that do not establish current execution evidence

008 reports that an earlier investigation rendered PDF pages and inspected an existing model. The attached images and existing files are evidence references, but do not prove this run built six assets or executed Blender. Its Samsung support statements do not prove that four physical phones are available or that ranging works. All new builds, tests, model/provider calls, tracking, measurements, and QA results require this run's actual evidence.

The six source bodies contain no unresolved product-scope contradiction after applying the user's explicit integration rules above. Remaining manufacturer geometry/configuration details and device behavior are verification questions, not grounds to narrow scope. A primary-source contradiction affecting fixed geometry will be escalated to the relevant Lead with its evidence and decision impact.
