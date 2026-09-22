import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/contracts": fileURLToPath(new URL("./packages/contracts/src/index.ts", import.meta.url)),
      "@gs-safety/contracts": fileURLToPath(
        new URL("./packages/contracts/src/index.ts", import.meta.url),
      ),
      "@/": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    maxWorkers: 2,
    include: [
      "src/**/*.test.ts",
      "packages/**/*.test.ts",
      "tests/**/*.test.ts",
      "scripts/**/*.test.ts",
    ],
    testTimeout: 15000,
  },
});
