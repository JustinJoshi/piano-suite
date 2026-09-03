# Phase 2.3: make the Workshop keyboard-first

## Goal

Make every Workshop action reachable without a mouse, make focus visible, and
add an automated accessibility gate so the next twenty blocks cannot silently
regress it.

## Why this matters

This is a feature, not a remediation. Self-taught pianists sit at a keyboard
with both hands occupied; reaching for a mouse to change a setting mid-drill
is a real cost.

It is also where the product currently fails hardest. Six defects, each
verified in the code, three of them WCAG Level A.

There is a domain constraint that shapes every shortcut you add.
`components/feature-blocks/keyboard-display-block.tsx:83` binds unmodified
letter keys as piano notes, correctly guarded against modifier keys and
editable targets:

```ts
if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
if (isEditableTarget(event.target)) return;
```

**Unmodified letters are the instrument.** Any Workshop shortcut must use a
modifier or a non-note key, or it will play a note instead of running a
command.

## Read before you start

1. `~/.config/opencode/AGENTS.md` — Definition of Done Protocol, coding rules,
   commit-message rules. **This governs the whole phase.**
2. `AGENTS.md` at the repository root — theming conventions and the hotspot
   list. Note that this phase is the one exception on `package.json`; see
   "Dependency ownership" below.
3. `DESIGN-PRINCIPLES.md` §10 "Clarity Through State & Feedback".

## Codebase research

Verified as of `23a2f7b`. Each defect has a location and a criterion.

### Defect 1 — invisible focus on the tile toolbar

`components/workshop-grid/workshop-tile.tsx:184`:

```tsx
"opacity-100 md:opacity-0 md:group-hover:opacity-100",
```

The toolbar holds drag, settings, duplicate, and remove. On desktop it is
transparent until hover, and there is no focus variant. A keyboard user tabs
into four invisible buttons.

`focus-within` appears **zero** times in the repository:

```bash
grep -rn "focus-within" --include=*.tsx components/ app/ | wc -l   # 0
```

WCAG 2.4.7 Focus Visible (AA).

### Defect 2 — resize is pointer-only

`components/workshop-grid/workshop-tile.tsx:239-246`. The handle is a real
`<button>` with `aria-label="Resize tile"` and `focus-visible:opacity-100`, so
it takes focus — but it binds only `onPointerDown={onResizePointerDown}`.
Pressing Enter or Space does nothing.

WCAG 2.1.1 Keyboard (A) and 2.5.7 Dragging Movements (AA).

Note what already works: `components/workshop-grid/workshop-grid.tsx`
configures dnd-kit's `KeyboardSensor` with `sortableKeyboardCoordinates`, so
**reordering** is keyboard-operable today. It is just undiscoverable.

### Defect 3 — duplicate DOM ids in tile settings

`components/custom-practice/field-input.tsx:18`:

```ts
const id = `field-${field.key}`;
```

`settingsOpen` is per-tile state in `workshop-tile.tsx`, so several gear
panels can be open at once. Two metronomes both open emit two `id="field-bpm"`
elements, and `htmlFor` binds each label to the first one.

WCAG 1.3.1 Info and Relationships (A).

### Defect 4 — no skip link

`components/tools/dashboard-shell.tsx` renders `<main>`, but nothing lets a
keyboard user bypass the sidebar. `lib/tools.ts` defines 14 `href` entries and
the sidebar renders them on every page.

WCAG 2.4.1 Bypass Blocks (A).

### Defect 5 — auto-updating content with no pause

- `components/feature-blocks/target-display-block.tsx:18` — `setTimeout` every
  2000 ms. **Phase 2.0 removes this**; if it is still there, Phase 2.0 did not
  land, so stop and report.
- `components/feature-blocks/note-roll-block.tsx:46` — a continuous
  `requestAnimationFrame` loop.
- Ambient backgrounds animate on every route via `components/ambient/*`.

`prefers-reduced-motion` is honored in exactly one file,
`hooks/useOnboarding.ts:42`.

WCAG 2.2.2 Pause, Stop, Hide (A).

### Defect 6 — no automated coverage

No `axe`, `pa11y`, or `lighthouse` in `package.json`. No accessibility
assertion anywhere in `e2e/`.

### The only existing shortcut

`components/custom-practice/practice-page-editor.tsx:182` binds `/` to open
the block library, guarded against editable targets. Nothing documents it.

`components/custom-practice/pages-menu.tsx:58` and
`components/tools/dashboard-nav.tsx:50` also bind `keydown` — read both before
adding a global handler, so you do not double-handle Escape.

### Available UI primitives

`components/ui/` contains **only** `button.tsx`, `card.tsx`, `separator.tsx`.
No Radix, no `cmdk`, no dialog. Build the palette and the help dialog from
plain elements plus correct ARIA. Do not add a runtime UI dependency.

## Dependency ownership

This phase adds exactly one dependency: `@axe-core/playwright`, as a
**devDependency**. `package.json` and `package-lock.json` are single-writer
hotspots in `AGENTS.md`, so:

- Add only that one package.
- Run `npm install` under **npm 10**, not a newer npm. CI runs Node 22 / npm 10
  and `npm ci` fails on a lockfile pruned by npm 12. Commit `62d170d` exists
  because of exactly this. Verify with:
  ```bash
  npx -y npm@10 ci --dry-run
  ```
- Say in your PR description that this phase owns the lockfile.

## Acceptance criteria

| # | Criterion | How you verify it |
| --- | --- | --- |
| 1 | A command palette opens on `Ctrl`/`Cmd`+`K` and closes on `Escape`. | RTL test with `userEvent.keyboard` |
| 2 | The palette can add a block, switch pages, and open a tile's settings, all from the keyboard. | RTL test asserting the resulting store or state change |
| 3 | The palette does not fire while a text input has focus, and never plays a piano note. | RTL test with focus in the page-title input, plus a test asserting no `pressVirtualNote` call |
| 4 | `?` opens a shortcut help dialog listing every binding, including the pre-existing `/`. | RTL test |
| 5 | A tile can be resized from the keyboard. | RTL test changing width and asserting `onResize` |
| 6 | The tile toolbar is visible when any of its buttons has focus. | RTL test asserting the focus-visible class or computed opacity |
| 7 | Two open gear panels emit no duplicate DOM ids. | RTL test rendering two same-type tiles and asserting unique ids |
| 8 | A skip link is the first focusable element and moves focus to `<main>`. | RTL or e2e test |
| 9 | With `prefers-reduced-motion: reduce`, Note roll does not animate and any auto-advancing block is paused. | RTL test with a mocked `matchMedia` — copy the pattern from `hooks/__tests__/useOnboarding.test.ts:76` |
| 10 | Any block that auto-advances has a visible pause control. | RTL test |
| 11 | `@axe-core/playwright` reports zero `serious` or `critical` violations on `/tools/workshop`, `/tools/workshop/blocks`, and `/marketplace`. | New e2e spec |
| 12 | The lockfile installs under npm 10. | `npx -y npm@10 ci --dry-run` |
| 13 | The full gate passes. | `npm run lint && npm run test:unit:run && npm run build` |

## Implementation steps

Commit after each numbered step. Steps 1 through 5 are independent of each
other; do the cheap correctness fixes first so the palette lands on a sound
base.

### Step 1 — The four small fixes

Each is a few lines. Write the test first for each, observe it fail, then fix.

1. **Focus visibility.** Add a `focus-within` variant to the toolbar class at
   `workshop-tile.tsx:184`.
2. **Scoped field ids.** Thread the block id into `FieldInput` and build
   `id` as `field-${blockId}-${field.key}`. `field-input.tsx` is also used by
   any future settings UI — keep the prop optional with a sensible fallback so
   existing callers do not break.
3. **Skip link.** Add it to `components/tools/dashboard-shell.tsx` as the
   first child, visually hidden until focused, targeting the `<main>` element
   by `id`.
4. **Reduced motion.** Extract the `matchMedia` check from
   `hooks/useOnboarding.ts:42` into a shared `hooks/usePrefersReducedMotion.ts`
   and consume it in `note-roll-block.tsx`. Do not duplicate the logic.

### Step 2 — Keyboard resize

Recommended approach, and the cheaper one: expose width and height as fields
in the tile's gear panel, using the existing `FieldInput` `range` kind. That
gives keyboard users, screen-reader users, and touch users the same control,
and it reuses `clampSize` from `lib/workshop-grid.ts`.

If you instead add arrow-key handling to the handle, give it correct slider
semantics and announce the new size. Do not ship a key handler with no
accessible name for the value.

Either way, `lib/workshop-grid.ts` already provides `clampSize`,
`effectiveSpan`, and `sizeFromDelta`. Use them; write no new size math.

### Step 3 — The command palette

Create `components/custom-practice/command-palette.tsx`.

Binding rules, non-negotiable:

- Open on `Ctrl+K` and `Cmd+K` only. Never an unmodified letter.
- Close on `Escape`.
- Ignore the shortcut when the event target is editable. That guard is
  currently implemented **twice** — privately at
  `keyboard-display-block.tsx:35` and inline at
  `practice-page-editor.tsx:184`. Extract one shared helper and have all
  three callers use it. Do not add a fourth copy.
- Keep the existing `/` binding working.

Commands for this phase: add a block by name, switch page, open a tile's
settings, toggle the transport, focus a tile. Drive them through the callbacks
`practice-page-editor.tsx` already owns.

ARIA, since there is no dialog primitive: `role="dialog"`, `aria-modal="true"`,
an accessible name, focus moved into the input on open, focus restored to the
trigger on close, and focus trapped while open.

### Step 4 — Shortcut help

Create `components/custom-practice/shortcut-help.tsx`, opened by `?`. List
every binding, including `/` and the palette. Same dialog semantics as Step 3.

Define the binding list as one exported constant and render both the help
dialog and the palette hints from it, so they cannot drift.

### Step 5 — Pause controls

Any block that advances on its own gets a visible pause control and honors
`usePrefersReducedMotion`. After Phase 2.0 that is Note roll and any
transport-driven display.

### Step 6 — The accessibility gate

Add `@axe-core/playwright` as a devDependency. Create `e2e/a11y.spec.ts`
asserting zero `serious` and `critical` violations on the three routes in
criterion 11.

After Phase 2.1 those routes are public, so run this in the signed-out
project using the `test.use` pattern at `e2e/auth-protection.spec.ts:155`. If
Phase 2.1 has not landed, sign in with `signInAsTestUser` from
`e2e/auth-helper.ts` instead and note the dependency in your report.

Fix the violations the scan finds. If a violation is outside this phase's
scope, record it in the PR with its rule id rather than lowering the
threshold.

## Files you will touch

```
hooks/usePrefersReducedMotion.ts                    (new)
components/custom-practice/command-palette.tsx      (new)
components/custom-practice/shortcut-help.tsx        (new)
components/custom-practice/__tests__/command-palette.test.tsx (new)
components/custom-practice/__tests__/shortcut-help.test.tsx   (new)
e2e/a11y.spec.ts                                    (new)

components/workshop-grid/workshop-tile.tsx          (edit)
components/custom-practice/field-input.tsx          (edit)
components/tools/dashboard-shell.tsx                (edit)
components/custom-practice/practice-page-editor.tsx (edit)
components/feature-blocks/note-roll-block.tsx       (edit)
hooks/useOnboarding.ts                              (edit: extract the check)
package.json / package-lock.json                    (edit: one devDependency)
```

## Files you must not touch

`components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`,
`app/globals.css`, `app/layout.tsx`, `app/tools/layout.tsx`,
`convex/schema.ts`, `lib/music-theory.ts`, `lib/scoring.ts`.

The skip link goes in `dashboard-shell.tsx`, not the sidebar.

## Risks

| Risk | Mitigation |
| --- | --- |
| A shortcut collides with the on-screen piano | Modifier-only bindings. Add criterion 3's test asserting no note fires |
| Three `keydown` listeners now race | Read `pages-menu.tsx:58` and `dashboard-nav.tsx:50` first. One Escape handler wins; decide which and comment why |
| `npm install` under npm 12 breaks CI | Install under npm 10 and verify with `npx -y npm@10 ci --dry-run` |
| The axe scan finds pre-existing violations across the app | Scope the spec to the three routes named. Record out-of-scope findings; do not chase them |
| Scoping field ids breaks a settings e2e assertion | `grep -rn "field-" e2e/ components/` before changing the format |

## Definition of done

Follow `~/.config/opencode/AGENTS.md` exactly:

1. Restate the 13 acceptance criteria as a checklist before coding.
2. For each of the six defects, **write the test first, observe it fail, then
   fix, then observe it pass.** These are bugs; the protocol requires it.
3. Run each criterion and paste real output. No summaries.
4. Fix failures yourself. Stop after 3 attempts on one criterion and report.
5. Run the gate and paste output:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   npx -y npm@10 ci --dry-run
   ```
6. Run `npm run test:e2e`. This phase changes shared shells and adds a new
   spec. Report `e2e/home-mobile.spec.ts` as pre-existing if it fails.
7. Update `AGENTS.md` with the keyboard conventions: modifier-only shortcuts
   because unmodified letters are piano notes, the shared binding constant,
   `usePrefersReducedMotion`, and the axe gate.
8. Update `README.md` with the shortcut list and `docs/PROJECT_HISTORY.md`.
9. Commit per logical step, using the 7 commit-message rules.
10. Push the branch and open a PR. Print the Vercel preview URL once.

## Stop condition

When every criterion has passing evidence and the PR is open, **stop**.
Report completion and wait for instruction before starting the next phase.
