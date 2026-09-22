import assert from "node:assert/strict";

const publish = (page, input) =>
  page.evaluate((value) => window.alertHarness.publish(value), input);
const events = (page) => page.evaluate(() => window.audioProbe.events);
const count = (log, kind) => log.filter((item) => item.kind === kind).length;

export async function runAudioScenarios(scenario) {
  await scenario("server observed clock ahead shortens local playback deadline", async (page) => {
    await publish(page, { observedAheadMs: 9000, expiresInMs: 10000 });
    await page.clock.runFor(181);
    assert.equal(await page.evaluate(() => window.audioProbe.active.speech), true);
    await page.clock.runFor(820);
    assert.equal(await page.evaluate(() => window.audioProbe.active.speech), false);
  });
  await scenario("expired new guidance does not begin audio", async (page) => {
    await publish(page, { expiresInMs: -1 });
    await page.clock.runFor(500);
    assert.equal(count(await events(page), "beep-start"), 0);
    assert.equal(count(await events(page), "speech-start"), 0);
    await page
      .getByTestId("status")
      .filter({ hasText: /^ready$/ })
      .waitFor({ timeout: 3000 });
  });
  await scenario("expiry between beep and speech prevents speech", async (page) => {
    await publish(page, { expiresInMs: 170 });
    await page.clock.runFor(181);
    assert.equal(count(await events(page), "beep-start"), 1);
    assert.equal(count(await events(page), "speech-start"), 0);
    await page
      .getByTestId("status")
      .filter({ hasText: /^ready$/ })
      .waitFor({ timeout: 3000 });
  });
  await scenario("expiry cancels currently speaking announcement", async (page) => {
    await publish(page, { expiresInMs: 250 });
    await page.clock.runFor(181);
    assert.equal(count(await events(page), "speech-start"), 1);
    await page.clock.runFor(70);
    assert.equal(await page.evaluate(() => window.audioProbe.active.speech), false);
    await page
      .getByTestId("status")
      .filter({ hasText: /^ready$/ })
      .waitFor({ timeout: 3000 });
  });
  await scenario("async audio resume cannot begin expired announcement", async (page) => {
    await page.evaluate(() => window.audioProbe.setDeferred(true));
    await publish(page, { expiresInMs: 50 });
    await page.clock.runFor(51);
    await page.evaluate(() => window.audioProbe.resumeAll());
    await page.clock.runFor(500);
    assert.equal(count(await events(page), "beep-start"), 0);
    assert.equal(count(await events(page), "speech-start"), 0);
    await page
      .getByTestId("status")
      .filter({ hasText: /^ready$/ })
      .waitFor({ timeout: 3000 });
  });
  await scenario("beep completes before speech without audio overlap", async (page) => {
    await publish(page, {});
    await page.clock.runFor(181);
    const log = await events(page);
    assert.deepEqual(
      log
        .filter((item) => ["beep-start", "beep-stop", "speech-start"].includes(item.kind))
        .map((item) => item.kind),
      ["beep-start", "beep-stop", "speech-start"],
    );
    assert.equal(
      log.some((item) => item.overlap),
      false,
    );
    assert.equal(
      log.find((item) => item.kind === "speech-start").at -
        log.find((item) => item.kind === "beep-start").at,
      180,
    );
  });
  await scenario("new primary replaces playing audio and ignores old callbacks", async (page) => {
    await publish(page, {});
    await page.clock.runFor(181);
    await publish(page, { primaryVersion: 2 });
    await page.clock.runFor(181);
    await page.evaluate(() => window.alertHarness.flush(() => window.audioProbe.finishCancelled()));
    const log = await events(page);
    assert.equal(count(log, "speech-start"), 2);
    assert.equal(
      log.some((item) => item.overlap),
      false,
    );
    assert.equal(
      log.some((item) => item.kind === "speech-cancel" && item.wasActive),
      true,
    );
    assert.equal(await page.getByTestId("status").textContent(), "playing");
  });
  await scenario("supplement updates do not replay the primary announcement", async (page) => {
    await publish(page, {});
    await page.clock.runFor(181);
    await publish(page, { supplement: true });
    await page.clock.runFor(500);
    assert.equal(count(await events(page), "beep-start"), 1);
    assert.equal(count(await events(page), "speech-start"), 1);
    assert.equal(await page.evaluate(() => window.audioProbe.active.speech), true);
    await page
      .getByTestId("status")
      .filter({ hasText: /^playing$/ })
      .waitFor({ timeout: 3000 });
    assert.equal(
      (await events(page)).some((item) => item.kind === "speech-cancel" && item.wasActive),
      false,
    );
  });
  await scenario("mute during beep cancels pending speech", async (page) => {
    await publish(page, {});
    await page.clock.runFor(100);
    await page.getByRole("button", { name: "Sound on" }).click();
    await page.clock.runFor(500);
    assert.equal(count(await events(page), "speech-start"), 0);
    assert.deepEqual(await page.evaluate(() => window.audioProbe.active), {
      speech: false,
      beeps: 0,
    });
    await page
      .getByTestId("status")
      .filter({ hasText: /^muted$/ })
      .waitFor({ timeout: 3000 });
  });
  await scenario("mute cancels speech already playing", async (page) => {
    await publish(page, {});
    await page.clock.runFor(181);
    await page.getByRole("button", { name: "Sound on" }).click();
    assert.equal(await page.evaluate(() => window.audioProbe.active.speech), false);
  });
  await scenario("new run cancels speech and establishes a silent baseline", async (page) => {
    await publish(page, {});
    await page.clock.runFor(181);
    await page.evaluate(() => window.audioProbe.clear());
    await publish(page, { runId: "run-restarted" });
    await page.clock.runFor(500);
    assert.equal(await page.evaluate(() => window.audioProbe.active.speech), false);
    assert.equal(count(await events(page), "beep-start"), 0);
    assert.equal(count(await events(page), "speech-start"), 0);
  });
  await scenario("reconnect cancels speech and silently baselines missed updates", async (page) => {
    await publish(page, {});
    await page.clock.runFor(181);
    await page.evaluate(() => {
      window.audioProbe.clear();
      window.alertHarness.reconnect();
    });
    assert.equal(await page.evaluate(() => window.audioProbe.active.speech), false);
    await publish(page, { primaryVersion: 2 });
    await page.clock.runFor(500);
    assert.equal(count(await events(page), "speech-start"), 0);
    await publish(page, { primaryVersion: 3 });
    await page.clock.runFor(181);
    assert.equal(count(await events(page), "speech-start"), 1);
  });
  await scenario("unmount cancels pending speech and closes its audio context", async (page) => {
    await publish(page, {});
    await page.clock.runFor(100);
    await page.evaluate(() => window.alertHarness.unmount());
    await page.clock.runFor(500);
    assert.equal(count(await events(page), "speech-start"), 0);
    assert.equal(count(await events(page), "context-close"), 1);
    assert.deepEqual(await page.evaluate(() => window.audioProbe.active), {
      speech: false,
      beeps: 0,
    });
  });
  for (const trigger of ["focus", "visibilitychange"]) {
    await scenario(
      `${trigger} revalidates expiry after wall clock jumps without timers`,
      async (page) => {
        await publish(page, { expiresInMs: 500 });
        await page.clock.runFor(181);
        assert.equal(await page.evaluate(() => window.audioProbe.active.speech), true);
        await page.clock.setSystemTime(new Date("2026-09-21T12:00:01.000Z"));
        await page.evaluate((event) => {
          const target = event === "focus" ? window : document;
          target.dispatchEvent(new Event(event));
        }, trigger);
        assert.equal(await page.evaluate(() => window.audioProbe.active.speech), false);
        await page
          .getByTestId("status")
          .filter({ hasText: /^ready$/ })
          .waitFor({ timeout: 3000 });
      },
    );
  }
  for (const boundary of ["mute", "reconnect", "new-run", "unmount"]) {
    await scenario(`${boundary} invalidates pending asynchronous audio resume`, async (page) => {
      await page.evaluate(() => window.audioProbe.setDeferred(true));
      await publish(page, {});
      switch (boundary) {
        case "mute":
          await page.getByRole("button", { name: "Sound on" }).click();
          break;
        case "reconnect":
          await page.evaluate(() => window.alertHarness.reconnect());
          break;
        case "new-run":
          await publish(page, { runId: "run-restarted" });
          break;
        case "unmount":
          await page.evaluate(() => window.alertHarness.unmount());
          break;
        default:
          throw new Error(`Unknown test boundary: ${boundary}`);
      }
      await page.evaluate(() => window.audioProbe.resumeAll());
      await page.clock.runFor(500);
      assert.equal(count(await events(page), "beep-start"), 0);
      assert.equal(count(await events(page), "speech-start"), 0);
    });
  }
  for (const elapsed of [100, 181]) {
    await scenario(`pause at ${elapsed}ms cancels audio and resume stays silent`, async (page) => {
      await publish(page, {});
      await page.clock.runFor(elapsed);
      await publish(page, { runStatus: "paused" });
      await page.clock.runFor(500);
      assert.deepEqual(await page.evaluate(() => window.audioProbe.active), {
        speech: false,
        beeps: 0,
      });
      await publish(page, { runStatus: "running" });
      await page.clock.runFor(500);
      assert.equal(count(await events(page), "beep-start"), 1);
      assert.equal(count(await events(page), "speech-start"), elapsed > 180 ? 1 : 0);
    });
  }
  for (const supportStatus of ["assigned", "accepted", "completed"]) {
    await scenario(
      `support ${supportStatus} cancels the pending support-assignment prompt`,
      async (page) => {
        await publish(page, {});
        await page.clock.runFor(181);
        await publish(page, { helpRequested: true });
        await page.clock.runFor(181);
        assert.equal(await page.evaluate(() => window.audioProbe.active.speech), true);
        await publish(page, { helpRequested: true, supportStatus });
        await page.clock.runFor(500);
        assert.equal(await page.evaluate(() => window.audioProbe.active.speech), false);
        assert.equal(count(await events(page), "speech-start"), 2);
      },
    );
  }
}
