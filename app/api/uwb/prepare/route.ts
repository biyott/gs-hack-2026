import { z } from "zod";
import { UwbPreparedRegistrationSchema } from "@/contracts";
import { ApiFault, errorResponse, readJson } from "@/server/http/errors";
import { enforceSameOrigin } from "@/server/http/security";
import { registerUwbParticipant, unregisterUwbParticipant } from "@/server/services/tracking";
import { authenticatedUwbParticipant } from "../authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    enforceSameOrigin(request);
    const registration = UwbPreparedRegistrationSchema.parse(await readJson(request));
    const { role, session } = authenticatedUwbParticipant(request);
    if (registration.role !== role)
      throw new ApiFault(403, "FORBIDDEN", "Registration role must match the authenticated device");
    return Response.json(registerUwbParticipant(session, registration), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function DELETE(request: Request): Response {
  try {
    enforceSameOrigin(request);
    const { session } = authenticatedUwbParticipant(request);
    const query = new URL(request.url).searchParams;
    const generation = query.has("generation")
      ? z.coerce.number().int().nonnegative().parse(query.get("generation"))
      : undefined;
    return Response.json(unregisterUwbParticipant(session, generation), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
