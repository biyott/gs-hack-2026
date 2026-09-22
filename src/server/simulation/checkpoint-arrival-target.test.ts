import { describe, expect, it } from "vitest";
import { RuntimeCheckpointSchema } from "./checkpoint";
import { active } from "./runtime-test-fixtures";

describe("QD003-D2 private arrival target checkpoint compatibility", () => {
  it.each([
    { input: { x: 125, y: 8 }, expected: { x: 125, y: 8 } },
    { input: null, expected: null },
    {
      input: { x: 125, y: 8, floorId: "GROUND", nodeId: "REFUGE-01", unrecognized: "discard" },
      expected: { x: 125, y: 8, floorId: "GROUND", nodeId: "REFUGE-01" },
    },
  ])("round-trips the supported private target fields %#", ({ input, expected }) => {
    const f = active();
    const run = f.runtime.getRun("equipment");
    const checkpoint = RuntimeCheckpointSchema.parse(JSON.parse(run.checkpoint()));
    const serialized = JSON.stringify({ ...checkpoint, arrivalTargets: { "WORKER-A": input } });
    run.restoreCheckpoint(serialized);
    expect(run.arrivalTargets["WORKER-A"]).toEqual(expected);
    const restored = RuntimeCheckpointSchema.parse(JSON.parse(run.checkpoint()));
    expect(restored.arrivalTargets["WORKER-A"]).toEqual(expected);
  });

  it.each(["floorId", "nodeId"] as const)("rejects a non-string %s", (field) => {
    const f = active();
    const checkpoint = RuntimeCheckpointSchema.parse(
      JSON.parse(f.runtime.getRun("equipment").checkpoint()),
    );
    expect(
      RuntimeCheckpointSchema.safeParse({
        ...checkpoint,
        arrivalTargets: { "WORKER-A": { x: 125, y: 8, [field]: 7 } },
      }).success,
    ).toBe(false);
  });
});
