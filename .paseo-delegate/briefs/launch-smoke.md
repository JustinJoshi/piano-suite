# Task
Run the full launch gate plus the signed-out accessibility e2e spec in /home/justin/piano-suite, and write the launch-readiness report to `docs/quick-fixes-2026-09/launch-smoke-2026-09-16.md`. This is an analysis-only phase: the report is the only file you write.

First run: `cd /home/justin/piano-suite`

# Context
Piano Suite (Next.js 16 + Convex + Clerk) is being prepped for a free-tester launch. This is phase 3 of a three-phase launch-prep run. Phases 1–2 are merged and pushed: main is at 97a45be (phase 1 added app/robots.ts, app/sitemap.ts, app/not-found.tsx and the root title.template; phase 2 committed docs/quick-fixes-2026-09/ and gitignored public/demo-web.mp4). The tree is clean. Your verdict decides ready / not ready.

# Relevant files
- `/home/justin/piano-suite/package.json` — scripts: `lint`, `test:unit:run`, `build`, `test:e2e` (playwright).
- `/home/justin/piano-suite/playwright.config.ts` — e2e testDir `./e2e`, `baseURL: http://localhost:$E2E_PORT`, webServer setup; read it before running e2e.
- `/home/justin/piano-suite/e2e/a11y.spec.ts` — the signed-out accessibility spec to run.
- `/home/justin/piano-suite/docs/quick-fixes-2026-09/` — tracked directory; the report lands here.
- `/home/justin/piano-suite/AGENTS.md` — project conventions.

# Output format
One new file, `/home/justin/piano-suite/docs/quick-fixes-2026-09/launch-smoke-2026-09-16.md`, containing:
1. The exact commands you ran (lint, unit, build, e2e), in order.
2. Pass/fail per suite, with the real numbers (e.g. test counts, warnings).
3. Verbatim failure output for any suite that failed — do not paraphrase or trim errors.
4. A short closing section: "ready" or "not ready" for free-tester launch, with one or two sentences of justification.
Then commit that file to `main` and push to `origin/main`.

# Tool and source guidance
- Run the gate: `npm run lint`, `npm run test:unit:run`, `npm run build`.
- For e2e: `npx playwright install chromium` if the browser is missing, then `npm run test:e2e -- a11y`. Read playwright.config.ts first to learn how the web server is started and whether E2E_PORT must be set; use the project's documented invocation, and record in the report exactly what you ran.
- Work directly in `/home/justin/piano-suite`. Do NOT create a git worktree: the report path lives in the main checkout. Scope `git add` to the report file only — never `git add -A`.
- Write the report incrementally as each suite finishes, so a crash cannot lose results.
- If a suite fails, do NOT fix anything: record the failure verbatim and write "not ready" if warranted. A truthful failing report passes this phase; a broken gate is a finding, not your defect.
- Shell noise note: this machine's shell emits harmless `LD_PRELOAD` libnxegl warnings on every invocation — environment artifact, not a gate failure.

# Task boundaries
- DO NOT edit any application source file, config, or test. The only file you create is the report.
- Do not touch `public/demo-web.mp4` or `.gitignore`.
- No new dependencies; no new git repository; no force-push.

# Effort budget
~45 minutes. If blocked past that, report STATUS: blocked.

# Acceptance criteria
- [ ] `/home/justin/piano-suite/docs/quick-fixes-2026-09/launch-smoke-2026-09-16.md` exists and records real command output — the validator will re-run at least `npm run lint` and `npm run test:unit:run` and compare against the recorded results.
- [ ] All four suites (lint, unit, build, e2e a11y) were actually run, each with its outcome recorded; failures appear verbatim.
- [ ] The report ends with an explicit "ready" or "not ready" conclusion.
- [ ] No application source files were modified: the phase's commit(s) touch only the report file, and `git status --porcelain` is empty after the push.
- [ ] The report commit is on `main`, pushed (`git status -sb` shows `## main...origin/main` with no ahead/behind), and carries the provenance trailers below.

# Constraints
Every deliverable-changing commit message ends with these trailers (fill in your agent id and session id from your spawn context; write `unknown` if truly unavailable):

```
Phase: launch-smoke
Agent-Id: <your paseo agent id>
Session-Id: <your session id>
Brief: .paseo-delegate/briefs/launch-smoke.md
Verdict: .paseo-delegate/verdicts/launch-smoke.json
```

# Completion contract
Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ... (exact commands run and their results)
BLOCKERS: ...
TOOLING NOTES: ... (defects/surprises in the tools themselves — the CLI, the test harness, the build — distinct from your own work; "none" if none)
HANDOFF NOTES: ...
