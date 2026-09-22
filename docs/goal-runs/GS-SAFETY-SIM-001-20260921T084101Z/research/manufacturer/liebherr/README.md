# Liebherr primary manufacturer evidence — handoff index

Verified 2026-09-21. Scope is geometry and configuration evidence for the three requested simulation presets. This research handoff is not QA approval or real lifting/installation approval.

| Model / requested configuration | Report | Structured values | Original-source manifest |
|---|---|---|---|
| LTM 1050-3.1, selected standard-tyre transport drawing | [LTM report](./ltm1050/report.md) | [LTM facts](./ltm1050/facts.json) | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/ltm1050/sources.json` |
| LR 1100.1, 32 m main boom / no fixed jib | [LR report](./lr1100/report.md) | [LR facts](./lr1100/facts.json) | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/lr1100/source-manifest.json` |
| 172 EC-B 8 Litronic, 16 HC 175 / first UC-0460m column / 50 m outreach / 42.3 m hook | [Tower report](./tower172/REPORT.md) | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/verified-configuration.json` | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/tower172/sources.metadata.json` |

## Changes needed when using source document 008

1. **LTM:** 11.830 × 2.550 × 3.785 m belongs to the 385/95 R25, unlowered transport row. The 7.151 × 6.400 m summary does not define a centered rectangle: p3 has four different longitudinal offsets around the slew datum. Full pad XY remains unconfirmed without a transverse-symmetry interpretation. Printed spec edition is `lwe-td-185-02-defisr01-2023`; PDF creation metadata is 2026-06-10.
2. **LR:** 6.600 × 5.000 m is an undercarriage/track summary, not a complete working or transport envelope. Track outer length is 6.275 m; 5.535 m platform/handrail span still excludes other protrusions. The 32 m main boom is explicitly 5.5 + 6 + 12 + 8.5 m, family 1512.21 / Mode 1. No fixed jib does not determine optional auxiliary-jib presence.
3. **Tower:** 42.3 m is the starred hook-height entry for row 11 in the **first** UC-0460m column, not the second. 50 m is outreach; the matching chart states r = 51.5 m. 4.6 m is a nominal support-span/dimension, not a verified total external base square. UC denotes an undercarriage with rail-bogie components; a fixed simulation origin is a demo choice. 14.5 m is a side-view rear dimension, not independently confirmed full swept radius.

Transport length/width/height for LR and tower remain explicit nulls. Working envelope, physical steel height, contact patch, load support polygon, and real safety limits must not be synthesized from unrelated maximum values. Confirmed values, calculated drawing coordinates, selected demo options, and unknowns are separate in each packet.

## Source and visual evidence quality

All relied-on PDFs were downloaded from Liebherr-owned hosts, preserved without byte modification, and identified by edition/page/URL/fetchedAt/SHA-256. Relevant PDF pages were rendered and inspected; numeric conclusions do not rely on search snippets. LR/tower received an additional independent reading of the same rendered pages, which is a reading check rather than another independent manufacturer source.

The LTM initial `c8a0003a…` source is generic VarioBase, archived but excluded from LTM dimension claims. The current model PDF is `e57b2c0c…`. LR metric and US versions are the same manufacturer document family; metric values take precedence over reverse-converting rounded feet. Tower uses C25 2025-02; alternative FEM/other tower variants are excluded.

No open redistribution license was identified. The originals/renders are traceable internal research evidence; source links are the external citation route. The packets do not assert actual crane deployment at the HVO project or manufacturer approval of the simulation.
