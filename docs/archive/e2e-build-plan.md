# E2E Build Plan — Piano Suite

> Derived from [`docs/e2e-testing-strategy-report.md`](./e2e-testing-strategy-report.md).
> Each phase is designed to be one PR or one worktree/branch.
> Gate for every phase: `npm run lint`, `npm run test:unit:run`, `npm run build`.
> Run `npm run test:e2e` whenever auth or E2E code is touched.

---

## Phase 0 — Foundation: dedicated Clerk dev instance for CI

**Goal:** Get the existing E2E suite green in CI without changing the live app's auth.

**Owner actions required first**

1. Create a new Clerk **development** app in the Dashboard.
2. Copy `pk_test_…`, `sk_test_…`, and Frontend API URL (`https://<slug>.clerk.accounts.dev`).
3. Add JWT template named `convex`, audience `convex`.
4. In Convex Dashboard → Production → Environment variables, add:
   - `CLERK_FRONTEND_API_URL_EXTRA` = CI Clerk Frontend API URL
5. Redeploy Convex:
   ```bash
   npx convex deploy
   ```
6. Update GitHub Actions secrets:
   ```bash
   gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --body "pk_test_..."
   gh secret set CLERK_SECRET_KEY --body "sk_test_..."
   ```

**Repo changes (already in PR #58)**

- `convex/auth.config.js` — parse `CLERK_FRONTEND_API_URL_EXTRA` as extra issuers.
- `.github/workflows/ci.yml` — add `timeout-minutes: 15` to `e2e` job.
- `.env.example`, `AGENTS.md`, `docs/PROJECT_HISTORY.md`, `docs/phase-a-auth-cutover-plan.md` — document CI Clerk instance.

**Acceptance criteria**

- [ ] `lint`, `unit`, `build` pass locally.
- [ ] CI `e2e` job on PR #58 passes (not skipped) and completes in under 15 minutes.
- [ ] Authenticated specs (`arpeggios.authenticated`, `audio-loading.authenticated`, `auth-protection` signed-in cases) no longer time out.

---

## Phase 1 — CI debugging and reporting

**Goal:** Make E2E failures in CI diagnosable without re-running locally.

**Branch:** `kimi/e2e-ci-reports`

**Files to change**

1. `playwright.config.ts`
   - Add HTML reporter:
     ```ts
     reporter: [
       ["list"],
       ["html", { open: "never", outputFolder: "playwright-report" }],
     ],
     ```
   - Keep `trace: "on-first-retry"`.

2. `.github/workflows/ci.yml`
   - Add artifact upload step to `e2e` job, always run on failure:
     ```yaml
     - uses: actions/upload-artifact@v4
       if: failure()
       with:
         name: playwright-report-${{ github.run_id }}
         path: |
           playwright-report/
           test-results/
         retention-days: 7
     ```

3. `.gitignore`
   - Ensure `playwright-report/` and `test-results/` are ignored.

**Acceptance criteria**

- [ ] Failing E2E CI run produces a downloadable `playwright-report` artifact.
- [ ] Artifact contains trace files and HTML report.
- [ ] No report files are committed to git.

---

## Phase 2 — Page Object Models and stable locators

**Goal:** Reduce test fragility and duplication as the UI grows.

**Branch:** `kimi/e2e-page-objects`

**Files to create**

1. `e2e/pom/base-page.ts`
   - Shared helpers: `goto`, `expectUrl`, `waitForLoaded`, `isVisible`, `clickByRole`.

2. `e2e/pom/sidebar.ts`
   - Navigate to each tool page.
   - Mobile drawer toggle.

3. `e2e/pom/chord-drill-page.ts`
   - Select mode / root / quality.
   - Start/stop drill.
   - Assert target note visibility.

4. `e2e/pom/arpeggios-page.ts`
   - Toggle LH notes, miss filter, sequence customization.
   - Navigate next chord.

5. `e2e/pom/tracking-page.ts`
   - Assert charts render.
   - Navigate between event types.

6. `e2e/pom/settings-page.ts`
   - Change theme.
   - Toggle atmosphere / hero kind.

**Files to change**

1. Add `data-testid` attributes to key components:
   - `components/tools/sidebar.tsx` — nav links.
   - `components/drills/chord-drill/*.tsx` — mode selector, root selector, start button.
   - `components/drills/arpeggios/*.tsx` — LH toggle, miss filter, next chord.
   - `components/tools/tracking/*.tsx` — chart containers.
   - `app/settings/theme/page.tsx` — theme buttons.
   - `app/settings/atmosphere/page.tsx` — route tabs, float toggle.

2. Refactor existing specs to use POMs:
   - `e2e/arpeggios.authenticated.spec.ts`
   - `e2e/audio-loading.authenticated.spec.ts`
   - `e2e/auth-protection.spec.ts`
   - `e2e/chat-auth.spec.ts`

**Acceptance criteria**

- [ ] All existing specs still pass.
- [ ] New POMs are used by at least the refactored specs.
- [ ] No brittle CSS selectors remain in refactored specs.

---

## Phase 3 — Expand E2E coverage

**Goal:** Cover the major user flows that are currently untested.

**Branch:** `kimi/e2e-coverage-expansion`

**New spec files**

1. `e2e/landing.spec.ts`
   - Hero renders.
   - Theme switch updates CSS class on `<html>`.
   - Pillar cards scroll into view.
   - CTA navigates to `/tools` or `/sign-in` depending on auth.

2. `e2e/settings.spec.ts`
   - Theme persists across reload (localStorage + Convex when signed in).
   - Atmosphere route assignment changes background.
   - Audio preset switch shows loading state.

3. `e2e/tracking.spec.ts`
   - Signed-in user sees tracking dashboard.
   - Chart containers render.
   - Import/export local history flow works.

4. `e2e/chord-drill.authenticated.spec.ts`
   - Start drill, advance chords, stop drill.
   - Settings changes stop the drill.
   - Miss filter behavior.

5. `e2e/progression.authenticated.spec.ts` and `e2e/root-cycling.authenticated.spec.ts`
   - Basic load + navigation + setting changes.

6. `e2e/onboarding.spec.ts`
   - First visit to `/tools` shows onboarding.
   - Completing onboarding hides it.
   - `?onboarding=reset` replays it.

**Acceptance criteria**

- [ ] New specs run green locally and in CI.
- [ ] Each spec uses POMs from Phase 2.
- [ ] No new hard-coded waits or sleeps.

---

## Phase 4 — Mock external dependencies

**Goal:** Remove live dependencies on LLM and webhook services in E2E.

**Branch:** `kimi/e2e-mocks`

**Files to create**

1. `e2e/mocks/handlers.ts`
   - Mock `POST /api/chat` responses.
   - Mock Clerk webhook payloads (for billing entitlement tests) if needed.

2. `e2e/mocks/server.ts`
   - MSW server setup for E2E.

**Files to change**

1. `playwright.config.ts`
   - Inject MSW server startup into web server command, or use `page.route()` per spec.

2. `e2e/chat-auth.spec.ts`
   - Use `page.route()` to mock `/api/chat` so tests do not require `ALLOWED_CLERK_USER_ID` or live Kimi API.

3. `app/api/chat/route.ts` (if necessary)
   - Ensure it can be exercised under `APP_ENV=test` without real credentials.

**Decision point**

- Option A (recommended): Use Playwright `page.route()` per spec — simpler, no extra dependency.
- Option B: Add MSW for both browser and server contexts — more powerful but more setup.

**Acceptance criteria**

- [ ] `chat-auth.spec.ts` passes without a real `KIMI_CODE_API_KEY`.
- [ ] Mocked responses are deterministic and documented.
- [ ] No E2E spec calls a live third-party API.

---

## Phase 5 — Test data determinism and isolation

**Goal:** Prevent test data collisions and flaky state as coverage grows.

**Branch:** `kimi/e2e-test-data`

**Files to create**

1. `e2e/lib/test-user.ts`
   - Generate unique email per run: `e2e-piano-suite+clerk_test+${runId}@example.com`.
   - Helper to compute deterministic password.

2. `e2e/lib/cleanup.ts`
   - Delete all practice events, settings, and user rows created by the test user.

**Files to change**

1. `e2e/global.setup.ts`
   - Create test user with unique email per CI run.
   - Store user id and email in `playwright/.clerk/signup-user.json`.

2. `e2e/global.teardown.ts`
   - Delete user and all associated Convex data.
   - Use Convex mutation `users.deleteTestUser` if needed; otherwise iterate tables.

3. `convex/users.ts` (maybe)
   - Add internal mutation `deleteTestUserAndData` gated by `CLERK_WEBHOOK_SHARED_SECRET` or admin identity.

**Acceptance criteria**

- [ ] Parallel CI workers do not collide on test user data.
- [ ] Teardown removes test-created rows from Convex.
- [ ] No test user remains in Clerk after teardown succeeds.

---

## Phase 6 — Parallelism and performance

**Goal:** Keep E2E fast enough to run on every PR.

**Branch:** `kimi/e2e-parallelism`

**Files to change**

1. `playwright.config.ts`
   - Increase `workers` from 1 to 2 or 4 in CI, but only after Phase 5 makes data unique per worker.
   - Use worker-scoped auth state (see [Playwright docs](https://playwright.dev/docs/auth#moderate-one-account-per-parallel-worker)).

2. `e2e/auth-helper.ts` / `e2e/global.setup.ts`
   - Generate one test user per `testInfo.parallelIndex`.

3. `.github/workflows/ci.yml`
   - Add job-level sharding if needed:
     ```yaml
     strategy:
       matrix:
         shard: [1, 2, 3]
     ```

**Acceptance criteria**

- [ ] E2E job completes in under 10 minutes.
- [ ] No flaky failures from shared state.
- [ ] Shard configuration is documented.

---

## Phase 7 — Optional: isolated CI Convex deployment

**Goal:** Full isolation between production data and CI test data.

**Branch:** `kimi/e2e-isolated-convex`

**Owner actions required**

1. Create a second Convex project (e.g., `piano-suite-ci`).
2. Create a preview deployment named `ci`.
3. Generate a preview deploy key and add it as GitHub secret `CONVEX_DEPLOY_KEY_CI`.
4. In the CI Clerk dev app, set the JWT template audience to `convex`.
5. In the CI Convex project, set `CLERK_FRONTEND_API_URL` to the CI Clerk FAPI.

**Repo changes**

1. `.github/workflows/ci.yml`
   - Add step before E2E:
     ```yaml
     - env:
         CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY_CI }}
       run: npx convex deploy --preview-name ci --preview-create
     ```
   - Point CI `NEXT_PUBLIC_CONVEX_URL` at the CI deployment URL (via secret or `--cmd-url-env-var-name`).

2. `convex/auth.config.js`
   - Revert `CLERK_FRONTEND_API_URL_EXTRA` parsing if no longer needed; keep primary issuer only on production Convex.

**Acceptance criteria**

- [ ] CI deploys Convex code to a separate CI deployment.
- [ ] E2E runs against the CI deployment, never production Convex.
- [ ] Production Clerk/Convex secrets remain unchanged.

---

## Phase 8 — Maintenance and monitoring

**Goal:** Keep the E2E suite reliable over time.

**Ongoing tasks**

1. **Flakiness dashboard:** Track which specs flake in CI. Use Playwright retry metadata.
2. **Weekly rotation:** Dedicate one small PR per month to fixing the flakiest spec.
3. **Visual regression (optional):** Add Playwright `toHaveScreenshot` tests for the landing page and theme variants once the UI stabilizes.
4. **Dependency updates:** Keep Playwright and `@clerk/testing` versions in sync.

**Files to change**

1. `.github/workflows/ci.yml`
   - Add Playwright test results summary to PR comments (optional, via third-party action).

2. `docs/e2e-build-plan.md`
   - Update statuses as phases ship.

---

## Execution order

```
Phase 0  → merge PR #58, verify CI green
Phase 1  → CI reports and artifacts
Phase 2  → Page Object Models + data-testid
Phase 3  → Coverage expansion
Phase 4  → External mocks
Phase 5  → Deterministic test data
Phase 6  → Parallelism / sharding
Phase 7  → Isolated Convex deployment (optional, when scaling)
Phase 8  → Maintenance and monitoring
```

## Notes

- Phases 0–3 are the highest value and can be done immediately.
- Phases 4–6 depend on earlier phases and should be sequenced.
- Phase 7 is a major infrastructure change; defer until real users are on the platform.
- Each phase should be a single PR with a clean commit history.
