# Audit & Roadmap — September 2026

A full end-to-end audit of Piano Suite and a phased roadmap for the pivot from
fixed drills to a workshop + marketplace.

**Audited:** commit `b918c88` (main, after PR #73). PR #74 excluded by request.

**Method:** all 345 commits read chronologically; ~58k lines of TypeScript
analysed statically; the project's own 26 planning documents read and
cross-checked against shipped code; the app built, run locally, and walked
page by page.

**Verification performed during the audit:** `npm run lint` (0 errors, 9
warnings) and `npm run test:unit:run` (861 tests, 108 files, all passing).

---

## Documents

| # | Document | Answers |
|---|---|---|
| 00 | [Executive summary](00-executive-summary.md) | Is this AI slop? How much of the vision drift is real? What are the actual launch blockers? |
| 01 | [Feature inventory](01-feature-inventory.md) | Every feature tagged keep / rework / archive / cut, with reasoning |
| 02 | [Architecture verdict](02-architecture-verdict.md) | Can the component model host a marketplace and an AI composer? What is missing? |
| 03 | [Entry flow spec](03-entry-flow-spec.md) | The three-path landing and onboarding, wireframe-level, plus why the colour scheme reads flat |
| 04 | [Roadmap](04-roadmap.md) | Themes → features → action steps, phased by dependency |
| 05 | [Soft launch plan](05-soft-launch-plan.md) | Who to send it to, in what order, what to watch, when to stop |

---

## The three findings that matter most

**1. It is not slop.** 861 unit tests and 75 E2E tests pass, TypeScript is
strict with zero `@ts-ignore`, lint is clean, CI gates every push, and all 8
Convex tables have live write paths. The debt is ordinary growth debt:
copy-pasted lab UI, nine near-identical settings hooks, one large untested
drill hook.

**2. The pivot does not need a rebuild.** Pages are already serializable JSON,
publishing and forking already exist on the backend with tests, and untrusted
imports are already validated server-side with unknown block types dropped and
configs clamped. What is missing is **inventory**: the Workshop has 6 blocks,
only 3 of which are practice tools, while `lib/` holds roughly 7,000 lines of
tested capability — a MIDI file player, a sampled instrument engine, an Anki
client, sequence and progression engines — that has no block wrapper. Closing
that gap is a packaging job against code that already works.

**3. The launch blockers are specific, not vague.** The landing page's only CTA
leads to a sign-in wall. A six-slide modal blocks the app on first visit. The
marketplace is empty and has no fork button. Six of eighteen Workshop settings
are wired to nothing. Dev tooling renders on public pages. The COPPA decision
is open.

---

## Start here

If you read one page, read [`00-executive-summary.md`](00-executive-summary.md).

If you want to start working today, [`04-roadmap.md`](04-roadmap.md) Part 4 lists
the five highest-leverage actions — four of which are changes to code that
already exists, and the fifth is not code at all.
