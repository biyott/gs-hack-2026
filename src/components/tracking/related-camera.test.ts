import { describe, expect, it } from "vitest";
import { CctvStateSchema, HazardSchema, IncidentSchema } from "@/contracts";
import { relatedCameraId } from "./related-camera";

const hazard = HazardSchema.parse({
  hazardId: "FIRE-1",
  hazardType: "fire",
  priority: "high",
  polygon: [],
  active: true,
  floorId: "GROUND",
  source: "mock",
  observedAt: "2026-09-21T09:00:00Z",
  sensorStatus: "current",
  affectedWorkerIds: [],
  reason: "Fixture",
  zoneId: "ZONE-A",
  substanceId: null,
});
const incident = IncidentSchema.parse({
  incidentId: "INCIDENT-1",
  runId: "RUN-1",
  version: 1,
  hazardIds: ["FIRE-1"],
  hazardType: "fire",
  priority: "high",
  status: "active",
  acknowledgedAt: null,
  assignedTo: null,
  supportStatus: "none",
  hazardClearedAt: null,
  passageReopenedAt: null,
  closedAt: null,
  firstGuidance: [],
  currentGuidance: [],
  audit: [],
});
const camera = CctvStateSchema.parse({
  cameraId: "CAM-A",
  name: "Table",
  zoneIds: ["ZONE-A"],
  floorId: "GROUND",
  source: "live",
  status: "connected",
  lastFrameAt: null,
  frameUrl: null,
  receivedFps: 0,
  latencyMs: null,
});

function context(cctv: readonly (typeof camera)[]) {
  return { cctv, hazards: [hazard], incidents: [incident] };
}

describe("incident camera association", () => {
  it("matches both the incident hazard zone and its floor", () => {
    // Given cameras covering the same zone on different floors.
    const snapshot = context([{ ...camera, cameraId: "OTHER-FLOOR", floorId: "LEVEL-1" }, camera]);
    // When the selected incident is associated with a camera.
    const selected = relatedCameraId(snapshot, incident.incidentId);
    // Then the matching ground-floor camera is selected.
    expect(selected).toBe("CAM-A");
  });

  it("prefers a connected matching camera over a disconnected one", () => {
    // Given two cameras in the same observed zone and floor.
    const snapshot = context([{ ...camera, cameraId: "OFFLINE", status: "disconnected" }, camera]);
    // When a camera is selected for the incident.
    const selected = relatedCameraId(snapshot, incident.incidentId);
    // Then current camera connectivity wins without changing zone coverage.
    expect(selected).toBe("CAM-A");
  });

  it("leaves unrelated camera coverage unassigned", () => {
    // Given a camera on the right floor but in another zone.
    const snapshot = context([{ ...camera, zoneIds: ["ZONE-B"] }]);
    // When the incident is associated with cameras.
    const selected = relatedCameraId(snapshot, incident.incidentId);
    // Then the unrelated camera is not substituted.
    expect(selected).toBeNull();
  });

  it("leaves an absent selected incident unassigned", () => {
    // Given registered camera coverage and no selected incident.
    // When related coverage is requested.
    const selected = relatedCameraId(context([camera]), null);
    // Then no association is invented.
    expect(selected).toBeNull();
  });
});
