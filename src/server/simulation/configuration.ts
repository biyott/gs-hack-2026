import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type Catalog,
  EquipmentCatalogSchema,
  type EquipmentPreset,
  MapSchema,
  type SiteMap,
} from "@/contracts";
import type { EquipmentRiskModel } from "../engine";
import { ApiFault } from "../http/errors";
import { loadPolicies, loadScenarios, type ResponsePolicy, type Scenario } from "../scenarios";

export type SimulationConfiguration = Readonly<{
  map: SiteMap;
  equipment: readonly EquipmentPreset[];
  scenarios: readonly Scenario[];
  policies: readonly ResponsePolicy[];
}>;

export function equipmentRiskModel(
  configuration: SimulationConfiguration,
  presetId: string,
): EquipmentRiskModel {
  const preset = configuration.equipment.find((candidate) => candidate.id === presetId);
  if (!preset?.riskGeometry)
    throw new ApiFault(409, "GEOMETRY_UNAVAILABLE", "Selected model has no declared risk geometry");
  return preset.riskGeometry;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadConfiguration(dataRoot = join(process.cwd(), "data")): SimulationConfiguration {
  return {
    map: MapSchema.parse(readJson(join(dataRoot, "maps", "site-construction-01.json"))),
    equipment: EquipmentCatalogSchema.parse(readJson(join(dataRoot, "equipment", "catalog.json")))
      .equipment,
    scenarios: loadScenarios(dataRoot),
    policies: loadPolicies(dataRoot),
  };
}

export function configurationCatalog(configuration: SimulationConfiguration): Catalog {
  return {
    contractVersion: "1.0.0",
    maps: [configuration.map],
    equipment: [...configuration.equipment],
    scenarios: configuration.scenarios.map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
      mode: scenario.mode,
      durationMs: scenario.durationMs,
      seed: scenario.seed,
      mapId: scenario.mapId,
      mapVersion: scenario.mapVersion,
      coverage: [...scenario.coverage],
    })),
    policies: configuration.policies.map(({ id, version, mode }) => ({ id, version, mode })),
  };
}
