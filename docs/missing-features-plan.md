# Missing Features — Implementation Plan

> **Status: planning** — tracks work that remains after the v1 roadmap in `docs/PROJECT_HISTORY.md`
> (all checked off). Derived from `docs/PROJECT_HISTORY.md` Purpose / Deploy notes, the parked
> “out of scope” and backburner sections in `docs/*-plan.md`, and conventions in
> `AGENTS.md` + `DESIGN-PRINCIPLES.md`.
>
> Do **not** treat this as a license to expand scope indefinitely. Each phase is
> shippable on its own; later phases depend on earlier foundations.

## Context: what is already done

Piano Suite’s original product pillars are live:

| Pillar | Status |
|--------|--------|
| Interactive Web MIDI / Web Audio drills | Shipped (Chord Drill, Arpeggios, Progression, Root Cycling, Technique) |
| Theory articles | Shipped (2 beginner articles + listing / slug pages) |
| AI chat grounded on articles | Shipped, **owner-only** allowlist |
| Account-backed tracking + settings | Shipped (Convex + Clerk) |
| Cross-device sync | Shipped when signed in |
| Math labs + atmosphere | Shipped (Chladni, Ripple, Julia, Lissajous, Quasiperiodic + ambient backgrounds / float) |
| Global MIDI piano sound | Shipped (smplr-based, on/off toggle, volume, preset picker, sustain, loading indicator) |
| Custom soundfonts | Shipped (`.sf2` upload, sample-map / zip upload, IndexedDB persistence, GM browser + cache) |
| Arpeggio miss filter | Shipped (configurable filter with root-chord preset) |
| Music player | Shipped (upload / playback, drives ripple + piano sound, independent audio toggle) |

Remaining work falls into four buckets:

1. **Production hardening** — auth cutover off the temporary bypass.
2. **Access / product completeness** — multi-user chat; more article content.
3. **MIDI × math-viz** — extend the Chladni Ripple pattern to other concepts and drill overlays (the shared backburner across Julia / Lissajous / Ripple docs).
4. **Lab polish** — explorer UX that was deliberately deferred (pan/zoom, Mandelbrot, shared controls, domain coloring).

---

## Guiding constraints (must follow)

From `AGENTS.md` / `DESIGN-PRINCIPLES.md`:

1. **Primitives first.** Extend `lib/midi-session.ts`, `hooks/useMidi.ts`, and pure mapping libs before adding any inline Web MIDI / Audio.
2. **Props-driven visualizations.** Keep Lab / Visualization components free of MIDI; coupling lives in hooks + ambient / ripple layers (same lesson as Chladni Ripple).
3. **One ambient store.** Use `useAmbientEffects()` / `AmbientEffectsProvider` — never a second ambient store. MIDI reactivity today is only wired for `chladni-ripple` in `components/ambient/ambient-effect-renderer.tsx`.
4. **Theme tokens only.** No hard-coded hex/rgb; Canvas/WebGL via `useThemeCssVars`.
5. **Convex auth contract.** Queries use `optionalUserId` (never throw for missing `users` row); mutations use `ensureUserId`; root providers must not throw.
6. **Per-tool isolation.** New tools go under `app/tools/<tool>/`, `components/drills/<tool>/`, `lib/<tool>.ts`, co-located tests.
7. **Hotspots.** Coordinate edits to `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`, `components/tools/sidebar.tsx`, `package.json`, etc.
8. **Gate before merge:** `npm run lint`, `npm run test:unit:run`, `npm run build`; e2e when auth / chat / critical flows change.
9. **Docs:** Update `README.md` (and `AGENTS.md` when new primitives land) in the same PR as the feature.

---

## Phase map

```
Phase A  Production auth cutover          (ops + verify; little code)
Phase B  Shared MIDI→viz foundation       (unblock C–D)
Phase C  Multi-concept MIDI ripple labs   (Julia / Lissajous / Quasiperiodic)
Phase D  Drill / ambient MIDI overlays    (backburner “MIDI-synced background”)
Phase E  Multi-user Practice Practice Assistant
Phase F  Lab explorer polish              (optional, parallelizable after B)
Phase G  Content growth                   (articles; ongoing, parallel)
```

Recommended order: **A → B → C → D**, with **E** and **G** parallel to B–D once A is done (or even before A for E if chat is still useful behind the allowlist). **F** can interleave after B without blocking D.

---

## Phase A — Production auth cutover

> **Detailed plan:** [`docs/phase-a-auth-cutover-plan.md`](./phase-a-auth-cutover-plan.md)
> (Clerk + Convex production docs researched; step-by-step ops + optional code).
>
> **Progress:** A0 code shipped (`lib/clerk-authorized-parties.ts` + `proxy.ts`).
> A1–A8 require operator access to the custom domain, Clerk Dashboard, Convex, and Vercel.

### Goal

Remove `NEXT_PUBLIC_AUTH_DISABLED=true` so Clerk actually protects routes on the live site, without the bare-404 failure mode that forced the Hobby bypass.

### Why it matters

README Deploy notes: Clerk **development** keys on `*.vercel.app` make `auth.protect()` rewrite some unsigned / post-login hits to a bare **404** (especially Firefox ETP). Bypass opens Tools/Articles but is not the intended product posture. Clerk also **requires a custom domain** for production keys — `*.vercel.app` cannot host `pk_live`.

### Summary (see detailed plan for full matrix)

| Step | Notes |
|------|-------|
| A0 Preflight | Auth e2e with bypass off; optional `authorizedParties` hardening |
| A1 Custom domain | Attach domain on Vercel + DNS/TLS |
| A2 Clerk production instance | Clone settings; re-activate Convex JWT (integrations don’t copy); Clerk DNS CNAMEs; deploy certificates |
| A3 Convex FAPI | Prod → `https://clerk.<domain>.com`; Preview **defaults** stay on development FAPI |
| A4 Vercel env split | **Production:** `pk_live` / bypass unset. **Preview:** keep `pk_test` / bypass unset (do **not** put live keys on Preview) |
| A5–A8 | Allowlists, prod user + `ALLOWED_CLERK_USER_ID`, smoke, docs |

### Code changes

- Required already: keep `unauthenticatedUrl` in `proxy.ts`.
- Recommended: `authorizedParties` on `clerkMiddleware` (env-scoped).
- Keep `isAuthDisabled()` as break-glass; no schema changes.

### Done when

- Unsigned `/tools` → `/sign-in` (not 404) on the custom domain in Chrome **and** Firefox.
- Signed-in drills + Convex sync; `/` and `/tools/chladni` stay public.
- Vercel Production does **not** set `NEXT_PUBLIC_AUTH_DISABLED=true`.
- README Deploy bypass note removed / corrected env matrix.

### Risk

High user-facing if cutover is wrong. Validate bypass-off on **Preview + pk_test** first, then Production + `pk_live` on the custom domain.

---

## Phase B — Shared MIDI → visualization foundation

### Goal

Extract the reusable “MIDI notes → decaying viz props” pattern so new ripple concepts and ambient overlays do not fork `useChladniRipple` ad hoc.

### Background

`docs/julia-set-lab-plan.md` / `docs/lissajous-harmonic-lab-plan.md` backburner:

> Keep explorers props-driven so MIDI coupling stays at a higher layer… Revisit after Julia + Lissajous labs exist and share a clear visualization interface.

Those labs now exist. Ambient already hosts every kind, but only `chladni-ripple` is MIDI-live (`AmbientEffectRenderer`).

### Design

Introduce a thin shared layer:

```
lib/midi-impulse.ts          # velocity impulse, decay, held-note snapshot helpers
hooks/useMidiImpulses.ts     # subscribe to useMidi(); emit decaying impulses

lib/chladni-ripple.ts        # keep; optionally call shared impulse helpers
lib/julia-ripple.ts          # NEW — PC / octave / velocity → Julia props
lib/lissajous-ripple.ts      # NEW — interval / phase / trail intensity
lib/quasiperiodic-ripple.ts  # NEW — N-fold / phase / blend

hooks/useJuliaRipple.ts      # etc. — same shape as useChladniRipple
```

Mapping conventions (align with Chladni Ripple):

| MIDI input | Typical effect |
|------------|----------------|
| Pitch class 0–11 | Concept identity (Julia `c` preset seed, Lissajous interval, QP fold/phase) |
| Octave | Density / zoom / frequency scale |
| Velocity | Impulse amplitude → decay |
| Held density / 2nd PC | Secondary blend / morph target |

### Shared lab controls (optional within Phase B)

Multiple plans deferred “Shared Lab control extraction.” If C/F will touch three labs, extract once:

- `components/drills/lab-controls/` — `ControlGroup`, `RangeControl`, `PresetRow`, Play/Pause morph chrome
- Migrate Chladni / Julia / Lissajous / Quasiperiodic labs incrementally (one PR per lab is fine)

Do **not** force extraction if the first MIDI ripple only needs hooks + libs.

### Testing

- Unit tests for each `*-ripple.ts` mapper (table-driven PC → params).
- Hook tests with mocked `useMidi` (mirror `hooks/__tests__` for Chladni Ripple if present).
- No Convex / schema changes.

### Done when

- Shared impulse helpers exist and Chladni Ripple either uses them or coexists without duplication of decay math.
- `AGENTS.md` primitive table lists the new libs/hooks.
- Gate green.

### Hotspots

- Prefer **not** editing `hooks/useMidi.ts` unless velocity / event shape needs extension.
- Ambient renderer changes belong in Phase D, not B.

---

## Phase C — Multi-concept MIDI ripple tools

### Goal

Ship sibling Ripple labs (or a single multi-concept Ripple hub) so users can explore MIDI-driven Julia / Lissajous / Quasiperiodic the way they explore Chladni Ripple today.

### Recommended product shape

**Separate tools** (matches existing isolation and sidebar density):

| Route | Component tree |
|-------|----------------|
| `/tools/julia-ripple` | `DrillShell` → `JuliaRippleLab` → `JuliaVisualization` + `useMidi` + `useJuliaRipple` |
| `/tools/lissajous-ripple` | … → `LissajousVisualization` |
| `/tools/quasiperiodic-ripple` | … → `QuasiperiodicVisualization` |

Alternative (only if sidebar feels crowded): one `/tools/midi-ripple` with a concept switcher. Prefer separate routes first — consistent with Chladni Ripple vs Chladni Lab.

### Per tool

1. Thin `app/tools/<name>/page.tsx`.
2. Lab under `components/drills/<name>/`.
3. Reuse existing Visualization components **props-only**.
4. Ambient actions: `applyAsAmbientBackground` / float — extend `AmbientEffectKind` only when Phase D is ready; until then, “Apply” can set ambient kind to the **static** sibling (`julia`, `lissajous`, …) or wait for MIDI-capable kinds.
5. Register sidebar + Tools hub cards + README.
6. Unit + smoke component tests; e2e optional (same as other explorers).

### Out of scope for C

- Drill-page overlays (Phase D).
- Practice event / Anki logging.
- Mandelbrot / pan-zoom (Phase F).

### Done when

- Three concepts respond to live MIDI in dedicated labs.
- Theme tokens drive all colors.
- Soft ambient defaults remain readable if Apply is wired.

---

## Phase D — Drill / ambient MIDI-synced overlays

### Goal

Deliver the parked “MIDI-synced background ripple”: user-selectable visual language reacting to notes on drill pages and/or Welcome, via the **existing** ambient system.

### Product

Extend `/settings/atmosphere`:

- Background kinds that are MIDI-reactive: today `chladni-ripple`; add `julia-ripple`, `lissajous-ripple`, `quasiperiodic-ripple` (or a single kind + `midiConcept` setting).
- Float panel can show the same reactive concept.
- Soft defaults from `lib/ambient-effects.ts` stay mandatory so drills remain readable (`DESIGN-PRINCIPLES` scrim / softness rules).

### Architecture

```
AmbientEffectRenderer
  switch (kind)
    chladni-ripple → useChladniRipple + ChladniVisualization   (exists)
    julia-ripple   → useJuliaRipple + JuliaVisualization       (new)
    …
```

MIDI session is already tab-scoped (`lib/midi-session.ts`); connecting once in a drill keeps ambient reactive across navigation.

### Persistence

- Extend `AmbientEffectKind` / validators in `lib/ambient-effects.ts`.
- localStorage + Convex via existing `useAmbientEffects` (generic settings blob — confirm normalize/migrate for unknown kinds).
- No practiceEvents writes.

### UX constraints

- One ambient store only.
- Welcome hero kind (`hero-atmosphere`: `chladni` | `quasiperiodic`) stays separate from ambient route backgrounds unless we deliberately unify later — do not break Apply-to-home from Pattern Labs.
- Prefer soft intensity on drill routes; labs keep vivid exploration defaults.

### Testing

- Unit: normalize ambient settings with new kinds; reject / fallback unknown.
- Component: renderer picks MIDI path for ripple kinds.
- E2E smoke: atmosphere settings page still loads; optional MIDI is hard to automate — keep unit coverage strong.

### Done when

- User can assign a MIDI-reactive concept as Chord Drill (etc.) background and see pulses while practicing.
- README + AGENTS ambient notes updated (“MIDI reactivity only for chladni-ripple” → list all ripple kinds).

---

## Phase E — Multi-user Practice Assistant

### Goal

Move `/chat` from single-owner allowlist to a sustainable access model for signed-in users, without blowing Kimi quota or weakening auth.

### Current behavior

`lib/chat-auth.ts` → `authorizeChatAccess`: bypass → ok; no user → unauthorized; user ≠ `ALLOWED_CLERK_USER_ID` → forbidden.

### Decision (pick one before coding)

| Option | Pros | Cons |
|--------|------|------|
| **E1. All signed-in users** | Matches README “personalized help” pillar | Cost / abuse risk on Hobby |
| **E2. Env allowlist of N ids** | Simple, low risk | Manual ops |
| **E3. Convex flag / role on `users`** | Flexible, testable | Schema + settings UI |

**Recommendation:** **E1 with rate limiting**, or **E3** if you want an admin toggle without redeploy. Avoid leaving owner-only as the long-term state if the product goal is a real tutor for learners.

### Implementation sketch (E1)

1. Change `authorizeChatAccess` to: auth on → require any `userId`; drop equality check (or gate with `CHAT_ALLOW_ALL_SIGNED_IN=true`).
2. Add server-side rate limit (Convex table or in-memory per-instance is weak on serverless — prefer Convex counters / `@convex-dev/ratelimiter` if adding a dependency is acceptable; otherwise a small `chatRateLimits` table).
3. Keep article grounding; do not expand tool-calling scope in this phase.
4. Update `e2e/chat-auth.spec.ts`: unsigned still 401; signed-in non-owner gets 200 stream (or 429 when limited).
5. README: remove “owner-only”; document rate limits + env flags.
6. Optional: usage logging mutation for cost visibility (no PII in prompts stored unless explicitly desired).

### Auth interaction

- With bypass on, chat stays open (current). After Phase A, bypass off → chat requires sign-in for everyone.
- Do not throw from layout providers.

### Done when

- Any signed-in user (per chosen policy) can use `/chat`.
- Unsigned still blocked when auth is enabled.
- Unit tests cover authorize decisions; e2e updated.

---

## Phase F — Lab explorer polish (optional)

Independent enhancements deferred by lab plans. Order by user value:

| Item | Source | Notes |
|------|--------|-------|
| Shared lab controls extraction | Julia / Lissajous / QP plans | Best done as part of or right after Phase B |
| Mouse pan / deep zoom (Julia, QP) | Julia / QP out of scope | Keep Visualization props-driven; Lab owns gesture state |
| Mandelbrot companion picker | Julia plan | Nice pedagogy link; separate route or mode toggle in Julia Lab |
| Domain coloring (Quasiperiodic) | QP plan | Theme-token gradients only |
| 3D / multi-color Lissajous | Lissajous plan | Lowest priority; easy to over-design |
| Julia / Lissajous as **hero** atmospheres | QP out of scope; ambient already covers backgrounds | Only needed if Welcome Apply-to-home should include them; ambient `/` already can set Julia/Lissajous via Atmosphere settings |
| Hard-delete Multigrid **tiling** view | [`docs/multigrid-lab-plan.md`](./multigrid-lab-plan.md) — Marked for deletion | Soft-disabled (grid/lines only). Remove tiling draw branch, `"tiling"`/`"both"` view modes, and related UI remnants |

Ship each as its own PR. No MIDI requirement.

---

## Phase G — Content growth

### Goal

Support the “learn music theory through articles” pillar beyond two beginner pieces.

### Work

- Author Markdown under `articles/` with YAML frontmatter (`lib/articles.ts` already handles listing / SSG).
- Prefer topics that ground chat RAG: chord qualities, ii–V–I, Anki workflow, MIDI practice tips, how each drill maps to learning science.
- Keep floating chat bubble on article pages.
- No code changes required unless frontmatter schema expands.

### Done when

- At least a small curriculum set (e.g. 4–6 articles) covering declarative + procedural practice themes.
- README article count / examples updated if it lists specific posts.

---

## Onboarding follow-ups

Outstanding polish items for the first-time `/tools` onboarding flow shipped in PR #31:

- [ ] **Styling pass** — refine the cinematic slide styling (typography, spacing, animation timing, reduced-motion behavior).
- [ ] **Pillar body copy** — rewrite the main body text in all three onboarding pillars (active recall & spaced repetition, self-care, managing frustrations).
- [ ] **First pillar Next-button timing** — reduce the read-delay before the Next button appears on the first pillar (currently ~8–10 s) down to about 5 s.

---

## User-requested backlog (new)

These items were requested after the v1 roadmap was written. They are tracked here until they are promoted to phased implementation plans.

### Audio / piano sound option (`kimi/piano-sound`) ✅ Shipped

Add an optional piano sound that plays when the user presses a key on a connected MIDI keyboard.

- **Status:** Shipped. Milestone 1 (global playback + quick toggle + `/settings/audio`) and Milestone 2 (custom `.sf2`/sample-map upload, caching, GM browser, preset categories) are both live.
- **Shipped capabilities:**
  - `/settings/audio` page with piano sound on/off, volume, preset selector, sustain toggle.
  - Built-in smplr pianos + General MIDI browser + categorized presets.
  - Custom `.sf2` and per-note/zip sample-map upload with IndexedDB persistence.
  - Sample cache via CacheStorage for repeat visits.
  - “Use MIDI sounds” switch + gear icon on the MIDI connection bar when connected.
  - Loading indicator while soundfont samples load.
- **Research:** `docs/piano-sound-engine-research.md`
- **Implementation plan:** `docs/piano-sound-implementation-plan.md`

### Tracking verification

The tracking pipeline needs a health check before declaring it fully reliable.

- **Goal:** verify end-to-end event flow for Chord Drill, Arpeggios, Progression, Root Cycling, and Technique.
- **Checklist:**
  - Events write to Convex when `canPersist` is true.
  - Free-tier local history (`lib/local-practice-history.ts`) is read back correctly.
  - Tracking dashboard displays the right data and does not double-count imports.
  - Reflex Drill EXT JSON import still works.
  - E2E specs still pass.
- **Files likely touched:**
  - `convex/tracking.ts`
  - `components/tracking/*`
  - `lib/local-practice-history.ts`
  - `e2e/tracking.*.spec.ts`

### Arpeggio root-chord miss filter ✅ Shipped

In `/tools/arpeggios`, re-articulating a left-hand root-chord note during the right-hand sequence should not count as a miss.

- **Status:** Shipped. The drill now has a configurable miss filter with a root-chord preset; the exact MIDI note numbers that satisfied the left-hand hold are ignored during the sequence phase, while higher-octave copies of the same pitch class are still evaluated.
- **Files touched:**
  - `hooks/useArpeggios.ts`
  - `lib/arpeggios.ts`
  - `lib/__tests__/arpeggios.test.ts` / `hooks/__tests__/useArpeggios.test.ts`

### Music ripple integration (audio file / microphone)

Let the existing ripple/ambient visualizations react to an uploaded audio file or live microphone input, not just live MIDI.

- **Use case:** user uploads a song and watches the Chladni / Julia / Lissajous / Quasiperiodic field pulse with the music.
- **Approach:** use Web Audio `AnalyserNode` to extract frequency/energy data and feed it into the visualization impulse layer. This should reuse the shared MIDI → viz foundation planned in Phase B rather than adding a second ambient store.
- **Files likely touched:**
  - `lib/audio-impulse.ts` (new)
  - `hooks/useAudioRipple.ts` (new)
  - `components/ambient/ambient-effect-renderer.tsx`
  - `app/tools/chladni-ripple/page.tsx` or new `/tools/music-ripple`

### Chladni Ripple polish suite 🟡 Partially shipped

A cluster of related improvements for the Chladni Ripple Lab and ambient backgrounds:

1. **Viewport / aspect-ratio behavior** ✅ Shipped
   - The Welcome page background fills the viewport; the Ripple Lab preview card uses `aspect-[4/3] lg:aspect-[16/9]` and matches the Welcome page fill behavior.
   - Files: `components/welcome/chladni-visualization.tsx`, `components/drills/chladni-ripple/chladni-ripple-lab.tsx`, `components/ambient/ambient-effect-renderer.tsx`.
2. **Persist ripple params to welcome / ambient presets** ✅ Shipped
   - Ripple params are persisted to localStorage + Convex and read by the ambient renderer. The Lab can “Use on Welcome” / “Use as ambient default”.
   - Files: `lib/chladni-ripple-settings.ts`, `hooks/useAmbientEffects.tsx`, `components/ambient/ambient-effect-renderer.tsx`, `components/drills/chladni-ripple/chladni-ripple-lab.tsx`.
3. **Float panel resolution** ✅ Shipped
   - The float panel passes `resolutionScale={2}`; `ChladniVisualization` already uses `ResizeObserver` to resize the canvas and refresh DPR on container changes.
   - Files: `components/welcome/chladni-visualization.tsx`, `components/ambient/ambient-float-panel.tsx`.
4. **Full customization like Chladni Lab** 🟡 Partially shipped
   - Ripple Lab already has zoom, decay, octave complexity, line thickness, base intensity, secondary blend/offset/speed/motion, color softness, and time scale. Presets and reset are live.
   - Still missing: pattern color picker and a richer preset gallery (currently Lab / Ambient / Bright / Dense).
   - Files: `components/drills/chladni-ripple/chladni-ripple-lab.tsx`, `lib/chladni-ripple.ts`, `hooks/useChladniRipple.ts`.
5. **Unified “turn off” + one customization place** 🟡 Partially shipped
   - The Ripple Lab has a “Turn off background ripple” button; `/settings/atmosphere` can pick the route background and set the default.
   - Still possible: a single global on/off toggle at the top of `/settings/atmosphere` and clearer routing of “Apply to home / everywhere” through one settings store.
   - Files: `app/settings/atmosphere/page.tsx`, `lib/ambient-effects.ts`, `hooks/useAmbientEffects.tsx`.

---

## Suggested PR / branch sequence

Cloud / local agents: one branch per phase (or per tool inside C/F), matching `cursor/<name>-8bc9` in cloud.

| PR | Phase | Touches hotspots? |
|----|-------|-------------------|
| 1 | A (docs + env checklist confirmation; code only if bugs) | `README.md` |
| 2 | B foundation | Maybe `AGENTS.md`; avoid sidebar |
| 3+ | C one ripple tool each | `sidebar.tsx`, `app/tools/page.tsx`, `README.md` |
| 4 | D ambient MIDI kinds | `lib/ambient-effects.ts`, ambient components, atmosphere settings, `AGENTS.md` |
| 5 | E chat access | `lib/chat-auth.ts`, `app/api/chat`, e2e, maybe Convex |
| 6… | F / G as needed | F may hit lab components; G mostly `articles/` |
| Audio | Piano sound option | `package.json`, `hooks/useAudio.ts`, settings, `components/drills/midi-connection-bar.tsx` |
| Arp-fix | Arpeggio root-chord miss filter | `hooks/useArpeggios.ts`, tests |
| Ripple-polish | Chladni Ripple fixes + customization + unified UI | ambient components, Ripple Lab, Chladni visualization |
| Music-ripple | Audio file / mic reactivity | new audio-impulse layer, ambient renderer |

Do not combine E (auth/chat) with D (ambient MIDI) in one PR — different risk profiles.

---

## Explicit non-goals (until revisited)

- Replacing Clerk or Convex.
- Mobile native apps.
- Multi-tenant orgs / team billing.
- Turning math labs into graded drills with `practiceEvents` (unless product later asks).
- Expanding chat beyond article-grounded Q&A (tool calling into drills, etc.).

---

## Success criteria (program level)

The app matches the README Purpose without temporary escapes:

1. **Auth is real in production** (Phase A).
2. **Any intended user can get AI help** (Phase E), not only the owner allowlist.
3. **Practice can be visually reactive** across the shipped math concepts (Phases B–D), still theme-token and primitive based.
4. **Learning content is deep enough** that chat grounding stays useful (Phase G).
5. **Explorer polish** does not block 1–4 (Phase F optional).

---

## First implementation step (when execution starts)

Start with **Phase B** in code (Phase A is mostly ops). Concrete first commit:

1. Add `lib/midi-impulse.ts` + tests (decay, velocity normalize, held PC set).
2. Refactor `lib/chladni-ripple.ts` / `hooks/useChladniRipple.ts` to consume it without behavior change.
3. Document primitives in `AGENTS.md`.
4. Gate: lint, unit, build.

Then open Phase C with `julia-ripple` as the first sibling tool.
