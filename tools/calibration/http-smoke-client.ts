import { z } from "zod";
import {
  type CameraFrame,
  type TrackingSnapshot,
  TrackingSnapshotSchema,
} from "../../packages/contracts/src/tracking";

export class SmokeFailure extends Error {
  readonly name = "SmokeFailure";
}

export function captureTime(clockOffsetMs: number, synchronizedAt: string) {
  const capturedAt = new Date(Date.now() + clockOffsetMs - 25).toISOString();
  return {
    capturedAt,
    captureClock: {
      deviceCapturedAt: new Date(Date.parse(capturedAt) - 125).toISOString(),
      offsetMs: 125,
      uncertaintyMs: 3,
      synchronizedAt,
    },
  };
}

export class HttpSmokeClient {
  readonly requests: Readonly<{
    path: string;
    method: string;
    status: number;
    elapsedMs: number;
  }>[] = [];
  readonly snapshots: Readonly<{
    requestIndex: number;
    path: string;
    snapshot: TrackingSnapshot;
  }>[] = [];
  #cookie = "";

  constructor(readonly baseUrl: string) {}

  get authenticated(): boolean {
    return this.#cookie !== "";
  }

  async login(
    body: Readonly<{ actorId: string; role: string; accessCode: string }>,
  ): Promise<void> {
    const response = await this.request("/api/session", { method: "POST", body });
    this.#cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    if (!this.authenticated) throw new SmokeFailure("SESSION_COOKIE_MISSING");
    await response.arrayBuffer();
  }

  async request(
    path: string,
    options: Readonly<{
      method?: string;
      body?: unknown;
      expectedStatus?: number | readonly number[];
    }> = {},
  ): Promise<Response> {
    const started = performance.now();
    const method = options.method ?? "GET";
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { origin: this.baseUrl, cookie: this.#cookie, "content-type": "application/json" },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: AbortSignal.timeout(20_000),
    });
    const elapsedMs = performance.now() - started;
    this.requests.push({ path, method, status: response.status, elapsedMs });
    const expected = options.expectedStatus ?? 200;
    if (
      !(typeof expected === "number"
        ? response.status === expected
        : expected.includes(response.status))
    )
      throw new SmokeFailure(`HTTP_${response.status}_${path}`);
    return response;
  }

  async tracking(path = "", body?: unknown): Promise<TrackingSnapshot> {
    const response = await this.request(
      `/api/tracking${path}`,
      body === undefined ? {} : { method: "POST", body },
    );
    const snapshot = TrackingSnapshotSchema.parse(await response.json());
    this.snapshots.push({ requestIndex: this.requests.length, path: path || "/", snapshot });
    return snapshot;
  }

  async frameIdentityChecks(frame: CameraFrame | null, response: Response) {
    if (!frame) throw new SmokeFailure("ACCEPTED_FRAME_MISSING");
    const checks = [
      {
        name: "jpeg-response-frame-identity",
        passed:
          response.headers.get("x-frame-id") === encodeURIComponent(frame.frameId) &&
          response.headers.get("x-frame-sequence") === String(frame.sequence),
      },
    ];
    const superseded = z.object({ error: z.object({ code: z.literal("FRAME_SUPERSEDED") }) });
    for (const query of [
      new URLSearchParams({ streamId: `${frame.streamId ?? "default"}-superseded` }),
      new URLSearchParams({ sequence: String(frame.sequence + 1) }),
    ]) {
      const rejected = await this.request(`/api/tracking/frame?${query}`, { expectedStatus: 409 });
      superseded.parse(await rejected.json());
      checks.push({
        name: `jpeg-rejects-${query.has("streamId") ? "wrong-stream" : "wrong-sequence"}`,
        passed: true,
      });
    }
    return checks;
  }
}
