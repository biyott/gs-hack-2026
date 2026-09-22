"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Guidance, WorkerResponse } from "@/contracts";

export type WorkerSpeechStatus =
  | "idle"
  | "playing"
  | "completed"
  | "failed"
  | "unsupported"
  | "cancelled";

type SpeechOptions = {
  readonly guidance: Guidance | null;
  readonly enabled: boolean;
  readonly onResponse: (guidance: Guidance, response: WorkerResponse["response"]) => Promise<void>;
};

type ActiveSpeech = {
  readonly utterance: SpeechSynthesisUtterance;
  readonly synthesis: SpeechSynthesis;
};

function primaryIdentity(guidance: Guidance | null): string | null {
  return guidance === null
    ? null
    : JSON.stringify([
        guidance.runId,
        guidance.simulationMode,
        guidance.workerId,
        guidance.guidanceId,
        guidance.primaryGuidanceVersion,
      ]);
}

export function useWorkerSpeech(options: SpeechOptions) {
  const [status, setStatus] = useState<WorkerSpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(options);
  const mounted = useRef(false);
  const active = useRef<ActiveSpeech | null>(null);
  const announced = useRef(new Set<string>());
  const identity = primaryIdentity(options.guidance);

  useEffect(() => {
    latest.current = options;
  }, [options]);

  const report = useCallback(async (guidance: Guidance, response: WorkerResponse["response"]) => {
    try {
      await latest.current.onResponse(guidance, response);
    } catch (cause: unknown) {
      if (
        mounted.current &&
        primaryIdentity(latest.current.guidance) === primaryIdentity(guidance)
      ) {
        const detail = cause instanceof Error ? cause.message : "Unknown delivery error";
        setError(`음성 상태 전송 실패 / Could not report voice status: ${detail}`);
      }
    }
  }, []);

  const cancel = useCallback(() => {
    const current = active.current;
    if (current === null) return;
    active.current = null;
    current.utterance.onstart = null;
    current.utterance.onend = null;
    current.utterance.onerror = null;
    try {
      current.synthesis.cancel();
      if (mounted.current) setStatus("cancelled");
    } catch (cause: unknown) {
      if (mounted.current) {
        const detail = cause instanceof Error ? cause.message : "Unknown cancellation error";
        setError(`음성 중지 실패 / Could not stop voice guidance: ${detail}`);
      }
    }
  }, []);

  const speak = useCallback(
    (guidance: Guidance) => {
      cancel();
      const key = primaryIdentity(guidance);
      if (key !== null) announced.current.add(key);
      setError(null);
      setStatus("idle");
      if (
        typeof window.speechSynthesis === "undefined" ||
        typeof window.SpeechSynthesisUtterance !== "function"
      ) {
        setStatus("unsupported");
        void report(guidance, "voice-unsupported");
        return;
      }
      try {
        const utterance = new window.SpeechSynthesisUtterance(guidance.primaryMessage);
        const current = { utterance, synthesis: window.speechSynthesis };
        utterance.lang = guidance.locale === "ko" ? "ko-KR" : "en-US";
        utterance.onstart = () => {
          if (active.current !== current) return;
          setStatus("playing");
          void report(guidance, "voice-started");
        };
        utterance.onend = () => {
          if (active.current !== current) return;
          active.current = null;
          setStatus("completed");
          void report(guidance, "voice-completed");
        };
        utterance.onerror = (event) => {
          if (active.current !== current) return;
          active.current = null;
          if (event.error === "canceled" || event.error === "interrupted") {
            setStatus("cancelled");
            return;
          }
          setStatus("failed");
          setError(`음성 안내 실패 / Voice guidance failed: ${event.error}`);
          void report(guidance, "voice-failed");
        };
        active.current = current;
        current.synthesis.speak(utterance);
      } catch (cause: unknown) {
        cancel();
        setStatus("failed");
        const detail = cause instanceof Error ? cause.message : "Unknown speech error";
        setError(`음성 안내 실패 / Voice guidance failed: ${detail}`);
        void report(guidance, "voice-failed");
      }
    },
    [cancel, report],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    let current = true;
    const enabled = options.enabled;
    queueMicrotask(() => {
      const { guidance } = latest.current;
      if (!current || !enabled || guidance === null || identity === null) return;
      if (!announced.current.has(identity)) speak(guidance);
    });
    return () => {
      current = false;
      cancel();
    };
  }, [identity, options.enabled, speak, cancel]);

  const replay = useCallback(() => {
    const { guidance, enabled } = latest.current;
    if (enabled && guidance !== null) speak(guidance);
  }, [speak]);

  return { status, error, replay, cancel };
}
