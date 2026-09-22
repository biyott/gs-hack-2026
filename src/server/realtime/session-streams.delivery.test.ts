import assert from "node:assert/strict";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimulationSnapshotSchema } from "@/contracts";
import { GET } from "../../../app/api/events/route";
import { getSessionStreams } from "./session-streams";
import { fixture, openStream } from "./session-streams.test-support";

afterEach(() => vi.useRealTimers());

function decoded(frame: ReadableStreamReadResult<Uint8Array>) {
  const text = new TextDecoder().decode(frame.value);
  const data = text.split("\n").find((line) => line.startsWith("data: "));
  assert.ok(data);
  return { text, snapshot: SimulationSnapshotSchema.parse(JSON.parse(data.slice(6))) };
}

describe("SSE delivery and disconnect lifecycle", () => {
  it("sends the current snapshot with its stream identity when a client reconnects", async () => {
    // Given
    const f = fixture();
    const session = f.login("admin", "admin");
    const first = openStream(session);
    await first.reader.read();
    await first.reader.cancel();
    const run = f.runtime.getRun("equipment");
    f.runtime.command(
      {
        action: "start",
        mode: "equipment",
        expectedVersion: run.snapshot.run.version,
        requestId: "reconnect-start",
      },
      session,
    );
    // When
    const second = openStream(session);
    const received = decoded(await second.reader.read());
    // Then
    expect(received.snapshot).toEqual(f.runtime.getRun("equipment").snapshot);
    expect(received.text).toContain(
      `id: ${received.snapshot.streamId}:equipment:${received.snapshot.sequence}\n`,
    );
    expect(getSessionStreams().count(session.sessionId)).toBe(1);
  });

  it("keeps only the latest pending snapshot when a consumer applies backpressure", async () => {
    // Given
    const f = fixture();
    const stream = openStream(f.login());
    const initial = f.runtime.getRun("equipment").snapshot;
    // When
    for (let offset = 1; offset <= 100; offset++)
      f.runtime.bus.publish({ ...initial, sequence: initial.sequence + offset });
    const first = decoded(await stream.reader.read());
    const latest = decoded(await stream.reader.read());
    // Then
    expect([first.snapshot.sequence, latest.snapshot.sequence]).toEqual([
      initial.sequence,
      initial.sequence + 100,
    ]);
  });

  it("removes the registry, bus listener and heartbeat when the reader cancels", async () => {
    // Given
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const f = fixture();
    const stream = openStream(f.login());
    await stream.reader.read();
    // When
    await stream.reader.cancel();
    stream.controller.abort();
    // Then
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect(getSessionStreams().count()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never registers a live subscription when the request is already aborted", async () => {
    // Given
    const f = fixture();
    const session = f.login();
    const controller = new AbortController();
    controller.abort();
    // When
    const response = GET(
      new Request("http://localhost/api/events", {
        headers: { authorization: `Bearer ${session.token}` },
        signal: controller.signal,
      }),
    );
    // Then
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect(getSessionStreams().count()).toBe(0);
    expect(await response.text()).toBe("");
  });

  it("closes at the heartbeat when an account is revoked outside a session route", async () => {
    // Given
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const f = fixture();
    const session = f.login();
    const stream = openStream(session);
    await stream.reader.read();
    f.auth.logout(session.token);
    // When
    vi.advanceTimersByTime(15000);
    // Then
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect(getSessionStreams().count()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect((await stream.reader.read()).done).toBe(true);
  });

  it("rejects buffered delivery when its session was revoked before the next pull", async () => {
    // Given
    const f = fixture();
    const session = f.login();
    const stream = openStream(session);
    const snapshot = f.runtime.getRun("equipment").snapshot;
    f.runtime.bus.publish({ ...snapshot, sequence: snapshot.sequence + 1 });
    f.auth.logout(session.token);
    // When
    await stream.reader.read();
    const next = await stream.reader.read();
    // Then
    expect(next.done).toBe(true);
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect(getSessionStreams().count()).toBe(0);
  });
});

describe("backpressured authorization", () => {
  it("closes a revoked stream when publishing while its outgoing queue is full", () => {
    // Given
    const f = fixture();
    const session = f.login();
    openStream(session);
    f.auth.logout(session.token);
    // When
    f.runtime.bus.publish(f.runtime.getRun("equipment").snapshot);
    // Then
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect(getSessionStreams().count()).toBe(0);
  });
});
