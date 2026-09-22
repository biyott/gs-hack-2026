import type { Incident, IncidentAction, Session } from "@/contracts";

type Action = IncidentAction["action"];
const operationalActions = ["acknowledge", "assign", "field-check", "follow-up"] as const;
const administratorActions = [
  ...operationalActions,
  "clear-hazard",
  "reopen-passage",
  "close",
] as const;
const supportActions = ["accept-support", "complete-support"] as const;

export function allowedIncidentActions(
  session: Pick<Session, "role" | "actorId"> | null,
  incident: Pick<Incident, "assignedTo">,
): readonly Action[] {
  if (!session) return [];
  switch (session.role) {
    case "admin":
      return administratorActions;
    case "operator":
      return operationalActions;
    case "support":
      return incident.assignedTo === session.actorId ? supportActions : [];
    case "worker":
    case "device":
    case "observer":
      return [];
    default:
      return session.role satisfies never;
  }
}
