# Workshop components

The Workshop component library is the foundation of user-created practice pages. This directory documents how each component works and how to build new ones.

## The three component kinds

Every component is one of these three kinds. Each kind follows its own construction specification and appears differently in the library UI.

### Interactive components

**User-facing.** These components occupy grid tiles in the Workshop editor and appear prominently in the block library marketplace. Every interactive component must have:

* A React component that renders something users interact with.
* A UI: something to click, drag, configure, or otherwise use. If it doesn't have a UI, it's not an interactive component.
* A grid size that looks reasonable at 1×1 and at 4×4.
* A live, interactive preview in the component library.
* A required `justification` string explaining why this component exists.

**Configuration.** Interactive components store their settings as JSON in `config`. Settings are edited through `FieldDescriptor[]` in the registry and `ConfigFieldSpec[]` in the manifest. The two must describe the same keys.

**Library appearance.** Rendered as a card in the primary grid, with label, icon, description, and a plus/check button to add/remove the component.

### Source components

**Static supplementary.** These components produce the content that other components consume. A source takes no upstream input and emits a stream of `PracticeNote[]`.

**Examples:** Chord library (emits chords), Scale library (emits scale notes), Piece library (emits MIDI notes from an uploaded file), Excerpt generator (emits random sight-reading material).

**Library appearance.** Rendered as a quiet row under a "Sources" section, not as a primary grid card. The row shows the name and a one-line summary. No interactive preview.

**Justification.** Required, and must explain why this source is better as a separate component than as a config option on an interactive component. For example: "Chord library exists because voicing (rootless A vs. rootless B) cannot be represented in the current target model, and separating the source lets users compose voicings with other sources."

### Transform components

**Static supplementary.** These components modify content from a source. A transform requires upstream input and emits a modified stream of `PracticeNote[]`.

**Examples:** Key cycle (repeats any source through fourths/fifths), Rhythm pattern (applies timing and duration to notes), Hand filter (keeps only left or right hand).

**Library appearance.** Rendered as a quiet row under a "Transforms" section, not as a primary grid card.

**Justification.** Required, and must explain why this is a transform rather than a config option. For example: "Key cycle exists as a transform because 'run this through 12 keys' is a property applied to a source, not a source itself. Extracting it lets users apply the same transform to scales, chords, progressions, and voicings at once."

## Component documentation template

Every component gets a file in this directory: `docs/components/<type>.md`. Use this structure:

```markdown
# <Label>

## Purpose

One sentence. What does this component do?

## Kind

One of: `interactive`, `source`, `transform`.

## Justification

Required. Why does this component exist? What capability would be missing without it?

## Wiring

If this is a source or transform, document `accepts` and `outputs`. If this is interactive, document `requires`.

Example:

- **Accepts:** none (source)
- **Outputs:** practiceNotes
- **Requires:** none

## Configuration

List every config field with its type and purpose.

- `fieldName` (range, 1–10): What this does.

## Example pages

List 2–3 preset workshop pages that use this component.

## Testing

Notes on how to test this component. Mention any fixtures or preview data.

## Status

`stable` or `experimental`. Experimental components may change or be removed.
```

## The manifest and registry

Components are registered in two places:

1. **The manifest** (`lib/feature-blocks/manifest.ts`): Machine-readable specification for assembling agents. Convex-safe (no React, no lucide imports, relative imports only).
2. **The registry** (`lib/feature-blocks/registry.ts`): React-facing definitions used by the Workshop editor and library UI. Imports React, lucide icons, and components.

**Both must stay in sync.** The parity test (`lib/feature-blocks/__tests__/registry-parity.test.ts`) fails if:

* A registry entry lacks a manifest entry.
* A manifest entry lacks a `justification`.
* A `docsPath` doesn't resolve to a file.
* `configSpec` and `fields` describe different keys.
* `maxPerPage` values disagree.

## Building a new interactive component

1. Create `lib/feature-blocks/<type>/config.ts` with:
   - `<Type>Config` type (extends `Record<string, unknown>`)
   - `normalize<Type>Config(raw: unknown) => <Type>Config`
   - `<type>DefaultConfig: <Type>Config`
   - `<type>Fields: FieldDescriptor[]`

2. Create `components/feature-blocks/<type>-block.tsx` (React component).

3. Add a manifest entry in `lib/feature-blocks/<type>/manifest.ts`.

4. Register in `lib/feature-blocks/registry.ts` (one import + one entry in `featureRegistry`).

5. Add a normalizer in `lib/feature-blocks/schemas.ts`.

6. Update `lib/workshop-grid.ts` with a default size.

7. Create `docs/components/<type>.md`.

8. Add unit tests in `lib/feature-blocks/__tests__/<type>.test.ts`.

9. Run `npm run test:unit:run` to verify parity.

## Building a new source component

1. Create `lib/feature-blocks/<type>/config.ts` with configuration shape and normalizer.

2. Create `lib/feature-blocks/<type>/generate.ts` exporting `generateNotes(config): PracticeNote[]`.

3. Add a manifest entry in `lib/feature-blocks/<type>/manifest.ts` with:
   - `kind: "source"`
   - `accepts: []`
   - `outputs: ["practiceNotes"]` (or other stream shape)

4. Register in `lib/feature-blocks/manifest.ts` (append to `EXISTING_BLOCK_MANIFESTS`).

5. Create `docs/components/<type>.md`.

6. Add unit tests for `generate.ts` in `lib/feature-blocks/__tests__/<type>.test.ts`.

## Building a new transform component

1. Create `lib/feature-blocks/<type>/config.ts` with configuration.

2. Create `lib/feature-blocks/<type>/transform.ts` exporting `transform(notes: PracticeNote[], config): PracticeNote[]`.

3. Add a manifest entry in `lib/feature-blocks/<type>/manifest.ts` with:
   - `kind: "transform"`
   - `accepts: ["practiceNotes"]` (or the stream shapes it consumes)
   - `outputs: ["practiceNotes"]` (or the stream shapes it produces)

4. Register in `lib/feature-blocks/manifest.ts`.

5. Create `docs/components/<type>.md`.

6. Add unit tests for `transform.ts`.

## Component list

<!-- GENERATED TABLE: START -->
| Type | Kind | Label | Status |
| --- | --- | --- | --- |
| `chordSet` | Interactive | Chord set | Stable |
| `drillTimer` | Interactive | Drill timer | Stable |
| `freePlay` | Interactive | Free play scope | Experimental |
| `textBlock` | Interactive | Instructions | Stable |
| `rootCycle` | Interactive | Key cycle | Stable |
| `metronome` | Interactive | Metronome | Stable |
| `midiConnectionBar` | Interactive | MIDI connection | Stable |
| `noteRoll` | Interactive | Note roll | Experimental |
| `keyboardDisplay` | Interactive | On-screen keyboard | Stable |
| `sessionStats` | Interactive | Practice report | Stable |
| `progression` | Interactive | Progression | Stable |
| `drillShortcuts` | Interactive | Ready-made drills | Stable |
| `restTimer` | Interactive | Rest timer | Stable |
| `scaleRunner` | Interactive | Scale run | Stable |
| `targetDisplay` | Interactive | Target display | Experimental |
| `transport` | Interactive | Transport | Experimental |
| `chordLibrary` | Source | Chord library | Experimental |
| `pieceLibrary` | Source | Piece library | Experimental |
| `scaleLibrary` | Source | Scale library | Experimental |
| `rhythmPattern` | Transform | Rhythm pattern | Experimental |
<!-- GENERATED TABLE: END -->

The list is generated from `listManifests()` and sorted by kind, then label. Do not edit it by hand — the parity test fails if the committed table drifts from the manifest.

Future components are planned in `docs/stage-2/README.md`.
