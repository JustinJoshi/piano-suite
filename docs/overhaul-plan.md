# Piano Suite — The Overhaul Plan

A single ordered plan for getting from "345 commits of features I'm not sure
about" to "a thing I'm proud to put my name on and hand to a stranger."

Companion to [`docs/NORTH-STAR.md`](NORTH-STAR.md), which holds the durable
direction and the decision rules. This document holds the audit, the strategy,
the phases, and the launch sequence. It supersedes the tier lists in
`docs/tier-0-workshop-first-plan.md` and `docs/workshop-first-ux-plan.md`
(both still worth reading — most of their Tier 0/1 items are folded in here).

Written: 2026-08-31.

---

## Part 1 — Where the project actually is

Facts first, because the feeling of being lost is usually a measurement
problem.

### The numbers

| | |
|---|---|
| First commit | 2026-07-26 (`17d649f`, Create Next App) |
| Commits since | 345, over ~36 days |
| TypeScript / TSX | ~55,000 lines |
| Routes with a page | 20 |
| Sidebar entries | 18 |
| Landing page sections | 11, roughly 8–10 screens of scroll |
| Tool cards on the landing page | 12 |
| Visualization labs | 6 (~9,100 LOC in `components/drills/`) |
| Starter templates | 10 |
| Guided routes | 2 |
| Planning docs in `docs/` | 27 files, ~7,000 lines |
| **Workshop feature blocks** | **6** — and two of them are "text" and "MIDI status bar" |

### The eight eras it went through

The scope drift is legible in the git history, and it was not random — each era
was a reasonable response to the one before it.

1. **2026-07-26 — Bootstrap.** 37 commits in one day. Scaffold, Clerk, Convex,
   tracking dashboard, primitive layer, and four of the five Reflex Drill EXT
   ports, all on day one.
2. **07-27 — Last port.** Root Cycling, technique tracker, design principles.
3. **07-28 → 07-29 — The visual turn.** 73 commits. Chladni hero, then Julia,
   Lissajous, Quasiperiodic, Ripple, Multigrid, ambient backgrounds. The
   identity quietly shifted from "drill app" toward "math-visual playground."
4. **07-30 — Freemium.** Clerk Billing, Free-local vs Pro-sync.
5. **08-02 → 08-05 — The community rebrand.** Copy repositioned to "free
   learning community for self-taught pianists," onboarding pillars, welcome
   lab.
6. **08-06 → 08-15 — Audio and hardening.** smplr sampler, SF2 upload, music
   player, then a full best-practices audit and nine remediation phases.
7. **08-18 → 08-25 — The Workshop.** Feature-block registry, drill runtime,
   grid editor, and the `/tools` → `/tools/workshop` navigation pivot.
8. **08-28 → 08-31 — Go-live scaffolding.** Grid overhaul, marketplace tab,
   PostHog, Sentry, waitlist, legal pages, guided routes, an age gate that was
   added and then removed.

### The one-sentence diagnosis

**The app has grown enormous everywhere except at its stated center.**

There are six visualization labs and six workshop blocks. There is a 9,100-line
drill-and-lab layer and a 748-line feature-block layer. The landing page shows
twelve tools and the sidebar shows eighteen entries, while the thing the app
says it is — a place to build your own practice — has a component shelf you
could read out loud in ten seconds.

That is why it feels cloudy, and it is why the "is this just slop?" worry
keeps surfacing. It is not that the code is bad or the features are bad. It is
that the *proportions* are wrong. A visitor's first impression is dominated by
breadth that has nothing to do with the premise, and the premise itself is
under-built. Anyone can feel that mismatch even if they cannot name it.

### The specific things that are broken right now

Not opinions — these are concrete and verifiable in the code today.

| # | Problem | Where | Cost |
|---|---|---|---|
| 1 | **The hero CTA hits a sign-in wall.** `"Enter the Workshop"` → `/tools/workshop`, which `proxy.ts` protects. The Free tier is localStorage-only anyway (`lib/custom-practice-storage.ts`), so the gate protects nothing. | `proxy.ts:51-63`, `lib/welcome-config.ts` | Highest-cost item in the entire funnel. Every interested visitor is stopped one click in. |
| 2 | **"Marketplace" is a block palette, not a marketplace.** It shows the six built-in blocks. The actual community gallery is at `/workshop` under a different name ("Gallery"). | `components/workshop-marketplace/`, `components/navbar.tsx` | The word that carries the whole vision is spent on a dropdown replacement. |
| 3 | **The community gallery is empty and nothing can fill it.** `forkCustomDrill` exists in `convex/workshop.ts:286` with tests and **no UI calls it**. | `convex/workshop.ts`, `/workshop` | The sharing loop is 90% built and 0% usable. |
| 4 | **Guided routes are invisible from the landing page.** The zero-to-playing path — the best asset for the target user — has zero links in `components/welcome/*`. | `lib/routes.ts`, `app/page.tsx` | Beginners never find the beginner path. |
| 5 | **Starter template cards don't select a template.** All four landing cards link to plain `/tools/workshop`. | `components/welcome/starter-templates-section.tsx` | Breaks theme 4 (reward the click) on the highest-intent click on the page. |
| 6 | **Three identical primary CTAs** on one long page, plus 12 tool cards, plus 5 numbered feature sections. | `components/welcome/*` | Hick's law. Nothing is emphasized, so nothing is chosen. |
| 7 | **Onboarding teaches learning science, not the product.** Six slides on spaced repetition and hand care before the user knows what the app does. | `components/tools/onboarding/` | Good content, wrong position. |
| 8 | **Everything is one hue.** Six themes, each a single brand color with derived tints. Only grading badges use categorical color. | `lib/themes.ts`, `app/globals.css` | A shelf of components with no color coding reads as an undifferentiated wall. |
| 9 | **No progression mechanic anywhere.** Nothing gets harder over time. No tempo ramp, no difficulty rung, no "you've done this for six weeks." | — | This is why its own author stopped using it. |
| 10 | **27 planning docs, no screenshots.** The repo reads as machine output before a single line of code is opened. | `docs/`, `README.md` | The "slop" impression starts here, not in the app. |

---

## Part 2 — The three questions underneath all of this

Straight answers, because they are blocking everything else.

### "Is it slop?"

No — but the parts of it that *look* like slop are real and fixable, and they
are not the parts you would guess.

The code is not the problem. Six themed presets with a token system, a
tab-scoped MIDI session, a shared drill runtime, convex-test auth coverage, an
83-spec Playwright suite — that is not slop, that is a well-built application.

What reads as slop is the **shape**, in four specific places:

- **Twenty-seven planning documents.** A human ships three. Someone opening
  this repo sees `chladni-ripple-wide-report.md` next to
  `ripple-technique-polish-plan.md` and correctly concludes a machine wrote the
  process, not just the code.
- **A README that is a feature inventory.** Forty bulleted features with bold
  labels. Humans write three sentences and show a picture.
- **Zero screenshots, zero demo, anywhere.** Nothing in the repo or the landing
  page shows the app running. Generators list; humans show.
- **Perfectly parallel copy.** Every section is eyebrow + headline + one
  sentence + CTA. Uniformity at that resolution is a tell.

None of that is about how the code was written. All of it is fixable in Phase 3
without touching a single feature.

And on disclosure: say it plainly somewhere on the site. "I built this over a
month with heavy AI assistance; here is what I designed, here is my own
practice data, here is what I learned." Owning it is more interesting than the
alternative and it completely disarms the criticism you are worried about.
Pretending is the only losing move.

### "Is it actually useful?"

Partly, and the honest breakdown matters more than a yes.

**The ready-made drills are useful and limited, and you already proved both.**
They taught you chords. Then you outgrew them in about two months. That is not
a failure of the drills — it is their natural life cycle, and it will be the
same for everyone else. A library of fixed drills is a two-month product.

**The workshop premise is real, but not for the reason you think.** You have
been framing it as a marketplace: people build things, other people import
them, network effects. That framing makes the value depend on other users
existing, which is why it feels far away — because it is. Reframe it:

> The workshop is valuable to a single user with zero community, on day one,
> because it lets them build the practice page they need *today* instead of
> using the one someone else guessed at.

That is defensible immediately. Sharing is a multiplier you add later.

**The real differentiator, stated properly:** the song apps teach you a song.
Piano Suite teaches you a practice. The unit here is not a piece of music, it
is a repeatable session you designed for your own weak spot. Nobody serves
that well, and it is exactly what you did for yourself. Lead with it.

**The gap that explains why you stopped using it:** you have been running the
same arpeggio sequence for two months and the app has nothing to say about
that. No tempo ramp, no next rung, no acknowledgment that six weeks passed. An
app you master is an app you leave. This is the most important feature idea in
this entire document and it came out of your own story rather than a feature
brainstorm — which is also precisely the kind of thing that makes a product
feel human.

### "How do I launch when I don't feel ready?"

You stop calling it a launch.

The reason "launch" is paralyzing is that it implies a claim: *this is
finished, this is good, judge it.* You are not ready to make that claim and you
should not fake it. So make a different one:

> "I built a thing for my own piano practice. Would you sit with me for fifteen
> minutes and try it while I watch? I want to see where it breaks."

That is not a launch, it is a usability test, and it is what you actually need.
Five of those will tell you more than three more months of polishing. You do
not need to be proud of it to run one — you need it to not waste the person's
time, which is a far lower bar and one you are already over.

The one thing to fix before even that: the sign-in wall (problem #1). Watching
a friend bounce off Clerk in the first thirty seconds teaches you nothing you
do not already know.

---

## Part 3 — The strategy: one structural move

Almost everything in your brain dump resolves into a single move. This is the
"big overarching sweep" you were reaching for.

> ### Every standalone page becomes a block in the workshop.

The chord drill, the arpeggio drill, the progression drill, root cycling, the
technique tracker, the metronome, the tracking charts, the six visualization
labs, the music player, the piano-roll visualizer you want to build — none of
them should be a top-level destination competing for a sidebar row. All of them
should be tiles you can drop onto a practice page.

Do that and every problem in this document moves at once:

| It fixes | How |
|---|---|
| **Overwhelm** | 18 sidebar entries collapse to about 4. The landing page stops showing 12 tools. |
| **The empty shelf** | The block library goes from 6 to ~25 without inventing a single new capability — the logic already exists, it just lives in the wrong shape. |
| **The dead marketplace** | A shelf of 25 live, colorful, previewable components is worth browsing on day one, with zero other users. |
| **"Where's the creativity?"** | Twenty-five composable parts is a design space. Six is a form. |
| **The AI assembler** | An LLM composing from 6 blocks produces garbage. From 25 verified blocks it produces something that feels like magic. The assembler is not blocked on AI work, it is blocked on shelf depth. |
| **"I don't want to delete my features"** | Nothing gets deleted. Everything gets demoted. Simpler and more capable in the same motion. |

This is theme 2 in `NORTH-STAR.md` — *demote, don't delete* — and it is the
load-bearing idea of the whole plan. The simplification you want and the
platform you want are the same project.

### What this means concretely

The visualization labs are the clearest case. Right now Julia, Lissajous,
Quasiperiodic, and Multigrid are four sidebar rows, four landing cards, and
four full pages that have essentially nothing to do with learning piano. As
blocks, they are four entries in a "Visualization" shelf category — the
category that exists in `lib/feature-blocks/registry.ts:124` today and renders
empty. They stop being clutter and start being the reason the shelf looks
alive and colorful. The labs keep their pages as deep-dive/parameter editors
behind the shelf, reachable by anyone who wants them, invisible to everyone
who doesn't.

Same for the drills: `/tools/chord-drill` stays as a one-click "just let me
play" destination, but the drill also exists as blocks so a user can put a
chord set next to a metronome next to a timer and build their own version.

---

## Part 4 — The phases

Eight phases. The order is deliberate and the rationale is at the end of this
part — read it if a phase feels like it's in the wrong place, because the
exciting ones are intentionally late.

---

### Phase 0 — Clear the desk

**Goal:** make the project legible to yourself again. Nothing here is user
facing; all of it is unblocking.

**What ships**

- Consolidate `docs/`. Twenty-seven files become roughly six: `NORTH-STAR.md`,
  `overhaul-plan.md`, `PROJECT_HISTORY.md`, `go-live-runbook.md`,
  `custom-drill-builder-plan.md` (the architecture reference), and
  `clerk-billing-setup.md`. Everything that describes shipped work moves to
  `docs/archive/` in one commit. Historical value is preserved; the front door
  of the repo stops looking like a machine's scratch pad.
- Write the non-goals list (done — `NORTH-STAR.md`) and treat it as binding.
- Decide the kill list. Candidates, with a recommendation each:

  | Thing | Recommendation |
  |---|---|
  | Logo Lab (`/tools/logo-lab`, 442 LOC) | **Archive the page.** It generates a brand mark you already decided not to use (the musical note shipped instead). Keep `lib/logo-mark.ts`. |
  | `/tools/midi-test` | **Fold into the MIDI connection block.** Dev-only page. |
  | `/dev/welcome-lab` (722 LOC) | **Keep, hide.** Genuinely useful for copy iteration, but it should not be linked from the live site via `DevToolsLink`. |
  | `/settings/atmosphere` per-route backgrounds | **Simplify to one global setting.** Per-route ambient backgrounds are a preference surface nobody asked for and it's a settings page of its own. |
  | AI chat (`/chat`) | **Hide from nav.** It's owner-allowlisted and unconfigured; it's currently a navbar link that sends every visitor to a sign-in wall for a feature they can never use. It comes back in Phase 7 as the assembler. |
  | Multigrid Lab | **Already experimental-gated.** Leave it; it becomes a block in Phase 2. |

**Done when:** `docs/` has ≤ 8 files, the navbar has no links to features a
visitor cannot use, and you can describe the app's surface area from memory.

---

### Phase 1 — The front door

**Goal:** a stranger lands, understands in four seconds, clicks once, and is
doing something. This is the gate for "I'd be willing to show a friend."

**What ships**

**1.1 Make the workshop public.** Add `/tools/workshop` (and its marketplace)
to the public list in `proxy.ts`. Free-tier persistence is already localStorage
only, so nothing about the data model changes. Sign-in moves to where it earns
its keep: syncing across devices and publishing. This is a small diff with the
largest single effect in the plan.

**1.2 The first screen: one sentence, one button.** Rewrite the hero in
`lib/welcome-config.ts` down to an eyebrow, a headline, one sentence, and
**one** CTA. Delete the two duplicate primary CTAs further down the page. A
visitor should be able to decide "yes" or "no" without scrolling. The people
who leave were never going to stay; optimize entirely for the people who click.

**1.3 The second screen: three doors.** The CTA leads to a chooser — not a
dense page, three large cards, each with an icon, three words, and one line:

| Door | For | Leads to |
|---|---|---|
| **Play** | "Just let me do something" | Guided routes for beginners, ready-made drills for everyone else |
| **Build** | "I want to make my own / look around" | The workshop with the shelf open |
| **Learn** | "I want to read first" | Articles |

Guided routes finally become visible here — today `lib/routes.ts` has the best
onboarding asset in the app and the landing page does not link to it once.

**1.4 Cut the landing page roughly in half.** Eleven sections and 8–10 screens
becomes: hero → three doors → *one* short "how it works" → *one* piece of
evidence (why these drills work) → the story (who made this, first person) →
footer. The 12-card tool grid comes out entirely — those tools are becoming
blocks and the shelf is where you browse them.

**1.5 Collapse the navigation.** Sidebar goes from 18 entries to: **Workshop**,
**Shelf**, **Progress**, **Settings**. Ready-made drills move under the
workshop as starting points. Labs come out (they're becoming blocks). Settings
becomes one page with sections, not four sidebar rows.

**1.6 Fix the clicks that lie.** Starter template cards select their template.
"Gallery" and "Marketplace" get resolved into one vocabulary (see 2.4).

**1.7 Move onboarding.** The six-slide learning-science deck stops being a
gate. The three pillars become an article and one card on the Learn door.
First-run inside the workshop becomes at most three contextual, dismissible
hints.

**Done when:** an anonymous visitor can land on `/`, click twice, and hear a
metronome — no account, no scroll, no reading.

---

### Phase 2 — The shelf

**Goal:** turn the six-block palette into a component library deep enough that
building your own practice is genuinely expressive. This is the phase that
makes the platform vision real, and it's mostly conversion work rather than
new invention.

**What ships**

**2.1 Convert existing capability into blocks.** Target ~25 total. Grouped by
where the logic already lives:

| Category | Blocks | Source |
|---|---|---|
| Have today | Metronome, Drill timer, Chord set, Instructions, MIDI connection, Drill shortcuts | `lib/feature-blocks/` |
| Drills → blocks | Arpeggio cell, Progression, Root cycling, Note sequence, Ear-training interval, Scale set | `hooks/useArpeggios.ts`, `useProgression.ts`, `useRootCycling.ts`, `lib/sequence-drill.ts` |
| Practice structure | Count-in, Rest/break timer, Session goal, Tempo ramp, Rep counter | `hooks/useDrillTimer.ts` |
| Feedback | Piano keyboard visualizer, Held-notes display, Stats chart, Streak / habit grid, Miss log | `lib/midi-session.ts`, `convex/tracking.ts`, technique tracker |
| Visualization | Chladni, Chladni Ripple, Julia, Lissajous, Quasiperiodic, Multigrid | `components/drills/*-lab.tsx` |
| Media | Song player (MIDI/audio upload), Sound picker | `hooks/useMusicPlayer.tsx`, `lib/audio-*` |

`docs/drill-block-extraction-plan.md` already worked out how to do this
mechanically — that plan is good and should be followed.

**2.2 Build the piano keyboard visualizer.** The one genuinely new block, and
the one you named yourself. An 88-key strip that lights held MIDI notes, shows
a target chord/sequence, and — driven by the song player — shows what's coming
next. This is the bridge between "learn a song" and "learn a practice," and it
is the block that makes learning Moonlight Sonata on this site plausible.

**2.3 Give the shelf a real color system.** Add a categorical palette to
`app/globals.css` — one hue per block category (rhythm, theory, technique,
feedback, visualization, media) that holds across all six themes, the way the
grade tokens already do. Right now every theme is one hue with tints, which is
elegant for chrome and useless for a shelf of thirty things. Category color is
functional, not decorative: it's how you scan a wall of components.

**2.4 Rebuild the shelf page.** Rename to resolve the vocabulary collision:
**Shelf** = the official component library (today's "Marketplace"); **Community**
= published user pages (today's `/workshop` "Gallery"); they can live as two
tabs on one page. Give it the feeling you described: a hero, live interactive
previews, a slow horizontal marquee of components breathing across the top,
category filters with color. Motion is the point — it should feel occupied.

**2.5 Ship 20+ official starter pages built from the new blocks.** Ten exist.
Stock the shelf yourself (theme 8) — including honest ones from your own
routine, like the arpeggio sequence you've actually been running.

**Done when:** the shelf has ~25 blocks and ~20 official pages, every block has
a live preview, and the page is worth scrolling with zero other users on the
platform.

---

### Phase 3 — Make it human

**Goal:** remove the machine-written impression. No features; entirely voice,
proof, and story.

**What ships**

- **Screenshots and a demo GIF** — in the README, on the landing page, in the
  shelf. Currently there are none anywhere. This is the single highest-impact
  item in the phase.
- **Rewrite the README** to three sentences, one screenshot, and a link. The
  forty-feature inventory moves to `PROJECT_HISTORY.md`.
- **Write the origin article in first person.** You already told the story:
  wanted to improvise → realized that means knowing chords cold → built a chord
  drill wired to Anki and a MIDI keyboard → it worked. That article is more
  persuasive than any feature list and it takes an afternoon.
- **An honest "how this was built" page.** AI assistance, what you designed,
  what you'd do differently. Owning it beats being caught by it.
- **Seed the app with your real data.** Your Anki decks are already in
  `public/`. Add your actual practice history as the tracking screenshot and
  your actual arpeggio routine as an official starter page.
- **A copy pass that breaks the parallelism.** Vary section shapes. Let
  sentences be different lengths. Remove marketing register from places where
  a plain statement works.
- **A changelog in first person** — "what I changed this week." Cheap, and it
  is the clearest possible signal that a person is behind this.

**Done when:** someone who opens the repo and someone who opens the site both
come away thinking a person made deliberate choices here.

---

### Phase 4 — Five people

**Goal:** replace anxiety with evidence. This is not a launch.

**What ships**

- **Five moderated sessions.** Message five friends: *"Would you try this for
  fifteen minutes while I watch? I want to see where it breaks."* Screen share,
  say nothing, take notes on every hesitation. Do not ask if they like it —
  their opinion is worthless, their confusion is priceless.
- **Instrument the funnel.** `lib/analytics.ts` already has three events. Add
  landing CTA click, door chosen, first block added, first drill started.
- **Fix only what all five hit.** Then run five more with strangers from a
  piano Discord.

**Done when:** three of five reach a running drill without help. If they don't,
Phase 1 isn't done and you go back — that's the whole point of doing this
before a public post.

---

### Phase 5 — The next rung

**Goal:** give the app something to say to the person who has been doing the
same thing for two months. This is retention, and it is the gap that made its
own author drift away.

**What ships**

- **Tempo ramp** on any timed block: start at 60, add 2 BPM per successful
  session, back off after a miss. One setting, enormous behavioral effect.
- **Difficulty rungs on drills**: fewer reps → more roots → inversions →
  random order → faster target. Explicit, visible, and earned.
- **A practice page that knows how old it is.** "You've run this 23 times over
  6 weeks — your average is 40% faster. Ready to add inversions?"
- **Streaks tied to workshop pages**, not just the technique tracker.
- **Close the tracking loop**: when a drill finishes, show what was logged and
  link to the chart. Right now the data goes somewhere invisible.

**Done when:** a user who has mastered a page is offered a harder version of it
instead of running out of road.

---

### Phase 6 — The commons

**Goal:** turn sharing on, once there is something worth sharing. Not before.

**What ships**

- **The fork button.** `forkCustomDrill` has existed in `convex/workshop.ts`
  with tests since the workshop shipped and no UI has ever called it. Label it
  "Save a copy" — nobody outside software says fork.
- **A real community tab** next to the shelf, seeded with your 20 official
  pages so it is never empty.
- **Attribution** — "based on a page by X." The `forkedFrom` field already
  exists and is never rendered.
- **Import/export as JSON.** You described this exactly right: a page is just
  references to components, so it's small. Copy-paste-able page JSON is the
  cheapest possible sharing mechanism and it works with zero backend and zero
  users.

**Done when:** a visitor can find a community page, run it without an account,
and save a copy in one click.

---

### Phase 7 — The assembler

**Goal:** the idea you're most excited about — describe what you want, get a
practice page. Last, because it is worthless before Phase 2 and excellent
after it.

**What ships**

- **A composer endpoint** that takes a natural-language goal and returns page
  JSON: a list of block types plus their config. The model never writes code —
  it selects from `featureRegistry` and fills in validated config, which
  `normalizeConfig` already checks at render time. Your instinct here is right
  and the architecture already supports it: the safety comes from the model
  only being able to arrange verified components.
- **A chat entry point in the shelf**: "Tell me what you want to practice."
  Output is a preview you can accept, edit, or regenerate.
- **Explanation with output**: "I picked a chord set with the four chords in
  this song, a metronome at 70, and a tempo ramp." Users trust what they can
  read.

**Done when:** "help me learn the left hand of Moonlight Sonata" produces a
page with a keyboard visualizer, a song player, a slow tempo ramp, and a rest
timer — assembled from verified blocks, working on the first try.

---

### Why this order

The instinct is to build Phase 7 first because it is the most exciting, and
Phase 6 second because it is the vision. Both would fail, for the same reason:

- **The assembler is not blocked on AI work, it is blocked on shelf depth.** An
  LLM arranging six blocks produces something worse than the template picker
  you already have. The same model over 25 blocks feels like magic. Phase 2 is
  the prerequisite, not the warm-up.
- **A community with no users is worse than no community.** An empty gallery is
  active evidence that nobody uses this. Ship the shelf stocked by you, and let
  community sharing arrive as a multiplier on something already worth using.
- **Phase 1 before everything** because until the sign-in wall is gone and the
  front door is clear, every other improvement is invisible — nobody gets far
  enough to see it.
- **Phase 4 in the middle, not at the end**, because "am I ready?" is not a
  question you can answer by building more. Five people will collapse months of
  uncertainty into an afternoon, and running it early means the rest of the
  work is aimed at real problems.

---

## Part 5 — The launch sequence

Ordered, with an explicit gate on each step. Do not skip ahead; each step's
audience is more expensive to lose than the last.

| Step | Audience | Gate before doing it |
|---|---|---|
| 1 | 5 friends, watched (Phase 4) | Phase 1 complete |
| 2 | 5–10 strangers from a piano Discord, watched | 3/5 friends succeeded |
| 3 | r/pianolearning + r/piano weekly thread — post as "I built this for my own practice," not as a launch | Phases 2 and 3 complete |
| 4 | Show HN — the story is the hook: self-taught pianist builds practice workshop, here's what I learned | Positive signal from step 3 |
| 5 | LinkedIn / portfolio post — this is the one you actually want, and it is the *last* one | Something real to point at from steps 3–4 |
| 6 | Product Hunt | Optional; probably skip |

**Open blockers before step 3 (public):**

- **COPPA.** You removed the age gate on 2026-08-31 and `IMPORTANT-NOTICES.md`
  correctly reopened the item. Piano instruction plausibly attracts under-13s,
  and the FTC judges by subject matter, not intent. Irrelevant for steps 1–2;
  a real risk from step 3 on. Either restore a neutral gate or accept the
  exposure knowingly.
- **Auth cutover.** `NEXT_PUBLIC_AUTH_DISABLED=true` is currently set on
  Production. `docs/phase-a-auth-cutover-plan.md` has the full sequence.
- **Counsel review** — the open item from `IMPORTANT-NOTICES.md`.

---

## Part 6 — Where every idea from the brief landed

So nothing gets lost, and so the themes stay separated from the features.

| Idea from the brief | Type | Where it went |
|---|---|---|
| Workshop as a framework, not a set of drills | Theme | North Star §What this is; theme 1 |
| Host for other people's creativity | Theme | North Star §standing tension; Phase 6 |
| Beginners free, easy on-ramp, zero to 50% fast | Theme | Theme 5; Phase 1.1, 1.3 |
| Optimize for the interested, let the rest go | Theme | Theme 3, 4; Phase 1.2 |
| Reward the click instantly, zero hesitation | Theme | Theme 4; Phase 1.3, 1.6 |
| Abstract away what people don't need to see | Theme | Theme 2, 3; Phase 0, 1.4, 1.5 |
| Don't delete the features, hide them | Theme | Theme 2 — the strategy in Part 3 |
| Make it feel human, not generated | Theme | Theme 6; all of Phase 3 |
| Different people learn differently | Theme | Phase 1.3 (three doors); Phase 2 (shelf) |
| Fixed drills cause stagnation | Theme | Theme 7; all of Phase 5 |
| One sentence → click → three rectangles | Feature | Phase 1.2, 1.3 |
| Marketplace with movement, a breathing marquee | Feature | Phase 2.4 |
| More colors, intentional color use | Feature | Phase 2.3 |
| Song visualizer ("show me the next notes") | Feature | Phase 2.2 |
| Learn Moonlight Sonata on this site | Feature | Phase 2.2 + 7 (the acceptance test for Phase 7) |
| Enough components for real creativity | Feature | Phase 2.1 — 6 → ~25 |
| Lightweight shareable page format (JSON refs) | Feature | Phase 6 (import/export) |
| One-click import someone else's tool | Feature | Phase 6 (fork button — backend already exists) |
| AI assembles components on request | Feature | Phase 7 |
| Articles section for people who want to read | Feature | Phase 1.3 (Learn door); exists already |
| Articles on practice science, real citations | Feature | Phase 3 (voice pass) + existing `articles/` |
| Streamline / simplify / archive | Feature | Phase 0 + 1.4 + 1.5 |
| UI overhaul | Feature | Phases 1–3, spread across all three |
| Launch to users, don't know who | Process | Part 5 |
| Not sure it's good enough | Process | Part 2 |

---

## Part 7 — Start here

If you do nothing else this week, do these five, in this order. They are all
small, and together they change the first-run experience completely.

1. **Make `/tools/workshop` public** in `proxy.ts`. One line. Biggest effect of
   anything in this document.
2. **Cut the hero to one CTA** in `lib/welcome-config.ts` and delete the two
   duplicates.
3. **Build the three-door chooser** and link guided routes from it.
4. **Move `docs/` to six files** and archive the rest.
5. **Take five screenshots** and put one in the README.

Then run Phase 4 with a single friend before building anything else. You will
learn more in that fifteen minutes than in the next month of solo work — and
the reason to do it early is that it converts "am I proud of this?" from a
feeling you have to argue yourself out of into a question with an answer.

The executable task list for Phase 1 is
[`tasks/tasks-phase-1-front-door.md`](../tasks/tasks-phase-1-front-door.md).
