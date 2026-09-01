# Piano Suite — Core Design Principles

This document captures the visual and interaction design principles implemented across the Piano Suite application. It is derived from the token system in `app/globals.css`, the component layer under `components/`, and the layout conventions in `app/`.

---

## 1. Token-Driven Theming

The entire interface is built on a single source of truth for color: CSS custom properties in `app/globals.css`. Tailwind utilities such as `bg-primary`, `text-muted-foreground`, and `ring-border` are mapped to these variables through the `@theme inline` block.

- **Default theme**: Amber / piano-gold (`:root`).
- **Alternate presets**: Rose, Emerald, Ocean, Violet, Slate — each defined as a CSS class that overrides only the brand-derived tokens.
- **Registry**: `lib/themes.ts` lists the available presets and provides type-safe helpers (`isThemeId`, `findTheme`).
- **Persistence**: `hooks/useThemePreference.ts` stores the choice in `localStorage` via `next-themes` and syncs it to Convex when the user has Pro sync (`canPersist`).
- **UI entry point**: `/settings/theme` presents theme cards that preview `background`, `primary`, `accent`, and `card` swatches live.

> Principle: colors are semantic and swappable; no component should hard-code a hex value.

---

## 2. Semantic Color Architecture

Colors are named by role, not by hue, so a theme change does not require touching components.

| Role | Token examples | Usage |
|------|----------------|-------|
| **Surfaces** | `background`, `card`, `popover`, `muted` | Page, panels, dropdowns, subtle fills |
| **Text** | `foreground`, `card-foreground`, `muted-foreground` | Headings, body, hints, labels |
| **Brand** | `primary`, `primary-foreground`, `accent` | CTAs, active nav, focus rings, highlights |
| **Borders** | `border`, `input`, `ring` | Dividers, fields, focus states |
| **Feedback** | `destructive`, `grade-again`, `grade-hard`, `grade-good`, `grade-easy` | Errors, Anki-style grading badges |
| **Graphics** | `hero-glow-*`, `hero-orb-*`, `beam-*`, `primary-glow` | Hero gradients, glows, chart accents |

Grade colors are used consistently in the tracking chart (`components/tracking/tracking-chart.tsx`) and in the chord-drill grading badge.

---

## 3. Dark-First, Warm-Tone Aesthetic

The default palette assumes a dark environment:

- Page background: `#0c0a08` (near-black with warm undertones)
- Primary text: `#ede6d6` (warm off-white)
- Cards: `#16140f` and `#1c1912` (deep brown-gray)
- Primary brand: `#c9a227` (amber gold)

The warmth reinforces the “piano suite” metaphor — brass, wood, low studio light — while high contrast keeps data readable.

---

## 4. Typography as Information Architecture

Three Google fonts create a clear hierarchy:

- **Inter** (`--font-inter`) — body, labels, navigation, inputs.
- **Fraunces** (`--font-fraunces`) — display headings, section titles, brand wordmarks. Used with `tracking-tight` and `font-semibold`.
- **Geist Mono** (`--font-geist-mono`) — timers, chord notes, stats, code.

Headings are large, tight, and high-contrast (`text-foreground`). Body copy uses `leading-relaxed` and `text-muted-foreground` to reduce eye strain during longer reads (see `components/articles/article-content.tsx`).

The **brand mark** is the musical-note glyph in `app/icon.svg` (lucide `Music`), restored as the shipping default in commit `811c0b0`. In-app chrome uses `components/brand/piano-suite-mark.tsx` with `currentColor` / theme tokens; Logo Lab (`/tools/logo-lab`) can **Apply logo** to replace it with a Chladni nodal figure (localStorage always; Convex when Pro), and `isShippingLogoMark()` decides which is in use. Static favicons bake amber defaults because they cannot read CSS variables.

---

## 5. Card-Based, Bordered Surfaces

Information is grouped inside rounded cards with a consistent treatment:

- `rounded-xl`
- `bg-card` / `text-card-foreground`
- `ring-1 ring-foreground/10` or `border border-border`
- Internal spacing via `p-6` / `p-4` and `gap-4`

Cards appear in the tool dashboard (`ToolCard`), article listings (`ArticleCard`), chat (`ChatPage`), drill settings, and the tracking dashboard. Hover states typically shift the border toward `primary/30` and the background to `card/80`.

---

## 6. Generous Rounding & Pill-Shaped CTAs

Interactive elements favor soft, rounded forms:

- **Buttons**: `rounded-lg` by default; primary CTAs often use `rounded-full`.
- **Badges / chips**: `rounded-full` (e.g., deck tags, FSRS/Web MIDI chips, grade pills).
- **Inputs / selects**: `rounded-lg` with `border-border` and `focus:border-ring`.
- **Cards**: `rounded-xl`.

This creates a friendly, tactile feel appropriate for a practice app where users repeatedly tap controls while looking away at a keyboard.

---

## 7. Glassmorphism for Navigation Overlays

Sticky headers and floating chips use translucent backgrounds plus blur to stay unobtrusive:

- `Navbar`: `bg-background/80 backdrop-blur-md`
- `DrillShell` header: `bg-background/95 backdrop-blur`
- Hero chips: `bg-card/80 backdrop-blur-sm`

The effect separates navigation from content without introducing solid bars that would visually chop the page.

---

## 8. Hero Visual Language

The landing page keeps a **fixed, full-viewport** Three.js math atmosphere pinned behind the translucent sticky navbar and all marketing content. Sparse hero copy (eyebrow, headline, one sentence, one CTA) sits in the first `min-h-svh` screen above a token-driven scrim; below the fold, opaque feature cards float over the same live pattern with transparent section shells.

The hero visual is not fixed to one concept. `lib/hero-atmosphere.ts` defines the hero kind as `chladni | quasiperiodic` (Chladni is the default; Pattern Lab and Quasiperiodic Lab each switch it via **Apply to home**). Beyond the hero, `lib/ambient-effects.ts` lets any shipped visualization — Chladni, Quasiperiodic, MIDI Ripple, Julia, Lissajous — act as a per-route background or a floating panel, configured at `/settings/atmosphere`. Every variant follows the same restraint below: soft, theme-derived color and a scrim that never fades to a solid page background.

- `.hero-scrim` — radial + vertical gradients using `--color-background` via `color-mix`, creating a quiet pocket behind hero text without fading to a solid page background, so the pattern continues under later sections. Kept light enough that pattern edges remain visible under/around the nav.
- `.hero-glow` — layered radial accents using `hero-glow-*` tokens, kept light so it does not fight the scrim.
- `.hero-orb` / `.beam` — retained as theme utilities for secondary marketing motifs elsewhere; they are no longer the primary hero composition.

Line color on the landing atmosphere is a **muted primary-into-background** tint (`colorSoftness` + `lineIntensity` on `ChladniVisualization`): theme primary / orb tokens are mixed toward `--color-background` so the field complements headline accents without competing with `text-foreground`. The Chladni Pattern Lab (`/tools/chladni`) keeps vivid exploration defaults (full intensity, no softness). Users may override atmosphere params (full Lab snapshot, optional pattern color, scrim darkness via `--hero-scrim-strength`) from Pattern Lab; **Reset home** restores the soft shipping defaults. Unless overridden, all colors still follow the active theme.

---

## 9. Dashboard Layout Conventions

The tools and settings sections follow a Vercel-style dashboard pattern:

- Fixed left sidebar (`dashboard-sidebar`, `260px`) with `bg-sidebar-background` on `md` and up.
- Main content offset by `dashboard-main margin-left: var(--sidebar-width)` from `md` up; full-width below `md`.
- Below `md`, the sidebar is an off-canvas drawer (slide over content) with a glass backdrop (`bg-background/60 backdrop-blur-sm`). Open it from the Menu control in sticky dashboard headers (`DrillShell`, Tools hub, Tracking) or the settings mobile top bar. Close via link navigation, backdrop tap, Escape, or the drawer close control.
- Each tool is wrapped in `DrillShell`, which provides a sticky top header with title, subtitle, optional right actions, and the mobile Menu control.
- Content is centered within `max-w-6xl` or `max-w-3xl` containers.

This separates marketing pages (`/`, `/articles`, `/chat`) — which use the top `Navbar` — from the application workspace (`/tools/*`, `/settings/*`) — which uses the sidebar (fixed on desktop, drawer on mobile).

---

## 10. Clarity Through State & Feedback

The UI communicates drill state through color, text, and micro-animations:

- **MIDI status**: red destructive banner when unsupported, green `Connected` dot when active (`components/drills/midi-connection-bar.tsx`).
- **Phase labels**: a rounded badge changes from `bg-muted` to `bg-primary/10` to `bg-success/10` as the drill progresses.
- **Progress**: a `bg-primary` fill inside a `bg-muted` rounded track.
- **Grades**: `bg-grade-good`, `bg-grade-hard`, `bg-grade-again` pills map directly to Anki semantics.
- **Focus**: `focus-visible:ring-ring/50` and `focus:border-ring` give keyboard users a consistent target indicator.

---

## 11. Spacing & Container Rhythm

A repeating spacing cadence keeps pages scannable:

- **Page gutters**: `px-4 sm:px-6 lg:px-8`
- **Content max-widths**: `max-w-7xl` for landing, `max-w-6xl` for dashboards, `max-w-3xl` for reading and theme settings.
- **Section padding**: `py-16 sm:py-20` or `py-12 sm:py-16`.
- **Card internal spacing**: `p-4` / `p-6`, with `gap-4` between related items.

This rhythm creates predictable vertical flow and prevents layout shifts between marketing and app pages.

---

## 12. Minimal Hard-Coding / Anti-Patterns

`AGENTS.md` enforces a strict rule: do not hard-code hex, rgb, hsl, gradients, or glow shadows in components. Colors must come from the token system. Examples of the intended pattern:

- ✅ `bg-primary text-primary-foreground`
- ✅ `shadow-[0_0_12px_2px_var(--primary-glow)]`
- ❌ `bg-[#c9a227]`
- ❌ `text-blue-500` for branded UI

If a component needs a color not covered by tokens, the convention is to add a new semantic token to `app/globals.css` rather than introduce a one-off value.

---

## Summary

Piano Suite’s design is intentionally cohesive: a dark, warm studio palette; semantic, swappable tokens; rounded, card-based surfaces; clear typographic hierarchy; and a dashboard-style workspace for practice tools. The result is an interface that feels like a single instrument rather than a collection of pages.
