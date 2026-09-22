import { describe, expect, it } from "vitest";
import { enforceSameOrigin } from "./security";

describe("browser mutation origins", () => {
  it("accepts the real Host when Next binds its internal URL to all interfaces", () => {
    const request = new Request("http://0.0.0.0:3000/api/session", {
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    });
    expect(() => enforceSameOrigin(request)).not.toThrow();
  });
  it.each([
    "http://evil.example:3000",
    "http://localhost.evil.example:3000",
    "null",
    "https://localhost:3000",
  ])("rejects foreign origin %s", (origin) => {
    const request = new Request("http://0.0.0.0:3000/api/session", {
      headers: { host: "localhost:3000", origin },
    });
    expect(() => enforceSameOrigin(request)).toThrow();
  });
});
