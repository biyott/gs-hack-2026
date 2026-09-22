import { Activity, ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState, Field, Metric, Panel, StatusBadge } from "@/components/ui/primitives";

export default function DesignSystemPage() {
  return (
    <main id="main" className="showcase">
      <header className="showcase-header">
        <ShieldCheck />
        <p className="eyebrow">GS SAFETY OPERATIONS · SYSTEM 1.0</p>
        <h1>현장 대응의 기준</h1>
        <p>상태·행동·출처를 명확하게 구분하는 관제 구성 요소</p>
      </header>
      <Banner tone="synthetic">
        시뮬레이션 / SIMULATION · 서산 HVO 현장 참고 / 상세 배치 재구성
      </Banner>
      <div className="showcase-grid">
        <Panel title="행동 컨트롤" eyebrow="BUTTON / INTERACTION">
          <div className="cluster">
            <Button variant="primary">
              <Activity size={18} />
              시뮬레이션 실행
            </Button>
            <Button>일시정지</Button>
            <Button variant="danger">위험 해제</Button>
            <Button variant="quiet">
              상세 보기
              <ArrowRight size={16} />
            </Button>
            <Button disabled>권한 필요</Button>
            <Button aria-busy="true">
              <LoaderCircle size={16} />
              요청 중
            </Button>
          </div>
          <p className="muted">
            키보드 Tab으로 초점 표시를 <span className="keep-phrase">확인할 수 있습니다.</span>
          </p>
        </Panel>
        <Panel title="명시적인 상태" eyebrow="STATUS / REDUNDANT SIGNAL">
          <div className="cluster">
            <StatusBadge tone="safe">수신 확인</StatusBadge>
            <StatusBadge tone="caution">위치 미확인</StatusBadge>
            <StatusBadge tone="danger">지원 요청</StatusBadge>
            <StatusBadge tone="info">대응 중</StatusBadge>
            <StatusBadge tone="offline">연결 끊김</StatusBadge>
            <StatusBadge tone="synthetic">MOCK</StatusBadge>
          </div>
        </Panel>
        <Panel title="입력과 단위" eyebrow="FIELD / NATIVE CONTROL">
          <div className="form-grid">
            <Field label="안내 언어" hint="국적과 독립적으로 선택합니다.">
              <select defaultValue="ko">
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="실행 속도">
              <select defaultValue="1">
                <option value="1">1× 실제 시간</option>
                <option value="2">2×</option>
              </select>
            </Field>
            <Field label="확인 기록">
              <input placeholder="현장에서 확인한 사실 입력" />
            </Field>
          </div>
        </Panel>
        <Panel title="관측값과 불확실성" eyebrow="METRIC / PROVENANCE">
          <div className="metric-grid">
            <Metric label="영향 작업자" value="2명" note="서버 판정" />
            <Metric label="UWB 방향" value="미확인" note="각도 제공 안 됨" />
            <Metric label="경과 시간" value="00:42" note="가상 시계" />
          </div>
        </Panel>
        <Panel title="최초 전달 안내" eyebrow="GUIDANCE / IMMUTABLE">
          <div className="guidance-block">
            <StatusBadge tone="caution">WORKER-B · English</StatusBadge>
            <p className="guidance-message" lang="en">
              Follow the validated route to the designated refuge.
            </p>
            <p>
              검증된 경로를 따라{" "}
              <span className="keep-phrase">지정된 회피 지점으로 이동하세요.</span>
            </p>
            <small className="mono">GUIDANCE-WORKER-B-001 · v1</small>
          </div>
        </Panel>
        <Panel title="빈 상태와 실패" eyebrow="EMPTY / ERROR">
          <EmptyState title="선택된 사건이 없습니다">
            시나리오를 실행하면 <span className="keep-phrase">위험과 대응 이력이 연결됩니다.</span>
          </EmptyState>
          <Banner tone="offline">
            영상 연결 끊김 · <span className="keep-phrase">센서 위험 상태는 유지됩니다.</span>
          </Banner>
        </Panel>
      </div>
    </main>
  );
}
