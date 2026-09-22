# Q-UI-DEVICE independent test preparation

Owner: `/root/qa_lead/qa_ui_device`. Goal GS-SAFETY-SIM-001 v1.0; run GS-SAFETY-SIM-001-20260921T084101Z. Protocol: ../g0-protocol-v1.md v1.0. This packet prepares AC-09, AC-12, AC-13, AC-15 and the UI/device part of AC-16. It does not issue any whole-AC or overall verdict.

Execution gate: QA Lead supplies the G3 candidate manifest and frozen source/lockfile/seed/map/policy/scenario/catalog/knowledge/GLB/source/APK/non-secret-config hashes, documented launch commands, QA-owned database/port, and resource allocation. Verify hashes before and after each slice. Record any mutation and invalidate affected results. No product execution was attempted while preparing these cards.

| Card | Coverage | Required environments | Current test status |
| --- | --- | --- | --- |
| [AC-09](ac09-android-guidance.md) | Same-version Android screen, audio, vibration and lifecycle | DEVICE | NOT_RUN |
| [AC-12](ac12-coordinate-assets.md) | Coordinates, layout, six fixed cranes, application swaps | SW, ASSET | NOT_RUN |
| [AC-13](ac13-four-phone-measurement.md) | Role readiness, simultaneous UWB, calibrated tracking, CCTV | DEVICE | NOT_RUN |
| [AC-15](ac15-visual-performance.md) | Complete visual inventory, interactions and measured performance | SW, DEVICE | NOT_RUN |
| [AC-16](ac16-handoff.md) | Same-candidate second-executor demo | HANDOFF, DEVICE, ASSET, MODEL | NOT_RUN |

[Source expectations](source-expectations.md) preserve the fixed values and unresolved quantities. Readiness and templates live in `../../evidence/qa/ui-device/`. Source preparation labels are not device identity or capability proof. Browser/headless/emulator/mock checks are separate from physical results. A missing actual prerequisite is BLOCKED when established; an unattempted case is NOT_RUN. Never replace physical, real-model, source-open, exported-GLB or handoff evidence with unit tests or screenshots alone.

No live Blender operations during design production. Coordinate an exclusive verification window through QA Lead and Design Lead after G3. Read file paths and metadata now; inspect actual source opening/export only during the allocated window, without saving over originals. QA edits only this packet and its evidence directory.

Visual workflow loaded: frontend SKILL.md, design/README.md, perfection/README.md, and visual-qa SKILL.md. DESIGN.md v1.0.0 draft is the current visual expectation, not yet a frozen G3 reference. Before execution re-read its final hash and load React performance tooling reference if applicable. Enumerate every route/tab/modal/state and capture fresh screenshots across every required viewport. Run independent design-system/functional and visual/CJK reviewers after actual captures. Reviewer output is slice evidence for QA Lead; it cannot waive frozen acceptance.

Keep dated result records separate from templates. Preserve failures and each retest candidate; at most two product reworks per defect and one repeat of an identical environment failure. Supplemental skill metrics such as Lighthouse/React diagnostics do not silently change the frozen acceptance thresholds.
