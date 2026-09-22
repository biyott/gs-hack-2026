"use client";

import ky, { HTTPError } from "ky";
import { z } from "zod";
import {
  ApiErrorSchema,
  CatalogSchema,
  type IncidentAction,
  IncidentActionSchema,
  type SessionRequest,
  SessionRequestSchema,
  SessionSchema,
  type SimulationCommand,
  SimulationCommandSchema,
  type SimulationMode,
  SimulationWireSnapshotSchema,
  type WorkerResponse,
  WorkerResponseSchema,
} from "@/contracts";

import { notifySessionChanged } from "./auth-sync";

const http = ky.create({
  timeout: 10_000,
  credentials: "same-origin",
  retry: { limit: 1, methods: ["get"] },
});

export class ApiFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiFailure";
  }
}

async function parseResponse<T>(request: Promise<Response>, schema: z.ZodType<T>): Promise<T> {
  try {
    return schema.parse(await (await request).json());
  } catch (error) {
    if (error instanceof HTTPError) {
      const body: unknown = error.data;
      const result = ApiErrorSchema.safeParse(body);
      throw new ApiFailure(
        result.success ? result.data.error.code : "HTTP_ERROR",
        result.success ? result.data.error.message : `요청 실패 (${error.response.status})`,
        error.response.status,
      );
    }
    if (error instanceof z.ZodError)
      throw new ApiFailure(
        "INVALID_RESPONSE",
        "서버 응답 형식이 현재 계약과 일치하지 않습니다.",
        502,
      );
    throw error;
  }
}

export const api = {
  catalog: () => parseResponse(http.get("/api/catalog"), CatalogSchema),
  session: () => parseResponse(http.get("/api/session"), SessionSchema),
  login: (body: SessionRequest) =>
    parseResponse(
      http.post("/api/session", { json: SessionRequestSchema.parse(body) }),
      SessionSchema,
    ).then((session) => {
      notifySessionChanged();
      return session;
    }),
  logout: () =>
    http.delete("/api/session").then((response) => {
      notifySessionChanged();
      return response;
    }),
  snapshot: (mode: SimulationMode) =>
    parseResponse(
      http.get("/api/simulation", { searchParams: { mode } }),
      SimulationWireSnapshotSchema,
    ),
  command: (body: SimulationCommand) =>
    parseResponse(
      http.post("/api/simulation", { json: SimulationCommandSchema.parse(body) }),
      SimulationWireSnapshotSchema,
    ),
  incident: (body: IncidentAction) =>
    parseResponse(
      http.post(`/api/incidents/${encodeURIComponent(body.incidentId)}/actions`, {
        json: IncidentActionSchema.parse(body),
      }),
      SimulationWireSnapshotSchema,
    ),
  response: (body: WorkerResponse) =>
    parseResponse(
      http.post(`/api/workers/${encodeURIComponent(body.workerId)}/response`, {
        json: WorkerResponseSchema.parse(body),
      }),
      SimulationWireSnapshotSchema,
    ),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
