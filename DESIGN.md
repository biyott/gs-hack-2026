# GS Safety Operations — Design System

Version 1.0.1 · GS-SAFETY-SIM-001 · 2026-09-21. Design contract precedes UI production. G0 registered 08:50:12.231Z; objective visual QA remains independent and this document is not a pass verdict. Version1.0.1 adds executable articulated-boom constraints without changing UI tokens or acceptance scope.

## 0. Research Log

- Embedded references: shortlisted Linear, Vercel, Supabase; selected frontend `soft-skill` + `linear.app` for layered graphite surfaces, compact controls, precise typography, and one dominant work surface. Safety usability overrides marketing-only giant whitespace, delayed reveals, decorative motion, and floating navigation.
- Lazyweb: two queries (`industrial monitoring dashboard`, `operations map dashboard`), six screens viewed. Better Stack full-product canvas/right inspector and Dash0 topology preview support the dominant-map/stable-inspector grammar. Evidence and limits in `.omo/teams/team-08d29e60/artifacts/design-research.md`.
- Concept drafts: `resources/design/safety-console-concept-01-right-rail.png` and `safety-console-concept-02-bottom-ledger.png`, generated with built-in imagegen and reviewed. Draft01 is the composition/material reference. Its crane, hazard, date, emoji-like icons and telemetry are illustrative and expressly excluded from fidelity: real GLBs, SVG icons and authoritative state replace them. Draft02's invented acknowledgements are rejected. Both lack the required immutable first-guide detail and freshness, which section5 requires. Prompt/evidence record: `.omo/teams/team-08d29e60/artifacts/concept-drafts.md`.
- Original requirements: archived emul 002–008; 008 fixes the coordinate and asset contract in section 9. Existing SK1265 asset is preserved.

## 1. Atmosphere & Identity

A focused safety operations room: calm graphite framing, a bright and legible site map, precise time and provenance, and restrained semantic color. The signature is a wide map stage bordered by a compact scenario rail and incident ledger. People and the next action are always more prominent than raw telemetry. This is a simulation product: show `시뮬레이션 / SIMULATION` persistently, and `서산 HVO 현장 참고 / 상세 배치 재구성` adjacent to site context. Do not use a GS logo without a supplied licensed asset.

Personas: Korean operator scanning two workers; English worker under stress; worker with verified mobility constraints; demo operator configuring devices; reviewer reconstructing what the system first delivered. These users need distinct language and delivery states, large actions, and truthful empty or uncertain states.

## 2. Color

Dark shell with light map and optional light document surface. CSS names are the contract; derive alpha tints from these colors only.

| Token | Value | Purpose |
|---|---|---|
| --surface-base | #0B1118 | App canvas |
| --surface-panel | #111C28 | Sidebar and panels |
| --surface-raised | #192838 | Menus and active surfaces |
| --surface-hover | #23374A | Hover and selected neutral |
| --text-primary | #F5F8FC | Main shell text |
| --text-secondary | #B9C8D8 | Supporting text |
| --text-muted | #93A7BD | Timestamps and quiet labels |
| --border-subtle | #2C4054 | Structural separators |
| --border-strong | #536B83 | Form boundaries |
| --accent | #73C9F2 | Focus, links, selection |
| --accent-hover | #A9E0FA | Hover |
| --on-accent | #082638 | Filled control text |
| --state-safe | #72DCB0 | Confirmed current safe/complete |
| --state-caution | #FFD07B | Caution, profile/position uncertainty |
| --state-danger | #FF9191 | Danger, blocked route, urgent support |
| --state-info | #9CBEFF | Informational or receiving |
| --state-offline | #BCC6D0 | Disconnected/unavailable |
| --map-ground | #E9EEE9 | Neutral field |
| --map-road | #C8D3D0 | Defined traffic lanes |
| --map-text | #193332 | Map label text |
| --map-route | #176B53 | Valid current route |
| --map-danger | #B62735 | Hazard outline/hatch |
| --map-caution | #90620B | Caution outline/hatch |
| --map-water | #B2D8DF | Background water, illustrative |
| --map-structure | #819A9D | Simplified industrial context |

Semantic colors always pair with text and icon/shape. Safe: check/circle; caution: triangle; danger: octagon/alert; offline: dashed outline. Hazard fills are translucent with opaque patterned outline. Green is never a general decoration. Do not label a refuge safe until current connectivity and hazard evaluation permit it.

## 3. Typography

Primary stack: `"Pretendard Variable", "Noto Sans KR", system-ui, sans-serif`. Prefer a locally bundled licensed Korean/Latin font; if unavailable record font loading evidence and use the named accessible fallback. Monospace: `ui-monospace, "Cascadia Code", monospace`, only IDs and technical readouts. Use tabular numerals for time, distances, counts. Korean text uses normal tracking and word-break keep-all with overflow-wrap anywhere for IDs.

| Token | Size/line height | Weight | Use |
|---|---|---|---|
| --type-display | 32px/1.2 | 650 | Mode chooser title |
| --type-title | 24px/1.35 | 650 | Page title |
| --type-section | 18px/1.4 | 600 | Panel heading |
| --type-body | 16px/1.55 | 450 | Normal body and worker action |
| --type-small | 14px/1.5 | 450 | Dense operational table |
| --type-label | 12px/1.45 | 550 | Supplementary labels only |
| --type-action | 24px/1.4 | 650 | Worker emergency action |

No essential instruction below 14px. Worker action uses 24px minimum and grows with OS text scale. Do not put Korean in all caps. English uppercase is limited to compact provenance tags.

## 4. Spacing & Layout

Base 4px; --space-1..6 = 4/8/12/16/20/24px; --space-8=32px; --space-10=40px; --space-12=48px. Radii: --radius-control=8px, --radius-panel=14px, --radius-stage=18px, --radius-pill=999px. Control minimum height 44px; worker primary action 56px. Icon 20px, compact supplementary 16px. Thin line SVG icons only.

Desktop ≥1280px: 64px masthead, 224px left scenario/navigation rail, minmax(0,1fr) stage, 328px incident/worker rail, 16px gaps. Main stage contains mode/title/status, large map or 3D view, compact execution controls, then event history; the map dominates the first view. Panels own their scroll with min-block-size:0. Content data must never be hidden under fixed controls.

Tablet 768–1279px: navigation becomes a 64px compact rail; incident details open inline below the map or accessible drawer. Phone <768px: one column with 16px gutters, compact mode header, map, current actions, controls, incident details. Avoid horizontal scrolling except within labeled data tables. 375px width, 200% zoom, 80-character identifiers and bilingual text are required stress cases. The worker app prioritizes action then 2D map and three distinct acknowledgements.

The shared 2D/3D map viewport uses `--site-stage-height: 630px` at widths ≥768px and `--site-stage-height-compact: 480px` below 768px, 1.5× the original 420/320px heights. Its surrounding controls remain outside the viewport. A labeled native speed select beside the virtual clock offers 0.25×, 0.5×, 0.75×, 1×, 1.2×, 1.4×, 1.5×, 1.6×, 1.8×, 2×, 2.5×, 3×, 4×, 6×, 8×, 12× and 16×; a mode without a previous selection defaults to 1.5×. Each mode retains its selected speed through reset, scenario changes and server restart. It displays the server-confirmed speed and is disabled for read-only roles and while commands are pending. Narrow controls wrap without horizontal overflow. Demonstration timelines finish within nine virtual seconds: nine seconds at 1×, six seconds at the default 1.5×; slower rates deliberately take longer.

## 5. Components

Every primitive is rendered in a `/design-system` or equivalent showcase before product screens, with default/hover/pressed/focus/disabled/loading/empty/error states at 375/768/1280px. Frontend owns that executable evidence.

| Primitive | Anatomy, state, accessibility and layout |
|---|---|
| AppShell | Header + navigation + main + contextual aside; landmarks, skip link; shell scroll with each long panel explicit |
| Panel | Outer dark bezel, inner raised core, heading/actions/content; 16/24px padding; no click behavior on a passive panel |
| Button | Icon optional + verb label; primary/secondary/danger/quiet; visible focus, aria-busy loading, actual disabled; 44px minimum; no color-only meaning |
| SegmentedControl | Labeled group, buttons or native radio semantics, current option, arrow-key navigation only when valid radio model; mode switch invalidates old guide visibly |
| StatusBadge | Icon + complete text + optional freshness; safe/caution/danger/info/offline/synthetic; never status by hue alone |
| Field | Explicit label, control, hint/error; native select preferable; unit is separate visible suffix; 44px height |
| WorkerCard | Identity/language + position provenance + current action + separate device receipt/understanding/support acceptance/arrival; selected card connects to map focus |
| Metric | Quiet label, tabular value, unit and observation time/source; null shows `미확인 / Unknown`, never zero |
| IncidentTimeline | Ordered list of timestamp, event, actor, state; first delivered guide immutable and shown separately from current guide and later retrieved explanation |
| GuidancePanel | Primary current action; route or explicit route absence; immutable first delivery; RAG evidence lower priority, source/status/version visible, untrusted text inert |
| SiteStage | Accessible region and textual site summary; 2D/3D tabs; zoom/reset/full extent; compass says local axes, not north; legend and scale always visible |
| CameraPanel | Actual image/video frame, capture/receipt time, FPS and source; disconnected state plain; never synthetic frame presented as live |
| DeviceRoleCard | EQUIPMENT/WORKER_1/WORKER_2/CCTV capability check, occupied state, reason for unavailable, reselect action; no model whitelist |
| Banner | Scope or connection message with icon/text; assertive only for new urgent action; old position/route has visible stale indication |
| EmptyState | Short current condition + valid next action; no fabricated values, routes, live cameras, or completed acknowledgements |

## 6. Motion & Interaction

Tokens --motion-fast=120ms, --motion-standard=200ms, --motion-ease=cubic-bezier(0.2,0.8,0.2,1). Motion only communicates control or panel state. Transform/opacity only. Press scale .98 is optional; focus never depends on animation. Reduced motion disables transitions and camera flights. Safety content is updated immediately; no reveal delays. Announce new guidance once per guide ID/version, not every position tick. Map animation never interpolates across a stale gap or disguises absent measurements.

Scripted synthetic movement follows adjacent scenario keyframes continuously on the server. The web map bridges fresh synthetic position updates with a bounded 100 ms frame animation shared by 2D and 3D; it does not predict beyond the last received target. Measured, manual, unknown and stale positions remain authoritative, and run/source changes or pauses stop interpolation. Hazard geometry, route validity, guidance and controls always use the latest server state. Reduced motion shows the latest synthetic position directly.

## 7. Depth & Surface

Mixed tonal hierarchy: base → panel → raised, with a subtle inset top highlight and border separating controls. Stage bezel uses panel background + 4px inset, inner radius 14px. Floating menus may use shadow `0 12px 40px #00000033`; passive cards use no heavy shadow. Do not blur operational text, add decorative gradients, or create floating buttons that cover map controls. 3D depth comes from actual lighting/materials/geometry, not a screenshot background.

## 8. Accessibility Constraints & Accepted Debt

Target WCAG 2.2 AA, body contrast ≥4.5:1 and nontext control/focus contrast ≥3:1. Verify computed colors, keyboard operation, landmarks and labels; screenshots alone cannot establish accessibility. Color has redundant icon/label. Focus 2px accent with 3px offset. Dialog traps focus and returns it to its trigger. Tooltip information also exists in visible text or accessible labels. Language switch applies to screen and TTS; unsupported language displays a reviewed fallback. Alert audio failure preserves screen and available vibration. Consent/understanding/arrival remain distinct controls and states.

Accepted debt: none authorized. Pending font, research, screenshot, assistive-technology, device and 3D verification are open work, not accepted debt or proof of completion.

## 9. 3D Asset and Coordinate Contract

Agreed with technical lead before production. `SITE-CONSTRUCTION-01`, mapVersion `1.0.0`, floorId `GROUND`; logical XY meters, local +X along 140m edge and +Y along 50m edge. Blender XY ground/Z-up; GLB standard Y-up export. Three position `[mapX, height, -mapY]`. Equipment root origin is ground projection of slew axis; zero heading/+X boom. Root scale always `(1,1,1)`. 1 unit=1m. Table centimeters equal map meters; table meters multiply by 100 only at observation adapter. Distance-only UWB creates no XY point.

Asset IDs and paths: `sk1265-at6`, `tadano-gr250n4`, `liebherr-ltm1050`, `maeda-mc305`, `liebherr-lr1100`, `liebherr-172ecb`, served at `/assets/cranes/<id>.glb`. Source `.blend` and generation/verification files live in `resources/blender/safety-simulator/`; original SK1265 files remain untouched. Site `/assets/site/hvo-demo.glb`; catalog `data/equipment/catalog.json` schemaVersion `1.0.1`, with the earlier `catalog.v1.0.0.json` retained. Keep individually loadable assets and only one equipment instance at once. One file may contain preserved named motion nodes `SLEW`, `BOOM_PIVOT`, `TELESCOPIC_n`, `TROLLEY`, `HOOK` only when implemented; catalog declares node mapping and supported controls. A named node is not motion verification.

The site is synthetic 140×50m: crane (30,25), work x15–100/y12–38, stock x55–75/y17–29, destination x80–95/y17–29, obstacle x105–120/y18–30/z0–6, corridor centerlines y8/42 x8–132 width4, refuge candidates (125,8)/(125,42), workers (65,25)/(90,40). Industrial context outside the rectangle is illustrative. No actual measured HVO plant layout is claimed.

Catalog separates official dimensional metadata, chosen demo pose, visual approximations, and verified engine geometry. Unknown values are null with notes. Transport envelopes never replace deployed collision geometry. SK1265 original 60m + 37.2m jib underside + 35m hook, support centers 7.95×7.66. LTM max supports 7.151×6.4. Maeda pad outer front/rear widths 4.808/4.704 and length 5.170, not support centers. LR boom32/no fixed jib. 172 tower16 HC175/UC-0460m/jib50/hook42.3. Detailed manufacturer mapping remains in catalog.

SK1265 tabletop slew ±15° is a demo rule, not a machine limit; full extent preserves full 60m radius. Outside the physical table show `실측 범위 밖 / Outside observed table`. Model change invalidates old hazard/route/guide versions before displaying new calculations. Server hazards are separate geometry; never derive safety from decorative meshes or treat maximum reach as universal danger radius.

Acceptance evidence: six GLBs load through actual loader, six editable sources open, meter bounds/key dimensions compared, sources cited, screenshots captured, motion controls exercised only where declared. Visual approximations remain documented. Final QA Lead decides AC-12/13, not this contract.

### Articulation contract 1.0.1

Catalog schema 1.0.1 adds typed `articulation`; shared wire snapshot stays 1.0.0. Telescopic mobile cranes provide angle, overlap-preserving section extension and hoist. LR remains the fixed 32 m assembly and provides luff/hoist. A false control while production is pending is an implementation gap, not proof a real machine lacks that mechanism. Final scope includes every required model-appropriate motion.

`boom` identifies pivot/GLB-localZ angle sign, physical tip and nested localX extension stages with length shares. Apply pose-minus-baseline deltas to the original loaded transforms, then update world matrices. `hook` follows the physical tip's worldXZ while worldY equals the server's chosen hook-height datum. `links` name normalized local+Y meshes and their endpoint empties. They are positioned/oriented/scaled between endpoints using explicit start/end fractions and rest lengths. This one mechanism covers hanging ropes, boom pendants and split hydraulic barrel/piston. Ropes remain attached and vertical through angle/length/hoist changes; source physical maxima and safe chosen demonstration ranges remain separate. Slider ranges and server validation use declared demo ranges, not unverified manufacturer mechanics. Underflowing rope length, overlapping telescopic sections, unavailable nodes or nonfinite transforms are failures, not clamped visual success.
