import { describe, expect, it } from "vitest";
import { MapSchema } from "@/contracts";
import { now, snapshot } from "@/server/incidents/test-fixtures";
import mapDocument from "../../../data/maps/site-construction-01.json";
import { cameraBounds } from "./scene-data";

const map = MapSchema.parse(mapDocument);

describe("incident camera coverage", () => {
  it("includes the related hazard, affected worker, and current route in one frame", () => {
    const state = {
      ...snapshot,
      hazards: snapshot.hazards.map((hazard) => ({ ...hazard, polygon: [{ x: 20, y: 20 }] })),
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        position: { x: 30, y: 30 },
        currentGuidance: worker.currentGuidance
          ? {
              ...worker.currentGuidance,
              waypoints: [
                { x: 30, y: 30, nodeId: "START", floorId: "GROUND" },
                { x: 100, y: 40, nodeId: "END", floorId: "GROUND" },
              ],
            }
          : null,
      })),
    };
    const bounds = cameraBounds(
      { snapshot: state, map, selectedWorkerId: null, selectedIncidentId: "INCIDENT-A" },
      "risk",
      0,
      Date.parse(now),
    );
    expect(bounds).toEqual({ minX: 12, maxX: 108, minY: 12, maxY: 48 });
  });

  it("excludes expired routes and unknown worker positions", () => {
    const state = {
      ...snapshot,
      hazards: snapshot.hazards.map((hazard) => ({ ...hazard, polygon: [{ x: 20, y: 20 }] })),
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        positionStatus: "unknown" as const,
      })),
    };
    const bounds = cameraBounds(
      { snapshot: state, map, selectedWorkerId: null, selectedIncidentId: "INCIDENT-A" },
      "locked",
      0,
      Date.parse(now) + 120_000,
    );
    expect(bounds).toEqual({ minX: 12, maxX: 28, minY: 12, maxY: 28 });
  });
});
