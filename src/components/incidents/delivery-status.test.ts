import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AuditEvent } from "@/contracts";
import { guidance, incident, snapshot } from "@/server/incidents/test-fixtures";
import { DeliveryStatus } from "./delivery-status";

function attempt(
  count: Readonly<{ connectedSubscriptions: number }> | Readonly<{ connectedRecipients: number }>,
): AuditEvent {
  return {
    eventId: "transmission-1",
    incidentId: guidance.incidentId,
    runId: guidance.runId,
    kind: "guidance.transmission-attempt",
    actorId: "engine",
    occurredAt: guidance.generatedAt,
    version: incident.version,
    detail: JSON.stringify({
      workerId: guidance.workerId,
      guidanceId: guidance.guidanceId,
      guidanceVersion: guidance.guidanceVersion,
      transport: "sse",
      ...count,
    }),
  };
}

describe("transmission and receipt presentation", () => {
  it.each([
    ["pending", "음성 실행 기록 없음"],
    ["playing", "음성 재생 중"],
    ["stop-requested", "중지 요청 · 기기 확인 없음"],
    ["completed", "음성 완료"],
    ["failed", "음성 실행 실패"],
    ["unsupported", "음성 지원 불가"],
    ["cancelled", "음성 취소"],
  ] as const)(
    "renders %s voice status without inferring a device outcome",
    (voiceStatus, label) => {
      const output = renderToStaticMarkup(
        createElement(DeliveryStatus, {
          guidance,
          incident,
          events: [],
          worker: snapshot.workers.map((worker) => ({
            ...worker,
            response: { ...worker.response, voiceStatus },
          }))[0],
        }),
      );
      expect(output).toContain(`<dt>음성 상태</dt><dd>${label}</dd>`);
      expect(output).toContain("<dt>기기 수신</dt><dd>기록 없음</dd>");
      expect(output).toContain("<dt>내용 이해</dt><dd>기록 없음</dd>");
    },
  );

  it("shows SSE subscriptions while device receipt remains unconfirmed", () => {
    const events = [attempt({ connectedSubscriptions: 4 })];
    const output = renderToStaticMarkup(
      createElement(DeliveryStatus, {
        guidance,
        incident,
        events,
        worker: snapshot.workers[0],
      }),
    );
    expect(output).toMatch(/<dt>전송 시도<\/dt><dd>[^<]*SSE 연결 4개/);
    expect(output).toMatch(/<dt>기기 수신<\/dt><dd>기록 없음<\/dd>/);
    expect(output).toMatch(/<dt>내용 이해<\/dt><dd>기록 없음<\/dd>/);
  });

  it("labels old count fields as historical records", () => {
    const events = [attempt({ connectedRecipients: 2 })];
    const output = renderToStaticMarkup(
      createElement(DeliveryStatus, {
        guidance,
        incident,
        events,
        worker: snapshot.workers[0],
      }),
    );
    expect(output).toMatch(/<dt>전송 시도<\/dt><dd>[^<]*SSE 연결 2개[^<]*과거 형식 기록/);
  });
});
