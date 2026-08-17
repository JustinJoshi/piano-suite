# Custom Drill Builder ("Practice Workshop") — Research & Architecture Plan

Status: research complete, pre-implementation. This doc captures (1) market research on
comparable products and monetization, (2) an inventory of reusable building blocks already
in the codebase, and (3) an architecture for letting users compose their own practice
drills from those blocks, save them, and eventually share them.

## 1. Concept

A "build your own practice tool" feature: users compose a custom drill page from
pre-built blocks (metronome, note-sequence targets, chord sets, timers, scoring,
visual feedback), configure each block's knobs, save the layout to their account, and
have it re-rendered on each visit. No user-authored code — only configuration of
existing, reviewed components. Later phases add sharing ("remix this drill") and,
optionally, a curated marketplace.

Pitch shorthand: "Chessable for piano drills" meets a lightweight, music-specific
block builder.

## 2. Market research

### 2.1 learnchess.ai (the direct comparable)

Verified facts (sources checked 2026-08):

- Solo founder: Nikolas Burk (ex-Prisma employee #3, Staff Developer Advocate). Built
  heavily with AI coding agents — same development style as this project.
- Product: freemium chess-improvement app (web + iOS + Android). Lessons, puzzle
  trainer, game import + Stockfish analysis with an AI coach (Gemini) that explains
  moves in plain English, opening repertoire builder, streaks/gamification
  ("Pawns" currency), a free Chrome extension, and programmatic-SEO lesson content
  localized into ~13 languages.
- Pricing: Pawn (free, metered) / Knight ~$4.99/mo / Queen ~$12.99/mo via RevenueCat.
- Launch strategy: a Show HN (2026-03-07) that got **2 points, 1 comment**; no Product
  Hunt launch, no Reddit presence found, no build-in-public MRR posts, no YouTube demo
  found. The visible acquisition engine is programmatic SEO + free tools (extension,
  free course) as top-of-funnel.
- Traction: Google Play shows **"50+ downloads"**, App Store **0 ratings**, no
  traffic data on SimilarWeb/Semrush, no revenue disclosures anywhere.

Takeaways:

1. **Distribution is the hard part, not the product.** A polished, feature-rich app
   from a credible founder, three months after launch, has ~50 mobile downloads.
   Product quality alone does not produce users.
2. The channel that appears to be working for them is **programmatic SEO**
   (localized "how to play the Sicilian" style content). A piano equivalent
   (chord guides, "how to practice X" articles) is cheap to produce and compounds.
3. **Free tools as acquisition surface** — the Chrome extension and free course exist
   to be discovered and shared, then the AI coach (their expensive-to-serve feature)
   is metered hardest. Maps directly onto this project's Free/Pro split.
4. The founder's personal story ("stuck at 1600 for 4 years") is the entire
   marketing. An authentic "self-taught pianist" narrative is the equivalent asset
   here — it cannot be outsourced to AI copy.
5. An expensive `.ai` domain is not evidence of revenue. There is no public evidence
   learnchess.ai is profitable; assume it is not yet.

### 2.2 Does a customizable piano drill builder already exist?

Closest products by customization depth:

| Product | What users can customize | What it lacks |
|---|---|---|
| EarMaster Cloud (Teacher) | Compose exercise sets from an activity library, assign to students | School-B2B only, ear-training not MIDI performance, no marketplace |
| IWasDoingAllRight ear trainer | Script custom drills in an ABC-like DSL, saved to account | No MIDI input scoring, no sharing, solo side project |
| musictheory.net Exercise Customizer | Tune parameters of fixed exercise types, share via URL | No accounts, no new drill types, no marketplace |
| SightReadingFactory | Deep generation parameters (keys, rhythms, ranges, tempo) | Generates sheet music; no interactive drill logic |
| Piano Marvel | Teachers upload MIDI/MusicXML, build custom curricula | Content upload, not drill-mechanics authoring |
| Synthesia (+ community) | Import any MIDI file; informal file sharing | Songs, not drills with scoring rules |
| Modacity / Andante / Tonara et al. | Practice lists, timers, assignments with attached media | No interactive drill engine at all |
| Simply Piano / flowkey / Yousician / Skoove / Melodics / Playground Sessions | Nothing — fixed curated curricula | Everything above |

Marketplace analogues and outcomes:

- **Chessable** — the model to study. Anyone can author a course; authors get 40% of
  net revenue, platform keeps 60% and sets pricing. $3M+ paid to authors by 2021,
  Q1 2021 revenue +337% YoY, acquired by Play Magnus Group then Chess.com (~$80M
  deal). Caveats: earnings concentrate among famous authors; Chessable is **curated**
  UGC with editorial control, not an open bazaar; it succeeded because chess players
  were already habituated to paying for courses.
- **Anki shared decks** — enormous free UGC ecosystem, no official marketplace;
  monetization happens off-platform. Proof of demand, and proof that
  discovery/quality control is the hard part.
- **Rocksmith CDLC (CustomsForge)** — a decade-old community authoring playable
  charts with dedicated tooling, entirely free, in a copyright grey zone the official
  platform won't touch. Musicians *will* author practice content at scale when
  tooling exists.

Gap assessment: the specific combination — **composable interactive drill blocks
(metronome + note targets + chord sets + timers + MIDI scoring), saved per-user,
shareable** — appears unoccupied. Every existing product has at most one or two of
the legs (parameterization, teacher authoring, marketplace, community content). Nobody
in piano does block-composition of drill *mechanics*.

Honest caveat: existing demand signals (teachers hacking musictheory.net URLs, media
attachments in assignment apps, CDLC tooling) show people want custom practice
*content*. Whether they will compose drill *logic* is the unproven bet. The builder
should ship first as a personal tool ("build the drill you need"), with sharing as a
later phase gated on evidence that people build drills at all.

### 2.3 Monetization options for this project

In rough order of fit with the current Free/Pro (Clerk Billing) setup:

1. **Keep the current freemium gate**: builder usage free (localStorage), cloud sync +
   publishing to the gallery Pro-only. Lowest risk, uses existing `canPersist`
   plumbing. This is the learnchess.ai tier shape ($0 / ~$5 / ~$12).
2. **Marketplace rev-share (Chessable model)** — only viable after the gallery has
   proven supply and demand; requires payment rails for authors (Stripe Connect or
   similar) and curation. Phase 5+, not a starting point.
3. **Teacher tier** — the strongest *paying* audience found in research is teachers
   (EarMaster, Piano Marvel, Tonara all monetize teachers, not students). "Create a
   drill, send the link to your students, see their results" is a plausible paid tier
   later.
4. **Programmatic SEO** is not monetization but is the acquisition channel with the
   best evidence in this space; budget writing time for it before any paid ads.

## 3. Codebase inventory (what's already reusable)

Full inventory from the codebase audit. Ranked cleanest-first:

1. **`lib/music-theory.ts`** — chord vocabulary, parsing, target building. Pure,
   zero deps. This is the "what to practice" vocabulary of the builder.
2. **`lib/scoring.ts`** — `evaluateChordAttempt` / `evaluateSequenceAttempt` cover
   both drill archetypes (blocked chords, ordered sequences). Pure.
3. **`lib/midi-session.ts` + `hooks/useMidi.ts`** — tab-scoped MIDI singleton;
   `{heldNotes, heldPcs, connect, inputs, ...}`. One input device at a time, global
   events — fine for one drill at a time.
4. **`components/drills/midi-connection-bar.tsx`** — props-driven connection UI.
5. **`hooks/useDrillTimer.ts`** — generic phase state machine
   (idle → countdown → armed → timing → success → break → finished) with
   countdown/break/multi-rep knobs. **Only chord-drill uses it** — the other three
   engines hand-roll timing loops (see coupling problems below).
6. **`hooks/useAudio.ts`** — chimes/ticks/metronome. `startMetronome(bpm, onBeat)`.
   The only metronome *UI* is embedded in `technique-tracker.tsx`; no standalone
   Metronome component exists yet — extracting one is the natural first block.
7. **`components/drills/drill-shell.tsx`** — generic tool page layout.
8. **Settings persistence pattern** — `XSettings` type + defaults + key +
   `normalizeSettings(raw)` + hybrid localStorage/Convex hook (canonical:
   `useHeroMultigridSettings.ts`). Reuse this shape for custom-drill config.
9. **`lib/sequence-drill.ts`** — sequence-drill data model, ordering, miss grading.
   Already config-shaped.
10. **`components/drills/saved-patterns-panel.tsx` + `convex/savedPatterns.ts`** —
    named JSON snapshot save/load per user per tool. Nearly a ready-made "my drills"
    backend and the structural precedent for a `customDrills` table.
11. **`hooks/useAnkiSync.ts` + `lib/anki.ts`** — optional "Anki source" block.
12. **Grading helpers** (`gradeForTime`, `gradeForMisses`) — pure; need a unified
    grade type.
13. **Visualization components** (`*-visualization.tsx`, `useChladniRipple`) —
    props-driven canvases; usable as "feedback display" blocks.
14. **`lib/technique.ts`** — streak/habit grid logic, pure.
15. **`lib/tools.ts` registry** — where a `custom` category of user drills would
    register. Note: `components/tools/sidebar.tsx` duplicates this list inline and
    should consume the registry first.

Existing config-driven-rendering precedents to copy: `lib/welcome-config.ts` (typed
config + validator + dev lab editor UI), `lib/ambient-effects.ts` (per-route config +
normalizer + hybrid persistence), hero settings blobs. These prove the "store a
config, render from it, edit in a lab UI" pattern already works in this codebase.

### Coupling problems to fix before/while building

1. **Engine monoliths** — `useChordDrill.ts` (942 lines), `useArpeggios.ts` (853),
   `useRootCycling.ts` (571), `useProgression.ts` (483) each fuse target selection,
   timing, scoring, Anki, logging, and ~15 settings into one hook. The builder needs
   these ideas as composable blocks, not one fused engine per tool.
2. **Three duplicated timing loops** — arpeggios/root-cycling/progression hand-roll
   RAF timing instead of using `useDrillTimer`. Adopt or extend DrillTimer rather
   than writing a fifth loop for custom drills.
3. **Per-tool Convex logging** — `convex/tracking.ts` hardcodes tool names in its
   mutations/queries. Need a generic `logPracticeEvent({tool, payload})` +
   list-by-tool query. The `practiceEvents.tool` string column and `by_user_tool`
   index already support this.
4. **Hardcoded drill content** — arpeggio cells, the two progression types, and
   root-cycling's degree set are compile-time constants, not data. Custom drills need
   user-supplied content as config.
5. **No shared settings-UI kit** — `ToggleGroup`/`SettingRow`/sliders are copy-pasted
   inside drill views. The builder's per-block config forms need a real widget set
   keyed by field types.

## 4. Architecture

Researched how mature block-based builders store and render user config (Puck,
Builder.io, Storyblok, Shopify sections, Retool, Appsmith, n8n, Zapier). They all
converge on the same model; we adopt it directly.

### 4.1 Data model: component registry + ordered block list

A custom drill is stored as an ordered array of blocks. Each block is
`{ id, type, props }` — `type` is a string key into a client-side registry, `props`
is plain JSON validated by a zod schema that lives in the registry. Nesting
(`children`) is deferred; a flat ordered list covers metronome/notes/chords/timers.

```ts
// convex/schema.ts (new table)
customDrills: defineTable({
  ownerId: v.id("users"),
  name: v.string(),
  schemaVersion: v.number(),                  // integer, starts at 1
  blocks: v.array(v.any()),                   // zod-validated in the mutation
  forkedFrom: v.optional(v.id("customDrills")), // flattened to root original
  isPublic: v.boolean(),                      // Phase 3 sharing gate
  updatedAt: v.number(),
})
  .index("by_owner", ["ownerId"])
  .index("by_public", ["isPublic"]),
```

Free tier: drills live in localStorage (existing `lib/local-practice-history.ts`
pattern). Pro (`canPersist`): Convex sync. This matches every other settings surface
in the app.

### 4.2 Block registry (client-side)

```ts
// lib/drill-blocks/registry.tsx
export const blockRegistry = {
  metronome: {
    label: "Metronome",
    schema: z.object({
      bpm: z.number().min(30).max(300).default(90),
      beatsPerBar: z.number().int().min(1).max(12).default(4),
    }),
    fields: [/* form descriptors for the editor, Puck-style */],
    render: MetronomeBlock,   // wraps hooks/useAudio metronome
  },
  noteSequence: { /* targets via lib/music-theory + lib/sequence-drill */ },
  chordSet:     { /* targets via buildPitchClassSet, quality groups */ },
  drillTimer:   { /* wraps useDrillTimer knobs */ },
  feedbackViz:  { /* props-driven canvas viz */ },
  // ...
} as const;
```

Renderer: map blocks → registry lookup → `schema.safeParse(props)` **at render
time** (stored data is untrusted) → render component with `parsed.data` only.
Unknown types: skip + log. `parsed.data` strips undeclared props automatically.
No `eval`, no `dangerouslySetInnerHTML`, no stored expression strings — blocks are
pure config of existing reviewed components, so we inherit none of the
Appsmith/Retool sandboxing burden. Validate again in the Convex mutation on save.

### 4.3 Editor

A sortable vertical list (dnd-kit) of blocks + a per-block config form generated
from the registry's `fields` descriptors + an add-block palette. No absolute
positioning, no free canvas — every mature builder aimed at non-developers
(Shopify, Squarespace, Gutenberg, Notion, Puck) uses structured flow layout because
responsive reflow is free and users can't produce broken layouts. Optional per-block
`span` prop later for half-width desktop layout. Mobile-first per
DESIGN-PRINCIPLES.md.

Editor chrome uses the theme token system and `DrillShell`; the "shop/marketplace"
visual treatment (floating tool motifs in the background) can reuse the ambient
effects layer (`lib/ambient-effects.ts`) for the palette page.

### 4.4 Versioning discipline (learned from Appsmith/Shopify/n8n)

- Explicit `schemaVersion` integer + a short on-read migration chain. Structural
  detection (Puck's approach) collapses as the chain grows.
- 90% of changes need no migration: **additive props ship with zod `.default()`s;
  removed props are stripped and ignored.** Reserve migrations for renames.
- Once a public gallery exists, adopt the Zapier policy: additive registry changes
  auto-work; breaking changes mark affected public drills invalid.

### 4.5 Build vs. adopt a library

Considered: Puck (closest match but pre-1.0 API churn + its editor chrome fights the
theme system), react-grid-layout v2 (dashboard semantics, wrong for a practice page),
hand-roll with dnd-kit. **Decision: hand-roll the registry + editor with dnd-kit for
reordering, using Puck's data model (`type` + `props` + ordered array) verbatim** so
Puck can be adopted later without a data migration. The registry is ~100 lines; the
valuable part of these libraries is the data model, which is free to copy.

### 4.6 Sharing & marketplace mechanics (later phases)

The dominant pattern everywhere (CodePen, Scratch, Notion templates, n8n templates):
**public read-only view + explicit "Duplicate to my drills" producing a detached
snapshot + `forkedFrom` flattened to the root original** (CodePen model). No
live-linking consumers to the author's drill. Attribution line on public views.
Marketplace payments (Chessable 40/60-style) only after the gallery shows organic
supply and demand; requires Stripe Connect + curation workflow — deliberately out of
scope for the first build.

## 5. Phased build order

1. **Phase 1 — registry + renderer + storage, no editor.** Extract a standalone
   Metronome block from `technique-tracker.tsx`; define `blockRegistry` with zod
   schemas for the first ~5 blocks (metronome, note-sequence, chord-set, drill-timer,
   feedback text); `customDrills` table + mutations with `blocksSchema` validation;
   `DrillRenderer`; seed one drill by hand; Vitest schema round-trip tests
   (convex-test for auth edge cases per AGENTS.md).
2. **Phase 2 — editor.** dnd-kit sortable block list, per-block forms from `fields`
   descriptors, add/remove palette, save mutation, localStorage path for Free users.
3. **Phase 3 — generic tracking.** `logPracticeEvent({tool, payload})` mutation +
   generic list-by-tool query so custom drills appear in Tracking; sidebar consumes
   `lib/tools.ts` registry so custom drills can register a `custom` category.
4. **Phase 4 — sharing.** `isPublic`, read-only public route, "Duplicate to my
   drills" with flattened `forkedFrom`, attribution line, public gallery page.
5. **Phase 5 — versioning infrastructure** before the first breaking registry change:
   `migrateBlocks(blocks, fromVersion)` chain on read.
6. **Phase 6 (optional, only with evidence)** — marketplace: paid drills, author
   payouts (Stripe Connect), curation/review queue, invalid-drill policy.

Ongoing refactor stream (can interleave): adopt `useDrillTimer` in the three engines
that hand-roll timing; extract the shared settings-widget kit; unify grade types.
Each refactor shrinks what the builder has to special-case.

## 6. Open questions to decide before Phase 1

- Is custom-drill storage Pro-only, or Free-localStorage + Pro-sync (recommended,
  matches every other surface)?
- First-block set: is {metronome, note-sequence, chord-set, timer, feedback} the
  right MVP, or should one full existing drill (e.g. chord-drill) be reproducible as
  a config first as a forcing function?
- Does the builder live at `/tools/workshop` (a tool) or `/workshop` (its own
  section)? It is both an editor and a gallery; a separate section is likely cleaner.
- Naming: "Workshop" fits the community positioning better than "Marketplace" until
  money is involved.

## Sources

Key references consulted for this plan:

- learnchess.ai: site, /pricing, /about, privacy policy; Show HN
  (news.ycombinator.com/item?id=47287155); App Store / Google Play listings;
  nikolasburk.com.
- Chessable marketplace terms and outcomes: Chessable contest FAQ and forums,
  Chess.com news, Play Magnus investor announcement.
- Competitor feature checks: EarMaster, musictheory.net FAQ, SightReadingFactory,
  Piano Marvel, ToneGym, Modacity/Andante comparisons, CustomsForge.
- Builder internals: puckeditor/puck (Data model, slots, migrate.ts), Builder.io
  custom components docs, Storyblok Management API, Shopify JSON templates docs,
  Appsmith DSL migrations, n8n node versioning docs, Zapier integration versioning
  docs, CodePen forks docs.
