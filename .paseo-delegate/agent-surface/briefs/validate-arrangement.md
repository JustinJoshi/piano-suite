# Task

Promote `validatePageWiring` into a standalone, pure `validateArrangement(blocks)` function in the Workshop feature-block library, and resolve whether the `"unconsumed_output"` `WiringIssue` variant is implemented or removed.

# Context

Piano Suite's Workshop lets users assemble practice pages from feature blocks (sources → transforms → displays/targets). `lib/feature-blocks/manifest.ts` already has `validatePageWiring(blocks)` returning `WiringIssue[]`, and `resolveChain` already calls it. Nothing wraps it in a typed pass/fail result that a route handler or a component could call directly — that's this phase. Two later phases (an API route, and an editor UI notice) will both call the function you build here, so its shape matters to work you will not see.

`WiringIssue` is defined in `lib/feature-blocks/manifest-types.ts` around line 78:

```ts
{ blockId: string; type: string; issue: "unmet_requirement" | "unconsumed_output" | "orphan_transform"; detail: string }
```

`"unconsumed_output"` is declared in that union but is never produced by the current `validatePageWiring` implementation — verify this yourself with a search; do not take this claim on faith. You must resolve it one of two ways, and either is acceptable, but you must not leave it as a dead, unimplemented variant:
- **Implement it**: define precisely what counts as unconsumed — a source block whose declared `outputs` no other block in the arrangement `accepts` — and make `validatePageWiring` (or your new function, wrapping it) produce it.
- **Remove it**: delete the variant from the `WiringIssue` union in `lib/feature-blocks/manifest-types.ts` and fix every place that becomes a type error, including the parity test.

# Relevant files

- `lib/feature-blocks/manifest.ts` — `validatePageWiring` (~line 673), `resolveChain` (~line 774), `describeRegistryForAgent` (~line 741). Read the full file before changing anything nearby.
- `lib/feature-blocks/manifest-types.ts` — the `WiringIssue` type and other manifest types. Convex-bundled: must stay React-free, no new imports of React or DOM types.
- `lib/feature-blocks/target-blocks.ts` — existing precedent for pure, React-free logic living in `lib/feature-blocks/` with only relative imports. Follow its import style.
- `lib/feature-blocks/__tests__/wiring.test.ts` — existing tests of `validatePageWiring`; read them to understand current behavior and fixture shapes before writing new tests.
- `lib/__tests__/page-fixtures.test.ts`, `lib/__tests__/starter-templates.test.ts` — both call `validatePageWiring` today; these must keep passing.
- `lib/marketplace-seeds.ts` — the featured/marketplace pages your function must accept cleanly (acceptance criterion 6).
- Starter templates (search for where starter/default pages are defined, likely near `lib/custom-practice-storage.ts` or a templates file) — also must validate cleanly.
- `lib/feature-blocks/registry.ts` and `lib/feature-blocks/schemas.ts` — read-only context on how blocks are registered; do not add or remove a block type in this phase.
- `lib/feature-blocks/__tests__/registry-parity.test.ts` — if you remove the `unconsumed_output` variant, check this test doesn't reference it; update it if it does.

# Output format

- New file: `lib/feature-blocks/validate-arrangement.ts`, exporting:

  ```ts
  export type ArrangementResult =
    | { status: "valid" }
    | { status: "invalid"; issues: WiringIssue[] };

  export function validateArrangement(blocks: FeatureBlock[]): ArrangementResult;
  ```

  Build it on top of `validatePageWiring`. It must be pure — no React, no DOM, no fetch, no side effects — safe to call from a Next.js route handler or a React component alike.

- New file: `lib/feature-blocks/__tests__/validate-arrangement.test.ts` (Vitest), covering:
  - An unknown block type is rejected.
  - An orphan transform (a transform block with no source feeding it) is rejected.
  - An unmet requirement (e.g. a target block requiring a MIDI input stream with none present) is rejected.
  - Every starter template validates with `status: "valid"` (parameterize over all of them).
  - Every marketplace seed page (`lib/marketplace-seeds.ts`) validates with `status: "valid"` (parameterize over all of them).
  - A page containing only a `midiConnectionBar` block produces `status: "valid"` with zero issues — this is a regression guard for the already-merged Phase 2.0 fix to `requirementToStream`. If this case fails, stop and report it as drift rather than trying to "fix" Phase 2.0's code in this phase.

# Tool and source guidance

Read the file before editing it. Use `grep`/`rg` to confirm every claim in this brief about line numbers and current behavior — line numbers may have drifted. Run `npx vitest run lib/feature-blocks/__tests__/validate-arrangement.test.ts` (and the two existing test files that call `validatePageWiring`) locally as you go, don't wait until the end to discover a break.

# Task boundaries

- Do not touch `app/api/**`, `components/custom-practice/**`, `components/workshop-grid/**`, or `components/feature-blocks/**` — those are later phases.
- Do not add or remove a registered block type.
- Do not touch `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`, `app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`, `package.json`, `package-lock.json` — these are hotspot files owned elsewhere.
- Do not run `npm ci` or `npm install`; do not touch `package-lock.json`.
- Do not push or open a PR — that happens in the final phase of this run.

# Effort budget

This is the first of four vertical slices of a larger phase (the plan calls this "the largest phase in the fleet" overall). Budget for one focused pass: read the existing wiring code and tests, write the new pure function and its test file, run the targeted tests, commit. Do not attempt the API route or the editor UI — those are separate phases you will not see.

# Acceptance criteria

(Numbers match the authoritative spec's table in `docs/stage-2/phase-2.5-agent-surface/PLAN.md`, which you should read in full before starting — it has more detail than fits here.)

- [ ] 4. `validateArrangement(blocks)` exists in `lib/feature-blocks/validate-arrangement.ts`, is pure, and returns a typed result distinguishing valid from invalid — verified by a unit test.
- [ ] 5. `validateArrangement` rejects an unknown block type, an orphan transform, and an unmet requirement — one test case each.
- [ ] 6. `validateArrangement` accepts every starter template and every marketplace seed — parameterized tests.
- [ ] 7. A page containing only `midiConnectionBar` produces zero issues — regression guard test.
- [ ] 10. `"unconsumed_output"` is either implemented (produced by the validator, with a test) or removed from the `WiringIssue` type (with all references updated, parity test still green).

# Constraints

- Keep the new file React-free and DOM-free — it will be called from a Next.js route handler in a later phase and must not break the Convex bundle if anything in this chain is Convex-adjacent. Match `target-blocks.ts`'s import style (relative imports only within `lib/feature-blocks/`).
- Never name a config field `key`, `ref`, or `children` if you touch any block config (you should not need to in this phase).
- Do not weaken or delete existing tests to make them pass — if an existing test's expectation looks wrong, report it in HANDOFF NOTES rather than silently changing its assertion.
- Follow AGENTS.md's testing conventions: co-locate tests in `__tests__` directories next to the code under test.

# Completion contract

Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: <paste real command output for the tests you ran, not a description>
BLOCKERS: ...
TOOLING NOTES: <defects/surprises in the tools themselves, distinct from your own work; "none" if none>
HANDOFF NOTES: <anything the next two phases (the API route phase and the editor UI phase) need to know about the shape of `ArrangementResult` or `WiringIssue`, or about the `unconsumed_output` decision you made>

Before finishing:
1. Run `git status --porcelain` in `/home/justin/piano-suite/.worktrees/fleet-agent-surface` (the whole repository worktree) — it must be empty except for files you intend to leave uncommitted for a reason you state in BLOCKERS.
2. Commit your changes with `git add lib/feature-blocks/validate-arrangement.ts lib/feature-blocks/__tests__/validate-arrangement.test.ts` plus any other files you touched by exact path (never `git add -A`), on branch `fleet/agent-surface` (you should already be on it — confirm with `git branch --show-current`).
3. Your commit message must end with these trailers (fill in your real agent id and session id — check your environment or ask the orchestrator's context; if you cannot determine them, write `unknown` rather than guessing):

   ```
   Phase: validate-arrangement
   Agent-Id: <your agent id>
   Session-Id: <your session id>
   Brief: .paseo-delegate/agent-surface/briefs/validate-arrangement.md
   Verdict: .paseo-delegate/agent-surface/verdicts/validate-arrangement.json
   ```

4. Do not commit or modify anything under `.paseo-delegate/` yourself — the orchestrator manages that directory.
