# Phase 2.0: make the chain real

## Goal

Make a source block's output reach a display block through the drill runtime,
so that a page containing **Chord library + Target display** shows the chords
the library generates — not a fixture.

## Why this comes first

Stage 1 shipped eight components. None of them are connected to the runtime.
`components/feature-blocks/target-display-block.tsx:14` says so in a comment:

```
// Auto-advance for demo purposes (can be controlled by runtime later)
```

Every later phase depends on this. Phase 2.2 tiers the block library into
sources, transforms, and displays — teaching users a mental model that the
product does not currently honor. Ship that lesson before this phase and you
make the product harder to understand, not easier.

The repository's own audit calls this out. `docs/audit-2026-09/03-entry-flow-spec.md`
acceptance criterion 8: *"Every Workshop setting a user can change visibly
changes behaviour."* Chord library's voicing selector currently changes nothing
downstream.

## Read before you start

1. `~/.config/opencode/AGENTS.md` — Definition of Done Protocol, coding rules,
   commit-message rules. **This governs the whole phase.**
2. `AGENTS.md` at the repository root — especially "Rules for feature blocks",
   "Convex auth conventions", the hotspot file list, and "Finishing work".
3. `docs/components/README.md` — the three component kinds.

## Codebase research

You do not need to rediscover any of this. It is verified as of `23a2f7b`.

### The stream type already exists, in the wrong file

```ts
// lib/feature-blocks/preview-fixtures.ts:3
export type PracticeNote = {
  midi: number[];
  pcs: Set<number>;
  symbol: string;
  hand?: "left" | "right";
  onsetMs?: number;
  durationMs?: number;
  velocity?: number;
};
```

Six production modules import it from there:

| File | Line |
| --- | --- |
| `lib/feature-blocks/scale-library/generate.ts` | 15 |
| `lib/feature-blocks/chord-library/generate.ts` | 18 |
| `lib/feature-blocks/piece-library/adapt.ts` | 8 |
| `lib/feature-blocks/target-display/render-model.ts` | 6 |
| `lib/feature-blocks/rhythm-pattern/transform.ts` | 6 |
| plus two test files | — |

A file named `preview-fixtures.ts` is not the home for the production stream
type. Move it.

### The generators are already written and tested

| Source | Function | Returns |
| --- | --- | --- |
| `chord-library/generate.ts:104` | `chordsFromSet(text, voicing, useFlats)` | `PracticeNote[]` |
| `chord-library/generate.ts:130` | `chordsFromRomanNumerals(text, keyRootName, voicing)` | `PracticeNote[]` |
| `scale-library/generate.ts:51` | `generateScale(config)` | `PracticeNote[]` |
| `piece-library/adapt.ts:30` | `notesFromParsedMidi(parsed, config)` | `PracticeNote[]` |
| `rhythm-pattern/transform.ts:117` | `transform(notes, config, bpm, beatsPerBar)` | `PracticeNote[]` |

Your job is plumbing, not music theory. Do not rewrite these.

### The runtime today

`lib/drill-runtime.ts` defines:

```ts
export type ChordTarget = {
  id: string;
  symbol: string;
  notes: string[];
  pcs: Set<number>;
};
```

`hooks/useDrillRuntime.ts` scores `heldPcs` against `currentTarget.pcs` at
line ~230 via `evaluateChordAttempt`. **Do not change that scoring path.**
`ChordTarget.pcs` stays the contract for grading in this phase.

`hooks/useTargetSource.ts` is the registration hook. A block calls
`useTargetSource(ownerKey, targets)` and gets `{ isActive, isSuperseded,
hasRuntime }`. First registered block still mounted wins.

`components/custom-practice/drill-runtime-provider.tsx` builds config from
blocks via `runtimeOptionsFromBlocks` and provides the runtime.

`lib/feature-blocks/target-blocks.ts` lists only the four Batch A types:

```ts
export const TARGET_BLOCK_TYPES = ["chordSet", "scaleRunner", "rootCycle", "progression"] as const;
```

### `resolveChain` exists but is never called

`lib/feature-blocks/manifest.ts:774` implements `resolveChain(blocks)`,
returning `{ sources, transforms, displays, issues }`. Nothing calls it.
Verify with:

```bash
grep -rn "resolveChain" --include=*.ts --include=*.tsx . | grep -v node_modules
```

### Two data bugs to fix in this phase

**Bug 1 — `requirementToStream` makes some requirements unsatisfiable.**
`lib/feature-blocks/manifest.ts` ends with:

```ts
function requirementToStream(req: RequirementId): StreamShape {
  switch (req) {
    case "practiceNotes": return "practiceNotes";
    case "transport":     return "none";
    default:              return "none";   // midiInput
  }
}
```

`validatePageWiring` then tests `blocks.some(b => m.outputs.includes(stream))`.
No manifest declares `"none"` in `outputs`, so `requires: ["transport"]` and
`requires: ["midiInput"]` can never be met. `midiConnectionBar` declares
`requires: ["midiInput"]`, so **any page containing it reports a false
`unmet_requirement` today.** Write a failing test first, then fix.

**Bug 2 — `transport` declares `outputs: []`.**
Its purpose is to be the clock other blocks require. It must advertise
something a requirement can match.

### Two manifests lie about status

`lib/feature-blocks/transport/manifest.ts` and
`lib/feature-blocks/target-display/manifest.ts` both say `status: "stable"`
while unwired. The other six correctly say `"experimental"`.

## Acceptance criteria

Each is verifiable by running something. State these back before you code.

| # | Criterion | How you verify it |
| --- | --- | --- |
| 1 | `PracticeNote` lives in `lib/practice-note.ts` and every importer points there. `preview-fixtures.ts` re-exports it for compatibility or is updated. | `grep -rn 'from ".*preview-fixtures"' lib components hooks` shows only fixture imports, not type imports |
| 2 | A new pure function `buildStream(blocks)` returns the composed `PracticeNote[]` for a page: sources in page order, then transforms applied in page order. | Unit test in `lib/feature-blocks/__tests__/build-stream.test.ts` |
| 3 | `buildStream` on `[chordLibrary, rhythmPattern]` returns notes with `onsetMs` set, proving the transform ran. | Same test file |
| 4 | `useNoteStream()` returns the page's stream inside a `DrillRuntimeProvider`, and `[]` outside one. | React Testing Library test in `hooks/__tests__/useNoteStream.test.tsx` |
| 5 | `TargetDisplayBlock` renders the chord symbols a sibling Chord library generates, not `previewNotes`. | RTL test in `components/feature-blocks/__tests__/target-display-block.test.tsx` rendering both blocks in one provider |
| 6 | `TargetDisplayBlock` no longer advances on its own `setTimeout`. | `grep -n "setTimeout" components/feature-blocks/target-display-block.tsx` returns nothing |
| 7 | `validatePageWiring` reports **no** issue for a page containing only `midiConnectionBar`. | Test in `lib/feature-blocks/__tests__/wiring.test.ts` — write it failing first |
| 8 | `validatePageWiring` reports `unmet_requirement` for a `noteRoll` with no source, and none once a `pieceLibrary` is added. | Same test file |
| 9 | Every manifest's `status` matches reality: `stable` only if the block reads or writes the runtime. | Assertion added to `lib/feature-blocks/__tests__/registry-parity.test.ts` |
| 10 | The full gate passes. | `npm run lint && npm run test:unit:run && npm run build` |
| 11 | No existing test regressed. | Unit total is >= 1094 and 0 failures |

## Implementation steps

Do these in order. Commit after each numbered step.

### Step 1 — Move the stream type

Create `lib/practice-note.ts` containing the `PracticeNote` type and nothing
else. Update the six importers listed above. Keep `preview-fixtures.ts`
exporting `previewNotes()` only; have it import the type from the new home.

Relative imports only inside `lib/feature-blocks/` — `schemas.ts` and
`target-blocks.ts` are bundled by Convex and must stay React-free and
DOM-free. `lib/practice-note.ts` is a bare type file, so it is safe for both.

### Step 2 — Build the pure composer

Create `lib/feature-blocks/build-stream.ts`:

```ts
export function buildStream(
  blocks: Array<{ id: string; type: string; config: unknown }>,
  bpm?: number,
): PracticeNote[]
```

Rules:

- Read `kind` from the manifest via `getManifest(block.type)`.
- Concatenate every `source` block's output, in page order.
- Apply every `transform` block's function to the accumulated array, in page
  order.
- Return `[]` when there is no source.
- Keep it pure. No React, no DOM, no `Date.now()`.

Dispatch source and transform types through a small map in this file. Do not
add a new field to `ComponentManifest` for it — the manifest is
Convex-bundled and must not import generator code.

Write `lib/feature-blocks/__tests__/build-stream.test.ts` covering criteria
2 and 3.

### Step 3 — Fix the wiring model

Write `lib/feature-blocks/__tests__/wiring.test.ts` first, with the two cases
from criteria 7 and 8. Run it. **Observe it fail.** Then fix:

- Give `transport` a truthful `outputs` value so a `requires: ["transport"]`
  can be satisfied.
- Repair `requirementToStream` so `midiInput` and `transport` resolve against
  something a block actually declares, or replace the stream-matching check
  with a direct capability check. Either is acceptable; the test decides.

Re-run. Observe it pass.

### Step 4 — Add the stream hook

Create `hooks/useNoteStream.ts`. It reads the page's blocks from the runtime
and returns the memoised `buildStream` result. Blocks must never call
`runtime.setTargets` directly — that rule is in `AGENTS.md` and still holds.

To do this the runtime needs the page's blocks. `DrillRuntimeProvider` already
receives `blocks` (`components/custom-practice/drill-runtime-provider.tsx:14`).
Add the composed stream to the runtime context value in `lib/drill-runtime.ts`
and populate it in `hooks/useDrillRuntime.ts`.

Write `hooks/__tests__/useNoteStream.test.tsx` for criterion 4.

### Step 5 — Wire the displays

Replace `previewNotes(...)` with `useNoteStream()` in:

- `components/feature-blocks/target-display-block.tsx`
- `components/feature-blocks/note-roll-block.tsx`

Delete the `setTimeout` auto-advance in Target display. The runtime's
`targetIndex` drives the current note now. When the stream is empty, keep the
existing empty state ("Target display (connect a source)").

Keep `previewNotes` alive — Phase 2.2 needs it for library previews, where no
page context exists.

Write `components/feature-blocks/__tests__/target-display-block.test.tsx` for
criterion 5.

### Step 6 — Clock-advanced mode

When a page contains a `transport` block, the clock advances targets and a
late note counts as a miss. Without one, the page stays event-advanced —
current behaviour, unchanged.

`lib/feature-blocks/transport/clock.ts` already provides `beatsToMs`,
`msToBeat`, `sectionRange`, `rampTempo`, `beatInBar`, and `barNumber`, all
unit-tested. Use them; do not write new tempo math.

Add the mode to `hooks/useDrillRuntime.ts` behind an explicit check for the
transport block, so a page without one takes exactly the code path it takes
today.

### Step 7 — Truthful status

Set `status` correctly in every `lib/feature-blocks/*/manifest.ts`. Add the
criterion-9 assertion to `lib/feature-blocks/__tests__/registry-parity.test.ts`.

### Step 8 — Do not retire arbitration yet

Leave `lib/feature-blocks/target-blocks.ts` and `hooks/useTargetSource.ts` in
place. The four Batch A blocks still use them and their tests must stay green.
Removing arbitration is a separate change, after this phase proves the chain
works. Note it in your completion report; do not do it.

## Files you will touch

```
lib/practice-note.ts                            (new)
lib/feature-blocks/build-stream.ts              (new)
lib/feature-blocks/__tests__/build-stream.test.ts (new)
lib/feature-blocks/__tests__/wiring.test.ts     (new)
hooks/useNoteStream.ts                          (new)
hooks/__tests__/useNoteStream.test.tsx          (new)
components/feature-blocks/__tests__/target-display-block.test.tsx (new)

lib/feature-blocks/preview-fixtures.ts          (edit)
lib/feature-blocks/manifest.ts                  (edit: requirementToStream)
lib/feature-blocks/transport/manifest.ts        (edit: outputs, status)
lib/feature-blocks/target-display/manifest.ts   (edit: status)
lib/drill-runtime.ts                            (edit)
hooks/useDrillRuntime.ts                        (edit)
components/custom-practice/drill-runtime-provider.tsx (edit)
components/feature-blocks/target-display-block.tsx    (edit)
components/feature-blocks/note-roll-block.tsx         (edit)
lib/feature-blocks/{chord,scale,piece}-library/*.ts, rhythm-pattern/*.ts (import path only)
lib/feature-blocks/__tests__/registry-parity.test.ts  (edit)
```

## Files you must not touch

`convex/schema.ts`, `app/globals.css`, `app/layout.tsx`, `app/tools/layout.tsx`,
`components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`,
`lib/music-theory.ts`, `lib/scoring.ts`, `package.json`, `package-lock.json`.

This phase owns `lib/feature-blocks/registry.ts`, `schemas.ts`, and
`lib/workshop-grid.ts` for its duration, but should not need to edit them.

## Risks

| Risk | Mitigation |
| --- | --- |
| Changing `ChordTarget` breaks the four Batch A blocks and their e2e specs | Do not change `ChordTarget` in this phase. Add the stream alongside it |
| `buildStream` imports generator code into a Convex-bundled module | Keep `build-stream.ts` out of `schemas.ts` and `target-blocks.ts`. Nothing in `convex/` may import it |
| The stream recomputes every render and thrashes the runtime | Memoise on the blocks array, as `runtimeOptionsFromBlocks` already does |
| Clock mode changes behaviour for pages without a transport | Gate it on the transport block's presence and assert the old path in a test |

## Definition of done

Follow `~/.config/opencode/AGENTS.md` exactly:

1. Restate the 11 acceptance criteria as a checklist before coding.
2. Write the failing tests for criteria 7 and 8 before their fixes. Show them
   failing, then passing.
3. Run each criterion and paste real output. No summaries.
4. Fix failures yourself. Stop after 3 attempts on one criterion and report.
5. Run the gate and paste output:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   ```
6. Run `npm run test:e2e` — this phase changes drill behaviour, which is a
   critical flow. Report `e2e/home-mobile.spec.ts` as pre-existing if it fails.
7. Update `AGENTS.md` with the new stream convention: where `PracticeNote`
   lives, that `buildStream` is the composer, and that displays read
   `useNoteStream` rather than `previewNotes`.
8. Update `README.md` and `docs/PROJECT_HISTORY.md` if user-facing behaviour
   changed. It does — sources now feed displays.
9. Commit per logical step, using the 7 commit-message rules.
10. Push the branch and open a PR. Print the Vercel preview URL once.

## Stop condition

When every criterion has passing evidence and the PR is open, **stop**.
Report completion and wait for instruction before starting Phase 2.1.
