import { beforeEach, describe, expect, it } from "vitest";
import { clientSnapshotFixture as base } from "./snapshot.test-support";
import { evaluateSnapshot } from "./snapshot-policy";
import { useConsoleStore } from "./store";

const state = {
  mode: "equipment" as const,
  current: base,
  streamBaselineReady: true,
  canEstablishStream: false,
};

describe("authoritative snapshot ordering", () => {
  it("accepts a newer publication at the same persisted version and rejects reversed frames", () => {
    const advanced = { ...base, sequence: 11, run: { ...base.run, virtualTimeMs: 100 } };
    expect(evaluateSnapshot(advanced, state)).toBe("accept");
    expect(evaluateSnapshot(base, { ...state, current: advanced })).toBe("out-of-order");
  });
  it("ignores HTTP bootstrap until the owned SSE baseline arrives", () => {
    const pending = { ...state, current: null, streamBaselineReady: false };
    expect(evaluateSnapshot(base, pending)).toBe("awaiting-stream");
    expect(evaluateSnapshot(base, { ...pending, canEstablishStream: true })).toBe("accept");
  });
  it("rejects duplicate, reversed sequence and wrong mode", () => {
    expect(evaluateSnapshot(base, state)).toBe("duplicate");
    expect(
      evaluateSnapshot({ ...base, sequence: 9, run: { ...base.run, version: 50 } }, state),
    ).toBe("out-of-order");
    expect(evaluateSnapshot({ ...base, mode: "fire-gas" }, state)).toBe("wrong-mode");
  });
  it("rejects a delayed old-run HTTP response after reset", () => {
    const reset = { ...base, sequence: 12, run: { ...base.run, runId: "new", version: 0 } };
    expect(evaluateSnapshot(reset, state)).toBe("accept");
    expect(evaluateSnapshot({ ...base, sequence: 11 }, { ...state, current: reset })).toBe(
      "out-of-order",
    );
  });
  it("does not let delayed HTTP switch a restarted server stream", () => {
    const restarted = { ...base, streamId: "runtime-2", sequence: 1 };
    expect(evaluateSnapshot(restarted, state)).toBe("foreign-stream");
    expect(evaluateSnapshot(restarted, { ...state, canEstablishStream: true })).toBe("accept");
    expect(evaluateSnapshot(base, { ...state, current: restarted })).toBe("foreign-stream");
  });
  it("does not regress the same stream on reconnect", () => {
    expect(evaluateSnapshot({ ...base, sequence: 9 }, { ...state, canEstablishStream: true })).toBe(
      "out-of-order",
    );
  });
  it("rejects wrong map within a run", () => {
    expect(
      evaluateSnapshot({ ...base, sequence: 11, run: { ...base.run, mapVersion: "2" } }, state),
    ).toBe("map-mismatch");
  });
});

describe("owned SSE connection store", () => {
  beforeEach(() => useConsoleStore.setState(useConsoleStore.getInitialState(), true));
  it("ignores bootstrap HTTP and callbacks from a replaced connection", () => {
    const store = useConsoleStore.getState;
    const oldEpoch = store().beginConnection();
    store().acceptSnapshot(base);
    expect(store().snapshot).toBeNull();
    const activeEpoch = store().beginConnection();
    store().acceptSnapshot(base, oldEpoch);
    expect(store().snapshot).toBeNull();
    store().acceptSnapshot(base, activeEpoch);
    expect(store().snapshot).toBe(base);
    store().acceptSnapshot({ ...base, sequence: 11 }, oldEpoch);
    expect(store().snapshot).toBe(base);
  });
  it("adopts a restarted stream once then rejects delayed HTTP and foreign SSE", () => {
    const store = useConsoleStore.getState;
    store().acceptSnapshot(base, store().beginConnection());
    const epoch = store().beginConnection();
    const restarted = { ...base, streamId: "runtime-2", sequence: 1 };
    store().acceptSnapshot(restarted);
    expect(store().snapshot).toBe(base);
    store().acceptSnapshot(restarted, epoch);
    store().acceptSnapshot({ ...base, sequence: 99 });
    store().acceptSnapshot({ ...base, sequence: 100 }, epoch);
    expect(store().snapshot).toBe(restarted);
    store().acceptSnapshot({ ...restarted, sequence: 2 });
    expect(store().snapshot?.sequence).toBe(2);
  });
  it("keeps the reconnect baseline open after rejected old frames", () => {
    const store = useConsoleStore.getState;
    store().acceptSnapshot(base, store().beginConnection());
    const epoch = store().beginConnection();
    store().acceptSnapshot(base, epoch);
    store().acceptSnapshot({ ...base, sequence: 9 }, epoch);
    expect(store().streamBaselineReady).toBe(false);
    const restarted = { ...base, streamId: "00000000-0000-4000-8000-000000000002", sequence: 0 };
    store().acceptSnapshot(restarted, epoch);
    expect(store().snapshot).toBe(restarted);
    expect(store().streamBaselineReady).toBe(true);
  });
  it("invalidates an old connection on mode change", () => {
    const store = useConsoleStore.getState;
    const epoch = store().beginConnection();
    store().acceptSnapshot(base, epoch);
    store().selectMode("fire-gas");
    store().acceptSnapshot({ ...base, mode: "fire-gas", sequence: 11 }, epoch);
    expect(store().snapshot).toBeNull();
  });
});
