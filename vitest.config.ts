import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "./vitest.frontend.config.ts",
      "./vitest.convex.config.ts",
    ],
  },
});
