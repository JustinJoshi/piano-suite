# Task
Implement Step 3 of the agent-surface plan: surface wiring issues in the Workshop practice-page editor. Compute `validateArrangement(page.blocks)` in `components/custom-practice/practice-page-editor.tsx` (memoised on `page.blocks`), pass the per-block issues down through `WorkshopGrid` to `WorkshopTile`, and render a short inline notice on any tile with an issue — plain language, guidance not enforcement. Cover it with RTL tests. Plus one operator-ordered scope addition: fix the `ValidatedBlock` type omission of the runtime-attached `size` field in `lib/feature-blocks/schemas.ts`, with a unit assertion. Write the RTL tests for criteria 8 and 9.

# Context
You are working in the piano-suite git worktree at `/home/justin/piano-suite/.worktrees/fleet-agent-surface`, branch `fleet/agent-surface`. Start there:

```bash
cd /home/justin/piano-suite/.worktrees/fleet-agent-surface
git branch --show-current   # must print: fleet/agent-surface
```

This is phase 3 of 4 of a delegated run. Phase 1 (commit `a4e871c`) landed `lib/feature-blocks/validate-arrangement.ts` — a pure `validateArrangement(blocks): ArrangementResult` wrapper — and removed the dead `"unconsumed_output"` variant from `WiringIssue`. Phase 2 (commit `eba02f3`) landed the public `GET /api/blocks` catalogue. Your phase makes wiring problems visible to the user in the editor. The final phase (`finish-gate-and-pr`) owns push/PR and the repo finishing checklist.

**Binding drift correction — read carefully.** The authoritative spec is read-only and contains two stale prose spots it cannot shed:
- `docs/stage-2/phase-2.5-agent-surface/PLAN.md` line ~192: the Step-3 mapping table still lists an `unconsumed_output` row. That variant **no longer exists** — `WiringIssue["issue"]` is the two-member union `"unmet_requirement" | "orphan_transform"` (verified at `lib/feature-blocks/manifest-types.ts:78–83`). Do NOT reintroduce a third variant; do not "helpfully" restore the stale row.
- PLAN.md line ~70 still sketches a three-member `WiringIssue` union in prose. Also stale; the code is the truth.

The corrected mapping you must implement — exactly these two variants, no third row:

| Variant | Sentence |
| --- | --- |
| `unmet_requirement` | Needs a transport / a source / a MIDI input — derive from `detail` |
| `orphan_transform` | This transform has nothing to transform. Add a source above it |

Also from phase 1: `ArrangementResult` is `{ status: "valid" } | { status: "invalid"; issues: WiringIssue[] }` — the valid branch carries **no** `issues` key at all. Discriminate on `status`, never `issues.length`.

**Operator-ordered scope addition (binding).** The fleet typecheck phase (PR #95) confirmed: `ValidatedBlock` (`lib/feature-blocks/schemas.ts:63–68`) declares `{ id; type; version; config }` but `normalizeStoredBlock` attaches `size` at runtime (normalizeSize call at line 124, conditional spread into the returned object at ~line 131). The declared type omits the field, so every consumer of `ValidatedBlock["size"]` is flying blind and `tsc` cannot catch misuse. Fix: add the optional `size` field to `ValidatedBlock`, typed per what `normalizeSize` actually returns — verify against the code; `normalizeSize` is imported into `schemas.ts` from `../workshop-grid` (line 21) and is exported at `lib/workshop-grid.ts:97` returning `BlockSize | undefined`, with `BlockSize = { w: number; h: number }` exported at `lib/workshop-grid.ts:51`. Cover it with a unit assertion that `normalizeStoredBlock` output carries the normalized size on a known-good input.
- **CONFLICT WARNING:** PR #95 (OPEN) edits `lib/__tests__/feature-block-schemas.test.ts` (+16/−6). If the new assertions naturally live in that file, note the overlap and choose: extend that file (accepting a small merge conflict at PR time) or a small new co-located test file under `lib/__tests__/`. Either is acceptable; you must state which you chose in HANDOFF NOTES. (Heads-up: that test file already carries a pre-existing `tsc --noEmit` error — known since phase 1, not surfaced by the gate. Do not make it worse.)
- Your phase's commit summary must clearly account for this fix, and every commit carries `Phase: editor-wiring-notice`.

**Phase-2 deltas that touch you:** the serialized catalogue now has 10 keys per component (configSpec added) — any plan-doc example predating `eba02f3` is stale, but nothing in your scope serializes manifests. `GET /api/blocks` is a deliberately public, deploy-time-static catalogue (cache-control `max-age=3600, stale-while-revalidate=86400`). **Your phase does not need it at all:** wiring validation is local and synchronous via `validateArrangement`. Do not fetch the endpoint from the editor.

# Relevant files
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/docs/stage-2/phase-2.5-agent-surface/PLAN.md` — the authoritative spec, read-only for you. Step 3 starts at line 177; criteria 8 and 9 are at lines 127–128; the stale mapping row is at line ~192.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/AGENTS.md` — binding repo conventions: hotspot-file single-writer list, theming rules (never hard-code colors; pull from theme tokens), testing conventions (unit tests in co-located `__tests__`, RTL for components), naming conventions.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/feature-blocks/validate-arrangement.ts` — 23 lines; read whole. `validateArrangement`, `ArrangementResult`.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/feature-blocks/manifest-types.ts` — `WiringIssue` at lines 78–83.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/components/custom-practice/practice-page-editor.tsx` — the editor. Already imports `useMemo` (line 3) and renders `<WorkshopGrid blocks={page.blocks} …>` around lines 302–309. No `validateArrangement` usage yet — that is your insertion point.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/components/workshop-grid/workshop-grid.tsx` and `/home/justin/piano-suite/.worktrees/fleet-agent-surface/components/workshop-grid/workshop-tile.tsx` — grid and tile; the issues prop must flow through both (the tile renders the notice). Read both in full before editing.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/components/feature-blocks/target-block-shell.tsx` — the tone reference for "this block is inert" handling; muted guidance, not alarming failure.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/feature-blocks/schemas.ts` — scope addition: `ValidatedBlock` (63–68), `normalizeStoredBlock` (100+, size handling at 124/~131), `normalizeSize` import at line 21.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/workshop-grid.ts` — `BlockSize` (51) and `normalizeSize` (97). Hotspot-adjacent: you may **import** from it, but do not edit it.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/__tests__/feature-block-schemas.test.ts` — existing tests for `normalizeStoredBlock`; the potential PR #95 overlap point.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/components/workshop-marketplace/__tests__/library-sections.test.tsx` (and siblings under `components/**/__tests__/*.test.tsx`) — style references for RTL component tests in this repo.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/components/custom-practice/__tests__/wiring-notice.test.tsx` — the spec's named home for your new RTL tests (does not exist yet; you create it).

# Output format
Edits and new files:

```
components/custom-practice/__tests__/wiring-notice.test.tsx   (new — RTL, criteria 8 & 9)
components/custom-practice/practice-page-editor.tsx           (edit — compute memoised issues)
components/workshop-grid/workshop-grid.tsx                    (edit — pass issues through)
components/workshop-grid/workshop-tile.tsx                    (edit — render the notice)
lib/feature-blocks/schemas.ts                                 (edit — ValidatedBlock gains optional size)
lib/__tests__/feature-block-schemas.test.ts                   (edit, only if you chose the extend option)
  — or —
lib/__tests__/<small-new-file>.test.ts                        (new, only if you chose the new-file option)
```

Spec guidance you must honour (PLAN.md Step 3): plain language only, never the raw `issue` enum; existing theme tokens (`--color-destructive` exists but wiring guidance is not an error — prefer a muted/warning treatment already in the token set); do not block the user — the tile still renders and the page still saves; pass a `Map<blockId, WiringIssue[]>` once rather than a prop per issue type.

Commit on `fleet/agent-surface`, scoped to exactly this phase's paths (never `git add -A` from the root), title describing what and why, with these trailers (fill Agent-Id / Session-Id from your spawn context; paths relative to repo root):

```
Phase: editor-wiring-notice
Agent-Id: <agentId>
Session-Id: <sessionId>
Brief: .paseo-delegate/agent-surface/briefs/editor-wiring-notice.md
Verdict: .paseo-delegate/agent-surface/verdicts/editor-wiring-notice.json
```

The Verdict file does not exist yet — it is the validator's artefact; name it per the template exactly as phase 2 did.

# Tool and source guidance
- This is a UI-behaviour phase with an editor, grid, and tile all in play. Read each file in full before editing it; keep diffs surgical.
- Write incrementally. Do not pre-plan the whole artefact: grid/tile plumbing → notice rendering → memoised computation in the editor → RTL tests → schemas fix + assertion.
- RTL is available (`@testing-library/react` ^16.3.2, jsdom; `vitest.config.ts` collects `components/**`). Model your tests on the existing `.test.tsx` files under `components/**/__tests__/`.
- Run the gate before declaring done and paste real output in VERIFICATION:
  ```bash
  npm run lint
  npm run test:unit:run
  npm run build
  ```
  (`build` takes minutes — budget for it. `tsc --noEmit` has pre-existing errors in unrelated test files; the gate does not surface them; do not fix unrelated files.)
- Tooling: every shell command prints an `ERROR: ld.so: object '/usr/NX/lib/libnxegl.so' from LD_PRELOAD cannot be preloaded` line to stderr first — harmless noise, ignore it. `npx vitest/eslint/tsc` all execute fine from the worktree despite its empty `node_modules` dir (deps resolve from the main checkout) — verified by phase 2. Record any other tool surprise under TOOLING NOTES.
- The axe a11y gate (`e2e/a11y.spec.ts`) covers `/tools/workshop` — the final phase runs e2e, but do not introduce anything a11y-hostile (the notice must not create serious/critical violations).

# Task boundaries
This phase does not touch:
- Hotspot files per AGENTS.md: `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`, `app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`, `lib/music-theory.ts`, `lib/scoring.ts`, `package.json`, `package-lock.json`. No `npm install` / `npm ci`.
- `proxy.ts`, `app/chat/page.tsx`, `app/api/chat/route.ts`, `app/api/blocks/route.ts` and the phase-2 files (`lib/blocks-api-auth.ts`, `lib/feature-blocks/manifest.ts`) — done and validated; not yours.
- `lib/workshop-grid.ts` and `lib/feature-blocks/validate-arrangement.ts` / `manifest-types.ts` — import from them; do not edit them.
- The pure mapping/derivation logic, if you factor any out, belongs where the spec puts it (React-free `lib/feature-blocks/` discipline with relative imports) — but the spec's shape (editor memoises, grid passes, tile renders) is fixed; do not relocate responsibilities.
- No push, no PR — the final phase (`finish-gate-and-pr`) owns that, along with the repo finishing checklist (README/AGENTS updates). Commit locally on `fleet/agent-surface` and stop.
- The repository already exists inside this worktree; never create one.

# Effort budget
A moderate, self-contained slice: prop plumbing through two components, one memoised computation, one inline notice, RTL tests, plus the one-line-ish type fix and a small test assertion. Comparable to phases 1–2. If you find yourself restructuring the grid, touching the block registry, or editing files beyond Output format, you have left the phase; stop and report.

# Acceptance criteria
Checked by the validator against files you cannot edit — the authoritative spec (`docs/stage-2/phase-2.5-agent-surface/PLAN.md`) and `AGENTS.md`:

- [ ] 8. The editor shows an inline notice on a tile with a wiring issue, naming the problem in plain language. (Spec criterion 8, PLAN.md line 127, verified by RTL test — yours, in `components/custom-practice/__tests__/wiring-notice.test.tsx`.)
- [ ] 9. A page with no wiring issues shows no notices. (Spec criterion 9, PLAN.md line 128, RTL test.)
- [ ] S1. `ValidatedBlock` declares the runtime-attached `size` field, and a unit test asserts `normalizeStoredBlock` output carries the normalized size on a known-good input. (Operator-ordered addition; traces to the PR #95 typecheck finding and the assertion you write — the validator will re-run it.)
- [ ] S2. The corrected two-variant mapping is what ships: only `unmet_requirement` and `orphan_transform` are handled; `unconsumed_output` appears nowhere in code after your phase. (Traces to `lib/feature-blocks/manifest-types.ts:78–83`, which you cannot edit, and to `grep -rn "unconsumed_output" lib app components convex` returning nothing.)

# Constraints
- Must-preserve: the grid's existing behaviour for issue-free pages is byte-for-byte unchanged in practice (criterion 9); `normalizeStoredBlock`'s runtime behaviour does not change — this is a declared-type fix, not a normalizer change; no registered block content changes.
- Must-preserve: `ArrangementResult` discrimination on `status` (the valid branch has no `issues` key — trusting internal invariants, no defensive `issues ?? []`).
- Plain language in the notice; never render the raw `issue` enum string to the user.
- Colors only via existing theme tokens (AGENTS.md theming rules) — no hard-coded hex/rgb, no new one-off Tailwind palette utilities.
- A brief gave you pointers, not the answer: read the editor/grid/tile files and write your own code; the brief deliberately contains no code drafts.
- The AGENTS.md finishing checklist (README/`PROJECT_HISTORY`/AGENTS updates, push, PR) does **not** apply to this phase — the final phase owns it. Do not push.
- Leave the whole repository clean: `git status --porcelain` empty after your commit, no stray files anywhere in the worktree.

# Completion contract
Your final chat message must be your completion summary:

```
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ...
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
```

`TOOLING NOTES:` is mandatory even when empty — write `TOOLING NOTES: none`. It is for defects, surprises and workarounds in the **tools** (checker, harness, CLI), distinct from this phase's own work. Do not omit the line.

`HANDOFF NOTES:` must state (1) which test-file choice you made for the schemas assertion (extended `lib/__tests__/feature-block-schemas.test.ts` accepting the PR #95 overlap, or a new co-located file — name the file); (2) anything the final phase (`finish-gate-and-pr`) must absorb — it owns push/PR, the final gate, a11y e2e, and the AGENTS.md primitives-table updates for this phase's artefacts (the spec's definition-of-done asks for AGENTS.md rows/conventions; your phase must not edit AGENTS.md itself).
