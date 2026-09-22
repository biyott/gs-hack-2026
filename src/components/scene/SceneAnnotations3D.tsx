import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import { toThree } from "@/contracts";
import type { AnnotationAnchor } from "./annotation-layout";
import { SceneAnnotations, sceneAnnotations } from "./SceneAnnotations";
import type { SceneSelection } from "./scene-types";

export function SceneAnnotations3D({
  snapshot,
  map,
  selectedWorkerId,
  onSelectWorker,
}: Pick<SceneSelection, "snapshot" | "map" | "selectedWorkerId" | "onSelectWorker">) {
  const { camera, size } = useThree();
  const annotations = useMemo(
    () => sceneAnnotations(snapshot, map, selectedWorkerId),
    [snapshot, map, selectedWorkerId],
  );
  const [anchors, setAnchors] = useState<readonly AnnotationAnchor[]>([]);
  const projected = useRef<readonly AnnotationAnchor[]>([]);
  useFrame(() => {
    const next = annotations.flatMap((annotation) => {
      const point = new Vector3(...toThree(annotation.position, 1)).project(camera);
      if (point.z < -1 || point.z > 1) return [];
      return [
        {
          id: annotation.id,
          priority: annotation.priority,
          x: Math.round(((point.x + 1) * size.width) / 2),
          y: Math.round(((1 - point.y) * size.height) / 2),
        },
      ];
    });
    if (
      projected.current.length === next.length &&
      projected.current.every((point, index) => {
        const other = next[index];
        return (
          other &&
          point.id === other.id &&
          point.x === other.x &&
          point.y === other.y &&
          point.priority === other.priority
        );
      })
    )
      return;
    projected.current = next;
    setAnchors(next);
  });
  return (
    <Html
      fullscreen
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
      calculatePosition={() => [size.width / 2, size.height / 2]}
    >
      <svg width={size.width} height={size.height} pointerEvents="none" aria-label="현장 위치 주석">
        <SceneAnnotations
          annotations={annotations}
          anchors={anchors}
          width={size.width}
          height={size.height}
          onSelectWorker={onSelectWorker}
        />
      </svg>
    </Html>
  );
}
