import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { type EquipmentPreset, type EquipmentState, toThree } from "@/contracts";
import { createEquipmentRig } from "./equipment-rig";

export function EquipmentModel({
  preset,
  equipment,
}: {
  readonly preset: EquipmentPreset;
  readonly equipment: EquipmentState;
}) {
  const { scene } = useGLTF(preset.assetUrl);
  const { invalidate } = useThree();
  const rig = useMemo(() => createEquipmentRig(scene, preset), [preset, scene]);

  useLayoutEffect(() => {
    rig.applyPose(equipment);
    invalidate();
  }, [equipment, invalidate, rig]);

  return (
    <group
      name="EQUIPMENT-A"
      position={toThree(equipment.position)}
      rotation={[0, (equipment.headingDeg * Math.PI) / 180, 0]}
      scale={[1, 1, 1]}
    >
      <primitive object={rig.model} />
    </group>
  );
}
