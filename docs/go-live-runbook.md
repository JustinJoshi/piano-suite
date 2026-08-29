# Go-Live Runbook

> ⚠️ **Read [`IMPORTANT-NOTICES.md`](../IMPORTANT-NOTICES.md) first** — the
> COPPA age gate, music-rights audit, and privacy-policy pass are hard
> blockers that must be done before this runbook's public-announcement
> steps.

Ordered cutover from preview deployments to live production. Each step lists
its verification before moving on. Total: ~2 focused days.

Order matters: **domain → Clerk → Convex → analytics**. Reversing the first
three is the classic silent breaker (auth works in preview, breaks in prod).

## 0. Vercel production environment variables

Set in Vercel → Project → Settings → Environment Variables, **Production
scope only** (Preview keeps dev keys):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (canonical URLs + OG) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Prod publishable key (step 2) |
| `CLERK_SECRET_KEY` | Prod secret key (step 2) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key (step 5) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client DSN (step 6) |
| `SENTRY_DSN` | Sentry server DSN (step 6) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Optional: source-map upload |

**Verify:** Preview deployments after this change still show dev-clerk in the
browser extension; Production shows the prod instance.

## 1. Custom domain

1. Vercel → Project → Settings → Domains → add apex + `www`.
2. Point DNS: apex `A` → `76.76.21.21`, `www` `CNAME` → `cname.vercel-dns.com`.
3. Set `www` → redirect to apex (or the reverse; pick one canonical).

**Verify:** `curl -I https://<domain>` returns 200 and the redirect works.

## 2. Clerk production cutover

1. Clerk Dashboard → create the **production** instance (separate from dev).
2. Copy the prod publishable + secret keys into Vercel (step 0).
3. In Clerk → Allowed origins / redirect origins, add
   `https://<domain>` and `https://www.<domain>`.

Everything in code (proxy.ts gate, `app/api/**` self-authorization) reads
whatever keys are present — no code changes.

**Verify:** Sign in on the production deployment; the Clerk dashboard shows
the new session under the prod instance.

## 3. Convex production deployment

1. Create/select the prod deployment: `npx convex deploy` targets it via
   `CONVEX_DEPLOYMENT` (see Convex dashboard).
2. Point prod auth at the **prod** Clerk issuer — the #1 silent breaker if
   skipped:
   ```bash
   unset CONVEX_DEPLOYMENT NEXT_PUBLIC_CONVEX_URL NEXT_PUBLIC_CONVEX_SITE_URL
   npx convex env set CLERK_FRONTEND_API_URL "<prod-clerk-issuer>"
   ```
   (`convex/auth.config.js` reads this; dev-issuer-pointed-at-prod-Convex
   produces auth that passes on preview and fails in prod.)
3. Set `NEXT_PUBLIC_CONVEX_URL` (prod) in Vercel step 0.
4. **Run the seed functions against prod.** An empty prod DB is the classic
   go-live failure: chord catalogs, drills, patterns must exist before the
   first user lands.
5. Deploy functions: `npx convex deploy`.

**Verify:** `npx convex dashboard` (prod) shows seeded tables; the deployed
app loads a drill without console errors.

## 4. Incognito click-through (before announcing anything)

On the production domain, in a clean incognito window:

- [ ] Landing page renders; hero atmosphere visible
- [ ] `/pricing` shows the **Founding Pro waitlist** (not a pricing table)
- [ ] Complete one drill (workshop page) without signing in
- [ ] Waitlist CTA appears after the finished drill
- [ ] Join the waitlist → success state with position; duplicate join says
      already-joined
- [ ] `/terms` and `/privacy` open from the pricing and landing footers
- [ ] Sign up → complete a drill → `practiceEvents` row lands in prod Convex
- [ ] `waitlistCount` increments (Convex dashboard)

## 5. PostHog

1. Create the project, copy the project API key into Vercel (`NEXT_PUBLIC_POSTHOG_KEY`).
2. Exactly three events ship from code (no autocapture):
   `drill_started`, `drill_completed` (from `hooks/useDrillRuntime.ts`),
   `pro_waitlist_click` (from `components/waitlist/waitlist-cta.tsx`).
3. Activation targets (CSO plan): ≥40% session-one drill completion,
   ≥20% 7-day return.

**Verify:** complete a drill on prod → events visible in PostHog live view.

## 6. Sentry

1. Create the project, copy DSNs into Vercel (`SENTRY_DSN`,
   `NEXT_PUBLIC_SENTRY_DSN`). Optional source-map upload: `SENTRY_ORG`,
   `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
2. No code changes needed — `instrumentation.ts` / `instrumentation-client.ts`
   no-op without a DSN.

**Verify:** throw a test error on prod → issue appears in Sentry.

## 7. Founding Pro onboarding (after ~30 waitlist signups)

1. Export emails from the `waitlistSignups` table (Convex dashboard).
2. Stripe Payment Link for founding pricing; send manually.
3. Mark payers: set `syncEntitled: true` + `entitlementSource: "founding"`
   on their `users` row (webhook or dashboard).
4. Real billing (flip `BILLING_ENABLED` in `lib/billing.ts`) only after
   ~25 payers — see branch `justin/founding-pro-stripe` for the Stripe
   integration it already contains.

## Kill/pivot signal

Week-6 cohorts with <40% activation or <10% 7-day retention → pivot to
guided practice routines. Not more features, not more channels.
