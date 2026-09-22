"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiFailure, api, errorMessage } from "@/client/api";
import { createRequestId } from "@/client/request-id";
import { useConsoleStore } from "@/client/store";
import type { Guidance, SiteMap, WorkerResponse } from "@/contracts";
import {
  currentWorkerGuidance,
  responseGuidanceVersion,
  samePrimaryGuidance,
} from "./guidance-policy";

export type SendWorkerResponse = (
  guidance: Guidance,
  response: WorkerResponse["response"],
) => Promise<void>;

export function useWorkerResponses(map: SiteMap) {
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const send = useCallback<SendWorkerResponse>(
    (captured, response) => {
      const sessionId = useConsoleStore.getState().session?.sessionId;
      const occurredAt = new Date().toISOString();
      setPending((count) => count + 1);
      const operation = queue.current
        .then(async () => {
          const state = useConsoleStore.getState();
          const worker = state.snapshot?.workers.find(
            (item) => item.workerId === state.session?.workerId,
          );
          const guidance =
            state.snapshot && worker
              ? currentWorkerGuidance(state.snapshot, worker, map, Date.now())
              : null;
          if (
            state.session?.sessionId !== sessionId ||
            state.session?.role !== "worker" ||
            !guidance ||
            !samePrimaryGuidance(captured, guidance)
          ) {
            throw new ApiFailure(
              "STALE_GUIDANCE",
              "안내가 변경되어 응답을 보내지 않았습니다. 현재 안내를 확인해 주세요. / Guidance changed. Check the current instruction.",
              409,
            );
          }
          const responseVersion = responseGuidanceVersion(captured, guidance, response);
          if (responseVersion === null) {
            if (response === "received" || response === "displayed") return;
            throw new ApiFailure(
              "STALE_GUIDANCE",
              "안내가 갱신되었습니다. 현재 안내를 확인하고 다시 응답해 주세요. / Guidance updated. Review it and respond again.",
              409,
            );
          }
          const snapshot = await api.response({
            mode: guidance.simulationMode,
            runId: guidance.runId,
            workerId: guidance.workerId,
            incidentId: guidance.incidentId,
            guidanceId: guidance.guidanceId,
            guidanceVersion: responseVersion,
            requestId: createRequestId(),
            response,
            occurredAt,
          });
          const current = useConsoleStore.getState();
          if (current.session?.sessionId === sessionId) current.acceptSnapshot(snapshot);
          setError(null);
        })
        .catch(async (failure: unknown) => {
          setError(errorMessage(failure));
          if (
            failure instanceof ApiFailure &&
            failure.status === 409 &&
            useConsoleStore.getState().session?.sessionId === sessionId
          ) {
            const state = useConsoleStore.getState();
            try {
              const snapshot = await api.snapshot(state.mode);
              const current = useConsoleStore.getState();
              if (current.session?.sessionId === sessionId) current.acceptSnapshot(snapshot);
            } catch (refreshError) {
              if (refreshError instanceof Error) setError(refreshError.message);
              else throw refreshError;
            }
          }
          throw failure;
        })
        .finally(() => setPending((count) => count - 1));
      queue.current = operation.catch((failure: unknown) => {
        if (!(failure instanceof Error)) throw failure;
      });
      return operation;
    },
    [map],
  );
  return { send, pending: pending > 0, error };
}

export function useAutomaticReceipts(guidance: Guidance | null, send: SendWorkerResponse) {
  const receipts = useRef(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!guidance) return;
    const key = `${guidance.runId}:${guidance.guidanceId}:${guidance.guidanceVersion}`;
    const report = (response: "received" | "displayed") => {
      const signature = `${key}:${response}`;
      if (receipts.current.has(signature)) return;
      receipts.current.add(signature);
      void send(guidance, response)
        .then(() => setError(null))
        .catch((failure: unknown) => {
          receipts.current.delete(signature);
          setError(errorMessage(failure));
        });
    };
    report("received");
    let frame: number | null = null;
    const displayed = () => {
      if (document.visibilityState !== "visible") return;
      frame = requestAnimationFrame(() => report("displayed"));
    };
    displayed();
    document.addEventListener("visibilitychange", displayed);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", displayed);
    };
  }, [guidance, send]);
  return error;
}
