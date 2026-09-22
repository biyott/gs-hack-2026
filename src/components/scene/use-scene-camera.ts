import { useEffect, useMemo, useRef, useState } from "react";
import {
  type CameraEventMemory,
  type CameraNotice,
  cameraEventTransition,
  cameraScopeKey,
  prioritizeCameraNotice,
} from "./camera-policy";
import {
  type CameraMode,
  type CameraRequest,
  frameRequestChanged,
  fullSiteBounds,
} from "./geometry";
import { cameraBounds } from "./scene-data";
import type { SceneFrame, SceneSelection } from "./scene-types";

export function useSceneCamera(selection: SceneSelection, extentM: number, nowMs: number) {
  const { snapshot, map, selectedIncidentId, selectedWorkerId, onSelectIncident } = selection;
  const [mode, setMode] = useState<CameraMode>("full");
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [focusedIncidentId, setFocusedIncidentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<CameraNotice | null>(null);
  const scopeKey = cameraScopeKey(snapshot.streamId, snapshot.run.runId);
  const seen = useRef<CameraEventMemory>({ scope: scopeKey, keys: [] });
  const previous = useRef<CameraRequest | null>(null);
  const [framing, setFraming] = useState<Pick<SceneFrame, "bounds" | "request">>(() => ({
    bounds: fullSiteBounds(snapshot.equipment.position, extentM),
    request: { mode: "full", selection: scopeKey, reset: 0 },
  }));
  const selectedWorker = snapshot.workers.find((worker) => worker.workerId === selectedWorkerId);
  const keys = {
    full: snapshot.equipment.presetId,
    risk: focusedIncidentId ?? "",
    locked: selectedIncidentId ?? "",
    follow: selectedWorkerId ?? "",
  };
  const selectionKey = `${scopeKey}:${keys[mode]}`;
  const request = useMemo<CameraRequest>(
    () => ({ mode, selection: selectionKey, reset }),
    [mode, selectionKey, reset],
  );

  useEffect(() => {
    const transition = cameraEventTransition(seen.current, scopeKey, snapshot.incidents, mode);
    const runChanged = transition.scopeChanged;
    seen.current = transition.memory;
    if (runChanged) {
      setFocusedIncidentId(null);
      setNotice(null);
      setMode("full");
      setZoom(1);
    }
    const event = transition.event;
    if (!event) return;
    setNotice((current) =>
      prioritizeCameraNotice(
        !runChanged &&
          current &&
          snapshot.incidents.some(
            (incident) =>
              incident.incidentId === current.incidentId && incident.status === "active",
          )
          ? current
          : null,
        event,
      ),
    );
    if (!event.frame) return;
    setFocusedIncidentId(event.incidentId);
    setMode("risk");
    setZoom(1);
    setReset((value) => value + 1);
    onSelectIncident?.(event.incidentId);
  }, [scopeKey, snapshot.incidents, mode, onSelectIncident]);

  useEffect(() => {
    if (
      mode === "follow" &&
      (!selectedWorker?.position || selectedWorker.positionStatus !== "known")
    )
      return;
    if (!frameRequestChanged(previous.current, request)) return;
    setFraming({
      bounds: cameraBounds(
        {
          snapshot,
          map,
          selectedWorkerId,
          selectedIncidentId: mode === "risk" ? focusedIncidentId : selectedIncidentId,
        },
        mode,
        extentM,
        nowMs,
      ),
      request,
    });
    previous.current = request;
  }, [
    mode,
    selectedWorker,
    request,
    snapshot,
    map,
    selectedWorkerId,
    selectedIncidentId,
    focusedIncidentId,
    extentM,
    nowMs,
  ]);

  function focusNotice() {
    if (!notice) return;
    setFocusedIncidentId(notice.incidentId);
    setMode("risk");
    setZoom(1);
    setReset((value) => value + 1);
    onSelectIncident?.(notice.incidentId);
    setNotice(null);
  }

  const activeNotice =
    notice &&
    snapshot.incidents.some(
      (incident) => incident.incidentId === notice.incidentId && incident.status === "active",
    )
      ? notice
      : null;
  return {
    mode,
    setMode,
    zoom,
    setZoom,
    setReset,
    framing,
    notice: activeNotice,
    focusNotice,
    selectedWorker,
  };
}
