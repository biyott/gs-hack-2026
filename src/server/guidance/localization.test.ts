import { describe, expect, it } from "vitest";
import { resolveGuidanceLocale } from "./localization";

describe("guidance locale selection", () => {
  it.each(["ko", "ko-KR", " KO-kr "])(
    "uses Korean when the explicit preference is %s",
    (requestedLocale) => {
      const selection = resolveGuidanceLocale(requestedLocale);
      expect(selection.locale).toBe("ko");
      expect(selection.requestedLocale).toBe(requestedLocale);
      expect(selection.fallbackLocaleUsed).toBe(false);
    },
  );

  it.each(["en", "en-US", "EN-gb"])(
    "uses English when the explicit preference is %s",
    (requestedLocale) => {
      const selection = resolveGuidanceLocale(requestedLocale);
      expect(selection.locale).toBe("en");
      expect(selection.requestedLocale).toBe(requestedLocale);
      expect(selection.fallbackLocaleUsed).toBe(false);
    },
  );

  it.each(["vi", "fr-FR", "unknown", null])(
    "preserves requested locale and marks fallback when preference is %s",
    (requestedLocale) => {
      const selection = resolveGuidanceLocale(requestedLocale);
      expect(selection.locale).toBe("en");
      expect(selection.requestedLocale).toBe(requestedLocale);
      expect(selection.fallbackLocaleUsed).toBe(true);
    },
  );
});
