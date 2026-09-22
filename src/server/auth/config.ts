import { AuthenticationError, type DemoAccount } from "./types";

export function defaultDemoAccounts(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): readonly DemoAccount[] {
  const { GS_DEMO_PIN: configuredPin, NODE_ENV: nodeEnvironment } = environment;
  const pin = configuredPin ?? (nodeEnvironment === "production" ? undefined : "2026");
  if (pin === undefined || pin.length < 4 || pin.length > 128) {
    throw new AuthenticationError(
      "INVALID_CONFIGURATION",
      "Set GS_DEMO_PIN to a value between 4 and 128 characters",
    );
  }
  return [
    { id: "admin", role: "admin", workerId: null, pin },
    { id: "admin-2", role: "admin", workerId: null, pin },
    { id: "operator", role: "operator", workerId: null, pin },
    { id: "support", role: "support", workerId: null, pin },
    { id: "worker-a", role: "worker", workerId: "WORKER-A", deviceRole: "WORKER_1", pin },
    { id: "worker-b", role: "worker", workerId: "WORKER-B", deviceRole: "WORKER_2", pin },
    { id: "equipment", role: "device", workerId: null, deviceRole: "EQUIPMENT", pin },
    { id: "cctv", role: "device", workerId: null, deviceRole: "CCTV", pin },
    { id: "observer", role: "observer", workerId: null, pin },
  ];
}
