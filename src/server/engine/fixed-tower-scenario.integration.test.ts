import { describe, expect, it } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { cleanups, configuration, fixture } from "../simulation/runtime-test-fixtures";

function towerRun(scenarioId: string) {
  const f = fixture();
  f.command({ action: "select", scenarioId });
  f.command({ action: "start" });
  const initial = f.command({ action: "equipment", presetId: "liebherr-172ecb" });
  const publications: SimulationSnapshot[] = [];
  cleanups.push(f.runtime.bus.subscribe("equipment", (snapshot) => publications.push(snapshot)));
  return { f, initial, publications };
}

function chassisHazards(snapshot: SimulationSnapshot) {
  return snapshot.hazards
    .filter((hazard) => hazard.hazardId.includes(":body:") || hazard.hazardId.includes(":support:"))
    .map((hazard) => ({
      part: hazard.hazardId.split(":").slice(-2).join(":"),
      polygon: hazard.polygon,
    }));
}

const scenarios = [
  { id: "EQ-APPROACH", publicationTimes: [1000, 5000, 10000, 15000, 20000] },
  { id: "EQ-SPEED-DIRECTION", publicationTimes: [1000, 4000, 8000, 12000, 16000, 20000] },
] as const;

describe("fixed tower selection during mobile equipment scenarios", () => {
  for (const scenario of scenarios) {
    it(`keeps the tower at the declared origin in every ${scenario.id} publication`, () => {
      // Given
      const { f, publications } = towerRun(scenario.id);
      // When
      f.command({ action: "advance", deltaMs: 20000 });
      // Then
      expect(publications.map((snapshot) => snapshot.run.virtualTimeMs)).toEqual(
        scenario.publicationTimes,
      );
      expect(publications.map((snapshot) => snapshot.equipment.position)).toEqual(
        scenario.publicationTimes.map(() => configuration.map.metadata.craneOrigin),
      );
    });

    it(`ignores scenario chassis heading and speed for the tower in ${scenario.id}`, () => {
      // Given
      const { f, publications } = towerRun(scenario.id);
      // When
      f.command({ action: "advance", deltaMs: 20000 });
      // Then
      expect(
        publications.map((snapshot) => ({
          heading: snapshot.equipment.headingDeg,
          speed: snapshot.equipment.speedMps,
        })),
      ).toEqual(scenario.publicationTimes.map(() => ({ heading: 0, speed: 0 })));
    });

    it(`keeps body and support hazards anchored throughout ${scenario.id}`, () => {
      // Given
      const { f, initial, publications } = towerRun(scenario.id);
      const anchored = chassisHazards(initial);
      // When
      f.command({ action: "advance", deltaMs: 20000 });
      // Then
      expect(anchored.length).toBeGreaterThan(0);
      expect(publications.map(chassisHazards)).toEqual(
        scenario.publicationTimes.map(() => anchored),
      );
    });
  }
});
