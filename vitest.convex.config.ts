import { defineProject } from "vitest/config";
import path from "path";

export default defineProject({
  test: {
    name: "convex",
    environment: "edge-runtime",
    globals: true,
    include: ["convex/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
