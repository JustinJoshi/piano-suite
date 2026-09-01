# Piano Suite — Audit & Roadmap: Executive Summary

**Audit date:** 2026-09-01
**Commit audited:** `b918c88` (main, after PR #73). PR #74 excluded by request.
**Method:** full chronological read of 345 commits, static analysis of ~58k lines of
TypeScript, the project's own 26 planning documents, plus the app run locally and
walked through page by page with screenshots.

---

## The short version

You do not have an "AI slop" problem. You have an **inventory problem** wearing a
UX problem's clothes.

The engine is real: 861 unit tests and 75 end-to-end tests all pass, TypeScript
runs in strict mode, lint is clean, CI gates every push, and the domain logic
(chord theory, MIDI scoring, spaced-repetition integration) is genuinely
non-trivial and genuinely tested. Someone who opens this repo will not think a
machine wrote it unsupervised.

What is thin is the thing the new vision depends on. The Workshop can compose
practice pages out of **six** blocks, and only three of those are actually
practice tools (metronome, drill timer, chord set). The other three are a text
box, a MIDI status bar, and a list of links. Meanwhile `lib/` contains roughly
17,000 lines of working capability — a MIDI file player, a sampled piano engine,
an Anki client, a scoring engine, a sequence-drill engine, a technique tracker —
almost none of which is exposed as a block a user can place on a page.

So when you ask "does the component library have enough breadth to support
open-ended creativity?" the answer is no — but not for the reason you fear. You
do not need to invent new capability. You need to **wrap capability you already
built and already tested**. That is a packaging job, not a research job, and it
is the single highest-leverage thing on this roadmap.

---

## Your three problems, separated

You correctly sensed these are tangled. They are, and they have genuinely
different answers. Solving them in the wrong order wastes the most effort.

### 1. The confidence gap — mostly unfounded, and here is the evidence

| Signal | Measurement |
|---|---|
| Total TypeScript/TSX | 57,721 lines across ~406 files |
| Unit + component tests | 861 cases in 108 files — **all passing** |
| End-to-end tests | 75 cases in 20 Playwright specs |
| Lint | 0 errors, 9 warnings |
| TypeScript | `strict: true`; zero `@ts-ignore` / `@ts-expect-error` in the whole repo |
| Type escapes | 38 `any` in production code, nearly all at JSON-blob storage boundaries |
| CI | lint + unit + build + conditional E2E on every push and PR |
| Convex schema | 8 tables, **every one** has a live write path — no speculative tables |
| Dead code | Sampled the suspicious exports; found none unused |

Real codebases have growth debt, and yours does — described in
[`01-feature-inventory.md`](01-feature-inventory.md). But the debt is the ordinary
kind: copy-pasted UI between the visualization labs, twelve near-identical
settings hooks that should be one, and a 942-line drill hook with no direct test.
That is what a fast-moving one-person project looks like. It is not slop.

**Put the confidence question down.** The thing you should actually be nervous
about is not code quality — it is that the product currently asks a stranger to
sign in before it shows them anything, and then greets them with a six-slide
modal. That is fixable in a focused pass, and it is Phase 0 of the roadmap.

### 2. The vision drift — smaller than it feels, and it does not need a rebuild

You suspected this and you are right. Here is the concrete evidence, because a
suspicion you can't verify is still a blocker:

- A practice page is **already** a serializable JSON list —
  `{ id, type, version, config, size }` — persisted to `localStorage` for free
  users and to the Convex `customDrills` table for Pro. Nothing about that shape
  needs to change to become a marketplace payload.
- Publishing, a public gallery, and forking **already exist on the backend**
  (`convex/workshop.ts`: `listPublicDrills`, `getPublicDrill`, `forkCustomDrill`,
  with nine tests). The gallery route `/workshop` is public and shipped.
- Untrusted JSON is **already** defended: `normalizeStoredPage` drops unknown
  block types, clamps every config field to a safe range, caps pages at 30
  blocks and configs at 8 KiB. There is no code-execution path from a shared
  page. This is exactly the property your "the LLM arranges, it does not write
  code" idea depends on, and it is already true.

The pivot is therefore **not** "throw away the drills and build a marketplace."
It is closer to the opposite:

> **The four ready-made drills are not the old product you're abandoning. They
> are the R&D that produced the components the new product sells.**

Chord Drill, Arpeggios, Progression and Root Cycling are each a working,
tested combination of five or six behaviours — chord targeting, per-transition
timing, miss logging, sequence stepping, Anki grading, random-root generation.
Decomposing them into blocks takes the library from 6 to roughly 20 and makes
"build me a Moonlight Sonata trainer" a plausible sentence. Keep the drills
running as-is while you do it; they are the demonstration that the blocks work.

**Verdict: UI/UX overhaul plus a library-extraction program. Not a rebuild.**
The architecture you need already exists and is already tested.

### 3. The execution gap — specific, small, and mostly not visual

The launch blockers are more concrete than "the UI feels cloudy." Walking the
running app turned up these:

- **The front door is locked.** The hero's only call to action, "Enter the
  Workshop", points at `/tools/workshop`, which `proxy.ts` protects. A curious
  stranger clicks the one button on your landing page and lands on a sign-in
  form. Your stated goal of "free, frictionless onboarding" is not true today.
- **A modal blocks the product.** First visit to any `/tools/*` page opens a
  six-slide full-screen cinematic onboarding — the first slide reads "Hi /
  welcome to piano suite" with a Next button. Before seeing the app, a new user
  must click through six screens or find the small "Skip" in the corner.
- **The gallery is empty.** `/workshop` renders "No practice pages have been
  published yet. Be the first to share one!" There is no seeded content, and
  there is **no fork button** on a public page — the backend `forkCustomDrill`
  mutation is not called anywhere in the UI. The community loop is not closed.
- **Six of eighteen settings do nothing.** The Workshop's per-tile gear exposes
  `countdownSeconds`, `breakSeconds`, `multiRep`, `requireExact`,
  `goodThreshold` and `hardThreshold`. `DrillRuntimeProvider` calls
  `useDrillRuntimeProvider({ pageId })` and passes none of them, so the runtime
  silently uses its defaults. A user changes a setting and nothing happens — and
  a shared page would not reproduce its author's configuration, which
  invalidates the marketplace premise.
- **Two different things are called "Marketplace."** `/tools/workshop/marketplace`
  is a six-item component picker. `/workshop` is the community gallery. Naming
  them apart is a five-minute change that removes a permanent source of
  confusion.
- **Dev tooling ships to the public.** `lib/dev-tools.ts` returns `true`
  unconditionally, so a floating "Dev lab" button renders on the public landing
  page in every environment.
- **The legal gate is open.** The COPPA age gate was added and then removed on
  2026-08-31, so `IMPORTANT-NOTICES.md` item 1 is open again, and counsel review
  (item 4) has never been done. These block a public launch regardless of how
  good the product is.

And yes — the visual criticism is fair, and [`03-entry-flow-spec.md`](03-entry-flow-spec.md)
explains precisely why. Every surface in the app is the same near-black
background with the same amber accent. Section boundaries on the landing page
are invisible because a dark card on a dark background over a dark animated
field has almost no edge. It does not read as "flat and cloudy" because the
colour is bad — amber-on-charcoal is a good choice — it reads that way because
there is **one** colour doing every job at once: brand, action, heading accent,
active state, and decoration. Nothing can stand out when everything is
highlighted.

---

## What to do, in order

The full plan is in [`04-roadmap.md`](04-roadmap.md). The sequence, compressed:

| Phase | Theme | Why it comes here |
|---|---|---|
| **0** | Tell the truth | Fix the dead settings, unlock the front door, cut dev surfaces, rename the two marketplaces. Small, unglamorous, and everything downstream is measured through it. |
| **1** | Three doors | Rebuild the entry flow around Play / Explore / Learn. No new capability — routing, copy, and a free-play path that needs no account. |
| **2** | Stock the shelves | Extract 10–14 blocks from the drills and primitives you already have. This is what makes the marketplace worth visiting. |
| **3** | Close the loop | Fork button, seeded gallery, attribution, remix counts. A marketplace with nothing in it and no way to take anything out is not a marketplace. |
| **4** | Make it alive | The colour system and the marketplace's visual identity. Deliberately **after** structure, because paint does not fix layout. |
| **5** | Bounded AI composer | Only meaningful once the library is broad enough to compose from. |
| **6** | Humanize | Your own articles, your name, your practice pages. This is the part no one can clone. |

Legal work runs in parallel and gates the public launch, not the build.

---

## The one thing worth internalizing

The reason this app currently feels like "a pile of features" is not that the
features are bad. It is that **the app never tells a stranger what it is for
before asking them to commit.** Eighteen sidebar destinations, seven
visualization labs, four settings pages, a chat page only you can use, and a
dev lab — all reachable before anyone has played a single note.

The new vision fixes this almost by accident, because "build your own practice
tool and share it" is a sentence a person can hold in their head. Everything in
this roadmap is really in service of making that one sentence true on first
contact.

---

## Reading order

| Document | What it answers |
|---|---|
| [`01-feature-inventory.md`](01-feature-inventory.md) | Every feature, tagged keep / rework / archive / cut, with reasoning |
| [`02-architecture-verdict.md`](02-architecture-verdict.md) | Can the component model support the marketplace? What is missing? |
| [`03-entry-flow-spec.md`](03-entry-flow-spec.md) | The three-path landing and onboarding flow, wireframe-level |
| [`04-roadmap.md`](04-roadmap.md) | Themes → features → action steps, phased |
| [`05-soft-launch-plan.md`](05-soft-launch-plan.md) | Who to send it to, in what order, and what to watch |
