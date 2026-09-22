import { type SimulationMode, SimulationWireSnapshotSchema } from "@/contracts";
import { api, errorMessage } from "./api";
import { useConsoleStore } from "./store";

export function openSimulationStream(mode: SimulationMode): () => void {
  let active = true;
  const store = useConsoleStore.getState;
  store().setConnection("connecting");
  let connectionEpoch = store().beginConnection();
  const refresh = () => {
    void api
      .snapshot(mode)
      .then((snapshot) => {
        if (active) store().acceptSnapshot(snapshot);
      })
      .catch((error: unknown) => {
        if (active) {
          store().setError(errorMessage(error));
          store().setConnection("offline");
        }
      });
  };
  refresh();
  const events = new EventSource(`/api/events?mode=${encodeURIComponent(mode)}`);
  events.addEventListener("snapshot", (event: MessageEvent<string>) => {
    if (!active) return;
    try {
      store().acceptSnapshot(
        SimulationWireSnapshotSchema.parse(JSON.parse(event.data)),
        connectionEpoch,
      );
    } catch (error) {
      if (error instanceof Error) store().setError(`실시간 상태 검증 실패: ${error.message}`);
      else throw error;
    }
  });
  events.onopen = () => {
    if (active) {
      connectionEpoch = store().beginConnection();
      store().setConnection("connected");
    }
  };
  events.onerror = () => {
    if (active) store().setConnection("reconnecting");
  };
  const visibility = () => {
    if (document.visibilityState === "visible") refresh();
  };
  document.addEventListener("visibilitychange", visibility);
  return () => {
    active = false;
    events.close();
    document.removeEventListener("visibilitychange", visibility);
  };
}
