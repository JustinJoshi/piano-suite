# Drill Block Extraction Plan — Converting Existing Code into Reusable Builder Components

Companion to `docs/custom-drill-builder-plan.md` (market research + overall
architecture). This doc covers the **component level**: how mature block builders
define a component's contract, which parts of this codebase can become blocks, and
concrete conversion plans for the first three.

## 1. Research: how block builders define a component's contract

Sources: Puck (`puckeditor/puck`), Builder.io SDK source, Storyblok, Shopify
section schemas, n8n `INodeProperties`, and the zod-form-generation library
landscape (react-hook-form + zodResolver, vantezzen/autoform,
thepeaklab/zod-form-renderer, react-jsonschema-form).

### The universal per-component contract

Every system has the same five-part contract. Puck's `ComponentConfig` is the
cleanest expression of it:

```ts
// Puck, simplified
{
  label: "Hero",
  fields: {                      // editor form description ("how")
    title: { type: "text" },
    align: { type: "radio", options: [...] },
    height: { type: "number", min: 0, max: 100 },
  },
  defaultProps: { title: "Hello", align: "left", height: 48 },
  render: ({ title, align, height }) => <Hero ... />,
  permissions: { drag: true, delete: true },   // optional
  resolveData: async (data) => data,           // optional, async enrichment
}
```

Builder.io's `Input` interface (verbatim from `packages/core/src/builder.class.ts`,
abridged) shows the same shape with more validation metadata:

```ts
{
  name: string;              // the component prop this input represents
  friendlyName?: string;     // UI label
  type: string;              // 'string' | 'number' | 'boolean' | 'list' | ...
  defaultValue?: any;
  required?: boolean;
  min?: number; max?: number; step?: number;          // number widgets
  enum?: readonly { label: string; value: string | number | boolean }[];
  regex?: { pattern: string; options?: string; message: string };
  helperText?: string;
  advanced?: boolean;        // collapse under "Show More"
  showIf?: (options) => boolean;   // conditional visibility
  subFields?: readonly Input[];    // recursive for list/object
}
```

n8n's `INodeProperties` is the same idea a third time (`displayName`, `name`,
`type`, `typeOptions: { minValue, ... }`, `default`, `displayOptions.show`,
`options` with per-option descriptions).

### Four findings that shape our design

1. **The validation schema and the form descriptor are separate, deliberately.**
   `min`/`max`/`step` exist on Builder.io's input descriptor *and* would exist on a
   zod schema — the descriptor drives the widget, the schema validates the data.
   Even libraries built to collapse these layers reintroduce them:
   react-jsonschema-form (~16k stars) states in its docs that JSON Schema describes
   "*what* the data is, while a UI schema describes *how* it should be rendered";
   autoform admits its per-field `fieldConfig` override layer "is where real forms
   end up". Conclusion: **zod schema = what; `fields` descriptor = how. Do not try
   to derive forms from zod.**

2. **Defaults are written into the stored JSON at insert time by the editor.**
   Builder.io's Gen-2 render path (`get-block-component-options.ts`) reads *only*
   stored options; `defaultValue` appears only in registration code sent to the
   editor. If the editor doesn't write defaults at insert, the component gets
   `undefined`. Belt-and-braces for us: write defaults at insert (editor) *and*
   apply zod `.default()`s at render (covers hand-seeded and legacy rows).

3. **Blocks receive shared context outside their stored props.** Puck passes
   nothing extra — blocks call their own hooks. Builder.io injects
   `builderState`/`builderContext` at render, never into stored JSON. For us this
   means blocks call `useMidi()` / `useAudio()` / `useThemeCssVars()` directly —
   these are singletons (`lib/midi-session.ts` is tab-scoped global,
   `useAudio`'s AudioContext is global), so multiple blocks on one page share them
   naturally. No injection machinery needed.

4. **Unknown content degrades, never crashes.** Unknown `type` → skip + log;
   undeclared props → stripped by schema parsing (zod returns only declared keys);
   invalid props → block renders nothing or a placeholder. This is what makes
   user-shared configs safe to render.

### Our block contract

```ts
// lib/drill-blocks/types.ts
import type { z } from "zod";

export type FieldDescriptor =
  | { kind: "number"; key: string; label: string; min: number; max: number; step?: number; helperText?: string }
  | { kind: "select"; key: string; label: string; options: { label: string; value: string | number }[]; helperText?: string }
  | { kind: "toggle"; key: string; label: string; helperText?: string }
  | { kind: "text"; key: string; label: string; placeholder?: string };

export type BlockDef<S extends z.ZodType> = {
  type: string;                 // registry key, e.g. "metronome" — stored in JSON
  label: string;                // palette display name
  description: string;          // palette blurb
  schema: S;                    // zod: validation + defaults + prop types
  fields: FieldDescriptor[];    // editor form, one entry per user-tweakable prop
  render: React.ComponentType<z.infer<S>>;   // the block component
};

export type StoredBlock = { id: string; type: string; props: Record<string, unknown> };
```

Registry in `lib/drill-blocks/registry.ts` (a `Record<string, BlockDef>` built from
the individual block modules), block components in
`components/drills/blocks/<block-name>.tsx`, one module per block under
`lib/drill-blocks/<block-name>.ts` holding its schema + fields. This follows the
repo's existing per-tool isolation table (pure helpers in `lib/`, components in
`components/drills/`).

**Dependency note:** zod is **not** currently in `package.json`. Adding it is a
lockfile-ownership event per AGENTS.md hotspot rules — coordinate before installing.
Alternative if we want zero new deps: hand-rolled `normalizeProps(raw)` functions
per block in the style of `validateWelcomeConfig` (`lib/welcome-config.ts:442`).
Recommendation: add zod; hand-rolled validators are exactly what the codebase
already has and they are the thing this design is trying to replace.

## 2. Candidate components — full ranked list

From the codebase audit, verified against the source files. "Coupling" = what must
change before it can be a block.

### Tier 1 — ready or nearly ready

| # | Block | Source | State |
|---|-------|--------|-------|
| 1 | **Metronome** | `hooks/useAudio.ts:123-174` (engine), `components/drills/technique/technique-tracker.tsx:159-205` (only UI) | Engine works; UI is embedded in TechniqueTracker; accent hardcoded to beat 0 of 4. Needs extraction + `beatsPerBar` support. |
| 2 | **Drill timer** | `hooks/useDrillTimer.ts` (283 lines, fully generic) | Generic state machine with countdown/break/multi-rep knobs. No standalone display component — the phase/timer UI lives inside `chord-drill.tsx`. Needs a display component + a wiring decision (§3.3). |
| 3 | **MIDI connection bar** | `components/drills/midi-connection-bar.tsx` | Already props-driven over `useMidi()`. Trivial block: schema is empty (or one `compact` toggle). Good first "prove the registry" block after metronome. |
| 4 | **Drill shell / page chrome** | `components/drills/drill-shell.tsx` | Layout wrapper, not a block itself — the custom-drill *page* uses it directly. |

### Tier 2 — needs a generalization pass

| # | Block | Source | State |
|---|-------|--------|-------|
| 5 | **Chord-set target** (blocked-chord archetype) | `lib/music-theory.ts` (`ROOTS`, `QUALITY_GROUPS`, `buildPitchClassSet`), `lib/scoring.ts` (`evaluateChordAttempt`) | Pure logic is builder-ready. Missing: a config shape ("roots × qualities, order, excluded") and a target-selection hook — today that logic is fused into `useChordDrill.ts` (942 lines). |
| 6 | **Note-sequence target** (ordered-note archetype) | `lib/sequence-drill.ts` (`SequenceDrill`, `SequenceConfig`, `activeSequence`, `gradeForMisses`), `lib/scoring.ts` (`evaluateSequenceAttempt`) | Data model is already config-shaped and the header says "reused by future custom drills". Missing: content is compile-time (`lib/arpeggios.ts` `ARPEGGIO_CHORDS`), and target sequencing is fused into `useArpeggios.ts` (853 lines). |
| 7 | **Score/grade display** | `lib/chord-drill.ts:64` (`gradeForTime`), `lib/sequence-drill.ts:100` (`gradeForMisses`), grade badge UI in drill views | Pure helpers exist but use different grade types; display widgets are copy-pasted per drill view. Needs a unified `Grade` type + one badge component. |
| 8 | **Settings widgets** (slider row, toggle group, select) | inline in `chord-drill.tsx:32-120`, re-invented in other drill views | Not a drill block — this is the widget kit the block *editor* needs. Extract once, use in both existing drills and the builder forms. |

### Tier 3 — later blocks

| # | Block | Source | Notes |
|---|-------|--------|-------|
| 9 | Feedback visualization | `components/drills/*-lab/*-visualization.tsx`, `hooks/useChladniRipple.ts` | Props-driven canvases; need a "listen to global MIDI" wrapper to work as page blocks. |
| 10 | Anki source | `hooks/useAnkiSync.ts`, `lib/anki.ts` | Fairly clean hook; block shape = "current card drives the target". Optional per AGENTS.md. |
| 11 | Streak/habit grid | `lib/technique.ts` (`computeStreak`, `buildGrid`), `technique-tracker.tsx:245-260` | Pure logic done; extract the grid card as a display block. |
| 12 | Text/instructions | trivial | Markdown-free plain text block for user-authored drill instructions. |

## 3. Conversion plans — the first three blocks

### 3.1 Metronome block (first — smallest real extraction)

**Why first:** the user's own example block; the engine already exists; the
extraction touches exactly one consumer (TechniqueTracker), so the refactor is
provably behavior-preserving.

**Current state:** `useAudio.startMetronome(bpm, onBeat?)` (hooks/useAudio.ts:123)
runs a `setInterval` metronome, accent fixed at beat 0 of a hardcoded 4
(`beat = (beat + 1) % 4`, useAudio.ts:141). The only UI — BPM slider 40–160, pulse
dot, start/stop button — is inline in TechniqueTracker
(technique-tracker.tsx:159-205), which also owns the "re-sync tempo while running"
effect (lines 79-83).

**Target contract:**

```ts
// lib/drill-blocks/metronome.ts
schema = z.object({
  bpm: z.number().min(30).max(300).default(90),
  minBpm: z.number().default(40),
  maxBpm: z.number().default(200),
  beatsPerBar: z.number().int().min(1).max(12).default(4),
  accentFirst: z.boolean().default(true),
  autostart: z.boolean().default(false),
})
fields = [
  { kind: "number", key: "bpm", label: "Tempo", min: 30, max: 300 },
  { kind: "select", key: "beatsPerBar", label: "Time signature", options: [2,3,4,6] },
  { kind: "toggle", key: "accentFirst", label: "Accent first beat" },
  { kind: "toggle", key: "autostart", label: "Start automatically" },
]
```

**Steps:**

1. Extend `useAudio.startMetronome` to `startMetronome(bpm, onBeat?, options?: { beatsPerBar?: number; accent?: boolean })` — replace the hardcoded `% 4` and
   always-accent behavior. Default options preserve current behavior exactly.
2. Create `components/drills/blocks/metronome-block.tsx`: the slider + pulse dot +
   start/stop UI lifted from TechniqueTracker, props = `z.infer<typeof schema>`
   (`bpm` becomes initial state; the running tempo stays user-adjustable at
   runtime). Theme tokens only — the existing UI already complies
   (`accent-primary`, `--primary-glow`).
3. Refactor TechniqueTracker to render `<MetronomeBlock>` and delete its inline
   metronome UI + the tempo-re-sync effect (the block owns it).
4. Register in `lib/drill-blocks/registry.ts` with schema + fields above.
5. Tests: `hooks/__tests__/` for the `useAudio` options (beatsPerBar cycling,
   accent off); component test for the block (start/stop/pulse) mocking
   AudioContext as existing audio tests do; existing technique E2E testids
   (`bpm-slider`, `metronome-btn`, `pulse-dot`, `bpm-display`) must keep passing —
   keep the testids on the extracted elements.

**Deliberately out of scope:** sample-accurate scheduling (the `setInterval`
drift is pre-existing; a builder block doesn't change that trade-off).

### 3.2 Drill timer block (second — the orchestration question)

**Current state:** `useDrillTimer` (hooks/useDrillTimer.ts) is already the generic
engine the builder needs: phases `idle → countdown → armed → timing → success →
break → finished`, knobs `countdownSeconds` / `breakSeconds` / `multiRep`, and
consumer-driven `arm()` / `markSuccess()` / `nextRep()` / `finishRound()`. What's
missing for block-hood is (a) a display component and (b) an answer to "who calls
`arm()` and `markSuccess()` in a user-composed page?" — today the chord-drill
engine does it by watching MIDI.

**The wiring decision (applies to the whole builder):** blocks are not fully
independent — a target block detects success, a timer block measures it. Rather
than inventing inter-block message passing, custom drill pages get a single
**`DrillRuntimeProvider`** (React context, one per custom-drill page) holding the
shared drill state: current target, phase, attempt results. Blocks opt in:
`DrillTimerBlock` reads/writes phase, a target block reports success, a display
block renders results. This is the Builder.io pattern (context injected at render,
never stored) adapted to one shared hook — and it keeps block props purely
presentational/config. Concretely: `lib/drill-runtime.ts` defines the context
shape; `hooks/useDrillRuntime.ts` implements it on top of `useDrillTimer` +
`useMidi` + `useAudio`; blocks consume via `useDrillRuntime()` and **no-op with a
placeholder when rendered outside a provider** (safe in the editor palette).

**Target contract:**

```ts
// lib/drill-blocks/drill-timer.ts
schema = z.object({
  countdownSeconds: z.number().int().min(0).max(30).default(3),
  breakSeconds: z.number().int().min(0).max(60).default(5),
  multiRep: z.boolean().default(false),
  showLiveTimer: z.boolean().default(true),
})
```

**Steps:**

1. Create `hooks/useDrillRuntime.ts` wrapping `useDrillTimer` (do not modify
   `useDrillTimer` itself — chord-drill depends on its exact semantics, including
   the synchronous `nextRep()`-from-`onSuccess` contract documented at
   useDrillTimer.ts:27-45).
2. Create `components/drills/blocks/drill-timer-block.tsx`: phase badge,
   countdown/break readout, live ms — lifted from the chord-drill view's timer
   chrome, rendering from `useDrillRuntime()`.
3. Register block; editor fields per schema above.
4. Tests: runtime hook tests with React Testing Library (phase transitions with a
   mock timer engine), block render tests per phase. `useDrillTimer` already has
   coverage — leave it untouched.
5. **Follow-up (separate change):** migrate arpeggios / root-cycling / progression
   off their hand-rolled RAF loops (`useArpeggios.ts:257`, `useRootCycling.ts:175`,
   `useProgression.ts:191`) onto `useDrillTimer` — this is engine deduplication,
   not required for the block, and should not block Phases 1–2 of the builder.

### 3.3 Chord-set target block (third — the heart of a drill)

**Current state:** everything pure is ready — `buildPitchClassSet` / `ROOTS` /
`QUALITY_GROUPS` (lib/music-theory.ts) define the target vocabulary,
`evaluateChordAttempt(targetPcs, heldPcs, {requireExact})` (lib/scoring.ts) scores
it, `SequenceConfig {order, excluded}` + `activeSequence` / `currentChord`
(lib/sequence-drill.ts) already model ordering and exclusion. What's fused into
`useChordDrill.ts` and must be extracted: iterate targets in config order, watch
`useMidi().heldPcs`, call the evaluator, report success/miss to the runtime.

**Target contract:**

```ts
// lib/drill-blocks/chord-set.ts
schema = z.object({
  roots: z.array(z.enum(ROOTS)).default(["C", "F", "G"]),
  qualityGroups: z.array(z.enum(["seventh", "ninth", "eleventh", "thirteenth"])).default(["seventh"]),
  order: z.enum(["sequential", "random"]).default("sequential"),
  requireExact: z.boolean().default(false),
  missThresholds: z.object({ good: z.number().int().default(0), hard: z.number().int().default(2) }).default({}),
})
fields = [
  { kind: "select", key: "qualityGroups", label: "Chord families", options: [...] },  // multi-select variant
  { kind: "select", key: "order", label: "Order", options: ["sequential", "random"] },
  { kind: "toggle", key: "requireExact", label: "Extra notes count as wrong" },
]
```

The stored props expand to concrete targets at render: `roots × selected qualities`
→ `buildPitchClassSet` per target. Stored config stays small and human-meaningful;
the target list is derived, never persisted.

**Steps:**

1. Create `hooks/useChordTargets.ts`: `(config: z.infer<typeof schema>) =>
   { targets, current, advance, reset }` — pure target iteration, unit-testable
   without React or MIDI.
2. Create the scoring binding inside `useDrillRuntime` (§3.2): when a chord-set
   block is present, the runtime watches `heldPcs`, calls
   `evaluateChordAttempt`, and on `correct` calls the timer's `markSuccess()` /
   grades via `gradeForMisses`. This is the extracted slice of `useChordDrill`'s
   core loop — port the logic, not the 942-line hook.
3. Create `components/drills/blocks/chord-set-block.tsx`: current-target display
   (chord symbol + notes), progress within the set, miss flash — lifted from the
   chord-drill view, themed with existing tokens.
4. Tests: `lib/__tests__/` for target expansion (roots × qualities → correct pitch
   class sets, order/exclusion), scoring binding tests with simulated held notes;
   `evaluateChordAttempt` already has coverage.
5. The **note-sequence variant** (`lib/sequence-drill.ts` model +
   `evaluateSequenceAttempt`) reuses the same runtime binding and becomes the
   fourth block; not part of this first batch.

## 4. Build order and gates

1. `lib/drill-blocks/types.ts` + registry skeleton + **add zod** (coordinate
   `package.json` ownership per AGENTS.md).
2. Metronome block (§3.1) — proves extraction + registry with a real consumer
   refactor.
3. `useDrillRuntime` + timer block (§3.2) — proves the wiring model.
4. Chord-set block (§3.3) — proves a real drill can be expressed as blocks.
5. Then: `customDrills` Convex table + editor UI (Phases 1–2 of the companion
   plan), reusing these three blocks as the seed palette.

Per-change gate: `npm run lint && npm run test:unit:run && npm run build`;
technique + chord-drill E2E specs after steps that refactor their views
(`npm run test:e2e`). Before writing any page-level code, check
`node_modules/next/dist/docs/` per the AGENTS.md Next.js warning.

## Sources

- Puck: `ComponentConfig`/`fields`/`defaultProps` — puckeditor.com docs and
  github.com/puckeditor/puck (Data model, slot field, migrate.ts).
- Builder.io: `Input` interface — github.com/BuilderIO/builder
  `packages/core/src/builder.class.ts`; render-time options —
  `packages/sdks/src/functions/get-block-component-options.ts`.
- n8n: `INodeProperties` — github.com/n8n-io/n8n `packages/workflow/src/interfaces.ts`.
- Form generation: rjsf uiSchema docs (rjsf-team.github.io/react-jsonschema-form),
  vantezzen/autoform README, thepeaklab/zod-form-renderer README,
  react-hook-form/resolvers, shadcn/ui forms docs.
- Codebase: files and line numbers cited inline above.
