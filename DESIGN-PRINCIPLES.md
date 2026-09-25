# Piano Suite — Core Design Principles

This document captures the visual and interaction design principles implemented across the Piano Suite application. It is derived from the token system in `app/globals.css`, the component layer under `components/`, and the layout conventions in `app/`.

---

## 1. Token-Driven Theming

The entire interface is built on a single source of truth for color: CSS custom properties in `app/globals.css`. Tailwind utilities such as `bg-primary`, `text-muted-foreground`, and `ring-border` are mapped to these variables through the `@theme inline` block.

- **Default theme**: Roll (`.roll`), a light preset: roll paper for surfaces, printing ink for text and the action key, red key-slip felt for the brand.
- **Public pages always wear the roll.** `RollFrame` and `AuthStage` put `.tone-roll` (the same token block as `.roll`) on their subtree, so `/`, `/start`, `/marketplace`, `/pricing`, `/routes`, `/articles`, the legal pages, the 404 and sign-in look the same whatever preset is saved. Presets apply to the workspace.
- **Amber** (`:root`, "the studio") and the dark presets Rose, Emerald, Ocean, Violet, Slate — each dark preset overrides only the brand ramp (`primary`, `accent`, `ring`, glow).
- **Ivory** is the other light preset (`appearance: "light"` in the registry). Like Roll, it overrides the whole surface ladder and flips the action colour to ebony, so a CTA is still "the key you press".
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
| **Action** | `action`, `action-foreground`, `action-hover`, `shadow-key` | Primary buttons only — ivory on a dark stage, ebony on Ivory, ink on the roll |
| **Doors** | `door-play`, `door-explore`, `door-learn` | The three entry paths (Play / Explore / Learn) wherever they appear: door cards, sidebar section dots, marketplace and articles headers |
| **Piano constants** | `ivory`, `ebony` | Key colours in the `Keybed` motif and every drawn key; never change between themes |
| **Roll constants** | `paper` (+ `-deep`, `-bright`), `felt` (+ `-bright`), `case` (+ `-raised`, `-foreground`), `brass`, `lamp`, `hole`, `rule` | The instrument's materials: paper, the key slip's red felt, the dark wooden case, the tracker bar's brass and lit slots, punched holes, printed rules. Never change between themes |
| **Borders** | `border`, `input`, `staff-line` | Ivory at low alpha — hairlines never carry the brand hue |
| **Feedback** | `success`, `destructive`, `grade-again`, `grade-hard`, `grade-good`, `grade-easy` | MIDI connected, errors, Anki-style grading badges |
| **Graphics** | `hero-glow-*`, `hero-orb-*`, `beam-*`, `primary-glow` | Hero gradients, glows, chart accents |

**Brand is not action.** The brand ramp (felt red on the roll, brass on Amber) labels and highlights; it does not fill buttons. The `default` `Button` variant is the action colour with a `shadow-key` edge (a piano key you can press); the `brand` variant exists for the rare control that should carry the theme hue (theme pickers, "applied" states).

**Inverse bands.** `.tone-inverse` swaps the surface, text, border, action, and staff-line tokens for their `--inverse-*` counterparts, so a section can flip to an ivory (or, on Ivory, ebony) stage while every child keeps using the same utility names. On the roll the inverse set is the dark case. No component uses it since the studio landing was retired; the roll puts dark chrome on the case with `.roll-on-case` instead.

Grade colors are used consistently in the tracking chart (`components/tracking/tracking-chart.tsx`) and in the chord-drill grading badge.

---

## 3. Two Materials — the roll and the studio

### The roll (public pages, and the default)

Every public page is a player-piano roll. The page behind the paper is the dark inside of the instrument (`--case`); one long sheet of roll paper (`--paper`, with a faint fibre noise) hangs from the tracker bar at the top and ends on the key slip at the bottom. Printed things are ink (`--foreground` `#1c1814`); the brand is the red felt under the keys (`--felt` `#a4262c`); the tracker bar is brass (`--brass`) with slots that light (`--lamp`) when their note sounds; holes are `--hole`. The metaphor carries the product's story: a roll is a practice machine someone built by hand, one person's playing encoded so someone else can use it.

Component styles live in `app/roll.css`: `roll-`-prefixed classes that read only globals.css tokens (the one literal is the `@property --hc` initial value, which cannot be a variable). The pieces:

- **The frame** (`components/roll/roll-frame.tsx`) — `RollFrame` is every public page: the case, the tracker bar (`components/navbar.tsx`), an optional leader (the paper's cut end hooked onto the bar, landing only), the paper sheet as `<main>`, and the key slip (`components/site-footer.tsx`). Page layouts (`app/marketplace/layout.tsx`, `app/routes/layout.tsx`, `app/articles/layout.tsx`) wrap their pages in it.
- **The tracker bar** — one slot per semitone from C3 to C6 (37 lanes). A slot lights whenever its note sounds anywhere: a key the visitor presses, a MIDI keyboard, a hole on the roll passing the bar, the music player. The wordmark's three holes are a C major chord and light for C, E and G.
- **Passages** (`RollPassageView`, `RollInterlude`) — real music punched between landing sections (`lib/roll-music.ts`). As the reader scrolls, holes pass the bar's reading line and play, if sound is on (`useRollSound`: off until the visitor asks or plays a key). Fast scrolling lights the bar but stays silent.
- **The margin grid** — from 900px the paper has a left margin column: `RollPageHead` puts a page's label and a marginal note there, `RollRuleLabel` rules off a section, `RollMain` holds the body.
- **`RollChordStrip`** — a chord punched across the top edge of a paper card (door cards, route cards, marketplace cards). The roll's answer to the studio's keybed card edge.
- **`RollTicket`** — the primary call to action: a ticket with a perforated tear line that lights like a glissando on hover.
- **The key slip** — the footer: dark case under a strip of red felt (`.roll-felt`), wordmark, four link columns, exactly one Terms and one Privacy link.
- **The auth stage** — Clerk's card laid on the case like a sheet of paper, with the felt along the bottom.
- **Type on paper** — Newsreader for running text and headings, Archivo condensed for labels, roll numbers and tempo markings (see §4).
- **Motion** — `useRollReveal` rises `[data-roll-reveal]` elements as they reach the reader; the leader drops in once. Every animation is finite and sits under `prefers-reduced-motion: no-preference`; the CSS only hides reveal targets under `@media (scripting: enabled)`.

### The studio (Amber and the dark presets)

The studio palette assumes a dark environment:

- Page background: `#0c0a08` (near-black with warm undertones)
- Primary text: `#efe8d6` (warm off-white)
- Surface ladder: `#171410` card → `#1f1b15` elevated → `#262119` popover
- Primary brand: `#d3ab2e` (amber brass), accent `#e8cf7a`
- Piano constants: ivory `#f3ecd9`, ebony `#0b0a09`

The warmth reinforces the "piano suite" metaphor — brass, wood, low studio light — while high contrast keeps data readable. The Ivory preset is the same studio with the lights on: paper surfaces, ebony action colour, the same brass accents.

### Music motifs in the workspace

A small vocabulary of decorative primitives carries the theme in the workspace without illustration:

- **`Keybed`** (`components/brand/keybed.tsx`, geometry in `lib/keybed.ts`) — an SVG piano keybed drawn from `--ivory` / `--ebony`, with optional lit keys (a chord) in the brand or a door hue. Keys are shaded like the real thing — fallboard shadow, the white keys' front lip, black keys with a lit top face, a sloped front and a cast shadow, the red key-slip felt under the rail — using id-free overlays so it can render anywhere. `closingC` ends the range on a C. It stretches to its box, so use it on card edges (theme previews, the Open Graph image). Public pages use `RollChordStrip` instead. Always `aria-hidden`.
- **`KeybedStrip`** (`components/brand/keybed-strip.tsx`) — the full-bleed version: one octave tiled at a fixed key width, so keys keep their proportions from 375px to 2560px. Sidebar, drill gate.
- **`.staff-lines-edges`** — mask that keeps staff texture to a panel's frame and clears it behind centred copy (drill gate). Lines never run through paragraphs.
- **`.skeleton`** — loading placeholder with a slow sheen; still under reduced motion.
- **`.staff-lines`** / **`.staff-lines-faded`** — five hairlines repeating every 128px, from `--staff-line`. The faded variant is a mask and must sit on its own absolutely positioned decor layer, never on a content container.
- **`.bar-line`** — a thin brand-tinted rule with heavier end caps, used between section headings and content (a measure's bar line).
- **`.glass`** — the sticky-chrome treatment (background at ~72% + blur).
- **`.key-press`** — 2px downward translate on `:active` for primary buttons.

Retired with the studio landing and currently unused (their CSS is still in `app/globals.css`): `.staff-stave`, `.final-barline`, `.movement-numeral`, `.drop-cap`, `.prose-veil`, `.metronome-dot`, `.measure-number`, `.grain`, `.rise-in`, `.tone-inverse`. Reach for a roll piece first; delete these once nothing needs them.

---

## 4. Typography as Information Architecture

Four Google fonts create a clear hierarchy:

- **Newsreader** (`--font-newsreader`, exposed as `--font-heading` and `--font-serif`) — the roll's printed type: headings everywhere, and running text on public pages (`.tone-roll` sets `font-family: var(--font-serif)`). Loaded with its `opsz` axis and left to the browser (`font-optical-sizing: auto`), so a 17px paragraph gets the open text cut and a 72px headline the tight display cut. **Never pin `opsz` in `font-variation-settings`** — a fixed display value collapsed the word spaces of every small heading (learned on Fraunces, which Newsreader replaced). The landing hero italicises the second clause of its headline (`*asterisks*` in the copy).
- **Archivo** (`--font-archivo`, exposed as `--font-label`) — condensed through its `wdth` axis: roll numbers, tempo markings, button faces, ruled labels. Condensing narrows its word space to about a letter gap, so mixed-case condensed labels carry `word-spacing: 0.12em` (the grouped rule in `app/roll.css`'s type section; add new label classes to it). Tracked uppercase labels don't need it.
- **Inter** (`--font-inter`) — workspace body, labels, navigation, inputs.
- **Geist Mono** (`--font-geist-mono`) — timers, chord notes, stats, code.

Headings are large, tight, and high-contrast (`text-foreground`). Body copy uses `leading-relaxed` and `text-muted-foreground` to reduce eye strain during longer reads (see `components/articles/article-content.tsx`).

The **brand mark** is the musical-note glyph in `app/icon.svg` (lucide `Music`), restored as the shipping default in commit `811c0b0`. In-app chrome uses `components/brand/piano-suite-mark.tsx` with `currentColor` / theme tokens; Logo Lab (`/tools/logo-lab`) can **Apply logo** to replace it with a Chladni nodal figure (localStorage always; Convex when Pro), and `isShippingLogoMark()` decides which is in use. Static favicons bake fixed colours because they cannot read CSS variables.

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

- `DrillShell` header, the mobile dashboard top bar, and the Workshop tile toolbar use the shared `.glass` utility.

The effect separates navigation from content in the workspace without introducing solid bars that would visually chop the page. Public pages do the opposite on purpose: their header is the tracker bar, a solid brass-and-case bar the paper feeds past (§3).

---

## 8. Atmosphere Visual Language

The roll is opaque paper, so `AmbientEffectsHost` switches the ambient canvas off on every roll route (`lib/roll-routes.ts`), including `/`. The landing's hero is a working four-chord drill on the paper (`components/welcome/roll/drill-console.tsx`), not a visual. The math atmospheres live on in the workspace and the labs.

**Known gap:** Pattern Lab's and Quasiperiodic Lab's **Apply to home** still write the home hero settings, but nothing on `/` renders them now.

The atmosphere is not fixed to one concept. `lib/hero-atmosphere.ts` defines the hero kind as `chladni | quasiperiodic` (Chladni is the default; Pattern Lab and Quasiperiodic Lab each switch it via **Apply to home**). Beyond the hero, `lib/ambient-effects.ts` lets any shipped visualization — Chladni, Quasiperiodic, MIDI Ripple, Julia, Lissajous — act as a per-route background or a floating panel, configured at `/settings/atmosphere`. Every variant follows the same restraint below: soft, theme-derived color and a scrim that never fades to a solid page background.

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

This separates public pages (`/`, `/start`, `/marketplace`, `/pricing`, `/routes`, `/articles`, `/terms`, `/privacy`, the 404) — each one a `RollFrame`: tracker bar, paper, key slip — from the application workspace (`/tools/*`, `/settings/*`) — which uses the sidebar (fixed on desktop, drawer on mobile). The Clerk sign-in / sign-up pages sit on `AuthStage`, the case with Clerk's card laid on it as paper. The 404 is a blank stretch of roll: the lanes are there, nothing is punched (*tacet*).

The landing page (`components/welcome/roll/roll-landing.tsx`) is one long roll: the leader, then a hero holding a real four-chord drill (I–V–vi–IV) whose notes are punched into a mini roll as you play; the four drills, each with *Hear it*; a punched scale; the two guided routes from `lib/routes.ts`; the origin story with its flashcard; sevenths around the circle of fourths; the catalogue of ready-made pages from the starter registry; the block composer; the piece loop that speeds up on each pass (printed shorter on the paper); the community shelf; a pentatonic passage; the reading list; the ledger of your own runs (localStorage, deliberately not practice history); what it costs; and *Fine* with a *Da capo* button.

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
- **Content max-widths**: the roll sheet (`--roll-max`, 1240px) on public pages, `max-w-6xl` for dashboards, `max-w-3xl` for reading and theme settings.
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
- **Chrome that responds.** The tracker bar's slots light for whatever sounds, from anywhere. `<meta name="theme-color">` follows the active preset; the first-paint value is roll paper.
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

Piano Suite's design is intentionally cohesive: public pages as a player-piano roll (paper, ink, felt, a brass tracker bar that lights for every note); a dark, warm studio palette and its light counterparts for the workspace; semantic, swappable tokens on four axes (surface, brand, action, door) beside fixed piano and roll materials; a small vocabulary of music motifs (holes, chord strips, keybeds, staff lines); rounded, elevated card surfaces; a printed serif; and a dashboard-style workspace for practice tools. The result is an interface that feels like a single instrument rather than a collection of pages.
