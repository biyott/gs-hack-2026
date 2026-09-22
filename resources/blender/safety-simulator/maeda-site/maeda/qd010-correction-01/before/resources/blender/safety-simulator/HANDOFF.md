# Design and 3D asset self-check handoff

Current data includes the root-authorized QD005 LR correction. This is an implementation handoff, not independent QA acceptance. The original candidate70da1337 and its evidence remain preserved.

Delivered: DESIGN.md version1.0.1; six individually loadable metre-scale crane GLBs and editable Blender sources; one synthetic140×50m site; catalog schema1.0.1 with source editions, unknown nulls, demo ranges and distinct synthetic risk polygons. Required controls remain implemented: SK/tower trolley and hoist; Tadano/LTM/Maeda luff, extension and hoist; LR luff and hoist with fixed32m assembly. Tower origin remains fixed; SK table-linked slew remains±15°.

QD005 corrects the known LR boom-foot horizontal offset and matching load center from2.1m to the published metric1.2m. The source US label3ft11in is retained separately as a rounded unit-edition value. Pivot height remains unknown officially and unchanged in the visual reconstruction. No other model or site source/GLB changed.

Current identities:

- Catalog: 3a0cdc1ab07bd993028fac9c462c34e3d7812b8baf4447c9ad34a40db6c7758b.
- LR GLB: 13698f139bcb79b877786259d4b3f4fe625a3534f3550a41dcaae4933422acca.
- LR Blend: 23dac3b561bdc1c0b2b43938c43ee56075fa3901c4d002a27646cbc438599bff.

QD005 executed self-checks:

- Manufacturer-datum RED against preserved oldGLB, then GREEN against corrected GLB; measured forward offset1.2000000477m with no compensating parent transform.
- Isolated Blender5.2.2LTS process21s, exit0, source and GLB reimport each27pose checks, six refreshed LR renders. The live interactive scene was not used.
- Frontend actual-loader regression85/85 passed with one worker, including oldasset RED/newasset GREEN for the hinge and projected hook radius.
- Backend affected LR tests10/10 passed on this exact catalog; engine production code unchanged.
- Independent Node/source receipt confirms corrected datum, hashes, unchanged five catalog entries and twelve unaffected model/site GLB/Blend hashes.

Evidence entry point: lattice-cranes/lr-pivot-correction-01/README.md. Exact current artifacts and consumer reports: artifact-manifest.json. Earlier full engine148-test and source/loader/image records remain historical evidence for their stated hashes; QD005 adds affected-current-candidate verification without rewriting that history.

Verified risk geometry means tested chosen synthetic polygons and declared controls. It does not certify capacity, ground bearing, complete visual-mesh containment, vertical collision physics or manufacturer operating limits. Minor existing zero-area triangles remain documented for Maeda40 and tower46. Independent W3 source reopen/export, integrated model-change invalidation, browser/device operation and overall acceptance remain with QA.
