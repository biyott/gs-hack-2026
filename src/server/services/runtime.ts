import { loadConfiguration } from "../simulation/configuration";
import { SimulationRuntime } from "../simulation/runtime";
import { refreshTrackingAge } from "../simulation/tracking";
import { getDatabaseServices } from "./database";
import { attachRag, type RagReadiness } from "./rag";

export type RuntimeServices = Readonly<{ runtime: SimulationRuntime; rag: RagReadiness }>;

declare global {
  var gsSafetyRuntimeServices: RuntimeServices | undefined;
}

export function getRuntimeServices(): RuntimeServices {
  if (globalThis.gsSafetyRuntimeServices) return globalThis.gsSafetyRuntimeServices;
  const { database, runs } = getDatabaseServices();
  const runtime = new SimulationRuntime({
    database,
    repository: runs,
    configuration: loadConfiguration(),
  });
  const rag = attachRag(runtime);
  const services = { runtime, rag };
  globalThis.gsSafetyRuntimeServices = services;
  runtime.onTick = refreshTrackingAge;
  runtime.startScheduler();
  return services;
}
