import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { isDeepStrictEqual } from "node:util";
import { ServerClockSchema } from "../../packages/contracts/src/clock";
import {
  type Calibration,
  CalibrationSchema,
  type TrackingSnapshot,
} from "../../packages/contracts/src/tracking";
import { defaultDemoAccounts } from "../../src/server/auth/config";
import { createTrackingFixture } from "./fixtures";
import { captureTime, HttpSmokeClient, SmokeFailure } from "./http-smoke-client";

const baseUrl = "http://localhost:3000";
const startedAt = new Date().toISOString();
const smokeId = `synthetic-http-smoke-${randomUUID()}`;
const client = new HttpSmokeClient(baseUrl);
const checks: Readonly<{ name: string; passed: boolean }>[] = [];
const evidence = new Map<string, unknown>();
let clockOffsetMs = 0;
let synchronizedAt = startedAt;
let sequence = 0;
let originalCalibration: Calibration | null = null;
let calibrationChanged = false;
let remainingState = "unchanged";
let failure: string | null = null;

const check = (name: string, passed: boolean) => checks.push({ name, passed });

async function uploadFrame(jpeg: Buffer): Promise<TrackingSnapshot> {
  sequence += 1;
  const clock = captureTime(clockOffsetMs, synchronizedAt);
  const snapshot = await client.tracking("/frame", {
    cameraId: smokeId,
    streamId: smokeId,
    frameId: `${smokeId}:${sequence}`,
    sequence,
    ...clock,
    jpegBase64: jpeg.toString("base64"),
    source: "synthetic",
    width: 1280,
    height: 720,
  });
  check(
    `frame-${sequence}-clock-metadata`,
    isDeepStrictEqual(snapshot.camera?.captureClock, clock.captureClock),
  );
  return snapshot;
}

try {
  const account = defaultDemoAccounts().find(({ role }) => role === "admin");
  if (!account) throw new SmokeFailure("DEMO_ADMIN_UNAVAILABLE");
  await client.login({ actorId: account.id, role: account.role, accessCode: account.pin });
  originalCalibration = (await client.tracking()).calibration;
  if (
    originalCalibration &&
    !/synthetic|smoke|fixture|benchmark/i.test(originalCalibration.version)
  )
    throw new SmokeFailure("PRESERVED_EXISTING_NON_SYNTHETIC_CALIBRATION");
  for (const path of ["/api/tracking/calibration", "/api/tracking/frame", "/api/tracking/uwb"]) {
    await (
      await client.request(path, { method: "POST", body: {}, expectedStatus: 400 })
    ).arrayBuffer();
  }
  const clock = ServerClockSchema.parse(await (await client.request("/api/clock")).json());
  evidence.set("server-clock", clock);
  synchronizedAt = clock.serverAt;
  clockOffsetMs = Date.parse(clock.serverAt) - Date.now();
  check("authenticated-server-clock", Number.isFinite(clockOffsetMs));
  const calibration = CalibrationSchema.parse(
    JSON.parse(await readFile("tools/calibration/example-calibration.json", "utf8")),
  );
  const [baselineJpeg, movedJpeg, occludedJpeg] = await Promise.all([
    createTrackingFixture(),
    createTrackingFixture({ positions: { 10: { x: 0.5, y: 0.25 } } }),
    createTrackingFixture({ hiddenIds: [11], positions: { 10: { x: 0.5, y: 0.25 } } }),
  ]);
  calibrationChanged = true;
  const calibrated = await client.tracking("/calibration", {
    ...calibration,
    cameraId: smokeId,
    version: smokeId,
  });
  check("synthetic-calibration-applied", calibrated.calibration?.version === smokeId);
  const baseline = await uploadFrame(baselineJpeg);
  check(
    "actual-jpeg-seven-markers",
    baseline.camera?.detectedMarkerIds.toSorted((a, b) => a - b).join(",") === "0,1,2,3,10,11,12",
  );
  check(
    "camera-provenance",
    baseline.camera?.source === "synthetic" &&
      baseline.cameraObservations
        .map(({ entityId }) => entityId)
        .sort()
        .join(",") === "EQUIPMENT-A,WORKER-A,WORKER-B" &&
      baseline.cameraObservations.every(
        (item) => item.source === "camera-marker" && item.inputSource === "synthetic",
      ) &&
      baseline.updates.length === 3 &&
      baseline.updates.every((item) => item.inputSource === "synthetic"),
  );
  const expected = {
    "EQUIPMENT-A": { x: 0.3, y: 0.25 },
    "WORKER-A": { x: 0.65, y: 0.25 },
    "WORKER-B": { x: 0.9, y: 0.4 },
  } as const;
  for (const observation of baseline.cameraObservations) {
    const target = expected[observation.entityId];
    const errorM = observation.tablePositionM
      ? Math.hypot(observation.tablePositionM.x - target.x, observation.tablePositionM.y - target.y)
      : Infinity;
    evidence.set(`camera-error-${observation.entityId}`, errorM);
    check(
      `camera-coordinate-${observation.entityId}`,
      observation.status === "valid" && errorM <= 0.02,
    );
  }
  const latestJpeg = await client.request("/api/tracking/frame");
  evidence.set("jpeg-byte-length", baselineJpeg.length);
  evidence.set("jpeg-cache-control", latestJpeg.headers.get("cache-control"));
  check(
    "authenticated-latest-jpeg-byte-equality",
    Buffer.from(await latestJpeg.arrayBuffer()).equals(baselineJpeg) &&
      latestJpeg.headers.get("content-type") === "image/jpeg",
  );
  checks.push(...(await client.frameIdentityChecks(baseline.camera, latestJpeg)));
  const current = await client.tracking();
  check(
    "get-current-camera-coordinates",
    current.camera?.source === "synthetic" &&
      current.camera.frameId === baseline.camera?.frameId &&
      current.cameraObservations.every(
        (item) => item.status === "valid" && item.source === "camera-marker",
      ),
  );
  const uwbClock = captureTime(clockOffsetMs, synchronizedAt);
  const withUwb = await client.tracking("/uwb", {
    deviceId: `${smokeId}-equipment`,
    sessionEpoch: smokeId,
    workerId: "WORKER-A",
    sequence: 1,
    ...uwbClock,
    distanceM: 0.371,
    azimuthRad: null,
    elevationRad: null,
    uncertaintyM: 0.042,
  });
  const uwb = withUwb.uwbObservations.find(({ entityId }) => entityId === "WORKER-A");
  check(
    "distance-only-raw-preserved",
    uwb?.status === "distance-only" &&
      uwb.inputSource === "synthetic" &&
      uwb.tableDistanceM === 0.371 &&
      uwb.worldDistanceM === 37.1 &&
      uwb.uncertaintyTableM === 0.042 &&
      uwb.azimuthRad === null &&
      uwb.elevationRad === null,
  );
  check(
    "distance-only-null-xy-distinct-camera",
    uwb?.position === null &&
      uwb.tablePositionM === null &&
      uwb.tablePositionCm === null &&
      withUwb.updates.find(({ entityId }) => entityId === "WORKER-A")?.source === "camera-marker",
  );
  check("uwb-clock-metadata", isDeepStrictEqual(uwb?.captureClock, uwbClock.captureClock));
  const moved = await uploadFrame(movedJpeg);
  const equipment = moved.cameraObservations.find(({ entityId }) => entityId === "EQUIPMENT-A");
  check(
    "moving-equipment-from-jpeg",
    equipment?.status === "valid" &&
      Math.abs((equipment.tablePositionM?.x ?? Infinity) - 0.5) <= 0.02,
  );
  const occluded = await uploadFrame(occludedJpeg);
  const worker = occluded.cameraObservations.find(({ entityId }) => entityId === "WORKER-A");
  check(
    "occluded-worker-unavailable",
    worker?.status === "occluded" &&
      worker.position === null &&
      worker.tablePositionM === null &&
      worker.lastObservedAt === moved.camera?.capturedAt,
  );
  await setTimeout(1100);
  const stale = await client.tracking();
  check(
    "stale-after-1000ms",
    stale.cameraObservations.every(
      (item) => item.status === "stale" && item.position === null && (item.ageMs ?? 0) > 1000,
    ),
  );
  check(
    "stale-uwb-keeps-raw-range",
    stale.uwbObservations[0]?.status === "stale" &&
      stale.uwbObservations[0]?.tableDistanceM === 0.371 &&
      stale.uwbObservations[0]?.position === null,
  );
} catch (error) {
  failure =
    error instanceof SmokeFailure
      ? error.message
      : error instanceof Error
        ? error.name
        : "UNKNOWN_FAILURE";
} finally {
  if (calibrationChanged) {
    remainingState = "original-null; synthetic calibration/observations may remain";
    if (originalCalibration) {
      try {
        await (
          await client.request("/api/tracking/calibration", {
            method: "POST",
            body: originalCalibration,
          })
        ).arrayBuffer();
        remainingState = "synthetic calibration restored; observations reset; history preserved";
      } catch (error) {
        remainingState = "RESTORATION_FAILED; synthetic fixture remains";
        failure ??= error instanceof Error ? "RESTORATION_FAILED" : "UNKNOWN_RESTORATION_FAILURE";
      }
    }
  }
  if (client.authenticated) {
    try {
      await client.request("/api/session", { method: "DELETE", expectedStatus: 204 });
    } catch (error) {
      failure ??=
        error instanceof Error ? "SESSION_CLEANUP_FAILED" : "UNKNOWN_SESSION_CLEANUP_FAILURE";
    }
  }
  const outcome = failure === null && checks.every(({ passed }) => passed) ? "PASS" : "FAIL";
  const failedChecks = checks.filter(({ passed }) => !passed).map(({ name }) => name);
  const summary = { outcome, checks: checks.length, failedChecks, failure, remainingState };
  const report = {
    ...summary,
    evidenceType: "Synthetic HTTP only; no physical camera, radio, or table-accuracy pass.",
    startedAt,
    completedAt: new Date().toISOString(),
    baseUrl,
    smokeId,
    checks,
    requests: client.requests,
    snapshots: client.snapshots,
    evidence: Object.fromEntries(evidence),
  };
  await writeFile(
    "tools/calibration/http-smoke-results.json",
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(summary));
  process.exitCode = outcome === "PASS" ? 0 : 1;
}
