import { describe, expect, it } from "vitest";
import type { SessionRole } from "@/contracts";
import { canReadTracking } from "./tracking-access";

describe("raw tracking consumer access", () => {
  it.each(["admin", "operator", "support", "observer"] satisfies SessionRole[])(
    "allows the console consumer role %s",
    (role) => {
      expect(canReadTracking(role)).toBe(true);
    },
  );

  it.each(["worker", "device", null, undefined] satisfies (SessionRole | null | undefined)[])(
    "denies a restored producer or absent session %s",
    (role) => {
      expect(canReadTracking(role)).toBe(false);
    },
  );
});
