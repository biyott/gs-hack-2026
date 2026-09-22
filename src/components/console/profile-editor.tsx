"use client";

import { type FormEvent, useId, useState } from "react";
import { sendCommand } from "@/client/use-simulation";
import { incidentTime } from "@/components/incidents/incident-labels";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/primitives";
import { type WorkerProfile, WorkerProfileSchema, type WorkerState } from "@/contracts";

export type ProfileEditorProps = {
  readonly selected: WorkerState;
  readonly canEdit: boolean;
  readonly busy?: boolean;
};

const capabilityFields = [
  ["canUseStairs", "확인된 계단 이용", "가능", "불가"],
  ["needsAssistance", "이동 보조 필요", "필요", "불필요"],
  ["needsCompanion", "동행 필요", "필요", "불필요"],
] as const;
const speedFields = [
  ["min", "speedMin", "확인된 최소 속도 (m/s)"],
  ["max", "speedMax", "확인된 최대 속도 (m/s)"],
] as const;
const notificationFields = [
  ["voice", "음성 알림"],
  ["vibration", "진동 알림"],
] as const;

export function parseProfileForm(form: FormData, profile: WorkerProfile) {
  function boolean(name: string): unknown {
    switch (form.get(name)) {
      case "unknown":
        return null;
      case "true":
        return true;
      case "false":
        return false;
      default:
        return form.get(name) ?? undefined;
    }
  }
  function speed(value: FormDataEntryValue | null): number | undefined {
    return typeof value === "string" && value.trim() !== "" ? Number(value) : undefined;
  }
  const preferredLocale = form.get("preferredLocale");
  const minimum = form.get("speedMin");
  const maximum = form.get("speedMax");
  return WorkerProfileSchema.safeParse({
    ...profile,
    version: profile.version + 1,
    preferredLocale: preferredLocale === "" ? null : (preferredLocale ?? undefined),
    locale: preferredLocale === "ko" || preferredLocale === "en" ? preferredLocale : profile.locale,
    canUseStairs: boolean("canUseStairs"),
    needsAssistance: boolean("needsAssistance"),
    needsCompanion: boolean("needsCompanion"),
    speedMps:
      minimum === "" && maximum === "" ? null : { min: speed(minimum), max: speed(maximum) },
    notificationPreferences: { voice: boolean("voice"), vibration: boolean("vibration") },
    confirmedAt: new Date().toISOString(),
  });
}

export function ProfileEditor({ selected, canEdit, busy = false }: ProfileEditorProps) {
  const profile = selected.profile;
  const disabled = !canEdit || busy;
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const unsupportedLocale =
    profile.preferredLocale !== null &&
    profile.preferredLocale !== "ko" &&
    profile.preferredLocale !== "en";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const result = parseProfileForm(new FormData(event.currentTarget), profile);
    if (!result.success) {
      setError(
        result.error.issues.some((issue) => issue.path[0] === "speedMps")
          ? "속도를 모르면 두 칸을 모두 비워 두세요. 입력 시 0 ≤ 최소 ≤ 최대이며 최대는 0보다 커야 합니다."
          : "프로필 입력을 확인해 주세요. 미확인 항목은 미확인으로 선택하세요.",
      );
      return;
    }
    setError(null);
    void sendCommand({ action: "profile", workerId: selected.workerId, profile: result.data });
  }

  return (
    <form className="stack" onSubmit={submit} aria-describedby={error ? errorId : undefined}>
      <Field
        label="선호 언어"
        hint="미확인 또는 지원하지 않는 언어는 검토된 영어 안내로 대체됩니다."
      >
        <select
          name="preferredLocale"
          defaultValue={profile.preferredLocale ?? ""}
          disabled={disabled}
        >
          <option value="">미확인</option>
          <option value="ko">한국어</option>
          <option value="en">English</option>
          {unsupportedLocale ? (
            <option value={profile.preferredLocale ?? ""}>
              {profile.preferredLocale} · 기존 요청 언어
            </option>
          ) : null}
        </select>
      </Field>
      {capabilityFields.map(([name, label, positive, negative]) => (
        <Field key={name} label={label}>
          <select
            name={name}
            defaultValue={profile[name] === null ? "unknown" : String(profile[name])}
            disabled={disabled}
          >
            <option value="unknown">미확인</option>
            <option value="true">{positive}</option>
            <option value="false">{negative}</option>
          </select>
        </Field>
      ))}
      <div className="form-grid">
        {speedFields.map(([bound, name, label]) => (
          <Field key={name} label={label}>
            <input
              name={name}
              type="number"
              min={0}
              step="any"
              defaultValue={profile.speedMps?.[bound] ?? ""}
              disabled={disabled}
            />
          </Field>
        ))}
      </div>
      <p className="muted">속도를 확인하지 않았다면 최소·최대값을 모두 비워 두세요.</p>
      {notificationFields.map(([name, label]) => (
        <Field key={name} label={label}>
          <select
            name={name}
            defaultValue={String(profile.notificationPreferences[name])}
            disabled={disabled}
          >
            <option value="true">켜짐</option>
            <option value="false">꺼짐</option>
          </select>
        </Field>
      ))}
      <p className="muted">
        서버 프로필 v{profile.version} · 확인 시각{" "}
        {profile.confirmedAt ? (
          <time dateTime={profile.confirmedAt}>{incidentTime(profile.confirmedAt)}</time>
        ) : (
          "미확인"
        )}
      </p>
      {error ? (
        <p id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={disabled} aria-busy={busy}>
        {busy ? "프로필 저장 중…" : "프로필 확인 및 저장"}
      </Button>
      {!canEdit ? <p className="muted">관리자와 운영자만 프로필을 변경할 수 있습니다.</p> : null}
    </form>
  );
}
