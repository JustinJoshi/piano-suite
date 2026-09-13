# Task
Wire the five published demo videos into their tool pages: `/tools/chord-drill`
(demo-chord-drill.mp4), `/tools/arpeggios` (demo-arpeggios.mp4),
`/tools/root-cycling` (demo-root-cycling.mp4), `/tools/progression`
(demo-progression.mp4), `/tools/workshop` (demo-workshop.mp4). Landing page
already embeds demo-web2.mp4 — leave it alone.

# Context
The demo-videos delegation run produced one demo video per ready-made drill
plus the Workshop; they sit in `public/` but only the welcome page embeds a
video today. Each tool page should offer its own demo, collapsed so the drill
itself stays primary: a `<details>` section below the main drill card
("Watch the demo") that expands to the video. Workshop-first repo: this is a
small shared primitive + one line per page, not a new page or lab.

# Relevant files
- `/home/justin/piano-suite/AGENTS.md` — repo conventions (worktree workflow,
  theming tokens, mobile-first, keyboard conventions, axe gate). Read first.
- `/home/justin/piano-suite/lib/tools.ts` — the tool registry (hrefs:
  /tools/chord-drill etc.). READ ONLY — it is a single-writer hotspot file;
  do NOT edit it. Key your registry off hrefs, not off this file.
- `/home/justin/piano-suite/components/drills/drill-shell.tsx` — shared layout
  wrapper for every tool page; the demo section mounts in each page's content.
- The five pages: `/home/justin/piano-suite/app/tools/chord-drill/page.tsx`,
  `app/tools/arpeggios/page.tsx`, `app/tools/root-cycling/page.tsx`,
  `app/tools/progression/page.tsx`, `app/tools/workshop/page.tsx` — one
  mounting change each, minimal diff.
- `/home/justin/piano-suite/public/demo-*.mp4` — the five assets (all exist,
  ~3-5 MB each, h264 1440x900 with baked captions + aac audio).
- `/home/justin/piano-suite/components/welcome/demo-video-section.tsx` — the
  welcome-page embed for visual reference (muted playsInline preload
  metadata, native controls, theme tokens).
- `/home/justin/piano-suite/app/globals.css` — token source; no raw colors.

# Output format
- `/home/justin/piano-suite/lib/demo-videos.ts` — small typed registry:
  href -> { mp4: "/demo-<tool>.mp4", title: string, ariaLabel: string } for
  the five tools. Welcoming beginner-first copy, no hype.
- `/home/justin/piano-suite/components/drills/tool-demo-video.tsx` — client
  component: collapsed `<details>` (summary like "Watch the demo"), expands
  to `<video controls muted playsInline preload="metadata">` with aria-label
  from the registry, `aspect-[16/10] w-full`, theme tokens only, no autoplay,
  no hard-coded colors, no new keyboard shortcuts.
- One-line integration in each of the five pages (below the main drill card;
  on /tools/workshop place it so the collapsed details does not interfere
  with the editor grid — bottom of the page content).
- `/home/justin/piano-suite/lib/__tests__/demo-videos.test.ts` — unit test:
  every registry entry maps to an existing file in `public/` (fs check) and
  an href under /tools/.

# Tool and source guidance
- Worktree per AGENTS.md from `/home/justin/piano-suite`:
  `git worktree add .worktrees/tool-demo-videos -b demo/wire-tool-videos`,
  symlink `.env.local`, work only there, run the gate, merge into `main`
  from the main checkout, remove the worktree. Agent-Id: `echo
  $PASEO_AGENT_ID`; Session-Id: `runtimeInfo.sessionId` in
  `~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json`.
- Write incrementally; keep the diff minimal; do not restructure pages.
- Verify with your own dev server on a free port >=3002 and `curl` the
  rendered HTML of one drill page + /tools/workshop (grep for the details/
  summary and video element) — textual evidence only, never image reads.
- Gate: `npm run lint` (0 errors), `npm run test:unit:run`, `npm run build`.
  The axe gate (`e2e/a11y.spec.ts`) covers /tools/workshop — run
  `npm run test:e2e -- e2e/a11y.spec.ts` if the harness is available;
  if it cannot run in your environment (missing browser/deps), say so
  explicitly in TOOLING NOTES — never skip it silently.
- Commit contract files (your brief + summary under
  `.paseo-delegate/demo-videos/`) with the phase commit; scoped `git add`
  only; never `git add -A`. Retry on index.lock.

# Task boundaries
- Do NOT edit: `lib/tools.ts`, `convex/schema.ts`, `app/globals.css`
  (tokens exist already), `app/layout.tsx`, `components/ui/*`,
  `components/welcome/*`, any `public/*.mp4`, `proxy.ts`.
- Do NOT touch any other feature (settings, sidebar, workshop grid internals).
- Do NOT create a git repository; commit scoped paths only.

# Effort budget
60 minutes wall clock.

# Acceptance criteria
- [ ] `grep -rn "tool-demo-video\|demo-videos" app lib components` finds the
  registry, the component, and all five pages mounting it (validator greps
  merged main).
- [ ] `lib/__tests__/demo-videos.test.ts` passes and asserts file existence
  in public/ for all five entries (validator re-runs vitest on it).
- [ ] The committed component is a collapsed `<details>` with a `<video>`
  that has `controls muted playsInline preload="metadata"` and an aria-label;
  no autoplay (validator greps source).
- [ ] `npm run lint` exits 0; `npm run test:unit:run` passes; `npm run build`
  exits 0 (validator re-runs on merged main).
- [ ] Axe gate on /tools/workshop passes, or TOOLING NOTES explains exactly
  why it could not run (validator checks the note, not a silent skip).
- [ ] Commits carry provenance trailers (Phase: wire-tool-videos; Agent-Id;
  Session-Id; Brief; Verdict paths), touch only: `lib/demo-videos.ts`,
  `components/drills/tool-demo-video.tsx`, the five page files, the unit
  test, `public/` nothing, and `.paseo-delegate/demo-videos/` contract files.
- [ ] `git status --porcelain` on main: nothing NEW beyond baseline
  (`docs/quick-fixes-2026-09/`, `public/demo-web.mp4`).

# Constraints
- Theme tokens only; mobile-first; the drill UI stays the primary content
  (demo is collapsed by default).
- No autoplay; no new global shortcuts; Escape/keyboard behavior untouched.
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
