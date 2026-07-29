# Chladni Ripple Lab — Integration Plan

> **Status: shipped** in `d6ff921` (`feat: add Chladni Ripple lab driven by live MIDI notes`).
> Kept as a historical record of the original plan. Two items below were later superseded:
> the lab **does** expose an "Apply to home" style action (`applyAsAmbientBackground`,
> added with the ambient-effects system in `fc4e1c5`), so the v1 "no Apply-to-home" scope
> line no longer describes the shipped tool. For current behavior see `README.md` and the
> code under `app/tools/chladni-ripple/`, `hooks/useChladniRipple.ts`, and `lib/chladni-ripple.ts`.

## Goal

Add a **Chladni Ripple Lab** at `/tools/chladni-ripple`: a separate, theme-aware tool that maps live MIDI notes onto square-plate Chladni modes. Reuses `ChladniVisualization` via props. No Anki, no Convex practice logging, no Apply-to-home in v1.

## Context

```
app/tools/chladni-ripple/page.tsx
  → DrillShell
    → ChladniRippleLab
         useMidi + useChladniRipple
         → ChladniVisualization   (existing, props-only)
```

Extend `useMidi` for velocity before wiring the UI. Do not add inline Web MIDI in the lab.

## Mapping (v1)

| Input | Effect |
|-------|--------|
| Pitch class 0–11 | Curated `(m,n)` identity |
| Octave | Higher \(m^2+n^2\) (denser) for same PC |
| Velocity | Impulse → `lineIntensity` / breathe, then decay |
| Held density | `secondaryBlend` / `nextMode` from 2nd PC |

Pure logic: `lib/chladni-ripple.ts`.

## Per-tool isolation

| Concern | Path |
|---------|------|
| Page | `app/tools/chladni-ripple/page.tsx` |
| Component | `components/drills/chladni-ripple/chladni-ripple-lab.tsx` |
| Pure helpers | `lib/chladni-ripple.ts` |
| Hook | `hooks/useChladniRipple.ts` |
| Tests | co-located `__tests__` / `lib/__tests__` / `hooks/__tests__` |

## Hotspots

- `components/tools/sidebar.tsx`
- `app/tools/page.tsx`
- `hooks/useMidi.ts` (velocity on note-on)
- `README.md`
- `AGENTS.md` (new primitives)

No `convex/schema.ts` / `package.json` / `globals.css` in v1.

## Worktree

Branch: `auto/chladni-ripple`  
Worktree: `.worktrees/auto-chladni-ripple`

## Out of scope (v1)

- Quasiperiodic / Julia / Lissajous ripple concepts
- Drill overlay / welcome hero live play
- Apply-to-home / Convex settings
- Anki / practice event logging
