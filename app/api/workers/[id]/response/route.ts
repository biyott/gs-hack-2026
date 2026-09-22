import { WorkerResponseSchema } from "@/contracts";
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
    const response = WorkerResponseSchema.parse(await readJson(request));
    if (response.workerId !== (await context.params).id)
      throw new ApiFault(400, "WORKER_MISMATCH", "URL and worker must match");
    const session = authenticatedSession(request);
    return Response.json(
      scopeSnapshot(getRuntimeServices().runtime.respond(response, session), session),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
