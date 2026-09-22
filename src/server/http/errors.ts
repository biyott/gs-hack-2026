import { ZodError } from "zod";
import { AuthenticationError } from "../auth/types";
import { PersistenceError } from "../db/errors";
import { IncidentTransitionError } from "../incidents";
import { ClockTransitionError } from "../simulation/clock";
import { TrackingError } from "../tracking/types";

export class ApiFault extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiFault";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiFault)
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Request does not match the API contract",
          issues: error.issues,
        },
      },
      { status: 400 },
    );
  if (error instanceof SyntaxError)
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Request body must contain JSON" } },
      { status: 400 },
    );
  if (error instanceof AuthenticationError)
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.code === "FORBIDDEN" ? 403 : 401 },
    );
  if (error instanceof PersistenceError)
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.code === "CONFLICT" ? 409 : error.code === "NOT_FOUND" ? 404 : 400 },
    );
  if (error instanceof ClockTransitionError)
    return Response.json(
      { error: { code: error.reason, message: "Simulation state does not allow this command" } },
      { status: 409 },
    );
  if (error instanceof IncidentTransitionError)
    return Response.json(
      { error: { code: error.code, message: error.message, currentVersion: error.currentVersion } },
      { status: error.code === "NOT_FOUND" ? 404 : 409 },
    );
  if (error instanceof TrackingError)
    return Response.json(
      { error: { code: error.code, message: error.message } },
      {
        status:
          error.code === "busy"
            ? 429
            : error.code === "out-of-order" || error.code === "calibration-changed"
              ? 409
              : 400,
      },
    );
  throw error;
}

/** JSON is parsed at the HTTP trust boundary, never inside the domain engine. */
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiFault(415, "JSON_REQUIRED", "Use application/json");
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 2_000_000) throw new ApiFault(413, "BODY_TOO_LARGE", "Request exceeds 2 MB");
  return request.json();
}
