"use client";

import ky, { HTTPError } from "ky";
import { z } from "zod";
import {
  ApiErrorSchema,
  type Calibration,
  CalibrationSchema,
  type TrackingSnapshot,
  TrackingSnapshotSchema,
  type UwbFixedAnchor,
  UwbFixedAnchorRequestSchema,
} from "@/contracts";
import { ApiFailure } from "./api";

const trackingHttp = ky.create({
  timeout: 10_000,
  credentials: "same-origin",
  retry: { limit: 1, methods: ["get"] },
});

export async function parseTrackingResponse(request: Promise<Response>): Promise<TrackingSnapshot> {
  try {
    const body: unknown = await (await request).json();
    return TrackingSnapshotSchema.parse(body);
  } catch (error) {
    if (error instanceof HTTPError) {
      const body: unknown = error.data;
      const parsed = ApiErrorSchema.safeParse(body);
      throw new ApiFailure(
        parsed.success ? parsed.data.error.code : "TRACKING_HTTP_ERROR",
        parsed.success ? parsed.data.error.message : `추적 요청 실패 (${error.response.status})`,
        error.response.status,
      );
    }
    if (error instanceof z.ZodError)
      throw new ApiFailure(
        "INVALID_TRACKING_RESPONSE",
        "추적 응답 형식이 현재 계약과 일치하지 않습니다.",
        502,
      );
    throw error;
  }
}

export const trackingApi = {
  snapshot: (signal: AbortSignal) =>
    parseTrackingResponse(trackingHttp.get("/api/tracking", { signal })),
  calibrate: (calibration: Calibration) =>
    parseTrackingResponse(
      trackingHttp.post("/api/tracking/calibration", {
        json: CalibrationSchema.parse(calibration),
      }),
    ),
  saveUwbAnchor: (anchor: UwbFixedAnchor | null) =>
    parseTrackingResponse(
      trackingHttp.post("/api/tracking/uwb-anchor", {
        json: UwbFixedAnchorRequestSchema.parse({ anchor }),
      }),
    ),
};
