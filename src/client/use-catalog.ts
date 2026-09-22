"use client";

import { useEffect, useState } from "react";
import type { Catalog } from "@/contracts";
import { api, errorMessage } from "./api";

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void api
      .catalog()
      .then((value) => {
        if (active) setCatalog(value);
      })
      .catch((failure: unknown) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, []);
  return { catalog, error };
}
