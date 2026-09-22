import { describe, expect, it } from "vitest";
import { voiceLabel } from "./worker-copy";

describe("reported voice status copy", () => {
  it("distinguishes a stop request from confirmed device cancellation in both locales", () => {
    expect(voiceLabel("stop-requested", "ko")).toBe("중지 요청 · 기기 확인 없음");
    expect(voiceLabel("stop-requested", "en")).toBe("Stop requested · device unconfirmed");
    expect(voiceLabel("cancelled", "ko")).toBe("재생 취소");
    expect(voiceLabel("completed", "en")).toBe("Completed");
  });
});
