# Soft Launch Plan

You said you don't know who to send it to first or how to structure an initial
launch. This is a concrete answer: what has to be true before you send anything,
who to send it to in what order, what to say, and what to watch.

The existing `docs/go-live-runbook.md` covers the *operational* cutover — domain,
Clerk production keys, Convex production, analytics. That is still valid. This
document covers the *audience* side, which the runbook does not.

---

## 1. Gates — what must be true before anyone outside your circle sees it

### Legal (blocks a public launch, not a private one)

Both from `IMPORTANT-NOTICES.md`, both currently open:

- **COPPA.** The age gate shipped on 2026-08-29 and was removed on 2026-08-31.
  Piano instruction plausibly attracts children, and the FTC judges
  "child-directed" by subject matter and design rather than intent. This does
  not need to be a birthday form — a neutral date-of-birth screen before
  analytics load is the standard pattern, and "we don't track anyone under 13"
  is a defensible position that costs one screen. **Decide deliberately this
  time,** and write the decision down; the current state is "removed because it
  didn't ship well," which is not a decision.
- **Counsel review.** A $1–3K fixed-fee privacy review, and confirmation that an
  LLC exists before public users arrive. This is the item that cannot be
  compressed and should start first because it runs on someone else's clock.
- **Re-run the music rights audit** (`docs/music-rights-audit.md`) before
  announcing. It was CLEAN on 2026-08-29, and its own re-audit trigger is "before
  any public launch announcement." If Phase 2's `songPlayer` block ships first,
  re-run it after that too — user-uploaded MIDI is fine, bundled arrangements
  are not.

A **private** launch to people you know is materially lower risk and does not
need to wait for counsel. Cohort 1 below can go before the legal work lands.

### Product

The four acceptance criteria that decide whether the pivot is real, from
[`03-entry-flow-spec.md`](03-entry-flow-spec.md) §7:

1. A signed-out visitor plays something in one click.
2. A signed-out visitor can copy a marketplace page.
3. Every Workshop setting visibly changes behaviour.
4. The marketplace is never empty.

Add one more that only matters for launch:

5. **Someone with no MIDI keyboard can have a real session.** Most people who
   open your link will be on a laptop with nothing plugged in. Without
   `keyboardDisplay` or a strong no-hardware path, your first impression fails
   for the majority of your first visitors.

### Operational

From the runbook: custom domain, Clerk production keys,
`NEXT_PUBLIC_AUTH_DISABLED` unset, Convex production, PostHog and Sentry
verified in production, and the incognito checklist actually executed (task 5.3,
still unchecked).

---

## 2. Seed the marketplace before anyone arrives

**This is the single most important non-code task in the plan.**

The marketplace currently renders: *"No practice pages have been published yet.
Be the first to share one!"* Asking a first-time visitor to be the first
contributor to an empty community is asking them to take a risk on your behalf.
Almost nobody does it, and the ones who do not, leave.

Publish **10–15 pages under your own name** before the first outside visitor.
You already have the raw material — the ten templates in `lib/starter-templates.ts`
are the right shape. What they lack is authorship.

For each one, write two or three sentences in the author note: what problem it
solved for *you*, when you use it, what to change if it is too hard. That note
is what turns a template into a thing a person made. It is also the cheapest
possible way to make the product feel human-made, which was one of your explicit
goals.

Suggested spread, so the shelf looks varied rather than like ten metronomes:

| Kind | Examples |
|---|---|
| Absolute beginner | First chords, one hand, no timer |
| Chord vocabulary | 7ths in all twelve keys, quality comparison |
| Rhythm | Metronome ladder, subdivision practice |
| Technique | Daily warmup, hand-care break timer |
| Theory | ii-V-I, blues progression |
| Song-oriented | Once `songPlayer` ships — a real passage, looped |

---

## 3. Who to send it to, in order

Four cohorts, each gating the next. The rule: **do not proceed to the next
cohort until the previous one produced the signal you were looking for.** The
temptation after a quiet response is to widen the audience; that is usually the
wrong move and it burns channels you only get to use once.

### Cohort 1 — People who know you (5–10 people)

**Who:** friends, family, anyone you have ever talked to about learning piano.
Two or three should ideally own a MIDI keyboard; the rest should not, because
they will test the path most of your real traffic takes.

**Channel:** a direct message, one at a time. Not a group post.

**What to say:** ask for the thing you actually want, which is not praise.

> "I've been building a free thing for people teaching themselves piano. Would
> you spend ten minutes on it and tell me the first moment you felt confused? I
> don't need it to be nice — the confusion is the useful part."

**What you are looking for:** where they stall. Not whether they like it.

**Gate to proceed:** at least half get to a running drill without asking you a
question.

### Cohort 2 — The Anki community

This is your best cold channel and it is worth explaining why, because it is not
obvious.

The AnkiConnect integration is a genuine differentiator. Nobody in the
piano-learning space does it. And crucially, r/Anki is full of people who
already believe in spaced repetition and are *actively looking* for new domains
to apply it to. You are not selling them the method — they already bought it.
You are showing them an application of a method they evangelise.

They are also unusually good early users: methodical, tolerant of rough edges,
happy to give structured feedback, and inclined to write things down.

**Where:** r/Anki, the Anki forums, Anki Discord servers.

**What to post:** not a launch announcement. A build story.

> "I built a chord drill that pulls the current card from Anki over AnkiConnect
> and auto-grades it based on how fast I played the chord on a MIDI keyboard.
> Here's how it works and here are the decks."

Lead with the mechanism, not the product. That community rewards specificity and
punishes marketing.

**Gate to proceed:** the post does not get removed, and at least a few people try
it and say something specific.

### Cohort 3 — Self-taught piano communities

**Where:** r/piano (read the rules — most subreddits route self-promotion to a
weekly thread, and posting outside it gets you banned rather than ignored),
r/musictheory, r/JazzPiano, self-taught piano Discords, the Pianote and
Pianoforall community spaces.

**What to say:** lead with the free tools and your own story, not the
marketplace. "I'm teaching myself and I built the practice tools I wished
existed" is honest and it is the thing that will actually resonate. The
marketplace is interesting to *you* because you are building it; to them it is a
feature of a thing they have not tried yet.

**Timing:** only after the marketplace has real content, including at least a few
pages from Cohort 1 or 2. Sending a community to an empty shelf wastes the one
introduction you get.

### Cohort 4 — Broad tech audiences

Hacker News (Show HN), Product Hunt, Lobsters, r/SideProject.

**Do this last, and only if Cohorts 2 and 3 produced returning users.** These
channels produce a large one-day spike and near-zero retention. Their value is
not users; it is a permanent link, some credibility, and a stress test. Spending
them before the retention loop works converts your single best shot into a
traffic graph with a cliff.

When you do: the honest angle is the strongest one. "I taught myself piano with
Anki and MIDI drills, then turned it into a free tool where people build and
share their own practice routines. AI helped me build it; the AI can only
rearrange components that already work." That last clause is true, technically
interesting, and counter-positions against the AI-slop reflex that audience
has.

---

## 4. What to watch

Your current analytics are three PostHog events, which is deliberately minimal
and was a good call for pre-launch. For a soft launch you need slightly more —
but resist instrumenting everything. Four numbers:

| Metric | Definition | Why |
|---|---|---|
| **Activation** | % of visitors who complete one drill rep | Did the front door work? |
| **Creation** | % of activated users who edit or build a page | Is the Workshop thesis real? |
| **Return** | % who come back within 7 days | Is there a reason to come back? |
| **Remix** | forks per published page | Is the community loop alive? |

Plus one thing no dashboard gives you: **write down every question a Cohort 1
user asks you.** Ten questions from ten people is a better roadmap than any
analytics event, and it is the only feedback channel that tells you what is
*missing* rather than what is unused.

### Honest thresholds

The runbook already names a pivot trigger: under 40% activation or under 10%
seven-day retention at week six. Two additions specific to the new vision:

- **If activation is fine but creation is near zero,** people want drills, not a
  workshop. That is not a failure — it is the market telling you the original
  product was right and the pivot is a distraction. Lean back into curated
  drills and treat the Workshop as a power-user feature.
- **If creation is healthy but remix is zero,** people will build for themselves
  but not consume from others. Keep the Workshop, drop the marketplace ambition,
  and stop paying its complexity cost.

Both of those are good outcomes to discover early. The expensive mistake is
building all of Phase 3 and 5 before finding out which one you are in.

---

## 5. Sequencing

Ordered by dependency. Legal runs in parallel because it depends on other people.

| Step | Depends on |
|---|---|
| Start counsel review; decide the COPPA question | Nothing — start today |
| Phase 0 (truth-telling fixes) | Nothing |
| Phase 1 (three doors) | Phase 0 |
| Phase 2 Batch B (`keyboardDisplay`) | Phase 0 |
| **Cohort 1 — friends** | Phase 1 + Batch B |
| Phase 2 Batches A and C | Cohort 1 feedback |
| Phase 3 (fork + seeding) | Phase 2 |
| **Cohort 2 — Anki** | Phase 3 + legal cleared |
| Phase 4 (visual identity) | Cohort 2 feedback |
| **Cohort 3 — piano communities** | Phase 4 + marketplace has outside content |
| Phase 5 (AI composer) | Library past ~15 blocks |
| **Cohort 4 — HN / Product Hunt** | Positive retention signal from Cohort 3 |

The critical observation: **Cohort 1 can happen very soon.** It needs Phase 0,
Phase 1 and one block. It does not need the marketplace, the AI composer, the
colour system, or the legal review. Getting five real people through the door
early will teach you more than another month of building, and it is the fastest
available cure for the confidence problem that started this whole audit.

---

## 6. On the thing you actually asked about

You said you want the end product to feel human-made and something you are proud
to put your name on, while being fine with people knowing AI was used.

Both halves of that are achievable, and they are less in tension than they feel.
What makes software feel machine-made is not that a machine helped write it. It
is the absence of a point of view — features that exist because they were
possible, copy that describes rather than argues, and no evidence that anyone
made a choice.

Piano Suite has a point of view already. It is in the article about learning
without a teacher, in the decision to integrate Anki because that is genuinely
how you learn, in the hand-care pillar, in the fact that the drills exist
because they worked for you. That voice is present in the product and it is
currently buried under seven visualization labs and a settings page for
per-route background animations.

The audit's core recommendation, restated: **the humanization work is mostly
subtraction.** Take away the things that exist because they were interesting to
build, and what remains is a tool made by a specific person for a specific
problem they had. That is the version worth putting your name on, and it is
already in there.
