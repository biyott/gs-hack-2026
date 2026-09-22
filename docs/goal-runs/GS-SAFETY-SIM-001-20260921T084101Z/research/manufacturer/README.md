# Six crane presets — manufacturer evidence index

Verified on 2026-09-21 for GS-SAFETY-SIM-001. This handoff verifies visualisation geometry against the exact emul-008 configurations. It preserves unknown dimensions and does not establish real equipment deployment at the HVO site. Original PDFs, HTTP headers, fetch times, SHA-256 hashes, extracted text and inspected page images are in the run's `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/` tree.

All table lengths are metres. A transported envelope, support-centre span, pad outer envelope, boom length, working radius and hook height are distinct values. Neither a maximum radius nor a support outline is automatically a safety zone.

| Selected model and edition | Verified geometry / configuration | Primary source pages | Detailed packet |
|---|---|---|---|
| **Spierings SK1265-AT6, legacy60m**; drawing121-00126101/02/07A, calendar edition unprinted | Transport16.279×3.000×4.000. Wide support centres7.950×7.660, staggered opposite sides. Horizontal60m outreach,37.2m under-jib,35m hook. | [Legacy PDF](https://www.spieringscranes.com/wp-content/uploads/Specs-SK1265_EN.pdf), pp1,2,7 | [Report](spierings/evidence.md) |
| **Tadano GR-250N-4-00101, X type**; code1609-01-05 | Transport11.530×2.620×3.475. Support width6.600; pad outer width7.180. Boom9.350–30.500. X/H alternatives remain separate. | [Korean IV PDF](https://mediahub.tadano.com/m/20be7de269e4d894/original/doc_Tadano_GR250N-4_specsheet_korean-pdf-pdf.pdf), pp1,6,8 | [Report](compact/tadano/report.md), [facts](compact/tadano/facts.json) |
| **Liebherr LTM1050-3.1**, 385/95R25; lwe-td-185-02-defisr01-2023 | Transport11.830×2.550×3.785. Fully extended width6.400; longitudinal support rows7.151/7.169 with distinct offsets. Main boom11.4–38.0; accessories separate. | [Current linked metric PDF](https://assets-cdn.liebherr.com/versions/e57b2c0c-a794-4463-bfdc-40af69903c8d/original/), pp3,10,23,30 | [Report](liebherr/ltm1050/report.md), [facts](liebherr/ltm1050/facts.json) |
| **Maeda MC305C-5, Metric(CE)**; ©2025, no printed revision | Transport4.110×1.280×1.695. Maximum support outer spans5.170 along chassis and4.808/4.704 front/rear widths. Working radius12.16, hook height12.52; physical boom3.695–12.485. | [CE technical PDF](https://www.maeda-minicranes.com/assets/pdf/mc305c-5_printdata_ce.pdf), pp1–2; [brochure](https://www.maeda-minicranes.com/download/files/MC305C-5.pdf), p2 | [Report](compact/maeda/README.md), [facts](compact/maeda/facts.json) |
| **Liebherr LR1100.1**, 8503.02.03 / EN v01.092022 | Working undercarriage6.600 long, tracks5.000 outside width,6.275 track outer length. Depicted rear swing4.700. Main boom1512.21 Mode1:5.5+6+12+8.5=32; no fixed jib. | [Official metric PDF](https://www.liebherr.com/shared/media/mobile-and-crawler-cranes/brochures/crawler-cranes-up-to-300-tonnnes/data-sheets/lr/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-english.pdf), pp8,13,14,20; [008 US source](https://www.liebherr.com/shared/media/mobile-and-crawler-cranes/brochures/crawler-cranes-up-to-300-tonnnes/data-sheets/lr/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-usa.pdf) | [Report](liebherr/lr1100/report.md), [facts](liebherr/lr1100/facts.json) |
| **Liebherr172 EC-B8 Litronic**, C25/2025-02/TCS-001859-LBC-01;16HC175/firstUC-0460m column | Tower width1.8, standard section2.5, row11 hook42.3 with starred condition. Outreach50, chart r51.5, rear side-view14.5. NominalUC support span4.6; actual total outer base unresolved. | [Exact selected PDF](https://assets-cdn.liebherr.com/versions/e947e028-e7d0-4341-b16a-15cb83217ac4/original/), pp4–6,8,14–16 | [Report](liebherr/tower172/REPORT.md) |

## Corrections and preserved uncertainty

- **Spierings p7:** upper drawing row uses longitudinal offsets−4.885/+3.065; lower row−4.615/+3.335, where +X points right away from front cab. Wide rows are y±3.830. An earlier working interpretation incorrectly treated the two x-pairs as wide/narrow alternatives; withdrawn. Full final source-oriented points are in the evidence `spierings/support-geometry.json`. Model/world axis mapping remains explicit.
- **LTM and Tadano:** support pairs are also staggered; headline spans cannot define a centred rectangle. LTM full pad XY needs a declared transverse symmetry interpretation. Tadano pad outer width differs from support width.
- **Maeda:**5.170 is called `Lateral` in the source table but runs longitudinally in its plan drawing. Do not add4.808+4.704. Japanese4.145 transport length remains a documented regional-source discrepancy; selected CE4.110 is retained.
- **LR:**6.600×5.000 describes lower geometry only; platforms/steps extend farther. Transport configuration, effective ground contact, complete working envelope and boom-pivot height remain unknown. The exact metric source supersedes reverse-conversion of rounded US feet for geometry.
- **Tower:**4.6 is supported as nominal support span, not a proven external4.6×4.6 square. UC includes rail-bogie/undercarriage components; a fixed demo origin is a simulation choice. Hook42.3 is not steel or slew height; those remain unknown. Rear14.5 is not a verified swept radius.
- Printed editions remain distinct from PDF creation metadata and HTTP modification dates. Different manufacturer revisions, attachments or support states were not combined.

## HVO/SAF context

[LG and Eni context verification](context/evidence.md) confirms the Daesan/Seosan project identity and the August2025 announcement with planned2027 completion. The140×50m demo map remains a reconstructed synthetic area; exact plant-unit boundaries, actual progress, crane deployment and approved site safety policies were not verified.

## Evidence integrity and use

`docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/manifest.json` indexes the model source manifests; `artifact-inventory.json` hashes the final evidence files after path normalisation. Model subdirectories retain detailed provenance and page-reading notes. Public accessibility does not establish an open redistribution licence. The full originals are retained as traceable research evidence; external handoffs should cite their manufacturer URLs.

This is a research submission, not QA acceptance. Each model report states confirmed facts, derived geometry, demo choices and unknowns separately.

Change control: [research corrections RC-001 / RC-002](../research-corrections.md). Original requirement changes remain the PM’s responsibility. Source self-checks and repeated readings here are separate from the QA Lead’s independent acceptance verdict.
