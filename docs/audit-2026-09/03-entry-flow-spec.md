# Entry Flow Spec — three doors

A wireframe-level specification for the landing page, the three paths, and
onboarding. Deliberately written **before** any visual design work, so that the
colour and motion pass in Phase 4 has a structure to decorate rather than a
structure to invent.

---

## 1. What is there now, and why it does not work

### The current landing page, top to bottom

1. Sticky navbar — logo plus five links (Workshop, Gallery, Pricing, Articles, Chat) plus Sign in / Try it free
2. Full-viewport hero over an animated Chladni field
3. "How the Workshop works" — three steps
4. Starter templates strip — four cards
5. Feature section 01 — "Your drill, your blocks, your tempo."
6. Feature section 02 — "Not sure where to begin? Grab a starter template." (contains a four-step flow diagram)
7. Feature section 03 — "Built on the science of remembering."
8. Feature section 04 — "A community, not just a toolkit."
9. Anki decks — two download buttons
10. Tools grid — twelve cards (four drills, two progress tools, six labs)
11. Bottom CTA — "Enter the Workshop"
12. Footer

The hero copy:

> **eyebrow:** a free workshop for self-taught pianists
> **headline:** Build your own piano practice — or grab a drill and start playing.
> **subhead:** Snap metronome, timer, and chord blocks together into your own drills, start instantly from a starter template, and share what you build with other self-taught pianists.
> **CTA:** Enter the Workshop → `/tools/workshop`

### Four structural problems

**The headline asks the visitor to make a decision they cannot make yet.**
"Build your own piano practice — or grab a drill and start playing" offers a
fork in a sentence, but the page provides one button. A visitor who wants to
"grab a drill and start playing" has nowhere to click that does that. The copy
promises branching; the layout is linear.

**The one button is locked.** `Enter the Workshop` → `/tools/workshop` →
`proxy.ts` protects `/tools/*` → `/sign-in`. The single most important
interaction on the site is a sign-up wall. Everything else on this page is
downstream of that fact.

**The subhead is three claims in one breath.** "Snap blocks together" +
"start instantly from a template" + "share what you build" — each is a
different product, and a first-time reader has to hold all three to understand
any of them. Your own stated goal was that a person should instantly know
whether this is for them. Twenty-nine words of compound sentence is not that.

**Eight sections look identical.** Every section is a dark card on a dark
background over a dark animated field, introduced by a small amber uppercase
eyebrow. Scrolling produces no sense of arrival anywhere. There is no visual
punctuation, so the page reads as one long undifferentiated column — which is
exactly the "cloudy" feeling.

### Why the sidebar compounds it

A signed-in user sees roughly nineteen destinations: Workshop, Guided routes,
four drills, two progress tools, seven labs, four settings pages. For someone
whose actual question is "how do I get better at piano," this is a control
panel, not a practice space. The Labs section is collapsed by default, which
helps, but the row is still there and it is still labelled Labs.

---

## 2. The three doors

The core structural change: **the hero's job is to route, not to explain.** Three
destinations, chosen because they map to the three states a visitor can be in.

| Door | The visitor's actual state | Destination | Requires an account? |
|---|---|---|---|
| **Play** | "Show me. I have ten minutes." | `/play` — a ready-made drill running immediately | **No** |
| **Explore** | "What can this thing do?" | `/marketplace` — the community gallery | **No** |
| **Learn** | "I don't know how to practice." | `/learn` — articles and guided routes | **No** |

All three must be reachable and useful **without signing in.** That is the whole
game. Right now none of the interesting ones are.

### Wireframe — hero

```
┌──────────────────────────────────────────────────────────────────────┐
│  ♪ Piano Suite            Play   Explore   Learn        [ Sign in ]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              Learn piano by building your own practice.              │
│                                                                      │
│      Free tools for people teaching themselves. No teacher,          │
│                    no subscription, no account needed.               │
│                                                                      │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐          │
│   │   ▶  PLAY     │   │  ✦  EXPLORE   │   │   ▤  LEARN    │          │
│   │               │   │               │   │               │          │
│   │ Start a drill │   │ Practice tools│   │ How to prac-  │          │
│   │ right now     │   │ other people  │   │ tice, without │          │
│   │               │   │ built         │   │ a teacher     │          │
│   │ no account →  │   │  browse →     │   │   read →      │          │
│   └───────────────┘   └───────────────┘   └───────────────┘          │
│                                                                      │
│         ↓ what this is, and why I built it                           │
└──────────────────────────────────────────────────────────────────────┘
```

Three cards, visually distinct from each other — this is the single place in the
app where colour differentiation earns its keep (see §4). The scroll cue is
small and explicitly optional: click is the fast path, scroll is the slow one.
That is your progressive-disclosure principle expressed as layout.

### Copy direction

The current headline sells the mechanism ("snap blocks together"). Sell the
outcome instead, and let the mechanism appear on the second screen.

| Slot | Now | Direction |
|---|---|---|
| Headline | Build your own piano practice — or grab a drill and start playing. | **Learn piano by building your own practice.** |
| Subhead | Snap metronome, timer, and chord blocks… (29 words) | **Free tools for people teaching themselves. No teacher, no subscription, no account needed.** |
| Primary action | One locked button | Three unlocked doors |

Two things that headline does that the current one does not: it states the
outcome (*learn piano*) before the mechanism (*building your own practice*), and
it is short enough to read without deciding anything.

The subhead's job is disqualification, which is a feature. "For people teaching
themselves" tells someone with a teacher that this is not for them, in four
words, and that is a *good* outcome — it is what makes the page feel fast for
the people it *is* for.

### Below the fold — the slow path

For readers who scroll rather than click. Ordered so each section answers the
question the previous one raises.

1. **Why I built this** — 80 words, first person, your face or name. Links to
   "Why I'm Learning Piano Without a Teacher", which is currently your best
   content and is buried in a navbar link.
2. **What a practice page is** — one annotated screenshot of a real Workshop
   page with three or four tiles. Show it; do not describe it.
3. **What people have built** — three real gallery cards, live from Convex. This
   is the marketplace's shop window, and it is why seeding matters.
4. **How practice works here** — the three pillars currently trapped inside the
   six-slide onboarding modal, as scannable content.
5. **Anki decks** — keep it. It is a real differentiator and it self-selects for
   exactly the kind of methodical learner who will stick.
6. Footer.

Note what disappears: the twelve-card tools grid. Labs do not belong on a
landing page. Drills belong behind **Play**.

---

## 3. The three paths in detail

### Play — `/play`

**Rule: a visitor plays something within one click of the landing page, with no
account and no modal.**

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Piano Suite                                       [ Sign in ]     │
├──────────────────────────────────────────────────────────────────────┤
│   Pick something to play                                             │
│                                                                      │
│   ┌────────────────────┐  ┌────────────────────┐                     │
│   │ 🎹 With a MIDI     │  │ 🖱  No keyboard?    │                     │
│   │    keyboard        │  │                    │                     │
│   │ Chord Drill        │  │ Technique timer    │                     │
│   │ Arpeggios          │  │ Metronome practice │                     │
│   │ Progressions       │  │ Ear + theory       │                     │
│   └────────────────────┘  └────────────────────┘                     │
│                                                                      │
│   Progress saves in this browser. Sign in later to keep it.          │
└──────────────────────────────────────────────────────────────────────┘
```

Two requirements this implies:

- **`/play` and the drill routes must be public.** Add them to the `proxy.ts`
  allowlist. Free users already write history to `localStorage` via
  `lib/local-practice-history.ts`, so this works today — the gate is the only
  thing stopping it.
- **The no-hardware column has to be real.** Today, four of the drills need a
  MIDI keyboard and the app has no on-screen keyboard. Most first-time visitors
  will not have a controller plugged in, which means the majority of "Play now"
  traffic currently hits a dead end. The `keyboardDisplay` block in
  [`02-architecture-verdict.md`](02-architecture-verdict.md) §5 is the fix, and
  this is the argument for prioritising it.

### Explore — `/marketplace`

Rename `/workshop` (the gallery) to `/marketplace`, and rename
`/tools/workshop/marketplace` (the component picker) to
`/tools/workshop/blocks`. One name, one meaning.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Practice tools people built                     [ Build your own ]  │
│                                                                      │
│  [ All ] [ Beginner ] [ Chords ] [ Rhythm ] [ Technique ] [ Songs ]  │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│  │ ▓▓ preview ▓▓│ │ ▓▓ preview ▓▓│ │ ▓▓ preview ▓▓│                  │
│  │ First chords │ │ ii-V-I warmup│ │ 12-key cycle │                  │
│  │ by Justin    │ │ by Justin    │ │ by Justin    │                  │
│  │ 4 blocks     │ │ 3 blocks     │ │ 5 blocks     │                  │
│  │ [Try] [Copy] │ │ [Try] [Copy] │ │ [Try] [Copy] │                  │
│  └──────────────┘ └──────────────┘ └──────────────┘                  │
└──────────────────────────────────────────────────────────────────────┘
```

The two buttons carry the loop:

- **Try** — run the page read-only, no account. This is where the marketplace
  earns attention.
- **Copy** — `forkCustomDrill`, which already exists and is tested and is called
  from nowhere. Signed out, fork into `localStorage`; signed in, into Convex.

This is the page that should feel alive — motion, colour, density. It is the one
place in the app where the "moving logos" energy you described belongs, because
it is the only page whose *content* is other people.

**It must not launch empty.** Today it says "No practice pages have been
published yet. Be the first to share one!" — the worst possible first impression
for a community product. Publish the ten starter templates under your own name
before anyone sees it, with a sentence each about why you built it. That is
[`05-soft-launch-plan.md`](05-soft-launch-plan.md) §2.

### Learn — `/learn`

Merge three things that are currently scattered: `/articles` (4 posts),
`/routes` (2 guided routes), and the pillar content trapped in the onboarding
modal.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Learn                                                               │
│                                                                      │
│  START HERE                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐              │
│  │ Music theory route     │  │ Finger flexibility     │              │
│  │ 6 steps · 0 done       │  │ 5 steps · 0 done       │              │
│  └────────────────────────┘  └────────────────────────┘              │
│                                                                      │
│  HOW TO PRACTICE                                                     │
│  · Active recall and spaced repetition                               │
│  · Taking care of your hands                                         │
│  · Working through frustration                                       │
│                                                                      │
│  ARTICLES                                                            │
│  · Why I'm learning piano without a teacher                          │
│  · How to set up Anki + AnkiConnect                                  │
│  · …                                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

The guided routes are the strongest onboarding asset in the product and they are
currently a sidebar row nobody would find. They already end by building a
Workshop page for the user — that is a complete beginner journey that exists and
is invisible.

---

## 4. The colour problem, mechanically

Your read that it is "one flat colour scheme" is correct, and the reason is
narrower than it feels.

`app/globals.css` defines a warm dark palette: background `#0c0a08`, cards
`#16140f` and `#1c1912`, foreground `#ede6d6`, primary `#c9a227`. That is a good
palette. The six presets in `lib/themes.ts` — amber, rose, emerald, ocean,
violet, slate — each swap **the single brand hue**.

So there is exactly one accent colour in the entire system, and it is doing
every job at once:

- brand identity (logo, wordmark)
- primary action (every button)
- active navigation state
- section eyebrow labels
- decorative glows and the hero atmosphere
- focus rings

When one colour means six things, it means nothing. Nothing can be emphasised
because everything already is. That is the mechanism behind "cloudy" — not the
hue, the **overloading**.

And the surfaces compound it: `#0c0a08` background against `#16140f` cards is
about a 2% luminance difference. Section boundaries are effectively invisible,
which is why eight distinct landing sections read as one column.

### Fix: add axes, don't add colours

Do not add a second brand colour. Add **structure** to the one you have.

**Axis 1 — separate brand from action.** Amber stays the brand: logo, links,
accents, atmosphere. Introduce one distinct *action* colour used **only** for
primary buttons. Every CTA on the page then pops because it is the only thing
wearing that colour.

**Axis 2 — give the three doors three identities.** Play / Explore / Learn each
get a hue, used consistently everywhere they appear — landing card, section
header, nav highlight, empty states. Three colours is enough to make the app
feel varied without becoming a rainbow, and it makes the product's structure
*visible*: users learn "the green area is where I go to read."

**Axis 3 — earn depth with elevation.** Widen the surface ladder so cards
actually separate from the page: background → surface → raised → overlay, with
real luminance steps rather than 2%. Add a light-mode token set too — a dark-only
app reads as "for developers," and your audience is beginners on laptops in the
daytime.

**Axis 4 — reserve motion for the marketplace.** Right now the animated Chladni
field is behind *everything*, so it is ambient noise that also costs legibility.
Pin the heavy motion to the two places it means something: the hero, and the
marketplace. Elsewhere, go still. Motion that is everywhere is wallpaper; motion
in one place is emphasis.

All four are token changes in `app/globals.css` plus additions to
`lib/themes.ts`. No component rewrites — the codebase's discipline about never
hard-coding colours is exactly what makes this cheap. That discipline is now
paying off, and it is worth noticing that it was a good call.

---

## 5. Onboarding: stop blocking

Current behaviour: first visit to any `/tools/*` or `/settings/*` route mounts a
`fixed inset-0 z-50` overlay with six slides. Slide one reads "Hi / welcome to
piano suite" with a Next button. Skip is a small link in the top-right corner.

The content is good. Three pillars — active recall and spaced repetition, hand
care, focused versus diffuse thinking — is real pedagogy and it is the most
human writing in the product. The placement is wrong: it is a six-screen toll
booth in front of a tool the visitor has not yet decided they want.

**Replace it with three things:**

1. **A dismissible strip** at the top of the Workshop on first visit: one
   sentence plus "show me how" and a close button. Non-blocking.
2. **The pillars as content** — on `/learn`, and as a landing-page section.
   Reachable by choice, indexable by search engines, linkable from Reddit.
3. **The guided routes as the real onboarding** — they already are one. Six
   steps, one action each, ends with a practice page built for you. Surface them
   in the Play and Learn doors.

Keep the cinematic slides available at `/learn/welcome` for anyone who wants
them. The work is not wasted; it just should not be a gate.

---

## 6. Navigation after the change

**Public navbar** — four items: Play, Explore, Learn, Sign in.

**Signed-in sidebar** — nine rows instead of nineteen:

```
  Workshop            ← the product
  Play                ← ready-made drills (one row, expands)
  Explore             ← marketplace
  Learn               ← articles + routes
  ─────────
  Progress            ← technique + tracking merged
  ─────────
  Settings            ← one page with sections, not four rows
  Visuals             ← Chladni + Ripple, collapsed
```

Changes implied:

- Four drill rows collapse into **Play**.
- Technique and Tracking merge into **Progress**.
- Four settings pages become one page with sections.
- Seven labs become **Visuals** with two entries (Chladni, Ripple); Julia,
  Lissajous, Quasiperiodic and Multigrid archive; Logo Lab leaves the product.

---

## 7. Acceptance criteria

Testable statements for when this phase is done.

| # | Criterion |
|---|---|
| 1 | A signed-out visitor can start a practice drill in **one click** from the landing page. |
| 2 | A signed-out visitor can browse the marketplace and **copy** a page to their own browser. |
| 3 | No modal blocks any route on first visit. |
| 4 | The word "marketplace" refers to exactly one thing in the product. |
| 5 | The signed-in sidebar has **≤ 10** rows. |
| 6 | The landing page has exactly **three** primary actions above the fold. |
| 7 | No dev-tooling link renders on any public page. |
| 8 | Every Workshop setting a user can change visibly changes behaviour. |
| 9 | The marketplace is never empty — a fresh deployment shows at least 10 published pages. |
| 10 | The landing page reaches interactive in under 2s on a mid-range phone over 4G. |

Criteria 1, 2, 8 and 9 are the ones that decide whether the pivot is real. The
rest are polish.
