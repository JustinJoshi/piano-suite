# Piano Suite — Core Design Principles

This document captures the visual and interaction design principles implemented across the Piano Suite application. It is derived from the token system in `app/globals.css`, the component layer under `components/`, and the layout conventions in `app/`.

---

## 1. Token-Driven Theming

The entire interface is built on a single source of truth for color: CSS custom properties in `app/globals.css`. Tailwind utilities such as `bg-primary`, `text-muted-foreground`, and `ring-border` are mapped to these variables through the `@theme inline` block.

- **Default theme**: Amber / brass-and-ebony (`:root`).
- **Alternate dark presets**: Rose, Emerald, Ocean, Violet, Slate — each a CSS class that overrides only the brand ramp (`primary`, `accent`, `ring`, glow).
- **Ivory** is the one light preset (`appearance: "light"` in the registry). It overrides the whole surface ladder and flips the action colour to ebony, so a CTA is still "the key you press".
- **Registry**: `lib/themes.ts` lists the available presets, their `appearance`, and provides type-safe helpers (`isThemeId`, `findTheme`).
- **Persistence**: `hooks/useThemePreference.ts` stores the choice in `localStorage` via `next-themes` and syncs it to Convex when the user has Pro sync (`canPersist`).
- **UI entry point**: `/settings/theme` presents theme cards with a live mini keybed, glow, and staff-line preview.

> Principle: colors are semantic and swappable; no component should hard-code a hex value.

---

## 2. Semantic Color Architecture

Colors are named by role, not by hue, so a theme change does not require touching components. Four axes keep a single accent from doing every job at once.

| Role | Token examples | Usage |
|------|----------------|-------|
| **Surfaces** | `background` → `card` → `elevated` → `popover`, plus `muted` | A real luminance ladder: page, panels, raised tiles, dropdowns |
| **Text** | `foreground`, `card-foreground`, `muted-foreground` | Headings, body, hints, labels |
| **Brand** | `primary`, `primary-foreground`, `accent`, `ring` | Logo chip, eyebrows, links, active nav, focus rings, lit keys |
| **Action** | `action`, `action-foreground`, `action-hover`, `shadow-key` | Primary buttons only — ivory on a dark stage, ebony on Ivory |
| **Doors** | `door-play`, `door-explore`, `door-learn` | The three entry paths (Play / Explore / Learn) wherever they appear: door cards, sidebar section dots, marketplace and articles headers |
| **Piano constants** | `ivory`, `ebony` | Key colours in the `Keybed` motif; never change between themes |
| **Borders** | `border`, `input`, `staff-line` | Ivory at low alpha — hairlines never carry the brand hue |
| **Feedback** | `success`, `destructive`, `grade-again`, `grade-hard`, `grade-good`, `grade-easy` | MIDI connected, errors, Anki-style grading badges |
| **Graphics** | `hero-glow-*`, `hero-orb-*`, `beam-*`, `primary-glow` | Hero gradients, glows, chart accents |

**Brand is not action.** The amber ramp labels and highlights; it does not fill buttons. The `default` `Button` variant is the action colour with a `shadow-key` edge (a piano key you can press); the `brand` variant exists for the rare control that should carry the theme hue (theme pickers, "applied" states).

**Inverse bands.** `.tone-inverse` swaps the surface, text, border, action, and staff-line tokens for their `--inverse-*` counterparts, so a section can flip to an ivory (or, on Ivory, ebony) stage while every child keeps using the same utility names. Used by the closing CTA and one feature band on the landing page.

Grade colors are used consistently in the tracking chart (`components/tracking/tracking-chart.tsx`) and in the chord-drill grading badge.

---

## 3. Dark-First, Warm-Tone Aesthetic — "the studio"

The default palette assumes a dark environment:

- Page background: `#0c0a08` (near-black with warm undertones)
- Primary text: `#efe8d6` (warm off-white)
- Surface ladder: `#171410` card → `#1f1b15` elevated → `#262119` popover
- Primary brand: `#d3ab2e` (amber brass), accent `#e8cf7a`
- Piano constants: ivory `#f3ecd9`, ebony `#0b0a09`

The warmth reinforces the "piano suite" metaphor — brass, wood, low studio light — while high contrast keeps data readable. The Ivory preset is the same studio with the lights on: paper surfaces, ebony action colour, the same brass accents.

### Music motifs

A small vocabulary of decorative primitives carries the theme without illustration:

- **`Keybed`** (`components/brand/keybed.tsx`, geometry in `lib/keybed.ts`) — an SVG piano keybed drawn from `--ivory` / `--ebony`, with optional lit keys (a chord) in the brand or a door hue. Keys are shaded like the real thing — fallboard shadow, the white keys' front lip, black keys with a lit top face, a sloped front and a cast shadow, the red key-slip felt under the rail — using id-free overlays so it can render anywhere. `closingC` ends the range on a C. It stretches to its box, so use it on card edges (door cards, marketplace cards, theme previews, the Anki card, the auth stage). Always `aria-hidden`.
- **`KeybedStrip`** (`components/brand/keybed-strip.tsx`) — the full-bleed version: one octave tiled at a fixed key width, so keys keep their proportions from 375px to 2560px. Footer, closing CTA, demo frame, sidebar, drill gate.
- **The playable keybed** (`components/welcome/playable-keybed.tsx`) — the hero's stage edge is an instrument: click, tap, glissando, or MIDI; a name board above the keys names what's held (`lib/chord-naming.ts`) and a light follows the hand.
- **`.staff-stave`** — exactly one five-line stave (12px gaps) for places where notes are actually drawn ("how it works" is a rising C–E–G arpeggio in one bar). Unlike `.staff-lines`, which is texture.
- **`.staff-lines-edges`** — mask that keeps staff texture to a panel's frame and clears it behind centred copy (closing CTA, pricing hero, drill gate). Lines never run through paragraphs.
- **`.final-barline`** — the thin-thick double bar that ends a piece: the end of "how it works", the empty bar on the 404, the footer's *Fine*.
- **`.movement-numeral`** — Fraunces' wonky italic for movement numbers (I–VI) on the landing bands, as a concert programme numbers movements. `.drop-cap` sets an engraved initial on a band's opening paragraph (`initial-letter` where supported).
- **`.prose-veil`** — a soft pool of page colour behind long copy over the live atmosphere (no blur; the canvas animates).
- **`.metronome-dot`** — the hero eyebrow's metronome: counts in four beats at ♩ = 72, then rests.
- **`.skeleton`** — loading placeholder with a slow sheen; still under reduced motion.
- **`.staff-lines`** / **`.staff-lines-faded`** — five hairlines repeating every 128px, from `--staff-line`. The faded variant is a mask and must sit on its own absolutely positioned decor layer, never on a content container.
- **`.bar-line`** — a thin brand-tinted rule with heavier end caps, used between section headings and content (a measure's bar line).
- **`.measure-number`** — large, faint, italic Fraunces numerals for numbered sections (01, 02 …).
- **`.grain`** — very-low-alpha noise overlay for large flat areas (inverse bands).
- **`.glass`** — the sticky-chrome treatment (background at ~72% + blur).
- **`.key-press`** — 2px downward translate on `:active` for primary buttons.
- **`.rise-in`** — a short entrance for hero copy; respects `prefers-reduced-motion`.

---

## 4. Typography as Information Architecture

Three Google fonts create a clear hierarchy:

- **Inter** (`--font-inter`) — body, labels, navigation, inputs.
- **Fraunces** (`--font-fraunces`) — display headings, section titles, brand wordmarks. Loaded with its `SOFT`, `WONK`, and `opsz` axes; `.font-heading` sets the soft axis and leaves `opsz` to the browser (`font-optical-sizing: auto`), so an 18px card title gets the open text cut and a 72px headline the tight display cut. **Never pin `opsz` in `font-variation-settings`** — a fixed display value collapsed the word spaces of every small heading. Used with `tracking-tight` and `font-semibold`; the hero italicises the second clause of its headline in the accent colour.
- **Geist Mono** (`--font-geist-mono`) — timers, chord notes, stats, code.

Headings are large, tight, and high-contrast (`text-foreground`). Body copy uses `leading-relaxed` and `text-muted-foreground` to reduce eye strain during longer reads (see `components/articles/article-content.tsx`).

The **brand mark** is the musical-note glyph in `app/icon.svg` (lucide `Music`), restored as the shipping default in commit `811c0b0`. In-app chrome uses `components/brand/piano-suite-mark.tsx` with `currentColor` / theme tokens; Logo Lab (`/tools/logo-lab`) can **Apply logo** to replace it with a Chladni nodal figure (localStorage always; Convex when Pro), and `isShippingLogoMark()` decides which is in use. Static favicons bake amber defaults because they cannot read CSS variables.

---

## 5. Card-Based, Bordered Surfaces

Information is grouped inside rounded cards with a consistent treatment:

- `rounded-2xl`
- `bg-card` / `text-card-foreground`, or `bg-elevated` for a tile that sits on a card
- `border border-border` plus `shadow-surface`; `shadow-raised` on hover or for the one featured card on a page
- Internal spacing via `p-6` / `p-4` and `gap-4`

Cards appear in the tool dashboard (`ToolCard`), article listings (`ArticleCard`), the Workshop grid (`WorkshopTile`), the block library (`MarketplaceCard`), drill settings, and the tracking dashboard. Hover states lift the card slightly (`-translate-y-0.5`), shift the border toward `primary/30`, and step the shadow up. Icon chips are `rounded-xl` with a hue tint and a `ring-1` in the same hue (`ToolCard` `tone` picks brand or a door hue).

---

## 6. Generous Rounding & Pill-Shaped CTAs

Interactive elements favor soft, rounded forms:

- **Buttons**: `rounded-lg` by default; primary CTAs use `rounded-full` and the action colour with `shadow-key`.
- **Badges / chips**: `rounded-full` (e.g., deck tags, FSRS/Web MIDI chips, grade pills, "Featured").
- **Inputs / selects**: `rounded-lg` with `border-border` and `focus:border-ring`.
- **Cards**: `rounded-2xl`; nested tiles `rounded-xl`.

This creates a friendly, tactile feel appropriate for a practice app where users repeatedly tap controls while looking away at a keyboard.

---

## 7. Glassmorphism for Navigation Overlays

Sticky headers and floating chips use translucent backgrounds plus blur to stay unobtrusive:

- `DrillShell` header, the mobile dashboard top bar, and the Workshop tile toolbar use the shared `.glass` utility. The public `Navbar` is clear at the top of the page (the atmosphere runs to the top edge) and picks up `.glass`, a hairline, and a soft shadow once the page scrolls past 8px (`data-scrolled`).
- The public `Navbar` centres its links in a `rounded-full` pill; the active section gets a lit underline (`bg-primary` + `--primary-glow`).
- Hero chips: `bg-primary/10 backdrop-blur-sm`

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
- Each tool is wrapped in `DrillShell`, which provides a sticky glass header with title, subtitle, a `bar-line`, optional right actions, and the mobile Menu control.
- Sidebar sections carry a door-hue dot (drills = play, progress = learn, labs = explore); the active link is a `nav-key` with a lit left edge, and the Workshop entry is the one raised item. A four-octave `Keybed` sits above the account row.
- Settings pages open with `SettingsPageHeader` (eyebrow, heading, description, optional actions).
- The signed-out state of the four ready-made drills is `DrillGate`: the message, a sign-in key, a pointer to the free Workshop, and a keybed edge.
- Content is centered within `max-w-6xl` or `max-w-3xl` containers.

This separates marketing pages (`/`, `/start`, `/marketplace`, `/pricing`, `/articles`) — which use the top `Navbar` and end in `SiteFooter` (keybed top edge, wordmark, links) — from the application workspace (`/tools/*`, `/settings/*`) — which uses the sidebar (fixed on desktop, drawer on mobile). The Clerk sign-in / sign-up pages sit on `AuthStage`. The landing page reads like a concert programme: a hero whose stage edge is a playable keybed, "how it works" written as one bar of music, starter cards that show a miniature of their Workshop page, movements I–IV (one inverse) with drop caps, V the Anki card, VI the demo framed as a stage, an inverse closing CTA, and a footer that ends on *Fine*.

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

## 12. The Small Things

Details that are cheap to keep and noticeable when missing:

- **Typographer's punctuation.** Copy uses ’ “ ” — and never a straight `'` in prose; hyphenated number phrases ("46-second") never break across lines.
- **Figures.** `.font-mono`, `<time>`, and `[data-numeric]` get tabular figures so counters and timers don't jitter. Dates are `<time dateTime>` and bare ISO dates are formatted in UTC (`lib/article-date.ts`).
- **Native controls** pick up the brand through `accent-color`; inputs get a brand caret; placeholders are softened muted text.
- **Focus.** Links without their own ring get an offset outline; every public page has a *Skip to content* link.
- **Chrome that responds.** The public navbar is clear at the top of a page and gathers glass and a hairline once it scrolls. `<meta name="theme-color">` follows the active preset.
- **Keys are keys.** Anything drawn as a piano key is ivory and ebony, on every theme. Hover lifts are `-translate-y-0.5` with `motion-reduce:` resets. Decorative motion that starts on its own ends inside five seconds.
- **Buttons are the action colour everywhere**, including third-party UI (Clerk's primary button via `authAppearance`).

---

## 13. Minimal Hard-Coding / Anti-Patterns

`AGENTS.md` enforces a strict rule: do not hard-code hex, rgb, hsl, gradients, or glow shadows in components. Colors must come from the token system. Examples of the intended pattern:

- ✅ `bg-primary text-primary-foreground`
- ✅ `shadow-[0_0_12px_2px_var(--primary-glow)]`
- ❌ `bg-[#c9a227]`
- ❌ `text-blue-500` for branded UI

If a component needs a color not covered by tokens, the convention is to add a new semantic token to `app/globals.css` rather than introduce a one-off value.

---

## Summary

Piano Suite's design is intentionally cohesive: a dark, warm studio palette with one light counterpart; semantic, swappable tokens on four axes (surface, brand, action, door); a small vocabulary of music motifs (keybed, staff lines, bar lines, measure numbers); rounded, elevated card surfaces; an engraved display face; and a dashboard-style workspace for practice tools. The result is an interface that feels like a single instrument rather than a collection of pages.
