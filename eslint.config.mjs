import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
]);

export default eslintConfig;
