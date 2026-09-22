import { z } from "zod";
import { isDeepStrictEqual } from "node:util";

const text = z.string().min(1);
const timestamp = z.iso.datetime({ offset: true });
const mode = z.enum(["equipment", "fire-gas"]);
const point = z.object({ x: z.number().finite(), y: z.number().finite() });
const profile = z.object({
  workerId: text, version: z.number().int().positive(), preferredLocale: text.nullable(), locale: z.enum(["ko", "en"]),
  canUseStairs: z.boolean().nullable(), speedMps: z.object({ min: z.number().nonnegative(), max: z.number().positive() }).strict().nullable(),
  needsAssistance: z.boolean().nullable(), needsCompanion: z.boolean().nullable(),
  notificationPreferences: z.object({ voice: z.boolean(), vibration: z.boolean() }).strict(), confirmedAt: timestamp.nullable(),
}).strict().refine((value) => value.speedMps === null || value.speedMps.min <= value.speedMps.max, "Invalid profile speed range.");
const provenance = {
  positionSource: z.enum(["mock", "video", "uwb", "manual"]),
  positionInputSource: z.enum(["live", "synthetic", "unknown"]),
  positionStatus: z.enum(["known", "unknown", "stale"]),
  lastObservedAt: timestamp.nullable(),
};
const guidance = z.object({
  guidanceId: text, guidanceVersion: z.number().int().positive(), workerId: text, eventId: text,
  updateKind: z.enum(["primary", "supplement"]), primaryGuidanceVersion: z.number().int().positive(),
  incidentId: text, runId: text, simulationMode: mode, mapId: text, mapVersion: text,
  hazardIds: z.array(z.string()), hazardType: z.enum(["equipment", "fire", "gas", "combined", "position-unknown", "sensor-unknown"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  actionCode: z.enum(["ALERT_HAZARD", "FOLLOW_VALIDATED_ROUTE", "GUIDANCE_UPDATED", "ROUTE_UNAVAILABLE", "POSITION_UNKNOWN", "SENSOR_UNKNOWN", "REQUEST_ASSISTANCE", "SHELTER_PER_SCENARIO", "CONFIRM_UNDERSTANDING", "CONFIRM_ARRIVAL", "AWAIT_REOPEN_AUTHORIZATION"]),
  routeVersion: z.number().int().positive().nullable(), destinationId: text.nullable(),
  stepId: text.nullable(), floorId: text,
  waypoints: z.array(point.extend({ nodeId: text, floorId: text })),
  profileVersion: z.number().int().positive(), profileSnapshot: profile, locale: z.enum(["ko", "en"]),
  requestedLocale: z.string().nullable(), fallbackLocaleUsed: z.boolean(), templateCatalogVersion: z.string(),
  messageKey: z.string(), primaryMessageKey: z.string(), messageArgs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  primaryMessage: z.string(), managerExplanationKo: z.string(), supplementalExplanation: z.string().nullable(),
  evidence: z.array(z.object({ documentId: z.string(), documentVersion: z.string(), chunkId: z.string() }).strict()),
  mode: z.enum(["template", "rag-assisted"]),
  generatedAt: timestamp, expiresAt: timestamp,
}).strict().refine((value) => {
  const lineage = value.updateKind === "primary" ? value.primaryGuidanceVersion === value.guidanceVersion
    : value.primaryGuidanceVersion < value.guidanceVersion && value.mode === "rag-assisted" && value.supplementalExplanation !== null && value.evidence.length > 0;
  const stationary = ["POSITION_UNKNOWN", "ROUTE_UNAVAILABLE", "SENSOR_UNKNOWN", "SHELTER_PER_SCENARIO", "AWAIT_REOPEN_AUTHORIZATION"].includes(value.actionCode);
  const routeMetadata = value.destinationId !== null && value.routeVersion !== null && value.stepId !== null;
  return lineage && value.messageKey === value.primaryMessageKey && value.profileSnapshot.version === value.profileVersion
    && Date.parse(value.expiresAt) > Date.parse(value.generatedAt)
    && (value.waypoints.length > 0 || (value.destinationId === null && value.routeVersion === null && value.stepId === null))
    && (!stationary || value.waypoints.length === 0)
    && (value.actionCode !== "FOLLOW_VALIDATED_ROUTE" || (value.waypoints.length >= 2 && routeMetadata));
}, "Guidance envelope violates its primary lineage or route contract.");
const worker = z.object({
  workerId: text, profile, virtual: z.boolean(), position: point.nullable(), ...provenance,
  currentGuidance: guidance.nullable(),
});
export const SnapshotEvidence = z.object({
  contractVersion: text, streamId: text, sequence: z.number().int().nonnegative(), mode,
  run: z.object({
    runId: text, scenarioId: text, mapId: text, mapVersion: text,
    version: z.number().int().nonnegative(), positionInput: z.enum(["scenario", "measured"]),
    status: z.enum(["idle", "running", "paused", "completed"]), updatedAt: timestamp,
  }),
  equipment: z.object({ id: text, presetId: text, position: point, ...provenance }),
  workers: z.array(worker).min(1),
});
/** @typedef {z.infer<typeof SnapshotEvidence>} Snapshot */
export const CatalogEvidence = z.object({
  maps: z.array(z.object({ mapId: text, mapVersion: text })),
  equipment: z.array(z.object({ id: text, assetUrl: text })),
});
const releaseSchema = z.object({
  event: z.literal("FIXTURE_REFRESH_RELEASED"), nonce: z.uuid(),
  viewport: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  readyAt: timestamp, refreshCompletedAt: timestamp, releasedAt: timestamp,
}).strict();

export function parseRelease(value, ready) {
  const release = releaseSchema.parse(value);
  for (const key of ["nonce", "readyAt"]) {
    if (release[key] !== ready[key]) throw new Error(`Release ${key} does not match readiness.`);
  }
  if (release.viewport.width !== ready.viewport.width || release.viewport.height !== ready.viewport.height) throw new Error("Release viewport mismatch.");
  if (Date.parse(release.refreshCompletedAt) < Date.parse(ready.readyAt)
    || Date.parse(release.releasedAt) < Date.parse(release.refreshCompletedAt)
    || Date.parse(release.releasedAt) > Date.now()) throw new Error("Release chronology is invalid.");
  return release;
}

export async function readJson(page, path) {
  const response = await page.evaluate(async (url) => {
    const response = await fetch(url, { method: "GET", credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { status: response.status, body: null };
    return { status: response.status, body: await response.json() };
  }, path);
  if (response.status !== 200) throw new Error(`Read-only ${path} returned HTTP ${response.status}.`);
  return response.body;
}

export async function readSnapshot(page, expectedMode) {
  const parsed = SnapshotEvidence.parse(await readJson(page, `/api/simulation?mode=${expectedMode}`));
  if (parsed.mode !== expectedMode) throw new Error("Snapshot mode differs from requested mode.");
  return parsed;
}

/** @param {Snapshot} snapshot */
export function validatedRoutes(snapshot, window) {
  const expected = {
    equipment: { scenario: "EQ-PROFILE-ROUTES", workers: ["WORKER-A", "WORKER-B"] },
    "fire-gas": { scenario: "FG-FIRE", workers: ["WORKER-A"] },
  }[snapshot.mode];
  if (snapshot.run.scenarioId !== expected.scenario) throw new Error(`Expected ${expected.scenario} fixture.`);
  if (snapshot.run.status !== "paused") throw new Error("Valid-route captures require the paused fixture.");
  const routes = snapshot.workers.filter((worker) => worker.positionStatus === "known"
    && worker.currentGuidance?.waypoints.length >= 2);
  for (const workerId of expected.workers) {
    if (!routes.some((worker) => worker.workerId === workerId)) throw new Error(`Missing valid route for ${workerId}.`);
  }
  for (const worker of routes) {
    const route = worker.currentGuidance;
    if (!worker.position || !route) throw new Error("A route must have a known position and guidance.");
    if (route.workerId !== worker.workerId || route.simulationMode !== snapshot.mode) throw new Error("Route worker/mode mismatch.");
    for (const key of ["runId", "mapId", "mapVersion"]) {
      if (route[key] !== snapshot.run[key]) throw new Error(`Route ${key} mismatch.`);
    }
    if (route.actionCode !== "FOLLOW_VALIDATED_ROUTE" || route.routeVersion === null
      || route.destinationId === null || route.stepId === null) throw new Error("Route is not validated movement guidance.");
    if (Date.parse(route.generatedAt) < Date.parse(window.readyAt)
      || Date.parse(route.generatedAt) > window.at) throw new Error("Guidance was not generated within this readiness window.");
    if (Date.parse(route.expiresAt) <= window.at) throw new Error("Guidance expired at a screenshot boundary.");
    if (route.waypoints.some((waypoint) => waypoint.floorId !== route.floorId)) throw new Error("Route floor mismatch.");
  }
  if (new Set(routes.map((worker) => worker.workerId)).size !== routes.length) throw new Error("Duplicate route worker identity.");
  return routes;
}

export function sameRoutes(before, after) {
  if (before.length !== after.length) throw new Error("Authoritative route count changed during capture.");
  const byWorker = new Map(after.map((entry) => [entry.workerId, entry]));
  if (byWorker.size !== after.length || new Set(before.map((entry) => entry.workerId)).size !== before.length) throw new Error("Duplicate route worker identity.");
  const primaryContext = ({ eventId, guidanceVersion, updateKind, supplementalExplanation, evidence, mode, ...context }) => context;
  for (const entry of before) {
    const nextEntry = byWorker.get(entry.workerId);
    if (!nextEntry) throw new Error("Authoritative route worker identity changed during capture.");
    const { currentGuidance: previousValue, ...previousWorker } = entry;
    const { currentGuidance: nextValue, ...nextWorker } = nextEntry;
    if (!isDeepStrictEqual(previousWorker, nextWorker)) throw new Error("Authoritative worker profile/provenance changed during capture.");
    const previous = guidance.parse(previousValue);
    const next = guidance.parse(nextValue);
    if (isDeepStrictEqual(previous, next)) continue;
    if (next.guidanceVersion <= previous.guidanceVersion) throw new Error("Guidance version rollback or immutable envelope rewrite.");
    if (next.updateKind !== "supplement" || !isDeepStrictEqual(primaryContext(previous), primaryContext(next))) throw new Error("Authoritative primary guidance context changed during capture.");
  }
}

export function matchSvg(routes, rendered) {
  if (rendered.length !== routes.length) throw new Error("Rendered route count differs from authoritative routes.");
  for (const worker of routes) {
    const route = worker.currentGuidance;
    const title = `${worker.workerId} · 경로 v${route.routeVersion}`;
    const matches = rendered.filter((line) => line.title === title);
    if (matches.length !== 1) throw new Error(`Missing or duplicated SVG route for ${worker.workerId}.`);
    const actual = matches[0];
    if (!actual.visible || actual.version !== String(route.routeVersion)) throw new Error("SVG route version/visibility mismatch.");
    const coordinates = actual.points.trim().split(/[\s,]+/).map(Number);
    const expected = route.waypoints.flatMap(({ x, y }) => [x, -y]);
    if (coordinates.length !== expected.length || coordinates.some((value, index) => !Number.isFinite(value) || Math.abs(value - expected[index]) > 1e-7)) throw new Error(`SVG route points differ for ${worker.workerId}.`);
  }
}

export async function surfaceEvidence(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".site-stage__viewport");
    const bounds = stage?.getBoundingClientRect();
    return {
      browserAt: new Date().toISOString(),
      stateVersion: document.querySelector(".status-strip-version")?.textContent?.trim(),
      runId: document.querySelector(".workspace-footer .mono")?.textContent?.trim(),
      map: document.querySelector(".stage-toolbar .eyebrow")?.textContent?.trim(),
      cameraMode: stage?.getAttribute("data-camera-mode"),
      positionStatus: document.querySelector(".stage-position-status")?.textContent?.trim(),
      guidanceStatus: [...document.querySelectorAll(".guidance-record")].map((element) => ({
        heading: element.querySelector(".guidance-record-heading")?.textContent?.trim(),
        times: [...element.querySelectorAll("time")].map((time) => time.dateTime),
      })),
      stageFullyVisible: Boolean(bounds && bounds.x >= -1 && bounds.y >= -1 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1),
      svgRoutes: [...document.querySelectorAll("[data-testid='site-map'] .map-route")].map((line) => {
        const style = getComputedStyle(line);
        return { title: line.querySelector("title")?.textContent, version: line.getAttribute("data-route-version"), points: line.getAttribute("points"), visible: style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 };
      }),
    };
  });
}

export function matchSurface(snapshot, surface) {
  if (surface.runId !== snapshot.run.runId
    || !surface.stateVersion?.endsWith(`· v${snapshot.run.version}`)
    || surface.map !== `${snapshot.run.mapId} · v${snapshot.run.mapVersion}`) throw new Error("Rendered snapshot identity differs from authoritative state.");
  if (!surface.stageFullyVisible) throw new Error("Scene stage is not fully inside the screenshot viewport.");
  if (surface.cameraMode !== "full") throw new Error("Valid-route evidence requires the full camera extent.");
}
