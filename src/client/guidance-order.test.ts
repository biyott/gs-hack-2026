import { beforeEach, describe, expect, it } from "vitest";
import { visibleRoutes } from "@/components/scene/scene-data";
import { currentWorkerGuidance } from "@/components/worker/guidance-policy";
import {
  type Guidance,
  MapSchema,
  type SimulationSnapshot,
  SimulationWireSnapshotSchema,
} from "@/contracts";
import mapData from "../../data/maps/site-construction-01.json";
import { alertObservations } from "./alert-policy";
import reversal from "./fixtures/guidance-reversal.json";
import { evaluateSnapshot } from "./snapshot-policy";
import { useConsoleStore } from "./store";

const map = MapSchema.parse(mapData);
const cases = reversal.cases.map((item) => ({
  control: SimulationWireSnapshotSchema.parse(item.control),
  incoming: SimulationWireSnapshotSchema.parse(item.incoming),
  now: item.context.now,
}));
const store = useConsoleStore.getState;

function snapshot(): SimulationSnapshot {
  const current = store().snapshot;
  if (!current) throw new Error("Expected an accepted test snapshot");
  return current;
}

function changeGuides(source: SimulationSnapshot, change: (guide: Guidance) => Guidance) {
  return SimulationWireSnapshotSchema.parse({
    ...source,
    workers: source.workers.map((worker) => ({
      ...worker,
      currentGuidance: worker.currentGuidance ? change(worker.currentGuidance) : null,
    })),
    incidents: source.incidents.map((incident) => ({
      ...incident,
      currentGuidance: incident.currentGuidance.map(change),
    })),
  });
}

function establish(control: SimulationSnapshot) {
  store().selectMode(control.mode);
  const epoch = store().beginConnection();
  store().acceptSnapshot(control, epoch);
  return epoch;
}

function expectQuarantined(now: number) {
  const current = snapshot();
  for (const worker of current.workers) {
    expect(worker.currentGuidance).toBeNull();
    expect(currentWorkerGuidance(current, worker, map, now)).toBeNull();
  }
  expect(current.incidents.flatMap((incident) => incident.currentGuidance)).toEqual([]);
  expect(visibleRoutes(current, now)).toEqual([]);
  expect(alertObservations(current, now)).toEqual([]);
}

beforeEach(() => useConsoleStore.setState(useConsoleStore.getInitialState(), true));

describe.each(cases)(
  "same-lineage guidance ordering in $control.mode",
  ({ control, incoming, now }) => {
    it("accepts newer outer facts but quarantines the exact frozen v3-to-v2 reversal", () => {
      const epoch = establish(control);
      const advanced = { ...incoming, run: { ...incoming.run, virtualTimeMs: 1234 } };
      expect(
        evaluateSnapshot(advanced, {
          mode: control.mode,
          current: control,
          streamBaselineReady: true,
          canEstablishStream: false,
        }),
      ).toBe("accept");
      store().acceptSnapshot(advanced, epoch);
      expect(snapshot().sequence).toBe(incoming.sequence);
      expect(snapshot().run.virtualTimeMs).toBe(1234);
      expect(snapshot().incidents.map((incident) => incident.firstGuidance)).toEqual(
        incoming.incidents.map((incident) => incident.firstGuidance),
      );
      expectQuarantined(now);
    });

    it("keeps the watermark after quarantine, null guidance and same-stream reconnect", () => {
      establish(control);
      store().acceptSnapshot(incoming);
      expectQuarantined(now);
      store().acceptSnapshot({ ...incoming, sequence: control.sequence + 2 });
      expectQuarantined(now);
      store().acceptSnapshot({
        ...control,
        sequence: control.sequence + 3,
        workers: control.workers.map((worker) => ({ ...worker, currentGuidance: null })),
        incidents: control.incidents.map((incident) => ({ ...incident, currentGuidance: [] })),
      });
      store().acceptSnapshot(
        { ...incoming, sequence: control.sequence + 4 },
        store().beginConnection(),
      );
      expect(snapshot().sequence).toBe(control.sequence + 4);
      expectQuarantined(now);
    });

    it("quarantines a higher envelope that points back to an older primary", () => {
      establish(control);
      store().acceptSnapshot(
        changeGuides(incoming, (guide) => ({
          ...guide,
          guidanceVersion: 4,
          updateKind: "supplement",
          primaryGuidanceVersion: 2,
          mode: "rag-assisted",
          supplementalExplanation: "Supplement fixture",
          evidence: [{ documentId: "doc", documentVersion: "1", chunkId: "chunk" }],
        })),
      );
      expectQuarantined(now);
    });

    it.each(["unchanged", "supplement", "primary", "no-route", "new-id"] as const)(
      "preserves a legitimate %s transition",
      (kind) => {
        establish(control);
        const next = changeGuides({ ...control, sequence: control.sequence + 1 }, (guide) => {
          if (kind === "unchanged") return guide;
          if (kind === "new-id")
            return {
              ...guide,
              guidanceId: "new-guide",
              guidanceVersion: 1,
              primaryGuidanceVersion: 1,
            };
          return {
            ...guide,
            guidanceVersion: 4,
            primaryGuidanceVersion: kind === "supplement" ? 3 : 4,
            updateKind: kind === "supplement" ? "supplement" : "primary",
            ...(kind === "supplement"
              ? {
                  mode: "rag-assisted",
                  supplementalExplanation: "Supplement fixture",
                  evidence: [{ documentId: "doc", documentVersion: "1", chunkId: "chunk" }],
                }
              : {}),
            ...(kind === "no-route"
              ? {
                  actionCode: "ROUTE_UNAVAILABLE",
                  routeVersion: null,
                  stepId: null,
                  waypoints: [],
                  destinationId: null,
                }
              : {}),
          };
        });
        store().acceptSnapshot(next);
        expect(snapshot()).toBe(next);
      },
    );

    it("permits a lower checkpoint only on an accepted fresh server stream", () => {
      establish(control);
      const checkpoint = {
        ...incoming,
        streamId: "00000000-0000-4000-8000-000000000099",
        sequence: 0,
      };
      store().acceptSnapshot(checkpoint, store().beginConnection());
      expect(snapshot()).toBe(checkpoint);
    });

    it("permits a lower version in a new run", () => {
      establish(control);
      const next = changeGuides(incoming, (guide) => ({ ...guide, runId: "new-run" }));
      next.run.runId = "new-run";
      next.incidents = next.incidents.map((incident) => ({
        ...incident,
        runId: "new-run",
        firstGuidance: incident.firstGuidance.map((guide) => ({ ...guide, runId: "new-run" })),
      }));
      store().acceptSnapshot(next);
      expect(snapshot()).toBe(next);
    });

    it("does not let a rejected higher envelope poison a later valid primary", () => {
      establish(control);
      store().acceptSnapshot(
        changeGuides(incoming, (guide) => ({
          ...guide,
          guidanceVersion: 9,
          updateKind: "supplement",
          mode: "rag-assisted",
          supplementalExplanation: "Rejected older primary",
          evidence: [{ documentId: "doc", documentVersion: "1", chunkId: "chunk" }],
        })),
      );
      expectQuarantined(now);
      const next = changeGuides({ ...control, sequence: control.sequence + 2 }, (guide) => ({
        ...guide,
        guidanceVersion: 4,
        primaryGuidanceVersion: 4,
      }));
      store().acceptSnapshot(next);
      expect(snapshot()).toBe(next);
    });

    it.each(["session", "mode"] as const)("clears watermarks across a %s reset", (kind) => {
      establish(control);
      if (kind === "session")
        store().setSession({
          sessionId: "new-session",
          role: "observer",
          actorId: "observer",
          token: "fixture",
          workerId: null,
          deviceRole: null,
          expiresAt: "2099-01-01T00:00:00.000Z",
        });
      else {
        store().selectMode(control.mode === "equipment" ? "fire-gas" : "equipment");
        store().selectMode(control.mode);
      }
      store().acceptSnapshot(incoming, store().beginConnection());
      expect(snapshot()).toBe(incoming);
    });

    it("keeps version watermarks separate for different workers", () => {
      establish(control);
      const next = changeGuides(incoming, (guide) => ({
        ...guide,
        workerId: "WORKER-B",
        profileSnapshot: { ...guide.profileSnapshot, workerId: "WORKER-B" },
      }));
      next.workers = next.workers.map((worker) => ({
        ...worker,
        workerId: "WORKER-B",
        profile: { ...worker.profile, workerId: "WORKER-B" },
      }));
      store().acceptSnapshot(next);
      expect(snapshot()).toBe(next);
    });
  },
);
