import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createDatabase } from "./index";
import { createMeasurementRepository, type MeasurementInput } from "./measurements";

it("recovers measurement evidence after the native database connection is reopened", () => {
  // Given
  const directory = mkdtempSync(join(tmpdir(), "gs-measurement-"));
  const filename = join(directory, "safety.sqlite");
  const first = createDatabase(filename);
  const event: MeasurementInput = {
    kind: "camera-frame",
    sourceId: "CCTV-01",
    sequence: 7,
    observedAt: "2026-09-21T09:00:00.001Z",
    receivedAt: "2026-09-21T09:00:00.070Z",
    payloadJson:
      '{"upload":{"width":640,"height":480},"positions":[],"jpegSha256":"digest-fixture"}',
  };
  createMeasurementRepository(first).append(event);
  first.close();
  // When
  const reopened = createDatabase(filename);
  try {
    // Then
    expect(createMeasurementRepository(reopened).latest("camera-frame")).toMatchObject(event);
  } finally {
    reopened.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
