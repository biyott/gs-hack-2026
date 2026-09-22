import { describe, expect, it } from "vitest";
import { defaultDemoAccounts } from "./config";

describe("demo account environment", () => {
  it("provides all agreed roles and device bindings in development", () => {
    // Given / When
    const accounts = defaultDemoAccounts({ NODE_ENV: "development" });
    // Then
    expect(accounts.map((account) => account.id)).toEqual([
      "admin",
      "admin-2",
      "operator",
      "support",
      "worker-a",
      "worker-b",
      "equipment",
      "cctv",
      "observer",
    ]);
    expect(accounts.every((account) => account.pin === "2026")).toBe(true);
    expect(accounts.find((account) => account.id === "admin-2")).toMatchObject({
      role: "admin",
      workerId: null,
    });
    expect(accounts.find((account) => account.id === "worker-a")).toMatchObject({
      workerId: "WORKER-A",
      deviceRole: "WORKER_1",
    });
    expect(accounts.find((account) => account.id === "equipment")).toMatchObject({
      role: "device",
      deviceRole: "EQUIPMENT",
      workerId: null,
    });
  });

  it("uses an explicit PIN when configured", () => {
    // Given / When
    const accounts = defaultDemoAccounts({ NODE_ENV: "production", GS_DEMO_PIN: "482931" });
    // Then
    expect(accounts.every((account) => account.pin === "482931")).toBe(true);
  });

  it.each([undefined, "", "12"])("fails closed in production for PIN %s", (pin) => {
    // Given / When / Then
    expect(() => defaultDemoAccounts({ NODE_ENV: "production", GS_DEMO_PIN: pin })).toThrowError(
      expect.objectContaining({ code: "INVALID_CONFIGURATION" }),
    );
  });
});
