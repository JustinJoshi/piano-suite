# Task

Add the smallest set of analytics events that make the product's North Star
questions 1 and 3 answerable, and wire each one at a real call site, in the
Piano Suite repository.

# Context

`docs/NORTH-STAR.md` names three questions as the only honest verdict on
whether the product works: (1) does a stranger reach a running drill in
their first session, (2) does anyone come back in week two, (3) does anyone
build a second page. Question 3 is currently unanswerable — nothing records
that a page was ever created. Question 1 is only partly answerable: a drill
start is recorded, but nothing records the landing → door → tool path that
leads to it.

This repository's `AGENTS.md` (read it in full before starting — it is
binding) requires: emit analytics via `captureEvent`, never per-page; never
add inline Web MIDI/Audio/Anki code outside the primitive layer (not
relevant here, but the same "extend the primitive, don't bypass it" spirit
applies to analytics); never hard-code colors; and a strict finishing
checklist (lint, unit tests, build, provenance commits).

# Relevant files

- `lib/analytics.ts` — the analytics wrapper. Exports `ANALYTICS_EVENTS`
  (currently `drill_started`, `drill_completed`, `pro_waitlist_click`),
  `captureEvent(name, props)`, and a `window.__analyticsEvents` mirror used
  by e2e/unit tests. It is a no-op without `NEXT_PUBLIC_POSTHOG_KEY`. Both
  behaviours (no-op without key, mirror to window) must survive unchanged.
- `hooks/useDrillRuntime.ts` — existing emit site (`captureEvent` around
  line 21) for `drill_started`/`drill_completed`. Reference for the pattern:
  emit from a hook/handler, not a page component.
- `components/waitlist/waitlist-cta.tsx` — existing emit site (around line
  39) for `pro_waitlist_click`. Second reference for the pattern.
- `lib/custom-practice-storage.ts` — Free-tier (localStorage) page
  persistence. Contains `createPracticePageInStore`, `upsertPracticePage`,
  `duplicatePracticePage`, `appendBlockToPage`, `forkPageIntoStore`,
  `isStarterPage`. This is where a Free-tier page is actually created or
  forked, and where a block is actually appended to a page.
- `convex/workshop.ts` — Pro (signed-in) page persistence:
  `upsertCustomDrill`, `forkCustomDrill`. Convex mutations run server-side;
  a Convex mutation cannot call the client-only `captureEvent` (it imports
  `posthog-js` and touches `window`). Find where the *client* calls these
  mutations (search for `useMutation` with `api.workshop.upsertCustomDrill`
  / `api.workshop.forkCustomDrill`) and emit from that client call site, not
  from inside `convex/workshop.ts`.
- `components/welcome/door-chooser.tsx` — the three-door landing screen
  (`"use client"`). Each door renders as a `next/link` `<Link>` with
  `href={door.href}` and `data-testid="door-${door.id}"`. There is currently
  no `onClick` handler — you will need to add one that fires before
  navigation.
- `components/workshop-marketplace/marketplace.tsx` and
  `components/workshop-marketplace/library-sections.tsx` — the block
  library. `onAddBlock: (type: string) => void` is threaded down to each
  block's `onAdd={() => onAddBlock(manifest.type)}`. Find where `onAddBlock`
  is ultimately implemented (search `onAddBlock=` in
  `components/custom-practice/` and `app/tools/workshop/blocks/page.tsx`) —
  that handler is the real call site for a block-add event, not the
  marketplace components themselves (per AGENTS.md: emit from the hook/
  handler that owns the action, not from display/page components).
- `lib/sentry.ts` — has a `beforeSend` PII scrubber. Read it to understand
  this repo's PII stance and stay consistent: no page titles, no free text,
  no email in any event payload you add. Block *types* and door *ids* are
  fine.
- `app/privacy` — must keep disclosing every processor actually wired. You
  are not adding a new processor (PostHog is already disclosed), so no edit
  should be needed here — confirm that in your completion summary rather
  than editing the page.

# Output format

Code changes in the existing files above (and new/updated test files beside
them per this repo's co-located `__tests__` convention), committed to git on
branch `fleet/analytics` inside this worktree, plus a PR opened against
`main`.

# Tool and source guidance

- Read `AGENTS.md` at the repository root in full before writing any code —
  it is binding on this task (primitive-layer rules, "emit via
  `captureEvent`, never per-page", the finishing checklist).
- Add new event names to `ANALYTICS_EVENTS` in `lib/analytics.ts` only —
  do not create a second analytics module or a second provider.
- At minimum, add:
  - **`page_created`** — a Workshop practice page came into existence.
    Must fire for the Free/localStorage path (`lib/custom-practice-storage.ts`
    call sites, wired from whatever component/hook actually calls them) and
    the signed-in/Pro path (the client call site that invokes the Convex
    mutation). Must distinguish "created from scratch" vs. "forked from the
    marketplace" — a property on the event (e.g. `{ origin: "scratch" |
    "fork" }`) is sufficient; do not add a second event for this unless you
    can justify why a property doesn't work.
  - **`door_clicked`** — which of the three doors (`play` / `explore` /
    `learn`) a visitor chose, carrying the door id as a property.
  - **`block_added`** — a block was added to a page, carrying the block
    `type` as a property.
  - A fourth event only if you have a concrete, real call site for it and
    can justify it in one sentence in your handoff notes. Prefer fewer,
    well-placed events. Every event you add must have a real call site in
    this PR — an event constant with no emitter is worse than nothing.
- Write incrementally: get one event wired and tested end-to-end before
  moving to the next, rather than editing all three event surfaces at once
  and then debugging broadly.
- Use `npm run test:unit:run` (not `npm test`) — this repo's Vitest command.

# Task boundaries

- Do not add a PostHog dependency, a second analytics provider, or any
  network call outside the existing `lib/analytics.ts` wrapper.
- Do not record anything that identifies a user or their content: no page
  titles, no free text, no email, no page ids that could be correlated back
  to specific user content. Block types and door ids only.
- Do not edit `app/privacy` unless you determine a real new processor was
  added (you should not need to — PostHog is already disclosed there).
- Do not emit `captureEvent` from a page component (`app/**/page.tsx`) —
  emit from the hook, store function's caller, or handler that owns the
  action, per `AGENTS.md`.
- Do not touch any hotspot file's unrelated sections — if you must edit a
  hotspot file listed in `AGENTS.md` (`components/tools/sidebar.tsx`,
  `app/layout.tsx`, etc.), keep the diff minimal and scoped to this task;
  none of the files above should require it.
- Do not run `npm install` / `npm ci`, and do not touch `package-lock.json`
  — `node_modules` is shared with the main checkout. No new dependency in
  `package.json` is an acceptance criterion.
- Scope every `git add` / commit to this worktree's project files. Never
  `git add -A` from the repository root.

# Effort budget

This is a single, focused phase: three new events, three-to-four real call
sites, and unit tests. Do not restructure `lib/analytics.ts`'s API or the
existing `drill_started`/`drill_completed`/`pro_waitlist_click` call sites
beyond what is strictly needed to add the new events alongside them.

# Acceptance criteria

- [ ] Every new entry in `ANALYTICS_EVENTS` has at least one emit site
      outside `lib/analytics.ts` and outside any `__tests__` directory —
      the validator will `grep` for each constant by name and confirm a
      real caller.
- [ ] `page_created` fires on the Free (localStorage) path, proven by a unit
      test that does not require a signed-in session (i.e. it exercises
      `lib/custom-practice-storage.ts` and/or the component/hook that calls
      it, with no Convex/Clerk auth mocking required).
- [ ] A unit test asserts the `window.__analyticsEvents` mirror still
      receives the new events, and that `captureEvent` remains a no-op
      (no PostHog call, but the mirror still updates) with no
      `NEXT_PUBLIC_POSTHOG_KEY` set.
- [ ] `npm run lint` exits with 0 errors.
- [ ] `npm run test:unit:run` passes with at least 1349 tests passing and
      zero failures.
- [ ] `npm run build` exits 0.
- [ ] `git diff` shows no changes to `package.json` (no new dependency).
- [ ] Work is committed to branch `fleet/analytics` in this worktree
      (`/home/justin/piano-suite/.worktrees/fleet-analytics`), the tree is
      clean (`git status --porcelain` empty, whole-repository scope), the
      branch is pushed to `origin`, and a PR is opened against `main` with
      `gh pr create`.
- [ ] Every commit that changes a deliverable carries these trailers
      (paths relative to the repository root
      `/home/justin/piano-suite`, not to the worktree):
      ```
      Phase: analytics
      Agent-Id: <your agent id>
      Session-Id: <your session id>
      Brief: .worktrees/fleet-analytics/.paseo-delegate/analytics/briefs/analytics.md
      Verdict: .worktrees/fleet-analytics/.paseo-delegate/analytics/verdicts/analytics.json
      ```
      (You will not know your own Agent-Id/Session-Id from inside the
      session in all providers — if you truly cannot determine them, note
      that in `HANDOFF NOTES` and use your agent's title
      `[Worker] analytics` plus timestamp as a substitute identifier in the
      trailer; do not fabricate an id.)

# Constraints

- Must preserve: `lib/analytics.ts`'s no-op-without-key behavior and the
  `window.__analyticsEvents` mirror, exactly as they work today for the
  three existing events.
- Must not hard-code colors, add UI, or touch styling — this is a pure
  instrumentation phase.
- Must not weaken or remove any existing test.
- This is NOT the Next.js from your training data — if you touch any route
  or metadata file, read `node_modules/next/dist/docs/` first per
  `AGENTS.md`'s pinned note; this task should not require it since no new
  routes are added.
- Do not edit `.gitignore` — a concurrent run owns it.
- Only commit paths under this worktree
  (`/home/justin/piano-suite/.worktrees/fleet-analytics`); this repository
  gitignores `.paseo-delegate/*`, so use `git add -f` scoped to
  `.paseo-delegate/analytics/` only when committing your brief/verdict
  files — never touch `.gitignore` itself to change that.

# Completion contract

Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ...
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...

`TOOLING NOTES:` is for defects, surprises, or workarounds in the tools
themselves (npm scripts, the CLI, the test harness) as distinct from this
phase's own work — say `none` if there are none. Do not omit the field.
