# Feature Inventory — tagged for the pivot

Every user-visible feature and supporting system in Piano Suite as of commit
`b918c88`, tagged against the Workshop + marketplace direction.

**Tags**

- **KEEP** — survives the pivot essentially as-is.
- **REWORK** — the capability is right, the packaging or placement is wrong.
- **ARCHIVE** — keep the code, remove it from the default user surface. Recoverable
  later; costs nothing to leave in the repo, costs a lot to leave in the sidebar.
- **CUT** — remove from the product. Code may stay in git history.

The point of ARCHIVE is worth stating plainly: **nothing here should be deleted
for its own sake.** The cost these features impose is not disk space or
maintenance, it is *attention* — every extra sidebar row makes the product
harder to explain. Hiding them is nearly free and buys back the clarity you
said was missing.

---

## 1. The Workshop and its parts

| Feature | Where | Tag | Reasoning |
|---|---|---|---|
| Workshop grid editor | `components/workshop-grid/*`, `components/custom-practice/*` | **KEEP** | This is the product now. Drag-and-drop, resize, 4-column span model, `localStorage` for Free and Convex for Pro. 26 unit tests on the layout math alone. It works. |
| Feature block registry | `lib/feature-blocks/*` | **KEEP the contract, EXPAND the content** | The `FeatureDefinition` contract (type, label, fields, defaults, normalizer, component) is exactly the right abstraction. There are only 6 entries in it. See [`02-architecture-verdict.md`](02-architecture-verdict.md). |
| The 6 blocks | metronome, drillTimer, chordSet, textBlock, midiConnectionBar, drillShortcuts | **REWORK** | Three are real practice tools. `textBlock` is a note field, `midiConnectionBar` is a status indicator, `drillShortcuts` is a link list. Also: 6 of the 18 editable fields across these blocks are never read by the runtime (see §6). |
| "Marketplace" tab | `/tools/workshop/marketplace` | **REWORK — rename** | It is a component picker showing 6 live previews. Calling it Marketplace collides with the community gallery and sets an expectation it cannot meet. Rename to **Add a block** (or **Blocks**). |
| Public gallery | `/workshop`, `/workshop/[id]` | **REWORK — this becomes the real Marketplace** | Public route, renders published pages, currently empty. Missing: a fork button (the `forkCustomDrill` mutation exists and is tested but no UI calls it), attribution, remix counts, search, categories. |
| Starter templates (10) | `lib/starter-templates.ts` | **KEEP** | `first-chords`, `all-twelve-keys`, `chord-qualities`, `ii-v-i-warmup`, `metronome-sprint`, `beginner-rhythm`, `daily-technique`, `quick-notes`, `music-theory-starter`, `finger-flexibility-starter`. This is your seed content — it is already the right shape to publish into the gallery under your own name. |
| Guided routes (2) | `lib/routes.ts`, `/routes` | **KEEP** | "Music theory" and "Finger flexibility". Public, checklist-based, ends by building a Workshop page for the user. This is the closest thing you have to a real onboarding and it is better than the six-slide modal. Promote it. |
| Workshop → Convex sync | `hooks/useWorkshopSync.ts`, `convex/workshop.ts` | **KEEP** | Debounced upsert, last-write-wins per `clientPageId`, tombstones. Solid. |

---

## 2. The four ready-made drills

| Feature | Tag | Reasoning |
|---|---|---|
| Chord Drill (`/tools/chord-drill`) | **KEEP + decompose** | 997-line component, 942-line hook. Single Shape / Family Cycle / Extended Family modes, root and quality selection, reps, Anki sync with auto-grade, personal bests. The most sophisticated thing in the app. |
| Arpeggios (`/tools/arpeggios`) | **KEEP + decompose** | 12 minor-11th cells, per-transition timing, miss logging, configurable miss filter, Anki root mapping. |
| Progression (`/tools/progression`) | **KEEP + decompose** | ii-V-I and 12-bar blues in five keys, per-chord timing, auto-loop, Anki card flip on loop completion. |
| Root Cycling (`/tools/root-cycling`) | **KEEP + decompose** | Chord and arpeggio modes, custom root pools, tracking aggregated by fixed idea across keys. |

These are the most important entries in this document, so it is worth being
explicit about what "decompose" means and does not mean.

**It does not mean delete them.** They stay as working ready-made drills, and
they are the honest answer to "Play now" for someone who does not want to build
anything. They are also your proof that the blocks work — a marketplace whose
components have never been used in anger is a toy.

**It does mean harvesting them.** Each drill is a working, tested combination of
behaviours that do not currently exist as blocks:

| Behaviour, already built and tested | Currently trapped inside | Would become |
|---|---|---|
| Note-sequence targeting (play these notes in this order) | `lib/sequence-drill.ts`, `useArpeggios` | `noteSequence` block |
| Per-transition timing (time between step *n* and *n+1*) | `useArpeggios`, `useProgression` | timing mode on the drill timer |
| Miss logging + a wrong-note filter | `useArpeggios`, `convex/tracking.ts` | `missLog` block |
| Random root generation from a pool | `useRootCycling` | `rootPool` block |
| Chord progression stepping with loop | `useProgression`, `lib/progression.ts` | `progression` block |
| Anki card sync and auto-grading | `hooks/useAnkiSync.ts`, `lib/anki.ts` | `ankiSource` block |
| Live stats and personal bests | `useChordDrill`, `convex/tracking.ts` | `sessionStats` block |
| Metronome-backed BPM logging + streak | `lib/technique.ts`, `/tools/technique` | `techniqueLog` block |

That is eight blocks from code that already exists, already has tests, and
already works with real hardware. The library goes from 6 to 14 without writing
a single new algorithm.

---

## 3. Progress and tracking

| Feature | Tag | Reasoning |
|---|---|---|
| Technique tracker (`/tools/technique`) | **KEEP, also expose as a block** | Metronome, BPM log, streak counter, 28-day grid. Genuinely useful and hardware-free — one of the few things a visitor without a MIDI keyboard can actually do. |
| Tracking dashboard (`/tools/tracking`) | **KEEP, REWORK presentation** | Recharts visualizations of first-chord timing, arpeggio transitions, miss logs, root-cycling recall. The data model is right; the presentation is four dense charts with no narrative. A beginner cannot tell whether they are improving. |
| Local practice history (Free tier) | `lib/local-practice-history.ts` | **KEEP** | Reflex-compatible keys, lets Free users keep history without an account. Important for the frictionless path. |
| Legacy Reflex Drill import | **KEEP** | Small, harmless, meaningful to exactly one person — you. |

---

## 4. Sound and MIDI

| Feature | Tag | Reasoning |
|---|---|---|
| MIDI session (`lib/midi-session.ts`, `useMidi`) | **KEEP** | Tab-scoped, survives navigation. Correct design. Infrastructure, not a feature. |
| Sampled piano engine (`lib/audio-engine.ts`, smplr) | **KEEP** | Global MIDI note-on → sound. Makes the app feel real. |
| Preset picker + GM soundfont browser | **KEEP, simplify** | The curated preset list should be the default surface; the full General MIDI catalogue is a power-user drawer. |
| Custom `.sf2` upload, per-note sample maps, IndexedDB kits | `lib/sf2-kit.ts`, `lib/sample-map-kit.ts`, `lib/audio-storage.ts`, `lib/audio-upload.ts` | **ARCHIVE** | Impressive engineering, roughly zero beginner demand. Keep the code, move the UI behind an "Advanced" disclosure in audio settings. This is the clearest single instance of scope creep in the app — and note it is *good* code, which is exactly why it is hard to see as scope creep. |
| Global music player (`lib/music-player.ts`, `useMusicPlayer`) | **REWORK — promote hard** | Upload a MIDI or audio file, play it back sample-accurately, emit global note events, survive route changes. **This is the most undervalued asset in the codebase.** It is currently a panel embedded in a visualization lab. It is the missing ingredient for the founder's own example — a Moonlight Sonata trainer — and it should become a first-class block. |
| Anki + AnkiConnect integration | `lib/anki.ts`, `hooks/useAnkiSync.ts` | **KEEP — this is a differentiator** | Typed AnkiConnect client, degrades gracefully when Anki is not running, 19 unit tests. Nobody else in the piano-learning space does this. See [`05-soft-launch-plan.md`](05-soft-launch-plan.md) — it is also your best distribution wedge. |

---

## 5. Visualization labs

Seven labs, roughly **7,000 lines** including their math libraries. This is the
biggest concentration of scope creep in the project, and also the source of the
app's visual identity — so the answer is not "delete it," it is "decide which
two are load-bearing."

| Lab | LOC (component + lib) | Tag | Reasoning |
|---|---|---|---|
| Chladni Pattern Lab (`/tools/chladni`) | 697 + 149 | **KEEP, demote from sidebar** | It generates the landing atmosphere and the brand's visual language. But it is a *design tool for you*, not a practice tool for a learner. Keep it public (it is a lovely thing to stumble on), move it out of the primary navigation. |
| Chladni Ripple (`/tools/chladni-ripple`) | 561 + 202 | **KEEP, PROMOTE** | Live MIDI drives the pattern: pitch class picks the mode, octave sets density, velocity sets intensity, chords blend. This is the single most "alive" thing in the app and the only lab that is actually *about* playing piano. It is also the honest answer to "make the marketplace feel colourful and animated." Make it a block. |
| Julia Set Lab | 735 + 112 | **ARCHIVE** | Beautiful. Unrelated to piano. |
| Lissajous Harmonic Lab | 763 + 165 | **ARCHIVE** | Has a real musical justification (interval ratios as curves) and is still a detour. Archive with a note — it is a good candidate for an *article* illustration rather than a navigation entry. |
| Quasiperiodic Pattern Lab | 886 + 124 | **ARCHIVE** | N-fold plane-wave interference. Pure aesthetics. |
| Multigrid Lab | 763 + 417 | **ARCHIVE** | Already behind the experimental flag, and the tiling view is disabled. It is half-off already; turn it the rest of the way off. |
| Logo Lab (`/tools/logo-lab`) | 442 + 458 | **CUT from the user surface** | A tool for designing the product's own brand mark, shipped to users in the sidebar. It is a build-time tool. Note also that the shipping mark was reverted to a plain musical note on 2026-08-31, so the lab's output is not even in use. |

Archiving Julia, Lissajous, Quasiperiodic, Multigrid and Logo Lab removes about
**4,300 lines** and **five rows** from the sidebar without touching a single
thing a learner uses. It also removes their per-lab hero-settings hooks
(`useHeroMultigridSettings`, `useHeroQuasiperiodicSettings`,
`useLogoMarkSettings`) and their Convex saved-pattern surface from the product's
mental model.

Related: **Ambient effects / per-route backgrounds** (`/settings/atmosphere`) —
**ARCHIVE**. Letting a user assign any of six visualizations as the background of
any individual route is a remarkable amount of configuration for an app whose
core problem is that nobody knows what it does. Keep one global atmosphere
toggle; retire the per-route matrix. The **Pro float panel** goes with it.

---

## 6. Verified defects worth fixing before anything else

These are not opinions. Each was confirmed against running code.

**Six editable settings do nothing.** `components/custom-practice/drill-runtime-provider.tsx`
calls `useDrillRuntimeProvider({ pageId })` and passes no configuration.
`hooks/useDrillRuntime.ts` accepts `countdownSeconds`, `breakSeconds` and
`requireExact` but receives none of them, and hardcodes `multiRep: true` at line
138. So these Workshop settings are inert:

| Block | Dead field |
|---|---|
| `drillTimer` | `countdownSeconds`, `breakSeconds`, `multiRep` |
| `chordSet` | `requireExact`, `goodThreshold`, `hardThreshold` |

This matters far beyond the immediate bug. A marketplace's core promise is *"you
get the tool the way its author built it."* Right now a third of the knobs would
not travel with a shared page. Fix this before publishing anything.

**The landing page's only CTA leads to a sign-in wall.** Hero CTA →
`/tools/workshop` → `proxy.ts` protects `/tools/*` → `/sign-in`.

**Onboarding blocks the app.** `components/tools/onboarding/onboarding-shell.tsx`
renders `fixed inset-0 z-50` over the first visit to any `/tools/*` or
`/settings/*` page. Six slides.

**Dev tooling is public.** `lib/dev-tools.ts` — `isDevToolsEnabled()`,
`isDevToolsVisible()` and `isDevToolsUserAllowed()` all `return true`
unconditionally, with a comment saying this is intentional. A floating "Dev lab"
button therefore renders on the public landing page in production.

**The chat page is in the public navbar and cannot work.** `/chat` is listed in
`components/navbar.tsx` for every visitor, but `lib/chat-auth.ts` restricts it to
a single `ALLOWED_CLERK_USER_ID`, and no Kimi API credentials are configured.
Every visitor who clicks it hits a wall. **CUT** from the navbar; keep the route.

---

## 7. Marketing, content and identity

| Feature | Tag | Reasoning |
|---|---|---|
| Landing page | **REWORK** | See [`03-entry-flow-spec.md`](03-entry-flow-spec.md). Structurally it is a long single-column scroll of eight visually identical dark sections; the value proposition arrives as one long sentence, and there is one button. |
| Six-slide onboarding | **REWORK — make it non-blocking** | The content is good (active recall, hand care, focused/diffuse thinking) and it is the most *human* writing in the product. It is in the wrong place: a full-screen gate in front of the tool. Move it to an article and a dismissible card. |
| `lib/welcome-config.ts` + `/dev/welcome-lab` | **KEEP the config, CUT the public link** | Typed copy and style tokens in one file is a genuinely good pattern — it is how you will iterate the new landing page quickly. The 722-line public lab and its floating button should not ship to users. |
| Articles (4) | **KEEP + expand** | "Why I'm Learning Piano Without a Teacher" is the best-positioned content on the site and it is buried in a navbar link. The two research guides are strong but read as synthesis; the Anki setup guide is a good procedural doc. Four articles is not a "Learn" pillar yet. |
| Pricing + Founding Pro waitlist | **KEEP** | `BILLING_ENABLED = false` pre-launch, waitlist instead of a pricing table. Correct posture. |
| Terms / Privacy | **KEEP** | Shipped, public, discloses PostHog / Sentry / Convex. |
| Theme system (6 presets) | **REWORK** | Amber, Rose, Emerald, Ocean, Violet, Slate — but each preset swaps a *single* brand hue. There is no second axis, so every theme is still "one colour on charcoal." This is the mechanical reason the app reads as flat. See [`03-entry-flow-spec.md`](03-entry-flow-spec.md) §4. |
| Brand mark | **DECIDE** | `DESIGN-PRINCIPLES.md` says the mark is a Chladni nodal figure. Commit `811c0b0` restored a plain Lucide musical note. The doc is stale; pick one and update the doc. |

---

## 8. Platform and operations — all KEEP

| Feature | Note |
|---|---|
| Clerk auth, `proxy.ts` route gate, `authorizedParties` | Hardened, tested, with an auth-bypass flag that is correctly refused on Vercel production. |
| Convex (8 tables) | Every table has a live write path. Query validators present. `optionalUserId` / `ensureUserId` conventions documented and tested. |
| Clerk Billing entitlement mirror + svix webhook | Shipped; manual Dashboard setup still pending. |
| PostHog analytics (3 events) | Deliberately minimal; no-op without a key; mirrored to `window.__analyticsEvents` for E2E. Good discipline. |
| Sentry + `beforeSend` PII scrubbing | Shipped. |
| CI (lint / unit / build / E2E) | Real gate. The E2E job takes a global lock because all runs share one Clerk dev test user — a known, documented constraint, not an accident. |
| 861 unit + 75 E2E tests | Verified passing during this audit. |

---

## 9. Known technical debt — real, but not urgent

Listed so it is written down, not because it should be scheduled now.

- **Lab UI duplication.** Quasiperiodic and Multigrid labs each define their own
  private copies of `ControlGroup`, `Label`, `NumberInput`, `RangeControl`,
  `RangeInput`. Roughly 40–50% of lab UI is repeated boilerplate. Archiving the
  labs makes this moot — which is the cheapest possible fix.
- **Nine near-identical settings hooks.** `useArpeggioSettings`,
  `useChordDrillSettings`, `useProgressionSettings`, `useRootCyclingSettings`,
  `useHeroAtmosphereKind`, `useHeroChladniSettings`, `useHeroMultigridSettings`,
  `useHeroQuasiperiodicSettings`, `useLogoMarkSettings` all repeat: read
  `localStorage` → query Convex when `canPersist` → hydrate → push on change.
  One `usePersistedSetting<T>()` primitive replaces all of them.
- **`hooks/useChordDrill.ts` is 942 lines with no direct test.** Its pure helpers
  in `lib/chord-drill.ts` are tested; the state machine is not. This is the
  highest-risk untested surface in the app.
- **SEO basics missing.** No `robots.ts`, no `sitemap.ts`, no `not-found.tsx`, no
  `title.template`. Cheap, and it matters the day you launch.
- **Workshop tiles cannot be resized by keyboard.** Reordering works via dnd-kit's
  keyboard sensor; resizing is pointer-only.

---

## Summary table

| Tag | Count | Headline items |
|---|---|---|
| **KEEP** | 24 | Workshop, 4 drills, technique, tracking, MIDI, audio engine, Anki, auth, Convex, CI, articles, pricing |
| **REWORK** | 9 | Landing, onboarding, the two "marketplaces", blocks, music player, tracking presentation, theme system, Chladni Ripple |
| **ARCHIVE** | 8 | Julia, Lissajous, Quasiperiodic, Multigrid, custom sound-kit upload, per-route ambient, float panel, saved lab patterns |
| **CUT** | 3 | Logo Lab from the sidebar, chat from the navbar, dev-lab button from public pages |

**Net effect on the user's mental model:** the sidebar goes from ~19 destinations
to about 9, and every remaining one is something a person learning piano would
recognise as useful.
