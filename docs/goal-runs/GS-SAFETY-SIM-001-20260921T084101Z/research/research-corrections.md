# Research corrections

Goal GS-SAFETY-SIM-001 v1.0; run GS-SAFETY-SIM-001-20260921T084101Z. These entries correct research interpretation while preserving source originals. They do not change the goal, waive QA, or silently revise frozen product contracts.

## RC-001 — SK1265 support offsets

- Recorded: 2026-09-21, during the source handoff before final asset integration.
- Original source: Spierings `Specs-SK1265_EN.pdf`, page 7, drawing `121-00126107A`; SHA-256 `3b24fc18f0aafb73584c191496b4cca88bd4f19a84e6a09753f3c3ccb52b2d2b`.
- Initial research interpretation: longitudinal front/rear offsets 4.885/3.065 m were labelled as the wide state, and 4.615/3.335 m as the narrow state.
- Defect: the two longitudinal pairs apply to opposite drawing rows of the same support state. Treating them as wide/narrow would erase side asymmetry and could cause an incorrect uniform shift of all four supports.
- Detection: Research Lead directly inspected the original rendered page 7 and page 2. Manufacturer researcher re-opened the same source and confirmed the correction. This is two observations of the same primary source, not two independent manufacturer sources.
- Correct interpretation: top drawing row front/rear distances 4.885/3.065 m; bottom row 4.615/3.335 m. Wide transverse centers are ±3.830 m. Narrow transverse centers are ±2.860 m with the respective longitudinal offsets retained.
- Declared drawing frame: +X toward the right on page 7, away from the road cab; +Y toward the top of the page. Wide points are (-4.885,+3.830), (+3.065,+3.830), (-4.615,-3.830), (+3.335,-3.830). Transformation to asset/world coordinates must be explicit; road cab and jib need not point the same way.
- Action: Design Lead received an immediate HOLD on the proposed uniform −0.27 m shift, acknowledged that only a temporary derived test export existed, and retained original assets. Corrected four-point mapping was sent after confirmation. Manufacturer report is revised with a correction notice. QA Lead was notified to compare the source drawing, selected coordinate frame, catalog and derived asset.
- Impact: AC-12 support geometry and derived risk footprint. QA must assess the actual integrated candidate; no test result was claimed from this correction.
- Source originals: unchanged. User goal: unchanged.

## RC-002 — 172 EC-B / UC-0460m dimension semantics

- Recorded: 2026-09-21 during primary-source verification.
- Source baseline: 008 calls 4.6 m the UC-0460m lower outer dimension. That original wording remains archived unchanged.
- New evidence: the specified Liebherr 2025-02 PDF and official 2025 tower-systems brochure support a 4.6 m nominal support width (`Stützweite`) but do not establish a complete 4.6×4.6 m outer footprint, exact support-center coordinates or concrete base.
- Configuration: UC-0460m is an undercarriage with rail-bogie components. Keeping the selected tower origin fixed is a simulator policy and does not establish that the manufacturer configuration cannot travel.
- Interpretation boundary: retain the user-selected 16 HC 175 / UC-0460m, 50 m working radius and 42.3 m hook-height configuration. Do not claim the hook height is the complete steel height, the working radius is the physical jib tip, or the 4.6 m support span is a verified full pad polygon.
- Action: PM and Design Leads were notified. The primary evidence and explicit unknowns are in `manufacturer/liebherr/tower172/REPORT.md`. Any actual change of the fixed user-selected configuration or goal requires the normal goal-change procedure; this research note does not authorize it.
- Impact: AC-12 catalog labels, geometry assumptions, model-source comparison and risk footprint. Exact unknowns remain null or clearly marked modeling assumptions per the user's source-verification requirements.
- Source originals: unchanged. User goal: unchanged.
