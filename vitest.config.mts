import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      // The real server-only package throws outside Next's "react-server"
      // resolve condition, which Vitest doesn't set. Every file this test
      // suite imports either has no "server-only" import (pure logic) or
      // is a service file that would need a live Supabase connection
      // anyway (covered separately by tests/integration/*, not unit
      // tests) -- so a no-op stub here is correct, not a workaround for a
      // real problem.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
