"use client";

import { create } from "zustand";
import type { Session, SimulationMode, SimulationSnapshot } from "@/contracts";
import { type GuidanceWatermarks, quarantineGuidance } from "./guidance-order";
import { evaluateSnapshot } from "./snapshot-policy";

type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";
type ConsoleState = {
  readonly session: Session | null;
  readonly sessionReady: boolean;
  readonly mode: SimulationMode;
  readonly snapshot: SimulationSnapshot | null;
  readonly connection: ConnectionState;
  readonly lastReceivedAt: string | null;
  readonly error: string | null;
  readonly busy: boolean;
  readonly selectedIncidentId: string | null;
  readonly selectedWorkerId: string | null;
  readonly soundEnabled: boolean;
  readonly connectionEpoch: number;
  readonly streamBaselineReady: boolean;
  readonly guidanceWatermarks: GuidanceWatermarks;
  readonly beginConnection: () => number;
  readonly setSession: (session: Session | null) => void;
  readonly selectMode: (mode: SimulationMode) => void;
  readonly acceptSnapshot: (snapshot: SimulationSnapshot, connectionEpoch?: number) => void;
  readonly setConnection: (connection: ConnectionState) => void;
  readonly setError: (error: string | null) => void;
  readonly setBusy: (busy: boolean) => void;
  readonly selectIncident: (id: string | null) => void;
  readonly selectWorker: (id: string | null) => void;
  readonly toggleSound: () => void;
};

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  session: null,
  sessionReady: false,
  mode: "equipment",
  snapshot: null,
  connection: "connecting",
  lastReceivedAt: null,
  error: null,
  busy: false,
  selectedIncidentId: null,
  selectedWorkerId: "WORKER-A",
  soundEnabled: false,
  connectionEpoch: 0,
  streamBaselineReady: false,
  guidanceWatermarks: new Map(),
  setSession: (session) => {
    if (get().session?.sessionId !== session?.sessionId)
      set({
        session,
        sessionReady: true,
        snapshot: null,
        selectedIncidentId: null,
        connection: "connecting",
        streamBaselineReady: false,
        guidanceWatermarks: new Map(),
        connectionEpoch: get().connectionEpoch + 1,
      });
    else set({ session, sessionReady: true });
  },
  selectMode: (mode) => {
    if (get().mode !== mode)
      set({
        mode,
        snapshot: null,
        selectedIncidentId: null,
        connection: "connecting",
        error: null,
        streamBaselineReady: false,
        guidanceWatermarks: new Map(),
        connectionEpoch: get().connectionEpoch + 1,
      });
  },
  beginConnection: () => {
    const connectionEpoch = get().connectionEpoch + 1;
    set({ connectionEpoch, streamBaselineReady: false });
    return connectionEpoch;
  },
  acceptSnapshot: (snapshot, connectionEpoch) => {
    const state = get();
    const fromOwnedConnection =
      connectionEpoch !== undefined && connectionEpoch === state.connectionEpoch;
    if (connectionEpoch !== undefined && !fromOwnedConnection) return;
    const verdict = evaluateSnapshot(snapshot, {
      mode: state.mode,
      current: state.snapshot,
      streamBaselineReady: state.streamBaselineReady,
      canEstablishStream: fromOwnedConnection && !state.streamBaselineReady,
    });
    if (verdict === "map-mismatch") {
      set({ error: "지도 버전이 일치하지 않아 새 안내를 표시하지 않았습니다. 새로고침해 주세요." });
      return;
    }
    if (verdict !== "accept") return;
    const sameScope =
      state.snapshot?.streamId === snapshot.streamId &&
      state.snapshot.run.runId === snapshot.run.runId;
    const accepted = quarantineGuidance(snapshot, sameScope ? state.guidanceWatermarks : new Map());
    const selectedIncidentId = snapshot.incidents.some(
      (incident) => incident.incidentId === state.selectedIncidentId,
    )
      ? state.selectedIncidentId
      : (snapshot.incidents.find((incident) => incident.status === "active")?.incidentId ??
        snapshot.incidents.at(-1)?.incidentId ??
        null);
    set({
      snapshot: accepted.snapshot,
      guidanceWatermarks: accepted.watermarks,
      streamBaselineReady: true,
      selectedIncidentId,
      lastReceivedAt: new Date().toISOString(),
      connection: "connected",
    });
  },
  setConnection: (connection) => set({ connection }),
  setError: (error) => set({ error }),
  setBusy: (busy) => set({ busy }),
  selectIncident: (selectedIncidentId) => set({ selectedIncidentId }),
  selectWorker: (selectedWorkerId) => set({ selectedWorkerId }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
