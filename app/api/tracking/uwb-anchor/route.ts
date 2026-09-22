import { UwbFixedAnchorRequestSchema } from "@/contracts";
import { authenticatedSession } from "@/server/http/context";
import { ApiFault, errorResponse, readJson } from "@/server/http/errors";
import { enforceSameOrigin } from "@/server/http/security";
import { getTrackingServices } from "@/server/services/tracking";
import { synchronizeTracking } from "@/server/simulation/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    enforceSameOrigin(request);
    const raw = await readJson(request);
    const session = authenticatedSession(request);
    if (!["admin", "operator"].includes(session.role))
      throw new ApiFault(403, "FORBIDDEN", "UWB reference requires an administrator or operator");
    const { anchor } = UwbFixedAnchorRequestSchema.parse(raw);
    const snapshot = getTrackingServices().tracking.setUwbAnchor(anchor);
    synchronizeTracking(snapshot);
    return Response.json(snapshot, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
