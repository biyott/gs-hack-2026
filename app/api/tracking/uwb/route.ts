import { type UwbUpload, UwbUploadSchema } from "@/contracts";
import { createMeasurementRepository } from "@/server/db/measurements";
import { authenticatedSession } from "@/server/http/context";
import { ApiFault, errorResponse, readJson } from "@/server/http/errors";
import { enforceSameOrigin } from "@/server/http/security";
import { getDatabaseServices } from "@/server/services/database";
import { getTrackingServices, participantConfig } from "@/server/services/tracking";
import { synchronizeTracking } from "@/server/simulation/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    enforceSameOrigin(request);
    const raw = await readJson(request);
    const session = authenticatedSession(request);
    const isEquipment = session.role === "device" && session.deviceRole === "EQUIPMENT";
    if (!isEquipment && !["admin", "operator"].includes(session.role))
      throw new ApiFault(
        403,
        "FORBIDDEN",
        "UWB uploads require equipment credentials or an operator fixture",
      );
    const upload: UwbUpload = {
      ...UwbUploadSchema.parse(raw),
      source: isEquipment ? "live" : "synthetic",
    };
    if (isEquipment) {
      const pairing = participantConfig(session, "EQUIPMENT");
      if (pairing.status !== "ready" || upload.sessionEpoch !== pairing.config.sessionEpoch)
        throw new ApiFault(
          409,
          "UWB_SESSION_MISMATCH",
          "UWB ranges must belong to the current ready pairing epoch",
        );
    }
    const receivedAt = new Date().toISOString();
    const snapshot = getTrackingServices().tracking.ingestUwb(upload, receivedAt);
    createMeasurementRepository(getDatabaseServices().database).append({
      kind: "uwb",
      sourceId: `${upload.deviceId}:${upload.workerId}:${upload.sessionEpoch ?? "default"}`,
      sequence: upload.sequence,
      observedAt: upload.capturedAt,
      receivedAt,
      payloadJson: JSON.stringify({
        source: isEquipment ? "live" : "synthetic",
        deviceId: upload.deviceId,
        workerId: upload.workerId,
        captureClock: upload.captureClock,
        distanceM: upload.distanceM,
        azimuthRad: upload.azimuthRad,
        elevationRad: upload.elevationRad,
        uncertaintyM: upload.uncertaintyM,
        observation: snapshot.uwbObservations.find((value) => value.entityId === upload.workerId),
      }),
    });
    synchronizeTracking(snapshot);
    if (isEquipment)
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    return Response.json(snapshot, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
