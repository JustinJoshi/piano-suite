import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore build artifacts and node_modules inside other agents' worktrees.
    ".worktrees/**",
    // Convex generated files are rewritten by the CLI and carry their own
    // eslint-disable directives that conflict with this config.
    "convex/_generated/**",
  ]),
  {
    files: [
      "hooks/useChordDrill.ts",
      "hooks/useChordDrillSettings.ts",
      "hooks/useArpeggioSettings.ts",
      "hooks/useArpeggios.ts",
      "hooks/useMidi.ts",
      "hooks/useProgression.ts",
      "hooks/useProgressionSettings.ts",
      "hooks/useRootCycling.ts",
      "hooks/useRootCyclingSettings.ts",
    ],
    rules: {
      // These hooks intentionally use refs to bridge async callbacks and
      // stabilize the drill engine's callbacks across render cycles. The
      // React Compiler's strict immutability rules fight the engine's
      // imperative timer/MIDI state machine, so they are disabled here.
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["convex/**/*.ts"],
    plugins: {
      convex: convexPlugin,
    },
    rules: {
      "convex/require-args-validator": "error",
      "convex/explicit-table-ids": "error",
      "convex/no-collect-in-query": "error",
      // Filter is acceptable in clear mutations when no purpose-built index
      // exists, but warn so future additions are considered.
      "convex/no-filter-in-query": "warn",
    },
  },
]);

export default eslintConfig;
