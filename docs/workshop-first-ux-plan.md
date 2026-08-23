# Workshop-First UX Audit & Change Plan

Status: research complete, pre-implementation. Companion to PR #68
(`justin/workshop-core`), which made the Workshop the navigational front door.
This doc answers the next question: **what else must change so users *feel* that
the Workshop — build your own drill, or plug-and-play a pre-made one — is what
Piano Suite *is*, not just where `/tools` redirects?**

Method: (1) full flow audit of the current app (landing → onboarding → sidebar
→ workshop editor → ready-made drills → gallery → tracking), (2) UX research
from authoritative sources (NN/g, Laws of UX — citations inline), (3) product
strategy from `docs/custom-drill-builder-plan.md` (Chessable / Anki / CodePen
marketplace research).

---

## 1. The one-sentence product story

Every screen should make this obvious without reading:

> **Piano Suite is a Workshop: snap together your own piano practice drills from
> simple building blocks — or grab a pre-made drill from the community and press
> Start.**

Two paths, one door: **Build it** (editor) and **Use it** (templates/gallery).
Today the app communicates neither: the landing page sells the Anki chord
drill, the Workshop is one equal-weight card among 13, and the gallery is
unreachable from anywhere.

## 2. Research principles this plan is graded against

| Principle | Source | Applied here as |
|---|---|---|
| Visual hierarchy: scale & contrast signal importance; make the most important element biggest; ≤2 large elements | NN/g, *Visual Hierarchy in UX* | Workshop must dominate the landing hero and sidebar; tools grid must visually demote to "also included" |
| Von Restorff (isolation effect), Hick's Law, Miller's Law | Laws of UX | One distinctive primary CTA; don't offer 13 equal choices; chunk nav (PR #68 did this) |
| Jakob's Law | Laws of UX | Marketplace should look like marketplaces users know (store shelves, Notion/Chessable template cards, "Save a copy" not "fork") |
| Recognition rather than recall; recognition over blank-slate | NN/g Heuristic #6 | First-run = template picker with recognizable outcomes, not an empty canvas |
| Onboarding: skip decks when possible; use brief, contextual, skippable hints; feature promotion belongs at the entry surface | NN/g, *Mobile-App Onboarding* | Replace the 3-slide philosophy deck's opening with workshop feature promotion; teach the editor with 3 contextual tips, not a tutorial |
| Visibility of system status | NN/g Heuristic #1 | Free tier currently gets zero save feedback; sync badge hidden |
| User control & freedom / error prevention | NN/g Heuristics #3, #5 | `window.confirm` delete, no undo; destructive page delete needs a real dialog + undo |
| Peak-End Rule, Goal-Gradient | Laws of UX | First session must end with a *completed* drill rep (plug-and-play templates), not an empty editor |
| Paradox of the Active User | Laws of UX | Nobody reads; the marketplace must be reachable in one click from the Workshop, not explained |
| Marketplace liquidity: seed supply before demand | `docs/custom-drill-builder-plan.md` §2.2 (Chessable, Anki shared decks) | Ship official starter templates so the "expansive library" claim is true on day one |

## 3. Current-state audit (what PR #68 fixed, what remains)

Fixed by PR #68: `/tools` → `/tools/workshop` redirect; sidebar regrouped
Workshop → Ready-made drills → Progress → Labs (collapsed); Workshop page shows
a ready-made drill chip strip; grouped `lib/tools.ts` registries.

Remaining gaps found in the audit, by flow:

- **Landing (`app/page.tsx`, `lib/welcome-config.ts`)**: hero headline
  "Learn piano with tools built for self-taught pianists" + six feature
  sections all sell the Anki chord-drill loop. Zero workshop copy. Tools grid:
  flat 13 cards, Workshop is card #1 of 13 with identical visual weight.
- **Onboarding (`components/tools/onboarding/`)**: 3 philosophy pillars
  (recall/self-care/frustration). Never mentions the Workshop or building.
- **Workshop first-run**: auto-seeded empty page + "Add feature" button. No
  templates, no examples, no hints (autosave and `/` shortcut undocumented).
- **Editor**: practice happens *inside* the editing canvas (drag handles +
  settings rail visible while you drill). No focused practice/run mode for your
  own pages — ironically the *public* page renderer is the better practice view.
- **Gallery (`/workshop`)**: exists, works, playable public pages — but linked
  from nowhere except itself. Not in sidebar, landing, navbar, or Share menu.
- **Fork**: `forkCustomDrill` mutation + tests exist; **no UI calls it**. A
  visitor cannot save a gallery drill to their Workshop.
- **Ready-made drills**: one-way links only. No "Open in Workshop" on any drill
  page; arpeggio/progression/root-cycling drills aren't representable as blocks
  yet.
- **Free tier**: sync badge hidden (no save feedback at all); Pro publish card
  has no upgrade link; signed-out workshop page is a dead-end sentence with no
  sign-in button.
- **Block registry**: 5 blocks (metronome, drill timer, chord set,
  instructions, MIDI connection); empty "Visualization" category renders
  nothing; "Instructions" block has 3 different names.
- **Tests**: no E2E spec covers any workshop flow.

## 4. Prioritized change list

Ordered by expected UX impact. Effort: S (< half day) / M (1–3 days) / L
(week+, may itself need a plan doc). Items within a tier are also ordered —
do them top-down.

### Tier 0 — Make the promise (users can't miss what this app is)

**0.1 — Seed the marketplace: ship 8–12 official starter templates.**
*Impact: critical · Effort: M*
The "plug and play" story is fiction until the library is non-empty (an empty
gallery proves nothing and kills the claim on first visit). Build curated
practice pages covering recognizable goals — *First chords (C/F/G)*, *ii–V–I
warmup*, *Metronome + 5-min sprint*, *All-12-keys root cycling*, *Daily
technique starter* — published from an official account and surfaced as
"Starter templates" in the Workshop, gallery, and landing page. This is the
Chessable/Anki lesson: seed supply before expecting community supply.
Acceptance: a brand-new signed-in user can practice a template within 2 clicks
of entering the Workshop.

**0.2 — Rewrite the landing hero around the Workshop.**
*Impact: critical · Effort: S*
All copy lives in `lib/welcome-config.ts` (edit via `/dev/welcome-lab`).
Proposed: eyebrow "a free workshop for self-taught pianists"; headline
**"Build your own piano practice — or grab a drill and start playing."**;
subheadline mentions snap-together blocks, ready-made drills, community
sharing; CTA "Enter the Workshop" → `/tools` (already redirects). The current
hero sells one tool; the hero must sell the *place*. Keep Anki/chord-drill
science sections below — they're good evidence-based content, they just can't
be the hero anymore.

**0.3 — Restructure the landing page to a funnel that ends at the Workshop.**
*Impact: critical · Effort: M*
New order: hero (Workshop promise, one primary CTA) → "How it works" 3-step
flow (*Pick a ready-made drill → Press start & play → Tweak it or build your
own*) → template gallery preview strip (3–4 starter templates, "Browse all
drills →" to `/workshop`) → evidence sections (existing retrieval-practice
content, reframed as *why these drills work*) → tools grid demoted and
re-titled **"Also in the toolkit"** (or a compact chip row instead of 13 equal
cards) → community/CTA. This is NN/g visual hierarchy (make the most important
thing biggest, ≤2 big elements) + Von Restorff (the Workshop card/section must
be the visually distinct one) + Hick's Law (one primary choice, everything
else demoted).

**0.4 — Replace the Workshop's blank first-run with a template picker.**
*Impact: critical · Effort: M*
First visit (no saved pages): a friendly chooser — **"Start from a template"**
(0.1's starters, with icon + one-line outcome each), **"Start from scratch"**,
and **"Browse the community"**. Recognition rather than recall: users pick a
recognizable outcome instead of facing an empty canvas and inventing a drill
grammar. Also solves Peak-End: the first session ends with a running drill, not
an empty editor. Subsequent visits: go straight to their pages.

### Tier 1 — Complete the core loop (gallery ↔ workshop ↔ drills)

**1.1 — "Save to my Workshop" fork button on public drill pages.**
*Impact: very high · Effort: S*
The mutation (`convex/workshop.ts` `forkCustomDrill`) and tests already exist —
only the button is missing, on the exact screen where motivation peaks. Label
it "Save a copy to my Workshop" (Jakob's Law — users know "save a copy" better
than "fork"). Signed-out users: show it disabled with "Sign in to save a copy".
After forking, drop the user into *their* copy, ready to practice.

**1.2 — Make the gallery reachable from everywhere it matters.**
*Impact: very high · Effort: S*
Add "Community drills" (`/workshop`) as a first-class link: in the sidebar
(right under Workshop, or a "Community" section label), in the Workshop right
rail next to Share, in the landing template strip (0.3), and in the
`ReadyMadeDrills` strip ("…or browse community drills"). Paradox of the active
user: one click, no explanation needed.

**1.3 — Add a focused Practice mode (edit ⇄ practice toggle).**
*Impact: high · Effort: M*
Your own pages get the same clean view public pages already have: a
"Practice" toggle (or `/tools/workshop/p/[pageId]` route reusing the public
renderer + `DrillRuntimeProvider`) that hides editing chrome — no drag handles,
no settings rail, one big Run/Stop. Practicing inside the editing canvas
violates Aesthetic & Minimalist Design and makes the drill feel like a
form-painting exercise. Editor keeps an obvious "Back to editing" exit (User
control & freedom).

**1.4 — Bridge ready-made drills into the Workshop.**
*Impact: high · Effort: M (split into steps)*
(a) Every ready-made drill page gets an "Open this in the Workshop" link that
creates a pre-loaded starter page (chord set + timer + metronome blocks from
that drill's defaults) — makes "drills are just pre-built workshop pages" true
visibly. (b) Longer term: represent the four drills as published templates
built from blocks (chord-drill is nearly expressible today; arpeggio and
progression need new blocks — sequence block is the gap). This converts "two
kinds of tools" into one mental model.

**1.5 — Unify vocabulary: Workshop / drills / templates / community.**
*Impact: medium-high · Effort: S*
One term per concept everywhere (sidebar, landing, onboarding, editor, empty
states): **Workshop** (the builder+pages), **drills** (what you run),
**starter templates** (official pre-made), **community drills** (published
gallery). Today: "practice pages", "custom practice pages", "features" (vs
"blocks"), "gallery" all mix. Match between the system and the real world; a
beginner should never have to learn internal jargon ("feature block") to
understand "add a metronome".

### Tier 2 — Trust, feedback, and the free-tier path

**2.1 — First-run contextual tips in the editor (3, skippable).**
*Impact: medium-high · Effort: S–M*
On first Workshop entry, show three one-line dismissible tips exactly where
they matter: "Everything saves automatically", "Drag to reorder — press `/`
to add a block", "Blocks are live: press Start to practice right here". NN/g
onboarding guidance: brief, contextual, skippable beats any tutorial deck.
Store dismissal in localStorage.

**2.2 — Save feedback for the Free tier.**
*Impact: medium · Effort: S*
Free users currently see *no* save state ever. Reuse the sync badge slot:
"Saved on this device" (with a one-time tooltip: "Upgrade to Pro to sync
across devices"). Visibility of system status applies to every tier, not just
Pro — silent saving feels like losing work.

**2.3 — Signed-out Workshop page: preview instead of a dead end.**
*Impact: medium · Effort: S*
Replace "Sign in to create custom practice pages." with a hero'd preview: a
read-only demo practice page (runnable! MIDI not required for metronome/
timer) + "Sign in to build your own" button + "Browse community drills" link.
Peak-End: let visitors *feel* the product before the gate.

**2.4 — Wire upgrade paths.**
*Impact: medium · Effort: S*
The Free publish card ("Upgrade to Pro to publish…") gets a button to
`/pricing`. Same wherever Pro value appears (sync badge tooltip from 2.2).

**2.5 — Update the onboarding deck.**
*Impact: medium · Effort: S*
Add/replace the first slide with a workshop orientation ("Build your practice:
grab a starter drill or snap blocks together — your pages live in the
Workshop"). Keep the learning-science pillars after it — they're the different-
iator, but they should come *after* the user knows what the app is. Feature
promotion at the entry surface, brief and skippable (NN/g).

**2.6 — Make tracking visible from the Workshop loop.**
*Impact: medium · Effort: S*
After a completed practice session (runtime `finished` phase), show a small
"Logged to your progress →" link to Tracking. Goal-gradient + Zeigarnik:
progress visibility pulls users into the habit loop that retention is built
on.

### Tier 3 — Editor & gallery polish

**3.1 — Palette fixes**: show the `/` shortcut hint in the palette header; hide the empty "Visualization" category until a viz block ships (or ship one viz block — even a simple held-notes display); rename the "Instructions" block consistently (type `textBlock`, label "Instructions", category "technique" — pick "Text / instructions", category "basics"). *Effort: S*

**3.2 — Destructive-action safety**: replace `window.confirm` page-delete with a themed dialog + Undo toast (NN/g #3, #5). *Effort: S*

**3.3 — Richer gallery cards**: block-type icon chips ("Metronome · Chords · Timer") instead of "N blocks"; later, thumbnail or fork-count ("Saved by 12 pianists" — social proof). *Effort: S → M*

**3.4 — Attribution**: "Based on a drill by {author}" on forked pages (`forkedFrom` data exists, never rendered). Community credit builds contribution. *Effort: S*

**3.5 — E2E coverage**: `e2e/workshop.spec.ts` — template start, block add/remove, practice run, publish (Pro fixture), public view, fork button. The app's #1 feature currently has zero E2E. *Effort: M*

### Explicitly deferred

- **Paid marketplace / rev-share** — per `docs/custom-drill-builder-plan.md` §2.3, only after organic supply/demand evidence.
- **New drill-mechanic blocks** (arpeggio/progression sequences) — needed for 1.4(b), but block authoring is its own engineering stream, not a UX change.
- **In-editor canvas redesign** — current live-block editor is solid; polish only after Tier 0–1.

## 5. Success metrics

Instrument before/after (Convex `practiceEvents` already carries the events):

1. **Activation**: % of new users who complete ≥1 drill rep in their first
   session (template, forked, or built). Target: up from ~baseline.
2. **Template start rate**: % of first Workshop visits that start from a
   template vs scratch (expect 60%+ choose template — that's the design
   working).
3. **Gallery loop**: gallery visits → public-page plays → forks per visit.
4. **Build depth**: distribution of blocks-per-page and pages-per-user after
   7 days (are builders graduating beyond a single metronome?).
5. **Landing CTA**: hero CTA click-through and `/tools` → first drill rep
   completion (the whole funnel in two numbers).

A/B landing copy cheaply via `/dev/welcome-lab` + `lib/welcome-config.ts`
overrides before hard-coding anything.

## 6. Suggested build order (first three PRs)

1. **PR: "Starter templates + first-run picker"** (0.1 + 0.4) — the biggest
   activation lever; pure content + one new component.
2. **PR: "Landing tells the workshop story"** (0.2 + 0.3 + 1.2 partial) —
   welcome-config copy + landing structure + gallery links.
3. **PR: "Save a copy"** (1.1 + 3.4) — fork button + attribution; smallest
   diff, unblocks the community loop.

Then 1.3 (practice mode), 1.5/2.x as a sweep, 1.4 as its own plan.

## Sources

- Nielsen Norman Group, *10 Usability Heuristics for User Interface Design*
  (Jakob Nielsen, 1994; reviewed 2024) — nngroup.com/articles/ten-usability-heuristics/
- Nielsen Norman Group, *Visual Hierarchy in UX: Definition* (Kelley Gordon,
  2021) — nngroup.com/articles/visual-hierarchy-ux-definition/
- Nielsen Norman Group, *Mobile-App Onboarding: An Analysis of Components and
  Techniques* (Alita Kendrick, 2020) — nngroup.com/articles/mobile-app-onboarding/
- Laws of UX (Jon Yablonski) — lawsofux.com (Hick's Law, Jakob's Law, Von
  Restorff Effect, Miller's Law, Goal-Gradient Effect, Peak-End Rule,
  Paradox of the Active User)
- `docs/custom-drill-builder-plan.md` — market research (Chessable, Anki
  shared decks, CustomsForge) and the Workshop architecture/phases.
