# Equipment catalog 1.0.1 contract

The catalog is `{schemaVersion:"1.0.1",units:"metres",coordinateSystem:"map-xy-z-up",equipment:[...]}`. The prior 1.0.0 file is preserved. The additive change is nullable typed `articulation`; the snapshot wire contract stays 1.0.0. Shared Zod schemas are authoritative.

`controls` declares translation, slew, boom angle, boom length, trolley and hook separately. A true control identifies tested visual mechanics; engine risk motions require separate validation. `controlNodes` names the preserved nodes. `controlBaselines` records the authored pose, not the manufacturer maximum. `demoPose` is the initial chosen visual state. `movementLimits` contains finite demo ranges or null; null is never interpreted as zero.

For SK and 172, `articulation` is null. Preserve initial transforms and apply pose deltas: slew local Y, trolley local X, hook local Y. Rope Y scale is `initialScale * (ropeLength - heightDelta) / ropeLength`, anchored at the authored top. Chosen hook bounds keep cable lengths positive.

For Tadano, LTM, Maeda and LR, `articulation` is an object:

```
boom: {pivotNode, axis:"z", angleSign:1, tipNode,
       segments:[{node, axis:"x", lengthShare}]}
hook: {node, tipNode}
links: [{node, fromNode, toNode, startFraction, endFraction,
         axis:"y", restLengthM:1, origin:"start"}]
```

Apply boom angle and nested-stage length deltas to initial transforms, then update world matrices. Place hook world X/Z under the physical tip and world Y at the commanded hook datum. For each link, convert endpoint world positions to link-parent coordinates; interpolate its fractional endpoints, position the start, orient local +Y along the span, and set absolute Y scale to span length divided by rest length. Actual link mesh vertices span local Y 0–1 m and remain protected from mesh batching. LR has no extension segments because the selected 32 m lattice assembly has fixed length. The model preserves tower origin; its translation control is false.

`supportGeometry` retains confirmed dimensions with explicit basis (`centres`, `pad-outer`, `undercarriage`, `unknown`). Exact points are null when unconfirmed. The equipment origin is the ground projection of slew; manufacturer origin knowledge remains separate and may be null.

`riskGeometry` is `{presetId,movable,parts:[{part:"body"|"support"|"tail"|"load",frame:"chassis"|"upper"|"hook",polygon:{x,y}[]}]}`. Synthetic polygons can be present with `riskGeometryStatus:"unverified"` for integration testing; that status blocks an acceptance claim until the engine owner verifies the current geometry, offsets and declared motions. Missing geometry is null. Verified means tested synthetic demonstration geometry, never manufacturer safety certification. Source maximum reach never becomes an all-purpose danger disk.

`sourceBlend` is repository relative; `assetUrl` is browser absolute. `sourceEvidence` preserves source ID, URL, pages, SHA-256 and local report. LR retains both the source 008 USA edition and matching metric EN source with distinct hashes. `visualizationNotes` identifies inferred construction details; unsupported controls are documented by selected configuration, not guessed manufacturer limitations.
