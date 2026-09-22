import { describe, expect, it } from "vitest";
import {
  ANNOTATION_GAP,
  ANNOTATION_LABEL_HEIGHT,
  ANNOTATION_LABEL_MAX_WIDTH,
  ANNOTATION_MARGIN,
  placeAnnotations,
} from "./annotation-layout";

describe("placeAnnotations", () => {
  it("preserves priority when dense edge anchors need 44 pixel touch targets", () => {
    // Given
    const anchors = [
      { id: "lower-priority", x: 106, y: 196, priority: 2 },
      { id: "z-priority-tie", x: 106, y: 196, priority: 1 },
      { id: "a-priority-tie", x: 106, y: 196, priority: 1 },
      { id: "critical", x: 106, y: 196, priority: 0 },
      { id: "overflow", x: 106, y: 196, priority: 3 },
    ];
    const viewport = { width: 106, height: 196 };

    // When
    const placed = placeAnnotations(anchors, viewport);

    // Then
    expect(placed.map((label) => label.id)).toEqual([
      "critical",
      "a-priority-tie",
      "z-priority-tie",
      "lower-priority",
    ]);
    for (const [index, label] of placed.entries()) {
      expect(label.width).toBeGreaterThanOrEqual(44);
      expect(label.height).toBeGreaterThanOrEqual(44);
      expect(label.left).toBeGreaterThanOrEqual(ANNOTATION_MARGIN);
      expect(label.top).toBeGreaterThanOrEqual(ANNOTATION_MARGIN);
      expect(label.left + label.width).toBeLessThanOrEqual(viewport.width - ANNOTATION_MARGIN);
      expect(label.top + label.height).toBeLessThanOrEqual(viewport.height - ANNOTATION_MARGIN);
      for (const other of placed.slice(index + 1)) {
        expect(
          label.left + label.width + ANNOTATION_GAP <= other.left ||
            other.left + other.width + ANNOTATION_GAP <= label.left ||
            label.top + label.height + ANNOTATION_GAP <= other.top ||
            other.top + other.height + ANNOTATION_GAP <= label.top,
        ).toBe(true);
      }
    }
  });

  it("places nearby anchors in separate label rectangles", () => {
    // Given
    const anchors = [
      { id: "first", x: 180, y: 100, priority: 0 },
      { id: "second", x: 182, y: 100, priority: 0 },
    ];

    // When
    const placed = placeAnnotations(anchors, { width: 390, height: 220 });

    // Then
    expect(placed).toHaveLength(2);
    const [first, second] = placed;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!(first && second)) {
      return;
    }
    expect(
      first.left + first.width + ANNOTATION_GAP <= second.left ||
        second.left + second.width + ANNOTATION_GAP <= first.left ||
        first.top + first.height + ANNOTATION_GAP <= second.top ||
        second.top + second.height + ANNOTATION_GAP <= first.top,
    ).toBe(true);
  });

  it("keeps the lowest-numbered priority and then lowest id when only one fits", () => {
    // Given
    const anchors = [
      { id: "lower-priority", x: 50, y: 18, priority: 1 },
      { id: "z-priority-tie", x: 50, y: 18, priority: 0 },
      { id: "a-priority-tie", x: 50, y: 18, priority: 0 },
    ];

    // When
    const placed = placeAnnotations(anchors, {
      width: ANNOTATION_LABEL_MAX_WIDTH + ANNOTATION_MARGIN * 2,
      height: ANNOTATION_LABEL_HEIGHT + ANNOTATION_MARGIN * 2,
    });

    // Then
    expect(placed.map((label) => label.id)).toEqual(["a-priority-tie"]);
  });

  it("omits anchors outside the viewport", () => {
    // Given
    const anchors = [
      { id: "visible", x: 20, y: 20, priority: 0 },
      { id: "left", x: -1, y: 20, priority: 0 },
      { id: "right", x: 201, y: 20, priority: 0 },
      { id: "top", x: 20, y: -1, priority: 0 },
      { id: "bottom", x: 20, y: 101, priority: 0 },
    ];

    // When
    const placed = placeAnnotations(anchors, { width: 200, height: 100 });

    // Then
    expect(placed.map((label) => label.id)).toEqual(["visible"]);
  });

  it("clamps edge labels within the viewport without changing their anchors", () => {
    // Given
    const anchors = [
      { id: "top-left", x: 0, y: 0, priority: 0 },
      { id: "bottom-right", x: 220, y: 120, priority: 0 },
    ];
    const viewport = { width: 220, height: 120 };

    // When
    const placed = placeAnnotations(anchors, viewport);

    // Then
    expect(placed).toHaveLength(2);
    for (const label of placed) {
      expect(label.left).toBeGreaterThanOrEqual(ANNOTATION_MARGIN);
      expect(label.top).toBeGreaterThanOrEqual(ANNOTATION_MARGIN);
      expect(label.left + label.width).toBeLessThanOrEqual(viewport.width - ANNOTATION_MARGIN);
      expect(label.top + label.height).toBeLessThanOrEqual(viewport.height - ANNOTATION_MARGIN);
      expect(anchors.find((anchor) => anchor.id === label.id)).toMatchObject({
        x: label.x,
        y: label.y,
      });
    }
  });

  it("lays out dense annotations inside a 390 pixel viewport", () => {
    // Given
    const anchors = Array.from({ length: 8 }, (_, index) => ({
      id: `anchor-${index}`,
      x: 195,
      y: 90,
      priority: index,
    }));
    const viewport = { width: 390, height: 180 };

    // When
    const placed = placeAnnotations(anchors, viewport);

    // Then
    expect(placed).toHaveLength(8);
    expect(placed.map((label) => label.id)).toEqual(anchors.map((anchor) => anchor.id));
    for (const [index, label] of placed.entries()) {
      expect(label.width).toBe(ANNOTATION_LABEL_MAX_WIDTH);
      expect(label.height).toBe(ANNOTATION_LABEL_HEIGHT);
      expect(label.left).toBeGreaterThanOrEqual(ANNOTATION_MARGIN);
      expect(label.top).toBeGreaterThanOrEqual(ANNOTATION_MARGIN);
      expect(label.left + label.width).toBeLessThanOrEqual(viewport.width - ANNOTATION_MARGIN);
      expect(label.top + label.height).toBeLessThanOrEqual(viewport.height - ANNOTATION_MARGIN);
      expect(anchors.find((anchor) => anchor.id === label.id)).toMatchObject({
        x: label.x,
        y: label.y,
      });
      for (const other of placed.slice(index + 1)) {
        expect(
          label.left + label.width + ANNOTATION_GAP <= other.left ||
            other.left + other.width + ANNOTATION_GAP <= label.left ||
            label.top + label.height + ANNOTATION_GAP <= other.top ||
            other.top + other.height + ANNOTATION_GAP <= label.top,
        ).toBe(true);
      }
    }
  });
});
