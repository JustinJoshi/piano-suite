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

## Out of scope (v1)

- Click-to-select tiles / ribbons
- SVG export / share URLs
- Vendoring Pattern Collider Vue/p5 code
- MIDI / audio reactivity
