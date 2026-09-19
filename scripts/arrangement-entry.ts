/**
 * Bundle entry for `scripts/check-arrangement.mjs`.
 *
 * Kept as a separate file (rather than an esbuild `stdin` blob) so the paths
 * it re-exports are typechecked by `tsc --noEmit` like any other source file:
 * if the validator moves, the gate catches it instead of the CLI failing at
 * run time.
 */
export { validateArrangement } from "../lib/feature-blocks/validate-arrangement";
export { resolveChain, getManifest } from "../lib/feature-blocks/manifest";
