# Task
Re-capture and re-cut `demo-chord-drill.mp4` so the drill page is recorded
SCROLLED ALL THE WAY UP at the start, and only scrolls down when the
narration explicitly talks about the settings below the fold. User feedback:
the current video opens scrolled down too far; that is wrong. Narration
(script) is UNCHANGED — only footage, re-cut, render, QA, publish.

# Context
demo-chord-drill.mp4 (31.67s, 1440x900 h264, md5 27f960e9046cadbcc195cb533f1e562f
in out/dist/public, commit 82f7899) opens on footage where the Chord Drill
page is scrolled down too far — the user wants the page top (header, MIDI
connect bar, drill prompt area) on screen at the start. The scroll rule for
every shot: scrolled to top by default; scroll down ONLY while the beat's
narrated idea is about the settings that live below the fold; scroll back up
after. Pipeline and hard rules: `/home/justin/.agents/skills/piano-demo-video/SKILL.md`.

# Relevant files
- `/home/justin/piano-suite/.paseo-delegate/capture-chord-drill.mjs` — your
  capture script; EDIT it (add scroll discipline), do not write a new file.
- `/home/justin/piano-content/script-chord-drill.txt` + `scenes-chord-drill.json`
  — narration unchanged; read to decide which beats talk about settings below.
- `/home/justin/piano-suite/app/tools/chord-drill/page.tsx` and
  `/home/justin/piano-suite/components/drills/chord-drill/` — page layout at
  1440x900: what is above/below the fold (drill card/prompt/timer vs settings
  card). Read first.
- `/home/justin/piano-suite/components/drills/midi-connection-bar.tsx` (or the
  actual MidiConnectionBar location) — the top-of-page indicator for early
  beats.
- `/home/justin/piano-content/public/footage-chord-drill/` — existing beats
  and raw takes (beat1.mp4..beat4.mp4 + takes).
- `/home/justin/piano-content/src/config.generated.ts` — shared slot;
  rendered-against md5 was cb526971f84f70e65ad00c948bf134ec.
- `/home/justin/piano-suite/.paseo-delegate/demo-videos/summaries/video-chord-drill.json`
  — the original beat table for reference.

# Output format
- New render `/home/justin/piano-content/out/demo-chord-drill.mp4` copied to
  `/home/justin/piano-content/dist/demo-chord-drill.mp4` and
  `/home/justin/piano-suite/public/demo-chord-drill.mp4` (identical md5).
- Re-shot takes + re-cut beat clips under `footage-chord-drill/` (only the
  beats whose scroll state was wrong; keep good beats as-is).
- Updated `capture-chord-drill.mjs` with scroll discipline, committed.
- A beat table in your summary stating, per segment: scroll position at clip
  start (top / settings-in-view) and WHY (narration covers settings or not).

# Tool and source guidance
- Re-capture only what the scroll rule affects. Shot plan: for each beat,
  decide from the script whether the narrated idea touches settings; if not,
  capture scrolled to top. Scroll with
  `page.evaluate(() => window.scrollTo(0, 0))` at shot start; scroll down
  only inside a settings beat, then back up before the next shot. Keep MOCK_MIDI,
  clerk setup, onboarding flag, one-context rules from the existing script.
- Numeric verification only; NEVER read images. OCR with
  `TESSDATA_PREFIX=/home/justin/.var/app/com.github.dynobo.normcap/config/normcap/tessdata`,
  frames to `/tmp/opencode/*.png`, psm 11 + band crops. Screencast playback
  lags wall-clock UI events ~1.5-2.5s — cut state windows by OCR, not script
  timings (prior-phase lesson). Keep OCR sample times within take duration
  (ffmpeg -ss past EOF repeats the last frame).
- Slot protocol (binding): snapshot config md5 BEFORE (expect
  cb526971f84f70e65ad00c948bf134ec or the current slot state — record what
  you find); script/scenes UNCHANGED so you do NOT need to regenerate config
  unless a re-cut changes a beat clip's length below a segment's span — if
  you must re-cut, verify every segment still fits its clip with >= 0.5s
  headroom (chord-drill beat1's original margin was 7ms — leave real
  headroom this time) and only then re-render against the UNCHANGED config
  md5 cb526971f84f70e65ad00c948bf134ec. If you must regenerate, snapshot
  before/after to /tmp/opencode/ and record md5s.
- Render `npx remotion render PianoVideo out/demo-chord-drill.mp4
  --concurrency=2`. QA: ffprobe (h264 1440x900; duration should match the
  previous 31.667s total — narration unchanged); per-segment OCR at segment
  start +0.5s AND midpoint (segment-local time: every segment re-mounts its
  clip at frame 0); YDIF freeze check; end card OCR in the final seconds.
- Publish: identical md5 across out/dist/public; Tailscale URL
  `https://thinkpad.tail4f5d20.ts.net:8454/demo-chord-drill.mp4` -> 200.
- Own dev server port >=3002 (`:3000` is the opencode proxy; `:3001` may be
  dead), port-scoped cleanup (`fuser -k <port>/tcp`), `BASE_URL` env pattern
  with `set -a && . ./.env.local && set +a`.
- Commits: scoped paths only (`public/demo-chord-drill.mp4`,
  `.paseo-delegate/capture-chord-drill.mjs`, contract files), trailers
  (Phase: chorddrill-scroll-recut; Agent-Id: `echo $PASEO_AGENT_ID`;
  Session-Id from
  `~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json`), push to
  origin main. Tree baseline dirt: `docs/quick-fixes-2026-09/`,
  `public/demo-web.mp4`, `?? .paseo-delegate/demo-videos/briefs/*` contract
  files — commit the brief with your phase commit; nothing else NEW.

# Task boundaries
- Do NOT touch narration: `script-chord-drill.txt` must remain byte-identical;
  `scenes-chord-drill.json` unchanged unless a fit re-check forces a clip
  re-length (then adjust only durations, not mappings).
- Do NOT touch any other demo-* video, its files, or footage.
- Do NOT edit app source (`app/`, `components/`, `lib/`).
- Do NOT edit `PianoVideo.tsx` or the end card.

# Effort budget
90 minutes wall clock (re-capture + re-cut + render + QA + publish).

# Acceptance criteria
- [ ] Segment-start OCR (+0.5s, segment-local) of every early drill-page
  segment shows the TOP of the drill page (header "Chord Drill" and/or the
  MIDI connect bar in the top band) and does NOT show a below-fold settings
  card dominating the frame, EXCEPT segments whose narration covers settings
  (state which ones and why, per the script text).
- [ ] Every segment's midpoint OCR shows expected UI text AND caption
  (unchanged narration).
- [ ] `ffprobe`: h264, 1440x900, duration within 0.5s of 31.667s.
- [ ] Segment fit: every segment span <= its clip duration with recorded
  headroom.
- [ ] Config md5 unchanged from cb526971f84f70e65ad00c948bf134ec (or, if a
  regen was forced, before/after snapshots + md5s recorded and fit re-proven).
- [ ] YDIF freeze check per segment; end card text OCR in final seconds.
- [ ] md5 of the render identical across out/, dist/, and
  `/home/justin/piano-suite/public/demo-chord-drill.mp4`.
- [ ] Tailscale URL returns 200.
- [ ] Piano-suite tree: nothing NEW dirty beyond baseline; commit carries the
  provenance trailers; pushed.

# Constraints
- Numeric verification only — reading screenshots/video frames as images is
  forbidden and invalidates the work.
- The scroll rule is the core of this phase: default = top; settings scroll
  only when the narration talks about settings below; scroll back up after.
- If any check fails after 3 attempts, stop with STATUS: blocked and full
  numeric evidence.

# Completion contract
Your final chat message must be your completion summary:
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ... (commands + numeric outputs: scroll-state OCR per segment
start, midpoints, ffprobe, fit, config md5s, render md5s, sweep results)
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
