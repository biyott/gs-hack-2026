# Tadano GR-250N-4 — verified manufacturer evidence

Verification date: 2026-09-21. Scope: visualization/modeling evidence under `docs/codex/research.md`.

Source: [official Korean supply PDF](https://mediahub.tadano.com/m/20be7de269e4d894/original/doc_Tadano_GR250N-4_specsheet_korean-pdf-pdf.pdf). Archived original, SHA-256, fetch time, metadata and renders: `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/compact/tadano/`.

Selected configuration: CREVO 250 G4, 4-section boom, 2-section full-auto jib, **X-type outriggers, GR-250N-4-00101**. The same PDF also carries H-type **00102**; do not merge their support geometries. Printed edition code: **1609-01-05**, p8. Publication date unverified; PDF creation metadata is not publication evidence.

All page numbers below are 1-based PDF pages (p2–8 also have matching printed numbers; p1 is unnumbered).

| Verified item | Value | Scope / location |
|---|---:|---|
| Transport L × W × H | 11.530 × 2.620 × 3.475 m | X configuration, p1, p8 upper drawing |
| Wheelbase / wheel track | 3.880 / 2.170 m | Transport, p1; p8 |
| Boom | 9.350–30.500 m; 4 sections | p1, p6 |
| Jib | 8.200–13.000 m; 2 sections | Full-auto jib, p1 |
| Boom elevation / jib offset | 0–84° / 5–60° | p1 |
| Slew | continuous 360° | p1 |
| X support extension width settings | 3.100, 3.600, 5.000, 6.100, 6.600 m | p1, p6 |
| X maximum **pad outer width** | **7.180 m** | Explicit float outer-edge dimension, p6 |
| X fore/aft support-center span | 6.680 m | Each side's dimension chain, p6; fore/aft offsets differ by side |
| Upper body rear swing annotation | R3.100 m | Arc drawn from slew center to rear upper body, p6 |
| Maximum lifting height, boom / jib | 31.300 / 44.200 m | p1; separate maxima, not one pose |
| Maximum working radius, boom / jib | 27.900 / 33.900 m | p1; separate maxima |

**Capacity example only:** p2 gives **25.0 t gross rated load at 3.5 m working radius with 9.35 m boom, 6.6 m maximum outrigger extension, all-around sector**. P4 conditions require level crane on firm level ground; gross value includes lifting gear and 220 kg main hook. P4 gives 8-part reeving for the 9.35 m boom. This is not a 25 t rating at arbitrary reach or an operational lift plan.

## Geometry clarification for 008

The original 008 values (11.530 × 2.620 × 3.475 m transport, 6.6 m support width, 9.35–30.5 m boom) agree with this exact source. **6.6 m must not become the occupied pad envelope:** the X drawing expressly gives 7.18 m outer pad width. Likewise, boom length, work radius, lifting height, tail swing and transport length describe different geometry.

P6 provides orthographic side and plan views, a jib detail and maximum/minimum/intermediate support outlines. Its support longitudinal chains are 2.9875 + 3.6925 m on the upper row of the plan view and 3.2725 + 3.4075 m on the lower row; both sum to 6.680 m. These diagram-row descriptions deliberately do not label physical left/right without a declared model coordinate system. Do not replace this asymmetric arrangement with a symmetric rectangle centered on the slew axis.

P7 H-type differs: minimum extension 2.300 m and maximum outer pad width 6.900 m. Those numbers are **excluded** from the selected X preset. Page 8 upper/lower transport drawings correspond to X/H respectively.

## Unknowns and implementation boundary

- Exact publication date and Korean delivery unit's serial/configuration are unverified. Pin the PDF hash and full spec number.
- A complete, coordinate-oriented 3D slew-origin transform and full pad polygons have not been transcribed; do not use guessed coordinates as manufacturer dimensions.
- No loaded clearance envelope, ground bearing suitability or valid load at arbitrary pose is established by these summary values.
- Appearance drawings identify optional lamps; their presence on a modeled unit is a separate choice.
- Original artwork/PDF redistribution permission is not established merely by public availability; archive is research evidence.
- Official legacy Japanese 2019/2021 PDF URLs returned 404 and were not adopted. Current GR-250N pages may describe newer generations; no later revision was merged here.
