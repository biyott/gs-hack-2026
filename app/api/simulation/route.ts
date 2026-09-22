import { SimulationCommandSchema, SimulationModeSchema } from "@/contracts";
import { authenticatedSession } from "@/server/http/context";
import { errorResponse, readJson } from "@/server/http/errors";
import { enforceSameOrigin } from "@/server/http/security";
import { scopeSnapshot } from "@/server/realtime/bus";
import { getRuntimeServices } from "@/server/services/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const session = authenticatedSession(request);
    const mode = SimulationModeSchema.parse(
      new URL(request.url).searchParams.get("mode") ?? "equipment",
    );
    return Response.json(
      scopeSnapshot(getRuntimeServices().runtime.getRun(mode).snapshot, session),
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    enforceSameOrigin(request);
    const command = SimulationCommandSchema.parse(await readJson(request));
    const session = authenticatedSession(request);
    return Response.json(
      scopeSnapshot(getRuntimeServices().runtime.command(command, session), session),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
