"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/client/api";
import { trackingApi } from "@/client/tracking-api";
import type { Calibration, TrackingSnapshot } from "@/contracts";

export type TrackingView = {
  readonly snapshot: TrackingSnapshot | null;
  readonly error: string | null;
  readonly connected: boolean;
  readonly now: number;
};

function emptyView(): TrackingView {
  return { snapshot: null, error: null, connected: false, now: Date.now() };
}

export function createTrackingSession(
  onChange: (state: TrackingView) => void,
  onSaved: () => void,
) {
  let state = emptyView();
  let controller: AbortController | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let requestGeneration = 0;
  const publish = (next: Partial<TrackingView>) => {
    state = { ...state, ...next };
    onChange(state);
  };
  const stop = () => {
    requestGeneration += 1;
    controller?.abort();
    controller = null;
    if (interval !== null) clearInterval(interval);
    interval = null;
  };
  const start = (enabled: boolean) => {
    stop();
    if (!enabled) {
      publish(emptyView());
      return stop;
    }
    const requestController = new AbortController();
    controller = requestController;
    let inFlight = false;
    const refresh = async () => {
      publish({ now: Date.now() });
      if (inFlight) return;
      inFlight = true;
      const generation = requestGeneration;
      try {
        const next = await trackingApi.snapshot(requestController.signal);
        if (!requestController.signal.aborted && generation === requestGeneration) {
          publish({ snapshot: next, error: null, connected: true });
        }
      } catch (failure) {
        if (requestController.signal.aborted || generation !== requestGeneration) return;
        if (failure instanceof Error) publish({ error: errorMessage(failure), connected: false });
        else throw failure;
      } finally {
        inFlight = false;
      }
    };
    void refresh();
    interval = setInterval(() => {
      void refresh();
    }, 200);
    return stop;
  };
  const saveCalibration = async (calibration: Calibration) => {
    const requestController = controller;
    if (!requestController || requestController.signal.aborted) return;
    const generation = ++requestGeneration;
    const next = await trackingApi.calibrate(calibration);
    if (requestController.signal.aborted || generation !== requestGeneration) return;
    requestGeneration += 1;
    publish({ snapshot: next, error: null, connected: true, now: Date.now() });
    onSaved();
  };
  return { start, stop, saveCalibration };
}

export function useTracking(enabled: boolean) {
  const [view, setView] = useState(emptyView);
  const [revision, setRevision] = useState(0);
  const [session] = useState(() =>
    createTrackingSession(setView, () => setRevision((value) => value + 1)),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: Manual refresh restarts and cancels the polling session.
  useEffect(() => session.start(enabled), [session, enabled, revision]);
  return {
    ...(enabled ? view : emptyView()),
    refresh: () => {
      if (enabled) setRevision((value) => value + 1);
    },
    saveCalibration: async (calibration: Calibration) => {
      if (enabled) await session.saveCalibration(calibration);
    },
  };
}

export type TrackingState = ReturnType<typeof useTracking>;
