import { type Object3D, Vector3 } from "three";
import type { EquipmentArticulation, EquipmentPreset, EquipmentState } from "@/contracts";
import { hookRopeScale } from "./rig-math";

export type EquipmentPose = Pick<
  EquipmentState,
  "slewDeg" | "boomAngleDeg" | "boomLengthM" | "trolleyM" | "hookHeightM"
>;

export class EquipmentRigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EquipmentRigError";
  }
}

function requiredNode(scene: Object3D, name: string | null): Object3D {
  const node = name === null ? undefined : scene.getObjectByName(name);
  if (!node)
    throw new EquipmentRigError(`카탈로그 제어 노드를 찾을 수 없습니다: ${name ?? "미지정"}`);
  return node;
}

function motionNode(scene: Object3D, name: string | null, enabled: boolean) {
  if (!enabled) return null;
  const node = requiredNode(scene, name);
  return {
    object: node,
    position: node.position.clone(),
    rotation: node.rotation.clone(),
    scale: node.scale.clone(),
  };
}

function localPoint(node: Object3D, worldPoint: Vector3): Vector3 {
  return node.parent ? node.parent.worldToLocal(worldPoint) : worldPoint;
}

function createArticulation(
  model: Object3D,
  preset: EquipmentPreset,
  definition: EquipmentArticulation,
) {
  const boom = motionNode(model, definition.boom.pivotNode, preset.controls.boomAngle);
  const segments = preset.controls.boomLength
    ? definition.boom.segments.map((segment) => {
        const object = requiredNode(model, segment.node);
        return { ...segment, object, position: object.position.clone() };
      })
    : [];
  const hook = preset.controls.hook ? requiredNode(model, definition.hook.node) : null;
  const tip = requiredNode(model, definition.hook.tipNode);
  const links = definition.links.map((link) => ({
    ...link,
    object: requiredNode(model, link.node),
    from: requiredNode(model, link.fromNode),
    to: requiredNode(model, link.toNode),
  }));
  const baseline = preset.controlBaselines;

  return (pose: EquipmentPose): void => {
    if (boom && baseline.boomAngleDeg !== null)
      boom.object.rotation[definition.boom.axis] =
        boom.rotation[definition.boom.axis] +
        ((pose.boomAngleDeg - baseline.boomAngleDeg) * Math.PI * definition.boom.angleSign) / 180;
    if (pose.boomLengthM !== null && baseline.boomLengthM !== null)
      for (const segment of segments)
        segment.object.position[segment.axis] =
          segment.position[segment.axis] +
          (pose.boomLengthM - baseline.boomLengthM) * segment.lengthShare;
    model.updateWorldMatrix(true, true);

    if (hook && pose.hookHeightM !== null) {
      const target = tip.getWorldPosition(new Vector3());
      target.y = pose.hookHeightM;
      hook.position.copy(localPoint(hook, target));
      hook.updateWorldMatrix(false, true);
    }

    for (const link of links) {
      const from = link.from.getWorldPosition(new Vector3());
      const to = link.to.getWorldPosition(new Vector3());
      const start = localPoint(link.object, from.clone().lerp(to, link.startFraction));
      const end = localPoint(link.object, from.lerp(to, link.endFraction));
      const direction = end.sub(start);
      link.object.position.copy(start);
      link.object.scale[link.axis] = direction.length() / link.restLengthM;
      link.object.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
      link.object.updateWorldMatrix(false, true);
    }
  };
}

export function createEquipmentRig(scene: Object3D, preset: EquipmentPreset) {
  const model = scene.clone(true);
  const slew = motionNode(model, preset.controlNodes.slew, preset.controls.slew);
  const trolley = motionNode(model, preset.controlNodes.trolley, preset.controls.trolley);
  const articulation = preset.articulation
    ? createArticulation(model, preset, preset.articulation)
    : null;
  const relativeHoist = preset.controls.hook && articulation === null;
  const hook = motionNode(model, preset.controlNodes.hook, relativeHoist);
  const ropes = motionNode(model, preset.controlNodes.ropes, relativeHoist);
  const baseline = preset.controlBaselines;

  function applyPose(equipment: EquipmentPose): void {
    if (slew && baseline.slewDeg !== null)
      slew.object.rotation.y =
        slew.rotation.y + ((equipment.slewDeg - baseline.slewDeg) * Math.PI) / 180;
    if (trolley && equipment.trolleyM !== null && baseline.trolleyM !== null)
      trolley.object.position.x = trolley.position.x + equipment.trolleyM - baseline.trolleyM;
    if (hook && ropes && equipment.hookHeightM !== null && baseline.hookHeightM !== null) {
      const scale = hookRopeScale(equipment.hookHeightM, baseline);
      if (scale === null)
        throw new EquipmentRigError("현재 훅 높이의 케이블 길이를 검증할 수 없습니다.");
      hook.object.position.y = hook.position.y + equipment.hookHeightM - baseline.hookHeightM;
      ropes.object.scale.y = ropes.scale.y * scale;
    }
    articulation?.(equipment);
    model.updateWorldMatrix(true, true);
  }

  return { model, applyPose };
}
