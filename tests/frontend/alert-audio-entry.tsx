import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { SimulationWireSnapshotSchema } from "@/contracts";
import { useConsoleStore } from "../../src/client/store";
import { useAlertAudio } from "../../src/client/use-alert-audio";
import {
  guidanceFixture,
  runFixture,
  snapshotWithGuidance,
} from "../../src/server/db/fixtures.test-support";

type GuidanceInput = {
  readonly expiresInMs?: number;
  readonly primaryVersion?: number;
  readonly supplement?: boolean;
  readonly runId?: string;
  readonly runStatus?: "idle" | "running" | "paused" | "completed";
  readonly helpRequested?: boolean;
  readonly observedAheadMs?: number;
  readonly supportStatus?: "none" | "requested" | "assigned" | "accepted" | "completed";
  readonly empty?: boolean;
};

declare global {
  interface Window {
    alertHarness: {
      readonly publish: (input?: GuidanceInput) => void;
      readonly reconnect: () => void;
      readonly unmount: () => void;
      readonly flush: (callback: () => void) => void;
    };
  }
}

let sequence = 0;
let epoch = useConsoleStore.getState().beginConnection();
function publish(input: GuidanceInput = {}) {
  const primaryVersion = input.primaryVersion ?? 1;
  const guidance = {
    ...guidanceFixture(),
    runId: input.runId ?? "run-equipment",
    guidanceVersion: primaryVersion + (input.supplement ? 1 : 0),
    primaryGuidanceVersion: primaryVersion,
    updateKind: input.supplement ? ("supplement" as const) : ("primary" as const),
    mode: input.supplement ? ("rag-assisted" as const) : ("template" as const),
    supplementalExplanation: input.supplement ? "Additional context" : null,
    evidence: input.supplement
      ? [{ documentId: "doc", documentVersion: "1", chunkId: "chunk" }]
      : [],
    generatedAt: new Date(Date.now() - 60_000).toISOString(),
    expiresAt: new Date(Date.now() + (input.expiresInMs ?? 10_000)).toISOString(),
  };
  const fixture = input.empty ? runFixture() : snapshotWithGuidance(guidance);
  const snapshot = SimulationWireSnapshotSchema.parse({
    ...fixture,
    streamId: "ec7a9958-095f-4483-a937-a4d4d3ff7ecb",
    sequence: ++sequence,
    incidents: fixture.incidents.map((incident) => ({
      ...incident,
      runId: guidance.runId,
      supportStatus: input.supportStatus ?? "none",
      assignedTo: input.supportStatus ? "support" : null,
    })),
    workers: !input.empty
      ? [
          {
            workerId: guidance.workerId,
            profile: guidance.profileSnapshot,
            position: { x: 0, y: 0 },
            positionSource: "mock",
            positionInputSource: "synthetic",
            positionStatus: "known",
            lastObservedAt: new Date().toISOString(),
            currentGuidance: guidance,
            response: {
              receivedAt: null,
              displayedAt: null,
              spokenAt: null,
              understoodAt: null,
              helpRequestedAt: input.helpRequested ? "2026-09-21T12:00:00.000Z" : null,
              arrivedAt: null,
              voiceStatus: "pending",
            },
            virtual: true,
          },
        ]
      : [],
    run: {
      ...fixture.run,
      runId: input.runId ?? "run-equipment",
      status: input.runStatus ?? "running",
      updatedAt: new Date(Date.now() + (input.observedAheadMs ?? 0)).toISOString(),
    },
  });
  flushSync(() => useConsoleStore.getState().acceptSnapshot(snapshot, epoch));
}
function Harness() {
  const status = useAlertAudio();
  const enabled = useConsoleStore((state) => state.soundEnabled);
  return (
    <main>
      <h1>Alert audio lifecycle harness</h1>
      <p>Synthetic audio boundary instrumentation</p>
      <button type="button" onClick={() => useConsoleStore.getState().toggleSound()}>
        Sound {enabled ? "on" : "off"}
      </button>
      <output data-testid="status">{status}</output>
    </main>
  );
}
const element = document.getElementById("root");
if (!element) throw new Error("Missing harness mount");
const root = createRoot(element);
flushSync(() => root.render(<Harness />));
window.alertHarness = {
  publish,
  flush(callback) {
    flushSync(callback);
  },
  reconnect() {
    flushSync(() => {
      epoch = useConsoleStore.getState().beginConnection();
    });
  },
  unmount() {
    flushSync(() => root.unmount());
  },
};
