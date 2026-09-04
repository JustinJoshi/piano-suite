# Phase 2.2: tier the block library

## Goal

Rebuild `/tools/workshop/blocks` so it presents twenty components by kind:
interactive components as prominent cards, sources and transforms as a
quieter secondary section — each with the `justification` and `requires` the
manifest already carries.

## Why this matters

Stage 0 built a machine-readable specification. Stage 1 built eight components
against it. Today that specification reaches no pixel. Verify it yourself:

```bash
grep -rn "listManifests\|manifestsByKind\|getManifest" --include=*.ts --include=*.tsx . \
  | grep -v node_modules | grep -v "lib/feature-blocks/manifest.ts"
```

The only hit is `lib/feature-blocks/__tests__/registry-parity.test.ts`. Every
field — `kind`, `summary`, `justification`, `requires`, `docsPath`, `status`
— is currently CI metadata.

Meanwhile `components/workshop-marketplace/marketplace.tsx` renders all twenty
blocks in one flat grid, so a Chord library source and a Transport clock
compete on identical cards. Twenty entries is past the point where a flat scan
works.

## Prerequisite

**Phase 2.0 must be merged first.** This phase teaches users that sources feed
displays. Ship it before the runtime honors that and you make the product
harder to understand, not easier.

## Read before you start

1. `~/.config/opencode/AGENTS.md` — Definition of Done Protocol, coding rules,
   commit-message rules. **This governs the whole phase.**
2. `AGENTS.md` at the repository root — especially "Theming conventions"
   (never hard-code colors) and "Finishing work".
3. `docs/components/README.md` — the three component kinds and their
   construction rules. The secondary tier's shape comes from there.
4. `DESIGN-PRINCIPLES.md` — card surfaces, spacing rhythm, typography scale.

## Codebase research

Verified as of `23a2f7b`.

### What renders today

`components/workshop-marketplace/marketplace.tsx` (56 lines) builds one preview
block per registry entry and maps them into a single grid:

```tsx
Object.values(featureRegistry).map((def) => ({
  id: `preview-${def.type}`, type: def.type, version: 1,
  config: { ...def.defaultConfig },
}))
...
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
```

Everything is wrapped in `<DrillRuntimeProvider pageId="">` so previews are
live but write no practice history. Keep that.

`components/workshop-marketplace/marketplace-card.tsx` (69 lines) renders
icon, `def.label`, `def.description`, an add/remove button with
`aria-pressed`, and `<FeatureRenderer blocks={[block]} />`.

`app/tools/workshop/blocks/page.tsx` owns the store wiring — `addBlock` and
`removeBlockType` against `lib/custom-practice-storage.ts`.

### What the manifest gives you

`lib/feature-blocks/manifest.ts` exports:

| Function | Signature |
| --- | --- |
| `getManifest` | `(type: string) => ComponentManifest \| null` |
| `listManifests` | `(kind?: ComponentKind) => ComponentManifest[]` |
| `manifestsByKind` | `() => Record<ComponentKind, ComponentManifest[]>` |
| `validatePageWiring` | `(blocks) => WiringIssue[]` |

`ComponentManifest` (`lib/feature-blocks/manifest-types.ts:60`) carries
`kind`, `label`, `summary`, `justification`, `category`, `accepts`, `outputs`,
`requires`, `configSpec`, `defaultSize`, `minSize`, `maxPerPage`, `docsPath`,
`status`.

Current distribution across the twenty blocks:

| Kind | Count | Types |
| --- | --- | --- |
| `interactive` | 16 | the original 12, plus `transport`, `targetDisplay`, `noteRoll`, `freePlay` |
| `source` | 3 | `chordLibrary`, `scaleLibrary`, `pieceLibrary` |
| `transform` | 1 | `rhythmPattern` |

`category` values in `lib/feature-blocks/registry.ts:401-405`: `rhythm`,
`technique`, `theory`, `progress`, `visualization`.

### Available UI primitives

`components/ui/` contains **only** `button.tsx`, `card.tsx`, `separator.tsx`.
There is no Radix, no `cmdk`, no accordion or dialog primitive. Build the
collapsible section and About panel from plain elements plus `aria-expanded`
and `aria-controls`. Do not add a dependency — `package.json` is a
single-writer hotspot and this phase does not own it.

### Existing coverage you must keep green

- `e2e/workshop-marketplace.spec.ts` clicks `getByRole("button", { name: /add metronome/i })`
  and expects `/metronome added/i`. Preserve those accessible names.
- `components/workshop-marketplace/__tests__/marketplace.test.tsx` exists —
  read it before editing.

## Acceptance criteria

| # | Criterion | How you verify it |
| --- | --- | --- |
| 1 | The library derives its sections from `manifestsByKind()`, not `Object.values(featureRegistry)`. | `grep -n "featureRegistry" components/workshop-marketplace/marketplace.tsx` shows no enumeration |
| 2 | Interactive components render as cards with live previews, as today. | RTL test asserting 16 cards |
| 3 | Sources and transforms render in a separate, collapsed section as single-line rows with no preview surface. | RTL test asserting 4 rows and no `FeatureRenderer` inside them |
| 4 | Each entry has an About panel showing `summary`, `justification`, and a link to `docsPath`. | RTL test opening the panel and asserting the justification text |
| 5 | Each entry shows its `requires` in plain language, marked satisfied or unsatisfied against the current page. | RTL test with and without the required block present |
| 6 | Experimental blocks are visibly marked. | RTL test asserting the marker on `noteRoll` and its absence on `metronome` |
| 7 | Search filters by label and summary; filters narrow by `category` and `kind`. | RTL test typing a query and asserting the result set |
| 8 | The About panel is keyboard-operable: `aria-expanded` and `aria-controls` are correct and it toggles on Enter and Space. | RTL test using `userEvent.keyboard` |
| 9 | Every color comes from a theme token. | `grep -nE "#[0-9a-fA-F]{3,6}|rgb\(|hsl\(" components/workshop-marketplace/*.tsx` returns nothing |
| 10 | The existing e2e spec passes unchanged. | `npm run test:e2e -- e2e/workshop-marketplace.spec.ts` |
| 11 | The full gate passes. | `npm run lint && npm run test:unit:run && npm run build` |

## Implementation steps

Commit after each numbered step.

### Step 1 — Split the sections

Create `components/workshop-marketplace/library-sections.tsx`. It calls
`manifestsByKind()` and renders:

- **Primary:** `interactive` entries in the existing responsive card grid.
- **Secondary:** a collapsed `<section>` titled "Sources and transforms",
  below the grid, grouped by kind.

Keep `<DrillRuntimeProvider pageId="">` wrapping the whole view.

Section state is local `useState`. Do not add persistence in this phase.

### Step 2 — Build the quiet row

Create `components/workshop-marketplace/supplementary-row.tsx`: icon, label,
one-line summary, add/remove button. No card, no preview surface, muted
foreground.

The difference from a card is **weight and density**, not color. Use
`text-muted-foreground`, tighter spacing, and no `Card` wrapper. Do not add a
new token; `AGENTS.md` forbids one-off colors and this needs none.

### Step 3 — Build the About panel

Create `components/workshop-marketplace/about-panel.tsx`. Shared by cards and
rows. Shows:

- `summary`
- `justification` — this is the first time a user sees why a component exists
- a link to `docsPath` (for example `docs/components/note-roll.md`)
- the requirements line from Step 4

Wire `aria-expanded` on the trigger and `aria-controls` pointing at the
panel's `id`. Scope that `id` with the block type so twenty panels do not
collide — the same duplicate-id class of bug that Phase 2.3 fixes in
`field-input.tsx`.

### Step 4 — Requirements in plain language

Map `RequirementId` to a sentence:

| `requires` entry | Sentence |
| --- | --- |
| `transport` | Needs a transport |
| `practiceNotes` | Needs a source |
| `midiInput` | Needs a MIDI input |

Mark each satisfied or unsatisfied against `pageBlocks`, which
`app/tools/workshop/blocks/page.tsx` already passes down.

Phase 2.0 fixes `requirementToStream` so these resolve correctly. If you find
`midiConnectionBar` reporting a permanently unmet requirement, Phase 2.0 did
not land — stop and report rather than working around it.

### Step 5 — Status

Render `status: "experimental"` as a small marker on the card and row. Say
what it means in the About panel: the component works, its runtime behaviour
may still change.

### Step 6 — Search and filter

Add a text input filtering on `label` and `summary`, plus filter controls for
`category` and `kind`. Filters apply to both tiers. Show a result count so an
empty result is legible.

Label the input properly — an accessible name via `<label>` or
`aria-label`, not a placeholder alone.

### Step 7 — Keep the page thin

`app/tools/workshop/blocks/page.tsx` keeps owning store wiring. Move no
storage logic into the components. That mirrors the existing split and keeps
`DrillShell` usage unchanged.

## Files you will touch

```
components/workshop-marketplace/library-sections.tsx   (new)
components/workshop-marketplace/supplementary-row.tsx  (new)
components/workshop-marketplace/about-panel.tsx        (new)
components/workshop-marketplace/__tests__/library-sections.test.tsx (new)
components/workshop-marketplace/__tests__/about-panel.test.tsx      (new)

components/workshop-marketplace/marketplace.tsx        (edit)
components/workshop-marketplace/marketplace-card.tsx   (edit)
components/workshop-marketplace/__tests__/marketplace.test.tsx (edit)
app/tools/workshop/blocks/page.tsx                     (edit: pass-through only)
```

## Files you must not touch

`lib/feature-blocks/manifest.ts` — read it, do not change it. If a manifest
field is missing or wrong, report it rather than editing; the parity test and
Phase 2.0 own that file's correctness.

Also off limits: `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`,
`app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`,
`components/ui/*`, `package.json`, `package-lock.json`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Renaming the add button breaks `e2e/workshop-marketplace.spec.ts` | Keep the accessible names `Add <label>` and `<label> added` exactly |
| Twenty live previews mounted at once are slow | Measure before optimising. If it is slow, render supplementary previews only inside an opened About panel — see the open decision below |
| The secondary tier becomes so quiet it is undiscoverable | Show the count in the section header, and expand it automatically when a search matches only supplementary entries |
| Duplicate DOM ids across twenty About panels | Scope every `id` with the block type |

## Open decision to confirm before Step 2

The Stage 2 plan recommends **a one-line output sample in the supplementary
row, with the live preview inside the About panel** — quiet by default,
demonstrable on demand. Implement that unless told otherwise, and state the
choice in your PR description.

## Definition of done

Follow `~/.config/opencode/AGENTS.md` exactly:

1. Restate the 11 acceptance criteria as a checklist before coding.
2. Run each criterion and paste real output. No summaries.
3. Fix failures yourself. Stop after 3 attempts on one criterion and report.
4. Run the gate and paste output:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   ```
5. Run `npm run test:e2e -- e2e/workshop-marketplace.spec.ts`. This phase
   rewrites a flow that spec covers.
6. Update `AGENTS.md`: the `components/workshop-marketplace/*` row currently
   describes a flat grid of every registry block. Correct it to describe the
   two tiers.
7. Update `README.md` and `docs/PROJECT_HISTORY.md`.
8. Commit per logical step, using the 7 commit-message rules.
9. Push the branch and open a PR. Print the Vercel preview URL once.

## Stop condition

When every criterion has passing evidence and the PR is open, **stop**.
Report completion and wait for instruction before starting the next phase.
