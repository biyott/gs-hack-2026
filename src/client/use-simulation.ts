"use client";

import { useEffect } from "react";
import type { IncidentAction, SimulationCommand } from "@/contracts";
import { ApiFailure, api, errorMessage } from "./api";
import { AUTH_CHANNEL } from "./auth-sync";
import { createRequestId } from "./request-id";
import { openSimulationStream } from "./simulation-stream";
import { useConsoleStore } from "./store";

type CommandInput = SimulationCommand extends infer Command
  ? Command extends SimulationCommand
    ? Omit<Command, "mode" | "expectedVersion" | "requestId">
    : never
  : never;
type IncidentInput = Pick<IncidentAction, "incidentId" | "action"> &
  Partial<Pick<IncidentAction, "assigneeId" | "note">>;

export function useSession() {
  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = () => {
      generation += 1;
      const request = generation;
      void api
        .session()
        .then((session) => {
          if (active && request === generation) useConsoleStore.getState().setSession(session);
        })
        .catch((error: unknown) => {
          if (!active || request !== generation) return;
          if (!(error instanceof ApiFailure && error.status === 401))
            useConsoleStore.getState().setError(errorMessage(error));
          useConsoleStore.getState().setSession(null);
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(AUTH_CHANNEL) : null;
    if (channel) channel.onmessage = refresh;
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      channel?.close();
    };
  }, []);
}

export function useSimulation() {
  const mode = useConsoleStore((state) => state.mode);
  const sessionId = useConsoleStore((state) => state.session?.sessionId);
  useEffect(() => {
    if (!sessionId) return;
    return openSimulationStream(mode);
  }, [mode, sessionId]);
}

async function mutate(operation: () => ReturnType<typeof api.command>) {
  const state = useConsoleStore.getState();
  state.setBusy(true);
  state.setError(null);
  try {
    const snapshot = await operation();
    if (useConsoleStore.getState().session?.sessionId === state.session?.sessionId)
      state.acceptSnapshot(snapshot);
  } catch (error) {
    state.setError(errorMessage(error));
    if (error instanceof ApiFailure && error.status === 409) {
      try {
        state.acceptSnapshot(await api.snapshot(state.mode));
      } catch (refreshError) {
        if (refreshError instanceof Error) state.setError(refreshError.message);
        else throw refreshError;
      }
    }
  } finally {
    state.setBusy(false);
  }
}

export function sendCommand(input: CommandInput) {
  const state = useConsoleStore.getState();
  if (!state.snapshot) return;
  const body = {
    ...input,
    mode: state.mode,
    expectedVersion: state.snapshot.run.version,
    requestId: createRequestId(),
  };
  return mutate(() => api.command(body));
}

export function sendIncidentAction(input: IncidentInput) {
  const state = useConsoleStore.getState();
  const incident = state.snapshot?.incidents.find((item) => item.incidentId === input.incidentId);
  if (!state.snapshot || !incident) return;
  const body = {
    ...input,
    mode: state.mode,
    expectedVersion: state.snapshot.run.version,
    expectedIncidentVersion: incident.version,
    requestId: createRequestId(),
  };
  return mutate(() => api.incident(body));
}
