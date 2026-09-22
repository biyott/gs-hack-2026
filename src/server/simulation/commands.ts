import type { Session, SimulationCommand, SimulationSnapshot } from "@/contracts";
import { ApiFault } from "../http/errors";
import { getTrackingServices } from "../services/tracking";
import { applyControl } from "./equipment-controls";
import { requestPlaybackStop } from "./playback";
import type { SimulationRun } from "./run";
import { observeWorld } from "./snapshots";
import { projectTracking } from "./tracking-projection";

function unreachable(value: never): never {
  throw new ApiFault(400, "INVALID_COMMAND", String(value));
}

export function executeCommand(
  run: SimulationRun,
  command: SimulationCommand,
  context: Readonly<{ session: Session; recipients: number }>,
): SimulationSnapshot[] {
  const now = new Date().toISOString();
  const preset = run.configuration.equipment.find(
    (candidate) => candidate.id === run.snapshot.equipment.presetId,
  );
  if (!preset) throw new ApiFault(409, "EQUIPMENT_MISSING", "Equipment preset unavailable");
  switch (command.action) {
    case "start":
      run.start(now, context.recipients);
      break;
    case "pause":
      run.clock.pause();
      run.snapshot = requestPlaybackStop(run.snapshot, now);
      break;
    case "resume":
      run.clock.resume();
      break;
    case "speed":
      run.clock.setSpeed(command.speed);
      break;
    case "advance":
      return run.advance(command.deltaMs, context.recipients);
    case "position-input": {
      run.snapshot = {
        ...run.snapshot,
        run: { ...run.snapshot.run, positionInput: command.input },
      };
      if (command.input === "measured") {
        run.snapshot = projectTracking(
          run.snapshot,
          getTrackingServices().tracking.getSnapshot(),
          now,
          preset.controls.translation,
        );
      } else {
        run.snapshot = observeWorld(
          {
            ...run.snapshot,
            workers: run.snapshot.workers.map((worker) => ({
              ...worker,
              positionSource: "mock",
              positionInputSource: "synthetic",
            })),
            equipment: {
              ...run.snapshot.equipment,
              positionSource: "mock",
              positionInputSource: "synthetic",
            },
          },
          {
            world: run.world,
            virtualTimeMs: run.snapshot.run.virtualTimeMs,
            now,
            policy: run.policy,
          },
        );
      }
      if (
        run.snapshot.run.status === "running" ||
        run.snapshot.incidents.some((incident) => incident.status !== "closed")
      )
        run.evaluate(
          now,
          context.recipients,
          run.snapshot.workers.map((worker) => worker.workerId),
        );
      break;
    }
    case "profile": {
      const worker = run.snapshot.workers.find(
        (candidate) => candidate.workerId === command.workerId,
      );
      if (
        !worker ||
        command.profile.workerId !== command.workerId ||
        command.profile.version <= worker.profile.version
      )
        throw new ApiFault(
          409,
          "PROFILE_VERSION",
          "Profile must belong to the worker and have a newer version",
        );
      run.world = {
        ...run.world,
        state: {
          ...run.world.state,
          workers: run.world.state.workers.map((candidate) =>
            candidate.workerId === command.workerId
              ? { ...candidate, profile: command.profile }
              : candidate,
          ),
        },
      };
      run.snapshot = {
        ...run.snapshot,
        workers: run.snapshot.workers.map((candidate) =>
          candidate.workerId === command.workerId
            ? { ...candidate, profile: command.profile }
            : candidate,
        ),
      };
      run.evaluate(now, context.recipients, [command.workerId]);
      break;
    }
    case "equipment": {
      if (run.snapshot.mode !== "equipment")
        throw new ApiFault(400, "MODE_MISMATCH", "Equipment controls belong to equipment mode");
      const next = run.configuration.equipment.find(
        (candidate) => candidate.id === command.presetId,
      );
      if (!next?.riskGeometry)
        throw new ApiFault(400, "GEOMETRY_UNAVAILABLE", "Equipment risk geometry unavailable");
      const position = next.controls.translation
        ? run.snapshot.equipment.position
        : run.configuration.map.metadata.craneOrigin;
      run.snapshot = {
        ...run.snapshot,
        equipment: {
          ...run.snapshot.equipment,
          ...next.demoPose,
          presetId: next.id,
          position,
          speedMps: 0,
          headingDeg: 0,
          geometryVersion: run.snapshot.equipment.geometryVersion + 1,
        },
      };
      if (run.world.state.equipment)
        run.world = {
          ...run.world,
          state: {
            ...run.world.state,
            equipment: {
              ...run.world.state.equipment,
              modelId: next.id,
              position,
              headingDeg: 0,
              speedMps: 0,
              slewDeg: next.demoPose.slewDeg,
            },
          },
        };
      run.equipmentCleared = false;
      if (run.snapshot.run.positionInput === "measured")
        run.snapshot = projectTracking(
          run.snapshot,
          getTrackingServices().tracking.getSnapshot(),
          now,
          next.controls.translation,
        );
      run.evaluate(
        now,
        context.recipients,
        run.snapshot.workers.map((worker) => worker.workerId),
      );
      break;
    }
    case "control": {
      if (run.snapshot.mode !== "equipment")
        throw new ApiFault(400, "MODE_MISMATCH", "Equipment controls belong to equipment mode");
      applyControl(run, command, preset);
      run.equipmentCleared = false;
      run.evaluate(
        now,
        context.recipients,
        run.snapshot.workers.map((worker) => worker.workerId),
      );
      break;
    }
    case "select":
    case "reset":
      throw new ApiFault(500, "RESET_DISPATCH", "Reset must be dispatched by the runtime");
    default:
      return unreachable(command);
  }
  const clock = run.clock.snapshot();
  run.snapshot = {
    ...run.snapshot,
    run: { ...run.snapshot.run, status: clock.status, speed: clock.speed, updatedAt: now },
  };
  run.audit(
    `simulation.${command.action}`,
    context.session.actorId,
    JSON.stringify({
      requestId: command.requestId,
      ...(command.action === "position-input" ? { input: command.input } : {}),
    }),
  );
  return [run.snapshot];
}
