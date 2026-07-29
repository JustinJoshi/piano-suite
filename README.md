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
- A **Lunar.dev-inspired landing page** that ports the original Reflex Drill EXT welcome content into a polished, modern marketing layout, with a fixed full-viewport soft Three.js Chladni atmosphere behind sparse hero copy and floating feature cards, theme-aware scrims, and resonant modes that morph slowly with the active theme. Pattern Lab can **Apply to home** / **Reset home** to customize that atmosphere (localStorage + Convex when signed in).
- An **Articles section** (`/articles`) with a listing page and statically generated article pages (`/articles/[slug]`). Articles are authored in Markdown with YAML frontmatter, rendered with `react-markdown`, and styled with reusable Tailwind utility classes. The shared site navbar is included on article pages so readers can navigate back to the home page and other sections at any time. A floating chat bubble on article pages links directly to the Practice Assistant so readers can ask questions about the content.
- A **Vercel-dashboard-inspired Tools hub** (`/tools`) with a sidebar navigation drawn from the original Reflex Drill EXT tabs.
- A migrated **Chord Drill** (`/tools/chord-drill`) ported from Reflex Drill EXT, including Single Shape / Family Cycle / Extended Family modes, root/quality selection, reps, per-chord rep overrides, Anki Sync with auto-timer and auto-grade, break-before-grading, and personal-best stats persisted via Convex.
- A migrated **Arpeggios** (`/tools/arpeggios`) ported from Reflex Drill EXT, including the 12 minor-11th cells with left-hand pedal and right-hand sequence drilling, per-transition timing, miss logging, sequence customization, lap chimes, and Anki Sync that maps any card root to the matching minor-11th arpeggio and auto-grades by misses.
- A migrated **Progression** (`/tools/progression`) ported from Reflex Drill EXT, including ii-V-I and 12-bar blues drills in C/G/D/A/E, per-chord transition timing, auto-looping, step and loop chimes, optional Anki card flip on loop completion, and personal-best stats persisted via Convex.
- A migrated **Root Cycling** (`/tools/root-cycling`) ported from Reflex Drill EXT, including chord mode with any quality and arpeggio mode with the canonical minor-11th shape, customizable root pools, per-attempt timing, and tracking aggregated by fixed idea across random keys.
- A migrated **Technique habit tracker** (`/tools/technique`) ported from Reflex Drill EXT, including a built-in metronome, BPM logging, streak counter, 28-day practice grid, and a one-time import from the original `technique-habit-log-v1` localStorage key.
- A **Chladni Pattern Lab** (`/tools/chladni`) — a public interactive square-plate waveform explorer for the landing-page hero shader, with live controls for modes, morph speed, line thickness, zoom, and secondary-wave blending. **Apply to home** copies the full Lab pattern onto the welcome hero; you can also set a pattern color and hero-scrim shade, or **Reset home** to the soft shipping defaults. Preferences persist in `localStorage` and sync to Convex when signed in (no account required to explore or apply locally).
- A **Julia Set Lab** (`/tools/julia`) — an interactive escape-time Julia set explorer with curated complex-parameter presets, morph between two `c` values, zoom, iterations, escape radius, and theme-aware coloring.
- A **Lissajous Harmonic Lab** (`/tools/lissajous`) — an interactive frequency-ratio curve explorer with musical interval presets, phase/morph controls, and theme-aware Canvas trails.
- A **Quasiperiodic Pattern Lab** (`/tools/quasiperiodic`) — an interactive N-fold plane-wave interference explorer with morphing recipes, zoom, and soft nodal contours. **Apply to home** switches the welcome atmosphere to the quasiperiodic field (Chladni Apply switches it back); pattern color and hero-scrim shade persist in `localStorage` and sync to Convex when signed in.
- A migrated **Tracking dashboard** (`/tools/tracking`) ported from Reflex Drill EXT, including:
  - Chord Drill first-chord timing history
  - Arpeggio transition and miss logging
  - Root Cycling recall stats
  - Recharts visualizations with grade colors, redo indicators, and good/hard threshold lines
  - A one-time client-side migration from Reflex Drill EXT via exported JSON file (localStorage is not shared across origins)
- **Clerk authentication** with route protection via `proxy.ts` and shadcn-themed sign-in/sign-up pages.
- **Convex data persistence** for users and tracking events, with Clerk JWT integration.
- An **AI chat assistant** (`/chat`) powered by the Kimi Code API, grounded in the site's articles, and restricted to a single owner Clerk user.
- **Playwright end-to-end tests**, including authenticated flows for the Tools hub and Tracking dashboard.
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
- `lib/articles.ts` — Markdown article parsing, frontmatter handling, and listing helpers
- `lib/anki.ts` — typed AnkiConnect client
- `lib/themes.ts` — theme registry and helpers for the theming system
- `lib/julia.ts` — Julia-set escape-time math, curated presets, and complex helpers
- `lib/lissajous.ts` — Lissajous parametric math, interval presets, and ratio helpers
- `lib/quasiperiodic.ts` — N-fold quasiperiodic wave field math, presets, and helpers
- `lib/quasiperiodic-hero-settings.ts` — serializable home-hero Quasiperiodic appearance
- `lib/hero-atmosphere.ts` — which math visual drives the welcome hero (`chladni` | `quasiperiodic`)
- `hooks/useMidi.ts` — Web MIDI device selection and held-note tracking
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
- `hooks/useHeroAtmosphereKind.ts` — welcome hero visual kind (localStorage + Convex)
- `convex/settings.ts` — generic per-user settings persistence
- `components/drills/drill-shell.tsx` — shared layout wrapper for tool pages
- `components/drills/midi-connection-bar.tsx` — reusable MIDI input bar
- `components/theme-provider.tsx` — `next-themes` wrapper

## Theming

Piano Suite has a token-driven theming system. Colors are defined as CSS custom properties in `app/globals.css` and exposed as Tailwind utilities (`bg-primary`, `text-primary`, `ring-primary`, etc.). A built-in theme picker lives at `/settings/theme` and lets users switch between presets (Amber, Rose, Emerald, Ocean, Violet, Slate). The choice is saved to `localStorage` and synced to Convex for signed-in users.

When adding new UI, use the theme tokens instead of hard-coded colors. See `AGENTS.md` for the full theming conventions and `DESIGN-PRINCIPLES.md` for the broader visual design system.

A `/tools/midi-test` page is included for manually verifying MIDI input and audio output during development.

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

## Getting Started

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in real credentials:

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from [Clerk](https://clerk.dev)
   - `CLERK_FRONTEND_API_URL` (e.g. `https://<your-app>.clerk.accounts.dev`)
   - `NEXT_PUBLIC_CONVEX_URL` from your Convex project
   - `KIMI_CODE_API_KEY`, `KIMI_CODE_BASE_URL`, and `KIMI_CODE_MODEL` from the [Kimi Code Console](https://www.kimi.com/code/console)
   - `ALLOWED_CLERK_USER_ID` — the Clerk user ID that is permitted to use `/chat`
   - Optional local bypass: `NEXT_PUBLIC_AUTH_DISABLED=true` opens `/tools` without signing in (local/dev only; Convex saves still need a session). Restart `npm run dev` after changing it.

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

## Testing

Unit tests run with Vitest and React Testing Library. They cover the primitive layer (music theory, scoring, Anki client) and the React hooks.

```bash
# Run unit tests in watch mode
npm run test:unit

# Run unit tests once
npm run test:unit:run
```

End-to-end tests run with Playwright. A deterministic test user is created automatically during global setup.

Make sure the **Convex dev server is running** before starting tests, because the authenticated tracking tests hit the local Convex backend.

```bash
# Terminal 1: start Convex
npx convex dev

# Terminal 2: run tests
npm run test:e2e

# Run with a single worker (useful for debugging)
npx playwright test --workers=1
```

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

- Launcher script: `/home/justin/piano-suite/launch.sh`
- Desktop entry: `~/.local/share/applications/piano-suite.desktop`

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
- [x] Add Vercel AI SDK streaming chat route stub
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

## License

MIT
