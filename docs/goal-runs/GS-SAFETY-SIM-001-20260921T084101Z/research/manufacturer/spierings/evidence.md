# Spierings SK1265-AT6 — legacy 60 m evidence

Verified 2026-09-21 against the downloaded manufacturer PDF, including direct visual inspection of PDF pages 1, 2 and 7. This is the older SK1265-AT6 selected in emul-008, not eLift. All geometric values below are metres unless stated otherwise.

Source: [Spierings legacy specifications](https://www.spieringscranes.com/wp-content/uploads/Specs-SK1265_EN.pdf). The 7-page original is archived at `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/spierings/Specs-SK1265_EN.pdf`; page images and extracted text are beside it. Its SHA-256 is `3b24fc18f0aafb73584c191496b4cca88bd4f19a84e6a09753f3c3ccb52b2d2b`, identical to the pre-existing `docs/cranes/references/spierings-sk1265-at6-legacy-specifications.pdf`.

Use drawing identifiers as the edition: p1 `121-00126101`, p2 `121-00126102`, p7 `121-00126107A`. No printed calendar edition was identified. PDF metadata creation/modification on 2014-09-26 and HTTP Last-Modified 2025-07-08 are provenance dates, not proof of equipment year or a new edition.

| Confirmed fact | Value / configuration | Original location |
|---|---|---|
| Identity | SK1265-AT6; 60 m jib; six axles | p1 heading; p2 drawing |
| Transport envelope L×W×H | 16.279 × 3.000 × 4.000 | p2 dimension lines; includes folded front/rear overhang |
| Carrier-related longitudinal reference | 12.079 between dimension-line body references, not entire folded envelope | p2; do not call 16.279 m the erected carrier length |
| Consecutive axle spacings, front to rear | 2.297 / 1.614 / 1.345 / 1.345 / 1.342 | p2 |
| Wide support-centre base | 7.950 longitudinal × 7.660 transverse | p1 wide chart; p7 upper dimensions |
| Narrow support-centre base | 7.950 longitudinal × 5.720 transverse | p1 narrow chart; p7 lower dimensions |
| Upper plan-row support offsets from slew axis | Front-cab direction 4.885; rearward 3.065 | p7; source-page upper row, both deployment widths |
| Lower plan-row support offsets from slew axis | Front-cab direction 4.615; rearward 3.335 | p7; source-page lower row, both deployment widths |
| Standard outrigger pad / additional support plate | 0.750×0.600 / 2.500×1.000 | p7 table; separate from centre spacing |
| Other overall transverse annotation | Drawing includes 8.600; exact associated envelope left unresolved | p7; not substituted for verified 7.660 support-centre spacing |
| Rotational envelopes | R1 superstructure 4.540; R2 guy bars 3.750; R3 counterweight 3.110 | p7 legend and arcs; distinct component radii |
| Selected horizontal configuration | Radius 60; height under jib 37.2; hook height 35.0 | p1 horizontal chart; other mast-height option27.4/25.2 is separate |
| Luffed configuration | 30°; maximum hook height64.2 occurs at horizontal radius52.2 | p1; not simultaneous with 60 m horizontal outreach |
| Load chart scope | Wide base:10t at radius13.2,1.7t at60; narrow base60m tip0.8t | p1 separate charts; not a working load calculation for demo |
| Counterweight | 13,600 kg | p1 image, crane counterweight note |

## Modelling coordinates and limits

**Correction issued during verification:** the upper and lower longitudinal dimension chains belong to opposite physical sides of the crane. They do not distinguish wide and narrow deployment. An earlier working interpretation was withdrawn before final synthesis. Do not apply a uniform longitudinal shift or duplicate one row onto both sides.

A source-page coordinate convention sets origin at the slew axis, +X toward the right of p7 (away from the front road cab), and +Y toward the top of the page. The selected wide support centres are (front-upper) `(-4.885,3.830)`, (rear-upper) `(3.065,3.830)`, (front-lower) `(-4.615,-3.830)`, (rear-lower) `(3.335,-3.830)`. The source centreline and 7.660 m separation establish the transverse half-span. The narrow dashed state uses the same side-specific x offsets and transverse half-span2.860m. This is an explicitly declared coordinate transform of p7, not a manufacturer axis standard; product axes must be mapped deliberately.

The drawing includes an 8.600 m transverse annotation whose exact associated envelope was not resolved here. Do not label it the pad envelope based on text extraction alone. Precise support-plate edge coordinates beyond the supplied pad/plate size and support-centre annotations remain unverified.

The PDF establishes envelopes, support centres, component rotation radii and selected horizontal heights. Member diameters, cab interior, mast segment cross-sections, rigging assembly details and material properties are not verified. Existing asset details in these areas remain visual approximations. The source's general operating notes do not constitute a configuration-specific site installation approval.

## Excluded source

`https://www.spieringscranes.com/wp-content/uploads/2020/06/SK1265-AT6-Euro-4-en-6.pdf` returned HTTP200 with text/html and an empty body at 2026-09-21T08:46:54Z. Its headers are archived as `manual.headers.txt`; it was not used as evidence. Current eLift web/PDF height40.5m and counterweight12,600kg were not merged into this legacy sheet.
