# Phase 2.4: stock the shelves people see

## Goal

Put the eight Stage 1 blocks in front of users, by adding starter templates
and marketplace seeds that use them, and by generating the component list in
the docs from the manifest so it cannot go stale again.

## Why this matters

The block library grew 67% — twelve components to twenty — and no discovery
surface changed. Verify it:

```bash
grep -oE '"(transport|rhythmPattern|targetDisplay|chordLibrary|scaleLibrary|noteRoll|pieceLibrary|freePlay)"' \
  lib/starter-templates.ts lib/marketplace-seeds.ts
```

That returns nothing. Both files draw exclusively from the original twelve.

A first-time visitor's experience of the Workshop is unchanged by Stage 1. A
starter template is the difference between a block that exists and a block
that gets used.

`docs/audit-2026-09/04-roadmap.md` Phase 3.3 makes the same point about the
marketplace: seeding it is *"the difference between a community product and an
empty room."*

## Prerequisites

**Phases 2.0 and 2.2 must be merged first.**

- Without 2.0, a template wiring Chord library into Target display would ship a
  page where the display ignores the library. You would be seeding a broken
  demo.
- Without 2.2, a user who opens the block library from a template still sees a
  flat grid of twenty.

## Read before you start

1. `~/.config/opencode/AGENTS.md` — Definition of Done Protocol, coding rules,
   commit-message rules. **This governs the whole phase.**
2. `AGENTS.md` at the repository root — "Rules for feature blocks" and
   "Finishing work".
3. `docs/components/README.md` — the component documentation template and the
   component list you will be generating.

## Codebase research

Verified as of `23a2f7b`.

### Starter templates

`lib/starter-templates.ts` exports `starterTemplates: StarterTemplate[]`:

```ts
export type StarterTemplate = {
  id: string;
  title: string;
  description: string;
  category: StarterCategory;   // "getting-started" | "chords" | "rhythm" | "technique"
  icon: LucideIcon;
  blocks: FeatureBlock[];
};
```

A local helper builds blocks:

```ts
const block = (id, type, config): FeatureBlock => ({ id, type, version: 1, config });
```

Nine templates ship today. `buildTemplatePage(template)` runs blocks through
`normalizeStoredBlock` from `lib/feature-blocks/schemas.ts`, so an invalid
config is silently corrected — which means a typo in a config key produces a
template that looks fine and does nothing. Test the built page, not the
literal.

`components/custom-practice/starter-picker.tsx` renders them, and
`components/welcome/starter-templates-section.tsx` shows them on the landing
page.

### Marketplace seeds

`lib/marketplace-seeds.ts` exports `marketplaceSeeds: MarketplaceSeed[]`:

```ts
export type MarketplaceSeed = {
  id: string;          // stable slug, used as fork lineage marker
  title: string;
  authorName: string;
  authorNote: string;  // first-person, why this page exists
  blocks: FeatureBlock[];
};
```

Thirteen seeds ship today. `app/marketplace/page.tsx` renders them and forks
them into `localStorage` via `forkPageIntoStore`.

The file's own header sets the tone: *"Authored in first person — these are
practice pages I actually use, and the notes say why."* Roadmap theme T6 is
Human authorship. Keep the voice; do not write marketing copy.

### The stale docs list

`docs/components/README.md` ends with a hand-maintained "Component list" table
of **12** components. It also links to `docs/workshop-component-plan-v2.md`,
which does not exist:

```bash
ls docs/workshop-component-plan-v2.md   # No such file or directory
```

`lib/feature-blocks/__tests__/registry-parity.test.ts` already asserts that
every manifest's `docsPath` resolves to a real file. It does not assert the
README list is current. That is the gap that let the list drift.

### The block configs you will be writing

Read each config module before authoring a template. Every one exports a
`normalize*Config` function and a `*Fields` descriptor array that names every
valid key:

```
lib/feature-blocks/chord-library/config.ts
lib/feature-blocks/scale-library/config.ts
lib/feature-blocks/piece-library/config.ts
lib/feature-blocks/rhythm-pattern/config.ts
lib/feature-blocks/transport/config.ts
lib/feature-blocks/target-display/config.ts
lib/feature-blocks/note-roll/config.ts
lib/feature-blocks/free-play/config.ts
```

Block order matters. `lib/feature-blocks/build-stream.ts` (added in Phase 2.0)
composes sources in page order, then transforms in page order. Put the source
before the transform before the display.

## Acceptance criteria

| # | Criterion | How you verify it |
| --- | --- | --- |
| 1 | At least three new starter templates exist, using the Stage 1 blocks: a Hanon-style cell warmup, a rootless ii-V-I in twelve keys, and a pentatonic improvisation scope. | Unit test asserting the ids exist |
| 2 | Every block in every starter template survives `normalizeStoredBlock` with its config intact — no key is silently dropped. | Unit test comparing pre- and post-normalize configs |
| 3 | Every new template composes to a non-empty stream. | Unit test calling `buildStream(template.blocks)` and asserting `length > 0` |
| 4 | Every new template passes `validatePageWiring` with zero issues. | Unit test |
| 5 | At least three new marketplace seeds use the Stage 1 blocks, each with a first-person `authorNote`. | Unit test asserting ids and non-empty notes |
| 6 | Every seed satisfies criteria 2 through 4 as well. | Same tests, parameterised over both files |
| 7 | The "Component list" table in `docs/components/README.md` is generated from `listManifests()` and lists all 20 components. | Generated file is committed; a test asserts it matches |
| 8 | The parity test fails if the README list drifts from the manifest. | Deliberately edit the table, run the test, observe failure, revert |
| 9 | `docs/workshop-component-plan-v2.md` either exists or is no longer referenced. | `grep -rn "workshop-component-plan-v2" docs/` returns nothing, or the file exists |
| 10 | The full gate passes. | `npm run lint && npm run test:unit:run && npm run build` |

## Implementation steps

Commit after each numbered step.

### Step 1 — Write the validation harness first

The Definition of Done Protocol says to build the test framework before the
solution. Do that here, because it is what makes criteria 2 through 4 cheap.

Create `lib/__tests__/page-fixtures.test.ts` with a shared helper that, given
any `FeatureBlock[]`, asserts:

- every block round-trips through `normalizeStoredBlock` unchanged
- `buildStream(blocks)` is non-empty when the page contains a source
- `validatePageWiring(blocks)` returns zero issues

Then run it over `starterTemplates` and `marketplaceSeeds` **as they exist
today**. Fix or report anything it catches in the existing content before you
add more. That is the honest order.

### Step 2 — Add the starter templates

Three, matching the presets the Stage 1 plan was built around:

| Template | Blocks, in order |
| --- | --- |
| Hanon-style cell warmup | `scaleLibrary` (custom cell) → `rhythmPattern` (16ths) → `transport` → `noteRoll` → `sessionStats` |
| Rootless ii-V-I, twelve keys | `chordLibrary` (roman numerals, rootless voicing) → `targetDisplay` → `drillTimer` → `sessionStats` |
| Pentatonic improvisation | `scaleLibrary` (pentatonic) → `freePlay` → `keyboardDisplay` (with `highlightScale`) |

Pick `category` from the existing four. Pick an icon already imported in the
file where one fits; add an import only if none does.

Write each config against the block's `*Fields` descriptors. Do not guess key
names.

### Step 3 — Add the marketplace seeds

Three seeds covering the same ground, with different framing. Write
`authorNote` in first person, saying what the page fixed for you. Match the
voice of the thirteen existing notes — read several before writing.

Keep `id` stable and slug-like; it is the fork lineage marker.

### Step 4 — Generate the component list

Replace the hand-written table in `docs/components/README.md` with a generated
one.

Add a script that writes the table from `listManifests()`, sorted by kind then
label, with columns Type, Kind, Label, Status. Wire it as an npm script — that
is a `package.json` edit, so keep it to the single `scripts` line and say so
in your PR.

Add an assertion to `lib/feature-blocks/__tests__/registry-parity.test.ts`
that the committed table matches freshly generated output. Verify criterion 8
by breaking it on purpose once.

### Step 5 — Resolve the dangling link

`docs/components/README.md` links to `docs/workshop-component-plan-v2.md`.
Either point it at `docs/stage-2/README.md`, which supersedes it, or write the
file. Pointing at Stage 2 is the smaller and more truthful change.

## Files you will touch

```
lib/__tests__/page-fixtures.test.ts     (new)
scripts/generate-component-list.ts      (new)

lib/starter-templates.ts                (edit)
lib/marketplace-seeds.ts                (edit)
docs/components/README.md               (edit: generated table + link fix)
lib/feature-blocks/__tests__/registry-parity.test.ts (edit)
package.json                            (edit: one scripts entry)
```

## Files you must not touch

`lib/feature-blocks/registry.ts`, `schemas.ts`, `manifest.ts`,
`lib/workshop-grid.ts` — this phase adds **content**, not components. If a
template needs a block that does not exist, stop and report; do not add a
block here.

Also off limits: `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`,
`components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`,
`package-lock.json`.

Adding a `scripts` entry does not change dependencies, so `package-lock.json`
must not change. If it does, you installed something — undo it.

## Risks

| Risk | Mitigation |
| --- | --- |
| `normalizeStoredBlock` silently corrects a typo'd config key, producing a template that looks fine and does nothing | Criterion 2 compares pre- and post-normalize configs. This is the single most important test in the phase |
| A template's blocks are ordered so the transform runs before the source | Criterion 3 asserts a non-empty stream; criterion 4 catches orphan transforms |
| Seeded pages use experimental blocks whose behaviour changes later | Acceptable — say so in the `authorNote`. Phase 2.2 marks experimental blocks in the UI |
| The generated table churns the diff on every unrelated manifest edit | Sort deterministically by kind then label |

## Definition of done

Follow `~/.config/opencode/AGENTS.md` exactly:

1. Restate the 10 acceptance criteria as a checklist before coding.
2. Build the validation harness (Step 1) **before** authoring any content, per
   protocol step 2.
3. Run each criterion and paste real output. No summaries.
4. Verify criterion 8 by deliberately breaking the table, showing the failure,
   and reverting.
5. Fix failures yourself. Stop after 3 attempts on one criterion and report.
6. Run the gate and paste output:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   ```
7. Run `npm run test:e2e -- e2e/workshop-marketplace.spec.ts` — the starter
   picker is on that path.
8. Update `README.md` and `docs/PROJECT_HISTORY.md`.
9. Update `AGENTS.md` if the generation script introduces a convention future
   agents must follow.
10. Commit per logical step, using the 7 commit-message rules.
11. Push the branch and open a PR. Print the Vercel preview URL once.

## Stop condition

When every criterion has passing evidence and the PR is open, **stop**.
Report completion and wait for instruction before starting the next phase.
