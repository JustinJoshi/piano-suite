# Roadmap — themes, features, actions

Three layers, as requested, kept deliberately separate because they answer
different questions and go stale at different rates.

- **Themes** are the principles. They should outlive every phase below, and they
  are the thing to check a decision against when the roadmap does not cover it.
- **Features** are what gets built.
- **Actions** are what to do first, concretely enough to start tomorrow.

No calendar estimates. Phases are ordered by dependency, and each one names what
it unblocks and what it costs to skip.

---

## Part 1 — Themes

### T1. Composition over curriculum

The old product handed you a finished drill and you outgrew it. The new one
hands you parts. The measure of success flips accordingly: not "did the user
complete the drill" but "did the user make something that is theirs."

Practical consequence: whenever there is a choice between building a feature and
building the *block* that would let a user build that feature, build the block.

### T2. Community is the retention mechanism

A drill you master is a drill you leave. A place where other people keep posting
things you have not tried is a place you come back to. Everything in the
marketplace should be measured by whether it produces a reason to return.

Practical consequence: the fork button matters more than any individual block,
because it is what turns one person's work into another person's Tuesday.

### T3. Progressive disclosure

Show what the current intent calls for and nothing else. Scroll for depth, click
for speed. The number of things visible at once is a design budget, and the app
is currently over it.

Practical consequence: adding a sidebar row should require removing one. That
constraint would have prevented most of the last two months of surface growth.

### T4. Frictionless by default

Free, no account, works in the browser, works without hardware where possible.
Every gate should have to justify itself. Today the front door is gated and the
justification is habit, not reasoning.

### T5. Bounded AI

The model arranges verified components; it never generates logic. This is
already enforced by the storage layer, which makes it a *true* claim rather than
a marketing one. Say it plainly — it is a real differentiator at a moment when
"AI-generated" is a liability.

### T6. Human authorship

The end product should feel made by a person who plays piano, because it was.
Concretely: your name on the articles, your practice pages seeded in the
marketplace, your reasons written in first person. Using AI to build is fine and
worth being open about. Looking like nobody was home is not.

---

## Part 2 — Features

Grouped by theme, unordered within group. Sequencing is Part 3.

### Component library (T1)

- Thread block config through the drill runtime so settings actually apply
- Add `requires` / `provides` / `maxPerPage` to `FeatureDefinition`
- React-free `blockCatalog` export for AI and CI
- **Tier 1 blocks** (wrap existing tested code): `noteSequence`, `progression`,
  `rootPool`, `sessionStats`, `missLog`, `ankiSource`, `techniqueLog`, `tempoRamp`
- **Tier 2 blocks** (expose existing primitives): `songPlayer`, `rippleVisual`,
  `instrumentPicker`, `restTimer`
- **Tier 3 blocks** (new logic): `keyboardDisplay`, `sectionLoop`, `scaleTarget`,
  `goalTracker`
- Per-block `schemaVersion` and a migration path, before the library is public
  enough that breaking changes hurt

### Marketplace and community (T2)

- Fork / "Copy to my workshop" button on public pages — the mutation exists
- Seed the gallery with your own published pages
- Attribution: author name, `forkedFrom` lineage displayed
- Remix and try counts
- Categories and search
- Live tile previews on gallery cards, not text summaries
- Read-only "Try it" mode for signed-out visitors
- Report / moderation path before the marketplace is genuinely public

### Entry flow and navigation (T3, T4)

- Three-door landing (Play / Explore / Learn)
- `/play` hub; make drill routes public
- Rename gallery → `/marketplace`; component picker → `/tools/workshop/blocks`
- `/learn` merging articles, guided routes and the pillars
- Non-blocking onboarding; retire the six-slide gate
- Sidebar collapse from ~19 rows to ~9
- Archive Julia / Lissajous / Quasiperiodic / Multigrid; remove Logo Lab from the product
- Gate dev tooling out of public pages

### Visual identity (T3, T6)

- Separate brand colour from action colour
- Three door identities (Play / Explore / Learn)
- Widen the elevation ladder; add a light theme
- Restrict heavy motion to hero and marketplace
- Marketplace-specific liveliness pass

### AI composer (T5)

- `validateArrangement(blocks)` pure validator
- Tool-call interface constrained to `{type, config}` against the catalogue
- Preview-and-confirm flow; never writes directly
- Natural-language entry point in the Workshop

### Content and humanization (T6)

- Landing "why I built this" with your name and face
- Grow articles past four; write them yourself
- Author notes on your seeded marketplace pages
- A changelog or build-log page — "built in public" is credibility, cheaply

### Launch readiness (cross-cutting)

- Reopen the COPPA age gate decision; counsel review
- Re-run the music rights audit before announcing
- `robots.ts`, `sitemap.ts`, `not-found.tsx`, `title.template`
- Activation and retention analytics beyond the current three events
- Clerk production keys, custom domain, `NEXT_PUBLIC_AUTH_DISABLED` unset

---

## Part 3 — Phased action plan

### Phase 0 — Tell the truth

*Nothing here is glamorous. All of it is measured through by everything after it.*

The theme is honesty: the product currently claims things that are not true.
Settings that do nothing, a free product behind a login, a marketplace with no
marketplace, dev tools in production.

| # | Action | Files |
|---|---|---|
| 0.1 | Thread block config into the runtime. `DrillRuntimeProvider` takes the active page's `drillTimer` and `chordSet` config and passes `countdownSeconds`, `breakSeconds`, `multiRep`, `requireExact`, `goodThreshold`, `hardThreshold`. Add a test asserting a non-default config changes behaviour. | `components/custom-practice/drill-runtime-provider.tsx`, `hooks/useDrillRuntime.ts` |
| 0.2 | Make drills and `/play` public. Add to the `proxy.ts` allowlist; verify Free users write to `lib/local-practice-history.ts`. | `proxy.ts` |
| 0.3 | Rename the two marketplaces. Gallery `/workshop` → `/marketplace`; picker → `/tools/workshop/blocks`. Redirects for both. | `next.config.ts`, `app/`, nav |
| 0.4 | Gate dev tooling. `isDevToolsVisible()` returns false in production; remove the floating link from public pages. | `lib/dev-tools.ts`, `components/dev-tools-link.tsx` |
| 0.5 | Remove `/chat` from the navbar. Keep the route. | `components/navbar.tsx` |
| 0.6 | Fix stale docs: `DESIGN-PRINCIPLES.md` brand mark, `PROJECT_HISTORY.md` remaining-phases line, `go-live-runbook.md` age-gate and unsigned-drill contradictions. | `docs/`, root `*.md` |

**Unblocks:** every measurement you take from here is of the real product.
**Cost of skipping:** you will A/B-test a landing page whose main button leads to a
sign-in wall, and conclude the copy was wrong.

---

### Phase 1 — Three doors

*Structure only. No new capability, no visual redesign.*

| # | Action | Notes |
|---|---|---|
| 1.1 | Rewrite the hero: new headline, new subhead, three door cards. | Copy lives in `lib/welcome-config.ts` — this is where that pattern pays off |
| 1.2 | Build `/play`. Two columns: with a MIDI keyboard, without one. | The second column is thin until Phase 2's `keyboardDisplay` |
| 1.3 | Build `/learn`. Merge articles + guided routes + the three pillars. | Mostly re-routing existing content |
| 1.4 | Replace the blocking onboarding with a dismissible strip; move the slides to `/learn/welcome`. | `components/tools/onboarding/*` |
| 1.5 | Collapse the sidebar to ~9 rows; archive four labs; remove Logo Lab. | Keep the code; change `lib/tools.ts` and the sidebar |
| 1.6 | Restructure the landing page below the fold per [`03-entry-flow-spec.md`](03-entry-flow-spec.md) §2. | Drop the 12-card tools grid |
| 1.7 | Add `robots.ts`, `sitemap.ts`, `not-found.tsx`, `title.template`. | Small, and it matters on launch day |

**Unblocks:** you can send the link to a stranger without explaining it first.
**Cost of skipping:** the marketplace gets built behind a door nobody opens.

---

### Phase 2 — Stock the shelves

*The single highest-leverage phase. Almost entirely wrapping code that exists.*

Ship blocks in small batches; each is independently useful and independently
mergeable. Suggested batching, ordered by how much each one widens what a user
can express:

**Batch A — make the existing drills composable**
`noteSequence`, `progression`, `rootPool`, `sessionStats`

**Batch B — remove the hardware requirement**
`keyboardDisplay`, `restTimer`, `techniqueLog`

`keyboardDisplay` deserves its own note: it is the difference between "Play now"
working for everyone and working only for people with a controller plugged in.
For a soft launch to friends, most of whom will open the link on a laptop with
no keyboard attached, this is arguably the most important single block in the
roadmap.

**Batch C — songs, which is what people actually want**
`songPlayer`, `sectionLoop`, `tempoRamp`

At the end of Batch C the Moonlight Sonata trainer is buildable, which means you
have a demo that explains the entire product in one screenshot.

**Batch D — expression and colour**
`rippleVisual`, `instrumentPicker`, `ankiSource`, `missLog`, `scaleTarget`, `goalTracker`

**Alongside the batches:**

| # | Action |
|---|---|
| 2.x | Add `requires` / `provides` / `maxPerPage` to `FeatureDefinition`; enforce in the editor |
| 2.y | Export the React-free `blockCatalog`; CI asserts registry and catalogue agree |
| 2.z | Add per-block `schemaVersion` + migration before the library is widely shared |

**Unblocks:** the marketplace has something worth browsing; the AI composer
becomes worth building.
**Cost of skipping:** you launch a marketplace where every page is a metronome
next to a timer, and the community thesis never gets a fair test.

---

### Phase 3 — Close the loop

| # | Action |
|---|---|
| 3.1 | **Fork button** on `/marketplace/[id]` — wire the existing `forkCustomDrill`. Signed out forks into `localStorage`. |
| 3.2 | Read-only **Try it** mode for signed-out visitors. |
| 3.3 | Seed the marketplace: publish 10–15 of your own pages with author notes. |
| 3.4 | Attribution and lineage — author name, "forked from", remix count. |
| 3.5 | Live tile previews on gallery cards. |
| 3.6 | Categories and search. |
| 3.7 | Report / hide path before the marketplace is genuinely public. |

**Unblocks:** the retention thesis becomes testable.
**Cost of skipping:** you have a gallery, not a marketplace, and no reason for
anyone to come back on day three.

---

### Phase 4 — Make it alive

*Deliberately after structure. Paint does not fix layout.*

| # | Action |
|---|---|
| 4.1 | Separate brand and action colours in `app/globals.css` |
| 4.2 | Three door identities across landing, nav and section headers |
| 4.3 | Widen the elevation ladder; add a light theme |
| 4.4 | Restrict heavy motion to hero and marketplace; go still elsewhere |
| 4.5 | Marketplace liveliness pass — this is the page that should feel like a fair |
| 4.6 | Mobile pass across the new flows |

The token discipline in this codebase — no hard-coded colours anywhere, enforced
in `AGENTS.md` — means this phase is mostly editing one CSS file. That decision
is about to pay for itself.

---

### Phase 5 — Bounded AI composer

*Only after the library passes ~15 blocks.*

| # | Action |
|---|---|
| 5.1 | `validateArrangement(blocks)` — pure, unit-tested, no model involved |
| 5.2 | Tool interface constrained to `{title, blocks:[{type, config}]}` |
| 5.3 | Pipeline: model → `normalizeStoredPage` → validate → preview → user confirms → save |
| 5.4 | Natural-language entry in the Workshop: "make me a warmup for shaky left-hand octaves" |
| 5.5 | On validation failure, offer the nearest valid arrangement rather than an error |

Repurpose `/chat` — the API route, streaming and auth already exist; only the
allowlist and the system prompt change.

---

### Phase 6 — Humanize

*Runs in parallel with everything from Phase 1 onward. Not a phase you finish.*

| # | Action |
|---|---|
| 6.1 | Landing "why I built this" — first person, your name, your face |
| 6.2 | Write more articles yourself. The one first-person piece outperforms the research syntheses because it is *yours*. |
| 6.3 | Author notes on every seeded marketplace page — why it exists, what it fixed for you |
| 6.4 | A build-log page. Being open that AI helped build it is a feature, not a confession. |

---

## Part 4 — What to do first

If you only do five things, do these, in this order:

1. **Thread block config into the runtime.** (Phase 0.1) It is a real bug, it is
   small, and the marketplace premise is false until it is fixed.
2. **Make the drills public.** (Phase 0.2) One allowlist change turns your
   locked front door into an open one.
3. **Build `keyboardDisplay`.** (Phase 2, Batch B) Without it, "Play now" fails
   for most first-time visitors, and every launch channel you have wastes its
   first impression.
4. **Wire the fork button.** (Phase 3.1) The mutation exists and is tested. This
   is the smallest change that turns a gallery into a marketplace.
5. **Seed the marketplace with your own pages.** (Phase 3.3) No code. It is the
   difference between a community product and an empty room.

Notice that four of the five are hours of work against code that already exists,
and the fifth is not code at all. That is the shape of this whole audit: the
distance between where Piano Suite is and where it needs to be is much shorter
than it feels from the inside.

---

## Part 5 — What *not* to do

Written down because the failure mode here is well-established in this repo's
own history: a new capability appears, it is interesting, it grows to 700 lines,
and it ships to the sidebar.

| Do not | Because |
|---|---|
| Add another visualization lab | Seven is already six more than the product needs |
| Build the AI composer before the block library | Six components make an arranger look like a gimmick |
| Redesign the colour system before the entry flow | You will redesign it again after the structure changes |
| Add features while launch is pending | `IMPORTANT-NOTICES.md` said this on 2026-08-29 and the repo added Workshop features for two weeks afterward |
| Turn on billing | `BILLING_ENABLED = false` is correct until there is a retention curve to price against |
| Delete the drills | They are the proof the blocks work and the answer to "Play now" |
