# Fixup brief — finish-gate-and-pr (fixup 1)

The phase-4 validator PASSed your phase but flagged one open item the orchestrator is routing back to you: spec definition-of-done step 7 (`docs/stage-2/phase-2.5-agent-surface/PLAN.md` line ~272: "Update `README.md` and `docs/PROJECT_HISTORY.md`") was done by no phase in this run. You hold the run's full context, so you close it.

# Task

Update `README.md` and `docs/PROJECT_HISTORY.md` in the worktree to reflect what this run shipped, then commit and push.

What the run shipped (your evidence base; all merged into branch HEAD you already validated):
- `lib/feature-blocks/validate-arrangement.ts` — pure `validateArrangement(blocks): ArrangementResult` over `validatePageWiring`; dead `"unconsumed_output"` variant removed from the `WiringIssue` union. Commit `a4e871c`.
- `app/api/blocks/route.ts` + `lib/blocks-api-auth.ts` — public `GET /api/blocks` catalogue of the 20-block registry (kind/accepts/outputs/requires/configSpec per component), policy stated in-code, deploy-time-static cache headers. Commit `eba02f3`.
- Editor wiring notices — `PracticePageEditor` memoises `validateArrangement`, passes `Map<blockId, WiringIssue[]>` through `WorkshopGrid` to `WorkshopTile`; muted plain-language guidance per tile (two-member union: `unmet_requirement`, `orphan_transform`); guidance not enforcement. Commit `bfe9dfd`.
- `ValidatedBlock` now declares the runtime-attached `size?: BlockSize` (operator-ordered typecheck fix), same commit.

# Audience rules (binding — from the repo's project direction)

- `README.md` speaks to beginners first: welcome, inclusivity, beginner success. Add only what a beginner-facing README can carry in its existing voice and structure — the user-visible behaviours (a practice page now tells you in plain language when its blocks aren't wired together, and the page still works; the workshop publishes a machine-readable catalogue of its building blocks at `/api/blocks`). Read the README first and match its section structure; do not add architecture diagrams, deep technical detail, or new top-level sections unless the file's shape clearly accommodates one.
- `docs/PROJECT_HISTORY.md` is where deep technical history lives. Add the Stage 2 Phase 2.5 (agent-surface substrate) record there: the three commits above, the substrate scope boundary (no model call, no prompt — Audit Phase 5 owns the arranger), the drift resolution (two-member union), and the operator-ordered `size` type fix. Read the file first and match its existing entry format and density.

# Boundaries

- Only these two files may change: `README.md`, `docs/PROJECT_HISTORY.md`. No code, no AGENTS.md, no spec doc, no contract dir.
- Docs-only change: a full gate re-run is not required. Run `npm run lint` once as sanity (it exits 0 on docs) and paste the output.
- Single commit scoped to exactly the two files (never `git add -A`), title describing what and why, trailers:

  ```
  Phase: finish-gate-and-pr
  Agent-Id: <your agentId>
  Session-Id: <your sessionId>
  Brief: .paseo-delegate/agent-surface/briefs/fixup-finish-gate-and-pr-1.md
  Verdict: .paseo-delegate/agent-surface/verdicts/finish-gate-and-pr.json
  ```

- Then `git push` (upstream already set). Do not merge, do not touch the PR body unless it needs no more than adding one line noting README/PROJECT_HISTORY are included.
- Tree clean after push (`git status --porcelain` empty).

# Completion contract

Final chat message:

```
STATUS: complete|blocked
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ...   (lint output, commit hash, push confirmation)
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
```
