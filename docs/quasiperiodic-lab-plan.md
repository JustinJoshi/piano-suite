# Quasiperiodic Pattern Lab — Integration Plan

> **Status: shipped** in `faba4b3` (`feat: add Quasiperiodic Pattern Lab with Apply-to-home atmosphere`).
> Kept as a historical record of the original plan. For current behavior see `docs/PROJECT_HISTORY.md`
> and the code under `app/tools/quasiperiodic/` and `lib/quasiperiodic.ts`.

## Goal

Add a **Quasiperiodic Pattern Lab** at `/tools/quasiperiodic` that mirrors the Chladni Pattern Lab: an interactive, theme-aware WebGL parameter explorer for N-fold plane-wave interference, with **Apply to home** / **Reset home**, pattern color, and hero-scrim persistence (localStorage + Convex). No MIDI, Anki, or Convex practice logging in v1.

## Context

Math labs share this shape:

```
app/tools/<tool>/page.tsx
  → DrillShell
    → <Tool>Lab (controls + morph RAF + optional Apply-to-home)
      → <Tool>Visualization (Three.js / Canvas + useThemeCssVars)
lib/<tool>.ts  (+ unit tests)
```

Chladni remains the default welcome atmosphere. Quasiperiodic can take over via Apply-to-home through a shared `hero-atmosphere-v1` kind (`chladni` | `quasiperiodic`).

## Math (v1)

```
θᵢ = i · π / N
f(p) = Σᵢ cos( frequency · (p · ûᵢ) + phase )
```

Morph evaluates both recipes and lerps the fields. Soft-threshold `|f|` draws nodal lines.

Curated presets: Lattice (4), Snowflake (6), Pentagrid (5), Hept (7), Starburst (8).

## Architecture

```
app/tools/quasiperiodic/page.tsx
  → DrillShell
    → QuasiperiodicLab
         → QuasiperiodicVisualization
lib/quasiperiodic.ts
lib/quasiperiodic-hero-settings.ts
lib/hero-atmosphere.ts
hooks/useHeroQuasiperiodicSettings.ts
hooks/useHeroAtmosphereKind.ts
components/welcome/quasiperiodic-background.tsx
```

## Persistence

| Key | Purpose |
|-----|---------|
| `hero-quasiperiodic-v1` | Recipe params, color, scrim |
| `hero-atmosphere-v1` | Active kind |

Apply / Reset from Quasiperiodic Lab sets kind to `quasiperiodic`. Apply / Reset from Chladni Lab sets kind to `chladni`.

## Registration

- `components/tools/sidebar.tsx` — Hexagon icon
- `app/tools/page.tsx` — ToolCard
- `docs/PROJECT_HISTORY.md` — feature + primitive list

## Out of scope (v1)

- MIDI / audio reactivity
- Mouse pan / deep zoom
- Domain coloring
- Shared lab-control extraction
- Julia / Lissajous as hero atmospheres
