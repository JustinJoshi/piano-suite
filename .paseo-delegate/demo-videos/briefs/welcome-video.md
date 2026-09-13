# Task
Integrate the existing demo video `/home/justin/piano-suite/public/demo-web2.mp4` into the welcome page (`/`) as a visible, accessible, properly-copied product demo section.

# Context
Piano Suite is a free learning community for self-taught pianists; the welcome page is the front door. A finished ~46s landscape product demo (demo-web2.mp4, 1440x900 h264, ~9.9 MB) already exists in `public/` but nothing on the page embeds it. Your job is placement, copy, and controls that follow the repo's conventions — not a bare dumped `<video>` tag.

# Relevant files
- `/home/justin/piano-suite/AGENTS.md` — repo conventions. Read first: worktree workflow, theming tokens, welcome/onboarding rules, keyboard conventions, a11y gate.
- `/home/justin/piano-suite/DESIGN-PRINCIPLES.md` — visual conventions.
- `/home/justin/piano-suite/lib/welcome-config.ts` and `/home/justin/piano-suite/hooks/useWelcomeConfig.ts` — typed welcome copy/style config; landing copy belongs here, read via `useWelcomeConfig()`.
- `/home/justin/piano-suite/components/welcome/welcome-page.tsx` and the section components beside it (`hero-section.tsx`, `feature-section.tsx`, `cta-section.tsx`, `tools-grid-section.tsx`) — where the section mounts.
- `/home/justin/piano-suite/public/demo-web2.mp4` — the asset to embed as-is.
- `/home/justin/piano-suite/app/globals.css` — token source; never hard-code colors.

# Output format
- A committed change merged into `main` of the piano-suite repo (worktree workflow).
- A welcome section (or hero-adjacent placement) embedding the video, with its copy registered in `lib/welcome-config.ts` and read through `useWelcomeConfig()`.
- Verification evidence is textual/numeric only (grep, build output, curl of rendered HTML). Never read screenshots or video frames as images.

# Tool and source guidance
- Worktree per AGENTS.md: from `/home/justin/piano-suite`, `git worktree add .worktrees/welcome-video -b welcome/demo-web2-embed`, symlink `.env.local`, work only in the worktree, run the gate, merge into `main` from the main checkout, remove the worktree. Your Agent-Id is `echo $PASEO_AGENT_ID`; Session-Id is `runtimeInfo.sessionId` in `~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json`.
- `<video>`: `muted`, `playsInline`, `preload="metadata"` (or a poster), lazy-friendly placement, and either visible `controls` or a clear programmatic play/pause affordance. If it autoplays motion, honor `usePrefersReducedMotion` (WCAG 2.2.2) with a visible pause control.
- Mobile-first reflow; theme tokens only; copy stays beginner-first and welcoming.
- Verify against your own dev server: from the worktree, `PORT=3002 npm run dev` (3000/3001 are taken by other checkouts), then `curl` the rendered HTML and grep for your section.
- Commit your brief file and your summary under `/home/justin/piano-suite/.paseo-delegate/demo-videos/` together with the phase commit — the contract directory is tracked, never scratch.
- Write incrementally. Do not pre-plan the whole artefact.

# Task boundaries
- Do NOT touch: `lib/tools.ts`, workshop/grid internals, the theme registry, `package.json`/lockfile, `public/demo-web.mp4`, `docs/quick-fixes-2026-09/`, Convex schema, `components/ui/*`.
- Do NOT re-encode or replace demo-web2.mp4.
- Do NOT create a git repository. Commit scoped paths only; never `git add -A` from the repo root.

# Effort budget
90 minutes wall clock. One code commit plus one contract-files commit is the expected shape.

# Acceptance criteria
- [ ] `grep -rn "demo-web2" app components lib` (from repo root, on merged `main`) finds a tracked source reference inside the welcome page tree — the validator runs this.
- [ ] The committed embed element is `muted playsInline` AND offers `controls` or a programmatic pause affordance; if autoplaying motion, a prefers-reduced-motion pause path exists — validator greps the committed source.
- [ ] `git ls-files public/demo-web2.mp4` non-empty on merged `main`.
- [ ] From repo root on merged `main`: `npm run lint` exits 0 and `npm run build` exits 0.
- [ ] Every deliverable-touching commit carries trailers `Phase: welcome-video`, `Agent-Id: <yours>`, `Session-Id: <yours>`, `Brief: .paseo-delegate/demo-videos/briefs/welcome-video.md`, `Verdict: .paseo-delegate/demo-videos/verdicts/welcome-video.json` (paths relative to repo root).
- [ ] `git status --porcelain` on `main` shows nothing NEW beyond the pre-existing baseline (`?? docs/quick-fixes-2026-09/`, `?? public/demo-web.mp4`, `?? public/demo-web2.mp4` before your commit).

# Constraints
- Welcome copy lives in `lib/welcome-config.ts` — no hard-coded marketing strings in components.
- Preserve every existing welcome section; add, do not restructure.
- If lint/build fails after 3 fix attempts, stop with STATUS: blocked and full evidence.

# Completion contract
Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ... (commands + outputs, textual/numeric only)
BLOCKERS: ...
TOOLING NOTES: ... (defects/surprises in tools — dev server, gates, capture stack; `none` if none)
HANDOFF NOTES: ...
