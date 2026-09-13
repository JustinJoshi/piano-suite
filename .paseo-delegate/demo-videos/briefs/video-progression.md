cd /home/justin/piano-suite. You are executing phase video-progression of the demo-videos delegation (paseo run). Zero context assumed. Numeric-only video verification per /home/justin/.agents/skills/piano-demo-video/SKILL.md and the binding Chain handoff below; NEVER read images — doing so invalidates the phase.

# Task
Produce demo-progression.mp4 — a ~40-70s landscape (1440x900) Remotion demo video of the ready-made **Progression** drill (/tools/progression) — end-to-end through the established pipeline, then publish it to both distribution spots. Same shape as demo-chord-drill / demo-arpeggios / demo-root-cycling, tool=progression. This is the LAST drill demo phase.

# Context
Piano Suite's landing page embeds the product demo (demo-web2.mp4) and each ready-made drill gets a sibling demo video; chord-drill (82f7899), arpeggios (c5d4050) and root-cycling (0ae2c2f + fix-ups be1f727/1680ac9) already shipped. This phase makes the fourth, for Progression: a chord-progression drill (progression types incl. ii-V-I and 12-bar blues per /home/justin/piano-suite/lib/progression.ts) that walks a fixed progression across keys, with a current-chord prompt, scale line, and step strip. Anki is NOT running and Progression has no Anki integration; do not build beats that require it.

# Relevant files
- /home/justin/.agents/skills/piano-demo-video/SKILL.md — the pipeline contract. Your primary reference.
- /home/justin/piano-suite/.paseo-delegate/capture-root-cycling.mjs — freshest reference capture script (Clerk setup, MOCK_MIDI injection, onboarding flag, 14s settle, port-scoped cleanup). Model capture-progression.mjs on it; do not modify it or any prior capture script.
- /home/justin/piano-suite/app/tools/progression/page.tsx and /home/justin/piano-suite/components/drills/progression/progression.tsx — the tool you are filming. Read them first. Key testids: progression-drill, progression-type-<type>, progression-key-<name>, progression-current-chord, progression-scale-line, progression-step-strip, start-drill-btn, stop-drill-btn, reset-stats-btn. /home/justin/piano-suite/lib/progression.ts — PROGRESSION_TYPES/PROGRESSION_KEYS.
- IMPORTANT: Progression has NO Tracking panel/tab (components/tracking/ has only chord-drill, arpeggio, root-cycling and workshop panels) — do NOT build beats around a tracking page. Its history/stats surface on the drill card itself (progression log key: piano-suite-progression-log-v1, shape per lib/local-practice-history.ts LocalProgressionEvent). If a beat shows stats, seed ONLY piano-suite-progression-log-v1 with plausible multi-day data (grades Again|Hard|Good|Easy) before the live run.
- /home/justin/piano-content/src/PianoVideo.tsx — composition; /home/justin/piano-content/src/config.generated.ts — generated shared slot (see Chain handoff).
- /home/justin/piano-suite/.paseo-delegate/demo-videos/plan.json — this phase's acceptance criteria.

# Output format
- /home/justin/piano-content/out/demo-progression.mp4 (the render), copied to /home/justin/piano-content/dist/demo-progression.mp4 and /home/justin/piano-suite/public/demo-progression.mp4.
- /home/justin/piano-suite/.paseo-delegate/capture-progression.mjs — your capture script, committed to the piano-suite repo.
- /home/justin/piano-content/script-progression.txt + scenes-progression.json — your script (one idea per beat) and beat mapping (new files; never clobber prior phases' files).
- /home/justin/piano-suite/.paseo-delegate/demo-videos/summaries/video-progression.json — completion summary matching /home/justin/piano-suite/.paseo-delegate/demo-videos/schemas/worker-summary.json; embed the full beat table (time window, spoken gist, on-screen action, expected OCR per beat, clip host per line) plus the rendered-against config md5 in `verification`, and keep `summary` current (not stale).
- All verification numeric: ffmpeg signalstats (YAVG/SATAVG/YDIF) on downscaled/cropped regions, PSNR vs reference PNGs, tesseract OCR (`export TESSDATA_PREFIX=$(dirname $(find / -name eng.traineddata 2>/dev/null | head -1))`, frames to /tmp/opencode/*.png). NEVER read images.

# Chain handoff (binding, from the video-root-cycling verdict)
- **config.generated.ts is an adversarial shared slot**: snapshot to /tmp/opencode/ with md5 before regeneration; regenerate from your own script/scenes IMMEDIATELY before render (`node scripts/tts.mjs script-progression.txt --scenes scenes-progression.json --web --tts-speed 0.9`, Kokoro af_heart); snapshot after; count sceneSegments after every regen; assert ZERO captions with "scene": null AND last sceneSegment end == last caption end (no coverage gaps) BEFORE rendering — a failed scenes match silently truncates segments and leaves a black-screen caption span; re-verify md5 right before `npx remotion render PianoVideo out/demo-progression.mp4 --concurrency=2`; record the rendered-against md5 in the summary.
- **>= 2s fit headroom per beat**; re-cut any beat shorter than its segment total plus headroom.
- **Every segment re-mounts its clip at frame 0**: cut beats so the clip's FIRST 2-3 seconds show the expected state, and QA each segment with multi-sample OCR at segment-local +0.5/+1.5/+2.5s minimum — midpoint-only QA has already let a wrong-state head ship twice on this pipeline. Trim capture takes to start ON the expected state; the tracking/panel pages transition through wrong states for ~2.2s, so use footage from after the state settles (14s settle pattern in capture-root-cycling.mjs).
- **YAVG cannot discriminate defects on this dark UI** (good spans 15-20, black defect 12-14) — OCR content decides, luminance only corroborates.
- **tesseract psm 11 + band crops** (no tsv/hocr configs).
- **Environment**: :3001 dead, :3000 is the opencode proxy — start your own dev server on port >= 3002 (BASE_URL=http://localhost:3002, `set -a && . ./.env.local && set +a` from /home/justin/piano-suite); expect cold-compile dead time; port-scoped kill only in cleanup; one browser context per capture run; MOCK_MIDI injected; local Convex (:3210) dead — settings live in Convex cloud (intent-snail-943), configure through UI testids, never seed settings.
- **Publish both spots with identical md5** across out/dist/public.

# Task boundaries
- Do NOT modify any app source under /home/justin/piano-suite/app, components/, lib/ (capture script and contract files are your only piano-suite writes besides the published mp4).
- Do NOT touch prior capture scripts; do not overwrite any prior variant's files (script-web*, scenes-web*, scenes-vert*, script.txt, scenes.json, *-chord-drill*, *-arpeggios*, *-root-cycling*, demo-web2*/demo-chord-drill*/demo-arpeggios*/demo-root-cycling* in out/dist/public, /tmp/opencode/cfg-vert-backup.ts).
- Do NOT reconfigure tailscale serve, the Convex backend, or anyone else's dev servers.

# Effort budget
2 hours wall clock. Expect 5-10 beats. If capture or render proves impossible in that budget, stop with STATUS: blocked, what you tried, and numeric evidence.

# Acceptance criteria
- [ ] ffprobe /home/justin/piano-content/out/demo-progression.mp4 reports h264, 1440x900, duration >= 24s — validator re-runs it.
- [ ] dist/ and public/ copies exist and match the render (validator compares md5).
- [ ] capture-progression.mjs exists and is committed with provenance trailers (Phase: video-progression; Agent-Id: $PASEO_AGENT_ID; Session-Id from ~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json) — validator checks git log --format=full.
- [ ] script-progression.txt + scenes-progression.json exist; script one idea per beat; prior phases' files unchanged.
- [ ] summaries/video-progression.json matches schemas/worker-summary.json, carries the full beat table + rendered-against config md5; for every segment the validator independently OCRs the segment midpoint AND one early segment-local sample (>= +0.5s) and finds the expected on-screen UI text AND caption.
- [ ] No frozen beats: validator runs signalstats YDIF per segment window.
- [ ] config.generated.ts: zero scene:null captions, sceneSegments cover 0 through last caption end with no gaps, and every segment fits its clip with >= 2s headroom — validator re-derives from config + clip ffprobe durations using the recorded config md5 and the slot snapshots.
- [ ] Piano-suite tree: nothing NEW dirty beyond docs/quick-fixes-2026-09/, public/demo-web.mp4, and .paseo-delegate relay files (everything else tracked — commit your own additions: capture script, public/demo-progression.mp4, summaries/video-progression.json).

# Constraints
- The demo copy speaks to self-taught beginners; plain, welcoming, no hype.
- Distinct first line: never re-render or modify the shipped demo-web2/demo-chord-drill/demo-arpeggios/demo-root-cycling cuts.
- Write incrementally. Do not pre-plan the whole artefact.

# Completion contract
Your final chat message: STATUS: complete|blocked|failed; SUMMARY; FILES CHANGED; VERIFICATION (ffmpeg/OCR/ffprobe outputs, full beat table, config md5); BLOCKERS; TOOLING NOTES (defects/surprises in tools — `none` if none); HANDOFF NOTES.