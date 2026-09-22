import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { assertEvents, monitor } from "./valid-route-browser.mjs";

const baseUrl = "http://localhost:3100";
function setup(mode = "fire-gas") {
  const page = new EventEmitter();
  const state = monitor(page, { baseUrl, mode });
  return { page, state };
}
function request(overrides = {}) {
  const values = { url: `${baseUrl}/api/events?mode=equipment`, method: "GET", error: "net::ERR_ABORTED", ...overrides };
  return { url: () => values.url, method: () => values.method, failure: () => ({ errorText: values.error }) };
}
function startup(session, overrides) {
  const stream = request(overrides);
  session.state.phase = "login";
  session.page.emit("request", stream);
  session.state.phase = "selecting-mode";
  session.page.emit("requestfailed", stream);
  return session.state.events.at(-1);
}

test("accepts the startup equipment stream closing during deliberate fire-gas selection", () => {
  const session = setup();
  const event = startup(session);
  assert.equal(event.expected, true);
  assert.equal(event.reason, "startup-equipment-stream-closed-for-fire-gas-selection");
  assert.doesNotThrow(() => assertEvents(session.state));
});

test("startup cancellation leaves a separate once-only allowance for closing the active mode", () => {
  const session = setup();
  startup(session);
  session.state.phase = "observing";
  const active = request({ url: `${baseUrl}/api/events?mode=fire-gas` });
  session.page.emit("request", active);
  session.state.phase = "closing";
  session.page.emit("requestfailed", active);
  assert.deepEqual(session.state.events.map((event) => event.expected), [true, true]);
  assert.equal(session.state.events.at(-1).reason, "current-mode-stream-closed-during-context-cleanup");
  assert.doesNotThrow(() => assertEvents(session.state));
});

test("rejects a second startup cancellation", () => {
  const session = setup();
  startup(session);
  session.page.emit("requestfailed", request());
  assert.equal(session.state.events.at(-1).expected, false);
  assert.throws(() => assertEvents(session.state), /Unexpected/);
});

for (const [name, override] of [
  ["wrong mode", { url: `${baseUrl}/api/events?mode=fire-gas` }],
  ["wrong origin", { url: "http://example.invalid/api/events?mode=equipment" }],
  ["wrong path", { url: `${baseUrl}/api/simulation?mode=equipment` }],
  ["additional query", { url: `${baseUrl}/api/events?mode=equipment&other=1` }],
  ["wrong method", { method: "POST" }],
  ["other network error", { error: "net::ERR_CONNECTION_CLOSED" }],
]) {
  test(`rejects startup failure with ${name}`, () => {
    const session = setup();
    assert.equal(startup(session, override).expected, false);
    assert.throws(() => assertEvents(session.state), /Unexpected/);
  });
}

for (const phase of ["warming", "login", "observing", "closing"]) {
  test(`rejects startup equipment cancellation during ${phase}`, () => {
    const session = setup();
    const stream = request();
    session.page.emit("request", stream);
    session.state.phase = phase;
    session.page.emit("requestfailed", stream);
    assert.equal(session.state.events.at(-1).expected, false);
  });
}

test("rejects startup cancellation when selecting the already-default equipment mode", () => {
  const session = setup("equipment");
  assert.equal(startup(session).expected, false);
});

test("rejects duplicate active-mode close cancellation", () => {
  const session = setup("equipment");
  const stream = request();
  session.page.emit("request", stream);
  session.state.phase = "closing";
  session.page.emit("requestfailed", stream);
  session.page.emit("requestfailed", stream);
  assert.deepEqual(session.state.events.map((event) => event.expected), [true, false]);
});

test("keeps later page errors failing after an accepted startup cancellation", () => {
  const session = setup();
  startup(session);
  session.state.phase = "observing";
  session.page.emit("pageerror", new Error("Unexpected render failure"));
  assert.throws(() => assertEvents(session.state), /Unexpected/);
  assert.equal(session.state.events.at(-1).expected, false);
});
