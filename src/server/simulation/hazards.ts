import type { Hazard, SimulationSnapshot, SiteMap } from "@/contracts";
import { deriveEquipmentHazards, type EquipmentRiskModel } from "../engine";
import type { ResponsePolicy } from "../scenarios";
import type { SimulationWorld } from "./world";

export type HazardContext = Readonly<{
  world: SimulationWorld;
  map: SiteMap;
  policy: ResponsePolicy;
  model: EquipmentRiskModel;
  now: string;
  equipmentCleared: boolean;
}>;

export function projectHazards(snapshot: SimulationSnapshot, context: HazardContext): Hazard[] {
  if (snapshot.mode === "equipment") {
    if (context.equipmentCleared)
      return snapshot.hazards.map((hazard) => ({ ...hazard, active: false }));
    if (snapshot.equipment.positionStatus !== "known")
      return [
        {
          hazardId: "EQUIPMENT-A:position-unknown",
          hazardType: "position-unknown",
          priority: "critical",
          polygon: [],
          active: true,
          floorId: context.map.floorId,
          source: "engine",
          observedAt: context.now,
          sensorStatus: "not-applicable",
          affectedWorkerIds: snapshot.workers.map((worker) => worker.workerId),
          reason: "Equipment position is unavailable",
          zoneId: null,
          substanceId: null,
        },
      ];
    return [
      ...deriveEquipmentHazards({
        equipment: snapshot.equipment,
        model: context.model,
        predictionSeconds: context.policy.equipmentPredictionSeconds,
        observedAt: context.now,
        floorId: context.map.floorId,
      }),
    ];
  }
  return context.world.state.hazards.map((hazard): Hazard => {
    const sensor = context.world.state.sensors.find(
      (candidate) => candidate.hazardType === hazard.type && candidate.zoneId === hazard.zoneId,
    );
    const ageMs = sensor
      ? snapshot.run.virtualTimeMs - sensor.observedAtMs
      : Number.POSITIVE_INFINITY;
    const sensorStatus =
      sensor?.connected !== true
        ? "disconnected"
        : ageMs > context.policy.sensorStaleAfterMs
          ? "stale"
          : "current";
    return {
      hazardId: hazard.id,
      hazardType: hazard.type,
      priority: hazard.type === "fire" ? "critical" : "high",
      polygon: [...hazard.polygon],
      active: hazard.active,
      floorId: context.map.floorId,
      source: "mock",
      observedAt: Number.isFinite(ageMs)
        ? new Date(Date.parse(context.now) - Math.max(0, ageMs)).toISOString()
        : context.now,
      sensorStatus,
      affectedWorkerIds: [],
      reason: "Scripted synthetic scenario hazard",
      zoneId: hazard.zoneId,
      substanceId: hazard.type === "gas" ? "DEMO-GAS-X" : null,
    };
  });
}

export function closedEdges(world: SimulationWorld, map: SiteMap): string[] {
  return map.edges
    .filter(
      (edge) =>
        world.state.blockedPathIds.includes(edge.pathId) ||
        world.state.blockedPathIds.includes(edge.id),
    )
    .map((edge) => edge.id);
}
