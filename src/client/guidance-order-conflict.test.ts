import { beforeEach, describe, expect, it } from "vitest";
import type { Guidance } from "@/contracts";
import { SimulationWireSnapshotSchema } from "@/contracts";
import { alertObservations } from "./alert-policy";
import reversal from "./fixtures/guidance-reversal.json";
import { useConsoleStore } from "./store";

const cases = reversal.cases.map((item) => ({
  control: SimulationWireSnapshotSchema.parse(item.control),
  now: item.context.now,
}));
const store = useConsoleStore.getState;
const version = (guide: Guidance, number: number): Guidance => ({
  ...guide,
  guidanceVersion: number,
  primaryGuidanceVersion: number,
});

beforeEach(() => useConsoleStore.setState(useConsoleStore.getInitialState(), true));

describe.each(cases)("conflicting current copies in $control.mode", ({ control, now }) => {
  it.each(["incident", "worker"] as const)(
    "quarantines a higher unpaired %s copy without poisoning the next authentic update",
    (higher) => {
      store().selectMode(control.mode);
      store().acceptSnapshot(control, store().beginConnection());
      const conflict = SimulationWireSnapshotSchema.parse({
        ...control,
        sequence: control.sequence + 1,
        workers: control.workers.map((worker) => ({
          ...worker,
          currentGuidance: worker.currentGuidance
            ? version(worker.currentGuidance, higher === "worker" ? 9 : 3)
            : null,
        })),
        incidents: control.incidents.map((incident) => ({
          ...incident,
          currentGuidance: incident.currentGuidance.map((guide) =>
            version(guide, higher === "incident" ? 9 : 3),
          ),
        })),
      });
      store().acceptSnapshot(conflict);
      expect(store().snapshot?.sequence).toBe(conflict.sequence);
      expect(store().snapshot?.workers.every((worker) => worker.currentGuidance === null)).toBe(
        true,
      );
      expect(store().snapshot?.incidents.flatMap((incident) => incident.currentGuidance)).toEqual(
        [],
      );
      const current = store().snapshot;
      if (!current) throw new Error("Expected accepted outer facts");
      expect(alertObservations(current, now)).toEqual([]);
      expect(current.incidents.map((incident) => incident.firstGuidance)).toEqual(
        control.incidents.map((incident) => incident.firstGuidance),
      );
      const valid = SimulationWireSnapshotSchema.parse({
        ...conflict,
        sequence: control.sequence + 2,
        workers: control.workers.map((worker) => ({
          ...worker,
          currentGuidance: worker.currentGuidance ? version(worker.currentGuidance, 4) : null,
        })),
        incidents: control.incidents.map((incident) => ({
          ...incident,
          currentGuidance: incident.currentGuidance.map((guide) => version(guide, 4)),
        })),
      });
      store().acceptSnapshot(valid);
      expect(store().snapshot).toBe(valid);
    },
  );

  it("does not confuse a separate incident guidance identity with conflicting copies", () => {
    store().selectMode(control.mode);
    store().acceptSnapshot(control, store().beginConnection());
    const incident = control.incidents[0];
    if (!incident) throw new Error("Expected fixture incident");
    const next = {
      ...control,
      sequence: control.sequence + 1,
      incidents: [
        ...control.incidents,
        {
          ...incident,
          incidentId: "independent-incident",
          currentGuidance: incident.currentGuidance.map((guide) => ({
            ...version(guide, 1),
            incidentId: "independent-incident",
            guidanceId: "independent-guide",
          })),
        },
      ],
    };
    store().acceptSnapshot(next);
    expect(store().snapshot).toBe(next);
  });

  it("permits incident guidance while the worker has no current copy", () => {
    store().selectMode(control.mode);
    store().acceptSnapshot(control, store().beginConnection());
    const next = {
      ...control,
      sequence: control.sequence + 1,
      workers: control.workers.map((worker) => ({ ...worker, currentGuidance: null })),
    };
    store().acceptSnapshot(next);
    expect(store().snapshot).toBe(next);
  });

  it("does not let the confirmed invalid-map input poison valid lineage ordering", () => {
    store().selectMode(control.mode);
    store().acceptSnapshot(control, store().beginConnection());
    const next = (number: number, mapId: string, sequence: number) => ({
      ...control,
      sequence,
      workers: control.workers.map((worker) => ({
        ...worker,
        currentGuidance: worker.currentGuidance
          ? { ...version(worker.currentGuidance, number), mapId }
          : null,
      })),
      incidents: control.incidents.map((incident) => ({
        ...incident,
        currentGuidance: incident.currentGuidance.map((guide) => ({
          ...version(guide, number),
          mapId,
        })),
      })),
    });
    store().acceptSnapshot(next(9, "wrong-map", control.sequence + 1));
    const valid = next(4, control.run.mapId, control.sequence + 2);
    store().acceptSnapshot(valid);
    expect(store().snapshot).toBe(valid);
  });
});
