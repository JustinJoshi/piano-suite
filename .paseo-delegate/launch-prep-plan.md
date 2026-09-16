# Launch-prep plan — Piano Suite free-tester launch readiness

Goal: close the small, mechanical gaps before inviting free test users. Three
serial phases. Project root: `/home/justin/piano-suite` (git repo, branch `main`).
All code phases work in a git worktree per AGENTS.md, merge to `main`, push.

Chain verifier: none.

## Phase 1 — seo-basics
depends_on: []
Effort budget: ~1.5 hours of agent work.

Add the missing launch-day SEO/robustness files, following Next.js 16 conventions
(read `node_modules/next/dist/docs/` first — this Next version differs from
training data):

- `app/robots.ts` — allow all, point at the sitemap.
- `app/sitemap.ts` — list the public routes (see `proxy.ts` public-route list:
  `/`, the four drill routes, `/tools/workshop`, `/tools/workshop/blocks`,
  `/start`, `/marketplace`, `/routes`, `/pricing`, `/terms`, `/privacy`).
- `app/not-found.tsx` — themed 404 using existing design tokens (no hard-coded
  colors; see AGENTS.md theming conventions), with a link home.
- Root metadata `title.template` in `app/layout.tsx` (e.g. `%s · Piano Suite`)
  without breaking the existing default title.

Acceptance criteria:
- `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx` exist and export the
  Next 16 conventions correctly.
- Sitemap covers every public route in `proxy.ts`'s allowlist.
- `not-found.tsx` uses only theme tokens (no hex/rgb literals).
- `npm run lint`, `npm run test:unit:run`, `npm run build` all pass.
- Work merged to `main`, tree clean, commits carry provenance trailers.

## Phase 2 — repo-hygiene
depends_on: [seo-basics]
Effort budget: ~30 minutes.

The working tree has two untracked items: `docs/quick-fixes-2026-09/` and
`public/demo-web.mp4`.

- Commit `docs/quick-fixes-2026-09/` (it is documentation; review contents,
  do not rewrite them).
- Do NOT commit `public/demo-web.mp4` (repo bloat). Add
  `/public/demo-web.mp4` to `.gitignore` and leave the file on disk untouched.

Acceptance criteria:
- `git status --porcelain` is empty at the repo root.
- `docs/quick-fixes-2026-09/` is tracked in git history.
- `public/demo-web.mp4` still exists on disk and is NOT in git history.
- `.gitignore` contains the mp4 entry.
- Commits carry provenance trailers; merged to `main`.

## Phase 3 — launch-smoke
depends_on: [repo-hygiene]
Effort budget: ~45 minutes. Analysis-only for app code: DO NOT edit application
files; the only file written is the report.

Run the full gate and the signed-out accessibility e2e spec, and write a
launch-readiness report:

- `npm run lint`, `npm run test:unit:run`, `npm run build`.
- `npx playwright install chromium` if needed, then run `e2e/a11y.spec.ts`
  via `npm run test:e2e -- a11y` (or the project's documented e2e invocation).
- Write `docs/quick-fixes-2026-09/launch-smoke-2026-09-16.md`: exact commands
  run, pass/fail per suite, verbatim failure output if any, and a short
  "ready / not ready" conclusion.

Acceptance criteria:
- The report file exists at the path above and records real command output
  (validator re-runs at least lint + unit to confirm the recorded results).
- No application source files were modified.
- The report is committed with provenance trailers; tree clean.
