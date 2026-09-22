import { EmptyState, StatusBadge } from "@/components/ui/primitives";
import type { InputSource, PositionObservation, TrackingSnapshot } from "@/contracts";
import {
  formatPoint,
  formatValue,
  observationCoordinates,
  observationStatus,
  timeText,
} from "./tracking-view";

type UwbObservation = TrackingSnapshot["uwbObservations"][number];

const inputSources = {
  live: { label: "실제 입력 / LIVE", tone: "info" },
  synthetic: { label: "합성 입력 / SYNTHETIC", tone: "synthetic" },
  unknown: { label: "입력 출처 미확인 / Unknown", tone: "offline" },
} as const;

function InputSourceBadge({ source }: { readonly source: InputSource }) {
  const { label, tone } = inputSources[source];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

function ObservationCells({
  observation,
  now,
}: {
  readonly observation: PositionObservation;
  readonly now: number;
}) {
  const status = observationStatus(observation, now);
  const coordinates = observationCoordinates(observation);
  return (
    <>
      <th scope="row">{observation.entityId}</th>
      <td>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        {observation.error ? <p className="observation-error">{observation.error}</p> : null}
      </td>
      <td>{observation.source === "camera-marker" ? "카메라 마커" : "UWB"}</td>
      <td>
        <InputSourceBadge source={observation.inputSource} />
      </td>
      <td className="mono">{formatPoint(coordinates.table)}</td>
      <td className="mono">{formatPoint(coordinates.world)}</td>
      <td>{formatValue(observation.uncertaintyTableM, "m")}</td>
      <td>{formatValue(observation.uncertaintyWorldM, "m")}</td>
      <td>{formatValue(status.ageMs, "ms", 0)}</td>
      <td>{timeText(observation.lastObservedAt)}</td>
    </>
  );
}

function PositionHeaders() {
  return (
    <>
      <th scope="col">대상</th>
      <th scope="col">상태</th>
      <th scope="col">관측 방식</th>
      <th scope="col">위치 입력 출처</th>
      <th scope="col">테이블 XY (m)</th>
      <th scope="col">월드 XY (m)</th>
      <th scope="col">테이블 불확실도</th>
      <th scope="col">월드 불확실도</th>
      <th scope="col">관측 경과</th>
      <th scope="col">마지막 관측</th>
    </>
  );
}

export function CameraObservationTable({
  observations,
  now,
}: {
  readonly observations: readonly PositionObservation[];
  readonly now: number;
}) {
  if (observations.length === 0)
    return (
      <EmptyState title="카메라 위치 관측 대기">
        프레임과 측정한 보정값이 있어야 마커 위치를 계산합니다.
      </EmptyState>
    );
  return (
    <section
      className="tracking-table-scroll"
      aria-label="카메라 위치 관측 표, 가로 스크롤"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the wide measurement table.
      tabIndex={0}
    >
      <table className="tracking-table">
        <caption>카메라 마커 위치 · 테이블 1cm = 월드 1m</caption>
        <thead>
          <tr>
            <PositionHeaders />
          </tr>
        </thead>
        <tbody>
          {observations.map((observation) => (
            <tr key={observation.entityId}>
              <ObservationCells observation={observation} now={now} />
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function UwbObservationTable({
  observations,
  now,
}: {
  readonly observations: readonly UwbObservation[];
  readonly now: number;
}) {
  if (observations.length === 0)
    return (
      <EmptyState title="UWB 관측 대기">
        거리·방위각·고도각은 기기에서 수신한 값만 표시합니다.
      </EmptyState>
    );
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the wide measurement table.
    <section className="tracking-table-scroll" aria-label="UWB 관측 표, 가로 스크롤" tabIndex={0}>
      <table className="tracking-table">
        <caption>
          UWB 측정 · 거리 입력과 위치 계산 출처를 구분 · 거리만 수신하면 XY 위치는 미확인
        </caption>
        <thead>
          <tr>
            <PositionHeaders />
            <th scope="col">거리 입력 출처</th>
            <th scope="col">거리: 테이블 (m)</th>
            <th scope="col">거리: 월드 (m)</th>
            <th scope="col">방위각 (rad)</th>
            <th scope="col">고도각 (rad)</th>
          </tr>
        </thead>
        <tbody>
          {observations.map((observation) => (
            <tr key={observation.entityId}>
              <ObservationCells observation={observation} now={now} />
              <td>
                <InputSourceBadge source={observation.rangeInputSource} />
              </td>
              <td>{formatValue(observation.tableDistanceM, "m")}</td>
              <td>{formatValue(observation.worldDistanceM, "m")}</td>
              <td>{formatValue(observation.azimuthRad, "rad")}</td>
              <td>{formatValue(observation.elevationRad, "rad")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
