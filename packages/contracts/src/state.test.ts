import { describe, expect, it } from "vitest";
import { SimulationCommandSchema } from "./commands";
import {
  EquipmentStateSchema,
  ResponseStateSchema,
  RunStateSchema,
  SimulationSnapshotSchema,
  SimulationWireSnapshotSchema,
  WorkerStateSchema,
} from "./state";

const publication = SimulationSnapshotSchema.pick({ streamId: true, sequence: true });

describe("snapshot publication boundary", () => {
  it("normalizes an old persisted snapshot before runtime stamping", () => {
    expect(publication.parse({})).toEqual({ streamId: "legacy", sequence: 0 });
  });

  it("preserves a current runtime identity and exact safe sequence", () => {
    const value = { streamId: "e272af4b-95eb-4da2-a6ce-cbb11735b017", sequence: 1_000_001 };
    expect(publication.parse(value)).toEqual(value);
  });

  it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an ambiguous or invalid sequence %s",
    (sequence) => {
      expect(publication.safeParse({ streamId: "runtime", sequence }).success).toBe(false);
    },
  );

  it("rejects an empty stream identity", () => {
    expect(publication.safeParse({ streamId: "", sequence: 1 }).success).toBe(false);
  });

  it("rejects persistence-only defaults at the HTTP and SSE boundary", () => {
    const wire = SimulationWireSnapshotSchema.pick({ streamId: true, sequence: true });
    expect(wire.safeParse({}).success).toBe(false);
    expect(wire.safeParse({ streamId: "legacy", sequence: 0 }).success).toBe(false);
    expect(
      wire.safeParse({ streamId: "e272af4b-95eb-4da2-a6ce-cbb11735b017", sequence: 1 }).success,
    ).toBe(true);
  });

  it("never upgrades missing measurement provenance to live", () => {
    for (const source of [
      WorkerStateSchema.pick({ positionSource: true, positionInputSource: true }),
      EquipmentStateSchema.pick({ positionSource: true, positionInputSource: true }),
    ]) {
      expect(source.parse({ positionSource: "uwb" }).positionInputSource).toBe("unknown");
      expect(
        source.parse({ positionSource: "uwb", positionInputSource: "synthetic" })
          .positionInputSource,
      ).toBe("synthetic");
    }
  });

  it("keeps migrated runs sensor-free until an explicit versioned selection", () => {
    expect(RunStateSchema.pick({ positionInput: true }).parse({})).toEqual({
      positionInput: "scenario",
    });
    const selection = {
      action: "position-input",
      input: "measured",
      mode: "equipment",
      expectedVersion: 3,
      requestId: "select-measured-1",
    };
    expect(SimulationCommandSchema.parse(selection)).toEqual(selection);
    expect(
      SimulationCommandSchema.safeParse({ ...selection, expectedVersion: undefined }).success,
    ).toBe(false);
  });

  it("preserves a stop request without inventing an observed voice completion", () => {
    const response = { voiceStatus: "stop-requested", spokenAt: null };
    expect(ResponseStateSchema.pick({ voiceStatus: true, spokenAt: true }).parse(response)).toEqual(
      response,
    );
  });

  it("retains a recorded primary stop intent before a voice-started receipt arrives", () => {
    const value = { voiceStopRequestedAt: "2026-09-21T11:50:00.000Z" };
    expect(ResponseStateSchema.pick({ voiceStopRequestedAt: true }).parse(value)).toEqual(value);
  });

  it("accepts an old response with no recorded stop intent", () => {
    expect(ResponseStateSchema.pick({ voiceStopRequestedAt: true }).parse({})).toEqual({});
  });
});
