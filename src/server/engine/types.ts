import type {
  ActionCode,
  HazardType,
  Point,
  Priority,
  WorkerProfile,
} from "../../../packages/contracts/src/core";
import type { Waypoint } from "../../../packages/contracts/src/guidance";
import type { SiteMap } from "../../../packages/contracts/src/map";
import type { Hazard, WorkerState } from "../../../packages/contracts/src/state";
import type { ResponsePolicy } from "../scenarios/policy";

export type RoutingGraph = Pick<SiteMap, "nodes" | "edges" | "obstacles" | "floorId">;
export type RouteFailure =
  | "profile-unverified"
  | "position-unknown"
  | "no-safe-attachment"
  | "no-valid-destination"
  | "no-path";
export type ValidRoute = {
  readonly kind: "valid";
  readonly waypoints: readonly Waypoint[];
  readonly edgeIds: readonly string[];
  readonly destinationId: string;
  readonly distanceM: number;
  readonly estimatedSeconds: number | null;
  readonly assistanceRequired: boolean;
};
export type RouteResult =
  | ValidRoute
  | {
      readonly kind: "unavailable";
      readonly reason: RouteFailure;
      readonly assistanceRequired: true;
    };
export type RouteInput = {
  readonly map: RoutingGraph;
  readonly position: Point | null;
  readonly profile: WorkerProfile | null;
  readonly hazards: readonly Hazard[];
  readonly closedEdgeIds: readonly string[];
  readonly destinationIds: readonly string[];
};
export type Exposure = {
  readonly current: boolean;
  readonly plannedRoute: boolean;
};
export type EngineDecision = {
  readonly actionCode: ActionCode;
  readonly hazardIds: readonly string[];
  readonly hazardType: HazardType;
  readonly priority: Priority;
  readonly route: ValidRoute | null;
  readonly destinationId: string | null;
  readonly assistanceRequired: boolean;
  readonly reasonCode: string;
  readonly exposure: Exposure;
};
export type WorkerPlanInput = {
  readonly map: RoutingGraph;
  readonly worker: WorkerState;
  readonly hazards: readonly Hazard[];
  readonly closedEdgeIds: readonly string[];
  readonly policy: ResponsePolicy;
  readonly now: string;
  readonly plannedRoute?: readonly Point[];
};
