# Table tracking and calibration

This is the software measurement path for the synthetic 140m × 50m demonstration. Actual four-phone accuracy, concurrent UWB reception, frame rate and end-to-end latency require the physical QA procedure. No device measurements have been performed by generating the fixtures.

## Markers and coordinates

Print `/markers/sheet.html` at 100% scale, disable fit-to-page, and verify the printed black square is 40mm. The dictionary is **ARUCO_MIP_36h12**. Keep the white quiet border clear. Place corner marker **centers** at these independently measured table coordinates; sheets may extend outside the table:

| ID | Role | Table m | World m |
| --- | --- | --- | --- |
| 0 | Lower left | (0, 0) | (0, 0) |
| 1 | Lower right | (1.4, 0) | (140, 0) |
| 2 | Upper right | (1.4, 0.5) | (140, 50) |
| 3 | Upper left | (0, 0.5) | (0, 50) |
| 10 | EQUIPMENT-A | Moving marker | Moving equipment |
| 11 | WORKER_1 → WORKER-A | Moving marker | Worker A |
| 12 | WORKER_2 → WORKER-B | Moving marker | Worker B |

Table +X follows the long edge, +Y the short edge. The marker's printed rightward direction is its local +X. Its local +Y is 90° counterclockwise from +X when viewed from above the table. These axes are not geographic compass bearings. The equipment reference is the crane slew origin; changing marker heading does not change the separately configured crane jib angle.

## Physical setup

1. Fix the rear CCTV camera so all four reference markers and all three entity markers are visible. Avoid a wide-angle lens, glare, tilt of the entity marker relative to the table, and autofocus changes. Each marker must be flat and parallel to the table. The model assumes a pinhole camera; unmodelled lens distortion is assessed by the independent grid evaluation.
2. Use the example JSON as a field template. Its zeros are a synthetic flat-plane example, not measurements of a phone. Measure each marker plane's `heightM`, the UWB antenna's `antennaHeightM`, and the camera optical center's vertical `heightM` above the table. Supply camera `positionTableM` by dropping its position vertically onto the table plane.
3. Measure `markerToReferenceM` and `markerToAntennaM` in each printed marker's local axes. Record the equipment reference separately from its antenna; neither is assumed to coincide with the center of the phone. Measure the marker-to-UWB-axis rotation in radians as `uwbYawRad`; it is added to the current equipment marker heading.
4. Save your measured JSON and POST it to `/api/tracking/calibration` with the server operator credentials required by the API. A nonzero marker height requires camera position/height. Changing calibration invalidates existing coordinates until the next observation.
5. Select CCTV on one phone and send JPEG JSON frames to `/api/tracking/frame` at 5–10fps. Each uploader instance supplies a new `streamId` UUID and a strictly increasing `sequence`, camera ID, UTC capture time and JPEG base64. A new stream may restart its sequence without resetting calibration; its capture time must not precede the last accepted frame or be stale on receipt. A retired stream cannot resume. Legacy uploads without a stream ID share one default sequence. Server image decoding and marker detection determine positions; supplied width/height are only capture metadata. No supplied pixel coordinates are accepted as tracking evidence.
6. Observe `/api/tracking` while moving all three markers. Cover each entity marker and then a corner marker; coordinates must become unavailable, retaining the last observation timestamp. Stop frames and verify stale status after 1000ms. Moving the equipment marker changes its world position and the UWB origin.

Frames older than 1000ms are rejected on receipt, including the first frame after startup. Recalibrating the same camera clears visible observations and invalidates in-flight processing while preserving stream ordering and retired identities. Selecting a different camera, explicitly resetting the tracking service, or restarting the server starts a new service epoch and clears those in-memory ordering records.

## Height and sensor processing

The current frame's four corner centers determine a projective mapping to the table plane. For an elevated parallel marker, the plane-projected point `q` is corrected to `p = cameraXY + (1 − markerHeight/cameraHeight) × (q − cameraXY)`. The same correction applies to heading endpoints before rotating local offsets. Reported positions are the corrected reference points, not phone exterior dimensions.

UWB retains the raw slant distance as `tableDistanceM` and its 100× scale as `worldDistanceM`. Missing distance or azimuth never supplies a 2D position. A usable azimuth also requires calibrated sensor orientation, a fresh equipment camera origin, and either an elevation angle or both measured antenna heights. Corrected planar displacement uses the current equipment heading. A nonzero worker antenna/reference offset requires the current worker heading. Camera and UWB observations remain separate; camera coordinates are never relabelled UWB.

`azimuthRad` preserves Android's clockwise sensor angle in radians. Only the server's projection converts it into the table's counterclockwise XY axes: `bearing = equipmentMarkerHeading + uwbYawRad - azimuthRad`. Positive 90° therefore turns toward table −Y when marker heading and yaw are zero. The raw reported angle is unchanged. This follows the [Android angular reference](https://android.googlesource.com/platform/prebuilts/fullsdk/sources/android-31/+/93554f2df46f2f3b22f9386142ea02396c1f2a0d/android/uwb/AngleOfArrivalMeasurement.java).

For this yaw-only model, mount the UWB controller upright in portrait so its angular plane is horizontal; its zero ray points away from the phone's back. Keep the tracking marker separately parallel to the table, using a rigid bracket if needed, and measure that marker-to-sensor yaw. A phone lying flat or tilted requires a full 3D sensor transform that this calibration does not provide. Until upright alignment, sign and sensor zero are physically verified, leave `uwbYawRad` null so UWB cannot publish XY. Test known left/right points independently; mathematical angle fixtures do not verify a handset's mounting or radio accuracy.

Every observation also retains `inputSource` separately from the measurement technique: `live`, `synthetic`, or `unknown`. The authenticated upload route marks operator UWB fixtures synthetic. UWB `rangeInputSource` preserves the raw range provenance; its derived XY becomes synthetic if any required camera anchor is synthetic, or unknown if required provenance is missing. A live radio range therefore does not make a synthetic camera origin a live position measurement.

## Evaluate before use

Freeze the camera and independently measure the nine evaluation points x=0.10/0.70/1.30m × y=0.05/0.25/0.45m. The four fitting corners are not evaluation samples. Collect 30 stable samples at every point for each entity marker, 810 total. Record reference XY, reported XY, capture/receive/render timestamps, visibility, marker/antenna offsets and heights. Report mean, nearest-rank p95 and maximum Euclidean error, by marker and overall. The frozen target is p95 table error ≤0.02m, world ≤2m. Set `evaluationErrorM` only from this measured result; otherwise it stays null and uncertainty is unknown.

Capture-to-render latency requires measured clock offsets; if uncertainty exceeds 50ms, use a filmed physical timer. Receiving 5–10fps alone does not demonstrate the latency target or collision avoidance performance. UWB error distributions and unavailable angles must be recorded independently of camera accuracy.

## Software-only fixtures

`tools/calibration/fixtures.ts` renders dictionary markers to pixels and encodes real JPEG bytes for detector integration tests. These are synthetic images, not camera measurements. `tests/tracking-*.test.ts` exercises image decoding, projective coordinates, scale, null angles, stale observations, heights and offsets. The exact numerical transform target is ≤1e-6m; raster detector tests have their own pixel sampling error and do not satisfy the physical 810-sample gate.

Dependency source: [js-aruco2](https://github.com/damianofalcioni/js-aruco2/tree/0491d5d228746411d0e9dd602b98f48636a644ba), MIT license, pinned npm version 2.0.0. JPEG decoding uses Sharp in the same Node server; no Python service is required.

Regenerate the printable files with `npm exec -- tsx tools/calibration/generate.ts`. Run the actual JPEG test suite with `npm exec -- vitest run tests/tracking-*.test.ts`; run the synthetic resolution benchmark with `npm exec -- tsx tools/calibration/benchmark.ts`. Its JSON records every sample and environment. It is software evidence only.

Type-check the tracking implementation and calibration tools with `npm exec -- tsc --project tools/calibration/tsconfig.json`. The optional `npm exec -- tsx tools/calibration/http-smoke.ts` performs real HTTP mutations on the local development server using explicitly synthetic data; coordinate a quiet demo window first. Its result file states whether an earlier calibration was restored or synthetic state remains, and never establishes physical sensor accuracy.

## Device clock handshake (tracking contract 1.0.1)

Before uploading measurements, probe authenticated `GET /api/clock` three times. Measure round-trip duration with a monotonic device clock, preserving the device UTC send/receive times and the returned `serverAt`. Choose the smallest round trip. Use `offsetMs = serverAt − deviceReceiveAt`, a conservative lower bound on server-minus-device offset, and `uncertaintyMs = measuredRoundTripMs`. Each uploaded `capturedAt` is the raw device capture UTC plus this offset. Attach `captureClock: { deviceCapturedAt, offsetMs, uncertaintyMs, synchronizedAt }`; the server preserves it with the observation. Re-synchronize after foreground return or a device clock change.

This is a bounded timestamp, not an exact latency claim. The real server capture time lies between adjusted `capturedAt` and `capturedAt + uncertaintyMs`, assuming stable device clocks during the probe and capture. The server rejects future captures; a clock jump requires re-synchronization. Use the retained interval when evaluating capture-to-render latency. Uncertainty above 50ms requires the filmed-timer method or an inconclusive latency result under G0. Legacy uploads without clock evidence remain readable; they cannot establish cross-device latency accuracy.

For UWB observations the reported uncertainty is the device's range uncertainty when available; it does not certify angular or combined planar coordinate accuracy. The camera's `evaluationErrorM` comes from the independent physical grid measurement, never from the four fitted calibration corners.
