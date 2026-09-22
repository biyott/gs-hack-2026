import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { type CameraRequest, frameRequestChanged } from "./geometry";
import type { SceneFrame } from "./scene-types";

export function CameraRig({ bounds, request, zoom }: SceneFrame) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const previous = useRef<CameraRequest | null>(null);
  const previousZoom = useRef(zoom);
  const { camera, size, invalidate } = useThree();

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || !(camera instanceof PerspectiveCamera)) return;
    const isNewFrame = frameRequestChanged(previous.current, request);
    const target = new Vector3(
      (bounds.minX + bounds.maxX) / 2,
      request.mode === "full" ? 12 : 0,
      -(bounds.minY + bounds.maxY) / 2,
    );
    const following =
      request.mode === "follow" &&
      previous.current?.mode === "follow" &&
      previous.current.selection === request.selection &&
      previous.current.reset === request.reset;
    if (following) {
      camera.position.add(target.clone().sub(orbit.target));
      orbit.target.copy(target);
    } else if (isNewFrame) {
      const width = bounds.maxX - bounds.minX + 20;
      const depth = bounds.maxY - bounds.minY + 20;
      const span = Math.max(
        width / (size.width / size.height),
        depth,
        request.mode === "full" ? 85 : 25,
      );
      const distance = span / (2 * Math.tan((camera.fov * Math.PI) / 360));
      const direction = new Vector3(0.25, 0.9, 1).normalize();
      camera.position.copy(target).add(direction.multiplyScalar((distance * 1.3) / zoom));
      orbit.target.copy(target);
    }
    if ((!isNewFrame || following) && previousZoom.current !== zoom) {
      const offset = camera.position
        .clone()
        .sub(orbit.target)
        .multiplyScalar(previousZoom.current / zoom);
      camera.position.copy(orbit.target).add(offset);
    }
    previous.current = request;
    previousZoom.current = zoom;
    orbit.update();
    invalidate();
  }, [bounds, camera, invalidate, request, size.height, size.width, zoom]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping={false}
      minDistance={8}
      maxDistance={550}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
}
