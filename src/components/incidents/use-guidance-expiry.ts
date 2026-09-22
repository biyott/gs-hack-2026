"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useGuidanceExpiry(expiresAt: string, observedAt: string): boolean {
  const deadline = Date.parse(expiresAt);
  const subscribe = useCallback(
    (notify: () => void) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const check = () => {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          notify();
          return;
        }
        timer = setTimeout(check, Math.min(remaining + 1, 2_147_483_647));
      };
      check();
      document.addEventListener("visibilitychange", notify);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", notify);
      };
    },
    [deadline],
  );
  return useSyncExternalStore(
    subscribe,
    () => Math.max(Date.now(), Date.parse(observedAt)) >= deadline,
    () => Date.parse(observedAt) >= deadline,
  );
}
