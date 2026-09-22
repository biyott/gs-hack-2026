# Liebherr LTM 1050-3.1 — primary-source verification

Checked 2026-09-21 UTC. This packet supports visual/simulation geometry, not real lift planning.

## Identity and provenance

- [Official product page](https://www.liebherr.com/en-gb/mobile-and-crawler-cranes/mobile-cranes/ltm-mobile-cranes/ltm-1050-3-1-4284057) directly links the [30-page metric technical PDF](https://assets-cdn.liebherr.com/versions/e57b2c0c-a794-4463-bfdc-40af69903c8d/original/).
- Printed edition on p30: **lwe-td-185-02-defisr01-2023**. PDF file creation metadata is 2026-06-10; that is a separate file timestamp, not a replacement publication edition.
- Original PDF, response headers, extracted text, and rendered pages 3/10/30 are under `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/liebherr/ltm1050/`. `sources.json` records source URLs, UTC fetch times, SHA-256, byte lengths, and reviewed pages.
- PDF SHA-256: `d6af4bfd6f9ce75987c6d506f72c5cbd640ea0b32044fd525eb8fdbf25d41ccd`.
- The initially supplied `c8a0003a-96fa-4813-b118-0dd3c8acae05` URL returned a **102-page generic VarioBase** document. It is archived separately and excluded from the model-specific dimension claims below.

## Confirmed drawing values

All lengths below are metres; source drawing p3 uses millimetres. PDF page and printed page match.

| Item | Confirmed value | Applicability / page |
|---|---:|---|
| Selected transport envelope | 11.830 × 2.550 × 3.785 | p3, standard 385/95 R25 tyre row, height A, suspension unlowered |
| Lowered height | 3.685 | Same tyre row, 100 mm lowering |
| Other tyre rows | 445/95: 2.550 × 3.835; 525/80: 2.690 × 3.835 width × height | p3; do not mix these with 3.785 height |
| Full transverse support-center span | 6.400 | p3 full extension |
| Top plan-row longitudinal offsets from slew datum | Front −4.526, rear +2.625; span 7.151 | p3 dimension arrows |
| Bottom plan-row longitudinal offsets | Front −4.274, rear +2.895; sum 7.169 | p3 dimension arrows; sum derived arithmetically |
| Pad side | 0.500 square | p3 square symbol |
| Telescopic boom T | 11.4–38.0; one base + three telescopic sections | pp10,23 |
| Optional K / HK | K 9.2–16; HK 1.4 | p23, separate accessory configurations |

## Material correction to page 008

The original 008 claim **7.151 × 6.400 m** is a useful summary of two labelled spans, but it is not enough to define a centered rectangular support polygon. The plan has different longitudinal split dimensions on its upper and lower rows. Replacing them with ±3.5755 around the slewing origin loses the drawing's stated offsets. Keep the four longitudinal offsets and pad size separate from the transverse span.

Full pad XY points remain **unconfirmed** here: the PDF gives the transverse separation, while a numerical offset from slew center to each transverse support line is not separately labelled. Assigning y = ±3.2 would be a symmetry interpretation. Preserve that interpretation as an explicit modeling assumption if used.

The diagram also labels transverse support 4.500 m and VarioBase-only 2.339–6.400 m. Those are alternative deployment states, not extra dimensions to combine into one footprint. The selected full-extension preset must not imply that arbitrary smaller support states have the same lifting capacity.

## Configuration boundaries and unknowns

For a main-boom-only simulation, use configuration **T**; **TK** and **THK** are visibly separate in p10. This is a research recommendation, not a unilateral change to the team's accepted preset. The product's 44 m radius / 54 m hook-height maxima include optional equipment and do not describe one T-only pose. Maximum radius, boom length, and hook height are distinct quantities.

Page 3 shows rear outline radii 3.530 and 4.070 m and a separate 12.391 m accessory-envelope length. Their exact accessory/stowed-jib combinations were not sufficiently isolated in this packet. Accordingly `tailSwingRadiusM` is null instead of silently choosing one universal radius. Likewise, boom heel XYZ, boom cross sections, section overlaps, and full 3D slewing pivot remain unconfirmed.

For visual modeling, the inspected drawings establish a three-axle carrier, forward road cab, separate rotating operator cab, telescopic box boom, four hydraulic outriggers, rear counterweight, and optional side-stowed lattice jib. Rendered technical diagrams are original source evidence, not generated images.

The brochure itself describes general information and refers operation to its manual/load-chart book (p29). Public availability is not an open-license grant; no permission for public redistribution of the full brochure or imagery was identified. Retain this archive as traceable research evidence and use links for external handoff.

Machine-readable extraction: [facts.json](./facts.json).
