# Metronome Block Plan — First Reusable Feature for User-Created Practice Tools

This doc designs the first feature a user can **import into their own custom
practice page**. It combines a focused study of how apps let users add features to
a custom workspace with a concrete extraction plan for the existing metronome.

Companion docs:

- `docs/custom-drill-builder-plan.md` — overall architecture, market research, storage.
- `docs/drill-block-extraction-plan.md` — component-contract research and ranked
  candidate list.

## 1. Research: how apps let users import features into custom pages

Investigated Notion, Airtable Extensions, Figma widgets, WordPress Gutenberg,
Shopify Online Store 2.0, Retool modules, OBS sources, Raycast/Alfred, and app
builders (Glide, Adalo, Bubble, FlutterFlow). The patterns converge on a small set
of design rules.

### What every successful inserter does

1. **One obvious add button, plus a shortcut.** Notion's `/`, Gutenberg's `/`,
   Airtable's **Add an extension**, Shopify's **Add section**. The empty page shows
   a centered CTA; the filled page keeps an inline **+ Add feature** affordance.
2. **Categorized, searchable palette.** Icon + title + one-line description per
   row. Categories group features by job (Text/Media/Design in Gutenberg, Apps/
   Media/Image in Shopify). Search filters in place.
3. **Insert at default state; configure after.** A metronome block drops in at a
   sensible default BPM (120) and immediately renders its play button. The user
   selects it, then tweaks settings.
4. **Selected state has two panels:** a floating/collapsed toolbar for move/
   duplicate/delete, and a sidebar/bottom sheet for the block's own settings.
5. **Reordering is drag-handle based.** A `⠿` handle on the left of each block,
   matching Shopify and Gutenberg. No absolute positioning.
6. **Marketplace is a separate section, not mixed in blindly.** Adalo and Bubble
   keep built-ins and marketplace components conceptually separate so paid/
   community features don't pollute the default palette.

### Premium gating pattern

- "Pro" or "Pro" chips use the app's accent color.
- Locked rows show a lock icon and disable insertion; tapping opens an upgrade
  prompt.
- Plan gating is usually shown per item in the palette, not after insertion.

### Underlying data model (consistent across Notion, Gutenberg, Shopify, OBS)

```ts
// one custom page
{
  id: string;
  title: string;
  blocks: [
    { id: string; type: string; version: string; config: Record<string, unknown> }
  ];
}
```

The stored JSON references a type string; the app resolves that to a registered
implementation at render time. Shopify sections go further and bundle a JSON Schema
for settings inside the section file (`{% schema %}`) — this is the pattern we copy
for per-block configuration.

## 2. Current metronome: careful read

Two files own the metronome today:

- `hooks/useAudio.ts:123-174` — the engine.
- `components/drills/technique/technique-tracker.tsx:159-205` — the only UI.

### Engine behavior

`useAudio.startMetronome(bpm, onBeat?)`:

- Uses `setInterval` (not sample-accurate).
- Beat counter increments `beat = (beat + 1) % 4` — **time signature is hardcoded to 4/4**.
- Accent is always on `beat === 0` with `frequency: 1200`; unaccented beats use `880`;
  oscillator type is always `triangle`; volume `0.3`.
- Returns `{ start, stop, running }`. `start` is a no-op because the metronome
  starts immediately on call.
- Calling `startMetronome` while running restarts the interval with the new BPM
  (used by TechniqueTracker's sync effect).

### UI behavior (TechniqueTracker lines 159-205)

- A "Metronome" label.
- A pulse dot that glows on each beat when running.
- A BPM readout (`{bpm} BPM`).
- An `<input type="range" min={40} max={160}>` slider.
- A wide Button that toggles start/stop (`Play` / `Stop Metronome`).
- Disabled when `!ready` (no Web Audio support).
- Theme tokens used: `accent-primary`, `--primary-glow`, `bg-primary`, `text-muted-foreground`.

### What's reusable now

The engine. The UI is reusable in principle but currently embedded. The biggest
engine limitation for a block is the hardcoded 4/4 — users will reasonably want 2,
3, 4, or 6 beats per bar. That must be generalized before the block ships.

## 3. The "Add feature" interface for this app

### 3.1 Terminology

- **Feature** = a reusable building block the user can add to a custom page
  (metronome, timer, chord drill, etc.).
- **Custom page** = a user-created practice page made of an ordered list of
  features. Internally a "custom drill"; user-facing name can be "My practice
  page" or "Workshop".
- **Feature palette** = the drawer/sheet where the user browses and inserts
  features.
- **Feature settings** = the per-block config panel.

### 3.2 Data model

```ts
// lib/feature-blocks/types.ts
export type FeatureBlock = {
  id: string;                       // client UUID
  type: string;                     // registry key, e.g. "metronome"
  version: number;                  // schema version for migrations
  config: Record<string, unknown>;  // validated/normalized by the block
};

export type PracticePage = {
  id: string;
  ownerId?: string;                 // set when synced to Convex
  title: string;
  blocks: FeatureBlock[];
  updatedAt: number;
};

export type FieldDescriptor =
  | { kind: "range"; key: string; label: string; min: number; max: number; step?: number; helperText?: string }
  | { kind: "select"; key: string; label: string; options: { label: string; value: string | number }[]; helperText?: string }
  | { kind: "toggle"; key: string; label: string; helperText?: string };

export type FeatureDefinition<S extends z.ZodTypeAny = z.ZodTypeAny> = {
  type: string;
  category: "rhythm" | "technique" | "theory" | "visualization";
  label: string;
  description: string;
  icon: LucideIcon;
  schema: S;
  fields: FieldDescriptor[];
  defaultConfig: z.infer<S>;
  component: React.ComponentType<z.infer<S>>;
};
```

**Note on zod:** zod is not currently in `package.json`. Adding it is a
lockfile-ownership event per AGENTS.md; coordinate before installing. It is the
recommended schema language because it gives validation, defaults, and prop types
in one place. If you want to ship the metronome block without adding a dependency,
replace `schema` with `normalizeConfig: (raw: unknown) => MetronomeConfig` and keep
the same `fields` descriptor.

### 3.3 Feature palette UI

A sheet/drawer (mobile) or left panel (desktop) with:

- Search input at the top.
- Category chips: All / Rhythm / Technique / Theory / Visualization.
- Rows grouped by category. Each row: icon, title, description.
- A "Marketplace" section at the bottom for locked/community features, with Pro
  chips or lock icons.
- On row click/tap: insert the feature with `defaultConfig` at the end of the
  page's block list and close the palette.

Keyboard shortcut: `/` inside an empty page or at the bottom placeholder opens the
palette.

### 3.4 Inserted feature UI

Each block renders inside a wrapper card that provides:

- Drag handle (`⠿`) on the left for reordering.
- Selection border (`ring-2 ring-primary`) when selected.
- A floating toolbar on selection: move up, move down, duplicate, delete.
- A bottom-right or right-edge "Settings" button that opens the per-block config
  panel.

The block itself is responsible only for its own content; the wrapper owns chrome.

### 3.5 Settings panel

- Mobile: bottom sheet or slide-over from right.
- Desktop: right sidebar (like Gutenberg's Inspector).
- Generated from the block's `fields` descriptor, not hand-written per block.
- At the bottom: a "Remove feature" button with `text-destructive`.

### 3.6 Render path

```tsx
function FeatureRenderer({ blocks }: { blocks: FeatureBlock[] }) {
  return blocks.map((block) => {
    const def = featureRegistry[block.type];
    if (!def) { console.warn("Unknown feature", block.type); return null; }
    const parsed = def.schema.safeParse(block.config);
    if (!parsed.success) return <FeatureError id={block.id} />;
    const Component = def.component;
    return (
      <FeatureWrapper key={block.id} blockId={block.id}>
        <Component {...parsed.data} />
      </FeatureWrapper>
    );
  });
}
```

Rules inherited from Builder.io/Puck: unknown type → skip; invalid config →
placeholder; only schema-declared props are passed to the component.

## 4. Metronome as the first feature block

### 4.1 Target config shape

```ts
// lib/feature-blocks/metronome/config.ts
import { z } from "zod";

export const metronomeConfigSchema = z.object({
  bpm: z.number().min(30).max(300).default(120),
  beatsPerBar: z.number().int().min(1).max(12).default(4),
  accentFirstBeat: z.boolean().default(true),
  minBpm: z.number().min(20).max(300).default(40),
  maxBpm: z.number().min(20).max(300).default(220),
});

export type MetronomeConfig = z.infer<typeof metronomeConfigSchema>;

export const metronomeDefaultConfig: MetronomeConfig = metronomeConfigSchema.parse({});

export const metronomeFields: FieldDescriptor[] = [
  {
    kind: "range",
    key: "bpm",
    label: "Tempo",
    min: 30,
    max: 300,
    step: 1,
    helperText: "Beats per minute",
  },
  {
    kind: "select",
    key: "beatsPerBar",
    label: "Beats per bar",
    options: [
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5", value: 5 },
      { label: "6", value: 6 },
      { label: "7", value: 7 },
      { label: "8", value: 8 },
      { label: "9", value: 9 },
      { label: "12", value: 12 },
    ],
  },
  {
    kind: "toggle",
    key: "accentFirstBeat",
    label: "Accent first beat",
  },
];
```

### 4.2 Engine changes

Extend `useAudio.startMetronome` to accept beat configuration:

```ts
// hooks/useAudio.ts
type MetronomeOptions = {
  beatsPerBar?: number;      // default 4
  accentFirstBeat?: boolean; // default true
  accentFrequency?: number;  // default 1200
  normalFrequency?: number;  // default 880
};

startMetronome(
  bpm: number,
  onBeat?: (beat: number) => void,
  options?: MetronomeOptions
): MetronomeControls
```

Implementation changes inside `startMetronome`:

- Replace `beat = (beat + 1) % 4` with `beat = (beat + 1) % beatsPerBar`.
- If `accentFirstBeat` is false, all beats use `normalFrequency`.
- Default options preserve current behavior exactly.

No sample-accurate scheduling changes — that's a separate concern.

### 4.3 New component: MetronomeBlock

```tsx
// components/feature-blocks/metronome-block.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/hooks/useAudio";
import type { MetronomeConfig } from "@/lib/feature-blocks/metronome/config";

export function MetronomeBlock(config: MetronomeConfig) {
  const { bpm: initialBpm, beatsPerBar, accentFirstBeat, minBpm, maxBpm } = config;
  const { ready, startMetronome, stopMetronome, metronomeRunning } = useAudio();
  const [bpm, setBpm] = useState(initialBpm);
  const [pulse, setPulse] = useState(false);

  const toggle = useCallback(() => {
    if (metronomeRunning) {
      stopMetronome();
      return;
    }
    startMetronome(
      bpm,
      () => setPulse((p) => !p),
      { beatsPerBar, accentFirstBeat }
    );
  }, [metronomeRunning, stopMetronome, startMetronome, bpm, beatsPerBar, accentFirstBeat]);

  // Keep tempo in sync while running (matches existing TechniqueTracker behavior).
  useEffect(() => {
    if (metronomeRunning) {
      startMetronome(bpm, () => setPulse((p) => !p), { beatsPerBar, accentFirstBeat });
    }
  }, [bpm, metronomeRunning, beatsPerBar, accentFirstBeat, startMetronome]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Metronome
        </span>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-3 w-3 rounded-full transition-all duration-100",
              pulse && metronomeRunning
                ? "bg-primary shadow-[0_0_12px_2px_var(--primary-glow)]"
                : "bg-muted"
            )}
          />
          <span className="font-heading text-2xl font-semibold">{bpm} BPM</span>
        </div>
      </div>

      <input
        type="range"
        min={minBpm}
        max={maxBpm}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label="Tempo"
      />

      <Button
        onClick={toggle}
        disabled={!ready}
        variant={metronomeRunning ? "destructive" : "default"}
        className="w-full"
      >
        {metronomeRunning ? (
          <><Square className="h-4 w-4" /> Stop Metronome</>
        ) : (
          <><Play className="h-4 w-4" /> Start Metronome</>
        )}
      </Button>
    </div>
  );
}
```

### 4.4 Refactor TechniqueTracker to consume it

Replace the inline metronome UI in `components/drills/technique/technique-tracker.tsx`
(lines 159-205) and the local `bpm`/`pulse`/`toggleMetronome`/tempo-sync effect
with:

```tsx
import { MetronomeBlock } from "@/components/feature-blocks/metronome-block";
import { metronomeDefaultConfig } from "@/lib/feature-blocks/metronome/config";

// inside the card content:
<MetronomeBlock {...metronomeDefaultConfig} />
```

The `bpm` state is still needed for the "Mark today done" log, so TechniqueTracker
keeps `bpm` in state and passes it as the `bpm` prop. The block controls its own
running state. This preserves the existing behavior while proving the block works
in a real tool.

### 4.5 Registry entry

```ts
// lib/feature-blocks/registry.ts
import { Timer } from "lucide-react";
import {
  metronomeConfigSchema,
  metronomeDefaultConfig,
  metronomeFields,
} from "./metronome/config";
import { MetronomeBlock } from "@/components/feature-blocks/metronome-block";

export const featureRegistry = {
  metronome: {
    type: "metronome",
    category: "rhythm" as const,
    label: "Metronome",
    description: "Keep a steady beat while you practice.",
    icon: Timer,
    schema: metronomeConfigSchema,
    fields: metronomeFields,
    defaultConfig: metronomeDefaultConfig,
    component: MetronomeBlock,
  },
};

export type FeatureType = keyof typeof featureRegistry;
```

## 5. How it fits into a custom practice page

### 5.1 File layout

```
lib/feature-blocks/
  types.ts
  registry.ts
  metronome/
    config.ts
    schema.ts       // if not in config.ts
components/feature-blocks/
  metronome-block.tsx
  feature-wrapper.tsx
components/custom-practice/
  practice-page-editor.tsx
  feature-palette.tsx
  feature-settings-panel.tsx
app/tools/workshop/
  page.tsx          // editor for a new custom page
  [id]/page.tsx     // render/edit an existing page
convex/customPages.ts
```

`lib/feature-blocks/` holds pure registry/config (no React or only types).
`components/feature-blocks/` holds the runtime components. `components/custom-practice/`
holds the editor chrome. This follows the repo's existing conventions (pure stuff
in `lib/`, components in `components/`, backend in `convex/`).

### 5.2 Persistence

For the first phase, custom pages live in **localStorage only** — same as the
existing Free-tier pattern (`lib/local-practice-history.ts`). This lets the
metronome block ship without touching Convex auth/sync.

```ts
// lib/custom-practice-storage.ts
const CUSTOM_PAGES_KEY = "custom-practice-pages-v1";

export function readCustomPages(): PracticePage[] { ... }
export function writeCustomPages(pages: PracticePage[]): void { ... }
export function savePage(page: PracticePage): void { ... }
export function deletePage(id: string): void { ... }
```

Later, the same `canPersist` gating used by `useHeroMultigridSettings` and
`useToolUserReady` swaps localStorage for Convex when Pro or `AUTH_DISABLED`.
The stored `blocks` array is exactly what the feature renderer consumes.

### 5.3 Editor flow

1. User opens `/tools/workshop` (or clicks "Create custom tool" from `/tools`).
2. Empty page shows centered illustration + "Add your first feature" CTA.
3. Clicking opens `FeaturePalette` (sheet/drawer).
4. User selects Metronome. Palette closes. Block appears with default config.
5. Block is auto-selected. `FeatureSettingsPanel` opens from the right/bottom,
   populated by `metronomeFields`.
6. User adjusts BPM or beats-per-bar; block re-renders live.
7. User adds a second feature (e.g. a timer block later) via the inline
   "+ Add feature" placeholder below the last block.

### 5.4 Pro/marketplace gating (future)

Built-in features are always available. Pro/community features get a chip in the
palette and are disabled with a lock icon for Free users. The registry's
`FeatureDefinition` can later gain an `availability: "free" | "pro" | "marketplace"`
field.

## 6. Implementation steps

1. **Add zod** (coordinate `package.json` ownership) **or** implement a
   hand-rolled normalizer for the metronome block only. Decide here.
2. Extend `useAudio.startMetronome` with `MetronomeOptions` (`beatsPerBar`,
   `accentFirstBeat`, default-preserving). Add unit tests.
3. Create `lib/feature-blocks/types.ts` and `lib/feature-blocks/metronome/config.ts`.
4. Create `components/feature-blocks/metronome-block.tsx`.
5. Refactor `TechniqueTracker` to render `MetronomeBlock` with its persisted BPM.
6. Create `lib/feature-blocks/registry.ts` with the metronome entry.
7. Create minimal editor chrome:
   - `components/feature-blocks/feature-wrapper.tsx`
   - `components/custom-practice/feature-palette.tsx`
   - `components/custom-practice/feature-settings-panel.tsx`
   - `components/custom-practice/practice-page-editor.tsx`
8. Add localStorage persistence (`lib/custom-practice-storage.ts`).
9. Add route `app/tools/workshop/page.tsx` that renders `PracticePageEditor` with
   an empty page.
10. Run gate: `npm run lint && npm run test:unit:run && npm run build`; then
    `npm run test:e2e` for technique + workshop smoke.

## 7. Tests

- `hooks/__tests__/useAudio.test.ts` (or new file): `startMetronome` cycles
  through the configured `beatsPerBar` and honors `accentFirstBeat`.
- `components/__tests__/feature-blocks/metronome-block.test.tsx`: renders
  controls, toggles start/stop, slider updates BPM display, pulse dot toggles.
- `lib/__tests__/feature-blocks/metronome-config.test.ts`: defaults and clamping
  of invalid config.
- Existing technique E2E testids (`bpm-slider`, `metronome-btn`, `pulse-dot`,
  `bpm-display`) must still pass after the refactor — keep them on the extracted
  elements.

## 8. Risks and decisions

| Risk | Mitigation |
|---|---|
| zod dependency adds package-lock churn | Coordinate with any other active agent; or ship v1 with a hand-rolled normalizer. |
| `useAudio` metronome is `setInterval`-based drift | Out of scope. The block inherits the same drift as TechniqueTracker today. |
| Multiple metronome blocks on one page | `useAudio` has one global metronome state (`metronomeRunning`). Two blocks starting will fight. For v1, either allow only one metronome per page or extend `useAudio` to support named metronome instances. Recommendation: **allow only one metronome per page in the editor** (palette disables the metronome row if one is present). |
| Block settings panel needs generic form widgets | Build three small widgets (`RangeField`, `SelectField`, `ToggleField`) in `components/custom-practice/fields/`. Reuse them for the next blocks. |

## 9. Definition of done

- User can open `/tools/workshop`, add a Metronome feature, change its BPM and
  beats-per-bar, and hear the metronome reflect both settings.
- `TechniqueTracker` still works identically (verified by E2E testids).
- The feature palette, wrapper, settings panel, and registry exist and are ready
  for the second block.
- Gate passes: lint, unit tests, build.

## Sources

- Notion slash command / block menu: notion.com/help/keyboard-shortcuts
- Notion API block model: developers.notion.com/reference/block
- Airtable Extensions / Marketplace: support.airtable.com/extensions-overview
- Figma widgets: help.figma.com/hc/en-us/articles/4410047809431
- WordPress Gutenberg block inserter: developer.wordpress.org/block-editor/getting-started/fundamentals/block-in-the-editor
- Shopify Online Store 2.0 app blocks: help.shopify.com/en/manual/online-store/themes/customizing-themes/apps
- Retool modules: docs.retool.com/apps/guides/layout-structure/modules
- OBS sources: obsproject.com/kb/sources-guide
- Raycast Store: developers.raycast.com/basics/install-an-extension
- Adalo Marketplace: help.adalo.com/component-basics/marketplace-components
- Codebase: `hooks/useAudio.ts`, `components/drills/technique/technique-tracker.tsx`,
  `lib/tools.ts`.
