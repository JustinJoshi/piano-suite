# Piano Suite

A modern, full-stack platform for piano practice, music theory learning, and AI-assisted instruction.

## Purpose

Piano Suite is the next iteration of the Reflex Drill EXT practice tools. The original project was a collection of standalone HTML pages for targeted piano drills—chord recognition, progression fluency, and technique tracking. This repo re-architects those tools into a scalable, cloud-connected application where learners can practice, read articles, chat with an AI music tutor, and track progress across devices.

The goal is to give piano players a single place to:

- **Practice interactively** with Web MIDI and Web Audio drills.
- **Learn music theory** through articles and guided explainers.
- **Get personalized help** from an AI chatbot trained on the site’s own content.
- **Track progress** with saved history, settings, and stats tied to their account.
- **Sync across devices** instead of losing data to browser wipes.

## What it is

This repository now contains:

- A **Next.js 16+ App Router** application with TypeScript.
- A **Lunar.dev-inspired landing page** that ports the original Reflex Drill EXT welcome content into a polished, modern marketing layout, with a fixed full-viewport soft Three.js atmosphere (Chladni by default) behind sparse hero copy and floating feature cards, theme-aware scrims, and resonant modes that morph slowly with the active theme. Pattern Lab can **Apply to home** / **Reset home** to customize that atmosphere (localStorage + Convex when signed in). Atmosphere settings at `/settings/atmosphere` can also switch the Welcome background to MIDI Ripple, Julia, or Lissajous.
- An **Articles section** (`/articles`) with a listing page and statically generated article pages (`/articles/[slug]`). Articles are authored in Markdown with YAML frontmatter, rendered with `react-markdown`, and styled with reusable Tailwind utility classes. The shared site navbar is included on article pages so readers can navigate back to the home page and other sections at any time. A floating chat bubble on article pages links directly to the Practice Assistant so readers can ask questions about the content.
- A **Vercel-dashboard-inspired Tools hub** (`/tools`) with a sidebar navigation drawn from the original Reflex Drill EXT tabs (fixed on desktop; off-canvas drawer with menu control on mobile).
- A migrated **Chord Drill** (`/tools/chord-drill`) ported from Reflex Drill EXT, including Single Shape / Family Cycle / Extended Family modes, root/quality selection, reps, per-chord rep overrides, Anki Sync with auto-timer and auto-grade, break-before-grading, and personal-best stats persisted via Convex.
- A migrated **Arpeggios** (`/tools/arpeggios`) ported from Reflex Drill EXT, including the 12 minor-11th cells with left-hand pedal and right-hand sequence drilling, per-transition timing, miss logging, sequence customization, lap chimes, and Anki Sync that maps any card root to the matching minor-11th arpeggio and auto-grades by misses.
- A migrated **Progression** (`/tools/progression`) ported from Reflex Drill EXT, including ii-V-I and 12-bar blues drills in C/G/D/A/E, per-chord transition timing, auto-looping, step and loop chimes, optional Anki card flip on loop completion, and personal-best stats persisted via Convex.
- A migrated **Root Cycling** (`/tools/root-cycling`) ported from Reflex Drill EXT, including chord mode with any quality and arpeggio mode with the canonical minor-11th shape, customizable root pools, per-attempt timing, and tracking aggregated by fixed idea across random keys.
- A migrated **Technique habit tracker** (`/tools/technique`) ported from Reflex Drill EXT, including a built-in metronome, BPM logging, streak counter, 28-day practice grid, and a one-time import from the original `technique-habit-log-v1` localStorage key.
- A **Chladni Pattern Lab** (`/tools/chladni`) — a public interactive square-plate waveform explorer for the landing-page hero shader, with live controls for modes, morph speed, line thickness, zoom, and secondary-wave blending. **Apply to home** copies the full Lab pattern onto the welcome hero; you can also set a pattern color and hero-scrim shade, or **Reset home** to the soft shipping defaults. Preferences persist in `localStorage` and sync to Convex when signed in (no account required to explore or apply locally).
- A **Chladni Ripple** tool (`/tools/chladni-ripple`) — drives the Chladni visualization from live MIDI: pitch class → mode identity, octave → denser patterns, velocity → decaying intensity pulse, chords → secondary blend. Separate from the parameter explorer; Ambient actions can set Ripple as a Welcome / app-wide background or open a float panel.
- A **Julia Set Lab** (`/tools/julia`) — an interactive escape-time Julia set explorer with curated complex-parameter presets, morph between two `c` values, zoom, iterations, escape radius, and theme-aware coloring.
- A **Lissajous Harmonic Lab** (`/tools/lissajous`) — an interactive frequency-ratio curve explorer with musical interval presets, phase/morph controls, and theme-aware Canvas trails.
- A **Quasiperiodic Pattern Lab** (`/tools/quasiperiodic`) — an interactive N-fold plane-wave interference explorer with morphing recipes, zoom, and soft nodal contours. **Apply to home** switches the welcome atmosphere to the quasiperiodic field (Chladni Apply switches it back); pattern color and hero-scrim shade persist in `localStorage` and sync to Convex when signed in.
- **Atmosphere settings** (`/settings/atmosphere`) — assign any shipped visualization (Chladni, Quasiperiodic, MIDI Ripple, Julia, Lissajous) as a full-page background per route, apply a default everywhere, and optionally show a draggable / resizable float panel of the same effects. Preferences persist in `localStorage` and sync to Convex when signed in.
- A migrated **Tracking dashboard** (`/tools/tracking`) ported from Reflex Drill EXT, including:
  - Chord Drill first-chord timing history
  - Arpeggio transition and miss logging
  - Root Cycling recall stats
  - Recharts visualizations with grade colors, redo indicators, and good/hard threshold lines
  - A one-time client-side migration from Reflex Drill EXT via exported JSON file (localStorage is not shared across origins)
- **Clerk authentication** with route protection via `proxy.ts` and shadcn-themed sign-in/sign-up pages. See [Authentication & routes](#authentication--routes) for the public-route list and the `NEXT_PUBLIC_AUTH_DISABLED` bypass.
- **Convex data persistence** for users and tracking events, with Clerk JWT integration.
- An **AI chat assistant** (`/chat`) powered by the Kimi Code API, grounded in the site's articles, and restricted to a single owner Clerk user (the allowlist is skipped when the auth bypass is on).
- **Playwright end-to-end tests**, including auth-protection and chat-gate specs plus authenticated flows for every drill, the Tools hub, and the Tracking dashboard.
- The original Anki deck exports (`chord-symbols-CGDAE.txt` and `chord-symbols-CGDAEno11.txt`) preserved for download.

A shared **primitive layer** has been extracted from the original Reflex Drill EXT code to make the upcoming migrations consistent and testable:

- `lib/music-theory.ts` — pitch classes, chord parsing, quality definitions
- `lib/scoring.ts` — comparing held MIDI notes to target chords and sequences
- `lib/chord-drill.ts` — pure chord-drill helpers (grading, rep targets, history)
- `lib/sequence-drill.ts` — generic two-phase sequence-drill primitives (LH pedal + RH sequence)
- `lib/arpeggios.ts` — the 12 minor-11th arpeggio cells and persisted settings schema
- `lib/progression.ts` — ii-V-I and 12-bar blues progression builders, history reducer, and settings schema
- `lib/root-cycling.ts` — random-root picker, canonical minor-11th shape, and settings schema
- `lib/chladni.ts` — square-plate Chladni math and color helpers for the hero shader
- `lib/chladni-hero-settings.ts` — serializable home-hero Chladni appearance (Apply / Reset from Pattern Lab)
- `lib/chladni-ripple.ts` — MIDI pitch/octave/velocity → Chladni mode and intensity mapping
- `lib/articles.ts` — Markdown article parsing, frontmatter handling, and listing helpers
- `lib/anki.ts` — typed AnkiConnect client
- `lib/themes.ts` — theme registry and helpers for the theming system
- `lib/julia.ts` — Julia-set escape-time math, curated presets, and complex helpers
- `lib/lissajous.ts` — Lissajous parametric math, interval presets, and ratio helpers
- `lib/quasiperiodic.ts` — N-fold quasiperiodic wave field math, presets, and helpers
- `lib/quasiperiodic-hero-settings.ts` — serializable home-hero Quasiperiodic appearance
- `lib/hero-atmosphere.ts` — which math visual drives the welcome hero (`chladni` | `quasiperiodic`)
- `lib/ambient-effects.ts` — per-route ambient backgrounds + float panel settings, route resolution, soft viz defaults
- `lib/midi-session.ts` — tab-scoped Web MIDI session (connect once, stay connected across tools)
- `hooks/useMidi.ts` — React subscription to the MIDI session; note-on events include velocity
- `hooks/useChladniRipple.ts` — decaying MIDI impulses → Chladni visualization props
- `hooks/useAudio.ts` — Web Audio chimes, ticks, and metronome
- `hooks/useDrillTimer.ts` — generic drill timer state machine (single- or multi-rep)
- `hooks/useAnkiSync.ts` — polling Anki for the current review card
- `hooks/useChordDrill.ts` — composed chord-drill engine
- `hooks/useArpeggios.ts` — composed minor-11th arpeggio engine
- `hooks/useProgression.ts` — composed looping progression engine
- `hooks/useRootCycling.ts` — composed random-root chord/arpeggio engine
- `hooks/useThemePreference.ts` — active theme state, localStorage, and Convex sync
- `hooks/useHeroChladniSettings.ts` — home Chladni appearance (localStorage + Convex)
- `hooks/useHeroQuasiperiodicSettings.ts` — home Quasiperiodic appearance (localStorage + Convex)
- `hooks/useHeroMultigridSettings.ts` — home Multigrid appearance (localStorage + Convex)
- `hooks/useHeroAtmosphereKind.ts` — welcome hero visual kind (localStorage + Convex)
- `hooks/useAmbientEffects.ts` — ambient backgrounds + float panel (provider + hook; localStorage + Convex)
- `convex/settings.ts` — generic per-user settings persistence
- `convex/lib/auth.ts` — `optionalUserId` / `ensureUserId` / `requireUserId` for Convex auth
- `lib/auth-disabled.ts` — opt-in `isAuthDisabled()` bypass check
- `lib/clerk-authorized-parties.ts` — parse `CLERK_AUTHORIZED_PARTIES` for middleware `authorizedParties`
- `lib/chat-auth.ts` — `authorizeChatAccess` owner-allowlist decisions for `/api/chat`
- `hooks/useAuthAccess.ts` — `canAccess` / `canPersist` gate for tool pages and drills
- `hooks/useToolUserReady.ts` — waits for the Convex user row before a tool renders
- `components/ensure-signed-in-user.tsx` — creates the Convex user row on sign-in
- `components/drills/drill-shell.tsx` — shared layout wrapper for tool pages
- `components/drills/midi-connection-bar.tsx` — reusable MIDI input bar
- `components/theme-provider.tsx` — `next-themes` wrapper

## Theming

Piano Suite has a token-driven theming system. Colors are defined as CSS custom properties in `app/globals.css` and exposed as Tailwind utilities (`bg-primary`, `text-primary`, `ring-primary`, etc.). A built-in theme picker lives at `/settings/theme` and lets users switch between presets (Amber, Rose, Emerald, Ocean, Violet, Slate). The choice is saved to `localStorage` and synced to Convex for signed-in users.

When adding new UI, use the theme tokens instead of hard-coded colors. See `AGENTS.md` for the full theming conventions and `DESIGN-PRINCIPLES.md` for the broader visual design system.

A `/tools/midi-test` page is included for manually verifying MIDI input and audio output during development. After you connect MIDI once in a tab, the session stays connected across tool pages for that tab (and silently restores after a reload via `sessionStorage`).

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Convex |
| AI / Chat | Vercel AI SDK |
| Charts | Recharts |
| E2E Tests | Playwright + @clerk/testing |
| Icons | Lucide React |
| Fonts | Inter, Fraunces, Geist Mono |

## Authentication & routes

Clerk owns identity, Convex owns per-user data, and the two are joined by a Clerk JWT template named `convex`.

### Route protection

`proxy.ts` (the Next.js 16 proxy convention — there is no `middleware.ts`) wraps Clerk's `clerkMiddleware`. Anything not on the public list calls `auth.protect({ unauthenticatedUrl })`, which sends signed-out visitors to `/sign-in`. Passing `unauthenticatedUrl` explicitly matters: without it, Clerk **development** keys can rewrite an unsigned document request to a bare 404 instead of a redirect.

| Route | Public when auth is on? |
|-------|--------------------------|
| `/` | Yes |
| `/tools/chladni` (Pattern Lab) | Yes — edits the public welcome hero |
| `/sign-in/*`, `/sign-up/*` | Yes |
| `/api/*` | Yes at the proxy; each handler authenticates itself |
| `/__clerk/*` | Yes — Clerk frontend API |
| `/tools`, all other `/tools/*` | No |
| `/articles`, `/articles/*` | No |
| `/chat`, `/settings/*` | No |

### The `NEXT_PUBLIC_AUTH_DISABLED` bypass

Setting `NEXT_PUBLIC_AUTH_DISABLED=true` makes the proxy skip protection for **every** route, and makes `/api/chat` skip both the sign-in check and the `ALLOWED_CLERK_USER_ID` allowlist. Treat it as a temporary escape hatch, not a supported mode.

- It is **opt-in only**: `isAuthDisabled()` is true only for the exact string `"true"`. Unset, `"false"`, and `"1"` all leave auth enabled.
- It is a `NEXT_PUBLIC_*` variable, so the value is **baked in at build time** — restart `npm run dev` locally, or redeploy on Vercel.
- Convex persistence always requires a real Clerk session, so unsigned use stays local-only even with the bypass on.

### Client gates

`hooks/useAuthAccess.ts` splits two different questions:

| Flag | Meaning |
|------|---------|
| `canAccess` | May the tool UI render? True when signed in **or** when the bypass is on |
| `canPersist` | May we talk to Convex with a real identity? Signed in only |

`hooks/useToolUserReady.ts` additionally waits for the Convex `users` row on tool pages, and `components/ensure-signed-in-user.tsx` (mounted inside `ConvexClientProvider`) creates that row as soon as Clerk reports a session, so homepage theme and atmosphere queries do not race it.

### Convex query contract

Convex helpers live in `convex/lib/auth.ts`:

| Helper | Use |
|--------|-----|
| `optionalUserId(ctx)` | **Queries.** Returns `null` when there is no identity or no `users` row |
| `ensureUserId(ctx)` | **Mutations.** Creates the `users` row on first write and keeps Clerk profile fields in sync |
| `requireUserId(ctx)` | Mutations that must fail loudly rather than create a row |

Queries must never throw for a signed-in user whose row does not exist yet. `settings.getSetting` returns `null` and the `tracking` / `technique` list queries return `[]`. This matters because `AmbientEffectsProvider` and the theme hooks query Convex from the root layout — a thrown error there takes down the whole React tree. `app/error.tsx` and `app/global-error.tsx` are the backstop if something does throw.

## Getting Started

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in real credentials. `.env.example` documents every variable the app reads; the required ones are:

   | Variable | Where it comes from |
   |----------|---------------------|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk](https://dashboard.clerk.com) → API keys |
   | `CLERK_SECRET_KEY` | Clerk → API keys |
   | `CLERK_FRONTEND_API_URL` | e.g. `https://<your-app>.clerk.accounts.dev` |
   | `NEXT_PUBLIC_CONVEX_URL` | printed by `npx convex dev` |
   | `KIMI_CODE_API_KEY` / `KIMI_CODE_BASE_URL` / `KIMI_CODE_MODEL` | [Kimi Code Console](https://www.kimi.com/code/console) |
   | `ALLOWED_CLERK_USER_ID` | the one Clerk user id allowed to use `/chat` |

   Optional:

   | Variable | Purpose |
   |----------|---------|
   | `NEXT_PUBLIC_ANKI_CONNECT_URL` | AnkiConnect endpoint; defaults to `http://127.0.0.1:8765` |
   | `NEXT_PUBLIC_AUTH_DISABLED` | `true` opens **every** route without signing in, including `/chat`. Convex saves still need a session. Restart `npm run dev` after changing it — see [the bypass notes](#the-next_public_auth_disabled-bypass) |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `_SIGN_UP_URL` / `_FALLBACK_REDIRECT_URL` | Clerk redirect overrides |
   | `CLERK_AUTHORIZED_PARTIES` | Optional comma-separated origins for `clerkMiddleware` `authorizedParties` (recommended on Production after custom-domain cutover; see [`docs/phase-a-auth-cutover-plan.md`](docs/phase-a-auth-cutover-plan.md)) |
   | `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD` | Playwright test user (required to run E2E; password ≥ 8 chars) |
   | `E2E_ALLOW_AUTH_DISABLED` | skips the E2E guard that refuses to run with the bypass on |

3. Configure Clerk authentication for email and password only:

   - In the Clerk Dashboard, go to **User & Authentication → Email, Phone, Username**.
   - Set **Email address** to **Required**.
   - Set **Phone number** to **Optional** or **Disabled**.
   - Under **Authentication strategies**, enable **Password**.

4. Make sure your Clerk app has a JWT template named `convex` with `aud: "convex"` so Convex can validate Clerk sessions. The template can be created in the Clerk Dashboard under **Sessions → JWT Templates** or via the Clerk Backend API.

5. Install dependencies:

   ```bash
   npm install
   ```

6. Start the Convex dev server:

   ```bash
   npx convex dev
   ```

7. In another terminal, run the Next.js development server:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel Hobby)

Production hosting is **Vercel Hobby** + **Convex Free** + **Clerk development** keys (fine for personal `*.vercel.app` use). Live site: [https://piano-suite.vercel.app](https://piano-suite.vercel.app).

### One-time setup

1. Create a Convex **cloud** project and production deployment (`npx convex deployment create … --type prod --default`), then deploy functions with a production deploy key (`CONVEX_DEPLOY_KEY`).
2. On the Convex **production** deployment, set `CLERK_FRONTEND_API_URL` to the same Clerk Frontend API URL used locally (e.g. `https://<app>.clerk.accounts.dev`).
3. In Vercel, create/import the project and set the **Build Command** to:

   ```bash
   npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'
   ```

4. Add these environment variables in Vercel for **Production** and **Preview** (same values for both, except `CONVEX_DEPLOY_KEY` — see below):

   | Variable | Notes |
   |----------|--------|
   | `CONVEX_DEPLOY_KEY` | **Separate values per target** (required) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk **dev** publishable key |
   | `CLERK_SECRET_KEY` | Clerk **dev** secret |
   | `CLERK_FRONTEND_API_URL` | Clerk Frontend API URL |
   | `KIMI_CODE_API_KEY` / `KIMI_CODE_BASE_URL` / `KIMI_CODE_MODEL` | Same as local |
   | `ALLOWED_CLERK_USER_ID` | Your Clerk user id for `/chat` |
   | `NEXT_PUBLIC_ANKI_CONNECT_URL` | Optional; only if AnkiConnect is not on the default port |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
   | `NEXT_PUBLIC_CLERK_*_FALLBACK_REDIRECT_URL` | `/` |
   | `NEXT_PUBLIC_AUTH_DISABLED` | `true` on Production/Preview for now (see Notes) |

   `NEXT_PUBLIC_CONVEX_URL` is injected at build time by `npx convex deploy`.

   Because `NEXT_PUBLIC_*` vars are baked at build time, change this flag and **redeploy** (a new Production build) before expecting Tools/Articles to open without Clerk.

   **`CONVEX_DEPLOY_KEY` must be split by environment.** Convex rejects a production deploy key on Vercel Preview builds:

   | Vercel target | Key type |
   |---------------|----------|
   | Production | Production deploy key from the Convex **production** deployment (`deployment:deploy`) |
   | Preview | A non-production Convex deploy key (project **Preview Deploy Key** from Convex project settings, or a deploy key for a shared preview deployment). Do not reuse the production key. |

   **Convex Preview deployments are empty and need Clerk config.** Each Vercel Preview build deploys to a fresh Convex preview deployment. In the Convex dashboard → **Project Settings → Preview deployments**, set default environment variables for preview deployments — at minimum:

   | Variable | Notes |
   |----------|--------|
   | `CLERK_FRONTEND_API_URL` | Same Clerk Frontend API URL as production/dev (required for signed-in Convex queries) |

   Without `CLERK_FRONTEND_API_URL` on preview deployments, Clerk sign-in succeeds in the browser while Convex rejects the JWT. Queries return `null` / `[]` rather than throwing (see [Convex query contract](#convex-query-contract)), so the app still renders — but nothing syncs remotely until the variable is set.

   Clerk / Kimi / allowlist vars should be enabled for **Preview** as well so PR preview URLs actually run.

5. In Clerk (development instance):
   - Ensure a JWT template named `convex` with `aud: "convex"`.
   - Set instance `allowed_origins` to include `https://piano-suite.vercel.app` (and `http://localhost:3000`).
   - Add redirect URLs for `https://piano-suite.vercel.app` (and `/sign-in`, `/sign-up`, `/tools`, `/chat` as needed).

6. Deploy with `vercel deploy --prod` (or connect the GitHub repo in the Vercel dashboard for push-to-deploy). PR branches get automatic Preview deployments once the GitHub app is installed and Preview env vars are set.

### Notes

- Hobby is for non-commercial use.
- **Temporary auth bypass:** Production and Preview currently set `NEXT_PUBLIC_AUTH_DISABLED=true`. Clerk **development** keys on `*.vercel.app` make `auth.protect()` rewrite unsigned (and some post-login) hits to a bare **404** when the Clerk `dev-browser` handshake is missing — Firefox Enhanced Tracking Protection often triggers this. The bypass opens Tools/Articles without that middleware 404; Convex saves still require a real Clerk session. Longer-term: attach a **custom domain** and switch to Clerk **production** keys (`pk_live`), then remove the bypass and redeploy.
- GitHub auto-connect may require installing the Vercel GitHub app on the repo; CLI deploys work without it.
- After opening a PR, use the Vercel **Visit Preview** link (agents should print it and open it once — see `AGENTS.md`).

### Auth cutover checklist (remove bypass)

Full step-by-step (Clerk + Convex production research): [`docs/phase-a-auth-cutover-plan.md`](docs/phase-a-auth-cutover-plan.md).

When a custom domain + Clerk **production** instance are ready:

1. Point the domain at Vercel; configure Clerk production Domains DNS + deploy certificates; re-activate the Convex JWT integration on the **production** instance (`aud: "convex"`).
2. Set Vercel **Production** to `pk_live` / `sk_live`. Keep Vercel **Preview** on `pk_test` / `sk_test` (Clerk’s recommended split — do not put live keys on Preview).
3. On Convex **production**, set `CLERK_FRONTEND_API_URL` to the production Frontend API URL (`https://clerk.<your-domain>.com`). Keep Convex **preview defaults** on the development Frontend API URL.
4. **Unset** `NEXT_PUBLIC_AUTH_DISABLED` on Production and Preview and **redeploy** (Preview first, then Production).
5. Create your production Clerk user and update Production `ALLOWED_CLERK_USER_ID` if chat should work.
6. Optionally set Production `CLERK_AUTHORIZED_PARTIES` to your custom-domain origins (and localhost if needed), then redeploy.
7. Verify with the auth suite below (local with bypass off) plus the production smoke checklist.

## Testing

Unit tests run with Vitest and React Testing Library. `vitest.config.ts` collects specs from `lib/`, `hooks/`, `components/`, and `convex/`:

| Location | Covers |
|----------|--------|
| `lib/**/*.test.ts` | Primitive layer — music theory, scoring, Anki client, auth bypass, chat allowlist |
| `hooks/**/*.test.ts` | Hook behavior via React Testing Library |
| `components/**/*.test.tsx` | Component rendering |
| `convex/**/*.test.ts` | Convex functions via [`convex-test`](https://docs.convex.dev/testing/convex-test), which runs schema and queries in-memory with `t.withIdentity()` for fake Clerk sessions |

```bash
# Run unit tests in watch mode
npm run test:unit

# Run unit tests once
npm run test:unit:run

# Auth bypass, chat allowlist, and Convex auth-resilience tests
npm run test:unit:run -- lib/__tests__/auth-disabled.test.ts lib/__tests__/chat-auth.test.ts convex/__tests__/settings-auth.test.ts
```

`convex/__tests__/settings-auth.test.ts` is the regression guard for the post-login crash: it asserts `getSetting` returns `null` (rather than throwing) with no identity and with a signed-in user who has no `users` row yet, and that `setSetting` creates the row on first write.

End-to-end tests run with Playwright. A deterministic test user is created automatically during global setup.

Make sure the **Convex dev server is running** before starting tests, because the authenticated tracking tests hit the local Convex backend.

**Auth verification e2e** requires `NEXT_PUBLIC_AUTH_DISABLED` to be **unset** (not `true`), because these specs assert real Clerk gating. Global setup fails fast if the bypass is on unless `E2E_ALLOW_AUTH_DISABLED=true`.

| Spec | Asserts |
|------|---------|
| `e2e/auth-protection.spec.ts` | Every protected route redirects to `/sign-in`; `/` and `/tools/chladni` stay public; signed-in `/tools`, homepage, and a tracking deep link render without a crash |
| `e2e/chat-auth.spec.ts` | `POST /api/chat` without a session returns 401 |
| `e2e/auth-assertions.ts` | Shared helpers — `expectRedirectedToSignIn`, `expectNotBare404`, `expectNoApplicationError`, and the bypass guard |

```bash
# Terminal 1: start Convex
npx convex dev

# Terminal 2: run tests (bypass must be off)
npm run test:e2e

# Auth protection + chat gate only
npx playwright test e2e/auth-protection.spec.ts e2e/chat-auth.spec.ts

# Run with a single worker (useful for debugging)
npx playwright test --workers=1
```

### Production auth smoke (after cutover)

On the **custom domain** (not only `*.vercel.app`):

1. Incognito: `/tools` → redirect to sign-in (not a bare 404).
2. Sign in → `/tools` and a drill page load.
3. Firefox (default ETP): same as (1)–(2).
4. Unsigned `/` and `/tools/chladni` still work.
5. Confirm Vercel Production does **not** have `NEXT_PUBLIC_AUTH_DISABLED=true`.

Test credentials are stored in `.env.local` as `E2E_CLERK_USER_EMAIL` and `E2E_CLERK_USER_PASSWORD`.

## Migrating from Reflex Drill EXT

Because browser `localStorage` is scoped to each origin, the Piano Suite app cannot directly read the tracking data stored by Reflex Drill EXT (which runs on a different port or `file://` origin). Instead, use the export/import flow:

1. Open the original **Reflex Drill EXT** app and switch to the **Tracking** tab.
2. Click **Export tracking data** and save `reflex-drill-tracking-export.json`.
3. Open Piano Suite, sign in, and go to **Tools → Tracking**.
4. Drag the exported file onto the import area, or click **Choose file**.
5. Review the import report, then explore your Chord Drill, Arpeggios, and Root Cycling history.

## Taskbar launcher

A desktop launcher is included so you can start the dev server from your taskbar or app menu:

- Launcher script: `launch.sh` in the repo root (it resolves the project directory from its own location, so any clone path works)
- Desktop entry: `~/.local/share/applications/piano-suite.desktop` — point its `Exec` at your clone's `launch.sh`

Clicking the icon will:

1. Kill any existing dev server already running on port 3000.
2. Start a fresh `npm run dev` instance in the background.
3. Open the app in your default browser once the server is reachable.

To add the launcher to your taskbar:

- **GNOME / Ubuntu**: Open the Activities overview, search for "Piano Suite", right-click the icon, and select **Add to Favorites**.
- **KDE Plasma**: Open the app menu, search for "Piano Suite", right-click, and choose **Add to Panel / Task Manager**.
- **XFCE**: Right-click the panel → **Panel** → **Add New Items** → **Launcher**, then add Piano Suite from the applications list.

If the icon does not appear in the app menu immediately after creation, log out and log back in once to refresh the desktop database.

## Build

```bash
npm run build
```

## Roadmap

- [x] Scaffold Next.js + Tailwind + shadcn/ui
- [x] Port welcome-page content with Lunar-style layout
- [x] Add Clerk authentication and route protection
- [x] Add Convex data persistence and user sync
- [x] Add Vercel AI SDK streaming chat route
- [x] Add Vercel-dashboard-style Tools hub with sidebar
- [x] Port Reflex Drill EXT Tracking tab with Recharts visualizations
- [x] Add one-time migration from Reflex Drill EXT tracking data
- [x] Add Playwright E2E tests with authenticated flows
- [x] Migrate Chord Drill interactive page
- [x] Migrate Arpeggios interactive page
- [x] Migrate Progression interactive page
- [x] Migrate Root Cycling interactive page
- [x] Migrate Technique habit tracker
- [x] Add article pages under `/articles/[slug]`
- [x] Add token-driven theming system with `/settings/theme`
- [x] Implement real LLM chat grounded on articles (Kimi Code API, owner-only access)

### Post-v1 follow-ons

The checklist above is the original product scope and is complete. Remaining work
is planned in [`docs/missing-features-plan.md`](docs/missing-features-plan.md).
Phase A (production auth cutover) detail:
[`docs/phase-a-auth-cutover-plan.md`](docs/phase-a-auth-cutover-plan.md).

## License

MIT
