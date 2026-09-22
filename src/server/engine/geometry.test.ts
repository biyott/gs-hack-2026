import { describe, expect, it } from "vitest";
import {
  pathIntersectsPolygon,
  permitsEgress,
  pointInPolygon,
  segmentIntersectsPolygon,
} from "./geometry";

const box = [
  { x: 4, y: -1 },
  { x: 6, y: -1 },
  { x: 6, y: 1 },
  { x: 4, y: 1 },
];

describe("authoritative polygon geometry", () => {
  it("detects a crossing when both segment endpoints are outside", () => {
    // Given
    const segment = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ] as const;
    // When
    const intersects = segmentIntersectsPolygon(segment, box);
    // Then
    expect(intersects).toBe(true);
  });

  it("treats boundary overlap as intersecting", () => {
    // Given
    const segment = [
      { x: 0, y: 1 },
      { x: 10, y: 1 },
    ] as const;
    // When
    const intersects = segmentIntersectsPolygon(segment, box);
    // Then
    expect(intersects).toBe(true);
  });

  it("includes points and zero-length segments on a boundary", () => {
    // Given
    const point = { x: 4, y: 0 };
    // When
    const outcome = [pointInPolygon(point, box), segmentIntersectsPolygon([point, point], box)];
    // Then
    expect(outcome).toEqual([true, true]);
  });

  it("checks the middle of a polyline", () => {
    // Given
    const path = [
      { x: 0, y: 2 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 2 },
    ];
    // When
    const intersects = pathIntersectsPolygon(path, box);
    // Then
    expect(intersects).toBe(true);
  });

  it("permits an exposed start to leave its hazard", () => {
    // Given
    const path = [
      { x: 5, y: 0 },
      { x: 7, y: 0 },
    ];
    // When
    const permitted = permitsEgress(path, [box]);
    // Then
    expect(permitted).toBe(true);
  });

  it("rejects escape that subsequently re-enters the original hazard", () => {
    // Given
    const path = [
      { x: 5, y: 0 },
      { x: 7, y: 0 },
      { x: 3, y: 0 },
    ];
    // When
    const permitted = permitsEgress(path, [box]);
    // Then
    expect(permitted).toBe(false);
  });

  it("rejects escape crossing a different hazard", () => {
    // Given
    const other = box.map((point) => ({ x: point.x + 4, y: point.y }));
    const path = [
      { x: 5, y: 0 },
      { x: 11, y: 0 },
    ];
    // When
    const permitted = permitsEgress(path, [box, other]);
    // Then
    expect(permitted).toBe(false);
  });

  it("rejects an escape destination still in a hazard", () => {
    // Given
    const path = [
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ];
    // When
    const permitted = permitsEgress(path, [box]);
    // Then
    expect(permitted).toBe(false);
  });

  it("rejects concave escape re-entry at small coordinate scales", () => {
    // Given
    const polygon = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 5.1, y: 10 },
      { x: 2.1, y: 2 },
      { x: 2, y: 2 },
      { x: 5, y: 10 },
      { x: 0, y: 10 },
    ].map((point) => ({ x: point.x * 1e-6, y: point.y * 1e-6 }));
    // When
    const permitted = permitsEgress(
      [
        { x: 1e-6, y: 5e-6 },
        { x: 11e-6, y: 5e-6 },
      ],
      [polygon],
    );
    // Then
    expect(permitted).toBe(false);
  });
});
