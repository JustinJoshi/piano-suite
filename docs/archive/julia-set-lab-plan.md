# Julia Set Lab — Integration Plan

> **Status: shipped** in `4a3a89e` (`feat: add Julia Set Lab as Chladni sibling math explorer`).
> Kept as a historical record of the original plan. For current behavior see `docs/PROJECT_HISTORY.md`
> and the code under `app/tools/julia/` and `lib/julia.ts`. The "next steps" section below
> is obsolete — the Lissajous Harmonic Lab has also shipped.

## Goal

Add a **Julia Set Lab** at `/tools/julia` that mirrors the Chladni Pattern Lab: an interactive, theme-aware WebGL parameter explorer for a second mathematical visual concept. No MIDI, Anki, or Convex practice logging in v1.

## Context

Chladni Lab is a props-driven Three.js shader explorer (not a practice drill):

```
app/tools/chladni/page.tsx
  → DrillShell
    → ChladniLab (controls + morph RAF)
      → ChladniVisualization (Three.js + GLSL + useThemeCssVars)
```

Pure math lives in `lib/chladni.ts`. Landing hero reuses the same visualization with calmer defaults. Sibling tools should copy this shape.

## Math (v1)

Julia set escape-time iteration:

```
z₀ = pixel as complex number (after zoom/pan)
zₙ₊₁ = zₙ² + c
color by iterations until |z| > escapeRadius (smooth coloring)
```

Lab owns `c` (complex parameter), morphs between two `c` values (like Chladni morphs modes), and exposes zoom, iterations, escape radius, and palette softness.

Curated presets (named, aesthetic `c` values), e.g.:

| Preset | c (approx) | Character |
|--------|------------|-----------|
| Seahorse | −0.75 + 0.11i | classic filaments |
| Dendrite | −0.12 + 0.77i | branching |
| Spiral | −0.8 + 0.156i | tight swirls |
| Dragon | 0.285 + 0.01i | near-connected |
| Dust | −0.4 + 0.6i | disconnected |

Plus Random / Play·Pause morph between current and next `c`.

## Architecture

```
app/tools/julia/page.tsx
  → DrillShell(title, subtitle)
    → JuliaLab                          components/drills/julia/julia-lab.tsx
         → JuliaVisualization           components/drills/julia/julia-visualization.tsx
              useThemeCssVars + Three.js ShaderMaterial

lib/julia.ts                            pure math + presets + color helpers
lib/__tests__/julia.test.ts
components/drills/julia/__tests__/julia-lab.test.tsx
```

Reuse from Chladni where sensible:

- `cssColorToRgb` / `mixRgb` / `lerp` / `clamp` / `smoothstep` — either import from `lib/chladni.ts` or extract to `lib/webgl-color.ts` if sharing grows. Prefer importing from `lib/chladni.ts` for v1 to avoid hotspot refactors.
- `useThemeCssVars` with `--color-background`, `--color-primary`, `--hero-orb-inner`, `--primary-glow`.
- Local Lab UI helpers (`ControlGroup`, `RangeControl`, etc.) can be copied from Chladni Lab for v1; extract shared controls later if Lissajous needs them.

Do **not** wire Julia into the landing hero in v1 (Chladni stays the hero atmosphere). Keep the visualization component reusable so a future atmospheric wrapper is easy.

## UI (mirror Chladni Lab)

Layout: `grid gap-6 lg:grid-cols-[1fr_360px]` — viz card left, parameters card right.

Controls:

| Control | State | Notes |
|---------|-------|-------|
| Presets + Random | buttons | apply known `c` / randomize |
| Primary c (re, im) | number inputs | range ≈ −2..2 |
| Next c (re, im) | number inputs | morph target |
| Morph + Play/Pause | 0..1 + auto RAF | same pattern as Chladni |
| Morph speed | seconds | Lab RAF only |
| Zoom | float | shader uniform |
| Max iterations | int | e.g. 32–256 |
| Escape radius | float | default 4 |
| Color softness | 0..1 | mix theme colors toward background |
| Time / palette cycle | optional slow hue shift | keep subtle; theme tokens remain source |

No pan/deep-zoom mouse explorer in v1 (scope control). Sliders + presets are enough to match Chladni’s interaction density.

## Registration

Hotspot files (coordinate if other agents are active):

- [`components/tools/sidebar.tsx`](../components/tools/sidebar.tsx) — add `{ name: "Julia Lab", href: "/tools/julia", icon: … }` (e.g. Lucide `Sparkles` or `Aperture`)
- [`app/tools/page.tsx`](../app/tools/page.tsx) — add ToolCard entry
- [`README.md`](../README.md) — document Julia Set Lab alongside Chladni
- No `convex/schema.ts` changes

## Testing & gate

- Unit tests for `lib/julia.ts`: escape iteration helpers, preset validity, clamp/lerp if duplicated, smooth-color formula sanity.
- Component smoke test for `JuliaLab` (renders presets, toggles morph) matching Chladni lab test style.
- Gate: `npm run lint`, `npm run test:unit:run`, `npm run build`.
- No e2e required for this explorer (same as Chladni).

## Worktree

Branch: `auto/julia-set-lab`  
Worktree: `.worktrees/auto-julia-lab`

## Out of scope (v1)

- MIDI / audio reactivity
- Convex settings persistence
- Landing-hero swap
- Mouse pan / deep zoom
- Mandelbrot companion picker (nice follow-on)

---

## Next: Lissajous Harmonic Lab (planned after Julia)

Second math-viz tool. Frequency-ratio curves where axes map to musical intervals (e.g. 3:2 perfect fifth, 4:3 fourth, 5:4 major third). Same DrillShell + WebGL/Canvas lab pattern. Stronger pedagogy link for Piano Suite. Implement only after Julia Lab ships.

Rough shape (not built yet):

- `lib/lissajous.ts` — `x = sin(a t + δ)`, `y = sin(b t)` plus interval preset table
- `/tools/lissajous` — trail/glow renderer, ratio presets, phase/delta, trail length
- Register in sidebar + tools page

---

## Backburner: MIDI-synced background ripple

Idea only — do not implement now.

A customizable background ripple/atmosphere that reacts to notes the user plays, with a selectable visual language per musical concept already shipped (Chladni nodal field, Julia escape field, Lissajous trails, …). Likely lives as a shared overlay primitive used by drill pages and/or landing, with theme tokens and per-concept presets.

Parking lot notes:

- Map pitch class → spatial phase / parameter seed
- Map velocity → ripple amplitude
- Map chord density → blend or secondary wave
- User setting: which visual concept drives the ripple
- Keep explorers props-driven so MIDI coupling stays at a higher layer (same lesson as Chladni)

Revisit after Julia + Lissajous labs exist and share a clear visualization interface.
