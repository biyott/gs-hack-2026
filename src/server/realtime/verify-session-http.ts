import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import ky from "ky";
import { z } from "zod";

const baseUrl = process.env["SSE_VERIFY_BASE_URL"] ?? "http://localhost:3000";
const output =
  process.env["SSE_VERIFY_OUTPUT"] ??
  "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/backend/sse/http-smoke.json";
const client = ky.create({ baseUrl, retry: 0, timeout: 20000, throwHttpErrors: false });
const SessionSchema = z.object({ sessionId: z.string(), actorId: z.string(), token: z.string() });
const WorkerSchema = z.object({ workerId: z.string() });
const SnapshotSchema = z.object({
  streamId: z.string(),
  sequence: z.number(),
  mode: z.string(),
  run: z.object({ runId: z.string(), version: z.number() }),
  workers: z.array(WorkerSchema),
  events: z.array(z.unknown()),
  incidents: z.array(
    z.object({
      firstGuidance: z.array(WorkerSchema),
      currentGuidance: z.array(WorkerSchema),
      audit: z.array(z.unknown()),
    }),
  ),
});
type Session = z.infer<typeof SessionSchema>;
const sessions: Session[] = [];
const controllers: AbortController[] = [];
const observations: {
  readonly check: string;
  readonly pass: boolean;
  readonly observed: unknown;
}[] = [];
const startedAt = new Date().toISOString();
class VerificationError extends Error {
  override readonly name = "VerificationError";
}
function record(check: string, pass: boolean, observed: unknown): void {
  observations.push({ check, pass, observed });
  if (!pass) throw new VerificationError(check);
}
function headers(session: Session) {
  return { authorization: `Bearer ${session.token}` };
}
async function login(actorId: string, role: string, previous?: Session): Promise<Session> {
  const response = await client.post("/api/session", {
    headers: {
      origin: baseUrl,
      ...(previous ? { cookie: `gs_safety_session=${previous.token}` } : {}),
    },
    json: { actorId, role, accessCode: process.env["GS_DEMO_PIN"] ?? "2026" },
  });
  record(`login-${actorId}`, response.status === 200, response.status);
  const session = SessionSchema.parse(await response.json());
  sessions.push(session);
  return session;
}
async function open(session: Session) {
  const controller = new AbortController();
  controllers.push(controller);
  const response = await client.get("/api/events?mode=equipment", {
    headers: headers(session),
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
  });
  record("sse-open", response.status === 200, response.status);
  if (response.body === null) throw new VerificationError("missing-sse-body");
  const reader = response.body.getReader();
  let text = "";
  while (!text.includes("\n\n")) {
    const chunk = await reader.read();
    if (chunk.done) throw new VerificationError("closed-before-snapshot");
    text += new TextDecoder().decode(chunk.value);
  }
  const data = text.split("\n").find((line) => line.startsWith("data: "));
  if (data === undefined) throw new VerificationError("missing-snapshot-frame");
  const snapshot = SnapshotSchema.parse(JSON.parse(data.slice(6)));
  record(
    "sse-frame-identity",
    text.includes(`id: ${snapshot.streamId}:equipment:${snapshot.sequence}\n`),
    { sequence: snapshot.sequence, mode: snapshot.mode },
  );
  return { reader, controller, snapshot };
}
async function closed(stream: Awaited<ReturnType<typeof open>>, check: string): Promise<void> {
  const started = performance.now();
  const timeout = setTimeout(() => stream.controller.abort(), 2000);
  try {
    while (!(await stream.reader.read()).done) {}
    const durationMs = performance.now() - started;
    record(check, durationMs < 2000, { durationMs });
  } finally {
    clearTimeout(timeout);
  }
}
async function main(): Promise<void> {
  const unauthenticated = await client.get("/api/events?mode=equipment");
  record("unauthenticated-401", unauthenticated.status === 401, unauthenticated.status);
  const foreign = await client.post("/api/session", {
    headers: { origin: "https://foreign.invalid" },
    json: { actorId: "admin", role: "admin", accessCode: "2026" },
  });
  record("foreign-origin-403", foreign.status === 403, foreign.status);
  const admin = await login("admin", "admin");
  const observer = await login("observer", "observer");
  const command = {
    mode: "equipment",
    action: "speed",
    speed: 1,
    expectedVersion: Number.MAX_SAFE_INTEGER,
    requestId: randomUUID(),
  };
  const forbidden = await client.post("/api/simulation", {
    headers: headers(observer),
    json: command,
  });
  record("observer-command-403", forbidden.status === 403, forbidden.status);
  const conflict = await client.post("/api/simulation", {
    headers: headers(admin),
    json: { ...command, requestId: randomUUID() },
  });
  record("stale-version-409", conflict.status === 409, conflict.status);
  const worker = await login("worker-a", "worker");
  const workerState = SnapshotSchema.parse(
    await client.get("/api/simulation?mode=equipment", { headers: headers(worker) }).json(),
  );
  const ownGuidance = workerState.incidents.every(
    (incident) =>
      [...incident.firstGuidance, ...incident.currentGuidance].every(
        (guidance) => guidance.workerId === "WORKER-A",
      ) && incident.audit.length === 0,
  );
  record(
    "worker-snapshot-privacy",
    workerState.workers.length === 1 &&
      workerState.workers[0]?.workerId === "WORKER-A" &&
      workerState.events.length === 0 &&
      ownGuidance,
    {
      workers: workerState.workers.map((entry) => entry.workerId),
      events: workerState.events.length,
    },
  );
  const replacedStream = await open(worker);
  const replacement = await login("worker-a", "worker");
  await closed(replacedStream, "device-replacement-immediate-eof");
  const currentStream = await open(replacement);
  const logout = await client.delete("/api/session", { headers: headers(replacement) });
  record(
    "logout-cookie-expired",
    logout.status === 204 && (logout.headers.get("set-cookie")?.includes("Max-Age=0") ?? false),
    { status: logout.status },
  );
  await closed(currentStream, "logout-immediate-eof");
  const expired = await client.get("/api/events?mode=equipment", { headers: headers(replacement) });
  record("logged-out-stream-401", expired.status === 401, expired.status);
  const first = await open(admin);
  await first.reader.cancel();
  first.controller.abort();
  const latest = SnapshotSchema.parse(
    await client.get("/api/simulation?mode=equipment", { headers: headers(admin) }).json(),
  );
  const reconnected = await open(admin);
  record(
    "reconnect-latest",
    reconnected.snapshot.streamId === latest.streamId &&
      reconnected.snapshot.run.runId === latest.run.runId &&
      reconnected.snapshot.sequence >= latest.sequence,
    {
      beforeSequence: first.snapshot.sequence,
      latestSequence: latest.sequence,
      reconnectSequence: reconnected.snapshot.sequence,
    },
  );
  await reconnected.reader.cancel();
  reconnected.controller.abort();
  const switched = await open(admin);
  await login("operator", "operator", admin);
  await closed(switched, "account-switch-immediate-eof");
}
let failure: { readonly name: string; readonly message: string } | null = null;
try {
  await main();
} catch (error) {
  failure =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { name: "UnknownError", message: "Verification rejected" };
} finally {
  for (const controller of controllers) controller.abort();
  const cleanup = await Promise.allSettled(
    sessions.map((session) => client.delete("/api/session", { headers: headers(session) })),
  );
  observations.push({
    check: "owned-session-cleanup",
    pass: cleanup.every((result) => result.status === "fulfilled" && result.value.status === 204),
    observed: { sessions: sessions.length },
  });
  const sourceHashes = Object.fromEntries(
    [
      "app/api/events/route.ts",
      "app/api/session/route.ts",
      "src/server/realtime/session-streams.ts",
    ].map((path) => [path, createHash("sha256").update(readFileSync(path)).digest("hex")]),
  );
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl,
    sourceHashes,
    scope: "software-http-only; no valid simulation mutations",
    observations,
    failure,
  };
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ output, checks: observations.length, passed: observations.filter((entry) => entry.pass).length, failure })}\n`,
  );
  if (failure !== null || observations.some((entry) => !entry.pass)) process.exitCode = 1;
}
