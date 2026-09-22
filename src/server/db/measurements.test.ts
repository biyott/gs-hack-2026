import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, type SafetyDatabase } from "./index";
import { createMeasurementRepository, type MeasurementInput } from "./measurements";

const databases: SafetyDatabase[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  return { database, measurements: createMeasurementRepository(database) };
}

const sample: MeasurementInput = {
  kind: "uwb",
  sourceId: "WORKER-A",
  sequence: 1,
  observedAt: "2026-09-21T09:00:00.123Z",
  receivedAt: "2026-09-21T09:00:00.456Z",
  payloadJson: JSON.stringify({
    upload: { distanceM: 1.2, azimuthRad: null, elevationRad: null },
    position: null,
    captureClock: {
      deviceCapturedAt: "2026-09-21T08:59:59.900Z",
      offsetMs: 223,
      uncertaintyMs: 7,
      synchronizedAt: "2026-09-21T08:59:00.000Z",
    },
  }),
};

describe("measurement evidence persistence", () => {
  it("preserves both timestamps and raw missing angles without inventing positions", () => {
    // Given
    const { measurements } = fixture();
    // When
    measurements.append(sample);
    // Then
    expect(measurements.latest("uwb", "WORKER-A")).toMatchObject(sample);
    expect(JSON.parse(measurements.latest("uwb")?.payloadJson ?? "null")).toEqual({
      upload: { distanceM: 1.2, azimuthRad: null, elevationRad: null },
      position: null,
      captureClock: {
        deviceCapturedAt: "2026-09-21T08:59:59.900Z",
        offsetMs: 223,
        uncertaintyMs: 7,
        synchronizedAt: "2026-09-21T08:59:00.000Z",
      },
    });
  });

  it("returns the original receipt for an exact duplicate observation", () => {
    // Given
    const { measurements } = fixture();
    const first = measurements.append(sample);
    // When
    const duplicate = measurements.append({ ...sample, receivedAt: "2026-09-21T09:00:01.000Z" });
    // Then
    expect(duplicate).toEqual(first);
    expect(measurements.list("uwb")).toHaveLength(1);
  });

  it("rejects altered raw content for the same observation identity", () => {
    // Given
    const { measurements } = fixture();
    measurements.append(sample);
    // When / Then
    expect(() => measurements.append({ ...sample, payloadJson: '{"distanceM":2}' })).toThrowError(
      "Measurement identity conflict",
    );
    expect(measurements.latest("uwb")?.payloadJson).toBe(sample.payloadJson);
  });

  it("keeps modes of measurement separate and returns only the requested count", () => {
    // Given
    const { measurements } = fixture();
    measurements.append(sample);
    measurements.append({ ...sample, sequence: 2 });
    measurements.append({
      ...sample,
      kind: "camera-frame",
      sourceId: "CCTV-01",
      sequence: 3,
      payloadJson: '{"positions":[]}',
    });
    // When
    const latest = measurements.list("uwb", 1);
    // Then
    expect(latest.map((event) => event.sequence)).toEqual([2]);
    expect(measurements.latest("camera-frame")?.sourceId).toBe("CCTV-01");
  });

  it.each([0, -1, 1001, 1.5])("rejects unbounded or invalid list limit %s", (limit) => {
    // Given
    const { measurements } = fixture();
    // When / Then
    expect(() => measurements.list("uwb", limit)).toThrowError();
  });

  it.each(["jpegBase64", "sessionKeyHex", "token", "authorization"])(
    "rejects %s in nested metadata",
    (field) => {
      // Given
      const { measurements } = fixture();
      // When / Then
      expect(() =>
        measurements.append({
          ...sample,
          payloadJson: JSON.stringify({ nested: [{ [field]: "test-canary" }] }),
        }),
      ).toThrowError("Measurement payload contains forbidden data");
      expect(measurements.list("uwb")).toHaveLength(0);
    },
  );

  it("separates both workers and pairing epochs on a shared controller", () => {
    // Given
    const { measurements } = fixture();
    const sources = [
      ["controller-1", "WORKER-A", "epoch-1"],
      ["controller-1", "WORKER-B", "epoch-1"],
      ["controller-1", "WORKER-A", "epoch-2"],
    ];
    // When
    for (const source of sources)
      measurements.append({ ...sample, sourceId: JSON.stringify(source) });
    // Then
    expect(measurements.list("uwb")).toHaveLength(3);
  });

  it.each(["UPDATE measurement_events SET payload_json = '{}'", "DELETE FROM measurement_events"])(
    "rejects raw mutation: %s",
    (sql) => {
      // Given
      const { database, measurements } = fixture();
      measurements.append(sample);
      // When / Then
      expect(() => database.sqlite.exec(sql)).toThrowError("immutable measurement event");
    },
  );

  it.each(["not JSON", "null", '{"nested":{"binary":"data:image/jpeg;base64,test"}}'])(
    "rejects invalid or binary metadata %s",
    (payloadJson) => {
      // Given
      const { measurements } = fixture();
      // When / Then
      expect(() => measurements.append({ ...sample, payloadJson })).toThrowError();
      expect(measurements.list("uwb")).toHaveLength(0);
    },
  );
});
