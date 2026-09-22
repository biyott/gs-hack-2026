import { useId } from "react";
import type { Bounds } from "@/contracts";
import { polygonPoints } from "./geometry";
import { SceneAnnotations, sceneAnnotations } from "./SceneAnnotations";
import { activeHazards, positionSourceLabel, visibleRoutes, workerLabel } from "./scene-data";
import type { SceneFrame, SceneSelection } from "./scene-types";
import { useSvgSize } from "./use-svg-size";

function Area({ bounds, className }: { readonly bounds: Bounds; readonly className: string }) {
  return (
    <rect
      className={className}
      x={bounds.minX}
      y={-bounds.maxY}
      width={bounds.maxX - bounds.minX}
      height={bounds.maxY - bounds.minY}
    />
  );
}

export function SiteMap({
  snapshot,
  map,
  bounds,
  reachM,
  selectedWorkerId,
  onSelectWorker,
  zoom,
  nowMs,
}: SceneSelection & SceneFrame) {
  const hatchId = useId();
  const { ref, size } = useSvgSize();
  const width = (bounds.maxX - bounds.minX + 16) / zoom;
  const height = (bounds.maxY - bounds.minY + 16) / zoom;
  const left = (bounds.minX + bounds.maxX - width) / 2;
  const top = -(bounds.minY + bounds.maxY + height) / 2;
  const nodes = new Map(map.nodes.map((node) => [node.id, node]));
  const equipment = snapshot.equipment;
  const scale = Math.min(size.width / width, size.height / height);
  const annotations = sceneAnnotations(snapshot, map, selectedWorkerId);
  const anchors = annotations.map((annotation) => ({
    id: annotation.id,
    priority: annotation.priority,
    x: (annotation.position.x - left) * scale,
    y: (-annotation.position.y - top) * scale,
  }));
  return (
    <svg
      ref={ref}
      className="site-map"
      viewBox={`${left} ${top} ${width} ${height}`}
      aria-label="현재 위험 영역, 작업자 위치, 검증된 대피 경로를 표시한 현장 지도"
      data-testid="site-map"
    >
      <title>{`합성 현장 지도 · ${map.mapId}`}</title>
      <defs>
        <pattern id={hatchId} patternUnits="userSpaceOnUse" width="3" height="3">
          <path className="map-hazard-hatch" d="M-1 1L1-1M0 3L3 0M2 4L4 2" />
        </pattern>
      </defs>
      <rect className="map-outside" x={left} y={top} width={width} height={height} />
      <Area bounds={map.bounds} className="map-ground" />
      <Area bounds={map.metadata.workArea} className="map-work-area" />
      {map.edges.map((edge) => {
        const from = nodes.get(edge.from);
        const to = nodes.get(edge.to);
        if (!from || !to || edge.initialEgress) return null;
        const closed = snapshot.closedEdgeIds.includes(edge.id);
        return (
          <line
            key={edge.id}
            className={closed ? "map-corridor map-corridor-closed" : "map-corridor"}
            x1={from.x}
            y1={-from.y}
            x2={to.x}
            y2={-to.y}
            strokeWidth={edge.widthM}
          >
            <title>{`${edge.pathId} · ${closed ? "통행 제한" : "통로"}`}</title>
          </line>
        );
      })}
      <Area bounds={map.metadata.storageArea} className="map-storage" />
      <Area bounds={map.metadata.liftDestination} className="map-destination" />
      {map.obstacles.map((obstacle) => (
        <Area key={obstacle.id} bounds={obstacle.bounds} className="map-obstacle" />
      ))}
      <text className="map-label" x="65" y="-22">
        자재
      </text>
      <text className="map-label" x="87.5" y="-22">
        인양 목적지
      </text>
      <text className="map-label" x="112.5" y="-22">
        설비 6m
      </text>
      {map.nodes
        .filter((node) => node.kind === "refuge")
        .map((node) => (
          <g key={node.id}>
            <rect className="map-refuge" x={node.x - 2} y={-node.y - 2} width="4" height="4" />
          </g>
        ))}
      {equipment.positionStatus !== "unknown" && reachM > 0 ? (
        <circle
          className="map-reach-reference"
          cx={equipment.position.x}
          cy={-equipment.position.y}
          r={reachM}
          data-state={equipment.positionStatus}
          data-input-source={equipment.positionInputSource}
        >
          <title>
            {`장비 도달범위 참고 · 위험 영역이 아님${equipment.positionStatus === "stale" ? " · 마지막 위치 · 오래됨" : ""}`}
          </title>
        </circle>
      ) : null}
      {activeHazards(snapshot).map((hazard) => (
        <g
          key={hazard.hazardId}
          className={`map-hazard map-hazard-${hazard.priority}`}
          data-hazard-id={hazard.hazardId}
        >
          <title>{`${hazard.reason} · ${hazard.sensorStatus}`}</title>
          <polygon className="map-hazard-fill" points={polygonPoints(hazard.polygon)} />
          <polygon
            className="map-hazard-outline"
            points={polygonPoints(hazard.polygon)}
            fill={`url(#${hatchId})`}
          />
        </g>
      ))}
      {visibleRoutes(snapshot, nowMs).map((guidance) => (
        <polyline
          key={guidance.guidanceId}
          className={`map-route ${guidance.workerId === selectedWorkerId ? "map-route-selected" : ""}`}
          points={polygonPoints(guidance.waypoints)}
          data-route-version={guidance.routeVersion}
        >
          <title>{`${guidance.workerId} · 경로 v${guidance.routeVersion}`}</title>
        </polyline>
      ))}
      {equipment.positionStatus !== "unknown" ? (
        <g
          data-state={equipment.positionStatus}
          transform={`translate(${equipment.position.x} ${-equipment.position.y})`}
        >
          <g transform={`rotate(${-equipment.headingDeg - equipment.slewDeg})`}>
            <rect className="map-equipment" x="-4" y="-2" width="8" height="4" />
            <path className="map-equipment-heading" d="M0 0H10M7-2L10 0L7 2" />
          </g>
          <title>
            {`장비 · ${positionSourceLabel(equipment)}${equipment.positionStatus === "stale" ? " · 마지막 위치 · 오래됨" : ""}`}
          </title>
        </g>
      ) : null}
      {snapshot.workers.map((worker) =>
        worker.position === null || worker.positionStatus === "unknown" ? null : (
          // biome-ignore lint/a11y/useSemanticElements: SVG groups retain map-coordinate transforms and token styling; a native button needs a foreignObject and different geometry.
          <g
            key={worker.workerId}
            className={`map-worker ${worker.workerId === selectedWorkerId ? "map-worker-selected" : ""}`}
            data-stale={worker.positionStatus !== "known"}
            data-input-source={worker.positionInputSource}
            transform={`translate(${worker.position.x} ${-worker.position.y})`}
            role="button"
            tabIndex={0}
            aria-label={workerLabel(worker)}
            aria-pressed={worker.workerId === selectedWorkerId}
            onClick={() => onSelectWorker(worker.workerId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectWorker(worker.workerId);
              }
            }}
          >
            <title>{workerLabel(worker)}</title>
            <circle className="map-worker-hit" r="6" />
            <circle className="map-worker-halo" r="3.5" />
            <circle className="map-worker-point" r="1.5" />
          </g>
        ),
      )}
      <Area bounds={map.bounds} className="map-table-boundary" />
      <path className="map-scale" d={`M${left + 8} ${top + height - 8}h10m-10-1v2m10-2v2`} />
      {scale > 0 ? (
        <g transform={`translate(${left} ${top}) scale(${1 / scale})`}>
          <SceneAnnotations
            annotations={annotations}
            anchors={anchors}
            width={width * scale}
            height={height * scale}
            onSelectWorker={onSelectWorker}
          />
          <text
            data-testid="map-scale-label"
            x={Math.max(20, 13 * scale)}
            y={(height - 9) * scale - 8}
            fill="var(--map-text)"
            fontSize="var(--type-label)"
            textAnchor="middle"
            pointerEvents="none"
          >
            10 m
          </text>
        </g>
      ) : null}
    </svg>
  );
}
