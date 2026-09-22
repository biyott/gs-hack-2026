import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkerProfile } from "@/contracts";
import { profile, snapshot } from "@/server/incidents/test-fixtures";
import { ProfileEditor, parseProfileForm } from "./profile-editor";

function formFor(value: WorkerProfile): FormData {
  const form = new FormData();
  form.set("preferredLocale", value.preferredLocale ?? "");
  for (const name of ["canUseStairs", "needsAssistance", "needsCompanion"] as const)
    form.set(name, value[name] === null ? "unknown" : String(value[name]));
  form.set("speedMin", value.speedMps === null ? "" : String(value.speedMps.min));
  form.set("speedMax", value.speedMps === null ? "" : String(value.speedMps.max));
  form.set("voice", String(value.notificationPreferences.voice));
  form.set("vibration", String(value.notificationPreferences.vibration));
  return form;
}

afterEach(() => vi.useRealTimers());

describe("profile form boundary", () => {
  it("preserves explicit unknown fields and actual notification preferences", () => {
    // Given
    const unknown: WorkerProfile = {
      ...profile,
      preferredLocale: null,
      canUseStairs: null,
      needsAssistance: null,
      needsCompanion: null,
      speedMps: null,
      confirmedAt: null,
      notificationPreferences: { voice: false, vibration: true },
    };
    // When
    const result = parseProfileForm(formFor(unknown), unknown);
    // Then
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      preferredLocale: null,
      canUseStairs: null,
      needsAssistance: null,
      needsCompanion: null,
      speedMps: null,
      notificationPreferences: { voice: false, vibration: true },
    });
  });

  it("preserves an unsupported requested locale during an unrelated edit", () => {
    // Given
    const existing: WorkerProfile = { ...profile, preferredLocale: "vi-VN" };
    const form = formFor(existing);
    form.set("needsCompanion", "false");
    // When
    const result = parseProfileForm(form, existing);
    // Then
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      preferredLocale: "vi-VN",
      locale: "en",
      needsCompanion: false,
    });
  });

  it.each(["ko", "en"] as const)("selects the supported locale %s explicitly", (locale) => {
    // Given
    const form = formFor(profile);
    form.set("preferredLocale", locale);
    // When
    const result = parseProfileForm(form, profile);
    // Then
    expect(result.success && result.data.locale).toBe(locale);
  });

  it("confirms one new profile version without changing its source", () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T12:00:00Z"));
    const existing = structuredClone(profile);
    // When
    const result = parseProfileForm(formFor(existing), existing);
    // Then
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      workerId: profile.workerId,
      version: profile.version + 1,
      confirmedAt: "2026-09-21T12:00:00.000Z",
    });
    expect(existing).toEqual(profile);
  });

  it("accepts zero minimum speed with a positive maximum", () => {
    // Given
    const form = formFor(profile);
    form.set("speedMin", "0");
    form.set("speedMax", "0.2");
    // When
    const result = parseProfileForm(form, profile);
    // Then
    expect(result.success && result.data.speedMps).toEqual({ min: 0, max: 0.2 });
  });

  it.each([
    ["", "1"],
    ["0", ""],
    ["-1", "1"],
    ["0", "0"],
    ["2", "1"],
    ["invalid", "1"],
    ["0", "Infinity"],
    [" ", "1"],
  ])("rejects invalid or partial speed bounds %s / %s", (min, max) => {
    // Given
    const form = formFor(profile);
    form.set("speedMin", min);
    form.set("speedMax", max);
    // When
    const result = parseProfileForm(form, profile);
    // Then
    expect(result.success).toBe(false);
  });

  it.each(["canUseStairs", "needsAssistance", "needsCompanion", "voice", "vibration"])(
    "rejects an invalid boolean selection for %s",
    (name) => {
      // Given
      const form = formFor(profile);
      form.set(name, "invalid");
      // When
      const result = parseProfileForm(form, profile);
      // Then
      expect(result.success).toBe(false);
    },
  );
});

describe("profile editor rendering", () => {
  const worker = snapshot.workers[0];
  if (!worker) throw new Error("Worker fixture required");

  it("renders unknown selection, complete fields and explicit submission", () => {
    // Given
    const selected = { ...worker, profile: { ...worker.profile, preferredLocale: null } };
    // When
    const html = renderToStaticMarkup(createElement(ProfileEditor, { selected, canEdit: true }));
    // Then
    expect(html).toContain('<option value="" selected="">');
    for (const name of ["needsCompanion", "speedMin", "speedMax", "voice", "vibration"])
      expect(html).toContain(`name="${name}"`);
    expect(html).toContain('type="submit"');
  });

  it("renders the unsupported requested locale as the selected option", () => {
    // Given
    const selected = { ...worker, profile: { ...worker.profile, preferredLocale: "vi-VN" } };
    // When
    const html = renderToStaticMarkup(createElement(ProfileEditor, { selected, canEdit: true }));
    // Then
    expect(html).toContain('<option value="vi-VN" selected="">');
  });

  it("displays stored confirmation metadata before a new submission", () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T12:00:00Z"));
    const selected = { ...worker, profile: { ...worker.profile, version: 17 } };
    // When
    const html = renderToStaticMarkup(createElement(ProfileEditor, { selected, canEdit: true }));
    // Then
    expect(html).toContain(`dateTime="${worker.profile.confirmedAt}"`);
    expect(html).toContain("v17");
    expect(html).not.toContain("2026-09-22T12:00:00.000Z");
  });

  it.each([
    { canEdit: false, busy: false },
    { canEdit: true, busy: true },
  ])("disables form controls for access/busy state %j", (state) => {
    // Given / When
    const html = renderToStaticMarkup(createElement(ProfileEditor, { selected: worker, ...state }));
    // Then
    expect(html).toMatch(/<select[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""/);
  });
});
