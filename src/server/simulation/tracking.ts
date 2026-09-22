import type { TrackingSnapshot } from "@/contracts";
import { getRuntimeServices } from "../services/runtime";
import { getTrackingServices } from "../services/tracking";
import { TRACKING_STALE_MS } from "../tracking/types";
import { projectTracking } from "./tracking-projection";

export { projectTracking } from "./tracking-projection";

export function refreshTrackingAge(): void {
  const runtime = globalThis.gsSafetyRuntimeServices?.runtime;
  if (runtime === undefined) return;
  const tracking = getTrackingServices().tracking.getSnapshot();
  const stale = new Set(
    tracking.updates
      .filter((observation) => observation.status === "stale")
      .map((observation) => observation.entityId),
  );
  const cameraStale =
    tracking.camera !== null &&
    Date.now() - Date.parse(tracking.camera.capturedAt) > TRACKING_STALE_MS;
  const changed = [...runtime.runs.values()].some(
    ({ snapshot, configuration }) =>
      (snapshot.run.positionInput === "measured" &&
        (snapshot.workers.some(
          (worker) =>
            (worker.workerId === "WORKER-A" || worker.workerId === "WORKER-B") &&
            stale.has(worker.workerId) &&
            worker.positionStatus !== "stale",
        ) ||
          (!tracking.uwbAnchor &&
            snapshot.equipment.positionSource !== "manual" &&
            stale.has("EQUIPMENT-A") &&
            snapshot.equipment.positionStatus !== "stale" &&
            configuration.equipment.some(
              (preset) => preset.id === snapshot.equipment.presetId && preset.controls.translation,
            )))) ||
      (cameraStale && snapshot.cctv.some((camera) => camera.status === "connected")),
  );
  if (changed) synchronizeTracking(tracking);
}

export function synchronizeTracking(tracking: TrackingSnapshot): void {
  const runtime = getRuntimeServices().runtime;
  const now = new Date().toISOString();
  for (const run of runtime.runs.values()) {
    const before = run.snapshot;
    const movable =
      run.configuration.equipment.find((preset) => preset.id === before.equipment.presetId)
        ?.controls.translation ?? false;
    run.snapshot = projectTracking(before, tracking, now, movable);
    const snapshot =
      before.run.status === "running" && before.run.positionInput === "measured"
        ? run.evaluate(now, runtime.bus.count(before.mode))
        : run.snapshot;
    const incidentChanged = snapshot.incidents.some(
      (incident) =>
        before.incidents.find((previous) => previous.incidentId === incident.incidentId)
          ?.version !== incident.version,
    );
    if (snapshot.events.length !== before.events.length || incidentChanged)
      runtime.commit(run, snapshot, "tracking");
    else runtime.publishTransient(run, snapshot);
  }
}
