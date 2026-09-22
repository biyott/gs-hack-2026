# AC12 LR1100 boom-pivot dimensional crosswalk v1

Owner `/root/qa_lead/qa_ui_device`; bounded read-only preparation for frozen candidate `sha256:70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`. Product inputs are solely `/home/b/.cache/gs-safety-ci.u7pR52`. No Blender, browser, application, device or model runtime was opened. This is an additive source/artifact finding; original cards, G0 and prior evidence remain unchanged.

**Finding Q-UI-AC12-LR-PIVOT-001:** the supplied LR1100 source and frozen GLB place the functional boom pivot **2.100 m forward of the slew axis**, versus **1.200 m** in the archived manufacturer drawing. The **+0.900 m longitudinal departure is real in the artifact**, not explained by parent origins, a height dimension, unit scale or Blender/glTF axis conversion. The asset explicitly calls its fitting positions visual reconstructions; that qualification is preserved, but does not make the two dimensions equal or establish manufacturer fidelity. Design factual clarification was requested; no correction or acceptance waiver is authorized by this note.

## Existing acceptance and selected configuration

Frozen `goal.input.txt` E, lines 74–79, fixes actual-metre units, six presets, comparison to the selected manufacturer sheets, LR 32 m main boom/no fixed jib, and separate visual and risk geometry. `acceptance.md` AC12, lines 22/45, requires comparing source008 fixed sheets/configuration/shape/motion and correct units/axes/specs. Source008 lines 48/59 select LR1100.1 EN-US p8/14 and the 32 m configuration. No new dimension tolerance, CAD-exact requirement, numerical performance threshold or mechanical safety claim is introduced here.

The staged catalog identifies this same LR1100.1, links both selected EN-US and same-family metric EN p8/14, uses 32 m/60° demo pose, and leaves manufacturer slew datum and boom-pivot height unverified. The main boom is 5.5 +6 +12 +8.5 =32 m; no fixed or auxiliary jib is modeled. The 60° pose and 45–70° motion range are chosen demo values, not certified operating limits. None of these choices provides a 0.900 m longitudinal reference shift.

## Primary drawing reading

Directly inspected the archived manufacturer page image `evidence/research/manufacturer/liebherr/lr1100/english-p08-detail-side.png`, not an actual camera image. EN document LR8503.02.03, v01.092022, p8 labels the horizontal dimension `1200*` between the boom-side pivot reference and the slew-axis reference; the legend says `* Boom pivot point`. The longer 4700 mm horizontal reference runs from the same slew-axis line to the rear ballast. Thus `1200*` is a longitudinal offset towards the boom, not a pivot height.

The selected US p8 extracted text contains `3′11″*` and the same boom-pivot legend. Its approximate conversion is `(3×12+11)×0.0254=1.1938 m`, consistent with the metric 1.200 m nominal dimension and not with 2.100 m. The metric research report at line 28 records this same interpretation. PDF dimensions are nominal/rounded; the drawing does not verify the model's assumed 1.95 m pivot height.

Primary PDF SHA-256: `843ac3a7fb711bd2fede5dc5f5ba2b2798cfbf3cb52faeff4515cacf1e082e52`; viewed side-image SHA-256: `5b949756f373848bac61958e527f8e7a15fafdacd7308bae642d4a35411a9f52`; research report SHA-256: `ab1634e25c3d1685eedaef32256e41842f7bb8c0bd813219fe834176e9a3e8e3`. The source report supplies the official URLs and acquisition metadata. The existing primary bytes were read locally; no new network retrieval was performed.

## Local coordinates and functional point

All source paths in this table are relative to the frozen stage.

| Evidence | Meaning |
| --- | --- |
| `resources/blender/safety-simulator/lattice-cranes/README.md:29` | ROOT is ground-level slew centre; +X is boom direction, Blender +Z up; identity scale; 1 unit=1 m. |
| `lattice-cranes/geometry.py:45` under the same asset directory | Builder assigns `node.parent=parent` and `node.location=loc` at lines48/49; it does not preserve an old world transform or add an offset. |
| `lattice-cranes/crawler_geometry.py:112` and `:122` | ROOT=(0,0,0); SLEW=(0,0,1.70) under ROOT. No longitudinal parent translation. |
| `lattice-cranes/crawler_geometry.py:124`–`:132` | BOOM_PIVOT=(2.1,0,0.25) under SLEW, rotated −60° about Blender Y. The first 5.5 m boom section starts at local x0, and BOOM_TIP/main head sheave are at local x32 under this pivot. This is the assembly's functional luffing origin, not a separately offset annotation point. |
| `lattice-cranes/lr_rig.py:32`–`:44` | Luff rotates BOOM_PIVOT; tip derives from its full transform applied to (32,0,0); hook horizontal position follows that tip. |
| `lattice-cranes/export_asset.py:19`–`:60` | Meshes bake relative to protected parent nodes while the control hierarchy is retained; Y-up export changes axes, not X-offset magnitude. |
| `src/components/scene/equipment-rig.ts:43`–`:73` | Runtime retains the loaded pivot position and changes its rotation from baseline. It does not subtract 0.900 m from the pivot. |
| `src/components/scene/EquipmentModel.tsx:24` | Whole model placement applies equipment world translation/heading and unit scale through line28. This common rigid transform cannot reconcile the relative pivot-to-slew distance. |
| `data/equipment/catalog.json:1381`–`:1398` | BOOM_PIVOT is the actual control node; baseline tip height29.6628129 and hook height17.6628129 match the constructed rig. `manufacturerSlewDatum:null` does not insert a runtime coordinate transform. |

Blender source chain at default slew:

```text
ROOT identity
  SLEW translation (0,0,1.70)
    BOOM_PIVOT translation (2.1,0,0.25), luff −60° around Y
      BOOM_TIP (32,0,0)

pivot relative to ground slew origin = (2.1,0,1.95) m
modeled tip x = 2.1 + 32 cos60° = 18.1 m
modeled tip z = 1.70 + 0.25 + 32 sin60° = 29.6628129 m
```

Changing only the forward pivot coordinate to the drawing's 1.2 while retaining the model's assumed height and chosen pose would give tip x17.2, a −0.9 m change, with the hook's horizontal position following it. This is a conditional comparison, **not** a claim that the manufacturer supplied a complete 3D tip/hook coordinate. The offset remains 0.9 m in magnitude under common rigid world heading/slew transforms. Do not infer a risk-engine or route error solely from this visual difference; risk geometry is a separate contract and requires its own comparison.

## Frozen GLB bytes independently corroborate the source

Parsed only the GLB v2 JSON chunk, without importing a renderer, loading meshes into Blender or manipulating a runtime. GLB path `public/assets/cranes/liebherr-lr1100.glb`, 663096 bytes, SHA-256 `dc8e607adb50400f684eb64b3c4f6bb5f0a5b428f6f9dbde6ba84d97b147206a`.

| Node | Parent | glTF translation | Rotation/scale observation |
| --- | --- | --- | --- |
| ROOT33 | scene | (0,0,0) | Identity |
| SLEW30 | ROOT33 | (0,1.7000000477,0) | Identity |
| BOOM_PIVOT17 | SLEW30 | (2.0999999046,0.25,0) | Quaternion (0,0,0.5,0.8660253882), unit scale |
| BOOM_TIP16 | BOOM_PIVOT17 | (32,0,0) | Identity local rotation/scale |
| HOOK23 | SLEW30 | (18.0999984741,15.9628133774,0) | Identity local rotation/scale |

Blender `(x,y,z)` maps to glTF `(x,z,−y)`. Consequently the frozen pivot's glTF ground-origin position is `(2.0999999046,1.9500000477,0)`, and its forward offset is still approximately2.1 m. Float32 rounding accounts for the sub-micrometre representation difference, not the 0.9 m departure. There is no hidden parent matrix, scale or compensating X translation in the inspected chain.

## Disposition and next bound observation

Record this as a confirmed source-to-asset dimensional departure for AC12's independent dimensional crosswalk. The evidence supports matching **functional reference meanings**: boom-foot luffing pivot relative to the slew axis. No alternative reference-point mapping is documented that reconciles them. Design has been asked whether it intended another physical joint/datum and to provide factual evidence if so. Any answer is appended as provenance; the frozen C1 source/GLB and current observation remain preserved.

This is not an overall AC12 or G4 verdict, not an assertion that all LR geometry is inaccurate, and not permission to rebuild assets during W1. QA Lead/Root own disposition and any new candidate. A future changed pivot would require a new source/GLB/manifest binding and affected rig/endpoint/application checks; this note neither orders that change nor declares it sufficient.

Machine-readable evidence, exact node data, method, math and hashes for 17 inputs: `../../evidence/qa/ui-device/candidate-70da1337/lr1100-pivot-crosswalk-v1.json`. The W3 harness remains pinned to C1; a replacement candidate needs an explicit manifest/grant.

## Addendum: Design factual concurrence and future binding

After the above observation, `/root/design_assets` replied that it is the same physical boom-foot hinge, with no evidenced alternate datum. Design independently read the archived ENp8 `1200*` annotation and the same frozen GLB chain: ROOT identity, SLEW(0,1.70000005,0), BOOM_PIVOT(2.09999990,0.25,0), unit scales, BOOM_TIP child(32,0,0), no compensating X translation. Design concurs with the0.9m known longitudinal departure and distinguishes the unverified height. This is owner corroboration, separately attributed; the independent source/GLB observation above remains unchanged. No product edit or Blender operation was reported in that response. Root owns disposition and any replacement candidate.

The earlier pending-question and C1-only harness text is historical. Additive W3 binding v2 now accepts an explicit separate candidate receipt/root/manifest; C1 findings are never transferred to changed bytes without affected checks. Neither this owner response nor the v2 preparation grants a W3 live window.
