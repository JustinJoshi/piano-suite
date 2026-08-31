# Task List: Go-Live (pre-launch gate)

Source: CSO go-live plan. Scope: the 6 pre-launch items only. Launch stays frozen:
free tools, no Clerk Billing, waitlist instead. Every code task is TDD — write the
test, watch it fail, implement, watch it pass.

## Priority 1 — LEGAL BLOCKER (outranks every task below)

Source: `IMPORTANT-NOTICES.md` (OpenExecutive committee review, 2026-08-29).
**Do NOT announce publicly until all of 0.1–0.5 are done.** These outrank
section 5.x and all feature work.

- [ ] 0.1 Age gate: **removed 2026-08-31 by owner decision** (`lib/age-gate.ts` + `components/age-gate/` deleted). Under-13 visitors are no longer blocked or excluded from tracking — reopen this before any public launch aimed at mixed audiences.
- [x] 0.2 Sentry PII scrubbing: `sendDefaultPii: false` + `beforeSend` scrub; confirm PostHog autocapture stays OFF (leak audit) — evidence: `lib/__tests__/sentry.test.ts` `scrubSentryEvent`; `autocapture: false` in `lib/analytics.ts`
- [x] 0.3 Privacy policy pass: name PostHog/Sentry/Convex/Clerk as processors, add data-retention window + deletion path (user-facing) — evidence: `app/privacy/page.tsx` children's-privacy + retention sections
- [x] 0.4 Music rights audit: inventory every MIDI file / arrangement in the repo and record provenance (`docs/music-rights-audit.md`); arrangements are derivative works — evidence: audit doc, status CLEAN
- [ ] 0.5 Counsel review (human task, owner: Justin): budget $1–3K fixed-fee privacy review of age gate + policy; confirm the app operates under an LLC

## Relevant Files

- `lib/analytics.ts` - NEW: analytics wrapper; constrained event names, no-op without PostHog key, test-mode window log
- `lib/__tests__/analytics.test.ts` - Unit tests for the wrapper (write FIRST)
- `hooks/useDrillRuntime.ts` - Emit `drill_started` in `start()`, `drill_completed` on finished-phase transition (central — no per-page calls)
- `hooks/__tests__/useDrillRuntime.test.ts` - Extend with event-emission tests (write FIRST); if absent, create minimal RTL suite
- `app/layout.tsx` - PostHog provider mount + `metadataBase`/canonical (HOTSPOT)
- `lib/billing.ts` - Add `BILLING_ENABLED` flag + `waitlist` label helpers; unit-testable
- `lib/__tests__/billing.test.ts` - Unit tests for flag/label helpers (write FIRST)
- `convex/waitlist.ts` - NEW: `joinWaitlist` mutation + `waitlistCount` query, `returns` validators
- `convex/__tests__/waitlist.test.ts` - convex-test: anonymous signup, duplicate email, validators (write FIRST)
- `convex/schema.ts` - `waitlistSignups` table (HOTSPOT — coordinate)
- `components/waitlist/waitlist-cta.tsx` - NEW: email capture CTA (Founding Pro)
- `components/waitlist/__tests__/waitlist-cta.test.tsx` - RTL: render, submit, duplicate, success (write FIRST)
- `components/custom-practice/*` - Mount CTA after first finished drill (runtime host)
- `components/pricing/pricing-page.tsx` - Swap `PricingTable` → waitlist behind `BILLING_ENABLED`
- `app/terms/page.tsx`, `app/privacy/page.tsx` - NEW static legal pages
- `e2e/go-live.spec.ts` - NEW: legal pages, waitlist flow, drill event emission
- `docs/go-live-runbook.md` - NEW: Clerk/Convex prod cutover + seed + incognito checklist
- `package.json` / `package-lock.json` - NEW deps: `posthog-js`, `@sentry/nextjs` (HOTSPOT — this branch owns dependency changes this batch)

### Notes

- Unit tests: `npm run test:unit:run`. E2E: `npm run test:e2e` — auth specs fail fast when `NEXT_PUBLIC_AUTH_DISABLED=true` unless `E2E_ALLOW_AUTH_DISABLED=true`.
- Reuse `e2e/auth-assertions.ts` helpers (`expectNotBare404`, `expectNoApplicationError`) — no new URL/error assertion patterns.
- Convex auth conventions: anonymous waitlist signup is allowed by design (pre-auth value moment), so the mutation validates + dedupes on email instead of auth-gating; `users`-linked mutation variants would use `ensureUserId`.
- Next 16.2.12: read `node_modules/next/dist/docs/` (metadata, instrumentation) before touching layout/Sentry wiring.
- Test-mode assertion mechanism for e2e: `lib/analytics.ts` mirrors captures to `window.__analyticsEvents` when `NEXT_PUBLIC_POSTHOG_KEY` is unset; e2e reads that array. Keeps PostHog out of CI.
- Ops tasks (4.x, 5.2) verify by runbook checklist, not unit tests.

## Instructions for Completing Tasks

Check off by changing `- [ ]` to `- [x]` after each sub-task. Evidence = the
command output named in the sub-task (test fail → pass, lint, build, e2e).

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git worktree add .worktrees/justin-go-live -b justin/go-live` from repo root; all work inside the worktree

- [x] 1.0 Analytics + error monitoring
  - [x] 1.1 Add deps (`posthog-js`, `@sentry/nextjs`) — one commit, this branch owns package.json for the batch
  - [x] 1.2 Write `lib/__tests__/analytics.test.ts` FIRST: (a) rejects/never emits names outside the 3-event const list, (b) capture is a no-op when `NEXT_PUBLIC_POSTHOG_KEY` unset, (c) test-mode mirror lands in `window.__analyticsEvents`. Run `npx vitest run lib/__tests__/analytics.test.ts` — expect FAIL
  - [x] 1.3 Implement `lib/analytics.ts` (lazy posthog-js init, autocapture OFF, names from a const tuple). Re-run — expect PASS
  - [x] 1.4 Write event-emission tests for `useDrillRuntimeProvider` FIRST: `start()` → `drill_started`; transition to `finished` → `drill_completed` (payload includes `pageId`). Expect FAIL
  - [x] 1.5 Wire the two captures into `hooks/useDrillRuntime.ts` (start callback + finished transition, no pageId requirement for emission). Re-run — expect PASS; `npm run test:unit:run` green
  - [x] 1.6 Mount PostHog provider in `app/layout.tsx`; verify `npm run build` passes
  - [x] 1.7 Sentry per Next 16 docs (read `node_modules/next/dist/docs/` first): client+server config, `onRequestError` hook, test capture locally; document DSN var in runbook

- [x] 2.0 Founding Pro waitlist (replaces billing pre-launch)
  - [x] 2.1 Write `convex/__tests__/waitlist.test.ts` FIRST: anonymous signup inserts with normalized email; duplicate email returns existing/`alreadyJoined` (no second row); invalid email rejected; `waitlistCount` returns count with `returns` validator; signed-in signup attaches optional `userId`. Run — expect FAIL
  - [x] 2.2 Add `waitlistSignups` (email, userId optional, createdAt, source) with `by_email` index to `convex/schema.ts`; implement `convex/waitlist.ts`. Re-run — expect PASS
  - [x] 2.3 Write `lib/__tests__/billing.test.ts` FIRST for `BILLING_ENABLED=false` default + waitlist label helpers. Expect FAIL → implement in `lib/billing.ts` → PASS
  - [x] 2.4 Write `waitlist-cta.test.tsx` FIRST: renders headline + email input; valid submit → success state; duplicate → friendly already-joined state; invalid → inline error. Expect FAIL → implement `components/waitlist/waitlist-cta.tsx` → PASS
  - [x] 2.5 Swap `PricingTable` → `WaitlistCta` on `/pricing` gated by `BILLING_ENABLED` (one-flag restore later); add FAQ tweak "Pro launches soon — join the Founding Pro waitlist"
  - [x] 2.6 Mount `WaitlistCta` in workshop runtime UI after first `finished` phase (once per session, dismissible, localStorage flag) — value-moment placement, never pre-drill

- [x] 3.0 Terms + Privacy pages
  - [x] 3.1 Write `e2e/go-live.spec.ts` FIRST: `/terms` + `/privacy` → 200, `expectNotBare404` + `expectNoApplicationError`, footer/nav link navigates. Run — expect FAIL (404)
  - [x] 3.2 Generate static pages from a template (TermsFeed-style): accounts, content ownership, no-warranty on practice data; Privacy discloses PostHog (analytics) + Sentry (error logs) + Clerk (auth) + Convex (data storage) — must match what 1.0 actually added
  - [x] 3.3 Link from pricing page footer + landing footer. Re-run e2e — expect PASS

- [x] 4.0 Prod launch config + runbook
  - [x] 4.1 Add `metadataBase` + canonical to `app/layout.tsx` (same commit discipline as 1.6; coordinate — hotspot); verify build
  - [x] 4.2 Write `docs/go-live-runbook.md`, ordered: (1) custom domain in Vercel (apex + www redirect), (2) Clerk prod instance + keys in Vercel **Production scope only** + domain in allowed origins, (3) `npx convex env set CLERK_FRONTEND_API_URL <prod-issuer>` against prod deployment, (4) `npx convex deploy` + **run seed functions against prod**, (5) PostHog/Sentry DSNs, (6) incognito checklist
  - [x] 4.3 Verify prod-shaped env: `npm run build` with `NEXT_PUBLIC_POSTHOG_KEY`, Sentry DSN, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set locally — no missing-var crashes

- [ ] 5.0 Launch verification gate
  - [x] 5.1 Extend `e2e/go-live.spec.ts`: drill flow emits `drill_started`/`drill_completed` (read `window.__analyticsEvents`), waitlist submit visible post-drill. Run `npm run test:e2e`
  - [x] 5.2 Full gate: `npm run lint && npm run test:unit:run && npm run build && npm run test:e2e` — all green
  - [ ] 5.3 Execute runbook incognito checklist on preview: sign up → complete a drill → events in PostHog → waitlist signup row in Convex → legal pages reachable → `waitlistCount` increments
