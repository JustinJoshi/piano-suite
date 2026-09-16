OUTCOME PACKET (phase seo-basics)

## 1. Master plan's spec for phase repo-hygiene
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

## 2. Worker's completion summary (raw)
STATUS: complete
SUMMARY: Added all four Phase 1.7 SEO items — `app/robots.ts` (allow all, sitemap ref), `app/sitemap.ts` (13 entries matching proxy.ts's public allowlist exactly), `app/not-found.tsx` (themed 404, Navbar + tokens only, no hex/rgb literals), and `title.template: "%s · Piano Suite"` with a `default` in the root metadata. Since the template would have doubled the suffix, I also stripped the hardcoded "· Piano Suite" from the six pages that set it themselves (pricing, privacy, terms, routes, routes/[routeId], articles/[slug]) — the template is now the single writer of the brand suffix.
FILES CHANGED: `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx` (new); `app/layout.tsx` (metadata export only); title-only edits in `app/pricing/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/routes/page.tsx`, `app/routes/[routeId]/page.tsx`, `app/articles/[slug]/page.tsx`.
VERIFICATION: `npm run lint` → 0 errors (12 pre-existing warnings); `npm run test:unit:run` → 147 files / 1349 tests passed; `npm run build` → passed, and I inspected the build output directly: `.next/server/app/robots.txt.body`, `sitemap.xml.body` (13 `<url>` entries), and the prerendered `_not-found.html` all present with correct contents. Merged fast-forward to `main` (ff14615), `git worktree remove` done, `git status --porcelain` shows only the two out-of-scope untracked paths (`docs/quick-fixes-2026-09/`, `public/demo-web.mp4`), pushed to `origin/main`.
BLOCKERS: none.
TOOLING NOTES: The shell emits harmless `LD_PRELOAD` libnxegl warnings on every invocation (environment artifact, not this work). No tool defects.
HANDOFF NOTES: Sitemap/robots read `NEXT_PUBLIC_SITE_URL` (same variable and localhost fallback as `layout.tsx`) — production emits correct URLs once that env var is set in Vercel. All Next conventions were verified against `node_modules/next/dist/docs/` for v16.2.12 (no breaking deviations from the familiar robots/sitemap/not-found/metadata APIs). Commit ff14615 carries the required provenance trailers.

## 3. Validator's assessment (curated)
Solid: all four deliverables verified in the actual diff and build output, not the summary. robots.txt.body contains 'User-Agent: * / Allow: /' plus the sitemap line; sitemap.xml.body contains exactly the 13 public routes the brief lists from proxy.ts (/, 4 drills, /tools/workshop, /tools/workshop/blocks, /start, /marketplace, /routes, /pricing, /terms, /privacy); _not-found.html is prerendered and not-found.tsx uses only theme tokens (text-primary, text-foreground, text-muted-foreground, font-heading, measure-number) — no hex/rgb literals; app/layout.tsx gained title.template '%s · Piano Suite' with default 'Piano Suite' and nothing else changed in that hotspot. APIs match node_modules/next/dist/docs for next 16.2.12. Gate re-run by validator: lint 0 errors, unit 147 files / 1349 tests passed, build passed. Single commit ff14615 scoped to exactly its 10 files, on main == origin/main, carrying the brief's four provenance trailers. Fragile: sitemap is a hand-maintained list that will silently miss future public routes; production emits localhost sitemap/robots URLs unless NEXT_PUBLIC_SITE_URL is set in Vercel; future pages must now set bare titles.

## 4. Validator's handoff_notes
Deltas the next phase must absorb: (1) title.template is now the single writer of the brand suffix — future pages set bare titles ('Pricing', not 'Pricing · Piano Suite') or the suffix doubles. (2) The tree is clean only modulo the two Phase-2-owned untracked paths: docs/quick-fixes-2026-09/ (commit as-is) and public/demo-web.mp4 (gitignore via /public/demo-web.mp4, keep on disk); Phase 3's report path lives inside docs/quick-fixes-2026-09/ and works only after Phase 2 commits it. (3) Sitemap/robots read NEXT_PUBLIC_SITE_URL with a localhost fallback — must be set in Vercel for production. (4) proxy.ts's runtime allowlist is broader than the brief's 13 sitemap routes (also /articles, /dev, /sign-in, /sign-up, /api, legacy /workshop, /tools/chladni) — per brief scope, but noted for future sitemap upkeep. (5) Worker's tooling note bears on every later phase's shell output: the shell emits harmless LD_PRELOAD libnxegl warnings on every invocation (environment artifact, not this work). No plan premises broke; phases 2 and 3 proceed unchanged.

## 5. Tooling notes (verbatim)
The shell emits harmless `LD_PRELOAD` libnxegl warnings on every invocation (environment artifact, not this work). No tool defects.

## 6. Ledger extract
- seo-basics: PASS, 0 fix-ups, drift: none, worker d5f3e70c-30cc-420e-802e-b927176b5da0, validator 1d3c9244-688b-4371-bbc4-ff34a70391e1, commit ff14615.
- repo-hygiene: not started.
- launch-smoke: not started.
