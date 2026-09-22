import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { snapshot } from "@/server/incidents/test-fixtures";
import { api } from "./api";
import { useConsoleStore } from "./store";
import { sendCommand, sendIncidentAction } from "./use-simulation";

const initialState = useConsoleStore.getState();

describe("commands from an HTTP demo page", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) });
    useConsoleStore.setState({ ...initialState, snapshot });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    useConsoleStore.setState(initialState);
  });

  it("sends start and pause without the HTTPS-only randomUUID API", async () => {
    // Given an HTTP browser and the current server snapshot.
    const command = vi.spyOn(api, "command").mockResolvedValue(snapshot);
    // When the operator starts and pauses the scenario.
    await sendCommand({ action: "start" });
    await sendCommand({ action: "pause" });
    // Then both commands reach the API with separate request identifiers.
    expect(command).toHaveBeenCalledTimes(2);
    const requests = command.mock.calls.map(([request]) => request);
    expect(requests.map((request) => request.action)).toEqual(["start", "pause"]);
    expect(requests.every((request) => /^[0-9a-f]{32}$/.test(request.requestId))).toBe(true);
    expect(new Set(requests.map((request) => request.requestId)).size).toBe(2);
  });

  it("sends incident actions without the HTTPS-only randomUUID API", async () => {
    // Given the current incident and an HTTP browser.
    const incident = vi.spyOn(api, "incident").mockResolvedValue(snapshot);
    // When the operator acknowledges the incident.
    await sendIncidentAction({ incidentId: "INCIDENT-A", action: "acknowledge" });
    // Then the request reaches the API with its concurrency versions intact.
    expect(incident).toHaveBeenCalledWith(
      expect.objectContaining({
        incidentId: "INCIDENT-A",
        action: "acknowledge",
        expectedVersion: snapshot.run.version,
        expectedIncidentVersion: 1,
        requestId: expect.stringMatching(/^[0-9a-f]{32}$/),
      }),
    );
  });
});
