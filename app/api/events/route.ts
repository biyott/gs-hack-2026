import { type Session, SimulationModeSchema, type SimulationSnapshot } from "@/contracts";
import { authenticatedSession } from "@/server/http/context";
import { errorResponse } from "@/server/http/errors";
import { scopeSnapshot } from "@/server/realtime/bus";
import { getSessionStreams } from "@/server/realtime/session-streams";
import { getDatabaseServices } from "@/server/services/database";
import { getRuntimeServices } from "@/server/services/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const session = authenticatedSession(request);
    const mode = SimulationModeSchema.parse(
      new URL(request.url).searchParams.get("mode") ?? "equipment",
    );
    const server = getRuntimeServices().runtime;
    const registry = getSessionStreams();
    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let unregister: (() => void) | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let pending: SimulationSnapshot | null = null;
    let closeStream: (() => void) | null = null;
    let open = true;
    const cleanup = (): boolean => {
      if (!open) return false;
      open = false;
      pending = null;
      unsubscribe?.();
      unregister?.();
      if (heartbeat !== null) clearInterval(heartbeat);
      request.signal.removeEventListener("abort", abort);
      return true;
    };
    const abort = () => {
      if (cleanup()) closeStream?.();
    };
    const authenticate = () => {
      const fresh = getDatabaseServices().auth.authenticate(session.token);
      if (fresh === null) abort();
      return fresh;
    };
    const frame = (snapshot: SimulationSnapshot, fresh: Session) =>
      encoder.encode(
        `id: ${snapshot.streamId}:${snapshot.mode}:${snapshot.sequence}\nevent: snapshot\ndata: ${JSON.stringify(scopeSnapshot(snapshot, fresh))}\n\n`,
      );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        closeStream = () => {
          controller.close();
        };
        request.signal.addEventListener("abort", abort, { once: true });
        if (request.signal.aborted) {
          abort();
          return;
        }
        unregister = registry.register(session, abort);
        const publish = (snapshot: SimulationSnapshot) => {
          if (!open) return;
          const fresh = authenticate();
          if (fresh === null) return;
          if ((controller.desiredSize ?? 0) <= 0) {
            pending = snapshot;
            return;
          }
          controller.enqueue(frame(snapshot, fresh));
        };
        unsubscribe = server.bus.subscribe(mode, publish);
        publish(server.getRun(mode).snapshot);
        if (!open) return;
        heartbeat = setInterval(() => {
          if (!open || authenticate() === null) return;
          if ((controller.desiredSize ?? 0) > 0)
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }, 15000);
        heartbeat.unref();
      },
      pull(controller) {
        if (!open || pending === null) return;
        const snapshot = pending;
        pending = null;
        const fresh = authenticate();
        if (fresh !== null) controller.enqueue(frame(snapshot, fresh));
      },
      cancel() {
        closeStream = null;
        cleanup();
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
