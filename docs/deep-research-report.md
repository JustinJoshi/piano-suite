# Deep Research Report — Full-Repo Best-Practices Audit (2026-08)

> Companion to [`docs/remediation-plan.md`](remediation-plan.md), which turns
> these findings into 12 executable phases. This document preserves the full
> audit: method, per-tool findings with file:line evidence and best-practice
> sources, and the consolidated priority list.

## Method

1. **Identified the core stack** from `package.json`: Next.js 16.2.12 + React
   19.2.4, Convex 1.42.3, Clerk 7.6.1 (+ Billing, `@clerk/testing`),
   Tailwind CSS v4 + next-themes, smplr 1.0 + Web Audio + Web MIDI,
   Vercel AI SDK (`ai` 7.0.37, `@ai-sdk/openai` 4.0.20), three.js r171,
   Vitest 4.1 + React Testing Library 16 + convex-test + Playwright 1.62,
   recharts.
2. **Researched current docs and best-practice guidelines for each tool** —
   for Next.js 16, the vendored docs at `node_modules/next/dist/docs/` (per
   the AGENTS.md warning that Next 16 breaks older conventions); for the
   rest, the official sources cited per section below.
3. **Audited the codebase against those findings**, verifying every claim
   against the actual code. Eight independent area audits were run; their
   results are consolidated here.

---

## 1. Next.js 16 + React 19

Sources: vendored docs `node_modules/next/dist/docs/01-app/` (routing, data
fetching, caching, `proxy.ts`, metadata, error handling) + Vercel's
React/Next performance guidelines (bundle-dynamic-imports,
rerender-use-ref-transient-values, rerender-memo, server-hoist-static-io,
rendering-hydration-no-flicker rules).

**Already good (verified):** `proxy.ts` follows the Next 16 convention
correctly; `app/error.tsx` + `app/global-error.tsx` exist; articles are
genuinely static (`generateStaticParams`); `AmbientEffectsHost` uses
`next/dynamic({ ssr: false })`; MIDI uses `useSyncExternalStore`;
`next/font` used properly.

### High impact

- **three.js (~600KB) statically bundled into lab routes.**
  `components/welcome/chladni-visualization.tsx:4`,
  `components/drills/julia/julia-visualization.tsx:4`,
  `components/drills/quasiperiodic/quasiperiodic-visualization.tsx:4` all use
  `import * as THREE from "three"` and are statically imported by the lab
  components. The **public** `/tools/chladni` page ships three.js in its
  route bundle. Fix: `next/dynamic(..., { ssr: false })` per visualization.
  Effort: low.
- **`MusicPlayerProvider` re-renders every context consumer at 60fps during
  playback.** `hooks/useMusicPlayer.tsx:310-324` sets progress state every
  animation frame; the context value (`:407-420`) is a fresh object every
  render. Fix: progress in a ref/subscription; memoize the value. Effort:
  medium.
- **Metadata/SEO broken three ways.** Only 3 routes define metadata
  (`app/layout.tsx:32`, `app/pricing/page.tsx:4`,
  `app/articles/[slug]/page.tsx:17`); every tool/settings/chat page is
  `"use client"` and cannot export metadata; no `title.template`;
  articles carry full SEO machinery but `proxy.ts:39-47` gates `/articles`
  behind Clerk while the landing hero links to a gated article
  (`components/welcome/hero-section.tsx:93`) — contradicts the "free
  learning community" repositioning. No `robots.ts`/`sitemap.ts`. Effort:
  low–medium.

### Medium impact

- **Every tool page is an unnecessary client component** (e.g.
  `app/tools/chord-drill/page.tsx:1-28`). Pushing `"use client"` into a gate
  child would make ~12 pages server components with per-route metadata.
  Effort: medium.
- **Chat route re-reads all articles from disk per request** (fixed in
  Phase 1). `app/api/chat/route.ts:16` → `lib/articles.ts:43-79` did
  `fs.existsSync` + `fs.readFileSync` per article per POST. Also no cap on
  `messages` size (fixed in Phase 1).
- **No `not-found.tsx` or `loading.tsx` anywhere.**
  `app/articles/[slug]/page.tsx:38` calls `notFound()` into Next's bare
  default 404. Effort: low.
- **Client data waterfall on tool pages.** Page gate
  (`hooks/useToolUserReady.ts:17-35`) blocks drill render, then drills fire
  their own Convex queries post-mount. Convex `preloadQuery` could stream.
  Effort: medium.
- **Empty `next.config.ts`** — Cache Components unexplored; no bundle
  analyzer. Strategic.

### Low impact

- Latent hydration-mismatch pattern: `useState(() => readLocalStorage())` in
  root providers (`hooks/useAmbientEffects.tsx:74-77`,
  `hooks/useAudioSettings.tsx:61-63`) — currently masked by `ssr:false`
  consumers.
- `AudioEngineHost` subscribes to the full MIDI snapshot though it only
  needs `connected` + note events (`components/audio/audio-engine-host.tsx:17`).
- `app/global-error.tsx:18,28` hard-codes amber hex.
- Dead UI: non-functional search input and bell button on the tools
  dashboard (`app/tools/page.tsx:41-51`).
- `app/chat/page.tsx` hand-rolls streaming fetch (lines 48-93) instead of
  `useChat` (see §7).

---

## 2. Convex

Sources: [Best Practices](https://docs.convex.dev/understanding/best-practices/),
[Argument & Return Validation](https://docs.convex.dev/functions/validation),
[Index & Query Performance](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf).

**Already good (verified):** every public function has `args` validators and
an access-control check; queries use `optionalUserId` + neutral returns; all
reads are index-backed; `"skip"` gating consistent across ~20 client
`useQuery` sites; `Date.now()` only in mutations.

### High impact

- **Unbounded `.collect()` on append-only event tables.**
  `convex/tracking.ts:25-29, 37-41, 48-53, 60-64, 72-76` (all five
  `list*Events` queries); clear mutations at `:224-227, 244-260, 275-285,
  297-306`; `convex/technique.ts:13-16, 105-108`. `practiceEvents`/
  `missEvents` grow forever, and tracking panels **subscribe** to these
  queries (`components/tracking/chord-drill-panel.tsx:22-25`), so every
  logged event re-reads/re-transmits the user's entire history. Fix:
  `.order("desc").take(N)` or `usePaginatedQuery`. Effort: medium.
- **Missing `returns` validators on 19 public functions** — all of
  `convex/tracking.ts` and `convex/technique.ts` (violates the project's own
  AGENTS.md rule). `savedPatterns.ts:26-34` is the in-repo template.
  Effort: low.

### Medium impact

- **Unused/redundant indexes — write amplification on the hottest table.**
  `practiceEvents.by_user` (`schema.ts:35`), `by_user_timestamp` (`:38`),
  `savedPatterns.by_user` (`:82`), `users.by_email` (`:13`) — verified
  unused by grepping all `withIndex` call sites. Every drill event insert
  pays 4 index writes where 2 are never read. Effort: low.
- **`ctx.db` calls without the table-name argument (15 sites)** across
  `tracking.ts`, `technique.ts`, `settings.ts`, `savedPatterns.ts`. Docs:
  "Always include the table name when calling `ctx.db` functions" — will
  become required. Autofixable via `@convex-dev/codemod` or the
  `@convex-dev/explicit-table-ids` ESLint rule. Effort: low.
- **Subscription fan-out in the root layout** — 5–8 independent reactive
  `settings.getSetting` subscriptions per session (ambient, audio,
  experimental, theme, hero hooks). Fix: one `getSettings(keys)` query.
  Effort: medium.
- **Redundant `db.get` in `syncUserProfile`** (`convex/lib/auth.ts:80-87`) —
  runs on every authenticated write (i.e., per practice event). Effort:
  trivial.

### Low impact

- `.filter()` on database queries in clear mutations
  (`tracking.ts:247-253, 278-284, 300-305`).
- N+1 in `bulkImportTechniqueSessions` (`technique.ts:71-93`).
- Overly permissive `v.string()` validators where `v.union(v.literal(...))`
  fits (`schema.ts:20, 26, 31`).
- `savedPatterns` mutations bypass the Pro sync gate (client-gated only;
  `savedPatterns.ts:67, 101, 123`).
- Thin convex-test coverage (only settings auth + entitlement gating).

### Process improvement

Add `@convex-dev/eslint-plugin` (`require-argument-validators`,
`no-collect-in-query`, `no-filter-in-query`, `explicit-table-ids`) — turns
several findings into CI-enforced rules. Effort: low.

---

## 3. Clerk (auth + billing)

Sources: [clerkMiddleware reference](https://clerk.com/docs/reference/nextjs/clerk-middleware),
[authorization checks](https://clerk.com/docs/guides/secure/authorization-checks),
[JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates),
[Clerk↔Convex integration](https://clerk.com/docs/integrations/databases/convex),
[Billing webhooks](https://clerk.com/docs/nextjs/guides/development/webhooks/billing),
[@clerk/testing Playwright](https://clerk.com/docs/guides/development/testing/playwright/overview).

**Already right (verified):** `proxy.ts` matches the current Clerk Next 16
convention exactly; the manual `startsWith` public-route list is
accidentally the recommended pattern now (`createRouteMatcher()` is
deprecated — do not "modernize" toward it); persistence enforcement is
server-side in Convex mutations via verified JWT identity; `/api/chat`
authorizes from `(await auth()).userId`; UI gating prefers
`has({ feature })` over plan checks; E2E uses `setupClerkTestingToken` with
a fail-fast bypass-off guard.

### High

- **`NEXT_PUBLIC_AUTH_DISABLED` bypass neutered server-side authorization
  (FIXED in Phase 1).** `proxy.ts` skipped all route protection and
  `app/api/chat/route.ts` returned `"ok"` for anyone when the flag was on —
  opening a paid LLM endpoint. The flag is `NEXT_PUBLIC_*` (visible in the
  client bundle), and `docs/clerk-billing-setup.md:99-100` documented it as
  the live production posture. Fixed via `isAuthBypassEffective()`
  (Production-inert) + chat always requiring session + allowlist.
  Medium-term: Clerk's `frontendApiProxy` + production keys, then delete
  the bypass.
- **Convex Pro gate reads `pla`/`fea` claims that may never reach
  `getUserIdentity()` — unverified, fails closed.**
  `convex/lib/entitlements.ts:22-28` → `hasSyncFromClerkClaims`
  (`lib/billing.ts:152-169`). Clerk docs state `pla`/`fea` cannot be
  included in custom JWT templates; they only arrive via the raw session
  token when the Clerk↔Convex **integration** (not the JWT-template path)
  is active. `docs/phase-a-auth-cutover-plan.md:167` blesses either setup,
  so this is a dashboard fact. If the template branch is live, every paid
  Pro user fails every sync mutation. Fix: (a) verify by logging identity
  keys after a real test checkout; (b) robustly, mirror subscription state
  into `users` via a svix-verified Billing webhook and gate on the DB
  column. Effort: low to verify, medium for the webhook. **(Phase 3.)**

### Medium

- **All of `/api/*` is public in the proxy** — future route handlers must
  self-gate (rule now recorded in AGENTS.md, Phase 1).
- **Loose prefix matching in the public-route list (FIXED in Phase 1)** —
  `startsWith("/dev")` also matched `/devtools`, etc.

### Low

- Float-panel Pro gate is client-only with nothing behind it (no data/cost
  exposure; document, don't treat as enforcement).
- `auth.protect({ unauthenticatedUrl })` may drop the return URL —
  consider `returnBackUrl` (unverified UX nit).
- `authorizedParties` plumbing exists but is opt-in and unset — set
  `CLERK_AUTHORIZED_PARTIES` after the custom-domain cutover.
- User profile sync is mutation-driven, not webhook-driven — fold
  `user.updated` into the Phase 3 webhook.
- CVE-2026-42349 (combined `has()`/`protect()` checks) — repo does not use
  the vulnerable shape; keep `@clerk/*` current.

### Spotted during the audit

`e2e/auth-protection.spec.ts:54` expects unsigned `/pricing` heading
"Practice free. **Sync** when you're ready." while the actual copy
(`components/pricing/pricing-page.tsx:51`) says "Practice free. **Pro**
when you're ready." — stale assertion (Phase 12).

---

## 4. Testing (Vitest 4 / RTL / convex-test / Playwright)

Sources: [convex-test docs](https://docs.convex.dev/testing/convex-test),
[Playwright best practices](https://playwright.dev/docs/best-practices),
[Playwright CI](https://playwright.dev/docs/ci),
[RTL common mistakes](https://testing-library.com/docs/guide-which-query).

**Verified strengths:** zero `page.waitForTimeout` in e2e; web-first
assertions throughout (182 `getBy*` vs 24 `page.locator`); correct
Playwright setup/teardown project pattern with fail-fast env validation;
convex-test usage matches the docs; sane CI defaults in
`playwright.config.ts:23-28`.

### Findings (highest impact first)

1. **No CI at all — HIGH, low effort.** No `.github/` directory; the
   AGENTS.md merge gate runs only if a human/agent remembers. (Phase 9.)
2. **`hooks/useChordDrill.ts` (942 lines) has zero tests — HIGH.** The
   flagship drill hook is untested while its peers all have suites.
   (Phase 10.)
3. **Convex tests run under jsdom instead of edge-runtime — MED-HIGH, low
   effort.** `vitest.config.ts:8` sets jsdom globally; convex-test docs
   recommend Vitest 4 `projects` with `edge-runtime` + `@edge-runtime/vm`.
   (Phase 9.)
4. **No coverage tooling — MED, low effort.** No `@vitest/coverage-v8`, no
   `test:coverage` script. (Phase 9.)
5. **Untested pure-logic lib files — MED.** `lib/audio-presets.ts` (371
   lines, preset ID validation), `lib/audio-upload.ts`, `lib/articles.ts`,
   `lib/tools.ts`, `lib/dev-tools.ts`; `lib/sequence-drill.ts` only covered
   indirectly. (Phase 10.)
6. **Hook coverage gaps — MED.** `useThemePreference`, `useWelcomeConfig`,
   `useLocalPracticeHistory` (the "post-login blank page" regression class);
   `useToolUserReady`, `useMusicPlayer`, `useHeroAtmosphereKind` only ever
   mocked; four identical drill-settings hooks (test one, cover the
   pattern). (Phase 10.)
7. **Convex function coverage gaps — MED.** `savedPatterns.ts` entirely
   untested; tracking/technique list queries beyond one happy path.
   (Phase 10.)
8. **E2E shared Clerk user is a flakiness risk — MED.** All authenticated
   specs sign in as one shared user under `fullyParallel: true`; safe today
   only because the user is Free. Teardown deletes the user but an
   interrupted run leaves data behind; setup never clears it. (Phase 12.)
9. **CI would test against `next dev`, not a production build — MED (once
   CI exists).** Playwright recommends `next build && next start` in CI.
10. **No `@testing-library/user-event`; 50+ raw `fireEvent` calls —
    LOW-MED.** Migrate incrementally.
11. **Brittle CSS selectors in E2E — LOW.**
    `[class*='recharts-wrapper']` (`tracking.authenticated.spec.ts:82`),
    `input[type='checkbox']` (`arpeggios.authenticated.spec.ts:29`),
    `aside nav` (`tools.spec.ts:40,64`, `theme.spec.ts:62`).
12. **Negative assertions that can't wait — LOW.** `toHaveCount(0)` passes
    immediately (`e2e/auth-assertions.ts:9-10`).
13. **Config polish — LOW.** Mobile via viewport instead of a device
    project; `globals: true` while every file imports explicitly; add
    `github` reporter when CI lands.

---

## 5. Audio / MIDI (smplr, Web Audio, Web MIDI)

Sources: [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay),
[A Tale of Two Clocks](https://web.dev/articles/audio-scheduling),
[MDN Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API),
[smplr README](https://github.com/danigb/smplr) (MIDI CC, CacheStorage).

### High impact (FIXED in Phase 2)

- **Autoplay policy: MIDI input is not user activation — audio could stay
  permanently silent.** `lib/audio-engine.ts:201-209` only resumed inside
  `play()`; notes scheduled at a frozen `currentTime` burst out on resume.
  Fixed: one-time gesture listener + skip-scheduling guard +
  `resumeFromUserGesture()`.
- **Song scheduling uses per-note `setTimeout` — drifts, throttles,
  doesn't scale.** `lib/music-player.ts:169-205` creates ~2 timers per note
  for the whole song; progress advances by `+0.016`/frame assuming 60fps
  (`hooks/useMusicPlayer.tsx:309-311`). Fix: lookahead scheduler against
  `ctx.currentTime` (smplr 1.0 ships `Sequencer`/`Scheduler`). (Phase 8.)
- **Race: async load continuation mutated a disposed engine** (FIXED in
  Phase 2) — disposed flag guards all post-`await` continuations.

### Medium impact

- **Metronome drifts** (`hooks/useAudio.ts:149-150`, `setInterval`).
  (Phase 8.)
- **MIDI: stuck held notes on disconnect (FIXED); permission denial
  misreported as unsupported (FIXED in Phase 2).**
- **Samples loaded eagerly even with sound off** (FIXED in Phase 2 —
  gated on `enabled || musicEnabled`).
- **IndexedDB transaction hygiene** (`lib/audio-storage.ts`): per-op
  connections never closed; resolves on `request.onsuccess` instead of
  `tx.oncomplete`; no `onblocked`. Effort: low.
- **Real sustain pedal (CC64) ignored** (`lib/midi-session.ts:143-175`
  drops everything except note-on/off). smplr supports `setCC(64, …)`.
  Effort: medium.

### Low impact

- Triplicated `getAudioContext` (`audio-engine.ts:50-66`,
  `useAudio.ts:27-45`, `useMusicPlayer.tsx:45-59` — same global key, safe
  to consolidate).
- Per-frame `new Float32Array(analyser.fftSize)` in pitch detection
  (`useMusicPlayer.tsx:279`).
- Silent partial sample-decode failures (`sample-map-kit.ts:119-124`).
- CacheStorage grows unbounded (`clearAudioCache()` exists;
  `audio-engine.ts:307-314`).
- `setTimeout` to disconnect oscillator nodes (`useAudio.ts:78-85`) —
  `osc.onended` is the deterministic hook.

---

## 6. Visualizations (three.js r171 + Canvas 2D)

Sources: [three.js manual — disposal](https://threejs.org/manual/#en/how-to-dispose-of-objects),
[responsive](https://threejs.org/manual/#en/responsive),
[rendering on demand](https://threejs.org/manual/#en/rendering-on-demand).

**Already correct (verified):** geometry/material/renderer disposed and RAF
cancelled on unmount in all three WebGL components; `devicePixelRatio`
capped everywhere; theme colors flow through `hooks/useThemeCssVars.ts`
(no hard-coded colors in render paths); `ResizeObserver` in Chladni and
Multigrid; renderer construction wrapped in try/catch.

### High

- **No off-screen pausing; ambient + lab visuals render simultaneously at
  60fps.** Root-mounted ambient background + lab visualization = 2 WebGL
  contexts + 2+ RAF loops; nothing uses IntersectionObserver. (Phase 5.)
- **60fps React state churn driving the multigrid ambient background.**
  `MultigridBackgroundInner` calls `setMorph` every frame
  (`multigrid-background.tsx:49-80`) → full `blendRecipes` +
  `buildMultigridScene` rebuild + repaint per frame. Same pattern (less
  expensive) in ambient Julia/Lissajous and `useChladniRipple.ts:101-119`
  (`setViz` every frame even with zero MIDI). (Phase 7.)

### Medium

- **No `renderer.forceContextLoss()` on unmount** (3 files). Browsers cap
  ~16 GL contexts; the Pro float panel mounts a second live context of the
  same effect. One line × 3 files. (Phase 5.)
- **Julia and Quasiperiodic only listen to `window` resize**; Lissajous
  re-reads `getBoundingClientRect()` every frame. Port the Chladni
  ResizeObserver pattern. (Phase 5.)

### Low

- Per-frame `CanvasGradient`/`rgba()` allocations in the Lissajous hot
  loop (`lissajous-visualization.tsx:196-226`); theme strings re-parsed
  every frame (`:145-158`).
- Idle RAF loops when auto-morph is off (all five labs).
- Namespace three imports + no shader-error fallback
  (`renderer.debug.onShaderError`).

---

## 7. AI chat (Vercel AI SDK v7)

Sources: [ai-sdk.dev chatbot guide](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot),
[useChat reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).
Verified against installed `ai@7.0.37` / `@ai-sdk/openai@4.0.20`
(`@ai-sdk/react` not yet installed).

**Sound (verified):** no key leakage (server-only env, zero
`NEXT_PUBLIC_*KIMI*`); auth gating correct and e2e-tested; markdown
rendering XSS-safe (no `rehype-raw`/`dangerouslySetInnerHTML` anywhere).

### Findings

1. **Hand-rolled fetch stream; error/abort fundamentally broken — HIGH.**
   `app/chat/page.tsx:48-105` + `toTextStreamResponse()` has no error
   channel: a mid-stream provider failure presents as a silent empty
   bubble. No Stop, no retry, no AbortController. Fix: `useChat` +
   `DefaultChatTransport` (or `TextStreamChatTransport` minimal step) +
   `createUIMessageStreamResponse` with `onError`. (Phase 4.)
2. **No `maxDuration` — HIGH on Vercel (FIXED in Phase 1).**
3. **Client could inject `system`-role messages; no input validation —
   MED (FIXED in Phase 1).** `convertToModelMessages` in Phase 4 makes it
   structural.
4. **No rate limiting — MED** (owner-only allowlist limits blast radius;
   tracked in `docs/missing-features-plan.md:297`).
5. **Citations invisible — LOW.** System prompt tells the model to cite
   sources (`route.ts:26`) but the UI renders raw text; use the existing
   react-markdown for assistant bubbles. (Phase 4.)
6. **No token-usage visibility — LOW** (falls out of the Phase 4 stream
   migration via `messageMetadata`).

---

## 8. Theming (Tailwind v4 + next-themes)

Sources: [Tailwind v4 theme docs](https://tailwindcss.com/docs/theme) +
project's own DESIGN-PRINCIPLES.md / AGENTS.md conventions.

**Already correct (verified):** `@theme inline` usage is textbook for
runtime-swappable tokens; ThemeProvider wiring matches the AGENTS.md rule
(`themes={[...themeIds]}`); recharts is ~fully token-driven;
`components/ui/*` consistent; custom CSS uses `color-mix(in oklab, …)`.

### Findings (prioritized)

1. **Undefined token `--color-bg-page` — MED, trivial.**
   `components/tracking/tracking-chart.tsx:66,78` uses
   `var(--color-bg-page, #0c0a08)`; the token doesn't exist anywhere, so
   the hard-coded fallback always wins. Fix: `var(--color-background)`.
   (Phase 12.)
2. **Duplicated `.amber` block + repeated RGB triplets — MED
   (maintainability).** `app/globals.css:108-127` is a verbatim copy of
   `:root`; each preset repeats its RGB triplet 8×. v4-idiomatic fix:
   derive via `color-mix`. (Phase 12.)
3. **One-off palette utilities in branded drill UI — LOW-MED.**
   `arpeggios.tsx:506-508` and `chord-drill.tsx:727-729` use
   `bg-blue-500/10`/`text-orange-500`/`text-green-500` deck badges — the
   exact AGENTS.md anti-pattern, duplicated across both files. Extract a
   shared badge + semantic tokens. (Phase 12.)
4. **Dead dark-mode plumbing — LOW.** `@custom-variant dark`
   (`globals.css:6`) + `dark:` classes (`button.tsx:7,13,17,19`) can never
   activate (`enableSystem={false}`, no `.dark` theme).
5. **Fixed `text-white`/`text-black` on themed grade pills — LOW**
   (`arpeggios.tsx:20-22`, `chord-drill.tsx:27-29`).
6. **Hard-coded hex in `app/global-error.tsx:18,28` — LOW** (arguably
   deliberate since ThemeProvider is unmounted; document or import tokens).
7. **Canvas-viz fallback hexes duplicated across 4 files — LOW.** Extract
   `lib/theme-fallbacks.ts`.
8. **Optional v4 polish — LOW.** Promote `--primary-glow`/`--hero-*` into
   `@theme` for real utilities; `@utility` for `.hero-glow` etc.

---

## Consolidated priority list

### P0 — Security, revenue, correctness

1. ~~`AUTH_DISABLED` bypass opens production + paid chat endpoint~~ —
   **FIXED (Phase 1, PR #39).**
2. Pro gating may be silently dead in production (`pla`/`fea` verification +
   webhook mirror) — Phase 3.
3. ~~Audio autoplay: MIDI is not user activation~~ — **FIXED (Phase 2).**
4. ~~Async kit-load race mutates disposed engine~~ — **FIXED (Phase 2).**
5. Chat silent-empty-bubble on mid-stream failure; `useChat` migration —
   Phase 4 (`maxDuration` + input caps already fixed in Phase 1).

### P1 — High-impact performance

6. three.js statically bundled into public routes — Phase 5.
7. Unbounded `.collect()` on event tables — Phase 6.
8. 60fps React state churn (multigrid morph, ripple `setViz`, music-player
   progress context) — Phase 7.
9. No off-screen pausing (dual WebGL contexts at all times) — Phase 5.
10. Per-note `setTimeout` song scheduling + drifting metronome — Phase 8.

### P2 — Medium

11. No CI — Phase 9.
12. Metadata/SEO + articles-public decision — Phase 11.
13. MIDI hygiene (stuck notes FIXED; CC64 sustain pedal open) — Phase 2/12.
14. Convex `returns` validators, unused indexes, table-name args, eslint
    plugin — Phase 6.
15. Test coverage gaps (`useChordDrill`, `audio-presets`, persistence
    hooks, edge-runtime split, coverage tooling) — Phases 9–10.
16. Eager sample loading (FIXED) + IndexedDB hygiene — Phase 2/12.
17. `/api` blanket-public + prefix matching — FIXED (Phase 1, rule
    documented).
18. `forceContextLoss` + ResizeObserver ports — Phase 5.

### P3 — Low / cleanup

- `--color-bg-page` undefined-token bug; theming dedup (`.amber` block,
  deck badges, dead dark mode, global-error hex, theme-fallbacks module).
- E2E: stale pricing assertion (`auth-protection.spec.ts:54`), brittle
  selectors, shared-user isolation, device project.
- Convex nits: redundant `db.get`, N+1 import, `.filter()` in clears,
  `v.string()` unions, savedPatterns Pro gate, thin tests.
- Audio nits: triplicated `getAudioContext`, per-frame `Float32Array`,
  silent decode failures, unbounded CacheStorage.
- Chat nits: markdown rendering for citations, rate limiting, usage
  metadata.
- React nits: localStorage lazy-init hydration, full-MIDI-snapshot
  subscription, dead dashboard UI, tool-page data waterfall.
