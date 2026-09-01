# Tier 0 — Implementation Plan: Make the Workshop the Felt Center of the App

Status: pre-implementation. This is the build plan for **Tier 0** of
`docs/workshop-first-ux-plan.md` — the highest-impact slice. It turns four
items (0.1–0.4) into concrete, code-referenced work:

- **0.1** Seed the marketplace: a starter-template registry (client-side).
- **0.2** Rewrite the landing hero around the Workshop.
- **0.3** Restructure the landing page into a funnel ending at the Workshop.
- **0.4** Replace the Workshop's blank first-run with a template picker.

Goal (measurable): **a brand-new user can complete one drill rep in their first
session within 2 clicks of landing, with zero prior knowledge** — and the first
thing they read on the homepage tells them what the app is.

---

## Key architectural decision (read first)

Templates live **client-side in a typed registry**, not in Convex. Rationale:

1. The first-run picker (0.4) and the landing strip (0.3) need templates
   **synchronously**, without a network round-trip.
2. Templates must work for **signed-out and Free users** — the picker can't
   depend on `canPersist`/Convex.
3. Blocks are already `{ id, type, version, config }` JSON (`lib/feature-blocks/types.ts`);
   a template is just a `PracticePage` without an id. The page store
   (`lib/custom-practice-storage.ts`) already ingests arbitrary `PracticePage`s,
   and `lib/feature-blocks/schemas.ts` already has `normalizeStoredBlock` for
   sanitizing them.

The community gallery (`/workshop`) remains Convex-backed; starter templates are
a **separate, curated concept** surfaced *above* community drills. This is the
Chessable/Anki "seed supply before demand" move without needing an official
account + publish pipeline.

## Shared data model

```ts
// lib/starter-templates.ts
import type { LucideIcon } from "lucide-react";
import type { FeatureBlock, PracticePage } from "@/lib/feature-blocks/types";

export type StarterTemplate = {
  id: string;                 // stable slug, e.g. "first-chords"
  title: string;              // e.g. "First chords (C · F · G)"
  description: string;        // one-line outcome, e.g. "Play 7th chords cleanly in time"
  category: StarterCategory;  // grouping for the picker
  icon: LucideIcon;
  blocks: FeatureBlock[];     // authored with `version: 1`, placeholder ids
};

export type StarterCategory = "getting-started" | "chords" | "rhythm" | "technique";
```

Helpers (pure, unit-testable):
- `starterTemplates: StarterTemplate[]` — the catalog.
- `normalizeStarterTemplate(raw: unknown): StarterTemplate | null` — validate
  `id`/`title`/`category` and run every block through `normalizeStoredBlock`
  (drops unknown types, re-normalizes config via each block's `normalizeConfig`,
  enforces `MAX_BLOCKS_PER_PAGE`). Unknown template types are skipped.
- `buildTemplatePage(template, baseTitle?): PracticePage` — returns
  `{ id: generateId(), title, blocks: <deep-copy with fresh generateId() per block>, updatedAt: Date.now() }`.
  Reuses `generateId` from `lib/custom-practice-storage.ts:250`.

`generateId` and the block normalizers are already exported, so no new plumbing
is required — this is a ~150-line pure module.

---

## 0.1 — Starter-template registry (the "plug and play" content)

**Files:** new `lib/starter-templates.ts`, new
`lib/__tests__/starter-templates.test.ts`.

**What:** 8 starter templates built only from blocks that exist today
(`metronome`, `drillTimer`, `chordSet`, `textBlock`, `midiConnectionBar`).
Each `blocks` array is authored as valid `FeatureBlock[]` using each block's
`defaultConfig` + overrides. Catalog (subject to final copy):

| id | Category | Blocks (order) | One-line outcome |
|---|---|---|---|
| `first-chords` | getting-started | textBlock (how to), chordSet (C·F·G, 7th, sequential), drillTimer (3s/5s), midiConnectionBar | Play 7th chords in C, F, G, in time |
| `all-twelve-keys` | chords | textBlock, chordSet (all 12 roots, 7th, random, multiRep), drillTimer, midi | Run one chord through every key |
| `chord-qualities` | chords | chordSet (root C, qualities 7th/maj7/min7/dim7, random), drillTimer, midi | Hear and hit four chord colors |
| `ii-v-i-warmup` | chords | textBlock (ii–V–I voicing guide), chordSet (C·F·Bb·Eb roots, sequential), drillTimer, midi | Cycle ii–V–I roots as a warmup |
| `metronome-sprint` | rhythm | metronome (bpm 80, 4/4, accent), drillTimer (multiRep), textBlock | Five minutes of steady time feel |
| `beginner-rhythm` | rhythm | metronome (3/4), textBlock (counting hint), drillTimer | Lock in 3/4 subdivision |
| `daily-technique` | technique | textBlock (hand-care + warmup), metronome (bpm 60), drillTimer | Ten-minute daily warmup |
| `quick-notes` | getting-started | textBlock (prefilled), midiConnectionBar | A blank notes page with MIDI ready |

Deferred (needs a sequence/arpeggio block — see Tier 1.4(b) of the parent doc):
`arpeggio-cells`, `progression-drill`.

**Acceptance:** `npm run test:unit:run` passes the new spec —
`normalizeStarterTemplate` accepts all 8 authored templates unchanged, rejects
unknown block types / bad ids / >30 blocks, and `buildTemplatePage` produces a
`PracticePage` with unique block ids and valid configs.

**Risks:** template content quality is subjective — write them so each has an
immediately visible "what to do" textBlock and a runnable timer/chord target.
No Convex/`@/`-alias issues (this module is client-only, unlike `schemas.ts`).

---

## 0.2 — Rewrite the landing hero around the Workshop

**Files:** `lib/welcome-config.ts` (copy), verified via `/dev/welcome-lab`.

All hero copy is config-driven (`defaultWelcomeConfig.hero`,
`lib/welcome-config.ts:104-113`) and renders through `hero-section.tsx`. Proposed:

```ts
hero: {
  eyebrow: "a free workshop for self-taught pianists",
  headline: "Build your own piano practice — or grab a drill and start playing.",
  subheadline:
    "Snap metronome, timer, and chord blocks together into your own drills, start instantly from a starter template, and share what you build with other self-taught pianists.",
  ctaText: "Enter the Workshop",
  ctaHref: "/tools",        // already 307-redirects to /tools/workshop
  align: "left",
}
```

Also update the **hardcoded** secondary line in `hero-section.tsx:90-99`
(currently the Anki/MIDI disclaimer) to a workshop-focused reassurance, e.g.
*"No account needed to browse the community gallery. Build and save with a free account."*

**Acceptance:** hero no longer names Anki/MIDI as the lead; a squint test shows
exactly one dominant headline + one CTA. Copy remains fully editable in
`/dev/welcome-lab` (no JSX changes beyond the secondary line).

---

## 0.3 — Restructure the landing page into a Workshop funnel

**Files:** `components/welcome/welcome-content.tsx` (order), new
`components/welcome/how-it-works-section.tsx`, new
`components/welcome/starter-templates-section.tsx`,
`components/welcome/tools-grid-section.tsx` (filter + title),
`components/navbar.tsx` (gallery link), `lib/welcome-config.ts` (new config
blocks + validators).

### New section order (top → bottom)

1. `Navbar` (+ gallery link)
2. `HeroSection` (0.2)
3. **NEW `HowItWorksSection`** — 3 steps: *Pick a starter or ready-made drill →
   Press start and play, timed on real keys → Tweak it or build your own.*
4. **NEW `StarterTemplatesSection`** — render 3–4 `starterTemplates` cards +
   a `"Browse the community gallery →"` link to `/workshop`.
5. Existing evidence sections (keep, reframed as *why the drills work*):
   `why-it-works`, `the-actual-point`, `not-new`, `companion-deck`, `who-made-this`.
6. `ToolsGridSection` — **demoted**: filter out the workshop card and retitle.
7. `CtaSection`
8. Footer

### Config additions (`lib/welcome-config.ts`)

Add two blocks to `WelcomeConfig` + `defaultWelcomeConfig` + `validateWelcomeConfig`
(each with fallbacks, following the existing `clampArray`/`isValid*` pattern):

```ts
howItWorks: { eyebrow: string; title: string; steps: WelcomeFlowStepConfig[] };
templateStrip: { eyebrow: string; title: string; subtitle: string; browseHref: string };
```

Reuse the existing `WelcomeFlowStepConfig` shape (already validated) for steps.
Default steps:
- `pick` — "Pick a starter drill, or start from scratch"
- `play` — "Press start and play it, timed, on real keys"
- `build` — "Tweak the blocks — or build your own page"

### Component changes

- `tools-grid-section.tsx`: import the group arrays instead of flat `tools`
  (`[...drillTools, ...insightTools, ...labTools]`, from `lib/tools.ts`) so the
  Workshop card is excluded; retitle via `config.toolsGrid` to
  `"Also in the toolkit"` / `"Focused drills, progress tracking, and visual labs."`
- `navbar.tsx`: add `{ label: "Gallery", href: "/workshop" }` to `navLinks`
  (`components/navbar.tsx:15-20`). **Hotspot file** — coordinate with any
  parallel agent before editing.
- `welcome-content.tsx`: reorder sections; insert the two new components.

**Acceptance:** a first-time visitor, reading top-down without scrolling,
understands (a) the app is a workshop/builder, (b) there are pre-made drills to
start with, (c) other tools exist but are secondary. Workshop card is absent
from the tools grid; gallery reachable from navbar + template strip.

**Risks:** `welcome-content.tsx` section order is hardcoded (matched by `id`,
not config order) — the reorder is a JSX edit, not config. Keep new sections
config-driven for future `/dev/welcome-lab` editing.

---

## 0.4 — First-run template picker (replace the blank canvas)

**Files:** new `components/custom-practice/starter-picker.tsx`, new
`hooks/useStarterPicker.ts` (or inline), edit
`components/custom-practice/practice-page-editor.tsx`, optional edit
`components/custom-practice/page-switcher.tsx`.

### Behavior

- **Show** the picker when all of: store has exactly one page AND it is empty
  (`blocks.length === 0`), and the user hasn't dismissed it.
- **Dismiss flag** in its own localStorage key (e.g.
  `piano-suite:starter-picker-dismissed-v1`) so returning users are never nagged
  — do **not** infer "seen" from page content, since a genuinely empty page is
  a valid long-term state. Export `resetStarterPicker()` for tests/dev.
- Three actions:
  1. **"Start from a template"** — grid of `starterTemplates` (grouped by
     category). Selecting calls `setPracticePageStore(upsertPracticePage(store, buildTemplatePage(template)))`
     and dismisses. The new page becomes active and the blocks are immediately
     live/runnable.
  2. **"Start from scratch"** — dismisses, revealing the existing empty page +
     its "Add feature" button (current behavior).
  3. **"Browse the community"** — `Link` to `/workshop`.
- **Persistent "New from template"**: add a small "Templates" affordance to the
  editor so the picker is reachable after first run — simplest is a `Templates`
  button in the editor header or a "New page from template" entry in
  `PageSwitcher`. Scope this to a single button that re-opens `StarterPicker` in
  a modal/panel.

### Wiring

Render `StarterPicker` from `PracticePageEditor` (it already owns the store +
`userReady` is guaranteed by the page gate in `app/tools/workshop/page.tsx`).
Keep the picker a thin component; the store mutation uses the existing
`upsertPracticePage` + `setPracticePageStore` (no new storage layer).

**Acceptance:** new user lands in Workshop → sees the picker (never a bare
"Add feature" empty state on first visit) → "Start from a template" → a
runnable drill is on screen → press Start → completes a rep. Revisit: no picker
unless they cleared it. E2E spec covers the happy path.

**Risks:** the picker must not flash on Pro users whose Convex pages are still
loading (`userReady` gate already prevents this). `starter-picker-dismissed`
should be set on **any** picker action, including "browse community", to avoid
re-showing after navigation back.

---

## Tests

- **Unit (`npm run test:unit:run`):**
  - `lib/__tests__/starter-templates.test.ts` — normalize + build helpers (0.1).
  - `components/custom-practice/__tests__/starter-picker.test.tsx` — renders
    catalog, selecting a template writes the store and dismisses, dismissal
    persists (React Testing Library, following existing `components/**/__tests__`).
  - `lib/welcome-config` — new `howItWorks`/`templateStrip` fields validate
    with defaults and survive partial config (extend existing welcome-config
    tests if present).
- **E2E (`npm run test:e2e`):** new `e2e/workshop-starter.spec.ts` — signed-in
  first-run sees picker, starts a template, completes a timer rep; second visit
  skips picker; landing page shows template strip + gallery link and no workshop
  card in the grid.

## Build order (dependency-safe)

1. **0.1** — registry + helpers + tests (nothing depends on it being surfaced).
2. **0.4** — picker (consumes 0.1) + editor wiring + tests.
3. **0.2** — hero copy (independent; land any time).
4. **0.3** — landing restructure (consumes 0.1 for the template strip) +
   navbar gallery link.

Each is an independently shippable PR. 0.1 and 0.4 together deliver the
activation win even before the landing page is restructured.

## Out of scope (later tiers)

Signed-out workshop preview (2.3), "Save a copy" fork button (1.1), gallery
discoverability beyond the navbar/strip (1.2), practice-mode separation (1.3),
free-tier save feedback (2.2), onboarding deck changes (2.5), sequence/arpeggio
blocks (1.4b).

## Hotspot coordination

Touches `components/navbar.tsx` (hotspot) and `lib/welcome-config.ts`. No
`convex/schema.ts`, `app/layout.tsx`, `components/ui/*`, or lockfile changes.
Notify any parallel agent before editing `navbar.tsx`.
