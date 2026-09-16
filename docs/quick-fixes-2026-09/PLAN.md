# Quick fixes — 2026-09-12

Four small, independent fixes surfaced from a user bug list. Each phase is
self-contained; no phase depends on another. Root causes were already found
by investigation before this plan was written — workers should verify, then
apply the fix, not re-diagnose from scratch.

## Phase: anki-deck-download-txt-gate

**Objective:** Signed-out visitors clicking the "Download deck" buttons on
the welcome page get redirected to `/sign-in` instead of getting the file.

**Root cause:** `proxy.ts`'s middleware `matcher` (around line 98) excludes
a list of static file extensions from Clerk auth-gating: `html?|css|js(?!on)|
jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest`.
`.txt` is missing from that list. `components/welcome/deck-section.tsx`
links directly to `/chord-symbols-CGDAE.txt` and
`/chord-symbols-CGDAEno11.txt` (static files in `public/`), so those
requests hit the middleware, fail the `isPublicRoute` check, and get
redirected to sign-in for signed-out users.

**Fix:** Add `txt` to the excluded-extension group in the matcher regex in
`proxy.ts`, so `.txt` static files are treated the same as the other listed
static extensions and skip auth-gating entirely.

**Acceptance criteria:**
1. `proxy.ts`'s matcher regex excludes `.txt` files from middleware
   matching (alongside the existing `csv|docx?|xlsx?|zip|webmanifest`
   group).
2. No other line in `proxy.ts` changed.
3. `npm run test:unit:run` passes with no new failures.
4. `npm run build` succeeds.
5. Manually confirm (or add/adjust a test if one already covers the
   matcher) that a request to `/chord-symbols-CGDAE.txt` is not
   intercepted by the Clerk middleware.

**Files:** `proxy.ts` only.

---

## Phase: dead-onboarding-links

**Objective:** Two pieces of onboarding content are dead: an Unsplash photo
404s, and an external article link 404s. Both appear as duplicated content
in two files (the `/tools` onboarding flow and the public welcome/`/start`
flow read from separate, content-identical arrays).

**Root cause / verified facts:**
- Image `https://images.unsplash.com/photo-1544367563-12123d8965cd?w=600&auto=format&fit=crop&q=60`
  (used for the "Isha Yoga hand stretches" resource card) returns HTTP 404.
- Link `https://francescocirillo.com/products/the-pomodoro-technique` (used
  for the "The Pomodoro Technique" resource card) returns HTTP 404 (the
  site restructured). Verified replacement: `https://www.pomodorotechnique.com`
  returns HTTP 200 and is the official Pomodoro Technique site.
- Both broken values appear in TWO files with identical duplicated content:
  - `lib/onboarding.ts` (isha-hand-stretches `imageSrc` ~line 85; pomodoro
    `href` ~line 116)
  - `lib/welcome-config.ts` (isha-hand-stretches `imageSrc` ~line 338;
    pomodoro `href` ~line 374)

**Fix:**
1. Replace the dead Unsplash `imageSrc` for the `isha-hand-stretches`
   resource in both files with a working, appropriately-licensed Unsplash
   photo URL relevant to hand/wrist stretching or yoga (verify the
   replacement URL returns HTTP 200 before committing).
2. Replace the dead `href` for the `pomodoro` resource in both files with
   `https://www.pomodorotechnique.com`.
3. Do not change any other resource entries — every other image/link in
   both files was already verified to return HTTP 200.

**Acceptance criteria:**
1. `lib/onboarding.ts` and `lib/welcome-config.ts` no longer contain the
   dead Unsplash photo id `1544367563-12123d8965cd`.
2. Both files' `isha-hand-stretches` entries point at the same new
   `imageSrc`, and that URL returns HTTP 200 (verify with `curl -sI`).
3. Both files' `pomodoro` entries have `href: "https://www.pomodorotechnique.com"`.
4. No other resource entry in either file is modified.
5. `npm run test:unit:run` passes (check `lib/__tests__/welcome-config.test.ts`
   and any onboarding test in particular).
6. `npm run build` succeeds.

**Files:** `lib/onboarding.ts`, `lib/welcome-config.ts` only.

---

## Phase: midi-keyboard-toggle

**Objective:** Let users keep the on-screen keyboard visible even after a
real MIDI keyboard connects, instead of it disappearing automatically.

**Current behavior:** `components/drills/midi-connection-bar.tsx` renders
`fallbackKeyboard` (the `KeyboardDisplayBlock`) only in the `!supported` and
`!connected` branches (roughly lines 44-70). Once `connected` is true, the
component renders only the status row (lines 72-140: connected badge,
device selector, MIDI-sound/sustain checkboxes, settings link) — the
on-screen keyboard is never shown.

**Fix:** In the `connected` branch, add a toggle (checkbox, styled to match
the existing "Use MIDI sounds" / "Sustain" checkboxes at lines 98-118) 
labeled something like "Show on-screen keyboard too". Use local component
state (`useState`, default `false` — this preserves current behavior for
everyone who doesn't opt in). When checked, render `fallbackKeyboard` below
the status row, exactly as it already renders in the disconnected branch.
When unchecked, behavior is unchanged from today.

Do not add Convex or localStorage persistence for this toggle — keep it
simple, session-only local state. Do not touch `useMidi`, `midi-session.ts`,
or any other MIDI primitive; this is a presentational change scoped to
`midi-connection-bar.tsx`.

**Acceptance criteria:**
1. `components/drills/midi-connection-bar.tsx` has a new checkbox rendered
   only in the `connected` (hardware attached) branch, matching the visual
   style of the existing checkboxes in that branch.
2. The checkbox defaults to unchecked; when unchecked, rendered output for
   the `connected` branch is unchanged from before this phase (no
   regression for the default case).
3. When checked, the same `fallbackKeyboard` element used in the
   disconnected/unsupported branches renders below the status row.
4. `components/drills/__tests__/midi-connection-bar.test.tsx` is updated
   with a test covering: toggle absent/off by default, keyboard appears
   after checking it while `connected: true`.
5. `npm run test:unit:run` passes.
6. `npm run lint` passes.
7. `npm run build` succeeds.

**Files:** `components/drills/midi-connection-bar.tsx`,
`components/drills/__tests__/midi-connection-bar.test.tsx`.

---

## Phase: workshop-beta-pill

**Objective:** Show a small "Beta" tag next to the Workshop label, both in
the sidebar nav item and on the Workshop page header.

**Approach:** Add a small, reusable "Beta" pill rather than hardcoding it
in two unrelated places.

1. `components/drills/drill-shell.tsx` — add an optional `badge?: string`
   prop to `DrillShellProps`. When present, render it as a small pill
   immediately after the `{title}` text in the header (reuse the app's
   existing pill/badge visual pattern — see `components/workshop-marketplace/about-panel.tsx`
   or `components/tools/onboarding/slides/pillar-slide.tsx` for the
   rounded-full/text-xs/uppercase pill style already used elsewhere; use
   Tailwind + theme tokens only, per `AGENTS.md` theming conventions — no
   hardcoded hex/rgb colors). Pass `badge="Beta"` only from
   `app/tools/workshop/page.tsx`; no other page changes.
2. `components/tools/sidebar.tsx` — next to the Workshop nav item's label
   (~lines 239-258, the `{workshopTool.title}` line), render the same small
   "Beta" pill. `sidebar.tsx` is a listed hotspot file in `AGENTS.md` —
   make this a small, additive, self-contained diff (do not restructure
   surrounding nav code) to minimize merge risk with other in-flight work.

**Acceptance criteria:**
1. `DrillShellProps` has an optional `badge?: string`; when provided it
   renders as a visually distinct small pill next to the title; when
   absent, header markup is unchanged from before this phase.
2. `app/tools/workshop/page.tsx` passes `badge="Beta"` to `DrillShell`.
3. The Workshop page header now visibly shows a "Beta" pill next to
   "Workshop" (verify by reading the rendered output/component, or a
   snapshot/RTL test if one already exists for `DrillShell` or the
   Workshop page).
4. The sidebar's Workshop nav item (`data-testid="sidebar-link-workshop"`)
   now shows a small "Beta" pill next to the "Workshop" label.
5. No hardcoded hex/rgb/hsl colors introduced; pill uses existing
   Tailwind utility classes and semantic theme tokens only.
6. No other tool's `DrillShell` usage passes a `badge` prop (grep confirms
   only `app/tools/workshop/page.tsx` uses it).
7. `npm run test:unit:run` passes.
8. `npm run lint` passes.
9. `npm run build` succeeds.

**Files:** `components/drills/drill-shell.tsx`, `components/tools/sidebar.tsx`,
`app/tools/workshop/page.tsx`, and any existing test files for those
components that need updating for the new prop/markup.
