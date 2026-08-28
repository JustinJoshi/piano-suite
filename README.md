# Piano Suite

**A free practice community for self-taught pianists.**

Piano Suite is a welcoming place for anyone learning piano on their own. Whether you just bought your first MIDI keyboard or you are rebuilding your practice routine, the goal here is simple: give you the tools, guidance, and community support to learn piano in a healthy, sustainable way — without paying for expensive lessons.

The core experience is free and runs in your browser. Sign in to sync progress across devices, or practice locally without an account.

## What you get

- **A friendly first-time onboarding** that introduces the pillars of healthy piano learning: active recall & spaced repetition, taking care of your hands, and managing practice frustration with focused/diffuse thinking.
- **A modular welcome section** (`lib/welcome-config.ts`) that keeps landing-page copy, typography, and style tokens in one typed config. `/dev/welcome-lab` provides an interactive UI for iterating on those styles without touching component code.
- **Practice tools** ported from real self-taught routines: Chord Drill, Arpeggios, Progressions, Root Cycling, Technique tracking, Visualization Labs — plus a **Workshop** for composing your own practice pages from feature blocks.
- **Evidence-based articles** that explain *how* to practice, not just *what* to play.
- **Progress tracking** so you can see improvement over time.
- **A community direction**: the project is open source and built in public. Questions, feedback, and contributions are welcome.

## Who this is for

- Complete beginners teaching themselves piano.
- Self-taught pianists who want a structured, research-backed practice loop.
- Anyone who wants to avoid injury, burnout, and ineffective cramming.

- A **Next.js 16+ App Router** application with TypeScript.
- A **Lunar.dev-inspired landing page** that ports the original Reflex Drill EXT welcome content into a polished, modern marketing layout, with a fixed full-viewport soft Three.js atmosphere (Chladni by default) behind sparse hero copy and floating feature cards, theme-aware scrims, and resonant modes that morph slowly with the active theme. Pattern Lab can **Apply to home** / **Reset home** to customize that atmosphere (localStorage always; Convex when Pro). Atmosphere settings at `/settings/atmosphere` can also switch the Welcome background to MIDI Ripple, Julia, or Lissajous.
- An **Articles section** (`/articles`) with a listing page and statically generated article pages (`/articles/[slug]`). Articles are authored in Markdown with YAML frontmatter, rendered with `react-markdown`, and styled with reusable Tailwind utility classes. The shared site navbar is included on article pages so readers can navigate back to the home page and other sections at any time. A floating chat bubble on article pages links directly to the Practice Assistant so readers can ask questions about the content. A setup guide at `/articles/anki-ankiconnect-setup` walks new users through installing Anki and AnkiConnect.
- The **Workshop-first tools workspace**: `/tools` lands on the **Workshop** (`/tools/workshop`), the core of the app, where you compose your own practice pages and can jump into ready-made drills. The sidebar groups navigation into **Workshop → Ready-made drills → Progress → Labs** (labs collapse behind one toggle; fixed on desktop; off-canvas drawer with menu control on mobile).
- A **first-time onboarding flow** on `/tools` that introduces the three pillars of healthy piano practice — active recall & spaced repetition, hand/body care, and managing frustration through focused/diffuse practice — then releases the user into the dashboard. State is stored in `localStorage`; the flow is skippable and replayable from `/settings/theme`.
- A migrated **Chord Drill** (`/tools/chord-drill`) ported from Reflex Drill EXT, including Single Shape / Family Cycle / Extended Family modes, root/quality selection, reps, per-chord rep overrides, Anki Sync with auto-timer and auto-grade, break-before-grading, and personal-best stats persisted via Convex.
- A migrated **Arpeggios** (`/tools/arpeggios`) ported from Reflex Drill EXT, including the 12 minor-11th cells with left-hand pedal and right-hand sequence drilling, per-transition timing, miss logging, sequence customization, lap chimes, a configurable miss filter, and Anki Sync that maps any card root to the matching minor-11th arpeggio and auto-grades by misses.
- A migrated **Progression** (`/tools/progression`) ported from Reflex Drill EXT, including ii-V-I and 12-bar blues drills in C/G/D/A/E, per-chord transition timing, auto-looping, step and loop chimes, optional Anki card flip on loop completion, and personal-best stats persisted via Convex.
- A migrated **Root Cycling** (`/tools/root-cycling`) ported from Reflex Drill EXT, including chord mode with any quality and arpeggio mode with the canonical minor-11th shape, customizable root pools, per-attempt timing, and tracking aggregated by fixed idea across random keys.
- A migrated **Technique habit tracker** (`/tools/technique`) ported from Reflex Drill EXT, including a built-in metronome, BPM logging, streak counter, 28-day practice grid, and a one-time import from the original `technique-habit-log-v1` localStorage key.
- A **Workshop** (`/tools/workshop`) where you compose your own practice page from feature blocks — metronome, drill timer, and chord sets — with drag-and-drop ordering, a `/` insert palette, per-block settings, and MIDI-driven success detection. Ready-made drill shortcuts at the top link straight into the pre-built drills. Pages persist in `localStorage` (Free) and practice events appear in the Tracking dashboard's Workshop tab (Pro syncs to Convex).
- A **Chladni Pattern Lab** (`/tools/chladni`) — a public interactive square-plate waveform explorer for the landing-page hero shader, with live controls for modes, morph speed, line thickness, zoom, and secondary-wave blending. **Apply to home** copies the full Lab pattern onto the welcome hero; you can also set a pattern color and hero-scrim shade, or **Reset home** to the soft shipping defaults. Preferences persist in `localStorage` and sync to Convex when Pro (no account required to explore or apply locally).
- A **Chladni Ripple** tool (`/tools/chladni-ripple`) — drives the Chladni visualization from live MIDI: pitch class → mode identity, octave → denser patterns, velocity → decaying intensity pulse, chords → secondary blend. Separate from the parameter explorer; Ambient actions can set Ripple as a Welcome / app-wide background. **Pop out while practicing** (float panel over Chord Drill and other tools) is a **Pro** feature.
- A **Global Music Player** (embedded in Ripple Lab) — upload a MIDI or audio file to drive the Chladni Ripple visualization and piano sound anywhere on the site. MIDI playback is sample-accurate; audio playback uses best-effort monophonic pitch detection. Playback survives route changes and respects the MIDI-sounds toggle.
- A **Julia Set Lab** (`/tools/julia`) — an interactive escape-time Julia set explorer with curated complex-parameter presets, morph between two `c` values, zoom, iterations, escape radius, and theme-aware coloring.
- A **Lissajous Harmonic Lab** (`/tools/lissajous`) — an interactive frequency-ratio curve explorer with musical interval presets, phase/morph controls, and theme-aware Canvas trails.
- A **Quasiperiodic Pattern Lab** (`/tools/quasiperiodic`) — an interactive N-fold plane-wave interference explorer with morphing recipes, zoom, and soft nodal contours. **Apply to home** switches the welcome atmosphere to the quasiperiodic field (Chladni Apply switches it back); pattern color and hero-scrim shade persist in `localStorage` and sync to Convex when Pro.
- A **Multigrid Lab** (`/tools/multigrid`) — **experimental** (enable under Theme → Enable experimental features; off by default). Canvas de Bruijn multigrid explorer (Penrose/Ammann/Socolar/Dense presets). **Apply to home** switches the welcome ambient background to Multigrid; preferences persist in `localStorage` and sync to Convex when Pro.
- A public **Pricing** page (`/pricing`) with Clerk `<PricingTable />` for Free vs Pro (cloud sync + practice float panel). Manage subscriptions at `/settings/billing`.
- **Atmosphere settings** (`/settings/atmosphere`) — assign any shipped visualization (Chladni, Quasiperiodic, Multigrid, MIDI Ripple, Julia, Lissajous) as a full-page background per route, or apply a default everywhere. The draggable / resizable **float panel** (live resonance beside drills) is **Pro-only**. Preferences persist in `localStorage` and sync to Convex when Pro.
- A migrated **Tracking dashboard** (`/tools/tracking`) ported from Reflex Drill EXT, including:
  - Chord Drill first-chord timing history
  - Arpeggio transition and miss logging
  - Root Cycling recall stats
  - Recharts visualizations with grade colors, redo indicators, and good/hard threshold lines
  - A one-time client-side migration from Reflex Drill EXT via exported JSON file (localStorage is not shared across origins)
- **Clerk authentication** with route protection via `proxy.ts` and shadcn-themed sign-in/sign-up pages. See [Authentication & routes](#authentication--routes) for the public-route list and the `NEXT_PUBLIC_AUTH_DISABLED` bypass. <!-- pragma: allowlist secret -->
- **Convex data persistence** for users and tracking events, with Clerk JWT integration.
- An **AI chat assistant** (`/chat`) powered by the Kimi Code API, grounded in the site's articles, and restricted to a single owner Clerk user via `ALLOWED_CLERK_USER_ID` (the allowlist always applies — the auth bypass never opens the paid endpoint).
- **Playwright end-to-end tests**, including auth-protection and chat-gate specs plus authenticated flows for every drill, the Tools hub, and the Tracking dashboard.
- The original Anki deck exports (`chord-symbols-CGDAE.txt` and `chord-symbols-CGDAEno11.txt`) preserved for download.

## Our philosophy

- **Free core.** The practice tools, articles, and local progress tracking are free. Paid features only cover things that cost real money to run, like cross-device sync.
- **Healthy practice.** Learning piano is as much about resting, stretching, and thinking clearly as it is about drilling.
- **Community-driven.** Piano Suite is built in the open. The best way to improve it is to learn alongside other self-taught pianists.

## Getting started

1. Clone the repo:
   ```bash
   git clone https://github.com/JustinJoshi/piano-suite.git
   cd piano-suite
   ```
2. Copy the environment template and fill in the required credentials:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Convex dev server:
   ```bash
   npx convex dev
   ```
5. In another terminal, start Next.js:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000).

For full setup details, deployment notes, and the technical history of the project, see [`docs/PROJECT_HISTORY.md`](docs/PROJECT_HISTORY.md).

## Contributing

The project is open source under the MIT license. If you are learning piano too, your perspective matters. Open an issue, suggest a feature, or submit a PR.

## License

MIT
