# Task
Rewrite the first-visit intro copy in `lib/demo-videos.ts` for all five tools
(chord-drill, arpeggios, root-cycling, progression, workshop) so every claim
is grounded in what the drill ACTUALLY does, verified by reading its source
files first. User feedback: the current wording was written from names, not
from the drills.

# Context
`components/drills/tool-demo-video.tsx` renders a first-visit overlay with
per-tool copy from `lib/demo-videos.ts` (`introHeadline` / `introBody` /
`introCta`). The current copy was drafted from registry descriptions, not
the implementations. Piano Suite is a free learning community for
self-taught pianists; copy must stay warm, plain-spoken, beginner-first, and
now MECHANICALLY ACCURATE: it should describe the real interaction loop the
visitor is about to experience, using the app's own on-screen terms.

# Research step (do this first, it drives everything)
For EACH of the five tools, read the implementation until you can describe
the actual loop a first-time user will perform, then write copy that only
claims what you verified:

- `/home/justin/piano-suite/app/tools/chord-drill/page.tsx` and
  `/home/justin/piano-suite/components/drills/chord-drill/` — what the
  prompt shows, what "reps", the timer, "Again/Hard/Good/Easy" grading, and
  the Anki follow actually are.
- `/home/justin/piano-suite/app/tools/arpeggios/page.tsx` and
  `/home/justin/piano-suite/components/drills/arpeggios/` (+ any lib it
  imports) — the two-phase root/sequence structure, the minor-11 cell, the
  left-hand pedal, the strip lighting note-by-note, laps/misses, the miss
  filter.
- `/home/justin/piano-suite/app/tools/root-cycling/page.tsx`,
  `/home/justin/piano-suite/components/drills/root-cycling/`,
  `/home/justin/piano-suite/lib/root-cycling.ts` — chord vs arpeggio mode,
  what a "root cycle" is, skip/next behavior, what the Tracking panel shows.
- `/home/justin/piano-suite/app/tools/progression/page.tsx` and
  `/home/justin/piano-suite/components/drills/progression/` (+ `lib/progression.ts`
  if present) — ii-V-I / 12-bar blues loops, per-chord transition timing,
  what gets graded and what "personal bests" shows.
- `/home/justin/piano-suite/app/tools/workshop/page.tsx` and the Workshop
  machinery it mounts (`components/custom-practice/`, `lib/feature-blocks/registry.ts`)
  — what a practice page is, starter picker vs blank page, the block
  library (how many blocks of what kinds), the marketplace fork flow.

Do not guess: if a claim is not visible in the code or the rendered UI
strings you read, it does not go in the copy. Prefer the UI's own vocabulary
(the words the component renders, e.g. "Reps per round", "Start Loop",
"Next chord") over invented paraphrases.

# Output format
- `lib/demo-videos.ts` — rewritten `introHeadline` / `introBody` /
  `introCta` for all five tools; same fields, same component contract, no
  structural changes elsewhere in the file.
- Copy constraints: headline under ~60 chars; body one or two short
  sentences (the overlay layout is fixed — do not grow it); CTA 2-4 words.
  Warm and inviting to a self-taught beginner, zero hype, no features the
  code does not show.

# Tool and source guidance
- Worktree per AGENTS.md from `/home/justin/piano-suite`:
  `git worktree add .worktrees/intro-copy-research -b demo/intro-copy-research`,
  symlink `.env.local`, work only there, gate, merge into `main` from the
  main checkout, remove the worktree. Agent-Id: `echo $PASEO_AGENT_ID`;
  Session-Id: `runtimeInfo.sessionId` in
  `~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json`.
- In your completion summary include a RESEARCH NOTES line per tool: the
  files you read + the actual loop you found in one sentence — that is the
  trace a reviewer checks the copy against.
- Verify with your own dev server (free port >=3002) + curl one page's HTML;
  textual evidence only, never image reads.
- Gate: `npm run lint` (0 errors), `npm run test:unit:run` (copy-presence
  tests must still pass), `npm run build`.
- Commit scoped paths (`lib/demo-videos.ts` + contract files), provenance
  trailers (Phase: intro-copy-research; Agent-Id; Session-Id; Brief:
  `.paseo-delegate/demo-videos/briefs/intro-copy-research.md`; Verdict:
  `.paseo-delegate/demo-videos/verdicts/intro-copy-research.json`), push to
  origin main. Baseline dirt: `docs/quick-fixes-2026-09/`,
  `public/demo-web.mp4`.

# Task boundaries
- Do NOT touch: any component, page, test file, capture script, or the
  welcome page. This phase is copy + nothing else (if a copy-presence test
  asserts exact strings that you change, updating THAT assertion's expected
  string is allowed — say so in TOOLING NOTES; anything beyond that is out
  of bounds).
- Do NOT change field names or the component contract in
  `lib/demo-videos.ts`; copy values only.

# Effort budget
45 minutes wall clock.

# Acceptance criteria
- [ ] `lib/demo-videos.ts` on merged main has rewritten copy for all five
  tools whose claims are traceable to the drill source files (validator:
  reads the copy, reads one source file per tool, checks each claim).
- [ ] No copied claim references a UI term that does not exist in that
  tool's rendered UI strings (validator greps the term against the
  component).
- [ ] Headline/body/CTA length bounds respected (body <= 2 sentences).
- [ ] `npm run lint` exits 0; `npm run test:unit:run` passes; `npm run build`
  exits 0 (validator re-runs on merged main).
- [ ] Commit carries provenance trailers and touches only `lib/demo-videos.ts`
  (plus contract files + any exact-string test assertion update declared in
  TOOLING NOTES).
- [ ] `git status --porcelain` on main shows nothing NEW beyond baseline.

# Constraints
- No hype, no superlatives, no invented features.
- Keep the inviting tone — accuracy is the constraint, not the voice.
- If the gate fails after 3 attempts, stop with STATUS: blocked and evidence.

# Completion contract
Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
RESEARCH NOTES: ... (per tool: files read + the actual loop found)
FILES CHANGED: ...
VERIFICATION: ...
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
