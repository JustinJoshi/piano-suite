# Task

Fix all TypeScript errors in test files, add a `typecheck` script and CI step, and update `AGENTS.md`'s Testing section — without changing any production type declaration.

# Context

`npm run build` (Next.js) skips test files and Vitest does not typecheck, so type errors in test files are invisible to every check that runs today. `npx tsc --noEmit` currently exits non-zero. The errors are real drift: tests assert against object shapes that production types no longer have, while still reporting green (production code has moved on; the test doubles have not).

This project is **not the Next.js you know** — before touching anything under `app/` or any route/metadata file, read the relevant guide in `node_modules/next/dist/docs/`. This phase is not expected to touch `app/` routes, but if it does, read the docs first.

This repository's root `AGENTS.md` (at `/home/justin/piano-suite/.worktrees/fleet-typecheck/AGENTS.md`) is binding. Read it in full before starting. In particular:
- `package.json` is a declared **hotspot file** — your diff to it must be additive only, scripts block only. Do not touch dependencies or `package-lock.json`.
- Tests are co-located in `__tests__` directories next to the code under test (naming convention already followed by the existing failing files).
- The "Finishing work" checklist (gate: lint, test:unit:run, build) applies, plus the new typecheck step this phase adds.

# Relevant files

- Every file under `lib/__tests__/`, `lib/feature-blocks/__tests__/`, `components/workshop-grid/__tests__/`, `components/waitlist/__tests__/`, `components/feature-blocks/__tests__/`, `components/drills/__tests__/` that `npx tsc --noEmit` reports errors in — run the command yourself first; do not assume the list below is exhaustive or still accurate.
- `package.json` — add a `typecheck` script running `tsc --noEmit`. Scripts block only.
- `.github/workflows/ci.yml` — the only workflow file; add a typecheck step alongside the existing lint / unit / build jobs, matching their Node version and setup exactly.
- `AGENTS.md` — Testing section; add the new command (`npm run typecheck`) as part of the gate description.
- The production type declarations you must NOT change (unless you believe one is genuinely wrong — see Constraints): `lib/drill-runtime.ts` (`DrillRuntime.stream`), `lib/audio-settings.ts` (`CustomKit.id`), `lib/workshop-grid.ts` (`GridCallbacks.onConfigChange`), and any MIDI status union type you find narrower than a test double expects.

# Output format

Edits land directly in the working tree of `/home/justin/piano-suite/.worktrees/fleet-typecheck` (already a git worktree on branch `fleet/typecheck` — do not create a new worktree or repository). Commit your changes there with `git add <specific paths>` (never `git add -A`), never touching files outside this phase's scope.

# Tool and source guidance

1. Run `npx tsc --noEmit` first to get the authoritative, current list of errors — the plan's error count (54 errors, 13 files) was recorded earlier and may have drifted; trust the compiler, not the number in this brief.
2. For each error, read the production type it's checking against, then fix the **test** (test double, mock, fixture) to match that type's actual current shape.
3. Do not pre-plan every fix before writing any of them — work error-by-error or file-by-file, running `npx tsc --noEmit` again periodically to track progress down to 0.
4. After `tsc` is clean, add the `typecheck` script to `package.json`, the CI step to `.github/workflows/ci.yml` (read the existing lint/unit/build job definitions in that file first and mirror their Node setup), and the `AGENTS.md` Testing section line.
5. Run the full gate yourself before reporting done: `npm run lint`, `npm run test:unit:run`, `npm run build`, `npm run typecheck`.

# Task boundaries

- Do **not** edit any production (non-test) type declaration to loosen, widen, or make optional a field just to make a test compile. If a test double is missing a required field (e.g. `stream` on a `DrillRuntime` double), add the field to the double with a correct, realistic value — do not make the production field optional.
- Do **not** change test *assertions* or delete/skip tests to silence a compiler error. A test that no longer compiles is exercising a subject that moved; update it to exercise the current subject, not to route around it.
- Do not touch `package-lock.json` or add/remove/upgrade any dependency.
- Do not reformat or touch files you are not fixing.
- If you believe a production type is genuinely wrong (not just that a test disagrees with it), STOP, do not change it, and report the specific type, file, and your reasoning in BLOCKERS — the validator and orchestrator will decide, not you.
- Do not push, open a PR, or merge — that happens after all phases in this run pass. Commit locally on `fleet/typecheck` only.

# Effort budget

This is the only phase in this run. Recorded scope at plan time: 54 errors across 13 test files (see brief's Relevant files note above — reverify the actual count via `tsc`). Budget your time proportionally: this is a correctness-sensitive fix pass, not a large feature — do not over-engineer or refactor beyond what compiling requires.

# Acceptance criteria

The validator re-runs every one of these itself, in `/home/justin/piano-suite/.worktrees/fleet-typecheck`:

- [ ] `npx tsc --noEmit` exits 0 with no output.
- [ ] `npm run test:unit:run` passes with at least 1349 tests and zero failures.
- [ ] `npm run lint` reports 0 errors.
- [ ] `npm run build` exits 0.
- [ ] `npm run typecheck` exists in `package.json` and exits 0.
- [ ] `.github/workflows/ci.yml` contains a step invoking the typecheck script.
- [ ] `git diff origin/main...HEAD --stat` shows no production source file with a changed type declaration. Specifically, `git diff origin/main...HEAD -- lib/drill-runtime.ts lib/audio-settings.ts lib/workshop-grid.ts` must be empty unless your completion summary explicitly justifies each changed line (and you flagged it in BLOCKERS per the boundary above, not silently).
- [ ] Every commit that changes a deliverable carries the provenance trailers below.
- [ ] Working tree is clean (`git status --porcelain` empty) at the end, all changes committed.

# Constraints

- Never create a new git repository or a new worktree. You are already inside one, on branch `fleet/typecheck`, inside the existing `/home/justin/piano-suite` repository.
- Scope every `git add` to the specific paths you changed.
- Every commit that changes a deliverable must carry these trailers (fill `<agentId>` and `<sessionId>` with your own paseo agent/session identifiers — check your environment or the orchestrator-provided context if unsure, otherwise state "unknown" explicitly rather than omitting the line):
  ```
  Phase: typecheck
  Agent-Id: <agentId>
  Session-Id: <sessionId>
  Brief: .paseo-delegate/typecheck/briefs/typecheck.md
  Verdict: .paseo-delegate/typecheck/verdicts/typecheck.json
  ```
  (paths relative to the repository root `/home/justin/piano-suite`)
- Also end each commit message with: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- Do not push or open a PR.

# Completion contract

Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ...
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
