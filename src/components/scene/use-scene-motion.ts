import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConsoleStore } from "@/client/store";
import type { SimulationSnapshot, SiteMap } from "@/contracts";
import {
  beginSceneMotion,
  SCENE_MOTION_DURATION_MS,
  type SceneMotion,
  sampleSceneMotion,
} from "./scene-motion";

export function useSceneMotion(snapshot: SimulationSnapshot, map: SiteMap): SimulationSnapshot {
  const connection = useConsoleStore((state) => state.connection);
  const epoch = useConsoleStore((state) => state.connectionEpoch);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [display, setDisplay] = useState({ source: snapshot, snapshot });
  const motion = useRef<SceneMotion | null>(null);
  const scope = JSON.stringify([map.mapId, map.mapVersion, epoch]);
  const enabled = connection === "connected" && !reducedMotion;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const startedAt = performance.now();
    const transition = beginSceneMotion(
      motion.current,
      snapshot,
      scope,
      startedAt,
      Date.now(),
      enabled,
    );
    motion.current = transition;
    setDisplay({ source: snapshot, snapshot: sampleSceneMotion(transition, startedAt) });
    if (!transition.animating) return;
    let frameId = 0;
    const renderFrame = (time: number) => {
      setDisplay({ source: snapshot, snapshot: sampleSceneMotion(transition, time) });
      if (time - startedAt < SCENE_MOTION_DURATION_MS) frameId = requestAnimationFrame(renderFrame);
    };
    frameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(frameId);
  }, [snapshot, scope, enabled]);

  return enabled && display.source === snapshot ? display.snapshot : snapshot;
}
