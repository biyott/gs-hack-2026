import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SimulationMode } from "@gs-safety/contracts";
import { type ResponsePolicy, ResponsePolicySchema } from "./policy";
import { type Scenario, ScenarioSchema } from "./schema";

export class ScenarioDataError extends Error {
  override readonly name = "ScenarioDataError";
  constructor(
    readonly filePath: string,
    readonly reason: string,
  ) {
    super(`Scenario data at ${filePath}: ${reason}`);
  }
}

function readJson(filePath: string): unknown {
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) throw new ScenarioDataError(filePath, "Invalid JSON");
    throw error;
  }
}

export function loadPolicies(dataRoot = join(process.cwd(), "data")): readonly ResponsePolicy[] {
  const policyRoot = join(dataRoot, "policies");
  return readdirSync(policyRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const filePath = join(policyRoot, name);
      const parsed = ResponsePolicySchema.safeParse(readJson(filePath));
      if (!parsed.success) throw new ScenarioDataError(filePath, parsed.error.message);
      return parsed.data;
    });
}

export function loadScenarios(dataRoot = join(process.cwd(), "data")): readonly Scenario[] {
  const policies = loadPolicies(dataRoot);
  const scenarios = (["equipment", "fire-gas"] satisfies readonly SimulationMode[]).flatMap(
    (mode) => {
      const directory = join(dataRoot, "scenarios", mode);
      return readdirSync(directory)
        .filter((name) => name.endsWith(".json"))
        .sort()
        .map((name) => {
          const filePath = join(directory, name);
          const parsed = ScenarioSchema.safeParse(readJson(filePath));
          if (!parsed.success) throw new ScenarioDataError(filePath, parsed.error.message);
          if (parsed.data.mode !== mode)
            throw new ScenarioDataError(filePath, "Directory and mode differ");
          const policy = policies.find((candidate) => candidate.id === parsed.data.policyId);
          if (policy === undefined || policy.mode !== mode)
            throw new ScenarioDataError(filePath, "Policy missing or belongs to another mode");
          return parsed.data;
        });
    },
  );
  if (new Set(scenarios.map((scenario) => scenario.id)).size !== scenarios.length) {
    throw new ScenarioDataError(join(dataRoot, "scenarios"), "Scenario IDs must be unique");
  }
  return scenarios;
}

export function loadScenario(
  id: string,
  dataRoot = join(process.cwd(), "data"),
): Scenario | undefined {
  return loadScenarios(dataRoot).find((scenario) => scenario.id === id);
}
