import type { InputSource, Point, SimulationSnapshot, SiteMap } from "@/contracts";
import { type AnnotationAnchor, placeAnnotations } from "./annotation-layout";
import { positionSourceLabel, workerLabel } from "./scene-data";

export type SceneAnnotation = {
  readonly id: string;
  readonly position: Readonly<Point>;
  readonly label: string;
  readonly description: string;
  readonly priority: number;
  readonly workerId: string | null;
  readonly stale: boolean;
  readonly inputSource: InputSource;
};

export function sceneAnnotations(
  snapshot: SimulationSnapshot,
  map: SiteMap,
  selectedWorkerId: string | null,
): readonly SceneAnnotation[] {
  const origin = { live: "실제", synthetic: "합성", unknown: "미확인" } as const;
  const equipment = snapshot.equipment;
  return [
    ...(equipment.positionStatus === "unknown"
      ? []
      : [
          {
            id: equipment.id,
            position: equipment.position,
            label: `장비 · ${origin[equipment.positionInputSource]}`,
            description: `장비 · ${positionSourceLabel(equipment)}${equipment.positionStatus === "stale" ? " · 마지막 위치 · 오래됨" : ""}`,
            priority: 1,
            workerId: null,
            stale: equipment.positionStatus === "stale",
            inputSource: equipment.positionInputSource,
          },
        ]),
    ...snapshot.workers.flatMap((worker) =>
      worker.position === null || worker.positionStatus === "unknown"
        ? []
        : [
            {
              id: worker.workerId,
              position: worker.position,
              label: `${worker.workerId.replace("WORKER-", "")} · ${origin[worker.positionInputSource]}`,
              description: workerLabel(worker),
              priority: worker.workerId === selectedWorkerId ? 0 : 2,
              workerId: worker.workerId,
              stale: worker.positionStatus === "stale",
              inputSource: worker.positionInputSource,
            },
          ],
    ),
    ...map.nodes
      .filter((node) => node.kind === "refuge")
      .map((node, index) => ({
        id: node.id,
        position: node,
        label: `대피 후보 ${index + 1}`,
        description: `${node.id} · 대피 후보지 · 현재 경로 검증 필요`,
        priority: 3,
        workerId: null,
        stale: false,
        inputSource: "unknown" as const,
      })),
  ];
}

export function SceneAnnotations({
  annotations,
  anchors,
  width,
  height,
  onSelectWorker,
}: {
  readonly annotations: readonly SceneAnnotation[];
  readonly anchors: readonly AnnotationAnchor[];
  readonly width: number;
  readonly height: number;
  readonly onSelectWorker: (id: string) => void;
}) {
  const placed = placeAnnotations(anchors, { width, height });
  return (
    <g className="scene-annotations" pointerEvents="none">
      {placed.map((label) => {
        const annotation = annotations.find((entry) => entry.id === label.id);
        if (!annotation) return null;
        return (
          <g key={label.id} data-annotation-id={label.id}>
            <line
              x1={label.x}
              y1={label.y}
              x2={label.left + label.width / 2}
              y2={label.top + label.height / 2}
              stroke="var(--map-text)"
              strokeWidth="1"
            />
            <circle cx={label.x} cy={label.y} r="2.5" fill="var(--map-text)" />
            <foreignObject
              x={label.left}
              y={label.top}
              width={label.width}
              height={label.height}
              pointerEvents="auto"
            >
              {annotation.workerId ? (
                <button
                  type="button"
                  className="worker-marker"
                  data-stale={annotation.stale}
                  data-input-source={annotation.inputSource}
                  aria-label={annotation.description}
                  aria-pressed={annotation.priority === 0}
                  title={annotation.description}
                  onClick={() => onSelectWorker(annotation.workerId ?? annotation.id)}
                >
                  {annotation.label}
                </button>
              ) : (
                <div
                  className="worker-marker"
                  data-stale={annotation.stale}
                  data-input-source={annotation.inputSource}
                  title={annotation.description}
                >
                  {annotation.label}
                </div>
              )}
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
}
