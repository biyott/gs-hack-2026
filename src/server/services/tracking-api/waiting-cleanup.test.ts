import { describe, expect, it } from "vitest";
import { UwbParticipantConfigSchema } from "@/contracts";
import { GET as config } from "../../../../app/api/uwb/config/route";
import { POST as prepare, DELETE as unregister } from "../../../../app/api/uwb/prepare/route";
import { authenticatedSession } from "../../http/context";
import { getDatabaseServices } from "../database";
import { activateTrackingSession, invalidateTrackingSession } from "../tracking";
import { registration, request } from "./fixtures";

describe("UWB cleanup before a shared ranging session exists", () => {
  it.each(["native cleanup", "logout", "replacement login"] as const)(
    "preserves the other waiting participant when equipment leaves through %s",
    async (action) => {
      // Given equipment and worker 1 have prepared while worker 2 is still missing.
      await prepare(request("equipment", "/api/uwb/prepare", registration("EQUIPMENT")));
      await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
      const equipment = authenticatedSession(request("equipment", "/api/uwb/config"));

      // When only the equipment's native registration is removed or replaced.
      switch (action) {
        case "native cleanup":
          unregister(
            new Request(request("equipment", "/api/uwb/prepare?generation=1"), {
              method: "DELETE",
            }),
          );
          break;
        case "logout":
          invalidateTrackingSession(equipment);
          break;
        case "replacement login": {
          const issued = getDatabaseServices().auth.login({
            actorId: "equipment",
            role: "device",
            accessCode: "2026",
          });
          activateTrackingSession(issued.session);
          break;
        }
        default: {
          const exhaustive: never = action;
          return exhaustive;
        }
      }

      // Then the worker can keep polling without preparing its native scope again.
      const response = config(request("worker-a", "/api/uwb/config"));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        status: "waiting",
        missingRoles: ["EQUIPMENT", "WORKER_2"],
      });
    },
  );

  it("requires fresh preparation only from the participant that cleaned up while waiting", async () => {
    // Given two participants waiting for worker 2.
    await prepare(request("equipment", "/api/uwb/prepare", registration("EQUIPMENT")));
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));

    // When the equipment stops its native scope.
    unregister(
      new Request(request("equipment", "/api/uwb/prepare?generation=1"), { method: "DELETE" }),
    );

    // Then that equipment cannot retrieve configuration until preparing again.
    const response = config(request("equipment", "/api/uwb/config"));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "UWB_PREPARATION_REQUIRED" },
    });
  });

  it("keeps the other waiting participant when native cleanup is repeated", async () => {
    // Given equipment already cleaned up while worker 1 remains waiting.
    await prepare(request("equipment", "/api/uwb/prepare", registration("EQUIPMENT")));
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    unregister(
      new Request(request("equipment", "/api/uwb/prepare?generation=1"), { method: "DELETE" }),
    );

    // When the same native scope finishes cleanup again.
    unregister(
      new Request(request("equipment", "/api/uwb/prepare?generation=1"), { method: "DELETE" }),
    );

    // Then worker 1 remains prepared and can continue polling.
    const response = config(request("worker-a", "/api/uwb/config"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "waiting",
      missingRoles: ["EQUIPMENT", "WORKER_2"],
    });
  });

  it("retains valid peers after an unsupported participant cleans up", async () => {
    // Given worker 2 has a duplicate address and no shared credentials were issued.
    await prepare(request("equipment", "/api/uwb/prepare", registration("EQUIPMENT")));
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    await prepare(
      request("worker-b", "/api/uwb/prepare", {
        ...registration("WORKER_2"),
        localAddress: "AA:01",
      }),
    );

    // When only that unsupported native scope is removed.
    unregister(
      new Request(request("worker-b", "/api/uwb/prepare?generation=1"), { method: "DELETE" }),
    );

    // Then valid peers still have their pending native registrations.
    const response = config(request("worker-a", "/api/uwb/config"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "waiting", missingRoles: ["WORKER_2"] });
  });

  it("reaches ready after a stopped pending participant returns without restarting its peers", async () => {
    // Given equipment restarted while worker 1 retained its native scope.
    await prepare(request("equipment", "/api/uwb/prepare", registration("EQUIPMENT")));
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    unregister(
      new Request(request("equipment", "/api/uwb/prepare?generation=1"), { method: "DELETE" }),
    );
    await prepare(
      request("equipment", "/api/uwb/prepare", { ...registration("EQUIPMENT"), generation: 2 }),
    );

    // When the final participant prepares.
    await prepare(request("worker-b", "/api/uwb/prepare", registration("WORKER_2")));

    // Then the original worker can retrieve the ready ranging configuration.
    const response = config(request("worker-a", "/api/uwb/config"));
    expect(response.status).toBe(200);
    const result = UwbParticipantConfigSchema.parse(await response.json());
    expect(result.config.peerAddresses).toEqual(["AA:00"]);
  });
});
