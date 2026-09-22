# Pass B findings — C5 91375a9d

## VCJK-01 — [product] [P2] Selected scenario name is cut off in tablet and desktop settings

Observed at 768×1024 in `equipment-panels-settings-and-equipment-spec-768x1024-target-3-frame-1-before-capture.png` (select at x113–351, y110–154), also targets 1 and 2. The selected scenario should read “이동 제약별 경로와 미확인 프로필”; its final word is visibly cut off at the native select's right edge. The full name is readable at 375 and 390 widths.

Frozen source: `src/components/console/scenario-rail.tsx:71–91` renders the scenario name only inside the native option; the nearby full selected-name panel is equipment-only. `app/console.css:993–1000` fixes the tablet settings drawer to 272px, leaving a 238px-wide select. `data/scenarios/equipment/eq-profile-routes.json:5` supplies the complete label. This is loss of displayed selected-scenario text, not an objection to ordinary Korean line wrapping.

Concrete remedy: expose the full current scenario name in a wrapping text element associated with the select (or size the drawer/control so the complete selected name fits), then capture the same state afresh at the affected widths. This review did not modify product code or exercise the open native option menu.

Also confirmed at 1280×720: `equipment-panels-header-and-run-controls-1280x720-target-1-frame-1-before-capture.png`, native scenario select x33–223, y490–534, whose right edge cuts off the selected name more severely. Equipment model truncation in its native select has a full wrapping name immediately below; scenario has no such companion. Exact scenario-select source is lines 74–91.

Scope: stored SYNTHETIC web captures only. This is a visual subcase finding; QA Lead owns official AC disposition. Further widths remain under inspection.

### SHA-256 evidence identity

```text
d2179a9f6d68f5ed2cb20e997517833ae318816d038b849a1d9f2520c8fb6842  /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-91375a9d/surface-adapter-v1/2026-09-21T23-32-40-338Z-88f26076-0c05-4cec-a95e-ca6bb2661940/equipment-panels-settings-and-equipment-spec-768x1024-target-3-frame-1-before-capture.png
b69529ef40ce2739948fbd1829eee7d69f83333f493ec15dc42402e8c71ef8f1  /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-91375a9d/surface-adapter-v1/2026-09-21T23-32-40-338Z-88f26076-0c05-4cec-a95e-ca6bb2661940/equipment-panels-header-and-run-controls-1280x720-target-1-frame-1-before-capture.png
0fb233511277d9bcfe82b761ea86e0ea39815bb291db973f14aefb6723ed2a40  /home/b/.cache/gs-safety-c5.H4mElI/src/components/console/scenario-rail.tsx
2bb39006ab7bfeccadb1e6ff6a11b933d87687301cf29e917d744b384025c9de  /home/b/.cache/gs-safety-c5.H4mElI/app/console.css
e95e04db955846f453f8c118fe367979e5866116643e7133d52ad084eb93381f  /home/b/.cache/gs-safety-c5.H4mElI/data/scenarios/equipment/eq-profile-routes.json
```
