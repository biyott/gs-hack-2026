import type { Session } from "@/contracts";

type StreamSession = Pick<Session, "sessionId" | "deviceRole">;
type SessionStreams = {
  readonly deviceRole: Session["deviceRole"];
  readonly close: Set<() => void>;
};

export class SessionStreamRegistry {
  private readonly sessions = new Map<string, SessionStreams>();

  register(session: StreamSession, close: () => void): () => void {
    const entry = this.sessions.get(session.sessionId) ?? {
      deviceRole: session.deviceRole,
      close: new Set<() => void>(),
    };
    entry.close.add(close);
    this.sessions.set(session.sessionId, entry);
    return () => {
      entry.close.delete(close);
      if (entry.close.size === 0 && this.sessions.get(session.sessionId) === entry)
        this.sessions.delete(session.sessionId);
    };
  }

  close(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    this.sessions.delete(sessionId);
    for (const close of entry?.close ?? []) close();
  }

  replaceDevice(session: StreamSession): void {
    if (session.deviceRole === null) return;
    for (const [sessionId, entry] of this.sessions) {
      if (sessionId !== session.sessionId && entry.deviceRole === session.deviceRole)
        this.close(sessionId);
    }
  }

  count(sessionId?: string): number {
    if (sessionId !== undefined) return this.sessions.get(sessionId)?.close.size ?? 0;
    return [...this.sessions.values()].reduce((count, entry) => count + entry.close.size, 0);
  }
}

declare global {
  var gsSafetySessionStreams: SessionStreamRegistry | undefined;
}

export function getSessionStreams(): SessionStreamRegistry {
  globalThis.gsSafetySessionStreams ??= new SessionStreamRegistry();
  return globalThis.gsSafetySessionStreams;
}
