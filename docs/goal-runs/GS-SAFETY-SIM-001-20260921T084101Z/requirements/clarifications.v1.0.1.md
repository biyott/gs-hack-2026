# Requirements clarification v1.0.1 — tower support dimension

Goal version remains **1.0**. This additive record preserves `scope-freeze.v1.0.md`, `inventory.v1.0.json` and original source 008 without rewriting them. Product issuer: `/root/product_lead`; research origin: `/root/research_sources`, 2026-09-21. Related requirements: REQ-E-05, REQ-E-06, REQ-E-07; AC-12 and geometry-dependent AC-02.

The v1.0 freeze repeats source 008's description of UC-0460m 4.6m as lower exterior size. Subsequent [manufacturer review](../research/manufacturer/liebherr/tower172/REPORT.md) finds that the current primary evidence supports **nominal support width**, including `4,6 m Stützweite`; it does not establish a complete 4.6×4.6m outer polygon, all support centre positions, pad edges or a concrete foundation.

Keep the 008 statement in source provenance and record the semantic limitation next to the value. Exact unverified support-centre/outer-polygon geometry remains null/미확인 in catalog evidence; a visual reconstruction must be labeled as such. Do not silently claim a guessed polygon is manufacturer-verified or use an unverified mechanical motion envelope as certified risk geometry. Verified analytical parts and explicit simulation assumptions remain distinguishable.

No fixed product choice changes: Liebherr 172 EC-B 8 Litronic, 2025-02 source, 16 HC 175 / UC-0460m first-column configuration, 50m selected jib/work-radius configuration and 42.3m hook height remain. Hook height is not steel top or slew-axis height. The manufacturer table also reports nominal front structural radius 51.5m separately from 50m working radius; preserve those distinct meanings. The simulation keeps the equipment origin fixed even though UC is an undercarriage/bogie construction: fixed origin is the user's demonstration rule, not a newly asserted mechanical impossibility of travel.

The goal already requires unknown values to remain null and geometry/spec distinctions to be explicit. This is a source-confidence clarification within that authority, not approval to reduce six-model scope, substitute a different tower, change a pass condition or waive QA. Technical/Design Leads must record their corresponding catalog/geometry decisions and QA determines affected verification. Any proposed change to required configuration, scale, behavior or acceptance must still follow the user's goal-change process.

Research remains responsible for source facts; Product does not independently certify manufacturer values. QA acceptance is unchanged and no verdict is issued here.

## Owner coordination record

- Orchestrator `/root` concurred that preserving all six fixed configurations and recording unknown/null geometry follows the user's existing authority; `goal-changes.md` remains 목표 변경 없음. This is not QA approval.
- UI Design Lead `/root/design_assets` concurred: exact manufacturer footprint/support XY remain null; a 4.6m schematic rail undercarriage may be depicted only as a labeled visual approximation, with measured export bounds separate. Fixed 16 HC 175 / UC-0460m / 50m / 42.3m remains. QA should compare like semantic fields instead of treating total mesh width as an official 4.6m exterior envelope.
- Technical owner concurrence was initially pending. Follow-up from `/root/tech_lead` confirms: retain the original 4.6m outer claim in provenance, primary evidence establishes nominal support width only, exact footprint/support XY remain null, and all six fixed presets/configurations remain. Shared schema permits null geometry explicitly. No new verified analytic footprint, goal change or product PASS is approved here.
- Affected verification includes AC-12 catalog/source/model and geometry semantics, AC-13 coordinate/calibration interpretation where affected, and AC-02 if a risk shape uses the disputed extent. QA owns the final impact/retest selection and verdict. Existing evidence cannot silently validate a revised candidate.
