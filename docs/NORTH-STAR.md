# Piano Suite — North Star

The short, durable document. Read this before proposing a feature, writing copy,
or starting a UI change. Everything here is a decision rule, not a task list.
The task lists live in [`docs/overhaul-plan.md`](overhaul-plan.md).

Last revised: 2026-08-31.

---

## What this is

> **Piano Suite is a workshop for building your own piano practice.**
>
> Grab a ready-made drill and start playing, or snap components together into
> the exact practice session you need today.

That is the whole sentence. If a screen does not make that obvious without
being read carefully, the screen is wrong.

## Where it came from

It started as Reflex Drill EXT: a handful of standalone HTML pages built by one
self-taught pianist who wanted to improvise, worked out that improvising means
knowing chords cold, and built a chord drill wired to Anki and a MIDI keyboard
to get there. It worked. He learned the chords.

That origin is the product's credibility and it should never be buried. The
tools in this app are not hypothetical teaching aids designed by committee —
they are the actual routine of someone who taught themselves, generalized so
other people can build their own version of it.

## Who it is for

Self-taught pianists, in this order:

1. **The brand-new beginner** who just got a keyboard and does not know what to
   do first. They need one obvious path, free, with no account.
2. **The plateaued self-learner** who has been grinding the same exercise for
   two months and does not know what the next rung is. Today the app has no
   answer for this person. It must.
3. **The tinkerer** who wants to build the drill they have in their head and
   show it to someone.

Explicitly not for: people who only want to learn one song from a video. That
market is served. We are the layer above it — you come here for a *practice*,
not a *song*.

## The eight themes

These are the durable principles. When two options are both defensible, the one
that better serves a theme wins.

**1. One sentence, one place.**
The Workshop is the product. Every drill, lab, visualizer, and tracker is a
component inside it, not a peer of it. There is one front door.

**2. Demote, don't delete.**
Nothing built gets thrown away. Things stop being top-level. A visualization
lab that becomes a block loses a sidebar row and gains a place in the shelf —
the app gets simpler and more capable in the same motion. This is the single
most important structural rule in the whole plan.

**3. Earn each reveal.**
Show the next layer of information only when the user asks for it by clicking.
The first screen is one sentence and one button. The second screen is three
choices. Depth is available to anyone who wants it and invisible to everyone
who does not.

**4. Reward the click instantly.**
Every click delivers exactly what it promised, on the next screen, with no
interstitial, no sign-in wall, no loading explanation. A click is a stated
intent; satisfying it immediately is what earns the next click.

**5. Free at the front.**
No wall before value. A first-time visitor can build and run a practice page
without an account. Sign-in buys sync and publishing, never access.

**6. Human voice, real data.**
First person. Real screenshots. The author's own practice history as the
example. Show rather than list. A feature inventory is not a description.

**7. Always a next rung.**
Anything a user can master must have a visible way to get harder. A drill you
outgrow is a user you lose. Progression is a retention mechanic, not a
nice-to-have.

**8. Stock the shelf yourself.**
Never ship an empty marketplace. Supply comes before demand, and until the
community exists, we are the community. A shelf with thirty good official
components beats a gallery with three user uploads.

## Non-goals (for now)

Naming these is what makes the plan finishable. Each can be revisited, but not
without moving it out of this list first.

| Not doing | Why |
|---|---|
| Paid marketplace / revenue share | No supply, no demand, no evidence. |
| Social feed, profiles, follows, comments | Community mechanics before community. |
| Sheet-music notation rendering / OMR | Enormous scope, adjacent to the mission. |
| Mobile app | The instrument is at a desk with a MIDI cable. |
| Turning on billing | Free-at-the-front is a theme. Waitlist stays. |
| New standalone tool *pages* | Violates theme 1. New capability ships as a block. |
| More visualization labs | There are six. That is more than enough. |

## How to tell if it is working

Not vanity metrics. Three questions, in order of importance:

1. **Does a stranger reach a running drill in their first session?** If they
   land, click, and hear a metronome or complete a chord rep without signing
   in, the front door works.
2. **Does anyone come back in week two?** Retention is the only honest verdict
   on whether the practice loop is real.
3. **Does anyone build a second page?** One page could be curiosity. Two means
   the workshop premise is true for someone other than its author.

## The standing tension

The platform vision (a marketplace of community-built practice tools, an
assistant that assembles components on request) is correct and worth building.
It is also, today, further away than it feels, because it rests on a component
library that has six entries in it.

The resolution is sequencing, not compromise: build the shelf first as a
single-player feature, where it is useful with zero other users. Community and
AI assembly are multipliers on a deep shelf and are worthless on a shallow one.
Both come after.
