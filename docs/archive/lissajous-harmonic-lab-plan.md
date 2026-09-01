# Lissajous Harmonic Lab — Integration Plan

> **Status: shipped** in `3f9105a` (`feat: add Lissajous Harmonic Lab as interval-ratio curve explorer`).
> Kept as a historical record of the original plan. For current behavior see `docs/PROJECT_HISTORY.md`
> and the code under `app/tools/lissajous/` and `lib/lissajous.ts`. Lissajous is now also
> available as an ambient background via `/settings/atmosphere`, which the original
> "out of scope" list did not anticipate.

## Goal

Add a **Lissajous Harmonic Lab** at `/tools/lissajous` that mirrors Chladni and Julia Labs: an interactive, theme-aware parameter explorer for a third mathematical visual concept. Frequency ratios map to musical intervals (stronger pedagogy link than Julia). No MIDI, Anki, or Convex practice logging in v1.

## Context

Existing math labs share this shape:

```
app/tools/<tool>/page.tsx
  → DrillShell
    → <Tool>Lab (controls + morph RAF)
      → <Tool>Visualization (render + useThemeCssVars)
lib/<tool>.ts  (+ unit tests)
```

## Math (v1)

Classic parametric Lissajous:

```
x(t) = sin(a · t + δ)
y(t) = sin(b · t)
```

- `a`, `b` — integer frequency ratio (musical interval when reduced)
- `δ` — relative phase (radians)
- Lab advances `t` over time; visualization draws a fading trail of recent samples

Curated interval presets:

| Preset | a:b | Interval |
|--------|-----|----------|
| Unison | 1:1 | unison |
| Octave | 2:1 | octave |
| Fifth | 3:2 | perfect fifth |
| Fourth | 4:3 | perfect fourth |
| Major 3rd | 5:4 | major third |
| Minor 3rd | 6:5 | minor third |
| Minor 6th | 8:5 | minor sixth |
| Tritone-ish | 7:5 | near tritone |

Plus Random (frequencies in 1..8) and Play/Pause morph between current and next `(a,b,δ)`.

## Renderer

**Canvas 2D with fading trails** — not WebGL. Uses `useThemeCssVars` for `--color-background`, `--color-primary`, `--hero-orb-inner`, `--primary-glow`. Fade by drawing a translucent background rect each frame, then stroke new segments with theme glow.

## Architecture

```
app/tools/lissajous/page.tsx
  → DrillShell(title, subtitle)
    → LissajousLab                          components/drills/lissajous/lissajous-lab.tsx
         → LissajousVisualization           components/drills/lissajous/lissajous-visualization.tsx
              useThemeCssVars + Canvas 2D

lib/lissajous.ts                            pure math + presets + ratio helpers
lib/__tests__/lissajous.test.ts
components/drills/lissajous/__tests__/lissajous-lab.test.tsx
```

## Registration

- `components/tools/sidebar.tsx` — Lissajous Lab with Lucide `Infinity`
- `app/tools/page.tsx` — ToolCard entry
- `docs/PROJECT_HISTORY.md` — document alongside Chladni/Julia

## Out of scope (v1)

- MIDI / audio reactivity (shared backburner with Chladni/Julia)
- Convex settings persistence
- Landing-hero swap
- 3D Lissajous / multi-color harmonic overlays
- Shared Lab control extraction

## Backburner: MIDI-synced background ripple

Parked until Chladni + Julia + Lissajous share a clear props-driven visualization interface.
