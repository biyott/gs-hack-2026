# Design and 3D asset self-check handoff

Current data includes the root-authorized QD005 LR and QD010 Maeda corrections. This is an implementation handoff, not independent QA acceptance. The original candidates and their failure evidence remain preserved.

Delivered: DESIGN.md version1.0.1; six individually loadable metre-scale crane GLBs and editable Blender sources; one synthetic140×50m site; catalog schema1.0.1 with source editions, unknown nulls, demo ranges and distinct synthetic risk polygons. Required controls remain implemented: SK/tower trolley and hoist; Tadano/LTM/Maeda luff, extension and hoist; LR luff and hoist with fixed32m assembly. Tower origin remains fixed; SK table-linked slew remains±15°.

QD005 corrects the known LR boom-foot horizontal offset and matching load center from2.1m to the published metric1.2m. The source US label3ft11in is retained separately as a rounded unit-edition value. Pivot height remains unknown officially and unchanged in the visual reconstruction. No other model or site source/GLB changed.

Current identities:

- Catalog: 8318e9eb05134bc2c9ed09d90633ec36fbf6c9e80556d4c56a9842c1d81dd6b6.
- LR GLB: 13698f139bcb79b877786259d4b3f4fe625a3534f3550a41dcaae4933422acca.
- LR Blend: 23dac3b561bdc1c0b2b43938c43ee56075fa3901c4d002a27646cbc438599bff.
- Maeda GLB: 37e1e64d7ec86be6e66b94f32f37521a43eef9e9d25dbbd36d5ecbbb7db4dc71.
- Maeda Blend: 83c242db2dd53707960a6882d1c7563b746a2c78add215966ba0cdd5815e371f.

QD010 replaces the Maeda boom's four box sections with five physical pentagonal shells, one fixed and four moving. The matching global manufacturer's brochure supports the count and profile type; section lengths, profile angles, wall geometry and the retained 8–10.6 m demonstration range remain explicitly authored reconstruction values. The 10 m baseline, tip/hook law, static meshes, risk polygons, other five equipment entries, twelve other crane/site artifacts and nine legacy SK files are unchanged. No shared schema, renderer or engine production change was needed.

QD010 self-checks passed: old-artifact RED, source/import five-shell/four-stage/five-face conformance, 24 motion poses at each boundary (48 total), exact static vertices/topology preservation, 88 actual-loader tests, 17 affected Maeda engine tests, and 14 independent direct GLB checks. The single isolated Blender process exited successfully and its native PID was confirmed absent. Receipt: `maeda-site/maeda/qd010-correction-01/README.md`. Previous Maeda endpoint renders are retained with their old hashes as historical evidence. New baseline renders were inspected. Independent integrated acceptance remains with QA.

QD005 executed self-checks:

- Manufacturer-datum RED against preserved oldGLB, then GREEN against corrected GLB; measured forward offset1.2000000477m with no compensating parent transform.
- Isolated Blender5.2.2LTS process21s, exit0, source and GLB reimport each27pose checks, six refreshed LR renders. The live interactive scene was not used.
- Frontend actual-loader regression85/85 passed with one worker, including oldasset RED/newasset GREEN for the hinge and projected hook radius.
- Backend affected LR tests10/10 passed on this exact catalog; engine production code unchanged.
- Independent Node/source receipt confirms corrected datum, hashes, unchanged five catalog entries and twelve unaffected model/site GLB/Blend hashes.

Evidence entry point: lattice-cranes/lr-pivot-correction-01/README.md. Exact current artifacts and consumer reports: artifact-manifest.json. Earlier full engine148-test and source/loader/image records remain historical evidence for their stated hashes; QD005 adds affected-current-candidate verification without rewriting that history.

Verified risk geometry means tested chosen synthetic polygons and declared controls. It does not certify capacity, ground bearing, complete visual-mesh containment, vertical collision physics or manufacturer operating limits. The earlier Maeda zero-area-triangle observation belongs to the preserved four-section asset; the unchanged tower's prior observation remains documented separately. QD010's five principal shell meshes have no zero-area triangles in the direct geometry check. Independent W3 source reopen/export, integrated model-change invalidation, browser/device operation and overall acceptance remain with QA.
