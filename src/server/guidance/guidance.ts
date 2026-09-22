import type { Guidance, WorkerProfile } from "@/contracts";
import type { EngineDecision } from "../engine";
import { resolveGuidanceLocale } from "./localization";
import { getActionMessage, getMessageKey, TEMPLATE_CATALOG_VERSION } from "./templates";

export type GuidanceContext = Readonly<
  Pick<
    Guidance,
    | "incidentId"
    | "eventId"
    | "runId"
    | "simulationMode"
    | "mapId"
    | "mapVersion"
    | "floorId"
    | "routeVersion"
    | "stepId"
    | "generatedAt"
    | "expiresAt"
  >
> & {
  readonly profile: WorkerProfile;
  readonly messageArgs?: Guidance["messageArgs"];
  readonly forceReissue?: boolean;
};

export class GuidanceBuildError extends Error {
  readonly code = "INVALID_ROUTE";

  constructor() {
    super("A route instruction requires matching validated route, destination, version and step.");
    this.name = "GuidanceBuildError";
  }
}

function freezeValue(value: unknown): void {
  if (typeof value !== "object" || value === null) return;
  for (const child of Object.values(value)) freezeValue(child);
  Object.freeze(value);
}

function immutableSnapshot(guidance: Guidance): Guidance {
  const snapshot = structuredClone(guidance);
  freezeValue(snapshot);
  return snapshot;
}

function isDeeplyFrozen(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeeplyFrozen);
}

function semanticKey(guidance: Guidance): string {
  const {
    guidanceId: _guidanceId,
    guidanceVersion: _guidanceVersion,
    eventId: _eventId,
    updateKind: _updateKind,
    primaryGuidanceVersion: _primaryGuidanceVersion,
    generatedAt: _generatedAt,
    expiresAt: _expiresAt,
    supplementalExplanation: _explanation,
    evidence: _evidence,
    mode: _mode,
    waypoints,
    ...semanticContent
  } = guidance;
  const routeIdentity = waypoints.map((point, index) =>
    index === 0 && point.nodeId === "WORKER-POSITION"
      ? { nodeId: point.nodeId, floorId: point.floorId }
      : point,
  );
  return JSON.stringify(
    { ...semanticContent, waypoints: routeIdentity },
    (_key: string, value: unknown): unknown => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
      return Object.fromEntries(
        Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
      );
    },
  );
}

export function createGuidance(
  decision: EngineDecision,
  context: GuidanceContext,
  previous: Guidance | null = null,
): Guidance {
  const isRoute = decision.actionCode === "FOLLOW_VALIDATED_ROUTE";
  const route = isRoute ? decision.route : null;
  if (
    isRoute &&
    (route === null ||
      route.waypoints.length < 2 ||
      route.destinationId !== decision.destinationId ||
      context.routeVersion === null ||
      context.stepId === null)
  ) {
    throw new GuidanceBuildError();
  }
  const destinationId = route?.destinationId ?? null;
  const localeSelection = resolveGuidanceLocale(context.profile.preferredLocale);
  const actionMessage = getActionMessage(
    decision.actionCode,
    localeSelection.locale,
    destinationId,
  );
  const koreanMessage = getActionMessage(decision.actionCode, "ko", destinationId);
  const messageKey = getMessageKey(decision.actionCode);
  const guidanceId = `GUIDANCE:${[context.runId, context.incidentId, context.profile.workerId].map(encodeURIComponent).join(":")}`;
  const sameLineage =
    previous !== null &&
    previous.runId === context.runId &&
    previous.incidentId === context.incidentId &&
    previous.workerId === context.profile.workerId;
  const guidanceVersion = sameLineage ? previous.guidanceVersion + 1 : 1;
  const { destinationId: _staleDestination, ...contextArgs } = context.messageArgs ?? {};
  const messageArgs: Guidance["messageArgs"] = {
    ...contextArgs,
    reasonCode: decision.reasonCode,
    assistanceRequired: decision.assistanceRequired,
    ...(destinationId === null ? {} : { destinationId }),
  };
  const guidance: Guidance = {
    incidentId: context.incidentId,
    eventId: context.eventId,
    runId: context.runId,
    workerId: context.profile.workerId,
    guidanceId: sameLineage ? previous.guidanceId : guidanceId,
    guidanceVersion,
    updateKind: "primary",
    primaryGuidanceVersion: guidanceVersion,
    simulationMode: context.simulationMode,
    hazardIds: [...new Set(decision.hazardIds)].sort(),
    hazardType: decision.hazardType,
    priority: decision.priority,
    actionCode: decision.actionCode,
    routeVersion: route === null ? null : context.routeVersion,
    stepId: route === null ? null : context.stepId,
    mapId: context.mapId,
    mapVersion: context.mapVersion,
    floorId: context.floorId,
    waypoints: route === null ? [] : [...route.waypoints],
    destinationId,
    profileVersion: context.profile.version,
    profileSnapshot: context.profile,
    ...localeSelection,
    templateCatalogVersion: TEMPLATE_CATALOG_VERSION,
    messageKey,
    primaryMessageKey: messageKey,
    messageArgs,
    primaryMessage: `${localeSelection.fallbackLocaleUsed ? "⚠ " : ""}${actionMessage}`,
    managerExplanationKo: localeSelection.fallbackLocaleUsed
      ? `요청 언어를 지원하지 않아 영어 대체 안내를 보냈습니다. ${koreanMessage}`
      : koreanMessage,
    supplementalExplanation: null,
    evidence: [],
    mode: "template",
    generatedAt: context.generatedAt,
    expiresAt: context.expiresAt,
  };
  if (
    sameLineage &&
    !context.forceReissue &&
    Date.parse(context.generatedAt) < Date.parse(previous.expiresAt) &&
    semanticKey(previous) === semanticKey(guidance)
  ) {
    return isDeeplyFrozen(previous) ? previous : immutableSnapshot(previous);
  }
  return immutableSnapshot(guidance);
}

export function preserveFirstGuidance(first: Guidance | null, current: Guidance): Guidance {
  return immutableSnapshot(first ?? current);
}

export const buildGuidance = createGuidance;
