import { createServer } from "node:http";
import ky from "ky";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseTrackingResponse } from "@/client/tracking-api";

const server = createServer((request, response) => {
  switch (request.url) {
    case "/html-error":
      response.writeHead(503, { "Content-Type": "text/html" });
      response.end("<h1>Unavailable</h1>");
      return;
    case "/json-error":
      response.writeHead(403, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Forbidden", details: null } }),
      );
      return;
    default:
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ schemaVersion: "unsupported" }));
  }
});
let origin = "";

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new TypeError("Expected TCP address");
  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("tracking HTTP response boundary", () => {
  it("preserves the unavailable status when the HTTP error body is HTML", async () => {
    // Given a real local HTTP endpoint returning an HTML failure body.
    const request = ky.get(`${origin}/html-error`, { retry: 0 });
    // When the tracking response boundary processes the failed response.
    const result = parseTrackingResponse(request);
    // Then the caller receives a typed status fallback rather than a JSON syntax failure.
    await expect(result).rejects.toMatchObject({
      name: "ApiFailure",
      code: "TRACKING_HTTP_ERROR",
      status: 503,
    });
  });

  it("preserves a structured authorization error from HTTP", async () => {
    // Given a real endpoint returning a denied request.
    const request = ky.get(`${origin}/json-error`, { retry: 0 });
    // When the response boundary parses it.
    const result = parseTrackingResponse(request);
    // Then status and authorization code remain available to the UI.
    await expect(result).rejects.toMatchObject({
      name: "ApiFailure",
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("rejects a successful HTTP response that violates the tracking contract", async () => {
    // Given an incompatible payload delivered with HTTP success.
    const request = ky.get(`${origin}/invalid-snapshot`, { retry: 0 });
    // When it crosses the tracking schema boundary.
    const result = parseTrackingResponse(request);
    // Then it is not accepted as telemetry.
    await expect(result).rejects.toMatchObject({
      name: "ApiFailure",
      code: "INVALID_TRACKING_RESPONSE",
      status: 502,
    });
  });
});
