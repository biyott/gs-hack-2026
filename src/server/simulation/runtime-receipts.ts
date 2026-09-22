import type { IncidentAction, Session, SimulationCommand, WorkerResponse } from "@/contracts";
import type { RequestReceipt, ResponseReceipt } from "../db/repository-types";
import { ApiFault } from "../http/errors";

export function matchesReceipt(
  receipt: RequestReceipt | ResponseReceipt | null,
  request: SimulationCommand | IncidentAction | WorkerResponse,
  session: Session,
): boolean {
  if (receipt === null) return false;
  if (
    receipt.actorId !== session.actorId ||
    JSON.stringify(receipt.request) !== JSON.stringify(request)
  )
    throw new ApiFault(409, "REQUEST_CONFLICT", "Request identifier was already used");
  return true;
}
