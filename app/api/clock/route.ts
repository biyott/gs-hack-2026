import { authenticatedSession } from "@/server/http/context";
import { errorResponse } from "@/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    authenticatedSession(request);
    return Response.json(
      { serverAt: new Date().toISOString() },
      {
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
