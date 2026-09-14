import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";

// Vite/Vitest doesn't auto-load .env.local the way Next.js does -- load it
// explicitly so these tests can reach the real project without duplicating
// credentials anywhere.
const env = loadEnv("", import.meta.dirname, "");

/**
 * Separate config from vitest.config.mts on purpose: these tests hit the
 * REAL connected Supabase project (there is no local/staging instance for
 * this app -- see .env.local). They create their own throwaway users and
 * data and delete everything in an afterAll, but they are deliberately
 * NOT part of the default `npm test` run so nobody executes them against
 * production by accident; run explicitly via `npm run test:integration`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    env,
    // Integration tests share live rows (e.g. delivery slot capacity) --
    // running them one at a time avoids cross-test interference.
    fileParallelism: false,
  },
});
