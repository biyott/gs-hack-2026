import { requireRole } from "@/server/auth";
import { authenticatedSession } from "@/server/http/context";
import { errorResponse } from "@/server/http/errors";
import { getTrackingServices } from "@/server/services/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const session = authenticatedSession(request);
    requireRole(session, ["admin", "operator", "support", "observer"]);
    return Response.json(getTrackingServices().tracking.getSnapshot(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
