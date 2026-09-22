import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MapSchema } from "@/contracts";
import { snapshot } from "@/server/incidents/test-fixtures";
import mapDocument from "../../../data/maps/site-construction-01.json";
import { SceneAnnotations, sceneAnnotations } from "./SceneAnnotations";

const map = MapSchema.parse(mapDocument);

describe("screen-space scene annotations", () => {
  it("omits unknown positions while keeping a compact provenance label for known equipment", () => {
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        positionStatus: "unknown" as const,
      })),
    };
    const annotations = sceneAnnotations(state, map, null);
    expect(annotations.some((annotation) => annotation.workerId !== null)).toBe(false);
    expect(annotations.find((annotation) => annotation.id === snapshot.equipment.id)?.label).toBe(
      "장비 · 합성",
    );
  });

  it("retains detailed source and stale state in accessible worker labels", () => {
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        positionStatus: "stale" as const,
        positionInputSource: "synthetic" as const,
      })),
    };
    const annotations = sceneAnnotations(state, map, "WORKER-A");
    const markup = renderToStaticMarkup(
      createElement(SceneAnnotations, {
        annotations,
        anchors: [{ id: "WORKER-A", x: 80, y: 80, priority: 0 }],
        width: 336,
        height: 320,
        onSelectWorker: () => undefined,
      }),
    );
    expect(markup).toContain('data-stale="true"');
    expect(markup).toContain('data-input-source="synthetic"');
    expect(markup).toContain("마지막 위치 · 오래됨");
    expect(markup).toContain("합성 입력");
    expect(markup).toContain("<line");
  });
});
