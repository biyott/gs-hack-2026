import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { api } from "./api";
import { openSimulationStream } from "./simulation-stream";
import { clientSnapshotFixture as base } from "./snapshot.test-support";
import { useConsoleStore } from "./store";

class ControlledEventSource extends EventTarget {
  static instances: ControlledEventSource[] = [];
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;
  constructor(readonly url: string) {
    super();
    ControlledEventSource.instances.push(this);
  }
  open() {
    this.onopen?.(new Event("open"));
  }
  fail() {
    this.onerror?.(new Event("error"));
  }
  frame(snapshot: SimulationSnapshot) {
    this.dispatchEvent(new MessageEvent("snapshot", { data: JSON.stringify(snapshot) }));
  }
  close() {
    this.closed = true;
  }
}

const cleanups: (() => void)[] = [];
let completeHttp: (snapshot: SimulationSnapshot) => void;
const state = useConsoleStore.getState;
function connect() {
  cleanups.push(openSimulationStream("equipment"));
  const stream = ControlledEventSource.instances.at(-1);
  if (!stream) throw new Error("Expected an opened EventSource");
  return stream;
}

beforeEach(() => {
  useConsoleStore.setState(useConsoleStore.getInitialState(), true);
  ControlledEventSource.instances = [];
  vi.stubGlobal("EventSource", ControlledEventSource);
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  vi.spyOn(api, "snapshot").mockImplementation(
    () =>
      new Promise((resolve) => {
        completeHttp = resolve;
      }),
  );
});
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("EventSource ownership lifecycle", () => {
  it("does not bootstrap from the initial HTTP request and consumes transient SSE frames", async () => {
    const stream = connect();
    completeHttp(base);
    await Promise.resolve();
    expect(state().snapshot).toBeNull();
    stream.open();
    stream.frame(base);
    stream.frame({ ...base, sequence: 11, run: { ...base.run, virtualTimeMs: 100 } });
    expect(state().snapshot?.run.virtualTimeMs).toBe(100);
    stream.frame(base);
    expect(state().snapshot?.sequence).toBe(11);
  });
  it("keeps reconnect baseline available after reversed frames and rejects delayed old HTTP", async () => {
    const stream = connect();
    stream.open();
    stream.frame(base);
    stream.fail();
    expect(state().connection).toBe("reconnecting");
    stream.open();
    stream.frame({ ...base, sequence: 9 });
    const restarted = { ...base, streamId: "00000000-0000-4000-8000-000000000002", sequence: 1 };
    stream.frame(restarted);
    completeHttp({ ...base, sequence: 999 });
    await Promise.resolve();
    expect(state().snapshot).toEqual(restarted);
  });
  it("ignores superseded callbacks and closes the old EventSource", () => {
    const oldStream = connect();
    oldStream.open();
    oldStream.frame(base);
    cleanups.at(-1)?.();
    const activeStream = connect();
    activeStream.open();
    const current = { ...base, sequence: 12, run: { ...base.run, runId: "new-run", version: 0 } };
    activeStream.frame(current);
    oldStream.open();
    oldStream.frame({ ...base, sequence: 99 });
    oldStream.fail();
    expect(oldStream.closed).toBe(true);
    expect(state().snapshot).toEqual(current);
    expect(state().connection).toBe("connected");
  });
  it("rejects a malformed wire frame without consuming the first valid baseline", () => {
    const stream = connect();
    stream.open();
    stream.frame({ ...base, streamId: "legacy" });
    expect(state().snapshot).toBeNull();
    expect(state().error).toContain("실시간 상태 검증 실패");
    stream.frame(base);
    expect(state().snapshot).toEqual(base);
  });
});
