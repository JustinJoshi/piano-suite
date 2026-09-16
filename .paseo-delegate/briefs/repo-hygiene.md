# Task
Resolve the two untracked items at the root of /home/justin/piano-suite so `git status --porcelain` is empty: commit the documentation directory, and gitignore the demo video without deleting it from disk.

First run: `cd /home/justin/piano-suite`

# Context
Piano Suite (Next.js 16 + Convex + Clerk) is being prepped for a free-tester launch. This is phase 2 of a three-phase launch-prep run; phase 1 (SEO basics: app/robots.ts, app/sitemap.ts, app/not-found.tsx, title.template) is merged to main at commit ff14615. Exactly two untracked paths remain at the repo root and this phase owns both.

# Relevant files
- `/home/justin/piano-suite/docs/quick-fixes-2026-09/` — untracked documentation directory. Review its contents for orientation, but commit them exactly as they sit on disk; do not rewrite.
- `/home/justin/piano-suite/public/demo-web.mp4` — untracked demo video binary. Repo bloat; it must never enter git history.
- `/home/justin/piano-suite/.gitignore` — append the mp4 entry here.
- `/home/justin/piano-suite/AGENTS.md` — project conventions (theming, commits).

# Output format
On `main` in the existing repository at /home/justin/piano-suite:
1. `docs/quick-fixes-2026-09/` fully tracked in a commit, contents untouched.
2. `.gitignore` gains an entry for `/public/demo-web.mp4`.
3. `public/demo-web.mp4` still present on disk, absent from git history.
4. Commits pushed to `origin/main`.

# Tool and source guidance
- Work directly in `/home/justin/piano-suite`. Do NOT create a git worktree for this phase: the two untracked paths exist only in the main checkout, so a fresh worktree would not contain them.
- Scope every `git add` to explicit paths (`docs/quick-fixes-2026-09`, `.gitignore`). Never `git add -A`.
- After committing, verify `git status --porcelain` is empty, then `git push origin main`.
- No application source files change in this phase; the deliverable is git state, not code.

# Task boundaries
- Do not modify, reformat, or "improve" anything under `docs/quick-fixes-2026-09/`.
- Do not delete or move `public/demo-web.mp4`; it must remain on disk.
- Do not touch any other file; do not create a new git repository; do not force-push.

# Effort budget
~30 minutes. If blocked past that, report STATUS: blocked.

# Acceptance criteria
- [ ] `git status --porcelain` is empty at `/home/justin/piano-suite`.
- [ ] `docs/quick-fixes-2026-09/` is tracked in git history, committed with its on-disk content.
- [ ] `public/demo-web.mp4` still exists on disk and does NOT appear in git history (`git log --all -- public/demo-web.mp4` is empty).
- [ ] `.gitignore` contains an entry for `/public/demo-web.mp4`.
- [ ] `main` is pushed: `git status -sb` shows `## main...origin/main` with no ahead/behind.
- [ ] Every deliverable-changing commit carries the provenance trailers below.

# Constraints
Every deliverable-changing commit message ends with these trailers (fill in your agent id and session id from your spawn context; write `unknown` if truly unavailable):

```
Phase: repo-hygiene
Agent-Id: <your paseo agent id>
Session-Id: <your session id>
Brief: .paseo-delegate/briefs/repo-hygiene.md
Verdict: .paseo-delegate/verdicts/repo-hygiene.json
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
