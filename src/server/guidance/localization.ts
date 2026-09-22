import type { Guidance, WorkerProfile } from "@/contracts";

export type GuidanceLocale = Pick<Guidance, "locale" | "requestedLocale" | "fallbackLocaleUsed">;

export function resolveGuidanceLocale(
  requestedLocale: WorkerProfile["preferredLocale"],
): GuidanceLocale {
  const language = requestedLocale?.trim().toLowerCase().split("-")[0];
  switch (language) {
    case "ko":
      return { locale: "ko", requestedLocale, fallbackLocaleUsed: false };
    case "en":
      return { locale: "en", requestedLocale, fallbackLocaleUsed: false };
    default:
      return { locale: "en", requestedLocale, fallbackLocaleUsed: true };
  }
}
