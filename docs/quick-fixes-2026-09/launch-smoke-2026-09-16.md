# Launch smoke — 2026-09-16

Phase 3 of the launch-prep run. Full gate (lint, unit, build) plus the signed-out
accessibility e2e spec (`e2e/a11y.spec.ts`), run against `main` at `97a45be`
(tree clean before starting). Report written incrementally as each suite
finished.

Environment notes:

- Machine shell emits `LD_PRELOAD ... libnxegl.so` warnings on every invocation
  (environment artifact, not a gate failure; omitted below).
- Port 3000 is occupied on this machine by an unrelated `opencode` proxy
  (`/usr/bin/node proxy.js`, pid 584), not a Next.js server — see the e2e
  section for how that was handled.
- `.env.local` supplies Clerk dev keys, `E2E_CLERK_USER_EMAIL`/`PASSWORD`, and a
  reachable `NEXT_PUBLIC_CONVEX_URL` (HTTP 200). Playwright Chromium was already
  cached in `~/.cache/ms-playwright` (`chromium-1234`), so
  `npx playwright install chromium` was a no-op verification.

## 1. Commands run (in order)

```
cd /home/justin/piano-suite
npm run lint
npm run test:unit:run
npm run build
npx playwright install chromium   # browser already cached; verified present
E2E_PORT=3001 npm run test:e2e -- a11y
E2E_PORT=3001 npm run test:e2e -- a11y   # confirmation re-run, full log captured
```

Per `playwright.config.ts`, the non-CI webServer command with `E2E_PORT=3001`
is `PORT=3001 npm run dev` with `reuseExistingServer: true`; port 3001 was used
because port 3000 is held by the unrelated proxy above. `NEXT_PUBLIC_AUTH_DISABLED`
is unset, so the global-setup auth guard applied normally (and passed).

## 2. Results per suite

### Lint — PASS

Command: `npm run lint` (eslint)

Exit code 0. **0 errors, 13 warnings** (`✖ 13 problems (0 errors, 13 warnings)`):

| File | Warnings |
|---|---|
| `.paseo-delegate/capture-chord-drill.mjs` | 1 × unused var (`shoot`) |
| `.paseo-delegate/capture-demo.mjs` | 1 × unused var (`page`) |
| `.paseo-delegate/capture-root-cycling.mjs` | 2 × unused vars (`keep`, `roots`) |
| `convex/workshop.ts` | 2 × unused vars (`MAX_PAGE_TITLE_LENGTH`, `doc`) |
| `hooks/useChordDrill.ts` | 3 × `react-hooks/exhaustive-deps` |
| `lib/anki-setup-prompt.ts` | 1 × unused var (`DEFAULT_ANKI_CONNECT_URL`) |
| `lib/feature-blocks/free-play/config.ts` | 1 × unused var (`toEnum`) |
| `lib/logo-mark-settings.ts` | 2 × unused vars (`_generation`, `_defaultGeneration`) |

All warnings are pre-existing unused-var / hook-deps notices; none are errors
and eslint exited 0.

### Unit tests — PASS

Command: `npm run test:unit:run` (vitest run)

Exit code 0. **147 test files passed (147), 1349 tests passed (1349)**, 0
failures, 0 skipped. Duration 61.16s.

### Build — PASS

Command: `npm run build` (next build)

Exit code 0. Compiled successfully in 13.2s; TypeScript clean (16.7s); 43/43
static pages generated. Full route manifest built, including the public launch
surfaces `/robots.txt`, `/sitemap.xml`, `/_not-found`, and all 43 routes.

Non-fatal notices only:

- `[@sentry/nextjs - After Production Compile] Warning: No auth token provided.
  Will not create release.` (expected without a Sentry authToken)
- `[@sentry/nextjs] DEPRECATION WARNING: disableLogger is deprecated and will
  be removed in a future version. Use webpack.treeshake.removeDebugLogging
  instead. (Not supported with Turbopack.)`

### E2E (a11y, signed out) — PASS

Command: `E2E_PORT=3001 npm run test:e2e -- a11y` (Playwright; dev webServer on
port 3001)

Ran twice; both green. Playwright ran "4 tests" per invocation: the `setup`
project (Clerk global setup), the two `a11y.spec.ts` tests in the `chromium`
project, and the `teardown` project.

Run 2 (full log captured), verbatim summary:

```
Running 4 tests using 2 workers
  ✓  1 [setup] › e2e/global.setup.ts:16:6 › global setup (7.1s)
  ✓  3 [chromium] › e2e/a11y.spec.ts:74:7 › workshop a11y (signed out) › workshop page reports zero serious/critical violations (8.2s)
  ✓  2 [chromium] › e2e/a11y.spec.ts:38:7 › workshop a11y (signed out) › block library and marketplace report zero serious/critical violations (12.2s)
  ✓  4 [teardown] › e2e/global.teardown.ts:8:9 › cleanup test users (373ms)

  4 passed (26.1s)
```

Run 1: `4 passed (33.7s)` with the same two a11y tests passing (7.4s / 10.2s).

Zero axe serious/critical violations on `/tools/workshop`,
`/tools/workshop/blocks`, and `/marketplace`, scanned signed out across
wcag2a/wcag2aa/wcag21a/wcag21aa.

No failures — no failure output to quote. Non-fatal console noise observed from
the app during the runs (recorded for awareness, not gate failures):

- React warning twice: `The result of getServerSnapshot should be cached to
  avoid an infinite loop` — at
  `components/custom-practice/practice-page-editor.tsx:68` and
  `app/tools/workshop/blocks/page.tsx:25` (`useSyncExternalStore` over the
  practice-page store).
- A hydration attribute mismatch in the tools sidebar
  (`Sidebar` → `AppUserButton` → Clerk `UserButton`,
  `components/app-user-button.tsx:12`), React dev build only, did not affect
  any assertion.
- Clerk dev-instance notice: "Clerk has been loaded with development keys…"

## 3. Verdict

**Ready** for free-tester launch, on the evidence of this gate: lint exits
clean (0 errors), all 1349 unit tests pass, the production build completes for
all 43 routes, and the signed-out a11y spec reports zero serious/critical
violations on the Workshop, block library, and Marketplace. The console
warnings above are worth a follow-up sweep (especially the
`getServerSnapshot` caching warning, which can cause extra re-renders) but
block nothing.

---

Phase: launch-smoke
Agent-Id: babc0b2a-a5aa-434f-bce6-1834712c64ad
Session-Id: 86a3b021-1dab-488c-8504-7f90adc05fc3
Brief: .paseo-delegate/briefs/launch-smoke.md
Verdict: .paseo-delegate/verdicts/launch-smoke.json
