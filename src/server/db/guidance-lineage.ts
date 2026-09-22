import type { Guidance } from "@gs-safety/contracts";
import { PersistenceError } from "./errors";

function primaryContext(guidance: Guidance): string {
  const {
    eventId: _eventId,
    guidanceVersion: _version,
    updateKind: _kind,
    supplementalExplanation: _explanation,
    evidence: _evidence,
    mode: _mode,
    ...context
  } = guidance;
  return JSON.stringify(context);
}

export function requireSupplementLineage(
  guidance: Guidance,
  previous: Guidance | null,
  primary: Guidance | null,
): void {
  const kind = guidance.updateKind;
  switch (kind) {
    case "primary":
      return;
    case "supplement":
      if (
        primary === null ||
        primary.updateKind !== "primary" ||
        previous?.primaryGuidanceVersion !== guidance.primaryGuidanceVersion ||
        primaryContext(primary) !== primaryContext(guidance)
      ) {
        throw new PersistenceError("CONFLICT", "Supplement primary context conflict");
      }
      return;
    default: {
      const exhaustive: never = kind;
      throw new PersistenceError("INVALID_RECORD", `Unknown guidance update kind: ${exhaustive}`);
    }
  }
}
