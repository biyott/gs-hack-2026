import { errorResponse } from "@/server/http/errors";
import { configurationCatalog, loadConfiguration } from "@/server/simulation/configuration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  try {
    return Response.json(configurationCatalog(loadConfiguration()));
  } catch (error) {
    return errorResponse(error);
  }
}
