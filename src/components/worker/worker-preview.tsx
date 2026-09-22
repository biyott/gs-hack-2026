"use client";

import {
  Construction,
  Flame,
  LogOut,
  Smartphone,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/client/api";
import { useConsoleStore } from "@/client/store";
import { useSession, useSimulation } from "@/client/use-simulation";
import { SiteMap } from "@/components/scene/SiteMap";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState, Panel, StatusBadge } from "@/components/ui/primitives";
import type { SiteMap as SiteMapContract } from "@/contracts";
import { useWorkerGuidance } from "./use-worker-guidance";
import { useAutomaticReceipts, useWorkerResponses } from "./use-worker-responses";
import { useWorkerSpeech } from "./use-worker-speech";
import { voiceLabel, workerCopy, workerTime } from "./worker-copy";
import { WorkerGuidancePanel } from "./worker-guidance-panel";
import { WorkerLogin } from "./worker-login";
import { WorkerResponsePanel } from "./worker-response-panel";

export function WorkerPreview({ map }: { readonly map: SiteMapContract }) {
  useSession();
  const session = useConsoleStore((state) => state.session);
  return session?.role === "worker" && session.workerId ? (
    <WorkerLive map={map} workerId={session.workerId} />
  ) : (
    <WorkerLogin />
  );
}

function WorkerLive({
  map,
  workerId,
}: {
  readonly map: SiteMapContract;
  readonly workerId: string;
}) {
  useSimulation();
  const mode = useConsoleStore((state) => state.mode);
  const snapshot = useConsoleStore((state) => state.snapshot);
  const connection = useConsoleStore((state) => state.connection);
  const streamBaselineReady = useConsoleStore((state) => state.streamBaselineReady);
  const receivedAt = useConsoleStore((state) => state.lastReceivedAt);
  const connectionError = useConsoleStore((state) => state.error);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const worker = snapshot?.workers.find((entry) => entry.workerId === workerId);
  const guidance = useWorkerGuidance(snapshot, worker, map);
  const locale = guidance?.locale ?? worker?.profile.locale ?? "ko";
  const copy = workerCopy(locale);
  const responses = useWorkerResponses(map);
  const receiptError = useAutomaticReceipts(guidance, responses.send);
  const speechEnabled =
    voiceEnabled &&
    snapshot?.run.status === "running" &&
    connection === "connected" &&
    streamBaselineReady;
  const speech = useWorkerSpeech({
    guidance,
    enabled: speechEnabled,
    onResponse: responses.send,
  });
  const mapMatches =
    snapshot?.run.mapId === map.mapId && snapshot.run.mapVersion === map.mapVersion;
  const workerSnapshot =
    snapshot && worker
      ? { ...snapshot, workers: [{ ...worker, currentGuidance: guidance }] }
      : null;
  const incident = snapshot?.incidents.find((entry) => entry.incidentId === guidance?.incidentId);
  const online = connection === "connected";
  const error = responses.error ?? speech.error ?? receiptError ?? actionError ?? connectionError;
  const positionText = {
    known: copy.positionKnown,
    stale: copy.positionStale,
    unknown: copy.positionUnknown,
  };

  async function logout() {
    try {
      await api.logout();
      const state = useConsoleStore.getState();
      state.setSession(null);
      state.selectMode(state.mode);
    } catch (failure) {
      if (failure instanceof Error) setActionError(failure.message);
      else throw failure;
    }
  }

  return (
    <div className="worker-preview" lang={locale}>
      <header className="worker-preview-header">
        <div className="cluster">
          <Smartphone size={24} />
          <div>
            <p className="eyebrow">{workerId}</p>
            <h1>{copy.title}</h1>
          </div>
        </div>
        <div className="cluster">
          <StatusBadge tone="synthetic">SIMULATION</StatusBadge>
          <Button
            variant="quiet"
            onClick={() => {
              void logout();
            }}
          >
            <LogOut size={18} />
            {copy.switchAccount}
          </Button>
        </div>
      </header>
      <main id="main" className="worker-preview-main stack">
        <p className="muted">{copy.previewScope}</p>
        <fieldset
          className="cluster worker-mode-switch"
          aria-label={locale === "en" ? "Simulation mode" : "시뮬레이션 모드"}
        >
          <Button
            aria-pressed={mode === "equipment"}
            variant={mode === "equipment" ? "primary" : "secondary"}
            onClick={() => useConsoleStore.getState().selectMode("equipment")}
          >
            <Construction size={20} />
            {copy.equipment}
          </Button>
          <Button
            aria-pressed={mode === "fire-gas"}
            variant={mode === "fire-gas" ? "primary" : "secondary"}
            onClick={() => useConsoleStore.getState().selectMode("fire-gas")}
          >
            <Flame size={20} />
            {copy.fireGas}
          </Button>
        </fieldset>
        <div className="cluster">
          <StatusBadge tone={online ? "safe" : "caution"}>
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? copy.connected : copy.reconnecting}
          </StatusBadge>
          <span className="muted">
            {copy.received}: {workerTime(receivedAt, locale)}
          </span>
        </div>
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <div className="worker-preview-grid">
          <div className="stack">
            <div className="cluster">
              <Button
                aria-pressed={voiceEnabled}
                onClick={() => setVoiceEnabled((enabled) => !enabled)}
              >
                {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                {voiceEnabled ? copy.voiceOn : copy.voiceOff}
              </Button>
              <span className="muted">
                {copy.audioState}: {voiceLabel(speech.status, locale)}
              </span>
            </div>
            <WorkerGuidancePanel
              guidance={guidance}
              worker={worker}
              locale={locale}
              pending={responses.pending}
              voiceEnabled={speechEnabled}
              send={responses.send}
              onReplay={speech.replay}
              onError={setActionError}
            />
            {worker && guidance ? (
              <WorkerResponsePanel worker={worker} incident={incident} locale={locale} />
            ) : null}
          </div>
          <Panel title={copy.map} className="worker-preview-map">
            {!snapshot || !workerSnapshot ? (
              <EmptyState title={copy.positionUnknown}>{copy.waitGuide}</EmptyState>
            ) : !mapMatches ? (
              <Banner tone="caution">{copy.invalidMap}</Banner>
            ) : (
              <div className="stack">
                <SiteMap
                  snapshot={workerSnapshot}
                  map={map}
                  bounds={map.bounds}
                  reachM={0}
                  zoom={1}
                  nowMs={Date.now()}
                  request={{ mode: "full", selection: workerId, reset: 0 }}
                  selectedWorkerId={workerId}
                  selectedIncidentId={guidance?.incidentId ?? null}
                  onSelectWorker={(id) => useConsoleStore.getState().selectWorker(id)}
                />
                <p className="muted">{copy.routeLegend}</p>
                {worker ? (
                  <>
                    <StatusBadge tone={worker.positionStatus === "known" ? "info" : "caution"}>
                      {positionText[worker.positionStatus]}
                    </StatusBadge>
                    <p>
                      {copy.source}: {copy[worker.positionSource]} · {copy.observed}:{" "}
                      {workerTime(worker.lastObservedAt, locale)}
                    </p>
                    <p data-testid="worker-position-input-source">
                      {copy.inputSource}: {copy[worker.positionInputSource]}
                    </p>
                    {worker.position && worker.positionStatus !== "unknown" ? (
                      <p className="mono">
                        X {worker.position.x.toFixed(1)} m · Y {worker.position.y.toFixed(1)} m
                      </p>
                    ) : null}
                  </>
                ) : null}
                <p className="muted">
                  {map.mapId} · v{map.mapVersion} · {map.floorId}
                </p>
                {snapshot.hazards
                  .filter((hazard) => hazard.active && hazard.floorId === map.floorId)
                  .map((hazard) => (
                    <p className="muted" key={hazard.hazardId}>
                      {hazard.reason} · {hazard.source} · {hazard.sensorStatus} ·{" "}
                      <time dateTime={hazard.observedAt}>
                        {workerTime(hazard.observedAt, locale)}
                      </time>
                    </p>
                  ))}
              </div>
            )}
          </Panel>
        </div>
        <footer className="muted">{copy.scope}</footer>
      </main>
    </div>
  );
}
