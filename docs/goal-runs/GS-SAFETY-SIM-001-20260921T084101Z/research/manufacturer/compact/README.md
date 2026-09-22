# Compact crane manufacturer evidence

Research handoff for `GS-SAFETY-SIM-001-20260921T084101Z`, checked 2026-09-21. This package verifies manufacturer inputs to original document 008. It does not authorize a change to the selected presets or provide an operational lifting plan.

| Exact selected lane | Detailed report | Evidence archive |
|---|---|---|
| Tadano GR-250N-4-00101, CREVO250 G4, X outriggers, full-auto jib, printed code1609-01-05 | [Tadano report](tadano/report.md), [facts](tadano/facts.json) | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/compact/tadano/` |
| Maeda MC305C-5, global Metric(CE), technical PDF with2025 copyright | [Maeda report](maeda/README.md), [facts](maeda/facts.json), [regional discrepancy](maeda/market-discrepancy.md) | `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/compact/maeda/` |

## Findings affecting use of 008

- **Tadano:** original transport11.530×2.620×3.475m, support extension width6.600m, boom9.350–30.500m are confirmed. The selected X pads occupy **7.180m outer width** at maximum extension. The PDF separately shows H outriggers; H dimensions must stay out of the X preset.
- **Maeda:** original transport4.110×1.280×1.695m, maximum pad outer spans5.170m along chassis and4.808/4.704m across it, radius12.16m and height12.52m are confirmed in exact cited CE PDF. The two crosswise spans are separate front/rear values, not additive. Table's `Lateral` wording for5.170m is retained alongside the diagram-axis interpretation.
- **Different measurements remain separate:** Maeda12.16m is a horizontal working-radius limit; actual maximum physical boom length is12.485m in the manufacturer's separate brochure. Maximum height, maximum radius and peak capacity are not one simultaneous pose.
- **Revision conflict remains visible:** Japanese MC305C-5 manual gives4.145m length; cause unverified. The selected CE4.110m value is not overwritten.
- Full pad center coordinates, coordinate-oriented slew-origin transforms and arbitrary-pose load limits remain unverified. Facts files preserve missing values instead of inventing them.

Each model directory records source URLs, fetch timestamps, original file hashes, page references, visual inspection evidence and explicit unknowns. Source documents remain manufacturer copyright; public availability is not an open-use licence.
