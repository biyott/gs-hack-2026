import { z } from "zod";
import { type FrameUpload, FrameUploadSchema } from "@/contracts";
import { createMeasurementRepository } from "@/server/db/measurements";
import { authenticatedSession } from "@/server/http/context";
import { ApiFault, errorResponse, readJson } from "@/server/http/errors";
import { enforceSameOrigin } from "@/server/http/security";
import { getDatabaseServices } from "@/server/services/database";
import { getTrackingServices } from "@/server/services/tracking";
import { synchronizeTracking } from "@/server/simulation/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const session = authenticatedSession(request);
    if (!["admin", "operator", "observer"].includes(session.role))
      throw new ApiFault(403, "FORBIDDEN", "This account cannot view camera frames");
    const jpeg = getTrackingServices().tracking.getLatestJpeg();
    const frame = getTrackingServices().tracking.getSnapshot().camera;
    if (jpeg === null || frame === null)
      throw new ApiFault(404, "FRAME_NOT_FOUND", "No camera frame is available");
    const query = new URL(request.url).searchParams;
    const sequence = query.has("sequence")
      ? z.coerce.number().int().nonnegative().parse(query.get("sequence"))
      : null;
    if (
      (sequence !== null && sequence !== frame.sequence) ||
      (query.has("cameraId") && query.get("cameraId") !== frame.cameraId) ||
      (query.has("frameId") && query.get("frameId") !== frame.frameId) ||
      (query.has("streamId") && query.get("streamId") !== (frame.streamId ?? "default"))
    )
      throw new ApiFault(409, "FRAME_SUPERSEDED", "Requested camera frame has been superseded");
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "no-store",
        "x-frame-camera-id": encodeURIComponent(frame.cameraId),
        "x-frame-sequence": String(frame.sequence),
        "x-frame-id": encodeURIComponent(frame.frameId),
        "x-frame-stream-id": encodeURIComponent(frame.streamId ?? "default"),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    enforceSameOrigin(request);
    const incoming = FrameUploadSchema.parse(await readJson(request));
    const session = authenticatedSession(request);
    const isCamera = session.role === "device" && session.deviceRole === "CCTV";
    const isSyntheticOperator =
      ["admin", "operator"].includes(session.role) && incoming.source === "synthetic";
    if (!isCamera && !isSyntheticOperator)
      throw new ApiFault(
        403,
        "FORBIDDEN",
        "Camera uploads require CCTV credentials or an operator synthetic fixture",
      );
    const frame: FrameUpload = { ...incoming, source: isCamera ? "live" : "synthetic" };
    const receivedAt = new Date().toISOString();
    const snapshot = await getTrackingServices().tracking.ingestFrame(frame, receivedAt);
    createMeasurementRepository(getDatabaseServices().database).append({
      kind: "camera-frame",
      sourceId: `${frame.cameraId}:${frame.deviceId ?? session.sessionId}`,
      sequence: frame.sequence,
      observedAt: frame.capturedAt,
      receivedAt,
      payloadJson: JSON.stringify({
        source: frame.source,
        deviceId: frame.deviceId,
        runId: frame.runId,
        capturedElapsedNanos: frame.capturedElapsedNanos,
        captureClock: frame.captureClock,
        camera: snapshot.camera,
        observations: snapshot.cameraObservations,
      }),
    });
    synchronizeTracking(snapshot);
    if (isCamera)
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    return Response.json(snapshot, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
