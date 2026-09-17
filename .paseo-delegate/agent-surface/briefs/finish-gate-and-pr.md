# Task

Final phase of the agent-surface run: verify the whole phase's surface end-to-end, land the repo finishing checklist, and deliver the branch as a pull request. Concretely: run the full gate, run the named e2e specs (API boundary + a11y), update `AGENTS.md` with the primitives-table rows and the wiring-notice convention, commit the run's contract directory, push `fleet/agent-surface`, and open a PR against `main` with `gh pr create`. Print the PR URL. Do not merge.

# Context

You are working in the piano-suite git worktree at `/home/justin/piano-suite/.worktrees/fleet-agent-surface`, branch `fleet/agent-surface`. Start there:

```bash
cd /home/justin/piano-suite/.worktrees/fleet-agent-surface
git branch --show-current   # must print: fleet/agent-surface
git log --oneline -3        # expect: bfe9dfd (editor notices), eba02f3 (/api/blocks), a4e871c (validateArrangement)
git status --porcelain      # must be empty before you start
```

This is phase 4 of 4. Three worker phases already landed and each PASSED independent validator verification:

1. `a4e871c` — `lib/feature-blocks/validate-arrangement.ts` (pure `validateArrangement` over `validatePageWiring`; removed the dead `"unconsumed_output"` variant from the `WiringIssue` union).
2. `eba02f3` — public `GET /api/blocks` catalogue (`app/api/blocks/route.ts`, `lib/blocks-api-auth.ts`, tests, `configSpec` added to `describeRegistryForAgent()`).
3. `bfe9dfd` — editor wiring notices (`PracticePageEditor` memoises `validateArrangement`, passes a `Map<blockId, WiringIssue[]>` through `WorkshopGrid` to `WorkshopTile`, which renders a muted plain-language notice) plus the operator-ordered `ValidatedBlock.size?: BlockSize` type fix.

Your phase adds no product code. If you find yourself writing component or lib code, you have left the phase — the only repo file you may edit is `AGENTS.md` (plus the contract-directory commit described below).

## Accumulated corrections you must carry (from the validators' handoff notes)

- The authoritative spec is read-only and contains stale prose: PLAN.md ~line 70 sketches a three-member `WiringIssue` union and ~line 192 still lists the removed `unconsumed_output` row. The shipped code is the truth: the union is `"unmet_requirement" | "orphan_transform"`. Never edit the spec doc; if you write the PR body, describe the shipped behaviour, not the stale prose.
- `ArrangementResult` valid branch carries no `issues` key — discriminate on `status`, never `issues.length`.
- `/api/blocks` is deliberately public (policy stated in its doc comment per AGENTS.md), deploy-time-static: `cache-control: public, max-age=3600, stale-while-revalidate=86400`. Nothing in the editor fetches it.
- `lib/__tests__/feature-block-schemas.test.ts` was extended in `bfe9dfd` (one import line + an end-of-file describe block). PR #95 (OPEN on the fleet side) also touches that file — expect at most a trivial import-line merge; do nothing about it, just mention it in the PR body if it seems relevant.
- ~49 pre-existing `tsc --noEmit` errors persist in unrelated test files; the gate does not surface them; do not fix unrelated files.
- `docs/components/README.md`'s generated table: the phase-1 commit removed a variant from `manifest-types.ts` and phase-2 extended a serializer's output — neither changed any registered manifest. If `registry-parity.test.ts` passes in the gate (it does), the table is in parity; verify via the gate, and only regenerate with `UPDATE_COMPONENT_DOCS=1 ./node_modules/.bin/vitest run lib/feature-blocks/__tests__/registry-parity.test.ts` if it actually fails.

# Output format

1. **Verification run** (no repo changes): the full gate, plus the e2e specs the spec's definition-of-done names:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   npm run test:e2e -- e2e/chat-auth.spec.ts e2e/auth-protection.spec.ts
   npm run test:e2e -- e2e/a11y.spec.ts
   ```
   The axe gate (`e2e/a11y.spec.ts`) scans `/tools/workshop` signed-out and must show zero serious/critical violations — phase 3 added editor UI, so this run is mandatory. Never lower the threshold; if a violation appears, fix it in place (a scoped code fix is then within your phase — say so in the summary) and re-run.
   Criterion 1 evidence: start the production build (`npx next start -p <port>`, port in 3330-3390), `curl http://localhost:<port>/api/blocks`, and paste the actual HTTP status, headers, and a body sample in VERIFICATION — not a description. Kill the server afterwards and make sure it is actually dead (a `pkill` whose pattern matches its own parent shell is a known trap here; verify with `pgrep -f` using a pattern that cannot self-match).
   Also restate the 11 acceptance criteria from `docs/stage-2/phase-2.5-agent-surface/PLAN.md` as a checklist in your summary with one line each: pass evidence or pointer to the evidence (validator verdicts at `.paseo-delegate/agent-surface/verdicts/` count as evidence for already-verified criteria — cite them; a worker's own report alone never does).
2. **AGENTS.md update** (edit): add primitives-table rows for `lib/feature-blocks/validate-arrangement.ts`, `app/api/blocks/route.ts`, and `lib/blocks-api-auth.ts`, and record the wiring-notice convention (WorkshopTile guidance notice; `issuesByBlockId: Map<blockId, WiringIssue[]>` passed once through the grid; plain-language mapping over the two-member `WiringIssue` union; guidance not enforcement — tile renders and page saves regardless). Match the table's existing row style and one-line-per-primitive density; read AGENTS.md first.
3. **Contract-directory commit**: the run's briefs, summaries, verdicts, plan, ledger, and schemas live at `.paseo-delegate/agent-surface/` but are gitignored. Commit them in their own commit with `git add -f .paseo-delegate/agent-surface/` (scoped to exactly that path — never `git add -A`). Never edit `.gitignore` (a concurrent run owns it).
4. **Push + PR**: `git push -u origin fleet/agent-surface`, then `gh pr create` against `main`. Title and body summarising the three landed phases plus the operator-ordered schemas fix; include the final gate results and the PR-check note about PR #95's test-file overlap. Print the PR URL. Do not merge.

Commit discipline: your two commits (AGENTS.md update; contract dir) each carry these trailers (fill Agent-Id / Session-Id from your spawn context):

```
Phase: finish-gate-and-pr
Agent-Id: <agentId>
Session-Id: <sessionId>
Brief: .paseo-delegate/agent-surface/briefs/finish-gate-and-pr.md
Verdict: .paseo-delegate/agent-surface/verdicts/finish-gate-and-pr.json
```

(The Verdict file is the validator's artefact, as in prior phases — reference the path, do not create it.)

# Tool and source guidance

- The gate is the evidence: paste real command output for every gate step in VERIFICATION. No summaries.
- `npm run build` takes minutes; e2e suites need browsers (Playwright is installed; prior fleet runs executed these specs successfully on ports 3340/3377). If a spec is flaky, re-run once before investigating; a genuine failure is a genuine failure — see boundaries.
- Dev-server / Playwright ports: pick free ones in 3330-3390. Ports 3000, 3210, 3310-3320 are taken by other agents and the local Convex backend.
- `node_modules` is shared from the main checkout by directory-tree resolution; the worktree's own `node_modules` dir is empty. Never run `npm ci`/`npm install`; never touch `package-lock.json`.
- Tooling: every shell command prints an `ERROR: ld.so: object '/usr/NX/lib/libnxegl.so' from LD_PRELOAD cannot be preloaded` line to stderr first — harmless noise. Large `write_file` payloads have been truncated mid-JSON by the tool layer twice in this run; if a write fails, retry immediately (a retry has always succeeded) and verify the file on disk. Record surprises under TOOLING NOTES.

# Task boundaries

- Do not edit: `docs/stage-2/phase-2.5-agent-surface/PLAN.md` (read-only spec), `.gitignore`, any hotspot file per AGENTS.md (`convex/schema.ts`, `app/globals.css`, `app/layout.tsx`, `app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`, `lib/music-theory.ts`, `lib/scoring.ts`, `package.json`, `package-lock.json`), `proxy.ts`, `lib/workshop-grid.ts`.
- No product/lib/component code except an in-place fix forced by a failing gate or a11y violation (see Output format 1); such a fix must be scoped to the failure and called out in the summary.
- Never commit to `main`; never merge the PR; never force-push.
- The repository already exists inside this worktree; never create one.
- A failing criterion: fix it yourself, but stop after 3 attempts on one criterion and report STATUS: blocked.

# Effort budget

A verification-and-delivery session: gate, e2e, one doc edit, two commits, push, PR. No new features. If the gate is red at HEAD for reasons outside this run's files, stop and report instead of fixing the world.

# Acceptance criteria

- [ ] F1. Full gate green at final HEAD: `npm run lint` 0 errors; `npm run test:unit:run` >= 1349 passing, 0 failures; `npm run build` exit 0. Real output pasted.
- [ ] F2. `e2e/chat-auth.spec.ts` and `e2e/auth-protection.spec.ts` pass (spec definition-of-done step 5; the run added an API route). Real output pasted.
- [ ] F3. `e2e/a11y.spec.ts` passes with zero serious/critical violations on `/tools/workshop` signed-out (plan convention; editor UI shipped in phase 3). Real output pasted.
- [ ] F4. Criterion-1 evidence reproduced at final HEAD: `GET /api/blocks` HTTP 200 with the catalogue body, actual response pasted, server cleaned up.
- [ ] F5. AGENTS.md carries the primitives-table rows and the wiring-notice convention, matching existing style.
- [ ] F6. Contract directory committed via `git add -f` scoped to `.paseo-delegate/agent-surface/` only; `.gitignore` untouched.
- [ ] F7. `fleet/agent-surface` pushed; PR opened against `main` with `gh pr create`; PR URL printed; nothing merged; tree clean after your commits.
- [ ] F8. All commits in the PR (a4e871c, eba02f3, bfe9dfd, and yours) carry complete provenance trailers (Phase/Agent-Id/Session-Id/Brief/Verdict — the three phase commits already do; verify, don't assume).

# Completion contract

Your final chat message must be your completion summary:

```
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ...   (gate output, e2e output, HTTP evidence, PR URL)
BLOCKERS: ...
TOOLING NOTES: ...  (mandatory even when empty — write TOOLING NOTES: none)
HANDOFF NOTES: ...
```

`HANDOFF NOTES:` must state anything left undone (per the fleet contract: the final report must carry phase verdicts, the PR URL, the gate output, and anything left undone) and any deviation you had to make inside the boundaries (e.g. an a11y fix commit).
