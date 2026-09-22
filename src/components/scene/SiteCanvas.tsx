import { Html, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import type { EquipmentPreset } from "@/contracts";
import { CameraRig } from "./CameraRig";
import { EquipmentModel } from "./EquipmentModel";
import { SceneOverlays } from "./SceneOverlays";
import type { SceneFrame, ScenePalette, SceneSelection } from "./scene-types";

function SiteAsset() {
  const { scene } = useGLTF("/assets/site/hvo-demo.glb");
  const model = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={model} scale={[1, 1, 1]} />;
}

export function SiteCanvas(
  props: SceneSelection &
    SceneFrame & {
      readonly equipmentPreset: EquipmentPreset | null;
      readonly palette: ScenePalette;
    },
) {
  return (
    <Canvas
      className="scene-canvas"
      data-testid="site-canvas"
      aria-label="실제 GLB 현장과 장비 모델을 표시한 3D 장면"
      camera={{ position: [80, 150, 170], fov: 45, near: 0.1, far: 1500 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true }}
      fallback={
        <p className="scene-status">이 기기에서 3D를 표시할 수 없습니다. 2D 지도를 선택하세요.</p>
      }
    >
      <color attach="background" args={[props.palette.ground]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[-30, 100, 40]} intensity={2.4} />
      <hemisphereLight args={[props.palette.ground, props.palette.structure, 1.1]} />
      <Suspense
        fallback={
          <Html center>
            <span className="scene-loading" role="status">
              현장 3D 모델 불러오는 중…
            </span>
          </Html>
        }
      >
        <SiteAsset />
      </Suspense>
      {props.equipmentPreset && props.snapshot.equipment.positionStatus !== "unknown" ? (
        <Suspense
          key={props.equipmentPreset.id}
          fallback={
            <Html position={[30, 10, -25]} center>
              <span className="scene-loading" role="status">
                장비 모델 불러오는 중…
              </span>
            </Html>
          }
        >
          <EquipmentModel preset={props.equipmentPreset} equipment={props.snapshot.equipment} />
        </Suspense>
      ) : null}
      <SceneOverlays {...props} />
      <CameraRig {...props} />
    </Canvas>
  );
}
