# Task
Build a first-visit introduction overlay for the five tool pages that have
demo videos (`/tools/chord-drill`, `/tools/arpeggios`,
`/tools/root-cycling`, `/tools/progression`, `/tools/workshop`). On a
visitor's first visit to a tool page it shows a warm overlay that (a)
welcomes them to Piano Suite, (b) introduces that specific drill, and (c)
offers its demo video. Dismissing it sets a per-tool localStorage flag so it
never nags again on that device.

# Context
The demo videos are wired into the five tool pages via `lib/demo-videos.ts`
+ `components/drills/tool-demo-video.tsx` (collapsed "Watch the demo"
details). This overlay is the first-time experience layered on top of that
same registry: the overlay for first-timers, the collapsed details for
returning visitors. Piano Suite is a free learning community for
self-taught pianists — the overlay's copy must be warm, plain-spoken,
beginner-first, and specific to the tool on screen. Repo conventions in
`/home/justin/piano-suite/AGENTS.md` (read first) apply: theme tokens only,
mobile-first, keyboard conventions, axe gate.

# Relevant files
- `/home/justin/piano-suite/AGENTS.md` — keyboard conventions (unmodified
  letters are piano notes; dialogs handle Escape themselves and suppress
  sibling shortcuts — see command-palette.tsx / shortcut-help.tsx as the
  reference pattern), theming, a11y gate.
- `/home/justin/piano-suite/lib/demo-videos.ts` — the registry (href ->
  mp4/labels); extend it with the per-tool intro copy fields you need
  (title, body lines, CTA label). It is this run's file; edit freely.
- `/home/justin/piano-suite/components/drills/tool-demo-video.tsx` — the
  existing mounted component; the overlay should hang off the same mount
  point (first visit -> overlay; after dismissal -> the collapsed details).
  Do not remount new components on the pages if avoidable — zero page-file
  edits is the ideal diff.
- `/home/justin/piano-suite/components/welcome/onboarding*` or any existing
  Onboarding component (find it) — study its patterns before building;
  reuse existing dialog/primitive components rather than hand-rolling a
  modal if the codebase already has one.
- `/home/justin/piano-suite/hooks/usePrefersReducedMotion.ts` — for any
  overlay motion.
- `/home/justin/piano-suite/.paseo-delegate/capture-*.mjs` — capture scripts
  set `piano-suite:onboarding-completed` via addInitScript; they must ALSO
  set your new flag so future demo re-captures never film the overlay.
  Update the four drill capture scripts + capture-workshop.mjs accordingly.
- `/home/justin/piano-suite/e2e/a11y.spec.ts` — scans /tools/workshop,
  /tools/workshop/blocks, /marketplace signed-out in a FRESH context, so
  your overlay WILL be open during that scan: it must be fully accessible
  (dialog role, aria-modal, labeled, focusable close, no keyboard traps).

# Output format
- `lib/demo-videos.ts` extended with per-tool intro copy (warm, specific,
  one or two short sentences + CTA label per tool — your writing).
- The overlay: a client component (inside or beside `tool-demo-video.tsx`)
  that on first visit renders an accessible modal: welcome headline, short
  body, the tool's demo video (controls, muted, playsInline,
  preload="none" or "metadata" — no autoplay of sound, no autoplay at all
  unless reduced-motion-safe and pausable), a primary CTA ("start
  practicing"-style) that dismisses, and an obvious close button.
- Dismissal (CTA, close button, or Escape) writes a per-tool localStorage
  flag (namespace consistent with existing `piano-suite:*` keys — check how
  existing flags are named/read, e.g. `lib/` helpers) and never shows that
  tool's overlay again. Device-local only — NO Convex sync.
- Flag-read logic pure enough to unit test; unit tests co-located in
  `lib/__tests__/` or `components/__tests__/` per repo layout.
- Capture scripts updated to pre-set the flag.

# Tool and source guidance
- Worktree per AGENTS.md from `/home/justin/piano-suite`:
  `git worktree add .worktrees/first-visit-intro -b demo/first-visit-intro`,
  symlink `.env.local`, work only there, gate, merge into `main` from the
  main checkout, remove the worktree. Agent-Id: `echo $PASEO_AGENT_ID`;
  Session-Id: `runtimeInfo.sessionId` in
  `~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json`.
- Write incrementally. Reuse, do not reinvent: check existing modal/dialog
  primitives (command-palette, shortcut-help, dashboards) before writing
  your own.
- Theme tokens only (var(--color-*)); mobile-first reflow; the overlay must
  be scrollable on small screens with the video at 16:10.
- Verify with your own dev server (free port >=3002) + curl the rendered
  HTML; textual evidence only — never image reads.
- Gate: `npm run lint` (0 errors), `npm run test:unit:run`, `npm run build`,
  and the axe gate `npm run test:e2e -- e2e/a11y.spec.ts` (it now scans the
  overlay open on /tools/workshop — this is the point; make it pass).
- Commits: scoped paths, provenance trailers (Phase: first-visit-intro;
  Agent-Id; Session-Id; Brief: `.paseo-delegate/demo-videos/briefs/first-visit-intro.md`;
  Verdict: `.paseo-delegate/demo-videos/verdicts/first-visit-intro.json`),
  push to origin main. Tree baseline: `docs/quick-fixes-2026-09/`,
  `public/demo-web.mp4`.

# Task boundaries
- Do NOT touch: `lib/tools.ts`, `app/globals.css`, `app/layout.tsx`,
  `components/ui/*`, `convex/schema.ts`, `proxy.ts`, any `public/*.mp4`,
  the welcome page or its sections, existing Onboarding behavior on the
  dashboard.
- Do NOT sync the flag to Convex or gate it on auth — signed-out visitors
  see the overlay too.
- Do NOT change the drill components' behavior; the overlay is additive and
  must not block drills after dismissal.

# Effort budget
90 minutes wall clock.

# Acceptance criteria
- [ ] A fresh context visiting each of the five tool pages gets the overlay
  exactly once; after dismissal a repeat visit shows only the collapsed
  "Watch the demo" details (validator: reads the component source + runs
  the unit tests itself; also curls one page's HTML).
- [ ] The overlay is a labeled accessible dialog (role=dialog, aria-modal,
  accessible name, close button) that closes on Escape and returns focus;
  open overlay suppresses drill shortcuts (validator greps source + runs
  the axe gate itself).
- [ ] `lib/demo-videos.ts` carries per-tool intro copy for all five tools;
  copy is tool-specific (validator reads the file).
- [ ] Unit tests for the once-per-tool flag logic pass (validator re-runs).
- [ ] `npm run lint` exits 0; `npm run test:unit:run` passes; `npm run build`
  exits 0 (validator re-runs on merged main).
- [ ] Axe gate passes with the overlay visible on /tools/workshop (validator
  re-runs `e2e/a11y.spec.ts`).
- [ ] All four drill capture scripts + capture-workshop.mjs pre-set the new
  flag (validator greps the scripts).
- [ ] Commits carry provenance trailers, touch only the files this phase
  declares, and `git status --porcelain` on main shows nothing NEW beyond
  baseline.

# Constraints
- Numeric/textual verification only — never read screenshots as images.
- No autoplay with sound; if the video autoplays at all it must be muted and
  honor prefers-reduced-motion with a visible pause control.
- The overlay must never appear for a user mid-drill (mount-time check only,
  not timed).
- If the gate fails after 3 fix attempts, stop with STATUS: blocked and full
  evidence.

# Completion contract
Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ... (commands + outputs, textual only)
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
