import type { Session, UwbParticipantRole } from "@/contracts";
import { authenticatedSession } from "@/server/http/context";
import { ApiFault } from "@/server/http/errors";

export function authenticatedUwbParticipant(
  request: Request,
): Readonly<{ role: UwbParticipantRole; session: Session }> {
  const session = authenticatedSession(request);
  switch (session.deviceRole) {
    case "EQUIPMENT":
    case "WORKER_1":
    case "WORKER_2":
      return { role: session.deviceRole, session };
    case "CCTV":
    case null:
      throw new ApiFault(403, "FORBIDDEN", "UWB pairing requires a bound participant credential");
    default: {
      const exhaustive: never = session.deviceRole;
      return exhaustive;
    }
  }
}
