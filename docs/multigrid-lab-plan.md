# Multigrid Lab — Integration Plan

## Goal

Add a **Multigrid Lab** at `/tools/multigrid` as a standalone math visual — not a mode of Quasiperiodic Lab. It explores de Bruijn multigrid dual tilings (parallel-line grids → filled rhombus polygons), inspired by [Pattern Collider](https://aatishb.com/patterncollider/) (Aatish Bhatia / Minute Physics, MIT). Piano Suite ships an original TypeScript / Canvas 2D implementation.

## Why separate from Quasiperiodic

| Lab | Visual language | Math |
|-----|-----------------|------|
| Quasiperiodic | Soft glowing nodal contours (WebGL) | `Σ cos(...)` wave interference |
| Multigrid | Crisp grid strokes + colored rhombus fills (Canvas) | de Bruijn dual of N line families |

Do **not** edit `lib/quasiperiodic.ts` or Quasiperiodic UI for this feature.

## Architecture

```
app/tools/multigrid/page.tsx
  → DrillShell
    → MultigridLab
         → MultigridVisualization (Canvas 2D)
lib/multigrid.ts
lib/multigrid-hero-settings.ts
hooks/useHeroMultigridSettings.ts
components/welcome/multigrid-background.tsx
lib/hero-atmosphere.ts  — kind union includes "multigrid"
```

## Persistence

| Key | Purpose |
|-----|---------|
| `hero-multigrid-v1` | Recipe params, view mode, color, scrim |
| `piano-suite-hero-multigrid-v1` | localStorage mirror |
| `hero-atmosphere-v1` | Active kind: `chladni` \| `quasiperiodic` \| `multigrid` |

Apply / Reset from Multigrid Lab sets kind to `multigrid` and writes only multigrid settings.

## Registration

- Sidebar: Multigrid Lab → `/tools/multigrid` (Lucide `LayoutGrid`)
- Tools hub ToolCard
- README + AGENTS primitive list

## Experimental gate

Multigrid Lab is **experimental** and hidden unless the user enables it under
**Theme → Enable experimental features** (`lib/experimental-features.ts`,
`hooks/useExperimentalFeatures.ts`). Default: **off**.

When off:

- Sidebar + Tools hub omit Multigrid
- Atmosphere settings omit the Multigrid kind and Multigrid Lab route row
- Ambient / welcome renderers treat `multigrid` as `none`
- `/tools/multigrid` still loads (auth-gated) but shows a gate message with a link to Theme settings

## Out of scope (v1)

- Click-to-select tiles / ribbons
- SVG export / share URLs
- Vendoring Pattern Collider Vue/p5 code
- MIDI / audio reactivity

## Marked for deletion (not yet deleted)

**Tiling view** (filled rhombus panel / `viewMode: "tiling"` | `"both"`): marked for deletion.

- **User-facing:** disabled. Lab and home Multigrid show **grid (lines) only**. View-mode controls for Both / Tiling are hidden. Persisted `"tiling"` / `"both"` values are coerced to `"grid"` in `normalizeHeroMultigridSettings`.
- **Still in code (pending hard removal):** `MultigridViewMode` union members, the tiling draw branch in `components/drills/multigrid/multigrid-visualization.tsx` (`panel.mode === "tiling"`), tile helpers in `lib/multigrid.ts`, and related hero/lab `viewMode` fields.
- **Do not re-enable** without an explicit product decision. Follow-up PR should delete the dead paths above and narrow `MultigridViewMode` to `"grid"` (or remove the field).
