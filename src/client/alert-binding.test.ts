import { describe, expect, it } from "vitest";
import { z } from "zod";
import { type Guidance, type SimulationSnapshot, SimulationWireSnapshotSchema } from "@/contracts";
import { AlertLedger, alertObservations } from "./alert-policy";
import frozenInputs from "./fixtures/alert-binding-qd006.json";

const fixture = z
  .object({
    cases: z
      .array(
        z.object({
          expected: z.object({
            index: z.number(),
            label: z.string(),
            expectedAnnouncements: z.number(),
          }),
          input: z.object({
            index: z.number(),
            label: z.string(),
            context: z.object({ now: z.number() }),
            control: SimulationWireSnapshotSchema,
            incoming: SimulationWireSnapshotSchema,
          }),
        }),
      )
      .length(10),
  })
  .parse(frozenInputs);

function sample() {
  const row = fixture.cases.find((item) => item.input.index === 1);
  if (!row) throw new Error("Frozen forward control is missing");
  return structuredClone(row.input);
}

function editGuidance(snapshot: SimulationSnapshot, update: (guide: Guidance) => Guidance) {
  return {
    ...snapshot,
    incidents: snapshot.incidents.map((incident) => ({
      ...incident,
      currentGuidance: incident.currentGuidance.map(update),
    })),
  };
}

describe("QD006 frozen manager alert projection probes", () => {
  for (const { expected, input } of fixture.cases) {
    it(`${input.index}: ${input.control.mode} ${input.label}`, () => {
      // Given: the original owned snapshot and a silent manager alert baseline.
      const ledger = new AlertLedger();
      const scope = JSON.stringify([input.control.streamId, input.control.run.runId, 1]);
      expect(ledger.update(scope, alertObservations(input.control, input.context.now))).toEqual([]);
      const preservedInput = structuredClone(input.incoming);
      // When: the exact frozen incoming payload reaches the alert projection directly.
      const observations = alertObservations(input.incoming, input.context.now);
      const announcements = ledger.update(scope, observations);
      // Then: binding rejection affects announcement eligibility and leaves history intact.
      expect(announcements).toHaveLength(expected.expectedAnnouncements);
      expect(input.incoming).toEqual(preservedInput);
    });
  }
});

describe("manager alert eligibility and independent signals", () => {
  it.each([
    {
      name: "mode",
      update: (guide: Guidance): Guidance => ({ ...guide, simulationMode: "fire-gas" }),
    },
    {
      name: "target worker",
      update: (guide: Guidance): Guidance => ({ ...guide, workerId: "ABSENT" }),
    },
    {
      name: "owning incident",
      update: (guide: Guidance): Guidance => ({ ...guide, incidentId: "OTHER" }),
    },
    {
      name: "profile version",
      update: (guide: Guidance): Guidance => ({
        ...guide,
        profileVersion: 2,
        profileSnapshot: { ...guide.profileSnapshot, version: 2 },
      }),
    },
  ])("rejects mismatched $name in an incident guide", ({ update }) => {
    const { incoming, context } = sample();
    const observations = alertObservations(editGuidance(incoming, update), context.now);
    expect(observations).toEqual([]);
  });

  it("rejects a foreign owning incident run", () => {
    const { incoming, context } = sample();
    const observations = alertObservations(
      {
        ...incoming,
        incidents: incoming.incidents.map((incident) => ({ ...incident, runId: "OTHER" })),
      },
      context.now,
    );
    expect(observations).toEqual([]);
  });

  it("keeps valid independent incident guidance for the same worker", () => {
    const { control, context } = sample();
    const independent = control.incidents.map((incident) => ({
      ...incident,
      incidentId: "INDEPENDENT",
      currentGuidance: incident.currentGuidance.map((guide) => ({
        ...guide,
        incidentId: "INDEPENDENT",
        guidanceId: "INDEPENDENT-GUIDE",
      })),
    }));
    const ledger = new AlertLedger();
    ledger.update("scope", alertObservations(control, context.now));
    const announcements = ledger.update(
      "scope",
      alertObservations(
        { ...control, incidents: [...control.incidents, ...independent] },
        context.now,
      ),
    );
    expect(announcements.map((item) => [item.id, item.reason])).toEqual([["INDEPENDENT", "new"]]);
  });

  it("keeps a valid severity escalation with unchanged guidance", () => {
    const { control, context } = sample();
    const ledger = new AlertLedger();
    ledger.update("scope", alertObservations(control, context.now));
    const raised = {
      ...control,
      incidents: control.incidents.map((incident) => ({
        ...incident,
        priority: "critical" as const,
      })),
    };
    const announcements = ledger.update("scope", alertObservations(raised, context.now));
    expect(announcements.map((item) => item.reason)).toEqual(["escalated"]);
  });

  it.each([false, true])(
    "allows help only when its worker-owned guidance is bound: invalid=%s",
    (invalid) => {
      const { control, context } = sample();
      const ledger = new AlertLedger();
      ledger.update("scope", alertObservations(control, context.now));
      const requested = {
        ...control,
        workers: control.workers.map((worker) => ({
          ...worker,
          currentGuidance: worker.currentGuidance && {
            ...worker.currentGuidance,
            mapId: invalid ? "OTHER" : control.run.mapId,
          },
          response: { ...worker.response, helpRequestedAt: new Date(context.now).toISOString() },
        })),
      };
      const announcements = ledger.update("scope", alertObservations(requested, context.now));
      expect(announcements.filter((item) => item.id.includes(":help:"))).toHaveLength(
        invalid ? 0 : 1,
      );
    },
  );

  it("does not let an invalid member suppress its later corrected primary", () => {
    const { control, context } = sample();
    const withBoth = {
      ...control,
      workers: control.workers.flatMap((worker) => [
        worker,
        { ...worker, workerId: "WORKER-B", profile: { ...worker.profile, workerId: "WORKER-B" } },
      ]),
      incidents: control.incidents.map((incident) => ({
        ...incident,
        currentGuidance: incident.currentGuidance.flatMap((guide) => [
          guide,
          {
            ...guide,
            workerId: "WORKER-B",
            profileSnapshot: { ...guide.profileSnapshot, workerId: "WORKER-B" },
          },
        ]),
      })),
    };
    const ledger = new AlertLedger();
    ledger.update("scope", alertObservations(withBoth, context.now));
    const next = (mapId: string) =>
      editGuidance(withBoth, (guide) =>
        guide.workerId === "WORKER-A"
          ? { ...guide, guidanceVersion: 4, primaryGuidanceVersion: 4, mapId }
          : guide,
      );
    const rejected = ledger.update("scope", alertObservations(next("OTHER"), context.now));
    const recovered = ledger.update(
      "scope",
      alertObservations(next(control.run.mapId), context.now),
    );
    expect(rejected).toEqual([]);
    expect(recovered.map((item) => item.reason)).toEqual(["changed"]);
  });
});
