# Independent source expectations

Preparation oracle for Q-UI-DEVICE, not observed product behavior. Controlling inputs are unchanged acceptance/G0, archived sources005/006/008, research/source-integration.md and frozen G3 DESIGN.md when submitted. Current design draft is v1.0.0. All dimensional values below are meters unless stated otherwise.

## Six fixed crane configurations

| Asset ID / model | Fixed source edition | Independent dimension/config expectations | Interpretation to preserve |
| --- | --- | --- | --- |
| sk1265-at6 / Spierings SK1265-AT6 | Older60m `Specs-SK1265_EN.pdf` p1,2,7; drawing121-00126107A | Transport16.279×3.000×4.000; default horizontal jib60; underside37.2; hook35.0; wide support transverse7.66, each drawing-row longitudinal span7.95 | No current eLift height substitution. Transport length not deployed bare chassis. Four support centers side-asymmetric; see RC-001 below. |
| tadano-gr250n4 / Tadano GR-250N-4 (IV) | Korean IV PDF p1 | Transport11.530×2.620×3.475; max support width6.6; boom9.35–30.5; main-boom max working radius27.9; main-boom max ground height31.3 | Auxiliary-jib max radius33.9 is different. Max width alone does not establish four pad centers or front/rear spacing. Verify exact submitted pose and sourced detail. |
| liebherr-ltm1050 / Liebherr LTM1050-3.1 | Selected current drawing p3,385/95 R25 tire | Transport11.830×2.550×3.785; supports longitudinal7.151×transverse6.400; telescope11.4–38.0; optional max radius44/hook54 | Alternate length12.391/height3.835 and reduced support width4.5 are not the selected outer form. Option maxima are not necessarily simultaneous or default pose. |
| maeda-mc305 / Maeda MC305C-5 | Metric CE PDF p1,2 | Transport4.110×1.280×1.695; deployed pad outer length5.170/front width4.808/rear width4.704; max radius12.16/lift12.52 | Front/rear widths are not summed into a length; pad outer measurements are not support center coordinates. Keep real size, even when smaller than a phone. |
| liebherr-lr1100 / Liebherr LR1100.1 | EN-US PDF p8,14 | Work lower envelope about6.60×5.00; track length about6.27; rear swing radius about4.70; boom family about14–62; selected32m main boom/no fixed jib | Imperial conversions are approximate.32m=14+6+12 configuration.11.48m plan measure includes lowered boom, not chassis length. Body height about4.01, alternate option4.45. |
| liebherr-172ecb / Liebherr172 EC-B8 Litronic | Official2025-02 PDF p4,6,8 |16 HC175/UC-0460m; tower width1.8, standard section2.5, nominal support width4.6; selected jib50/rear14.5/hook42.3; max jib radius62.5 |11 standard sections correspond to selected hook height.4.14 section is different system; hook height is not total tower steel height.4.6 is not a verified complete outer polygon or concrete foundation design; exact support/exterior coordinates remain null. Fixed origin is a demo rule, not mechanical immobility; bogie variants are not denied. |

Catalog expectation: equipmentType/model/specEdition/sourceUrl/sourcePage/lengthM/widthM/heightM/supportGeometry/slewOrigin/tailSwingRadiusM/boomOrJibConfiguration, with unsupported/unconfirmed quantities null plus explanation. Transport/work/support-center/pad-edge/reach/hook-height are separate concepts. Geometry feeds hazard engine; max reach is not universal danger radius. Verify every supported control against manufacturer/config and live motion; unknown controls/ranges are not invented in this packet.

### RC-001 source clarification

QA preparation directly opened `evidence/research/manufacturer/spierings/page-7.png` and read research/research-corrections.md plus support-geometry.json. The primary drawing shows upper row front/rear4.885/3.065, lower row4.615/3.335; both row spans7.95. This is side asymmetry, not separate wide/narrow longitudinal states. Source PDF SHA-256 is `3b24fc18f0aafb73584c191496b4cca88bd4f19a84e6a09753f3c3ccb52b2d2b`.

Only in the explicitly declared drawing frame (origin slew axis, +X page-right away from road cab, +Y page-top), wide centers are(-4.885,+3.830),(+3.065,+3.830),(-4.615,-3.830),(+3.335,-3.830). Narrow transverse magnitude is2.860 with same longitudinal offsets. Product/world axes must be mapped explicitly against submitted catalog/asset; road cab direction is not presumed to equal jib direction. A7.95×7.66 bounding extent cannot validate individual supports. This source inspection does not validate a product asset or declare G3 testing complete.

## Coordinate and layout oracle

Logical world ground is XY; +X140m long edge,+Y50m short edge. Origin table lower-left. Table centimeters equal world meters; table meters×100=world meters. Blender unit1m/Z-up, Three coordinate `[mapX,height,-mapY]`, GLB Y-up export. Root scale(1,1,1), origin slew ground projection, zero heading/+X boom. Exact coordinate error limit≤1e-6m per coordinate.

| Point | Table m(x,y) | Table cm(x,y) = logical world m(x,y) |
| --- | --- | --- |
| C00 |0,0 |0,0 |
| C10 |1.40,0 |140,0 |
| C11 |1.40,0.50 |140,50 |
| C01 |0,0.50 |0,50 |
| E11 |0.10,0.05 |10,5 |
| E12 |0.10,0.25 |10,25 |
| E13 |0.10,0.45 |10,45 |
| E21 |0.70,0.05 |70,5 |
| E22 |0.70,0.25 |70,25 |
| E23 |0.70,0.45 |70,45 |
| E31 |1.30,0.05 |130,5 |
| E32 |1.30,0.25 |130,25 |
| E33 |1.30,0.45 |130,45 |

Four corners calibrate; the nine E points independently evaluate3 markers×30 stable samples=810. Physical p95 planar error≤0.02m table/≤2m world; include each marker and aggregate. Scale amplifies physical uncertainty. Range-only UWB never supplies XY; valid angles plus calibrated orientation/heights/offsets are needed for relative XY transform. Visual coordinates retain their visual source.

| Layout feature | Frozen logical map values |
| --- | --- |
| Detail site | SITE-CONSTRUCTION-01,140×50m,7000m², synthetic reconstructed HVO reference |
| Crane / default heading | C=(30,25),+X; one equipment instance EQUIPMENT-A |
| Work area | x15–100,y12–38 |
| Stock / lift destination | x55–75,y17–29 / x80–95,y17–29 |
| Obstacle | x105–120,y18–30,height6 |
| Corridor centerlines | y8 and42,x8–132,width4; graph joins ends and obstacle surrounds |
| Refuge candidates |(125,8),(125,42), safety depends on current hazard/connectivity |
| Worker starts | W1=(65,25),W2=(90,40) |
| Physical table center margin | Recommended5cm each side;130×40cm interior, independent of phone exterior |
| Default SK tabletop slew |±15° demo limit;60m jib endpoints(87.95555,9.47086)/(87.95555,40.52914), center0° endpoint(90,25) |
| Full extent |60m radius full range preserved; outside140×50m table has no physical phone observations |

## Four physical roles and visual state semantics

Preparation phone labels: S24+×2, user phrase “Galaxy Z Fold8 와이드”, Note20 Ultra. P1–P4 actual identity/OS/API/support/permissions are unverified. No role or capability comes from these labels.

| Role | Actual required observation | Explicit prohibition |
| --- | --- | --- |
| EQUIPMENT | One Controller receives two peers concurrently180s; apparatus/frame offsets calibrated | No fixed phone-model assignment; no invented world translation/yaw from ranging alone |
| WORKER_1 | One Controlee→WORKER-A; actual screen/audio/vibration guide | No receipt=understanding=arrival shortcut |
| WORKER_2 | Concurrent Controlee→WORKER-B; same APK selectable role | No sequential single-peer runs passed as simultaneous |
| CCTV | Rear camera, permission, actual JPEG5–10fps received and latency measurement; lower-performance phone preferred | No UWB requirement, no mock video presented live |

WORKER-C optional virtual only, never third measured worker. Role readiness differentiates hardware/enablement/permissions/session success and offers truthful alternate role. Screen states separate guidance generation, transmission, device receipt, understanding, movement/support, arrival; administrator acknowledgement/mute/clear/reopen/close are distinct. First delivered text/version is immutable; current guide and supplemental RAG are separate. Audio/CCTV/position failure are distinct. Unknown measurements remain null/Unknown, never0. Actual sources, observation times, error and synthetic status remain visible.
