import { Line } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { DoubleSide } from "three";
import { type Hazard, toThree } from "@/contracts";
import { createHazardGeometry } from "./hazard-geometry";
import { SceneAnnotations3D } from "./SceneAnnotations3D";
import { activeHazards, visibleRoutes } from "./scene-data";
import type { ScenePalette, SceneSelection } from "./scene-types";

function HazardLayer({
  hazard,
  palette,
}: {
  readonly hazard: Hazard;
  readonly palette: ScenePalette;
}) {
  const geometry = useMemo(() => createHazardGeometry(hazard.polygon), [hazard.polygon]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  const tone = {
    critical: palette.danger,
    high: palette.danger,
    medium: palette.caution,
    low: palette.caution,
  } as const;
  const first = hazard.polygon[0];
  if (!geometry || !first) return null;
  const border = [...hazard.polygon, first].map(
    (point) => [...toThree(point, 0.28)] satisfies [number, number, number],
  );
  return (
    <group name={`hazard-${hazard.hazardId}`}>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <meshBasicMaterial
          color={tone[hazard.priority]}
          transparent
          opacity={0.2}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Line
        points={border}
        color={tone[hazard.priority]}
        lineWidth={2.5}
        dashed
        dashSize={1.5}
        gapSize={0.7}
      />
    </group>
  );
}

export function SceneOverlays({
  snapshot,
  map,
  selectedWorkerId,
  onSelectWorker,
  palette,
  nowMs,
  reachM,
}: SceneSelection & {
  readonly palette: ScenePalette;
  readonly nowMs: number;
  readonly reachM: number;
}) {
  const reach = Array.from({ length: 73 }, (_, index) => {
    const angle = (index * Math.PI) / 36;
    return [
      snapshot.equipment.position.x + Math.cos(angle) * reachM,
      0.15,
      -snapshot.equipment.position.y - Math.sin(angle) * reachM,
    ] satisfies [number, number, number];
  });
  return (
    <group name="server-analytical-overlays">
      {reachM > 0 && snapshot.equipment.positionStatus !== "unknown" ? (
        <Line
          points={reach}
          color={palette.structure}
          lineWidth={1}
          dashed
          dashSize={3}
          gapSize={3}
        />
      ) : null}
      <Line
        points={[
          [0, 0.3, 0],
          [140, 0.3, 0],
          [140, 0.3, -50],
          [0, 0.3, -50],
          [0, 0.3, 0],
        ]}
        color={palette.text}
        lineWidth={1.5}
        dashed
        dashSize={2}
        gapSize={1}
      />
      {activeHazards(snapshot).map((hazard) => (
        <HazardLayer key={hazard.hazardId} hazard={hazard} palette={palette} />
      ))}
      {visibleRoutes(snapshot, nowMs).map((guidance) => (
        <Line
          key={guidance.guidanceId}
          points={guidance.waypoints.map(
            (point) => [...toThree(point, 0.5)] satisfies [number, number, number],
          )}
          color={palette.route}
          lineWidth={guidance.workerId === selectedWorkerId ? 5 : 3}
        />
      ))}
      {map.nodes
        .filter((node) => node.kind === "refuge")
        .map((node) => (
          <group key={node.id} position={toThree(node, 0.4)}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.3, 1.7, 4]} />
              <meshBasicMaterial color={palette.text} side={DoubleSide} />
            </mesh>
          </group>
        ))}
      {snapshot.workers.map((worker) =>
        worker.position === null || worker.positionStatus === "unknown" ? null : (
          <group
            key={worker.workerId}
            position={toThree(worker.position)}
            name={`worker-${worker.workerId}`}
          >
            <mesh position={[0, 0.85, 0]}>
              <capsuleGeometry args={[0.35, 1, 4, 8]} />
              <meshStandardMaterial
                color={worker.positionStatus === "stale" ? palette.caution : palette.accent}
              />
            </mesh>
          </group>
        ),
      )}
      <SceneAnnotations3D
        snapshot={snapshot}
        map={map}
        selectedWorkerId={selectedWorkerId}
        onSelectWorker={onSelectWorker}
      />
    </group>
  );
}
