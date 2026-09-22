# UWB azimuth semantics — clarification 1.0.2

This clarification extends the preserved [1.0.1 contract](v1.0.1-addendum.md) without changing its frozen files, wire fields, units, goal or QA thresholds. Technical, Tracking and Mobile Leads agree on the conversion below. It affects coordinate and physical-device checks for AC12/AC13; earlier software results using the opposite sign are not evidence for this corrected behavior.

## Native measurement and server projection

Android documents azimuth as clockwise in its horizontal reference plane. In the upright portrait reference, zero points outward from the phone's back. The [pinned Android35 source](https://android.googlesource.com/platform/prebuilts/fullsdk/sources/+/dc3f885ebe8ddc75bd9cf2d567eef4d1ed433a09/android-35/android/uwb/AngleOfArrivalMeasurement.java#L49) supplies the direction and reference pose. The [AndroidX GMS adapter](https://android.googlesource.com/platform/frameworks/support/+/77dd3dfa840c9142af3e376b80ba1e5740a0d6ec/core/uwb/uwb/src/main/java/androidx/core/uwb/impl/UwbClientSessionScopeImpl.kt#162) preserves the reported degree sign; the native application converts degrees to radians without changing that sign.

`azimuthRad` remains the raw Android angle in uploads and observations. The server performs the sole handedness conversion when projecting into the table's counterclockwise XY coordinates:

```text
bearing = equipmentMarkerHeading + uwbYawRad - azimuthRad
localDisplacement = (planarRange × cos(azimuthRad), -planarRange × sin(azimuthRad))
tableDisplacement = rotateCCW(localDisplacement, equipmentMarkerHeading + uwbYawRad)
```

The [UWB projection](../../src/server/tracking/uwb.ts) then applies calibrated antenna origin/reference offsets. Planar range continues to use reported elevation when available, otherwise measured antenna-height separation. Raw range, azimuth and elevation remain separate evidence and are never replaced by the derived coordinates.

At zero heading/yaw, positive90° projects toward table−Y and negative90° toward table+Y. A positive90° heading combined with positive90° raw azimuth projects toward table+X. Signed regression cases also exercise nonzero height separation and combined heading/yaw, while checking raw angle preservation. These fixtures test software mathematics; they do not prove device radio accuracy or mounting orientation.

## Physical calibration boundary

This implementation uses a yaw-only calibration. The Controller must have a horizontal angular plane, using the documented upright portrait reference. Its tracking marker remains separately parallel to the table through a rigid mounting relationship. Measure marker-to-sensor yaw and independently verify known left/right points, sensor zero, and actual handset angle availability before accepting physical XY.

Keep `uwbYawRad` null until those checks succeed; missing or uncalibrated angles retain range evidence without a usable XY position. Arbitrary pitch/roll or a flat handset requires a3D transform beyond this yaw-only calibration and must not be presented as calibrated. Follow the [calibration guide](../../tools/calibration/README.md). Real four-device measurements and the frozen accuracy/latency tests remain required.

Tracking's correction and native adapter audit preserve the raw measurement boundary. The corresponding source and test hashes are recorded in [the semantic freeze](freeze-v1.0.2.json); final acceptance uses the corrected integrated build and physical evidence.
