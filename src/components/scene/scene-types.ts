import type { Bounds, SimulationSnapshot, SiteMap } from "@/contracts";
import type { CameraRequest } from "./geometry";

export type SceneSelection = {
  readonly snapshot: SimulationSnapshot;
  readonly map: SiteMap;
  readonly selectedWorkerId: string | null;
  readonly selectedIncidentId: string | null;
  readonly onSelectWorker: (workerId: string) => void;
  readonly onSelectIncident?: (incidentId: string) => void;
};

export type SceneFrame = {
  readonly nowMs: number;
  readonly bounds: Bounds;
  readonly request: CameraRequest;
  readonly zoom: number;
  readonly reachM: number;
};

export type ScenePalette = {
  readonly ground: string;
  readonly road: string;
  readonly text: string;
  readonly route: string;
  readonly danger: string;
  readonly caution: string;
  readonly structure: string;
  readonly accent: string;
};
