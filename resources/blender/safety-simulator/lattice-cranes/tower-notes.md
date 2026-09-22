# 172 EC-B 8 geometry notes

Source: archived `emul-008.body.md` and manufacturer 2025-02 PDF, visually inspected pages 4, 6, 8, 13, 14 and 15. `evidence/research/manufacturer/liebherr/tower172/verified-configuration.json` preserves the exact configuration and unknown quantities.

- Selected: 16 HC 175 / UC-0460m, 10 m TSB, eleven regular 2.5 m sections, 2.5 m upper section. Tower chord outside width is 1.8 m. Four rendered bays of the 10 m TSB are a subdivision of one component, not four additional regular sections.
- Published maximum hook height is 42.3 m, first UC-0460m column, row 11, including the starred manufacturer condition. It is not steel height.
- Modeled slew elevation 44.5 m is component-stack arithmetic: 4.5 + 10 + 11×2.5 + 2.5. It is a derived geometric datum; the source metadata does not independently confirm the exact slew-axis height.
- Modeled jib underside is 45.2 m; its 2.9 m clearance to the 42.3 m maximum hook follows the page 4 side-view dimension. Small head offsets remain an appearance reconstruction.
- Selected working outreach is 50 m. The physical tip reaches the chart radius of 51.5 m; selected sections are 1, 2, 3, 6, 7, 9. Their assembled horizontal spans follow page 4, with 1.1 m hub offset. Section depths and triangular 1.2 m width reference page 13.
- Counterjib reaches 14.5 m rearward. Seven visible ballast plates represent the conditional 24 kW FU / 50 m configuration (4A + 2B + 1E, 13.75 t); their individual geometry is illustrative, not a ballast design. Central ballast shape is illustrative and has no assigned mass.
- UC-0460m is rendered with rail bogies, cross members, struts and ballast. The 4.6 m label is a nominal base reference, not a confirmed outer polygon or concrete foundation. Bogies and short illustrative rails extend beyond it; no exact support centers are claimed.
- Rail-wheel/bogie dimensions reference page 14 where practical. Tube diameters, cab details, handrails, ladders, winch, ballast shapes and member joints are visual approximations. No engineering load or foundation suitability is inferred.

Rig: `ROOT` at ground; `SLEW` rotates local Z at the tower head; `TROLLEY` translates local X; `HOOK` translates local Z under TROLLEY. Default trolley radius is 30 m; default hook low-point datum is 18.8 m. Hook local Z maximum -2.7 gives 42.3 m. `HOIST_ROPES` is a direct TROLLEY child at its fixed upper anchor Z=-0.32; both rope meshes extend downward from this origin. Its rest length is 24.73 m. Pair hook movement with `HOIST_ROPES.scale.z = (-0.32 - HOOK.location.z - 1.15) / 24.73`; the 1.15 m offset is the hook-block sheave attachment above the hook origin. These dimensions are also custom properties. The rig uses no drivers, so Blender and glTF share the same explicit motion contract.

This module deliberately does not provide luffing or telescopic boom joints: the selected tower crane has a horizontal flat-top jib. Ground movement is disabled as a simulation policy despite the physical rail undercarriage.
