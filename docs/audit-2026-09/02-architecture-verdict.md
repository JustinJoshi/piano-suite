# Architecture Verdict — can this codebase host a workshop + marketplace?

**Question asked:** is the existing component architecture modular enough to
support users assembling their own practice tools from pre-verified components —
manually or via an AI that only *arranges* known-good pieces — and sharing them
in a marketplace as lightweight JSON?

**Answer:** Yes. The hard parts are done. What is missing is inventory, three
pieces of metadata, and one bug fix.

---

## 1. What already exists (and is better than you probably think)

### A page is already a marketplace payload

```typescript
// lib/feature-blocks/types.ts
export type FeatureBlock = {
  id: string;
  type: string;
  version: number;
  config: Record<string, unknown>;
  size?: BlockSize;
};

export type PracticePage = {
  id: string;
  title: string;
  blocks: FeatureBlock[];
  updatedAt: number;
};
```

That is the "lightweight JSON references to component IDs" you described. It
already exists, it is already what gets written to `localStorage` and to the
Convex `customDrills` table, and it is already what a published page transmits.
No migration is required to make sharing work — sharing already works.

### The component contract is the right abstraction

```typescript
// lib/feature-blocks/types.ts
export type FeatureDefinition<C extends Record<string, unknown>> = {
  type: string;
  category: FeatureCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  fields: FieldDescriptor[];
  defaultConfig: C;
  normalizeConfig: (raw: unknown) => C;
  component: ComponentType<C>;
};
```

Five things a composable component system needs, all present: an identity, a
declared configuration surface (`fields`), safe defaults, a normalizer that
turns arbitrary input into valid config, and a renderer. The `FieldDescriptor`
union (`range`, `select`, `toggle`, `checkbox-group`, `text`) means the editor
UI is generated from data rather than hand-written per block — which is also
exactly what an AI composer would read to know what it is allowed to set.

### Untrusted JSON is already defended

This is the property your bounded-AI idea depends on, and it is already true.
`lib/feature-blocks/schemas.ts` is deliberately kept free of React imports so
Convex can run it server-side, and `convex/workshop.ts` runs every incoming page
through it:

- Unknown block types are **dropped**, not rendered (`blockNormalizers[type]`
  lookup returns nothing → block discarded).
- Every config value goes through that block's `normalizeConfig`, which clamps
  numbers to range and filters enum values to the known set.
- Hard caps: 30 blocks per page, 8 KiB per block config, 80-character titles.
- There is **no code-execution path** from a shared page. A malicious payload's
  worst case is a page with fewer blocks than intended.

So the guarantee you wanted from "the LLM composes, it doesn't write logic that
can break" is enforced by the *storage layer*, independent of the LLM. The AI
could hallucinate freely and the system would still only render verified
components with in-range settings. That is a strong position and it was not an
accident — it is what the client/server split in `schemas.ts` is for.

### Sharing, gallery and fork are built

| Function | File | State |
|---|---|---|
| `listPublicDrills` | `convex/workshop.ts` | Shipped, no auth required |
| `getPublicDrill` | `convex/workshop.ts` | Shipped |
| `upsertCustomDrill` (with `isPublic`) | `convex/workshop.ts` | Shipped, normalizes on write |
| `forkCustomDrill` | `convex/workshop.ts` | **Shipped and tested — but no UI calls it** |
| `customDrills` table | `convex/schema.ts` | Has `isPublic`, `forkedFrom`, `authorName`, `by_public` index |

Nine tests in `convex/__tests__/workshop-sharing.test.ts` cover this. The
marketplace backend is not a future project; it is sitting there unused.

---

## 2. What is actually missing

### Missing thing #1 — inventory. This is the whole problem.

Six blocks. Three of them are practice tools.

| Block | Category | Is it a practice tool? |
|---|---|---|
| `metronome` | rhythm | Yes |
| `drillTimer` | technique | Yes |
| `chordSet` | theory | Yes |
| `textBlock` | technique | No — a note field |
| `midiConnectionBar` | rhythm | No — a status indicator |
| `drillShortcuts` | technique | No — a list of links |

The registry declares four categories — `rhythm`, `technique`, `theory`,
`visualization` — and **nothing occupies `visualization`.** The category list is
a statement of intent that the library never grew into.

Ask the concrete question: what would it take to build the founder's own example,
a **Moonlight Sonata trainer**? You would need to select a passage, loop it, hear
it, play along, ramp the tempo, and see whether you got it right. Not one of
those is expressible with the current six blocks. The honest answer today is
that you cannot build it, and neither could an AI, however well it arranged
things.

**But — and this is the important part — you already own most of the machinery.**

| Capability that exists in `lib/` or `hooks/` | Lines | Exposed as a block? |
|---|---|---|
| MIDI/audio file player with sample-accurate scheduling and global note events (`lib/music-player.ts`, `useMusicPlayer`) | ~1,000 | **No** |
| Sampled instrument engine, soundfonts, custom kits (`lib/audio-engine.ts`) | ~600 | No |
| MIDI-reactive Chladni visualization (`lib/chladni-ripple.ts`, `useChladniRipple`) | ~800 | No |
| Note-sequence drilling (`lib/sequence-drill.ts`, `useArpeggios`) | ~1,100 | No |
| Chord progression stepping (`lib/progression.ts`, `useProgression`) | ~700 | No |
| Random root generation (`useRootCycling`) | ~570 | No |
| Anki client + card sync (`lib/anki.ts`, `useAnkiSync`) | ~500 | No |
| Technique/BPM logging and streaks (`lib/technique.ts`) | ~200 | No |
| Practice stats and charts (`convex/tracking.ts`, `components/tracking/*`) | ~1,000 | No |
| Chord/scale theory and scoring (`lib/music-theory.ts`, `lib/scoring.ts`) | ~700 | Only inside `chordSet` |

**Roughly 7,000 lines of tested capability with no block wrapper.** The gap
between what Piano Suite can *do* and what a Workshop user can *assemble* is
enormous, and closing it is a wrapping exercise against existing tested code —
not new research.

That reframes your open question. You asked whether the library has enough
breadth to support open-ended creativity. It does not. But you are not starting
from zero and you are not blocked on inventing anything. You are blocked on
about a dozen adapter modules.

### Missing thing #2 — configuration does not reach the runtime

`components/custom-practice/drill-runtime-provider.tsx`:

```typescript
const runtime = useDrillRuntimeProvider({ pageId });
```

`hooks/useDrillRuntime.ts` accepts `countdownSeconds`, `breakSeconds` and
`requireExact` and hardcodes `multiRep: true` (line 138). None of the block
configs are threaded in. Result: `drillTimer`'s `countdownSeconds`,
`breakSeconds` and `multiRep`, and `chordSet`'s `requireExact`, `goodThreshold`
and `hardThreshold` are **editable in the UI and ignored by the app**.

For a marketplace this is not a cosmetic bug. If I publish a page tuned to my
level and you import it, you get the defaults, not my tuning. The thing being
shared is not the thing that was built. **Fix this before publishing anything.**

### Missing thing #3 — blocks coordinate implicitly

There is exactly one `DrillRuntime` per page, created by
`DrillRuntimeProvider`. `chordSet` pushes targets into it; `drillTimer` reads
phase from it. Two `chordSet` blocks on one page would fight over the same
runtime. Nothing in the registry says so.

For a human dragging tiles this is survivable. For an AI arranger it is a
correctness hazard, because the constraint is invisible in the data. The fix is
small: add declared capabilities to `FeatureDefinition`.

```typescript
// proposed addition to FeatureDefinition
requires?: readonly string[];   // e.g. ["drillRuntime", "midi"]
provides?: readonly string[];   // e.g. ["drillTarget"]
maxPerPage?: number;            // e.g. chordSet: 1
```

Now a composer — human, UI, or model — can validate an arrangement before it
renders, and the marketplace can reject an incoherent import with a real
message instead of silently misbehaving.

### Missing thing #4 — no machine-readable catalogue

`lib/feature-blocks/registry.ts` imports React components and Lucide icons, so it
cannot be loaded outside the client bundle. An AI composer needs the *metadata*
without the components: type, label, description, category, field descriptors,
defaults, and the `requires`/`provides` from above.

The split already exists in spirit — `schemas.ts` is the React-free half. Extend
it with a `blockCatalog` export: a plain-data array, servable as JSON, usable as
an LLM tool definition, and usable by CI to assert that every registry entry has
a catalogue entry.

### Missing thing #5 — the loop has no exit

`forkCustomDrill` exists and is tested. No component calls it. `/workshop/[id]`
offers "Copy link" and nothing else. A visitor can look at a shared page and
cannot take it. That is the difference between a gallery and a marketplace, and
it is one button plus a mutation call that already works.

---

## 3. Is a rebuild required?

No — and the evidence is quantitative, not just reassuring.

| Layer | Rebuild needed? | Why |
|---|---|---|
| Data model (`FeatureBlock`, `PracticePage`) | No | Already the exact JSON shape a marketplace needs |
| Storage (`localStorage` + `customDrills`) | No | Already versioned, already migrated once (v1→v2), already synced |
| Validation | No | Already server-side, already clamping, already dropping unknown types |
| Registry contract | **Extend** | Add `requires` / `provides` / `maxPerPage`, and a React-free catalogue export |
| Runtime | **Fix** | Thread block config through `DrillRuntimeProvider` |
| Block library | **Expand** | 6 → ~20, mostly by wrapping existing tested code |
| Marketplace UI | **Build** | Fork button, seeding, attribution, browse. Backend is done. |
| Grid / layout | No | 4-column span model with 26 unit tests |
| Auth / entitlements | No | Free = local, Pro = synced. Already correct for a marketplace. |

The invasive work is confined to two files (`registry.ts`, `types.ts`) plus one
new adapter directory per block. Nothing structural is at risk. You can ship the
first three new blocks without touching the grid, storage, sync, or auth.

---

## 4. The AI composer, concretely

You framed the constraint well: the model arranges known-good components, it does
not write code. Here is what that means as an implementation, in the order the
pieces should land.

1. **Catalogue** — export the React-free `blockCatalog` (missing thing #4).
2. **Validator** — a pure function `validateArrangement(blocks) → {ok, errors}`
   enforcing `requires`/`provides`/`maxPerPage` and re-running each
   `normalizeConfig`. Fully unit-testable with no model involved.
3. **Tool interface** — the model's only output is
   `{ title, blocks: [{ type, config }] }`. Anything else is rejected.
4. **Pipeline** — model output → `normalizeStoredPage` → `validateArrangement` →
   render preview → user confirms → save. The model never touches storage.
5. **Fallback** — if validation fails, show the user the nearest valid
   arrangement rather than an error. The composer should feel like a fast
   starting point, not a gate.

Note what is *not* in that list: no sandboxing, no code review of generated
output, no eval. Because the model can only emit `{type, config}` pairs against
a fixed registry, the blast radius of a bad generation is "a page with a weird
metronome tempo." That safety property is already built. It is the best
architectural decision in the project and you should say so out loud when you
talk about the app — "the AI can only rearrange pieces that already work" is a
genuinely differentiated and *true* claim.

**Sequencing note:** do not build this until the library is past roughly 15
blocks. An arranger with six components is a worse experience than a dropdown,
and it will make the feature look like a gimmick at exactly the moment you need
it to look like the point.

---

## 5. Recommended block library target

The goal is not "many blocks." It is "enough blocks that two people building for
the same goal produce visibly different pages." That is the threshold where a
marketplace becomes interesting.

**Tier 1 — extract from existing drills** (each is a wrapper around tested code)

| Block | Source |
|---|---|
| `noteSequence` | `lib/sequence-drill.ts`, `useArpeggios` |
| `progression` | `lib/progression.ts`, `useProgression` |
| `rootPool` | `useRootCycling` |
| `sessionStats` | `convex/tracking.ts`, `useChordDrill` stats |
| `missLog` | `useArpeggios` miss filter, `convex/tracking.ts` |
| `ankiSource` | `lib/anki.ts`, `useAnkiSync` |
| `techniqueLog` | `lib/technique.ts` |
| `tempoRamp` | `useDrillTimer` + metronome (small new logic) |

**Tier 2 — expose primitives that already exist**

| Block | Source |
|---|---|
| `songPlayer` | `lib/music-player.ts` — upload a MIDI file, play, loop a bar range |
| `rippleVisual` | `useChladniRipple` — fills the empty `visualization` category |
| `instrumentPicker` | `lib/audio-engine.ts`, `lib/audio-presets.ts` |
| `restTimer` | `useDrillTimer` — hand-care breaks, on-brand with your pillars |

**Tier 3 — genuinely new, and only these are new**

| Block | Note |
|---|---|
| `keyboardDisplay` | On-screen keyboard showing held notes. Also the answer to "no MIDI hardware" — makes the app usable with a mouse. |
| `sectionLoop` | Practice bars *n*–*m* of a loaded song. Depends on `songPlayer`. |
| `scaleTarget` | Scales and modes as targets. `lib/music-theory.ts` has most of the theory. |
| `goalTracker` | "Play this 10 times cleanly." Turns a page into a session with an ending. |

That is 16 new blocks for a library of 22, of which **only four require new
domain logic**. With `keyboardDisplay` + `songPlayer` + `sectionLoop` +
`tempoRamp` + `noteSequence`, a Moonlight Sonata trainer becomes a page someone
can actually build — and that is the demo that sells the whole vision.

---

## 6. Verdict

> **Keep the architecture. Fix one bug. Add three fields to the registry. Then
> spend your effort on inventory, not infrastructure.**

The uncomfortable truth in the other direction is that the *reason* the Workshop
feels thin is not architectural at all. It is that most of the last two months
went into visualization labs and atmosphere settings while the block library sat
at six. The pivot you are describing does not require you to undo that work —
it requires you to stop adding to it and point the same energy at blocks
instead.
