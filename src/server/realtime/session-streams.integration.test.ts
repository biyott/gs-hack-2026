import { describe, expect, it } from "vitest";
import { DELETE, POST } from "../../../app/api/session/route";
import { fixture, loginRequest, openStream } from "./session-streams.test-support";

describe("immediate authenticated stream cleanup", () => {
  it("unsubscribes immediately when its session logs out without a later snapshot or heartbeat", async () => {
    // Given
    const f = fixture();
    const session = f.login();
    const stream = openStream(session);
    await stream.reader.read();
    // When
    const response = DELETE(
      new Request("http://localhost/api/session", {
        method: "DELETE",
        headers: { authorization: `Bearer ${session.token}` },
      }),
    );
    // Then
    expect(response.status).toBe(204);
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect((await stream.reader.read()).done).toBe(true);
  });

  it("unsubscribes a displaced device slot immediately when its account logs in again", async () => {
    // Given
    const f = fixture();
    const session = f.login();
    const stream = openStream(session);
    await stream.reader.read();
    // When
    const response = await POST(loginRequest());
    // Then
    expect(response.status).toBe(200);
    expect(f.auth.authenticate(session.token) === null).toBe(true);
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect((await stream.reader.read()).done).toBe(true);
  });

  it("closes the previous account session immediately when a browser switches accounts", async () => {
    // Given
    const f = fixture();
    const session = f.login("admin", "admin");
    const stream = openStream(session);
    await stream.reader.read();
    // When
    const response = await POST(loginRequest("operator", "operator", session));
    // Then
    expect(response.status).toBe(200);
    expect(f.runtime.bus.count("equipment")).toBe(0);
    expect(f.auth.authenticate(session.token) === null).toBe(true);
    expect((await stream.reader.read()).done).toBe(true);
  });
});
