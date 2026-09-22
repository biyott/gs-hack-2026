import { randomUUID } from "node:crypto";
import { ApiErrorSchema } from "../../packages/contracts/src/commands";
import {
  type SimulationSnapshot,
  SimulationSnapshotSchema,
} from "../../packages/contracts/src/state";
import { captureTime, type HttpSmokeClient, SmokeFailure } from "./http-smoke-client";

export type BridgeChange =
  | Readonly<{ action: "position-input"; input: "scenario" | "measured" }>
  | Readonly<{ action: "resume" | "pause" }>;

export class BridgeSmokeClient {
  readonly snapshots: Readonly<{ phase: string; snapshot: SimulationSnapshot }>[] = [];
  readonly warmupRequests: HttpSmokeClient["requests"] = [];

  constructor(private readonly client: HttpSmokeClient) {}

  frame(
    input: Readonly<{
      smokeId: string;
      sequence: number;
      jpeg: Buffer;
      offsetMs: number;
      synchronizedAt: string;
    }>,
  ) {
    return this.client.tracking("/frame", {
      cameraId: input.smokeId,
      streamId: input.smokeId,
      frameId: `${input.smokeId}-${input.sequence}`,
      sequence: input.sequence,
      ...captureTime(input.offsetMs, input.synchronizedAt),
      jpegBase64: input.jpeg.toString("base64"),
      source: "synthetic",
      width: 1280,
      height: 720,
    });
  }

  async warmupTrackingRoutes(): Promise<void> {
    const start = this.client.requests.length;
    try {
      for (const path of ["calibration", "frame", "uwb"]) {
        const response = await this.client.request(`/api/tracking/${path}`, {
          expectedStatus: [200, 404, 405],
        });
        await response.arrayBuffer();
      }
    } finally {
      this.warmupRequests.push(...this.client.requests.splice(start));
    }
  }

  async simulation(phase: string, mode = "equipment"): Promise<SimulationSnapshot> {
    const response = await this.client.request(`/api/simulation?mode=${mode}`);
    const snapshot = SimulationSnapshotSchema.parse(await response.json());
    this.snapshots.push({ phase, snapshot });
    return snapshot;
  }

  async command(change: BridgeChange, originalRunId: string): Promise<SimulationSnapshot> {
    const requestId = randomUUID();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.simulation(`before-${change.action}`);
      if (current.run.runId !== originalRunId) throw new SmokeFailure("RUN_CHANGED");
      const response = await this.client.request("/api/simulation", {
        method: "POST",
        expectedStatus: [200, 409],
        body: { ...change, mode: "equipment", expectedVersion: current.run.version, requestId },
      });
      if (response.status === 409) {
        const code = ApiErrorSchema.parse(await response.json()).error.code;
        if (code !== "VERSION_CONFLICT") throw new SmokeFailure(code);
        continue;
      }
      const snapshot = SimulationSnapshotSchema.parse(await response.json());
      this.snapshots.push({ phase: `after-${change.action}`, snapshot });
      return snapshot;
    }
    throw new SmokeFailure("VERSION_CONFLICT_RETRY_LIMIT");
  }
}

export function scenarioStateUnchanged(before: SimulationSnapshot, after: SimulationSnapshot) {
  const positions = [before.equipment, ...before.workers, after.equipment, ...after.workers];
  return (
    before.run.positionInput === "scenario" &&
    after.run.positionInput === "scenario" &&
    before.run.runId === after.run.runId &&
    positions.every((item) => item.positionSource !== "video" && item.positionSource !== "uwb") &&
    JSON.stringify([before.equipment, before.workers]) ===
      JSON.stringify([after.equipment, after.workers])
  );
}
