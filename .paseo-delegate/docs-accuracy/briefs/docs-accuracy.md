# Task

Fix documentation in this repository that makes false statements about the codebase — dead forward pointers, a stale known-failure note, an unmarked-shipped roadmap item, and any other broken relative links under `docs/` and root `*.md` files. Documentation only; no application source, test, or config file changes.

# Context

Piano Suite's docs drifted from the code. Prior audit work archived some planning docs and shipped some roadmap items without the docs catching up, so a future reader (human or agent) following these docs will be misled. This phase repairs that drift. It is deliberately narrow: several related cleanup items (committing `docs/quick-fixes-2026-09/`, gitignoring `public/demo-web.mp4`, pruning `.paseo-delegate/capture-*.mjs` scripts) are owned by a **different, concurrently running** delegate run and are explicitly out of scope — touching them will create a merge conflict with that run.

You are working inside a git worktree at `/home/justin/piano-suite/.worktrees/fleet-docs-accuracy`, already on branch `fleet/docs-accuracy` (created off `main`). This worktree shares a repository with other active agents working in sibling worktrees — never touch anything outside `docs/` (plus this phase's own contract files under `.paseo-delegate/docs-accuracy/`).

`cd /home/justin/piano-suite/.worktrees/fleet-docs-accuracy` first. Do not create a new worktree or branch — both already exist. Do not run `npm install` or `npm ci` — `node_modules` is shared with the main checkout via directory-tree resolution.

Read `/home/justin/piano-suite/.worktrees/fleet-docs-accuracy/AGENTS.md` in full before editing anything — it is binding. In particular: this is not the Next.js you know (read `node_modules/next/dist/docs/` before touching any route/metadata file — not expected to be needed for a docs-only phase, but if you touch anything route-adjacent, read it first); never hard-code colors (not applicable here, docs only); the git-worktree and hotspot-file conventions.

# Relevant files (read, do not assume — verify each claim yourself)

- `docs/PROJECT_HISTORY.md` — "Post-v1 follow-ons" section links `docs/missing-features-plan.md`, `docs/phase-a-auth-cutover-plan.md`, and `docs/subscription-page-plan.md`. Verify whether these files exist. If they do not, this is the repo's only forward pointer and it currently resolves to nothing.
- `docs/stage-2/README.md` — around line 68, a "Known pre-existing failure" note about `e2e/home-mobile.spec.ts` and an "enter the workshop" CTA. Read the actual current content of `e2e/home-mobile.spec.ts` to check what string/regex it currently matches and whether it passes.
- `docs/audit-2026-09/04-roadmap.md` — Phase 1.7 lists `robots.ts`, `sitemap.ts`, `not-found.tsx`, `title.template` as outstanding work. Check `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx`, and any `title.template` usage (e.g. in `app/layout.tsx` metadata) to see if they exist and are wired up. Check `git log` for commit `ff14615` to see what it shipped. Phase 0 in the same file already uses the style "Status: executed 2026-09-01" — match that style if you mark Phase 1.7 shipped, without restructuring the file.
- `docs/archive/**` — do not touch. Its stale statements are intentional (it's a historical archive).
- `docs/quick-fixes-2026-09/`, `public/demo-web.mp4`, `.gitignore`, `.paseo-delegate/` (other than this phase's own `docs-accuracy` subdirectory) — owned by a concurrent run. Do not touch.
- All other `docs/*.md` and root `*.md` files — sweep for relative markdown links (`[text](path)`) pointing at files that don't exist, excluding anything under `docs/archive/`.

# Output format

Direct edits to the existing markdown files listed above (and any other `docs/*.md` / root `*.md` file where you find a genuinely broken relative link). No new files unless a link's target was clearly meant to exist and was simply misnamed/moved — in that case, prefer fixing the link over inventing content.

# Tool and source guidance

Use `grep -rn`, `find`, `git log --oneline | grep ff14615`, and `git show ff14615 --stat` to verify facts before editing — do not trust the phase description's claims without checking. Use standard editing tools for the markdown files. Do not write a throwaway verification script; anything you'd write ad hoc, just run directly and read the output.

Investigate first, edit second: this phase is small in edit volume but requires you to actually verify each claim (file existence, commit contents, current test assertions) rather than assume the plan's description is still accurate — another agent may have already fixed one of these.

# Task boundaries

- No application source file, no test file, no config file changes — documentation only.
- Do not rewrite documents wholesale for tone or style. Minimal, surgical edits that make a false statement true.
- Do not touch `docs/archive/**`.
- Do not touch `docs/quick-fixes-2026-09/`, `public/demo-web.mp4`, `.gitignore`, or any `.paseo-delegate/` path other than `.paseo-delegate/docs-accuracy/` (your own briefs/verdicts, which you do not edit anyway — that's the orchestrator's job).
- Do not restructure `docs/audit-2026-09/04-roadmap.md` beyond marking Phase 1.7 shipped in the file's existing style.

# Effort budget

This is a small, surgical phase: a handful of targeted edits across 3-5 files plus a link sweep. Investigate thoroughly (grep, git log, read actual current file contents) but keep edits minimal. Do not spend time on files outside the listed scope.

# Acceptance criteria

The validator re-runs each of these independently — your own report of having checked something is not evidence:

- [ ] A link check over root `*.md` and `docs/*.md` (excluding `docs/archive/`) finds zero relative links to non-existent files.
- [ ] `grep -rn "enter the workshop" -i docs/ e2e/` returns matches only under `docs/archive/`.
- [ ] `git diff origin/main...HEAD --name-only` lists only files under `docs/` (plus this phase's contract files under `.paseo-delegate/docs-accuracy/`).
- [ ] `git diff origin/main...HEAD -- docs/archive/` is empty.
- [ ] `npm run lint` exits 0 errors, `npm run test:unit:run` shows >= 1349 passing with 0 failures, `npm run build` exits 0.
- [ ] Branch `fleet/docs-accuracy` is pushed to `origin`, a PR is opened against `main`, the working tree is clean, and every commit that changes a deliverable carries the provenance trailers below.

# Constraints

- Must not touch anything outside `docs/` (plus `.paseo-delegate/docs-accuracy/` contract files, which the orchestrator manages — you may read them but your own commits should be scoped to `docs/`).
- Must not touch `docs/archive/**`.
- Must not touch files owned by the concurrent run: `public/demo-web.mp4`, `docs/quick-fixes-2026-09/`, `.gitignore`, other `.paseo-delegate/*` state directories.
- Must not invent a status for work you have not personally verified (e.g. do not mark something "shipped" without checking the commit; do not remove a forward pointer without confirming its target is actually gone).
- Scope every `git add` / commit to `docs/` — never `git add -A` from the repository root. A clean `git status --porcelain` refers to the whole repository.
- Every commit that changes a deliverable carries these trailers (paths relative to the repository root `/home/justin/piano-suite`):
  ```
  Phase: docs-accuracy
  Agent-Id: <your own paseo agent id — check your environment/session info, or ask if you cannot determine it, but do not fabricate it>
  Session-Id: <your own paseo session id, same caveat>
  Brief: .worktrees/fleet-docs-accuracy/.paseo-delegate/docs-accuracy/briefs/docs-accuracy.md
  Verdict: .worktrees/fleet-docs-accuracy/.paseo-delegate/docs-accuracy/verdicts/docs-accuracy.json
  ```
  If you genuinely cannot determine your own Agent-Id/Session-Id, write `Agent-Id: unknown` / `Session-Id: unknown` rather than fabricating one — do not invent an id.
- Run the full gate yourself before declaring done: `npm run lint && npm run test:unit:run && npm run build`.
- Push the branch and open the PR yourself with `gh pr create --base main` (check `gh auth status` first; if not authenticated, report that as a blocker rather than fabricating a PR URL).

# Completion contract

Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: (paste actual command output for the link check, the grep check, the git diff scope checks, and the gate — lint/test/build)
BLOCKERS: ...
TOOLING NOTES: (defects/surprises in the tools themselves, distinct from your own work; "none" if none)
HANDOFF NOTES: (anything you found but chose not to fix, and why — e.g. broken links you decided were intentional, or files you could not verify)
PR URL: ...
