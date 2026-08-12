# Remediation Plan — Deep Research Findings

> Full findings with evidence and sources:
> [`docs/deep-research-report.md`](deep-research-report.md).
>
> Source: full-repo audit (2026-08) against current docs/best practices for
> Next.js 16, React 19, Convex, Clerk + Billing, Tailwind v4, smplr/Web
> Audio/Web MIDI, Vercel AI SDK v7, three.js, Vitest/RTL/Playwright.
>
> **Status:** Phases 1–6 plus the articles-public change are **shipped** and
> merged to `main` (PRs #39–#46). Phases 7–12 remain available to pick up.
>
> **How phases work:** one phase = one turn of work. Each phase is
> independently mergeable, gets its own worktree/branch
> (`kimi/phase-N-<name>`), and closes with the gate (`lint`, `test:unit:run`,
> `build`; `test:e2e` when it touches auth or a covered flow).
> `package.json`/lockfile are hotspot files — only Phases 4, 6, and 9 touch
> them; never run two such phases in parallel.

## Phase 1 — Auth bypass guard + chat cost hardening (P0 security) ✅ Shipped

**PR:** #39 · **Branch:** `kimi/phase-1-auth-guard`

The `AUTH_DISABLED` escape hatch can never open production; the paid chat
endpoint never bypasses authorization; chat cost surface hardened.

- `lib/auth-disabled.ts` — add `isAuthBypassEffective()` (false when
  `VERCEL_ENV === "production"`)
- `proxy.ts` — use the guard; exact-or-descendant public-route matching
  (no more `startsWith("/dev")` opening `/devtools`)
- `app/api/chat/route.ts` — always require session + allowlist;
  `export const maxDuration = 30`; module-level cached system prompt (was
  re-reading all articles from disk per POST); strip client `system` roles;
  caps: 50 messages / 4000 chars each
- `lib/chat-auth.ts` — remove the `authDisabled` bypass branch
- Tests: `lib/__tests__/auth-disabled.test.ts`, `lib/__tests__/chat-auth.test.ts`
- Docs: `docs/PROJECT_HISTORY.md` bypass section; `AGENTS.md` rule: every
  `app/api/**` route handler must authorize itself via `auth()`

Explicitly out of scope: `frontendApiProxy` migration / bypass deletion
(custom-domain cutover, `docs/phase-a-auth-cutover-plan.md`); `useChat`
rewrite (Phase 4).

## Phase 2 — Audio core-value fixes (P0) ✅ Shipped

**PR:** #40 · **Branch:** `kimi/phase-2-audio-fixes`

MIDI input is not user activation (autoplay policy): playing without
clicking the page gives silence-then-burst. Preset switching mid-load
corrupts engine state via a stale async continuation.

- `lib/audio-engine.ts` — `disposed` flag checked after every `await`
  (`load()` continuation ~:222-241, `play()`'s `void load().then()` ~:269-276);
  resume-from-gesture entry point; skip scheduling when context not
  `"running"`; handle Safari `"interrupted"` (~:202)
- `components/audio/audio-engine-host.tsx` — one-time `pointerdown`/`keydown`
  listener resuming the shared context; resume from MIDI Connect
- `components/audio/engine-host.tsx:35-51` — gate engine creation/`load()`
  on `settings.enabled`
- `lib/midi-session.ts` — clear `heldSet` when the selected input disappears
  (~:239-243); split permission-denied from unsupported (~:245-257)
- Tests: audio-engine race/disposed cases; midi-session cases

## Phase 3 — Pro entitlement verification + webhook mirror (P0) ✅ Shipped

**PR:** #42 · **Branch:** `kimi/phase-3-clerk-billing-webhook`

A svix-verified Clerk Billing webhook (`app/api/webhooks/clerk/route.ts`)
mirrors Pro/`sync` entitlement onto `users.syncEntitled`, and `user.updated`
profile sync is folded into the same endpoint. `convex/lib/entitlements.ts`
now accepts either JWT `pla`/`fea` claims **or** the webhook-mirrored DB
column.

**Post-merge manual step:** In the Clerk Dashboard, point the webhook
endpoint to `/api/webhooks/clerk`, subscribe to Billing
(`subscription.*`, `subscriptionItem.*`) and `user.updated` events, and set
`CLERK_WEBHOOK_SIGNING_SECRET` (Vercel) plus `CLERK_WEBHOOK_SHARED_SECRET`
(Vercel **and** Convex `npx convex env set`). See `docs/clerk-billing-setup.md`
for the full matrix.

## Phase 4 — Chat UX migration to AI SDK v7 `useChat` (P0) ✅ Shipped

**PR:** #43 · **Branch:** `kimi/phase-4-usechat-v7`

Hand-rolled stream read has no error channel (mid-stream provider failure =
silent empty bubble), no stop/retry/abort. The chat UI now uses `useChat`
with `DefaultChatTransport`; the API returns
`createUIMessageStreamResponse` with `onError` masking.

- `package.json` — add `@ai-sdk/react` (own lockfile this batch)
- `app/api/chat/route.ts` — `createUIMessageStreamResponse` with `onError`
  masking; `convertToModelMessages`
- `app/chat/page.tsx:48-105` — `useChat` + `DefaultChatTransport`; Stop
  button, error display, retry
- `app/chat/page.tsx:185` — render assistant messages with react-markdown
  (already a dep; no `rehype-raw`) so source citations render
- E2E: extend `e2e/chat-auth.spec.ts` if the response shape changes

## Phase 5 — Bundle & render-loop perf quick wins (P1) ✅ Shipped

**PR:** #44 · **Branch:** `kimi/phase-5-viz-perf`

- `components/drills/{chladni,julia,quasiperiodic,chladni-ripple}/*-lab.tsx`
  — `next/dynamic({ ssr: false })` around the three.js visualization imports
  (~600KB off the public `/tools/chladni` route bundle)
- New `hooks/useVisibilityPause.ts` — IntersectionObserver; apply to the RAF
  loops in the 4 visualization components + ambient host
- `chladni/julia/quasiperiodic-visualization.tsx` cleanups — add
  `renderer.forceContextLoss()` after `dispose()`
- Port ResizeObserver to Julia/Quasiperiodic; replace Lissajous per-frame
  `getBoundingClientRect()`
- Check e2e for animation assertions before landing

E2E passed (48 specs).

## Phase 6 — Convex scaling + validation (P1) ✅ Shipped

**PR:** #46 · **Branch:** `kimi/phase-6-convex-scaling`

- `convex/tracking.ts` — five `list*Events` `.collect()` →
  `.order("desc").take(N)`; batched clears; `returns` validators (15 fns)
- `convex/technique.ts` — same (4 fns); fix N+1 in
  `bulkImportTechniqueSessions:71-93`
- `convex/schema.ts` — drop unused indexes (:35, :38, :82, :13)
- All `ctx.db` calls — add table-name argument (15 sites)
- `convex/lib/auth.ts:80-87` — drop redundant `get` in `syncUserProfile`
- `package.json` — `@convex-dev/eslint-plugin` (own lockfile this batch)
- Tests: update/extend `convex/__tests__/`

## Phase 7 — 60fps React state churn (P1)

- `hooks/useMusicPlayer.tsx` — `progress` (:310-324) out of context into
  ref/subscription; `useMemo` the value (:407-420); reuse the pitch-detection
  `Float32Array` (:279)
- `components/ambient/multigrid-background.tsx:49-80` — drive morph from a
  ref in the RAF loop (Lissajous ref pattern)
- `hooks/useChladniRipple.ts:101-119` — skip `setViz` when idle
- `components/ambient/ambient-effect-renderer.tsx:97-122,159-184` — same

## Phase 8 — Lookahead audio scheduling (P1)

- `lib/music-player.ts:169-205` — replace per-note `setTimeout` pairs with a
  lookahead scheduler against `ctx.currentTime` (evaluate smplr 1.0
  `Sequencer`/`Scheduler` first)
- `hooks/useMusicPlayer.tsx:309-311` — progress from the audio clock
- `hooks/useAudio.ts:149-150` — metronome onto the same pattern
- Tests: scheduler-window cases with a fake clock

## Phase 9 — CI + test infrastructure (P2)

- `.github/workflows/ci.yml` — lint + unit + build on PRs; e2e job against
  `next build && next start` with Clerk/Convex secrets
- `vitest.config.ts` — `projects` split: `convex` (`edge-runtime`) +
  `frontend` (`jsdom`); resolve `globals: true` vs explicit imports
- `package.json` — `@vitest/coverage-v8`, `@edge-runtime/vm`,
  `test:coverage` script (own lockfile this batch)

## Phase 10 — Test coverage gaps (P2)

- `hooks/__tests__/useChordDrill.test.ts` — 942-line flagship hook, zero tests
- `lib/__tests__/audio-presets.test.ts` — preset ID validation
- `hooks/__tests__/` — `useThemePreference`, `useWelcomeConfig`,
  `useLocalPracticeHistory`; one representative drill-settings hook
- `convex/__tests__/` — `savedPatterns` (untested), tracking/technique list
  queries, cross-user access on pattern/grade mutations

## Phase 11 — Metadata/SEO + articles decision (P2) 🟡 Partially shipped

**Articles public:** PR #41 · **Branch:** `kimi/articles-public`

Articles are now **public**: `proxy.ts` allowlist + e2e updated. Remaining:
`title.template` in root metadata; per-route metadata (push `"use client"`
down into a gate child on the ~12 tool pages → server components);
`app/not-found.tsx`; `robots.ts` + `sitemap.ts`.

## Phase 12 — Theming + E2E cleanup (P3)

- `components/tracking/tracking-chart.tsx:66,78` — nonexistent
  `--color-bg-page` token → `var(--color-background)`
- Shared deck-stat badge + grade-pill component (kills duplicated
  `bg-blue-500`/`text-orange-500`/`text-white` one-offs in arpeggios +
  chord-drill)
- `app/globals.css` — delete duplicated `.amber` block; `color-mix` for
  repeated RGB triplets; strip dead dark-mode plumbing
- `lib/theme-fallbacks.ts` — consolidate canvas-viz fallback hexes (4 files)
- E2E: fix stale assertion `e2e/auth-protection.spec.ts:54` ("Sync" vs
  actual "Pro" copy); role/testid locators instead of brittle CSS; shared
  Clerk user isolation hardening
