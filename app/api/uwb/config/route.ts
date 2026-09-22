import { errorResponse } from "@/server/http/errors";
import { participantConfig } from "@/server/services/tracking";
import { authenticatedUwbParticipant } from "../authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const { role, session } = authenticatedUwbParticipant(request);
    return Response.json(participantConfig(session, role), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
