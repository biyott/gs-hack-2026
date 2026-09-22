"use client";

import { LogIn, Smartphone } from "lucide-react";
import { type FormEvent, useState } from "react";
import { api } from "@/client/api";
import { useConsoleStore } from "@/client/store";
import { Button } from "@/components/ui/button";
import { Banner, Field, Panel, StatusBadge } from "@/components/ui/primitives";

export function WorkerLogin() {
  const ready = useConsoleStore((state) => state.sessionReady);
  const [actorId, setActorId] = useState("worker-a");
  const [accessCode, setAccessCode] = useState("2026");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const session = await api.login({ role: "worker", actorId, accessCode });
      const state = useConsoleStore.getState();
      state.selectMode(state.mode);
      state.setSession(session);
      setError(null);
    } catch (failure) {
      if (failure instanceof Error) setError(failure.message);
      else throw failure;
    } finally {
      setPending(false);
    }
  }

  return (
    <main id="main" className="worker-preview worker-preview-login stack">
      <div className="cluster">
        <Smartphone size={24} />
        <StatusBadge tone="synthetic">SIMULATION</StatusBadge>
      </div>
      <h1>
        작업자 브라우저 미리보기
        <br />
        <span lang="en">Worker browser preview</span>
      </h1>
      <p className="muted">
        브라우저 안내·응답 흐름을 확인합니다. Android 실제 앱 및 기기 검증과 별개입니다.
      </p>
      <p className="muted">
        관제와 작업자를 동시에 보려면 별도 브라우저 프로필을 사용하세요. / Use separate browser
        profiles for simultaneous operator and worker sessions.
      </p>
      <Panel title="작업자 연결 / Connect worker">
        <form
          onSubmit={(event) => {
            void login(event);
          }}
          className="stack"
        >
          <Field label="작업자 계정 / Worker account">
            <select value={actorId} onChange={(event) => setActorId(event.target.value)}>
              <option value="worker-a">worker-a · 작업자 A</option>
              <option value="worker-b">worker-b · Worker B</option>
            </select>
          </Field>
          <Field label="접속 코드 / Access code" hint="로컬 데모 기본값 / Local demo default: 2026">
            <input
              type="password"
              autoComplete="current-password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              required
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            size="worker"
            disabled={!ready || pending}
            aria-busy={pending}
          >
            <LogIn size={20} />
            {pending ? "연결 중 / Connecting" : "작업자 연결 / Connect"}
          </Button>
        </form>
      </Panel>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Button asChild variant="quiet">
        <a href="/">관제 화면으로 / Open operations console</a>
      </Button>
    </main>
  );
}
