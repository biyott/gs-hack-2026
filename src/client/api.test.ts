import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { clientSnapshotFixture } from "./snapshot.test-support";

type FailureCase = { readonly status: number; readonly format: "json" | "html" };
let failure: FailureCase = { status: 401, format: "json" };
let origin = "";
let successBody: unknown;
const server = createServer((_request, response) => {
  if (successBody !== undefined) {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(successBody));
    return;
  }
  const structured = failure.format === "json";
  response.writeHead(failure.status, {
    "Content-Type": structured ? "application/json" : "text/html",
  });
  response.end(
    structured
      ? JSON.stringify({ error: { code: `DENIED_${failure.status}`, message: "Request denied" } })
      : "<h1>Request denied</h1>",
  );
});

class BrowserRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, origin) : input, init);
  }
}

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new TypeError("Expected TCP address");
  origin = `http://127.0.0.1:${address.port}`;
  // The Node test host needs the URL resolution a browser normally supplies.
  vi.stubGlobal("Request", BrowserRequest);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("shared client HTTP authorization errors", () => {
  it.each([
    { status: 401, format: "json" },
    { status: 403, format: "json" },
    { status: 401, format: "html" },
    { status: 403, format: "html" },
  ] satisfies readonly FailureCase[])(
    "preserves HTTP $status with a $format response body",
    async (fixture) => {
      // Given a real HTTP session endpoint returning the selected failure format.
      successBody = undefined;
      failure = fixture;
      // When the public client reads the session.
      const result = api.session();
      // Then the HTTP status survives and structured errors retain their server code.
      await expect(result).rejects.toMatchObject({
        name: "ApiFailure",
        status: fixture.status,
        code: fixture.format === "json" ? `DENIED_${fixture.status}` : "HTTP_ERROR",
      });
    },
  );
});

describe("client simulation wire boundary", () => {
  it("accepts explicit runtime UUID and sequence", async () => {
    successBody = clientSnapshotFixture;
    await expect(api.snapshot("equipment")).resolves.toMatchObject({
      streamId: clientSnapshotFixture.streamId,
      sequence: 10,
    });
  });
  it.each(["streamId", "sequence"] as const)(
    "rejects a successful HTTP body missing %s",
    async (field) => {
      const body: Record<string, unknown> = { ...clientSnapshotFixture };
      delete body[field];
      successBody = body;
      await expect(api.snapshot("equipment")).rejects.toMatchObject({
        code: "INVALID_RESPONSE",
        status: 502,
      });
    },
  );
  it("rejects persistence-only legacy ordering on the wire", async () => {
    successBody = { ...clientSnapshotFixture, streamId: "legacy" };
    await expect(api.snapshot("equipment")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
    });
  });
});
