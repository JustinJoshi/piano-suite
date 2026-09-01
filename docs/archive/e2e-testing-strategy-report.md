# E2E Testing Strategy Report — Piano Suite

> Research date: 2026-08-19  
> Sources: Playwright docs, Clerk testing docs, Convex docs, Vitest docs, Next.js testing guide, GitHub Actions CI patterns, and industry best-practice articles.

---

## 1. Executive Summary

Piano Suite already has a solid testing foundation:

- **Unit / integration tests:** Vitest with separate `frontend` (`jsdom`) and `convex` (`edge-runtime`) projects.
- **E2E tests:** Playwright + `@clerk/testing` covering public routes, auth protection, authenticated drills, settings, and tracking.
- **CI:** GitHub Actions running lint, unit, build, and E2E.

The main E2E blocker is **authentication in CI**: Clerk production keys trigger bot detection in headless browsers, and `@clerk/testing`’s testing-token bypass only works reliably on Clerk **development** instances. PR #58 addresses this by allowing the production Convex deployment to accept a dedicated CI Clerk dev issuer.

This report surveys best practices and recommends the most practical, maintainable path to a comprehensive E2E suite for Piano Suite.

---

## 2. Tooling Landscape

### 2.1 Playwright

Playwright is the recommended E2E framework for Next.js apps because it:

- Runs real browsers (Chromium, Firefox, WebKit).
- Provides resilient [locators](https://playwright.dev/docs/locators) with auto-waiting and retrying.
- Supports [project-based setup](https://playwright.dev/docs/auth#basic-shared-account-in-all-tests) for reusable authentication state.
- Has built-in [tracing](https://playwright.dev/docs/trace-viewer), [screenshots](https://playwright.dev/docs/screenshots), and [video recording](https://playwright.dev/docs/videos) for debugging CI failures.
- Has first-class [GitHub Actions integration](https://playwright.dev/docs/ci-intro).

Key best practices from the [Playwright best-practices guide](https://playwright.dev/docs/best-practices):

1. **Test user-visible behavior**, not implementation details.
2. **Keep tests isolated** — each test should have its own local storage, cookies, and data.
3. **Avoid testing third-party dependencies**; mock external APIs.
4. **Use locators** like `getByRole`, `getByText`, `getByTestId` instead of brittle CSS/XPath selectors.
5. **Use web-first assertions** (`toBeVisible()`) instead of manual assertions (`isVisible()`).
6. **Control the database** when testing with one.

### 2.2 Clerk Testing

Clerk provides `@clerk/testing` with two critical helpers:

- `clerkSetup()` — obtains a testing token at suite start.
- `setupClerkTestingToken({ page })` — injects the token to bypass bot detection.

Per the [Clerk Playwright guide](https://clerk.com/docs/guides/development/testing/playwright/overview):

- Testing tokens require a **Clerk development instance** (`pk_test_*`).
- The global setup must be **project-based** so `CLERK_TESTING_TOKEN` propagates to test workers.
- Email + password auth is the recommended strategy for automated tests.

The [Clerk testing overview](https://clerk.com/docs/guides/development/testing/overview) also notes that testing tokens have production limitations: they do not support code-based auth methods (e.g., OTP) in production, and bot detection is still enforced on production instances.

### 2.3 Convex Testing

Convex offers two testing layers:

1. **`convex-test`** — a mock backend for fast unit/integration tests of Convex functions in Vitest. Supports `t.withIdentity()` for auth simulation. See [Convex testing docs](https://docs.convex.dev/testing/convex-test).
2. **Real backend testing** — test against a local or preview Convex deployment. Required for E2E because the browser talks to a real Convex backend.

Important: `convex/auth.config.js` validates JWT issuers. If CI uses a different Clerk instance, the Convex deployment must trust that issuer.

### 2.4 Vitest

Vitest powers unit and integration tests. The current multi-project setup (`frontend` + `convex`) is the recommended pattern from the [convex-test docs](https://docs.convex.dev/testing/convex-test) and the [Vitest guide](https://vitest.dev/guide/).

Vitest is **not** an E2E tool; it complements Playwright by covering pure logic, hooks, and Convex functions.

### 2.5 GitHub Actions

Recommended CI patterns from [GitHub Actions testing docs](https://docs.github.com/en/actions/use-cases-and-examples/testing-with-github-actions) and Playwright CI guides:

- Run jobs in parallel where possible.
- Use `actions/setup-node` with caching.
- Install Playwright browsers with `npx playwright install --with-deps`.
- Upload Playwright reports/traces as artifacts on failure.
- Use `timeout-minutes` to prevent runaway jobs.
- Store secrets in GitHub Actions encrypted secrets.

---

## 3. E2E Best Practices

### 3.1 Test Isolation

Each test should be independent. Playwright enforces browser-context isolation by default. For tests that modify server-side state, use **one account per parallel worker** or **unique test data per test** to avoid collisions. See [Playwright auth guide](https://playwright.dev/docs/auth#moderate-one-account-per-parallel-worker).

### 3.2 Page Object Model (POM)

Encapsulate page interactions in reusable classes. For example:

- `ChordDrillPage`
- `ArpeggiosPage`
- `SettingsPage`
- `TrackingPage`

This reduces duplication and makes tests resilient to UI changes. The [Playwright POM guide](https://playwright.dev/docs/pom) and [industry best practices](https://getautonoma.com/blog/playwright-best-practices-2026) both recommend POM.

### 3.3 Fixtures and Factories

Use Playwright [fixtures](https://playwright.dev/docs/test-fixtures) to inject common setup (e.g., authenticated page, test user). Use deterministic factories or fixtures for test data rather than hard-coding values.

### 3.4 Deterministic Test Data

E2E tests that write to a shared backend need deterministic, isolated data:

- Use unique identifiers per test run (e.g., timestamp + worker index).
- Clean up test data in teardown.
- Prefer synthetic data over production data.

Articles on [Faker test-data strategies](https://qaskills.sh/blog/faker-test-data-strategies-guide-2026) and [test-data generation](https://getautonoma.com/blog/test-data-generation) emphasize deterministic factories and valid-domain data to avoid flaky failures.

### 3.5 Locators and `data-testid`

Prefer user-facing locators (`getByRole`, `getByText`). When UI text is dynamic or non-unique, add stable `data-testid` attributes. Avoid CSS selectors tied to styling classes.

### 3.6 Web-First Assertions

Always await assertions:

```ts
// Good
await expect(page.getByText("Welcome")).toBeVisible();

// Bad
expect(await page.getByText("Welcome").isVisible()).toBe(true);
```

### 3.7 Mock External Dependencies

Do not rely on real third-party services in E2E. Use Playwright’s `page.route()` or MSW to mock:

- External APIs
- Payment webhooks (Stripe)
- LLM APIs (`/api/chat`)

The [Next.js + MSW + Playwright guide](https://safedep.io/end-to-end-test-nextjs-msw-playwright) and [MSW integration demo](https://github.com/laststance/next-msw-integration) show how to mock server-side fetches deterministically.

### 3.8 Auth State Reuse

For suites with many authenticated tests, authenticate once in a setup project and reuse `storageState`. This is faster than signing in per test. See [Playwright auth setup](https://playwright.dev/docs/auth#basic-shared-account-in-all-tests).

Current Piano Suite E2E already uses a global setup project, which aligns with this pattern.

### 3.9 Reporting and Debugging

Configure Playwright to:

- Use `trace: 'on-first-retry'` (already done).
- Upload `playwright-report/` and `test-results/` as CI artifacts on failure.
- Use `--reporter=html` or `--reporter=list` depending on preference.

---

## 4. Authentication Strategies for E2E

### Option A: Dedicated Clerk Dev Instance for CI

**How it works:**
- Production app uses production Clerk + Convex.
- CI uses a separate Clerk development instance.
- Convex accepts both issuers via `CLERK_FRONTEND_API_URL_EXTRA`.

**Pros:**
- Works with `@clerk/testing` tokens.
- No need for a second Convex deployment.
- Simple secret rotation.

**Cons:**
- CI test user can authenticate against production Convex.
- Test data pollutes production Convex unless carefully cleaned up.

**Best for:** Hobby / single-user apps, early-stage products, teams that want minimal infrastructure overhead.

### Option B: Fully Isolated CI Environment

**How it works:**
- Production: production Clerk + production Convex.
- CI: separate Clerk development instance + separate Convex project/deployment.

**Pros:**
- Zero production data pollution.
- Can run destructive migrations/seeding freely.
- Clean security boundary.

**Cons:**
- Must keep CI Convex schema in sync (add `npx convex deploy` step to CI).
- More secrets and dashboards to manage.
- Slightly more complex CI workflow.

**Best for:** Production apps with real users, regulated environments, or teams with dedicated QA/staging infrastructure.

### Option C: Stub/Programmatic Auth in E2E

**How it works:**
- Bypass Clerk UI entirely by setting the session cookie/storage state programmatically.
- Requires backend support to mint a valid Clerk session or mock `ConvexReactClient` auth.

**Pros:**
- Fastest E2E execution.
- No Clerk bot detection.

**Cons:**
- Does not test the real sign-in flow.
- Brittle if Clerk session format changes.
- Convex still needs a valid JWT.

**Best for:** Smoke tests where auth is not the focus; not recommended for auth-critical apps.

---

## 5. Recommended Architecture for Piano Suite

Given the project’s current state (Hobby Vercel, small team, production == dev for the owner), the recommended architecture is **Option A with Option B as a future upgrade**:

### Current Phase: Option A (implemented in PR #58)

1. **Clerk:** Keep production Clerk for the live app; add a dedicated development Clerk app for CI.
2. **Convex:** Production Convex deployment accepts both issuers via `CLERK_FRONTEND_API_URL_EXTRA`.
3. **GitHub Actions:** CI secrets point to the dev Clerk app.
4. **E2E auth:** Keep `setupClerkTestingToken()` + `clerk.signIn()` via `@clerk/testing`.
5. **Cleanup:** `global.teardown.ts` already deletes the test user; ensure this runs reliably.

### Future Phase: Option B (when the app scales)

1. Create a dedicated Convex project for CI/staging.
2. Add a CI step to deploy the current Convex code to the CI project:
   ```yaml
   - run: npx convex deploy --preview-name ci --preview-create
   ```
3. Point CI’s `NEXT_PUBLIC_CONVEX_URL` at the CI Convex deployment.
4. Keep production Clerk/Convex untouched by CI.

---

## 6. Implementation Roadmap

### Immediate (PR #58)

- [x] Support multiple Clerk issuers in `convex/auth.config.js`.
- [x] Add E2E job timeout to CI.
- [x] Document CI Clerk instance in `.env.example`, `AGENTS.md`, and `docs/PROJECT_HISTORY.md`.
- [ ] Owner: create Clerk dev app, set Convex `CLERK_FRONTEND_API_URL_EXTRA`, update GitHub secrets.
- [ ] Verify CI passes.

### Short-Term (next 1–2 sprints)

- [ ] Add Playwright HTML report + artifact upload on failure.
- [ ] Introduce Page Object Models for repeated pages (Chord Drill, Arpeggios, Tracking, Settings).
- [ ] Add stable `data-testid` attributes to critical interactive elements.
- [ ] Split authenticated specs by feature to improve parallelism.
- [ ] Add a smoke test for the landing page hero atmosphere switching.

### Medium-Term

- [ ] Add MSW-based mocking for `/api/chat` and external webhooks in E2E.
- [ ] Add visual regression tests for theme switching (optional).
- [ ] Evaluate separate Convex CI deployment (Option B) once real users are on the platform.

---

## 7. Anti-Patterns to Avoid

1. **Running E2E against production Clerk keys.** Confirmed by PR #57 — bot detection hangs the suite.
2. **Shared mutable state between tests.** Causes flaky failures.
3. **Hard-coded waits (`page.waitForTimeout`).** Use locators and web-first assertions instead.
4. **Testing external services directly.** Mock Stripe, LLM, and other third-party APIs.
5. **Ignoring CI artifacts.** Always upload traces/screenshots on failure.
6. **Skipping cleanup.** Test users and data must be removed after runs.

---

## 8. Conclusion

The best E2E strategy for Piano Suite today is:

- **Playwright** for E2E, with `@clerk/testing` on a **dedicated Clerk development instance**.
- **Convex multi-provider auth config** so CI can authenticate against the production Convex deployment.
- **Vitest + convex-test** for unit/integration coverage of logic and Convex functions.
- **GitHub Actions** for CI, with parallel jobs, build artifacts, and a strict E2E timeout.

This balances correctness, maintainability, and infrastructure cost. As the app grows, migrate to a fully isolated CI Convex deployment (Option B) for stronger data isolation.
