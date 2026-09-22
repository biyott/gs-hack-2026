import { describe, expect, it } from "vitest";
import { UwbParticipantConfigSchema } from "@/contracts";
import { GET as tracking } from "../../../../app/api/tracking/route";
import { GET as config } from "../../../../app/api/uwb/config/route";
import { POST as prepare, DELETE as unregister } from "../../../../app/api/uwb/prepare/route";
import { getTrackingServices } from "../tracking";
import { preparePairing, registration, request } from "./fixtures";

describe("participant-bound UWB HTTP routes", () => {
  it.each([null, "admin", "operator", "observer", "cctv", "support"])(
    "denies pairing credentials to %s",
    async (actor) => {
      // Given an account that is not an authenticated UWB participant.
      const incoming = request(actor, "/api/uwb/config?role=EQUIPMENT");
      // When attempting to retrieve native credentials.
      const response = config(incoming);
      // Then no caller-selected role grants access.
      expect(response.status).toBe(actor === null ? 401 : 403);
    },
  );

  it("rejects a worker registering the equipment role", async () => {
    // Given a worker credential with an equipment-shaped body.
    const incoming = request("worker-a", "/api/uwb/prepare", registration("EQUIPMENT"));
    // When attempting to register a different participant role.
    const response = await prepare(incoming);
    // Then the registration is forbidden.
    expect(response.status).toBe(403);
    expect(getTrackingServices().pairing.prepare()).toEqual({
      status: "waiting",
      missingRoles: ["EQUIPMENT", "WORKER_1", "WORKER_2"],
    });
  });

  it("derives peer topology from the credential despite a forged role query", async () => {
    // Given all three authenticated participants have registered.
    await prepare(request("equipment", "/api/uwb/prepare", registration("EQUIPMENT")));
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    await prepare(request("worker-b", "/api/uwb/prepare", registration("WORKER_2")));
    // When a worker asks for the equipment configuration via the query string.
    const response = config(request("worker-a", "/api/uwb/config?role=EQUIPMENT"));
    const body = UwbParticipantConfigSchema.parse(await response.json());
    // Then only the worker's native peer topology is issued.
    expect(body.config.peerAddresses).toEqual(["AA:00"]);
    expect(body.peerWorkers).toEqual({});
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("keeps credentials outside general tracking snapshots", async () => {
    // Given a ready pairing session containing native key material.
    const services = getTrackingServices();
    services.pairing.register(registration("EQUIPMENT"));
    services.pairing.register(registration("WORKER_1"));
    services.pairing.register(registration("WORKER_2"));
    const participant = UwbParticipantConfigSchema.parse(services.pairing.getConfig("EQUIPMENT"));
    // When any authenticated reader retrieves ordinary tracking state.
    const response = tracking(request("observer", "/api/tracking"));
    // Then native credentials are absent from the response.
    expect(await response.text()).not.toContain(participant.config.sessionKeyHex);
  });

  it("revokes a ready epoch when an authenticated participant unregisters", async () => {
    // Given an active pairing epoch.
    preparePairing();
    // When a bound worker leaves.
    const response = unregister(
      new Request(request("worker-a", "/api/uwb/prepare?generation=1"), { method: "DELETE" }),
    );
    // Then all participants must prepare fresh native scopes.
    expect(await response.json()).toEqual({
      status: "waiting",
      missingRoles: ["EQUIPMENT", "WORKER_1", "WORKER_2"],
    });
  });
});
