import { IncidentActionSchema } from "@/contracts";
import { authenticatedSession } from "@/server/http/context";
import { ApiFault, errorResponse, readJson } from "@/server/http/errors";
import { enforceSameOrigin } from "@/server/http/security";
import { scopeSnapshot } from "@/server/realtime/bus";
import { getRuntimeServices } from "@/server/services/runtime";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    enforceSameOrigin(request);
    const action = IncidentActionSchema.parse(await readJson(request));
    if (action.incidentId !== (await context.params).id)
      throw new ApiFault(400, "INCIDENT_MISMATCH", "URL and incident must match");
    const session = authenticatedSession(request);
    return Response.json(
      scopeSnapshot(getRuntimeServices().runtime.incident(action, session), session),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
