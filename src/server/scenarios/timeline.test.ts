import { describe, expect, it } from "vitest";
import { batchesBetween } from "./timeline";

describe("scenario event timeline", () => {
  it("includes zero-time events and preserves same-time order when starting", () => {
    // Given
    const events = [
      { id: "a", atMs: 0 },
      { id: "b", atMs: 100 },
      { id: "c", atMs: 100 },
    ];
    // When
    const batches = batchesBetween(events, -1, 100);
    // Then
    expect(batches).toEqual([
      { atMs: 0, events: [events[0]] },
      { atMs: 100, events: [events[1], events[2]] },
    ]);
  });

  it("does not replay a boundary event when advancing the clock", () => {
    // Given
    const events = [
      { id: "a", atMs: 100 },
      { id: "b", atMs: 200 },
    ];
    // When
    const batches = batchesBetween(events, 100, 200);
    // Then
    expect(batches).toEqual([{ atMs: 200, events: [events[1]] }]);
  });

  it("produces identical event batches when advancing the same interval", () => {
    // Given
    const events = [
      { id: "a", atMs: 10 },
      { id: "b", atMs: 20 },
    ];
    // When
    const runs = Array.from({ length: 3 }, () => batchesBetween(events, -1, 20));
    // Then
    expect(runs).toEqual(
      Array.from({ length: 3 }, () => [
        { atMs: 10, events: [events[0]] },
        { atMs: 20, events: [events[1]] },
      ]),
    );
  });
});
