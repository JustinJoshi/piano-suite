# Task List: Phase 1 — The Front Door

Source: [`docs/overhaul-plan.md`](../docs/overhaul-plan.md) Phase 1. Direction
and decision rules: [`docs/NORTH-STAR.md`](../docs/NORTH-STAR.md).

**Goal:** an anonymous visitor lands on `/`, clicks twice, and is running a
drill — no account, no scroll, no reading.

**Gate this phase unlocks:** Phase 4 (five watched usability sessions). Do not
start Phase 2 before Phase 4 has run at least once.

Every code task is TDD: write the test, watch it fail, implement, watch it pass.

## Relevant Files

- `proxy.ts` - Add the workshop to the public-route list (1.1)
- `e2e/auth-protection.spec.ts` - Public/protected route matrix; must be updated when 1.1 lands
- `e2e/workshop-anonymous.spec.ts` - NEW: anonymous visitor builds and runs a page
- `lib/welcome-config.ts` - Hero copy, CTA count, section config (1.2, 1.4) — single source for landing copy
- `components/welcome/hero-section.tsx` - One CTA only (1.2)
- `components/welcome/welcome-content.tsx` - Section order and count (1.4)
- `components/welcome/cta-section.tsx` - Delete or demote (duplicate primary CTA)
- `components/welcome/tools-grid-section.tsx` - Remove the 12-card grid (1.4)
- `components/welcome/starter-templates-section.tsx` - Cards must select their template (1.6)
- `app/start/page.tsx` - NEW: the three-door chooser (1.3)
- `components/welcome/door-chooser.tsx` - NEW: three-door component, reused on `/start`
- `lib/routes.ts` - Guided-route registry; surfaced from the Play door (1.3)
- `components/tools/sidebar.tsx` - 18 entries → 4 (1.5) — **HOTSPOT, single writer**
- `lib/tools.ts` - Grouped registries feeding the sidebar (1.5)
- `app/settings/*` - Four pages become one page with sections (1.5)
- `components/tools/onboarding/*` - Deck stops gating the workshop (1.7)
- `hooks/useOnboarding.ts` - Trigger removal (1.7)
- `components/custom-practice/practice-page-editor.tsx` - Three contextual first-run hints (1.7)
- `lib/analytics.ts` - New funnel events (2.x of Phase 4, stubbed here)

### Notes

- Unit tests: `npm run test:unit:run`. E2E: `npm run test:e2e`. Auth specs fail
  fast when `NEXT_PUBLIC_AUTH_DISABLED=true` unless `E2E_ALLOW_AUTH_DISABLED=true`.
- Reuse `e2e/auth-assertions.ts` (`expectRedirectedToSignIn`, `expectNotBare404`,
  `expectNoApplicationError`) rather than writing new URL/error checks.
- `components/tools/sidebar.tsx`, `app/layout.tsx`, and `app/globals.css` are
  hotspot files — one writer at a time.
- Landing copy lives in `lib/welcome-config.ts` and can be iterated at
  `/dev/welcome-lab` before hard-coding.
- Next 16: read the relevant guide in `node_modules/next/dist/docs/` before
  touching routing, metadata, or the proxy.

## Instructions for Completing Tasks

Check off by changing `- [ ]` to `- [x]` after each sub-task. Evidence = the
command output named in the sub-task (test fail → pass, lint, build, e2e).

## Tasks

- [ ] 1.1 Make the workshop public — see `docs/public-workshop-and-fork-plan.md` Change A and `tasks/tasks-public-workshop.md`. A proxy-only edit is not enough (page-level `canAccess` card + onboarding overlay + `userReady` spinner trap). The stub below is superseded; do that list instead.
  - [ ] 1.1.1 Write `e2e/workshop-anonymous.spec.ts` FIRST: an unsigned visitor opens `/tools/workshop`, is **not** redirected to sign-in, adds a metronome block from the shelf, and starts it. Run — expect FAIL (redirect)
  - [ ] 1.1.2 Add `/tools/workshop` and `/tools/workshop/marketplace` to the public-route list in `proxy.ts`; update the doc comment explaining why (Free tier is localStorage-only, so the gate protected nothing)
  - [ ] 1.1.3 Update `e2e/auth-protection.spec.ts`'s public/protected matrix and the route table in `docs/PROJECT_HISTORY.md`
  - [ ] 1.1.4 Verify the signed-out workshop is not a dead end: replace any "Sign in to create custom practice pages" copy with a working editor plus a quiet "Sign in to sync across devices" affordance
  - [ ] 1.1.5 Re-run — expect PASS; `npm run test:e2e` green

- [ ] 1.2 One sentence, one button
  - [ ] 1.2.1 Write/extend a landing test asserting exactly **one** element with the primary-CTA role on `/`. Expect FAIL (there are three)
  - [ ] 1.2.2 Trim `defaultWelcomeConfig.hero` in `lib/welcome-config.ts` to eyebrow + headline + one sentence + one CTA pointing at `/start`
  - [ ] 1.2.3 Delete `components/welcome/cta-section.tsx`'s duplicate primary CTA and the "Open the Workshop" promo in the tools grid
  - [ ] 1.2.4 Re-run — expect PASS

- [ ] 1.3 The three-door chooser
  - [ ] 1.3.1 Write `components/welcome/__tests__/door-chooser.test.tsx` FIRST: renders exactly three doors (Play / Build / Learn), each with an icon, a label, one line of copy, and a working href. Expect FAIL
  - [ ] 1.3.2 Implement `components/welcome/door-chooser.tsx`; copy lives in `lib/welcome-config.ts` so it can be tuned from `/dev/welcome-lab`
  - [ ] 1.3.3 Add `app/start/page.tsx` rendering the chooser; add `/start` to the public routes in `proxy.ts`
  - [ ] 1.3.4 Wire the doors: **Play** → `/routes` (guided routes for beginners, ready-made drills below), **Build** → `/tools/workshop`, **Learn** → `/articles`
  - [ ] 1.3.5 Extend the e2e landing spec: `/` → CTA → `/start` → Build → a running metronome, all anonymous. Re-run — expect PASS

- [ ] 1.4 Halve the landing page
  - [ ] 1.4.1 Write a test asserting the landing page renders ≤ 6 top-level sections. Expect FAIL (11)
  - [ ] 1.4.2 New order in `components/welcome/welcome-content.tsx`: hero → three doors → one "how it works" → one evidence section → the story (first person, `who-made-this` reworked) → footer
  - [ ] 1.4.3 Remove `tools-grid-section.tsx` from the page (keep the file until Phase 2 makes those tools blocks)
  - [ ] 1.4.4 Fold the Anki decks section into the Play door / guided route rather than a landing section
  - [ ] 1.4.5 Re-run — expect PASS; confirm total scroll ≤ 4 viewport heights at 1440×900

- [ ] 1.5 Collapse the navigation
  - [ ] 1.5.1 Write `components/tools/__tests__/sidebar.test.tsx` FIRST asserting exactly four top-level sections: Workshop, Shelf, Progress, Settings. Expect FAIL (18 entries)
  - [ ] 1.5.2 Regroup `lib/tools.ts`: ready-made drills move under Workshop as starting points; `labTools` stops being a sidebar section (labs become blocks in Phase 2 — until then, reach them from the shelf)
  - [ ] 1.5.3 Rewrite `components/tools/sidebar.tsx` against the new grouping (HOTSPOT — announce before editing)
  - [ ] 1.5.4 Merge the four settings pages into one `/settings` page with sections; keep the old paths as redirects
  - [ ] 1.5.5 Re-run — expect PASS; `npm run test:e2e` green (several specs deep-link to settings paths)

- [ ] 1.6 Fix the clicks that lie
  - [ ] 1.6.1 Write a test FIRST: clicking a starter-template card lands on the workshop **with that template applied**, not a generic page. Expect FAIL
  - [ ] 1.6.2 Pass the template id through the link (`/tools/workshop?template=<id>`) and apply it on load, reusing the starter-picker apply path
  - [ ] 1.6.3 Resolve the vocabulary collision — pick one term per concept and sweep every surface: **Workshop** (your pages), **Shelf** (official components, today's "Marketplace"), **Community** (published pages, today's "Gallery"), **drill** (what you run)
  - [ ] 1.6.4 Re-run — expect PASS; grep for the retired terms to confirm the sweep is complete

- [ ] 1.7 Move onboarding out of the way
  - [ ] 1.7.1 Write a test FIRST: a first-time visitor reaching `/tools/workshop` sees the editor, not a full-screen deck. Expect FAIL
  - [ ] 1.7.2 Remove the onboarding gate from `DashboardShell`; keep the deck reachable from the Learn door and `/settings`
  - [ ] 1.7.3 Publish the three pillars as an article (they are good content in the wrong position)
  - [ ] 1.7.4 Add three dismissible first-run hints in the editor: autosave, `/` opens the shelf, blocks are live — localStorage-backed, one line each
  - [ ] 1.7.5 Update `e2e/auth-helper.ts` and `e2e/tools-onboarding.spec.ts` for the new behavior. Re-run — expect PASS

- [ ] 1.8 Phase gate
  - [ ] 1.8.1 Full gate: `npm run lint && npm run test:unit:run && npm run build && npm run test:e2e` — all green
  - [ ] 1.8.2 Manual: incognito, land on `/`, reach a running drill in two clicks with no account. Time it — target under 20 seconds
  - [ ] 1.8.3 Update `README.md` and `docs/PROJECT_HISTORY.md` with the new front door and public-route matrix
  - [ ] 1.8.4 Book the first Phase 4 session before starting Phase 2
