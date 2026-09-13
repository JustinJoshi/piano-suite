# Task
Re-cut `demo-arpeggios.mp4` without its closing CTA line. User feedback: the
line about everything being free ("All of this is completely free...") and
everything that follows it is NOT wanted — EXCEPT the end card, which stays.
No re-capture: the footage clips in `~/piano-content/public/footage-arpeggios/`
already cover every remaining beat.

# Context
The run 'demo-videos' produced demo-arpeggios.mp4 (1440x900 h264 48.042667s,
md5 a58ce0956fba88f28a6b992ba0e11b4b, 10 segments / 9 beat clips, scene->beat
order [1,1,2,2,3,4,4], commit c5d4050). Its beat table: seg10 (39.82-45.50s)
was the free-CTA beat; the end card (45.5-48.0) reads "Piano Suite / Free
practice tools for self-taught pianists". You remove the final SCRIPT line
and its scenes mapping so captions end after the tracking beat (seg9, gist
"Every transition logged; watch jumps get quicker"), the video shortens, and
the composition's end card still closes it.

# Relevant files
- `/home/justin/.agents/skills/piano-demo-video/SKILL.md` — pipeline rules:
  numeric-only verification (ffmpeg signalstats / PSNR / tesseract OCR; NEVER
  read images), hard rules 1-5.
- `/home/justin/piano-content/script-arpeggios.txt` — 10 lines; DELETE the
  last line (the free/CTA one). Do not reword other lines.
- `/home/justin/piano-content/scenes-arpeggios.json` — remove the matches
  that map the deleted line (keep all other mappings untouched).
- `/home/justin/piano-content/scripts/tts.mjs` — regenerates
  `src/config.generated.ts` from script + scenes.
- `/home/justin/piano-content/src/PianoVideo.tsx` — the end card is part of
  the composition; do not edit it.
- `/home/justin/piano-content/public/footage-arpeggios/` — existing beat
  clips; reuse, do not re-cut.
- `/home/justin/piano-suite/.paseo-delegate/demo-videos/summaries/video-arpeggios.json`
  — prior phase's beat table + config md5 lineage for reference.

# Output format
- New render at `/home/justin/piano-content/out/demo-arpeggios.mp4`, copied to
  `/home/justin/piano-content/dist/demo-arpeggios.mp4` and
  `/home/justin/piano-suite/public/demo-arpeggios.mp4` (identical md5).
- Updated script-arpeggios.txt + scenes-arpeggios.json (9 lines now).
- A short beat table in your summary (remaining 9 segments) + config md5.
- One piano-suite commit touching ONLY `public/demo-arpeggios.mp4` (and any
  contract file you write under `.paseo-delegate/demo-videos/`), with
  provenance trailers: Phase: arpeggios-recut; Agent-Id: `echo $PASEO_AGENT_ID`;
  Session-Id from `~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json`.
  Push to origin main.

# Tool and source guidance
- Slot protocol (binding): snapshot `src/config.generated.ts` to
  `/tmp/opencode/cfg-slot-pre-recut-arpeggios.ts` with md5 BEFORE regenerating;
  regenerate immediately before render with
  `cd /home/justin/piano-content && node scripts/tts.mjs script-arpeggios.txt --scenes scenes-arpeggios.json --web --tts-speed 0.9`
  (Kokoro af_heart); count sceneSegments and assert BOTH zero scene:null
  captions AND last-segment-end == last-caption-end (tts.mjs drops one scene
  per unmatched line silently); snapshot post-regen md5; re-verify md5
  immediately before render; render with
  `npx remotion render PianoVideo out/demo-arpeggios.mp4 --concurrency=2`.
- QA (all numeric; NEVER read images): ffprobe (h264 1440x900; duration
  should be ~ last remaining caption end + ~2.5s end card — compute and state
  it); OCR at every remaining segment midpoint (+0.5s sample, segment-local
  time: every segment re-mounts its clip at frame 0 — keep OCR sample times
  within take/clip duration) verifying UI text AND caption; YDIF freeze
  check per segment; verify the FINAL seconds contain the end card text
  ("Piano Suite", "self-taught pianists") via OCR; verify NO "free"-CTA
  caption appears anywhere in the render (sweep the closing span).
- Publish: identical md5 across out/dist/public; `curl -o /dev/null -w "%{http_code}"`
  the Tailscale URL `https://thinkpad.tail4f5d20.ts.net:8454/demo-arpeggios.mp4`
  (expect 200).
- Piano-suite tree must stay clean: baseline dirt is exactly
  `docs/quick-fixes-2026-09/` and `public/demo-web.mp4` (untracked, leave
  them). Nothing NEW. Scope commits: `git add` explicit paths only, never
  `git add -A`. Retry on git index.lock; never `rm -rf .git`.

# Task boundaries
- Do NOT touch: any other demo-* video or its script/scenes/footage,
  `demo-web2.mp4`, capture scripts, any file under `/home/justin/piano-suite/app`
  /`components`/`lib`, the theme registry, package.json.
- Do NOT re-capture footage; do NOT re-cut beat clips.
- Do NOT edit `PianoVideo.tsx` — the end card already exists in the
  composition and must keep working unchanged.

# Effort budget
45 minutes wall clock. This is a trim + re-render, not a re-production.

# Acceptance criteria
- [ ] `script-arpeggios.txt` has 9 lines and contains no "free"/CTA closing
  line (validator: reads the file).
- [ ] `scenes-arpeggios.json` maps all 9 remaining lines; regenerated
  `config.generated.ts` has 0 scene:null captions and its last segment end
  equals the last caption end (delta 0.000000).
- [ ] `ffprobe` on the new render: h264, 1440x900, duration in
  [40s, 45s] (old 48.04s shortened by the removed CTA span; end card kept).
- [ ] OCR sweep over the closing span: zero occurrences of the free/CTA
  caption text anywhere in the new render; end card text present in the
  final seconds.
- [ ] Per-segment midpoint OCR (9 segments, segment-local) + YDIF: every
  remaining segment shows expected UI + caption, no frozen beats.
- [ ] md5 of the render identical across out/, dist/, and
  `/home/justin/piano-suite/public/demo-arpeggios.mp4`.
- [ ] Tailscale URL returns 200.
- [ ] Piano-suite tree: nothing NEW dirty beyond baseline; commit carries the
  provenance trailers; pushed.

# Constraints
- Numeric verification only — reading screenshots/video frames as images is
  forbidden and invalidates the work.
- The user still wants the END CARD — do not remove it, do not edit the
  composition.
- If any check fails after 3 attempts, stop with STATUS: blocked and full
  numeric evidence.

# Completion contract
Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ... (commands + numeric outputs incl. config md5s, coverage
numbers, fit arithmetic, the free-caption sweep result, end-card OCR, md5s)
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
