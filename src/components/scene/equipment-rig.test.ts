import { readFile } from "node:fs/promises";
import { Box3, Mesh, type Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { describe, expect, it } from "vitest";
import { EquipmentCatalogSchema, type EquipmentPreset } from "@/contracts";
import catalogJson from "../../../data/equipment/catalog.json";
import { createEquipmentRig, EquipmentRigError } from "./equipment-rig";

const catalog = EquipmentCatalogSchema.parse(catalogJson);

async function loadAsset(preset: EquipmentPreset) {
  const bytes = await readFile(`${process.cwd()}/public${preset.assetUrl}`);
  return (await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, "")).scene;
}

function requiredNode(model: Object3D, name: string | null): Object3D {
  const node = name === null ? undefined : model.getObjectByName(name);
  if (!node) throw new TypeError(`Missing fixture node: ${name}`);
  return node;
}

function fixedNodes(model: Object3D, slewName: string | null) {
  const result: { readonly node: Object3D; readonly matrix: readonly number[] }[] = [];
  model.updateWorldMatrix(true, true);
  model.traverse((node) => {
    for (let ancestor: Object3D | null = node; ancestor; ancestor = ancestor.parent)
      if (ancestor.name === slewName) return;
    result.push({ node, matrix: node.matrixWorld.toArray() });
  });
  return result;
}

function cornerPoses(preset: EquipmentPreset) {
  return (preset.movementLimits.boomAngleDeg ?? [preset.demoPose.boomAngleDeg]).flatMap(
    (boomAngleDeg) =>
      (preset.movementLimits.boomLengthM ?? [preset.demoPose.boomLengthM]).flatMap((boomLengthM) =>
        (preset.movementLimits.hookHeightM ?? [preset.demoPose.hookHeightM]).flatMap(
          (hookHeightM) =>
            [-35, 70].map((slewDeg) => ({
              ...preset.demoPose,
              boomAngleDeg,
              boomLengthM,
              hookHeightM,
              slewDeg,
            })),
        ),
      ),
  );
}

describe("catalog GLBs through the real Three loader", () => {
  it.each(catalog.equipment)(
    "loads $id at unit scale and applies its demo pose",
    async (preset) => {
      const scene = await loadAsset(preset);

      const rig = createEquipmentRig(scene, preset);
      rig.applyPose(preset.demoPose);

      expect(rig.model.scale.toArray()).toEqual([1, 1, 1]);
      const extent = new Box3().setFromObject(rig.model).getSize(new Vector3());
      expect(extent.toArray().every((value) => Number.isFinite(value) && value > 0)).toBe(true);
      expect(rig.model).not.toBe(scene);
    },
  );

  it.each(catalog.equipment.filter((preset) => preset.controls.trolley))(
    "preserves $id relative slew, trolley and hoist motion",
    async (preset) => {
      const scene = await loadAsset(preset);
      const rig = createEquipmentRig(scene, preset);
      const baseline = preset.controlBaselines;
      if (
        baseline.trolleyM === null ||
        baseline.hookHeightM === null ||
        baseline.ropeLengthM === null
      )
        throw new TypeError("Tower fixtures require trolley and hoist baselines");

      rig.applyPose({
        ...preset.demoPose,
        slewDeg: preset.demoPose.slewDeg + 12,
        trolleyM: baseline.trolleyM + 4,
        hookHeightM: baseline.hookHeightM + 2,
      });

      const originalTrolley = requiredNode(scene, preset.controlNodes.trolley);
      const originalHook = requiredNode(scene, preset.controlNodes.hook);
      const originalRopes = requiredNode(scene, preset.controlNodes.ropes);
      const originalSlew = requiredNode(scene, preset.controlNodes.slew);
      expect(requiredNode(rig.model, preset.controlNodes.trolley).position.x).toBeCloseTo(
        originalTrolley.position.x + 4,
      );
      expect(requiredNode(rig.model, preset.controlNodes.hook).position.y).toBeCloseTo(
        originalHook.position.y + 2,
      );
      expect(requiredNode(rig.model, preset.controlNodes.ropes).scale.y).toBeCloseTo(
        (originalRopes.scale.y * (baseline.ropeLengthM - 2)) / baseline.ropeLengthM,
      );
      expect(requiredNode(rig.model, preset.controlNodes.slew).rotation.y).toBeCloseTo(
        originalSlew.rotation.y + (12 * Math.PI) / 180,
      );
    },
  );

  it("rejects a declared control when its actual asset node is absent", async () => {
    const preset = catalog.equipment[0];
    if (!preset) throw new TypeError("Missing equipment fixture");
    const scene = await loadAsset(preset);

    const create = () =>
      createEquipmentRig(scene, {
        ...preset,
        controlNodes: { ...preset.controlNodes, slew: "ABSENT" },
      });

    expect(create).toThrow(EquipmentRigError);
  });

  it("preserves the LR manufacturer boom-foot datum and hook radius under rotated slew", async () => {
    const preset = catalog.equipment.find((entry) => entry.id === "liebherr-lr1100");
    if (!preset?.articulation) throw new TypeError("Missing articulated LR fixture");
    const rig = createEquipmentRig(await loadAsset(preset), preset);
    const boomAngleDeg = 55;

    rig.applyPose({
      ...preset.demoPose,
      boomAngleDeg,
      boomLengthM: 32,
      hookHeightM: 7,
      slewDeg: 73,
    });

    const slew = requiredNode(rig.model, preset.controlNodes.slew);
    const pivot = requiredNode(rig.model, preset.articulation.boom.pivotNode).getWorldPosition(
      new Vector3(),
    );
    const hook = requiredNode(rig.model, preset.articulation.hook.node).getWorldPosition(
      new Vector3(),
    );
    const hookFromSlew = hook.sub(slew.getWorldPosition(new Vector3()));
    const footFromSlew = slew.worldToLocal(pivot);
    expect.soft(footFromSlew.x).toBeCloseTo(1.2, 6);
    expect.soft(footFromSlew.z).toBeCloseTo(0, 6);
    expect
      .soft(Math.hypot(hookFromSlew.x, hookFromSlew.z))
      .toBeCloseTo(1.2 + 32 * Math.cos((boomAngleDeg * Math.PI) / 180), 5);
  });

  it.each([8, 10, 10.6])(
    "retains five Maeda shells and four moving stages at length %s with baseline return",
    async (boomLengthM) => {
      const preset = catalog.equipment.find((entry) => entry.id === "maeda-mc305");
      if (!preset?.articulation) throw new TypeError("Missing articulated Maeda fixture");
      const rig = createEquipmentRig(await loadAsset(preset), preset);
      const segments = preset.articulation.boom.segments;
      const baselines = segments.map((segment) =>
        requiredNode(rig.model, segment.node).position.clone(),
      );
      const shells: Object3D[] = [];
      rig.model.traverse((node) => {
        if (/^Telescopic_section_\d+$/.test(node.name)) shells.push(node);
      });

      rig.applyPose({ ...preset.demoPose, boomLengthM, slewDeg: 73 });

      expect.soft(segments).toHaveLength(4);
      expect
        .soft(segments.reduce((sum, segment) => sum + segment.lengthShare, 0))
        .toBeCloseTo(1, 12);
      expect
        .soft(shells.map((shell) => shell.name).sort())
        .toEqual([1, 2, 3, 4, 5].map((index) => `Telescopic_section_${index}`));
      for (let index = 0; index < 5; index += 1) {
        const parentName = index === 0 ? "BOOM_PIVOT" : `TELESCOPIC_${index}`;
        const shell = rig.model.getObjectByName(`Telescopic_section_${index + 1}`);
        expect.soft(shell).toBeInstanceOf(Mesh);
        expect.soft(shell?.parent?.name).toBe(parentName);
        if (shell instanceof Mesh) {
          const positions = shell.geometry.getAttribute("position");
          const vertices = new Set(
            Array.from({ length: positions.count }, (_, vertex) =>
              [positions.getX(vertex), positions.getY(vertex), positions.getZ(vertex)]
                .map((value) => value.toFixed(5))
                .join(","),
            ),
          );
          expect.soft(vertices.size).toBe(20);
        }
        if (index > 0)
          expect
            .soft(rig.model.getObjectByName(parentName)?.parent?.name)
            .toBe(index === 1 ? "BOOM_PIVOT" : `TELESCOPIC_${index - 1}`);
      }
      const slew = requiredNode(rig.model, preset.controlNodes.slew);
      const tip = slew.worldToLocal(
        requiredNode(rig.model, preset.articulation.boom.tipNode).getWorldPosition(new Vector3()),
      );
      const pivot = slew.worldToLocal(
        requiredNode(rig.model, preset.articulation.boom.pivotNode).getWorldPosition(new Vector3()),
      );
      const angle = (preset.demoPose.boomAngleDeg * Math.PI) / 180;
      expect
        .soft(tip.sub(pivot).toArray())
        .toEqual([
          expect.closeTo(boomLengthM * Math.cos(angle), 5),
          expect.closeTo(boomLengthM * Math.sin(angle), 5),
          expect.closeTo(0, 5),
        ]);

      rig.applyPose({ ...preset.demoPose, slewDeg: 73 });

      for (const [index, segment] of segments.entries())
        expect
          .soft(requiredNode(rig.model, segment.node).position.toArray())
          .toEqual(baselines[index]?.toArray());
    },
  );

  for (const preset of catalog.equipment.filter((entry) => entry.articulation !== null)) {
    describe(preset.id, () => {
      it.each(cornerPoses(preset))(
        "keeps links, hook and supports attached at angle $boomAngleDeg, length $boomLengthM, hook $hookHeightM, slew $slewDeg",
        async (pose) => {
          const definition = preset.articulation;
          if (!definition) throw new TypeError("Articulated fixture requires a rig definition");
          const rig = createEquipmentRig(await loadAsset(preset), preset);
          const fixed = fixedNodes(rig.model, preset.controlNodes.slew);

          rig.applyPose(pose);

          const tip = requiredNode(rig.model, definition.boom.tipNode).getWorldPosition(
            new Vector3(),
          );
          const pivot = requiredNode(rig.model, definition.boom.pivotNode).getWorldPosition(
            new Vector3(),
          );
          const axisTip = (
            rig.model.getObjectByName("BOOM_AXIS_TIP") ??
            requiredNode(rig.model, definition.boom.tipNode)
          ).getWorldPosition(new Vector3());
          const hook = requiredNode(rig.model, definition.hook.node).getWorldPosition(
            new Vector3(),
          );
          expect(hook.toArray()).toEqual([
            expect.closeTo(tip.x, 5),
            expect.closeTo(pose.hookHeightM ?? 0, 5),
            expect.closeTo(tip.z, 5),
          ]);
          expect(axisTip.distanceTo(pivot)).toBeCloseTo(pose.boomLengthM ?? 0, 4);
          const boomVector = axisTip.sub(pivot);
          expect(
            (Math.atan2(boomVector.y, Math.hypot(boomVector.x, boomVector.z)) * 180) / Math.PI,
          ).toBeCloseTo(pose.boomAngleDeg, 4);
          for (const link of definition.links) {
            const object = requiredNode(rig.model, link.node);
            const from = requiredNode(rig.model, link.fromNode).getWorldPosition(new Vector3());
            const to = requiredNode(rig.model, link.toNode).getWorldPosition(new Vector3());
            expect(
              object
                .localToWorld(new Vector3())
                .distanceTo(from.clone().lerp(to, link.startFraction)),
            ).toBeLessThan(1e-5);
            expect(
              object
                .localToWorld(new Vector3(0, link.restLengthM, 0))
                .distanceTo(from.clone().lerp(to, link.endFraction)),
            ).toBeLessThan(1e-5);
          }
          expect(rig.model.scale.toArray()).toEqual([1, 1, 1]);
          expect(fixed.length).toBeGreaterThan(1);
          for (const item of fixed) expect(item.node.matrixWorld.toArray()).toEqual(item.matrix);
        },
      );
    });
  }
});
