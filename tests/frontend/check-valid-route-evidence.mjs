import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SnapshotEvidence, validatedRoutes, matchSvg, parseRelease, sameRoutes } from "./valid-route-evidence.mjs";

const storedExample = JSON.parse(await readFile(new URL("../../docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/fresh-route-r1-exact-failed-run-supplement.json", import.meta.url), "utf8"));
const [storedPrimary, storedSupplement] = storedExample.envelopes;
const readyAt = "2026-09-21T12:00:00.000Z";
const generatedAt = "2026-09-21T12:00:01.000Z";
const expiresAt = "2026-09-21T12:01:01.000Z";
const window = { readyAt, at: Date.parse(expiresAt) - 1 };
function fixture() {
  const provenance = { positionSource: "mock", positionInputSource: "synthetic", positionStatus: "known", lastObservedAt: generatedAt };
  return SnapshotEvidence.parse({
    contractVersion: "1.0.0", streamId: "fixture-stream", sequence: 1, mode: "fire-gas",
    run: { runId: "run-a", scenarioId: "FG-FIRE", mapId: "map-a", mapVersion: "1", version: 3, positionInput: "scenario", status: "paused", updatedAt: generatedAt },
    equipment: { id: "EQUIPMENT-A", presetId: "preset-a", position: { x: 4, y: 5 }, ...provenance },
    workers: [{ workerId: "WORKER-A", profile: structuredClone(storedPrimary.profileSnapshot), virtual: false, position: { x: 1, y: 2 }, ...provenance, currentGuidance: {
      ...structuredClone(storedPrimary),
      guidanceId: "guide-a", guidanceVersion: 1, workerId: "WORKER-A", incidentId: "incident-a",
      runId: "run-a", simulationMode: "fire-gas", mapId: "map-a", mapVersion: "1",
      actionCode: "FOLLOW_VALIDATED_ROUTE", routeVersion: 2, destinationId: "refuge-a", stepId: "step-a", floorId: "GROUND",
      waypoints: [{ x: 1, y: 2, nodeId: "node-a", floorId: "GROUND" }, { x: 3, y: 4, nodeId: "node-b", floorId: "GROUND" }], generatedAt, expiresAt,
    } }],
    ignoredSecret: "must-not-be-retained",
  });
}
const rendered = () => [{ title: "WORKER-A · 경로 v2", version: "2", points: "1,-2 3,-4", visible: true }];

test("accepts a route with one millisecond remaining instead of requiring sixty seconds", () => {
  const snapshot = fixture();
  const routes = validatedRoutes(snapshot, window);
  assert.equal(routes[0].currentGuidance.guidanceId, "guide-a");
});

test("rejects guidance at the exact expiry boundary", () => {
  const snapshot = fixture();
  assert.throws(() => validatedRoutes(snapshot, { ...window, at: Date.parse(expiresAt) }), /expired/);
});

test("rejects guidance generated before browser readiness", () => {
  const snapshot = fixture();
  snapshot.workers[0].currentGuidance.generatedAt = "2026-09-21T11:59:59.999Z";
  assert.throws(() => validatedRoutes(snapshot, window), /readiness window/);
});

test("rejects future-generated guidance even when its expiry is still positive", () => {
  const snapshot = fixture();
  snapshot.workers[0].currentGuidance.generatedAt = "2026-09-21T12:01:02.000Z";
  assert.throws(() => validatedRoutes(snapshot, window), /readiness window/);
});

for (const key of ["runId", "mapId", "mapVersion"]) {
  test(`rejects guidance whose ${key} differs from the active snapshot`, () => {
    const snapshot = fixture();
    snapshot.workers[0].currentGuidance[key] = "wrong-identity";
    assert.throws(() => validatedRoutes(snapshot, window), /mismatch/);
  });
}

test("rejects stale worker positions even when guidance is current", () => {
  const snapshot = fixture();
  snapshot.workers[0].positionStatus = "stale";
  assert.throws(() => validatedRoutes(snapshot, window), /Missing valid route/);
});

test("parses only the authoritative subset and rejects invented provenance", () => {
  const snapshot = fixture();
  assert.equal("ignoredSecret" in snapshot, false);
  snapshot.workers[0].positionInputSource = "assumed-live";
  assert.throws(() => SnapshotEvidence.parse(snapshot));
});

test("matches SVG waypoints using the real x,-y axis conversion", () => {
  const routes = validatedRoutes(fixture(), window);
  assert.doesNotThrow(() => matchSvg(routes, rendered()));
});

test("rejects SVG points with an incorrect axis sign", () => {
  const lines = rendered();
  lines[0].points = "1,2 3,4";
  assert.throws(() => matchSvg(validatedRoutes(fixture(), window), lines), /points differ/);
});

test("rejects SVG route-version mismatch", () => {
  const lines = rendered();
  lines[0].version = "3";
  assert.throws(() => matchSvg(validatedRoutes(fixture(), window), lines), /version/);
});

test("rejects a changed route between adjacent 2D and 3D captures", () => {
  const before = validatedRoutes(fixture(), window);
  const after = structuredClone(before);
  after[0].currentGuidance.waypoints[1].x = 9;
  assert.throws(() => sameRoutes(before, after));
});

function handshake() {
  const now = Date.now();
  const ready = { nonce: "46c89b9b-811c-45a8-a349-19f4f1ae2121", viewport: { width: 390, height: 844 }, readyAt: new Date(now - 1000).toISOString() };
  const release = { ...ready, event: "FIXTURE_REFRESH_RELEASED", refreshCompletedAt: new Date(now - 500).toISOString(), releasedAt: new Date(now - 100).toISOString() };
  return { ready, release };
}

test("accepts a matching owner release after actual readiness", () => {
  const { ready, release } = handshake();
  assert.equal(parseRelease(release, ready).nonce, ready.nonce);
});

test("rejects replaying another window's release nonce", () => {
  const { ready, release } = handshake();
  release.nonce = "a6392116-573d-454d-ac2c-b5286971dfd2";
  assert.throws(() => parseRelease(release, ready), /nonce/);
});

test("rejects an owner refresh completed before browser readiness", () => {
  const { ready, release } = handshake();
  release.refreshCompletedAt = new Date(Date.parse(ready.readyAt) - 1).toISOString();
  assert.throws(() => parseRelease(release, ready), /chronology/);
});

function storedRoutes(envelope) {
  const snapshot = fixture();
  const worker = { ...snapshot.workers[0], currentGuidance: structuredClone(envelope) };
  return SnapshotEvidence.parse({ ...snapshot, workers: [worker] }).workers;
}

test("preserves every guidance envelope field from the stored contract example", () => {
  assert.deepEqual(storedRoutes(storedPrimary)[0].currentGuidance, storedPrimary);
});

test("accepts the exact failed capture's persisted primary-to-supplement pair without changing either envelope", () => {
  assert.equal(storedExample.runId, "f7f73f3d-8c12-47a4-80de-d3f72604049f");
  assert.equal(storedExample.incidentId, "670f6a7a-e591-47cb-95aa-b5a1fa3fca8e");
  assert.equal(storedExample.generatedAt, "2026-09-21T12:37:09.838Z");
  const before = storedRoutes(storedPrimary);
  const after = storedRoutes(storedSupplement);
  const original = structuredClone({ before, after });
  assert.doesNotThrow(() => sameRoutes(before, after));
  assert.deepEqual({ before, after }, original);
});

test("accepts an unchanged primary or supplement envelope", () => {
  for (const envelope of [storedPrimary, storedSupplement]) assert.doesNotThrow(() => sameRoutes(storedRoutes(envelope), storedRoutes(envelope)));
});

test("accepts a later valid supplement preserving the complete primary context", () => {
  const next = { ...structuredClone(storedSupplement), guidanceVersion: 4, eventId: "new-envelope-event", supplementalExplanation: "Additional evidenced explanation" };
  assert.doesNotThrow(() => sameRoutes(storedRoutes(storedSupplement), storedRoutes(next)));
});

const contextChanges = {
  incidentId: "changed-incident", runId: "changed-run", workerId: "WORKER-B", guidanceId: "changed-guidance",
  primaryGuidanceVersion: 2, simulationMode: "fire-gas", hazardIds: [], hazardType: "fire", priority: "critical",
  actionCode: "GUIDANCE_UPDATED", routeVersion: 2, stepId: "changed-step", mapId: "changed-map", mapVersion: "2.0.0",
  floorId: "FIRST", waypoints: storedSupplement.waypoints.map((point, index) => ({ ...point, x: point.x + (index === 0 ? 1 : 0) })),
  destinationId: "REFUGE-02", profileVersion: 2, profileSnapshot: { ...storedSupplement.profileSnapshot, canUseStairs: false },
  locale: "en", requestedLocale: null, fallbackLocaleUsed: true, templateCatalogVersion: "2.0.0",
  messageKey: "changed-key", primaryMessageKey: "changed-key", messageArgs: { ...storedSupplement.messageArgs, policyVersion: "changed-policy" },
  primaryMessage: "Changed primary instruction", managerExplanationKo: "Changed manager instruction",
  generatedAt: new Date(Date.parse(storedSupplement.generatedAt) - 1000).toISOString(),
  expiresAt: new Date(Date.parse(storedSupplement.expiresAt) + 1000).toISOString(),
};
for (const [field, value] of Object.entries(contextChanges)) {
  test(`rejects a supplement changing primary context field ${field}`, () => {
    assert.notDeepEqual(storedSupplement[field], value);
    const changed = { ...structuredClone(storedSupplement), [field]: value };
    assert.throws(() => sameRoutes(storedRoutes(storedPrimary), storedRoutes(changed)));
  });
}

for (const [label, patch] of [
  ["template supplement", { mode: "template" }],
  ["missing explanation", { supplementalExplanation: null }],
  ["missing evidence", { evidence: [] }],
  ["invalid primary version", { primaryGuidanceVersion: 2 }],
  ["primary mislabel", { updateKind: "primary" }],
]) {
  test(`rejects inconsistent envelope: ${label}`, () => {
    assert.throws(() => sameRoutes(storedRoutes(storedPrimary), storedRoutes({ ...storedSupplement, ...patch })));
  });
}

for (const [label, patch] of [
  ["replacement primary lineage", { guidanceVersion: 3, primaryGuidanceVersion: 2 }],
  ["replacement profile version", { profileVersion: 2, profileSnapshot: { ...storedSupplement.profileSnapshot, version: 2 } }],
  ["replacement matching message keys", { messageKey: "new-message", primaryMessageKey: "new-message" }],
]) {
  test(`rejects schema-valid context drift: ${label}`, () => {
    const before = storedRoutes(storedPrimary);
    const after = storedRoutes({ ...storedSupplement, ...patch });
    assert.throws(() => sameRoutes(before, after));
  });
}

test("rejects guidance version rollback", () => {
  assert.throws(() => sameRoutes(storedRoutes(storedSupplement), storedRoutes(storedPrimary)));
});

test("rejects rewriting an existing supplement version", () => {
  const changed = { ...storedSupplement, eventId: "rewritten-event", supplementalExplanation: "Rewritten explanation" };
  assert.throws(() => sameRoutes(storedRoutes(storedSupplement), storedRoutes(changed)));
});

test("rejects an advanced primary envelope during the same route capture", () => {
  const next = { ...storedPrimary, guidanceVersion: 2, primaryGuidanceVersion: 2, eventId: "new-primary-event" };
  assert.throws(() => sameRoutes(storedRoutes(storedPrimary), storedRoutes(next)));
});

for (const [field, value] of [
  ["profile", { ...storedPrimary.profileSnapshot, canUseStairs: false }],
  ["position", { x: 10, y: 20 }], ["positionSource", "uwb"], ["positionInputSource", "live"],
  ["positionStatus", "stale"], ["lastObservedAt", "2026-09-21T09:00:00Z"], ["virtual", true],
]) {
  test(`rejects changing worker ${field} while its guidance stays identical`, () => {
    const before = storedRoutes(storedPrimary);
    const after = SnapshotEvidence.parse({ ...fixture(), workers: [{ ...before[0], [field]: value }] }).workers;
    assert.throws(() => sameRoutes(before, after));
  });
}

function twoWorkers() {
  const first = storedRoutes(storedPrimary)[0];
  const second = structuredClone(first);
  second.workerId = "WORKER-B";
  second.profile.workerId = "WORKER-B";
  second.currentGuidance = { ...second.currentGuidance, workerId: "WORKER-B", guidanceId: "second-guidance", profileSnapshot: { ...second.currentGuidance.profileSnapshot, workerId: "WORKER-B" } };
  return [first, second];
}

test("accepts unchanged worker routes reordered by the snapshot", () => {
  const before = twoWorkers();
  assert.doesNotThrow(() => sameRoutes(before, structuredClone(before).reverse()));
});

for (const side of ["before", "after"]) {
  test(`rejects duplicate worker identities in ${side} routes`, () => {
    const pair = { before: twoWorkers(), after: twoWorkers() };
    pair[side][1] = structuredClone(pair[side][0]);
    assert.throws(() => sameRoutes(pair.before, pair.after));
  });
}

test("rejects a replacement worker identity even with the same route count", () => {
  const after = twoWorkers();
  after[1].workerId = "WORKER-C";
  assert.throws(() => sameRoutes(twoWorkers(), after));
});
