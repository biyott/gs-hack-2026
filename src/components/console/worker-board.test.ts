import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { snapshot } from "@/server/incidents/test-fixtures";
import { WorkerBoard } from "./worker-board";

function render(state: SimulationSnapshot) {
  return renderToStaticMarkup(createElement(WorkerBoard, { snapshot: state }));
}

describe("worker board regression", () => {
  it("preserves worker selection structure, guidance and preview link", () => {
    const output = render(snapshot);
    expect(output).toContain('class="worker-list"');
    expect(output).toContain('class="worker-card-heading"');
    expect(output).toContain('aria-pressed="true"');
    expect(output).toContain('lang="en">Move to REFUGE-A.');
    expect(output).toContain('href="/worker"');
  });

  it("does not infer understanding from device receipt", () => {
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        response: { ...worker.response, receivedAt: snapshot.run.updatedAt },
      })),
    };
    const output = render(state);
    expect(output).toMatch(/<dt>기기 수신<\/dt><dd[^>]*>수신<\/dd>/);
    expect(output).toMatch(/<dt>이해 확인<\/dt><dd[^>]*>미확인<\/dd>/);
  });

  it("does not expose stale coordinates as a current position", () => {
    const state: SimulationSnapshot = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        positionStatus: "stale",
        position: { x: 12.5, y: 24.5 },
      })),
    };
    const output = render(state);
    expect(output).not.toContain("(12.5, 24.5) m");
    expect(output).toContain("오래된 위치");
  });
});

describe("worker state truthfulness", () => {
  it.each([
    ["pending", "실행 기록 없음"],
    ["playing", "재생 중"],
    ["stop-requested", "중지 요청 · 기기 확인 없음"],
    ["completed", "완료"],
    ["failed", "실패"],
    ["unsupported", "미지원"],
    ["cancelled", "취소"],
  ] as const)(
    "renders %s voice status without inferring a device outcome",
    (voiceStatus, label) => {
      const state: SimulationSnapshot = {
        ...snapshot,
        workers: snapshot.workers.map((worker) => ({
          ...worker,
          response: { ...worker.response, voiceStatus },
        })),
      };
      const output = render(state);
      expect(output).toContain(`<dt>음성 실행</dt><dd>${label}</dd>`);
      expect(output).toMatch(/<dt>기기 수신<\/dt><dd[^>]*>미확인<\/dd>/);
      expect(output).toMatch(/<dt>이해 확인<\/dt><dd[^>]*>미확인<\/dd>/);
    },
  );

  it.each([
    ["video", "synthetic", "합성 입력"],
    ["uwb", "synthetic", "합성 입력"],
    ["video", "live", "실제 장치 입력"],
    ["uwb", "live", "실제 장치 입력"],
    ["video", "unknown", "출처 미확인"],
    ["uwb", "unknown", "출처 미확인"],
  ] as const)(
    "separates %s technique from %s position origin",
    (positionSource, positionInputSource, label) => {
      const state: SimulationSnapshot = {
        ...snapshot,
        workers: snapshot.workers.map((worker) => ({
          ...worker,
          virtual: false,
          positionSource,
          positionInputSource,
        })),
      };
      const output = render(state);
      expect(output).toContain(label);
      expect(output).toContain("(10.0, 10.0) m");
      expect(output).not.toContain("실측 작업자");
    },
  );

  it("distinguishes support acceptance from the worker help request", () => {
    const state: SimulationSnapshot = {
      ...snapshot,
      incidents: snapshot.incidents.map((incident) => ({
        ...incident,
        assignedTo: "support",
        supportStatus: "accepted",
      })),
    };
    const output = render(state);
    expect(output).toContain("지원 수락");
    expect(output).toMatch(/<dt>도착 확인<\/dt><dd[^>]*>미확인<\/dd>/);
  });

  it("distinguishes manual positions from measurements", () => {
    const state: SimulationSnapshot = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        virtual: false,
        positionSource: "manual",
      })),
    };
    const output = render(state);
    expect(output).toContain("수동 입력");
    expect(output).not.toContain("실측 작업자");
  });

  it("preserves unknown preferred locale independently from the fallback locale", () => {
    const state: SimulationSnapshot = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        profile: { ...worker.profile, preferredLocale: null },
      })),
    };
    const output = render(state);
    expect(output).toContain("선호 언어 미확인");
  });

  it("removes an expired primary action from the current worker card", () => {
    const state = { ...snapshot, run: { ...snapshot.run, updatedAt: "2026-09-21T09:02:00.000Z" } };
    const output = render(state);
    expect(output).not.toContain("Move to REFUGE-A.");
    expect(output).toContain("안내 유효기간 만료");
  });

  it("keeps help requests visible independently from arrival", () => {
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        response: {
          ...worker.response,
          helpRequestedAt: snapshot.run.updatedAt,
          arrivedAt: snapshot.run.updatedAt,
        },
      })),
    };
    const output = render(state);
    expect(output).toMatch(/class="worker-card [^"]*worker-help/);
  });
});
