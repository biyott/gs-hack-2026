import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { readonly children: ReactNode; readonly onUseMap: () => void };
type State = { readonly error: string | null };

export class SceneBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error.message : "3D 장면을 불러올 수 없습니다." };
  }

  override render() {
    if (this.state.error)
      return (
        <div className="scene-failure" role="alert">
          <strong>3D 장면을 표시할 수 없습니다.</strong>
          <p>3D 현장 자료를 확인할 수 없습니다. 현재 위험과 위치는 2D 지도에서 확인하세요.</p>
          <Button onClick={this.props.onUseMap}>2D 지도 보기</Button>
        </div>
      );
    return this.props.children;
  }
}
