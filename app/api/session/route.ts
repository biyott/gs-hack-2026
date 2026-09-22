import { SessionRequestSchema } from "@/contracts";
import { authenticatedSession } from "@/server/http/context";
import { errorResponse, readJson } from "@/server/http/errors";
import { enforceSameOrigin, requestToken, sessionCookie } from "@/server/http/security";
import { getSessionStreams } from "@/server/realtime/session-streams";
import { getDatabaseServices } from "@/server/services/database";
import { activateTrackingSession, invalidateTrackingSession } from "@/server/services/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    enforceSameOrigin(request);
    const credentials = SessionRequestSchema.parse(await readJson(request));
    const auth = getDatabaseServices().auth;
    const previousToken = requestToken(request);
    const previous = previousToken ? auth.authenticate(previousToken) : null;
    const issued = auth.login(credentials);
    const streams = getSessionStreams();
    if (previous !== null) {
      auth.logout(previous.token);
      streams.close(previous.sessionId);
      invalidateTrackingSession(previous);
    }
    streams.replaceDevice(issued.session);
    activateTrackingSession(issued.session);
    return Response.json(issued.session, {
      headers: {
        "set-cookie": sessionCookie(issued.token, 8 * 60 * 60),
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function GET(request: Request): Response {
  try {
    return Response.json(authenticatedSession(request), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function DELETE(request: Request): Response {
  try {
    enforceSameOrigin(request);
    const token = requestToken(request);
    if (token) {
      const auth = getDatabaseServices().auth;
      const session = auth.authenticate(token);
      auth.logout(token);
      if (session !== null) {
        getSessionStreams().close(session.sessionId);
        invalidateTrackingSession(session);
      }
    }
    return new Response(null, { status: 204, headers: { "set-cookie": sessionCookie("", 0) } });
  } catch (error) {
    return errorResponse(error);
  }
}
