# Task
Warm up the five first-visit intro copies in `lib/demo-videos.ts`
(`introHeadline` / `introBody` / `introCta` per tool). Same facts, warmer
voice. User feedback: "a little warmer and friendlier."

# Context
The current copy (commit `fe6378e`) was rewritten from the drill sources and
is mechanically accurate — that accuracy is now a HARD CONSTRAINT you must
not regress. This phase is tone only. Piano Suite is a free learning
community for self-taught pianists; the overlay greets someone at their
first visit to a tool page. Warm means: talk to one person, welcome them
like a friendly teacher would, make the first move feel small and
doable. Friendly does NOT mean hype.

# What "warmer and friendlier" means here (voice guide)
- Speak to "you"; invite rather than instruct where the facts allow.
- Acknowledge the reader gently — e.g. nodding to nerves/being new is fine;
  pity is not.
- Prefer everyday words over product words; keep the UI terms that ARE the
  mechanics (Start Drill, Reps per round, Start Loop, miss filter, Root
  Pool) but wrap them in human sentences.
- A small concrete image or reassurance is welcome if it stays true.
- Banned: superlatives ("the best", "perfect"), exclamation stacking (one
  "!"/em-dash warmth is plenty), marketing speak, "unleash", "journey",
  "unlock", "effortlessly", false gear-free claims.
- Keep every claim traceable to the source files listed in
  `.paseo-delegate/demo-videos/briefs/intro-copy-research.md` (read its
  RESEARCH NOTES and the verdict at `.paseo-delegate/demo-videos/verdicts/intro-copy-research.json`
  for the verified loop per tool). Verified facts you must keep:
  all four drills require a connected MIDI keyboard to start (Start is
  disabled until connected — never claim otherwise); chord drill grades
  rounds automatically from first-chord time and sends to Anki; arpeggios
  is LH pedal then RH sequence with laps/misses and a miss filter; root
  cycling calls one quality at a random root each rep with a Root Pool;
  progression loops ii-V-I / 12-bar blues with per-chord transition timing
  and Personal bests; the Workshop is a 20-block draggable grid with a
  starter picker and marketplace forking.

# Relevant files
- `/home/justin/piano-suite/lib/demo-videos.ts` — the only file you edit
  (copy values; fields/contract untouched).
- `/home/justin/piano-suite/components/drills/tool-demo-video.tsx` — read
  only, to see how the copy renders (headline/body/CTA sizes).
- `/home/justin/piano-suite/.paseo-delegate/demo-videos/briefs/intro-copy-research.md`
  and `verdicts/intro-copy-research.json` — the verified mechanics per tool.
- Drill sources for spot-checking claims:
  `components/drills/chord-drill/chord-drill.tsx`, `components/drills/arpeggios/arpeggios.tsx`,
  `components/drills/root-cycling/root-cycling.tsx`, `components/drills/progression/progression.tsx`,
  `app/tools/workshop/page.tsx`, `components/custom-practice/starter-picker.tsx`.

# Output format
- Rewritten `introHeadline` (<= ~60 chars), `introBody` (1-2 short
  sentences), `introCta` (2-4 words) for all five tools. Same fields, same
  shape, nothing else in the file.

# Tool and source guidance
- Worktree per AGENTS.md from `/home/justin/piano-suite`:
  `git worktree add .worktrees/intro-copy-warmth -b demo/intro-copy-warmth`,
  symlink `.env.local`, work only there, gate, merge into `main` from the
  main checkout, remove the worktree. Agent-Id: `echo $PASEO_AGENT_ID`;
  Session-Id: `runtimeInfo.sessionId` in
  `~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json`.
- If the worktree's node_modules symlink breaks the Turbopack build
  (known issue), use a `cp -al` hardlink copy like the previous phase did.
- Gate: `npm run lint` (0 errors), `npm run test:unit:run`, `npm run build`.
- Commit scoped paths (`lib/demo-videos.ts` + contract files), provenance
  trailers (Phase: intro-copy-warmth; Agent-Id; Session-Id; Brief:
  `.paseo-delegate/demo-videos/briefs/intro-copy-warmth.md`; Verdict:
  `.paseo-delegate/demo-videos/verdicts/intro-copy-warmth.json`), push to
  origin main. Baseline dirt: `docs/quick-fixes-2026-09/`,
  `public/demo-web.mp4`.

# Task boundaries
- Copy values in `lib/demo-videos.ts` ONLY. Do not touch any component,
  page, test (tests check non-empty, not strings), capture script, or the
  welcome page.
- Do not change field names or the component contract.

# Effort budget
30 minutes wall clock.

# Acceptance criteria
- [ ] All five tools' copy rewritten on merged main; every factual claim
  still traceable to the verified mechanics above (validator: reads the
  copy against the research notes and spot-greps UI terms).
- [ ] No banned constructions: no superlatives, no "without gear"-style
  claims, no hype verbs (validator greps for "best", "perfect",
  "without a MIDI", "no gear", "unleash", "journey" in the copy).
- [ ] Length bounds respected (headline <= ~60 chars, body <= 2 sentences,
  CTA 2-4 words).
- [ ] `npm run lint` exits 0; `npm run test:unit:run` passes; `npm run build`
  exits 0 (validator re-runs on merged main).
- [ ] Commit carries provenance trailers and touches only `lib/demo-videos.ts`
  (+ contract files).
- [ ] `git status --porcelain` on main shows nothing NEW beyond baseline.

# Constraints
- Accuracy is the constraint, warmth is the goal — never regress the
  fe6378e corrections (especially the MIDI-gate fact).
- If the gate fails after 3 attempts, stop with STATUS: blocked and evidence.

# Completion contract
Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ...
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
