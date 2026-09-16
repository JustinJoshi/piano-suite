# Task
Add the missing launch-day SEO/robustness files to the Piano Suite Next.js app: `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx`, and a root metadata `title.template`.

First run: `cd /home/justin/piano-suite`

# Context
Piano Suite (a Next.js 16 + Convex + Clerk app) is about to invite free test users. The September 2026 audit flagged these Phase 1.7 launch-readiness items as missing. This is the first phase of a three-phase launch-prep run.

# Relevant files
- `/home/justin/piano-suite/proxy.ts` — the public-route allowlist; the sitemap must cover exactly these public routes: `/`, the four ready-made drill routes, `/tools/workshop`, `/tools/workshop/blocks`, `/start`, `/marketplace`, `/routes`, `/pricing`, `/terms`, `/privacy`. Read it to get the exact paths.
- `/home/justin/piano-suite/app/layout.tsx` — root layout; add `title.template` (e.g. `%s · Piano Suite`) to its `metadata` export without breaking the existing default title. HOTSPOT FILE: change only the metadata export.
- `/home/justin/piano-suite/AGENTS.md` — project conventions. Follow the theming conventions (no hard-coded hex/rgb colors — use tokens like `bg-card`, `text-primary`) and the git-worktree workflow.
- `/home/justin/piano-suite/node_modules/next/dist/docs/` — this Next.js version has breaking changes vs your training data. Read the relevant docs for `robots.ts`, `sitemap.ts`, `not-found.tsx`, and metadata before writing code.
- `/home/justin/piano-suite/components/site-footer.tsx` and existing pages under `app/` — reference for token usage and page structure for the 404 page.

# Output format
Four changes on disk, committed and merged to `main`:
1. `app/robots.ts` — allow all crawlers, reference the sitemap.
2. `app/sitemap.ts` — entries for every public route listed above.
3. `app/not-found.tsx` — a simple themed 404 page (heading, one line of friendly copy, a link back to `/`), using only theme tokens.
4. `title.template` added to root metadata.

# Tool and source guidance
- Work in a git worktree per AGENTS.md:
  ```bash
  cd /home/justin/piano-suite
  git worktree add .worktrees/delegate-seo-basics -b delegate/seo-basics
  cd .worktrees/delegate-seo-basics
  ln -s /home/justin/piano-suite/.env.local .env.local
  ```
  When done and the gate passes, from `/home/justin/piano-suite`: `git merge delegate/seo-basics`, `git worktree remove .worktrees/delegate-seo-basics`, `git push origin main`.
- Write incrementally. Do not pre-plan the whole artefact.
- Run the gate before merging: `npm run lint && npm run test:unit:run && npm run build`.
- Base URL for the sitemap: read `NEXT_PUBLIC_APP_URL` or similar from the codebase if one exists; otherwise use `https://pianosuite.app` style — grep the repo for the canonical production URL (check `app/layout.tsx` metadata, README) and reuse it.

# Task boundaries
- Do NOT touch `docs/quick-fixes-2026-09/` or `public/demo-web.mp4` (a later phase owns them).
- Do NOT edit any other hotspot files (`convex/schema.ts`, `app/globals.css`, sidebar, navbar, `package.json`).
- No new dependencies.
- Do not create a new git repository; commit to the existing one, scoping `git add` to your own paths (never `git add -A`).

# Effort budget
~1.5 hours. If blocked past that, report STATUS: blocked.

# Acceptance criteria
- [ ] `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx` exist and follow the conventions in `node_modules/next/dist/docs/`.
- [ ] The sitemap covers every public route in `proxy.ts`'s allowlist.
- [ ] `app/not-found.tsx` contains no hex/rgb color literals (theme tokens only).
- [ ] `npm run lint`, `npm run test:unit:run`, `npm run build` all pass.
- [ ] Work is merged to `main`, `git status --porcelain` is empty at the repo root, and the worktree is removed.
- [ ] Every commit that changes a deliverable carries the provenance trailers below.

# Constraints
Every deliverable-changing commit message ends with these trailers (fill in your own agent id; the orchestrator's session id will be verified from disk — include the trailer lines with your agent id and the literal paths):

```
Phase: seo-basics
Agent-Id: <your paseo agent id, from your spawn context; if unknown, write unknown>
Brief: .paseo-delegate/briefs/seo-basics.md
Verdict: .paseo-delegate/verdicts/seo-basics.json
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
