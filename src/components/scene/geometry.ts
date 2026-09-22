import type { Bounds, Point } from "@/contracts";

export type CameraMode = "full" | "risk" | "locked" | "follow";
export type CameraRequest = {
  readonly mode: CameraMode;
  readonly selection: string;
  readonly reset: number;
};
export type { Bounds } from "@/contracts";

type RouteIdentity = {
  readonly runId: string;
  readonly mapId: string;
  readonly mapVersion: string;
  readonly expiresAt: string;
};
type RouteContext = {
  readonly runId: string;
  readonly mapId: string;
  readonly mapVersion: string;
  readonly nowMs: number;
};

export function fullSiteBounds(position: Readonly<Point>, reachM: number): Bounds {
  return {
    minX: Math.min(0, position.x - reachM),
    maxX: Math.max(140, position.x + reachM),
    minY: Math.min(0, position.y - reachM),
    maxY: Math.max(50, position.y + reachM),
  };
}

export function polygonPoints(points: readonly Readonly<Point>[]): string {
  return points.map((point) => `${point.x},${-point.y}`).join(" ");
}

export function frameRequestChanged(previous: CameraRequest | null, next: CameraRequest): boolean {
  return (
    next.mode === "follow" ||
    previous === null ||
    previous.mode !== next.mode ||
    previous.selection !== next.selection ||
    previous.reset !== next.reset
  );
}

export function routeIsCurrent(route: RouteIdentity, context: RouteContext): boolean {
  return (
    route.runId === context.runId &&
    route.mapId === context.mapId &&
    route.mapVersion === context.mapVersion &&
    Date.parse(route.expiresAt) > context.nowMs
  );
}
