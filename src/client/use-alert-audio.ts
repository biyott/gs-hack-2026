"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertLedger, type Announcement, alertObservations } from "./alert-policy";
import { useConsoleStore } from "./store";

type AudioStatus = "muted" | "ready" | "playing" | "unavailable" | "failed";
type AudioBatch = {
  readonly scope: string;
  readonly announcements: readonly Announcement[];
};

function batchIsCurrent(batch: AudioBatch): boolean {
  const { snapshot, soundEnabled, streamBaselineReady, connectionEpoch } =
    useConsoleStore.getState();
  if (!snapshot || !soundEnabled || !streamBaselineReady || snapshot.run.status === "paused")
    return false;
  const scope = JSON.stringify([snapshot.streamId, snapshot.run.runId, connectionEpoch]);
  if (scope !== batch.scope) return false;
  const now = Date.now();
  const observations = alertObservations(snapshot, now);
  return batch.announcements.every(
    (item) =>
      item.expiresAt > now &&
      observations.some(
        (current) =>
          current.id === item.id &&
          current.signature === item.signature &&
          current.priority === item.priority &&
          current.message === item.message &&
          current.expiresAt >= item.expiresAt,
      ),
  );
}

export function useAlertAudio(): AudioStatus {
  const snapshot = useConsoleStore((state) => state.snapshot);
  const connectionEpoch = useConsoleStore((state) => state.connectionEpoch);
  const streamBaselineReady = useConsoleStore((state) => state.streamBaselineReady);
  const soundEnabled = useConsoleStore((state) => state.soundEnabled);
  const [status, setStatus] = useState<AudioStatus>("muted");
  const ledger = useRef(new AlertLedger());
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const activeBatch = useRef<AudioBatch | null>(null);

  const cancelAudio = useCallback(() => {
    generation.current += 1;
    if (timer.current !== null) clearTimeout(timer.current);
    if (expiryTimer.current !== null) clearTimeout(expiryTimer.current);
    timer.current = null;
    expiryTimer.current = null;
    activeBatch.current = null;
    oscillatorRef.current?.stop();
    oscillatorRef.current?.disconnect();
    oscillatorRef.current = null;
    window.speechSynthesis?.cancel();
  }, []);

  const revalidateAudio = useCallback(() => {
    if (!activeBatch.current || batchIsCurrent(activeBatch.current)) return true;
    cancelAudio();
    setStatus(useConsoleStore.getState().soundEnabled ? "ready" : "muted");
    return false;
  }, [cancelAudio]);

  useEffect(() => {
    if (!soundEnabled) cancelAudio();
    setStatus(soundEnabled ? "ready" : "muted");
  }, [soundEnabled, cancelAudio]);

  useEffect(() => {
    revalidateAudio();
    if (!snapshot || !streamBaselineReady) return;
    const scope = JSON.stringify([snapshot.streamId, snapshot.run.runId, connectionEpoch]);
    const announcements = ledger.current.update(scope, alertObservations(snapshot));
    if (!soundEnabled || snapshot.run.status === "paused" || announcements.length === 0) return;
    if (!("speechSynthesis" in window) || !("AudioContext" in window)) {
      setStatus("unavailable");
      return;
    }
    cancelAudio();
    const batch = { scope, announcements };
    activeBatch.current = batch;
    const current = generation.current;
    const expiresAt = Math.min(...announcements.map((item) => item.expiresAt));
    expiryTimer.current = setTimeout(
      () => {
        if (generation.current !== current) return;
        cancelAudio();
        setStatus("ready");
      },
      Math.max(0, expiresAt - Math.max(Date.now(), Date.parse(snapshot.run.updatedAt))),
    );
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    void context
      .resume()
      .then(() => {
        if (generation.current !== current || !revalidateAudio()) return;
        const oscillator = context.createOscillator();
        oscillatorRef.current = oscillator;
        oscillator.onended = () => {
          oscillator.disconnect();
          if (oscillatorRef.current === oscillator) oscillatorRef.current = null;
        };
        const gain = context.createGain();
        oscillator.frequency.value = 740;
        gain.gain.setValueAtTime(0.08, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.16);
        timer.current = setTimeout(() => {
          timer.current = null;
          if (generation.current !== current || !revalidateAudio()) return;
          const utterance = new SpeechSynthesisUtterance(
            announcements.map((item) => item.message).join(" "),
          );
          utterance.lang = "ko-KR";
          utterance.rate = 1.05;
          const finish = (nextStatus: AudioStatus) => {
            if (generation.current !== current) return;
            if (expiryTimer.current !== null) clearTimeout(expiryTimer.current);
            expiryTimer.current = null;
            activeBatch.current = null;
            setStatus(nextStatus);
          };
          utterance.onend = () => finish("ready");
          utterance.onerror = () => finish("failed");
          setStatus("playing");
          window.speechSynthesis.speak(utterance);
        }, 180);
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          if (generation.current === current) {
            cancelAudio();
            setStatus("failed");
          }
        } else throw error;
      });
  }, [snapshot, soundEnabled, streamBaselineReady, connectionEpoch, cancelAudio, revalidateAudio]);

  useEffect(() => {
    const onForeground = () => {
      if (document.visibilityState === "visible") revalidateAudio();
    };
    window.addEventListener("focus", onForeground);
    document.addEventListener("visibilitychange", onForeground);
    return () => {
      window.removeEventListener("focus", onForeground);
      document.removeEventListener("visibilitychange", onForeground);
      cancelAudio();
      void audioContext.current?.close();
    };
  }, [cancelAudio, revalidateAudio]);
  return status;
}
