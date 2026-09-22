# QD010 correction 01 execution plan

Source preparation is allowed; all Blender/export/test/browser execution requires the parent's QA serial grant.

The independent `verify_shapes.py` oracle pins five physical principal sections, four moving stages and five outer longitudinal planar facets to the archived manufacturer MC305C-5 brochure, page 2, SHA-256 `10ea95a9f92dc35f864b16138bfb723f6ec5a568abbac6c7cea608ecbfaa1a55`. It does not import section dimensions or counts from the generator. Physical candidates must have substantial axial and transverse geometry; empty node placeholders cannot satisfy the count. The additional hollow-shell topology and clearance checks verify the authored reconstruction, not OEM wall thickness.

The single isolated Blender runner will reopen the preserved pre-correction source and record an expected RED against the independent oracle. The observed old source must have four principal geometries and three moving stages, and its raw exterior profiles have four corners. An unexpected error or unexpected pass aborts the runner before export.

After RED, the runner resets Blender, builds the corrected source, verifies its shapes before save/export, reopens the saved source, verifies source shapes and all 24 motion corners, imports the actual exported GLB, repeats shape and 24 motion checks, and renders only the existing baseline overview, side and carrier-detail views. It also compares fixed body/pad/counterweight source geometry with the preserved source. Native process ID, UTC times, statuses and output hashes are captured in `execution-receipt.json`.

Authored stage lengths are `[3.42, 2.33, 2.13, 1.93, 1.79]` m; baseline moving offsets are `[3.02, 1.93, 1.73, 1.53]` m and terminal tip offset is `1.79` m. Each moving stage receives one quarter of the total delta from 10 m. At lengths 8/10/10.6 m each axial overlap is 0.90/0.40/0.25 m. These dimensions and the representative pentagonal profile are authored reconstruction values, not manufacturer section lengths, angles or wall thickness.
