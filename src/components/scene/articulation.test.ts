import { Group, MathUtils, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { EquipmentCatalogSchema, type EquipmentPreset } from "@/contracts";
import catalogJson from "../../../data/equipment/catalog.json";
import { createEquipmentRig } from "./equipment-rig";

function fixture() {
  const template = EquipmentCatalogSchema.parse(catalogJson).equipment[0];
  if (!template) throw new TypeError("Equipment fixture requires a catalog entry");
  const preset: EquipmentPreset = {
    ...template,
    controls: {
      translation: true,
      slew: true,
      boomAngle: true,
      boomLength: true,
      trolley: false,
      hook: true,
    },
    controlNodes: {
      slew: "SLEW",
      trolley: null,
      hook: "HOOK",
      ropes: "ROPE",
      boomPivot: "BOOM",
      boomSegments: ["SEGMENT"],
    },
    controlBaselines: {
      slewDeg: 10,
      trolleyM: null,
      hookHeightM: 3,
      ropeTopM: 10,
      ropeLengthM: 7,
      boomAngleDeg: 30,
      boomLengthM: 10,
    },
    articulation: {
      boom: {
        pivotNode: "BOOM",
        axis: "z",
        angleSign: 1,
        tipNode: "TIP",
        segments: [{ node: "SEGMENT", axis: "x", lengthShare: 0.5 }],
      },
      hook: { node: "HOOK", tipNode: "TIP" },
      links: [
        {
          node: "ROPE",
          fromNode: "TIP",
          toNode: "HOOK",
          startFraction: 0,
          endFraction: 1,
          axis: "y",
          restLengthM: 1,
          origin: "start",
        },
        {
          node: "CYLINDER",
          fromNode: "BASE",
          toNode: "TIP",
          startFraction: 0.2,
          endFraction: 0.65,
          axis: "y",
          restLengthM: 2,
          origin: "start",
        },
      ],
    },
    demoPose: { slewDeg: 10, boomAngleDeg: 30, boomLengthM: 10, trolleyM: null, hookHeightM: 3 },
  };
  const scene = new Group();
  function node(name: string, parent: Group, position: readonly [number, number, number]) {
    const child = new Group();
    child.name = name;
    child.position.set(...position);
    parent.add(child);
    return child;
  }
  const slew = node("SLEW", scene, [1, 0, 2]);
  slew.rotation.y = MathUtils.degToRad(10);
  const boom = node("BOOM", slew, [1, 2, 0]);
  boom.rotation.z = MathUtils.degToRad(30);
  const segment = node("SEGMENT", boom, [4, 0, 0]);
  node("TIP", segment, [6, 0, 0]);
  node("HOOK", boom, [3, 2, 0]);
  node("ROPE", slew, [0, 0, 0]);
  node("BASE", slew, [-1, 1, 0]);
  node("CYLINDER", slew, [0, 0, 0]);
  return { scene, preset };
}

function requiredNode(model: Group | ReturnType<typeof createEquipmentRig>["model"], name: string) {
  const node = model.getObjectByName(name);
  if (!node) throw new TypeError(`Missing test node: ${name}`);
  return node;
}

describe("articulated equipment kinematics", () => {
  it("rotates about the exported pivot when boom angle changes", () => {
    const { scene, preset } = fixture();
    const rig = createEquipmentRig(scene, preset);

    rig.applyPose({ ...preset.demoPose, boomAngleDeg: 60 });

    expect(requiredNode(rig.model, "BOOM").rotation.z).toBeCloseTo(Math.PI / 3);
  });

  it("moves the telescope on its local axis when length changes", () => {
    const { scene, preset } = fixture();
    const rig = createEquipmentRig(scene, preset);

    rig.applyPose({ ...preset.demoPose, boomLengthM: 18 });

    expect(requiredNode(rig.model, "SEGMENT").position.x).toBeCloseTo(8);
    expect(requiredNode(scene, "SEGMENT").position.x).toBe(4);
  });

  it("holds the hook below the current tip at world height under rotated ancestors", () => {
    const { scene, preset } = fixture();
    const rig = createEquipmentRig(scene, preset);
    const placement = new Group();
    placement.position.set(30, 0, -25);
    placement.rotation.y = 0.7;
    placement.add(rig.model);

    rig.applyPose({
      ...preset.demoPose,
      slewDeg: 70,
      boomAngleDeg: 65,
      boomLengthM: 14,
      hookHeightM: 4,
    });

    const tip = requiredNode(rig.model, "TIP").getWorldPosition(new Vector3());
    const hook = requiredNode(rig.model, "HOOK").getWorldPosition(new Vector3());
    expect(hook.toArray()).toEqual([
      expect.closeTo(tip.x),
      expect.closeTo(4),
      expect.closeTo(tip.z),
    ]);
  });

  it("connects both normalized rope endpoints after boom and hook movement", () => {
    const { scene, preset } = fixture();
    const rig = createEquipmentRig(scene, preset);

    rig.applyPose({ ...preset.demoPose, boomAngleDeg: 55, boomLengthM: 16, hookHeightM: 4 });

    const rope = requiredNode(rig.model, "ROPE");
    const tip = requiredNode(rig.model, "TIP").getWorldPosition(new Vector3());
    const hook = requiredNode(rig.model, "HOOK").getWorldPosition(new Vector3());
    expect(rope.localToWorld(new Vector3()).distanceTo(tip)).toBeLessThan(1e-8);
    expect(rope.localToWorld(new Vector3(0, 1, 0)).distanceTo(hook)).toBeLessThan(1e-8);
  });

  it("fits a partial cylinder span using its rest length", () => {
    const { scene, preset } = fixture();
    const rig = createEquipmentRig(scene, preset);

    rig.applyPose({ ...preset.demoPose, boomAngleDeg: 70 });

    const cylinder = requiredNode(rig.model, "CYLINDER");
    const start = requiredNode(rig.model, "BASE").getWorldPosition(new Vector3());
    const end = requiredNode(rig.model, "TIP").getWorldPosition(new Vector3());
    expect(
      cylinder.localToWorld(new Vector3()).distanceTo(start.clone().lerp(end, 0.2)),
    ).toBeLessThan(1e-8);
    expect(
      cylinder.localToWorld(new Vector3(0, 2, 0)).distanceTo(start.clone().lerp(end, 0.65)),
    ).toBeLessThan(1e-8);
  });

  it("returns to baseline without accumulating telescope or angle changes", () => {
    const { scene, preset } = fixture();
    const rig = createEquipmentRig(scene, preset);
    rig.applyPose({ ...preset.demoPose, boomAngleDeg: 80, boomLengthM: 18 });

    rig.applyPose(preset.demoPose);

    expect(requiredNode(rig.model, "BOOM").rotation.z).toBeCloseTo(Math.PI / 6);
    expect(requiredNode(rig.model, "SEGMENT").position.x).toBeCloseTo(4);
  });

  it("leaves unsupported boom controls at their exported baseline", () => {
    const { scene, preset } = fixture();
    const rig = createEquipmentRig(scene, {
      ...preset,
      controls: { ...preset.controls, boomAngle: false, boomLength: false },
    });

    rig.applyPose({ ...preset.demoPose, boomAngleDeg: 80, boomLengthM: 18 });

    expect(requiredNode(rig.model, "BOOM").rotation.z).toBeCloseTo(Math.PI / 6);
    expect(requiredNode(rig.model, "SEGMENT").position.x).toBeCloseTo(4);
  });
});
