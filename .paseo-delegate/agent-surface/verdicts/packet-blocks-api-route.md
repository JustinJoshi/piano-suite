OUTCOME PACKET (phase 2 of 4: blocks-api-route → next: editor-wiring-notice)

You are the Planner for the agent-surface run. Author the brief for phase 3
(`editor-wiring-notice`) from this packet. You author briefs; you never implement.
Write the brief to:

/home/justin/piano-suite/.worktrees/fleet-agent-surface/.paseo-delegate/agent-surface/briefs/editor-wiring-notice.md

Reply with a short completion message when the brief is written. Do not spawn anyone.

## 0. Operator-ordered scope addition (bind it into the editor-wiring-notice brief)

The fleet's typecheck phase (PASS, PR #95) confirmed one bug that belongs to this
run's surface, and the operator directed it be folded into our remaining work rather
than left for a separate pass:

- `lib/feature-blocks/schemas.ts`: `ValidatedBlock` (line ~63) declares
  `{ id: string; type: string; version: number; config: Record<string, unknown> }`,
  but `normalizeStoredBlock` attaches `size` at runtime (line ~124 normalizes it,
  line ~131 spreads `...(size ? { size } : {})` into the returned object). The
  declared type omits the field, so every consumer of `ValidatedBlock["size"]` is
  flying blind and `tsc` cannot catch misuse.
- Fix: add `size?: BlockSize` to `ValidatedBlock` (import/widen the `BlockSize`
  type per whatever `normalizeSize` returns — verify against the code, do not trust
  this line). Cover it with a unit assertion that `normalizeStoredBlock` output
  carries the normalized size on a known-good input.
- CONFLICT WARNING: PR #95 (OPEN) edits `lib/__tests__/feature-block-schemas.test.ts`
  (+16/−6). If the new assertions naturally live in that file, note the overlap in
  the brief and let the worker choose: extend that file (accepting a small merge
  conflict at PR time) or a small new co-located test file. Either is acceptable;
  the worker must state which it chose.
- The phase-3 commit(s) must keep this fix clearly accounted in the summary, and
  the phase's commit trailers must carry `Phase: editor-wiring-notice`.

## 1. Master plan's spec for phase 3 (editor-wiring-notice), verbatim from the authoritative spec

Source: `/home/justin/piano-suite/.worktrees/fleet-agent-surface/docs/stage-2/phase-2.5-agent-surface/PLAN.md` (Step 3). The spec file is read-only for every phase.

> ### Step 3 — Surface issues in the editor
>
> Compute `validateArrangement(page.blocks)` in
> `components/custom-practice/practice-page-editor.tsx`, memoised on
> `page.blocks`, and pass the per-block issues down through `WorkshopGrid` to
> `WorkshopTile`.
>
> Render a short inline notice on any tile with an issue. Requirements:
>
> - Plain language, not the raw `issue` enum. Map each variant to a sentence
>   (see the mapping table below — CORRECTED, see §5 drift note).
> - Use existing theme tokens. `--color-destructive` exists for errors, but a
>   wiring issue is guidance, not a failure — prefer a muted or warning
>   treatment already in the token set over introducing one.
> - Do not block the user. The tile still renders and the page still saves.
>   This is information, not enforcement.
> - Follow the tone of `components/feature-blocks/target-block-shell.tsx`, which
>   already handles "this block is inert" gracefully.
>
> Write the RTL tests for criteria 8 and 9.

Acceptance criteria this phase owns (per the spec's table):
8. The editor shows an inline notice on a tile with a wiring issue, naming the problem in plain language. (RTL test)
9. A page with no wiring issues shows no notices. (RTL test)

Files the spec expects phase 3 to touch:
```
components/custom-practice/__tests__/wiring-notice.test.tsx (new)
components/custom-practice/practice-page-editor.tsx         (edit)
components/workshop-grid/workshop-grid.tsx                  (edit: pass issues through)
components/workshop-grid/workshop-tile.tsx                  (edit: render the notice)
```
Plus the §0 addition: `lib/feature-blocks/schemas.ts` (edit) and its test.

Files that stay off limits: `proxy.ts`, `convex/schema.ts`, `app/globals.css`,
`app/layout.tsx`, `app/tools/layout.tsx`, `components/tools/sidebar.tsx`,
`components/navbar.tsx`, `components/ui/*`, `package.json`, `package-lock.json`,
`app/chat/page.tsx`, `app/api/chat/route.ts`. No push, no PR (finish-gate-and-pr
owns that). No `npm ci`/`install`. The worktree's node_modules is an empty dir;
deps resolve from the main checkout and the gate runs fine from the worktree.

Spec risk guidance relevant here: pass a `Map<blockId, WiringIssue[]>` once, not a
prop per issue type; keep any new pure logic out of the Convex bundle (React-free
`lib/feature-blocks/`, relative imports).

## 2. Worker's completion summary for phase 2 (raw, unedited)

File: `.paseo-delegate/agent-surface/summaries/blocks-api-route.md` (read it in full
before authoring). Worker: [Worker] blocks-api-route · zai/glm-5.3-flash · agent
d6d6cf7e / session 5618cdd5 (flash successor — the original claude worker e2103322
was interrupted mid-build by the operator-ordered model swap; its uncommitted work
survived and was verified file-by-file, then completed). STATUS: complete. Commit
`eba02f3` on `fleet/agent-surface`, tree clean. Key deltas the phase-3 brief must
account for:

- `describeRegistryForAgent()` now serialises `configSpec` (option (a)); catalogue
  shape is 10 keys per component: type, kind, label, summary, justification,
  accepts, outputs, requires, configSpec, status. Any plan-doc example predating
  this is stale.
- `GET /api/blocks` is a deliberately PUBLIC catalogue (policy stated in the route
  doc comment per AGENTS.md; `auth()` still called via pure
  `authorizeBlocksApiAccess`; decision type is "ok"-only so the 403 branch is
  shape-required but unreachable). Cache-control: `public, max-age=3600,
  stale-while-revalidate=86400`. If the editor UI ever consumes it client-side,
  treat it as deploy-time-static.
- Full gate green at `eba02f3`: lint 0 errors (12 pre-existing warnings, unrelated
  files), unit 150 files / 1396 tests, build exit 0 with `/api/blocks` in the
  manifest. Production curl: HTTP 200, 20 components, configSpec on all.

## 3. Validator's assessment (curated; full verdict at `.paseo-delegate/agent-surface/verdicts/blocks-api-route.json`)

PASS, no gaps. Independently re-verified: own production build + own `next start`/
curl (HTTP 200, exact 10-key body incl. configSpec on all 20 components, byte-stable
shape), AC 2 policy/purity/branch coverage confirmed against the files, AC 3 durable
count-parity test + determinism test, registry-parity green (17 tests), full gate
re-run green (lint 0 errors, 1396/1396 unit, build exit 0), provenance complete and
correct (flash worker ids per operator-ordered swap), commit scoped to exactly the
five declared paths, tree clean, boundaries respected. Fragile-but-documented: the
"ok"-only decision union (widening path documented in the route) and the 1h/SWR
cache (acceptable only because the body is deploy-time-static, which the test pins).

## 4. Validator's handoff_notes (deltas the next phase must absorb)

(1) `describeRegistryForAgent()` output now includes configSpec on every component — serialized catalogue shape is 10 keys per component; any plan-doc example predating this is stale. (2) RE-FLAGGED DRIFT, now directly in the editor phase's path: PLAN.md's Step-3 mapping table still lists the removed `unconsumed_output` row — map ONLY `unmet_requirement` and `orphan_transform` (`WiringIssue["issue"]` is a two-member union since phase 1). (3) `ArrangementResult`'s valid branch carries no `issues` key — discriminate on `status`, never `issues.length`. (4) `GET /api/blocks` exists as a public catalogue with cache-control max-age=3600/swr=86400 — treat as deploy-time-static if consumed client-side. (5) Pre-existing `tsc --noEmit` errors in unrelated test files remain; the gate does not surface them. (6) Run bookkeeping: phase-2 commit trailers carry the executing zai/glm-5.3-flash worker's ids per the operator-ordered provider swap; the run ledger's claude ids for the original spawn are historical only. (7) The commit's Verdict trailer names `verdicts/blocks-api-route.json` — now filed by the validator.

## 5. Drift flagged by the validator — why the planner is authoring this brief

Both phase verdicts so far carry `drift: "detected"` for the same root cause: the
spec doc's Step-3 mapping table (line ~192) still lists `unconsumed_output`, which
phase 1 removed from the `WiringIssue` union (justified — implementing it would have
falsely flagged two shipped pages). The spec doc is read-only for every phase, so
the correction must live in YOUR brief. The corrected mapping the worker must
implement:

| Variant | Sentence |
| --- | --- |
| `unmet_requirement` | Needs a transport / a source / a MIDI input — derive from `detail` |
| `orphan_transform` | This transform has nothing to transform. Add a source above it |

(`unconsumed_output`: no row — the variant no longer exists. The brief must say so
explicitly so the worker does not "helpfully" reintroduce it.)

## 6. Ledger extract

- Phase `validate-arrangement`: PASS, 0 fix-ups, drift detected. Commit `a4e871c`.
- Phase `blocks-api-route`: PASS, 0 fix-ups, drift detected (same root cause). Commit `eba02f3`. Summary mirrored at `/home/justin/piano-suite/.paseo-delegate/fleet-20260916/summaries/blocks-api-route.md` (operator-named location).
- Remaining: `editor-wiring-notice` (this brief; depends_on validate-arrangement — satisfied), `finish-gate-and-pr` (depends on all three; owns push/PR, final gate, a11y e2e, and repo-level finishing checklist incl. the AGENTS.md primitives-table updates).
- Contract-dir note for the final phase: the spec's definition-of-done asks for AGENTS.md updates (primitives table rows for `validate-arrangement.ts` and `app/api/blocks/route.ts`, wiring-notice convention). Phases 1-3 do not touch AGENTS.md; the finish phase's brief must own them.
- Brief rules bind: state objective, output format, tool/source guidance, boundaries, budget; never draft the deliverable; every acceptance criterion traces to a file the worker cannot edit (the spec + AGENTS.md).
