"use client";

import { ArrowRight, Construction, Flame, KeyRound, ShieldCheck, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { api, errorMessage } from "@/client/api";
import { useConsoleStore } from "@/client/store";
import { Button } from "@/components/ui/button";
import { Banner, Field, StatusBadge } from "@/components/ui/primitives";
import { type SessionRole, SessionRoleSchema, type SimulationMode } from "@/contracts";

const identities: Readonly<Record<SessionRole, string>> = {
  admin: "admin",
  operator: "operator",
  support: "support",
  worker: "worker-a",
  device: "equipment",
  observer: "observer",
};

export function EntryScreen({ onEnter }: { readonly onEnter: (mode: SimulationMode) => void }) {
  const session = useConsoleStore((state) => state.session);
  const sessionReady = useConsoleStore((state) => state.sessionReady);
  const [role, setRole] = useState<SessionRole>("admin");
  const [actorId, setActorId] = useState("admin");
  const [accessCode, setAccessCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      useConsoleStore.getState().setSession(await api.login({ role, actorId, accessCode }));
    } catch (failure) {
      if (failure instanceof Error) setError(failure.message);
      else throw failure;
    } finally {
      setPending(false);
    }
  }
  return (
    <main id="main" className="entry-screen">
      <div className="entry-brand">
        <ShieldCheck size={24} />
        <strong>GS SAFETY OPERATIONS</strong>
        <StatusBadge tone="synthetic">SIMULATION</StatusBadge>
      </div>
      <section className="entry-intro">
        <p className="eyebrow">CONNECTED RESPONSE · CONSTRUCTION SAFETY</p>
        <h1>
          위험을 파악하고,
          <br />
          각자의 안전한 행동으로.
        </h1>
        <p>
          하나의 현장, 두 개의 독립 시뮬레이션.
          <br />
          위험 인지부터 최초 안내와 작업자 대응까지 연결합니다.
        </p>
      </section>
      <div className="entry-content">
        <section className="mode-choices" aria-label="시뮬레이션 모드 선택">
          <button
            type="button"
            className="mode-choice"
            disabled={!session}
            onClick={() => onEnter("equipment")}
            data-testid="mode-equipment"
          >
            <span className="mode-icon">
              <Construction size={28} />
            </span>
            <span className="eyebrow">01 / EQUIPMENT</span>
            <h2>중장비 접근 대응</h2>
            <p>
              장비 이동과 작업 범위에 따른 위험을 확인하고, 개인별 회피 경로와 지원을 연결합니다.
            </p>
            <span className="mode-choice-footer">
              6종 크레인 · 개인별 경로
              <ArrowRight size={20} />
            </span>
          </button>
          <button
            type="button"
            className="mode-choice"
            disabled={!session}
            onClick={() => onEnter("fire-gas")}
            data-testid="mode-fire-gas"
          >
            <span className="mode-icon fire">
              <Flame size={28} />
            </span>
            <span className="eyebrow">02 / FIRE & GAS</span>
            <h2>화재·가스 대응</h2>
            <p>위험 영역과 통로 변화에 대응하며, 대피·지원·통행 재개를 별개 상태로 관리합니다.</p>
            <span className="mode-choice-footer">
              DEMO-GAS-X · 정책 기반 대응
              <ArrowRight size={20} />
            </span>
          </button>
        </section>
        <aside className="entry-session">
          <div className="cluster">
            <KeyRound size={20} />
            <h2>{session ? "관제 연결 준비 완료" : "관제 세션 시작"}</h2>
          </div>
          {session ? (
            <>
              <StatusBadge tone="safe">
                {session.actorId} · {session.role}
              </StatusBadge>
              <p>시연할 모드를 선택하세요. 서버에 저장된 현재 실행과 최초 안내를 불러옵니다.</p>
              <Button
                variant="quiet"
                onClick={() => {
                  void api
                    .logout()
                    .then(() => useConsoleStore.getState().setSession(null))
                    .catch((failure: unknown) => setError(errorMessage(failure)));
                }}
              >
                다른 계정으로 연결
              </Button>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                void login(event);
              }}
              className="stack"
            >
              <Field label="역할">
                <select
                  value={role}
                  onChange={(event) => {
                    const value = SessionRoleSchema.parse(event.target.value);
                    setRole(value);
                    setActorId(identities[value]);
                  }}
                >
                  <option value="admin">안전관리자 · 해제 권한</option>
                  <option value="operator">데모 운영자</option>
                  <option value="support">지원 담당자</option>
                  <option value="observer">관찰자 · 읽기 전용</option>
                </select>
              </Field>
              <Field label="사용자 ID">
                <input
                  autoComplete="username"
                  value={actorId}
                  onChange={(event) => setActorId(event.target.value)}
                  required
                />
              </Field>
              <Field label="접속 코드" hint="로컬 데모 기본 코드: 2026 (서버 설정으로 변경 가능)">
                <input
                  type="password"
                  autoComplete="current-password"
                  inputMode="numeric"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  required
                />
              </Field>
              <Button
                type="submit"
                variant="primary"
                disabled={pending || !sessionReady}
                aria-busy={pending}
              >
                <Users size={18} />
                {pending ? "연결 중" : "관제에 연결"}
              </Button>
            </form>
          )}
          {error ? <Banner tone="danger">{error}</Banner> : null}
        </aside>
      </div>
      <footer className="entry-footer">
        <span>서산 HVO 현장 참고 / 상세 배치 재구성</span>
        <span>140m × 50m · 1:100 책상 시연</span>
        <span>시뮬레이션 전용 · 실제 안전 인증 아님</span>
      </footer>
    </main>
  );
}
