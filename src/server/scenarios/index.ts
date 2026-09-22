export * from "./entities";
export * from "./events";
export * from "./loader";
export * from "./policy";
export * from "./schema";
export * from "./timeline";

import type { Scenario } from "./schema";
import { batchesBetween } from "./timeline";

export function eventsBetween(scenario: Scenario, afterMs: number, throughMs: number) {
  return batchesBetween(scenario.events, afterMs, throughMs);
}
