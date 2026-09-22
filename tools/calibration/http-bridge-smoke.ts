import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { CatalogSchema } from "../../packages/contracts/src/catalog";
import { ServerClockSchema } from "../../packages/contracts/src/clock";
import type { SimulationSnapshot } from "../../packages/contracts/src/state";
import { type Calibration, CalibrationSchema } from "../../packages/contracts/src/tracking";
import { defaultDemoAccounts } from "../../src/server/auth/config";
import { createTrackingFixture } from "./fixtures";
import {
  freshPositionChecks,
  originalIncidentHistoryPreserved,
  workerRecoveryChecks,
} from "./http-bridge-assertions";
import { type BridgeChange, BridgeSmokeClient, scenarioStateUnchanged } from "./http-bridge-client";
import { captureTime, HttpSmokeClient, SmokeFailure } from "./http-smoke-client";

const startedAt = new Date().toISOString();
const smokeId = `synthetic-bridge-${randomUUID()}`;
const client = new HttpSmokeClient("http://localhost:3000");
const bridge = new BridgeSmokeClient(client);
const checks: Readonly<{ name: string; passed: boolean }>[] = [];
const check = (name: string, passed: boolean) => checks.push({ name, passed });
let original: SimulationSnapshot | null = null;
let originalCalibration: Calibration | null = null;
let modeAttempted = false;
let calibrationAttempted = false;
let failure: string | null = null;
let restoration = "unchanged";

const simulation = (phase: string) => bridge.simulation(phase);
const command = (change: BridgeChange) => bridge.command(change, original?.run.runId ?? "");

try {
  const account = defaultDemoAccounts().find(({ role }) => role === "admin");
  if (!account) throw new SmokeFailure("DEMO_ADMIN_UNAVAILABLE");
  await client.login({ actorId: account.id, role: account.role, accessCode: account.pin });
  await bridge.warmupTrackingRoutes();
  original = await simulation("original");
  const otherMode = await bridge.simulation("other-mode-original", "fire-gas");
  if (original.run.scenarioId !== "EQ-PROFILE-ROUTES" || original.run.status !== "paused")
    throw new SmokeFailure("AGREED_PAUSED_SCENARIO_REQUIRED");
  const catalog = CatalogSchema.parse(await (await client.request("/api/catalog")).json());
  if (
    !catalog.equipment.find(({ id }) => id === original?.equipment.presetId)?.controls.translation
  )
    throw new SmokeFailure("MOVABLE_EQUIPMENT_REQUIRED");
  originalCalibration = (await client.tracking()).calibration;
  if (
    originalCalibration &&
    !/synthetic|smoke|fixture|benchmark/i.test(originalCalibration.version)
  )
    throw new SmokeFailure("PRESERVED_NON_SYNTHETIC_CALIBRATION");
  const clock = ServerClockSchema.parse(await (await client.request("/api/clock")).json());
  const offsetMs = Date.parse(clock.serverAt) - Date.now();
  const calibration = CalibrationSchema.parse(
    JSON.parse(await readFile("tools/calibration/example-calibration.json", "utf8")),
  );
  const positions = { 10: { x: 0.35, y: 0.25 }, 11: { x: 0.65, y: 0.25 } } as const;
  const jpeg = await createTrackingFixture({ positions });
  const prelude = await createTrackingFixture({ positions, hiddenIds: [12] });
  calibrationAttempted = true;
  await client.tracking("/calibration", {
    ...calibration,
    version: smokeId,
    cameraId: smokeId,
    uwbYawRad: 0,
  });
  modeAttempted = true;
  await command({ action: "position-input", input: "measured" });
  await command({ action: "resume" });
  const frameContext = { smokeId, offsetMs, synchronizedAt: clock.serverAt };
  await bridge.frame({ ...frameContext, jpeg: prelude, sequence: 1 });
  const beforeFrame = await simulation("recovery-baseline");
  const accepted = await bridge.frame({ ...frameContext, jpeg, sequence: 2 });
  check(
    "accepted-synthetic-camera-frame",
    accepted.camera?.source === "synthetic" &&
      accepted.cameraObservations.every(
        (item) => item.status === "valid" && item.inputSource === "synthetic",
      ),
  );
  const angular = await client.tracking("/uwb", {
    deviceId: smokeId,
    sessionEpoch: smokeId,
    workerId: "WORKER-A",
    sequence: 1,
    ...captureTime(offsetMs, clock.serverAt),
    distanceM: 0.1,
    azimuthRad: Math.PI / 2,
    elevationRad: 0,
    uncertaintyM: 0.001,
  });
  const angle = angular.uwbObservations.find(({ entityId }) => entityId === "WORKER-A");
  check(
    "positive-90deg-raw-angle-preserved",
    angle?.azimuthRad === Math.PI / 2 && angle.inputSource === "synthetic",
  );
  check(
    "positive-90deg-projects-clockwise",
    angle?.status === "valid" &&
      Math.abs((angle.tablePositionM?.x ?? Infinity) - 0.35) < 0.02 &&
      Math.abs((angle.tablePositionM?.y ?? Infinity) - 0.15) < 0.02,
  );
  const fresh = await simulation("fresh-measured");
  const trackedFresh = fresh.workers.filter(({ workerId }) =>
    ["WORKER-A", "WORKER-B"].includes(workerId),
  );
  checks.push(...freshPositionChecks(fresh), ...workerRecoveryChecks(beforeFrame, fresh));
  const routed = trackedFresh.filter(
    (worker) => (worker.currentGuidance?.waypoints.length ?? 0) > 0,
  );
  check("fresh-route-present-before-aging", routed.length > 0);
  await setTimeout(1250);
  const stale = await simulation("aged-without-upload");
  const trackedStale = stale.workers.filter(({ workerId }) =>
    ["WORKER-A", "WORKER-B"].includes(workerId),
  );
  check(
    "workers-age-without-upload",
    trackedStale.length === 2 &&
      trackedStale.every(
        (worker) =>
          worker.positionStatus === "stale" &&
          worker.position === null &&
          worker.positionInputSource === "synthetic",
      ),
  );
  check(
    "equipment-ages-without-upload",
    stale.equipment.positionStatus === "stale" &&
      stale.equipment.positionInputSource === "synthetic",
  );
  check(
    "stale-guidance-has-no-route",
    trackedStale.every(
      ({ currentGuidance: guidance }) =>
        guidance?.actionCode === "POSITION_UNKNOWN" &&
        guidance.waypoints.length === 0 &&
        guidance.routeVersion === null &&
        guidance.stepId === null &&
        guidance.destinationId === null,
    ),
  );
  check(
    "previous-route-guidance-invalidated",
    routed.length > 0 &&
      routed.every((worker) => {
        const next = trackedStale.find(
          ({ workerId }) => workerId === worker.workerId,
        )?.currentGuidance;
        return (
          next !== null &&
          next !== undefined &&
          next.guidanceVersion > (worker.currentGuidance?.guidanceVersion ?? 0)
        );
      }),
  );
  const unchangedFrame = await client.tracking();
  check(
    "no-new-frame-required-for-aging",
    unchangedFrame.camera?.frameId === accepted.camera?.frameId &&
      unchangedFrame.receivedFrames === accepted.receivedFrames,
  );
  const otherAfter = await bridge.simulation("other-mode-after-upload", "fire-gas");
  check("scenario-mode-source-isolation", scenarioStateUnchanged(otherMode, otherAfter));
} catch (error) {
  failure =
    error instanceof SmokeFailure
      ? error.message
      : error instanceof Error
        ? error.name
        : "UNKNOWN_FAILURE";
} finally {
  if (modeAttempted && original) {
    try {
      if ((await simulation("before-restoration")).run.status === "running")
        await command({ action: "pause" });
      await command({ action: "position-input", input: original.run.positionInput });
      const restored = await simulation("restored");
      check(
        "input-status-run-identity-restored",
        restored.run.runId === original.run.runId &&
          restored.run.positionInput === original.run.positionInput &&
          restored.run.status === original.run.status,
      );
      check(
        "original-incident-history-preserved",
        originalIncidentHistoryPreserved(
          original,
          bridge.snapshots
            .map(({ snapshot }) => snapshot)
            .filter(({ run }) => run.runId === original?.run.runId),
        ),
      );
      restoration =
        "Original input/paused status/run identity restored; clock, versions, audit and incident history intentionally retained.";
    } catch (error) {
      failure ??=
        error instanceof Error ? "MODE_RESTORATION_FAILED" : "UNKNOWN_RESTORATION_FAILURE";
      restoration = "MODE_RESTORATION_FAILED";
    }
  }
  if (calibrationAttempted && originalCalibration) {
    try {
      await client.tracking("/calibration", originalCalibration);
    } catch (error) {
      failure ??=
        error instanceof Error ? "CALIBRATION_RESTORATION_FAILED" : "UNKNOWN_CALIBRATION_FAILURE";
    }
  }
  if (client.authenticated) {
    try {
      await client.request("/api/session", { method: "DELETE", expectedStatus: 204 });
    } catch (error) {
      failure ??= error instanceof Error ? "SESSION_CLEANUP_FAILED" : "UNKNOWN_SESSION_FAILURE";
    }
  }
  const outcome = failure === null && checks.every(({ passed }) => passed) ? "PASS" : "FAIL";
  const report = {
    evidenceType:
      "Synthetic HTTP bridge/angle software evidence only; no physical UWB, camera or accuracy pass.",
    fixtureReason:
      "Scenario-aligned equipment (35,25) and worker A (65,25) exercise the mapped egress route. Setup sequence 1 hides worker B marker 12; sequence 2 reveals B at (90,40) to isolate recovery. The earlier worker (40,25) correctly returned ROUTE_UNAVAILABLE because it lacked a mapped egress attachment; that failed run is retained.",
    startedAt,
    completedAt: new Date().toISOString(),
    smokeId,
    outcome,
    failure,
    restoration,
    checks,
    requests: client.requests,
    warmupRequests: bridge.warmupRequests,
    tracking: client.snapshots,
    simulations: bridge.snapshots,
  };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(
    `tools/calibration/http-bridge-smoke-results-${startedAt.replace(/[-:.]/g, "")}.json`,
    json,
  );
  await writeFile("tools/calibration/http-bridge-smoke-results.json", json);
  console.log(JSON.stringify({ outcome, failure, checks, restoration }));
  process.exitCode = outcome === "PASS" ? 0 : 1;
}
