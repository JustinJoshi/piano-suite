cd /home/justin/piano-suite. You are executing phase video-workshop, the FINAL phase of the demo-videos delegation (paseo run). Zero context assumed. Numeric-only video verification per /home/justin/.agents/skills/piano-demo-video/SKILL.md and the binding Chain handoff below; NEVER read images — doing so invalidates the phase.

# Task
Produce demo-workshop.mp4 — a ~40-70s landscape (1440x900) Remotion demo video of the **Workshop** (/tools/workshop) — end-to-end through the established pipeline, then publish it to both distribution spots. Same shape as demo-chord-drill / demo-arpeggios / demo-root-cycling / demo-progression, subject=the Workshop itself (build a practice page from blocks, then play it). This closes the run: every ready-made drill plus the Workshop will then have its own demo video.

# Context
Piano Suite's landing page embeds the product demo (demo-web2.mp4) and each ready-made drill got a sibling demo video (chord-drill 82f7899, arpeggios c5d4050, root-cycling 0ae2c2f/be1f727/1680ac9, progression 2787dce/22edf3f). The Workshop is the app's core: a grid editor where practice pages are assembled from feature blocks (drill timer, metronome, chord set, keyboard display, session stats, target blocks) and then played with the drill runtime. The Workshop, its block library, and /marketplace are PUBLIC routes (no sign-in needed) — capture is simpler than the drill phases. Anki is NOT running; do not build beats that require it.

# Relevant files
- /home/justin/.agents/skills/piano-demo-video/SKILL.md — the pipeline contract. Your primary reference.
- /home/justin/piano-suite/.paseo-delegate/capture-progression.mjs — freshest reference capture script (Clerk setup, MOCK_MIDI injection, onboarding flag, port-scoped cleanup). Model capture-workshop.mjs on it; do not modify any prior capture script.
- /home/justin/piano-suite/app/tools/workshop/page.tsx, /home/justin/piano-suite/app/tools/workshop/blocks/page.tsx and /home/justin/piano-suite/app/marketplace — the pages you are filming.
- /home/justin/piano-suite/components/custom-practice/practice-page-editor.tsx (workshop-signin-hint testid), components/workshop-grid/workshop-grid.tsx (workshop-grid, grid-guide), components/workshop-grid/workshop-tile.tsx (tile-settings, resize-handle), components/custom-practice/pages-menu.tsx, components/feature-blocks/* (metronome-block: pulse-dot/bpm-display/bpm-slider/metronome-btn; drill-shortcuts-block; drill timer), /marketplace fork flow (components/workshop-marketplace/), lib/marketplace-seeds.ts (featured pages that ship so /marketplace is never empty).
- /home/justin/piano-suite/lib/local-practice-history.ts — workshop tracking keys: piano-suite-workshop-log-v1 (+ piano-suite-workshop-miss-log-v1). Seed ONLY these if a beat shows stats/history.
- /home/justin/piano-content/src/PianoVideo.tsx — composition; /home/justin/piano-content/src/config.generated.ts — shared slot (Chain handoff).
- /home/justin/piano-suite/.paseo-delegate/demo-videos/plan.json — this phase's acceptance criteria.

# Output format
- /home/justin/piano-content/out/demo-workshop.mp4 (the render), copied to /home/justin/piano-content/dist/demo-workshop.mp4 and /home/justin/piano-suite/public/demo-workshop.mp4.
- /home/justin/piano-suite/.paseo-delegate/capture-workshop.mjs — your capture script, committed to the piano-suite repo.
- /home/justin/piano-content/script-workshop.txt + scenes-workshop2.json (NOTE: name the scenes file scenes-workshop2.json — scenes-web3.json etc. already exist; never clobber any prior file).
- /home/justin/piano-suite/.paseo-delegate/demo-videos/summaries/video-workshop.json — completion summary matching schemas/worker-summary.json; embed the full beat table (time window, spoken gist, on-screen action, expected OCR per beat, clip host per line) plus the rendered-against config md5 in `verification`.
- All verification numeric: ffmpeg signalstats, PSNR vs reference PNGs, tesseract OCR (`export TESSDATA_PREFIX=$(dirname $(find / -name eng.traineddata 2>/dev/null | head -1))`, frames to /tmp/opencode/*.png). NEVER read images.

# Chain handoff (binding, from the video-progression verdict)
- **config.generated.ts adversarial shared slot**: snapshot to /tmp/opencode/ with md5 before regeneration; regenerate IMMEDIATELY before render (`node scripts/tts.mjs script-workshop.txt --scenes scenes-workshop2.json --web --tts-speed 0.9`, Kokoro af_heart); snapshot after; count sceneSegments after every regen; assert BOTH zero scene:null captions AND last-segment-end >= last-caption-end (tts.mjs drops one scene per unmatched line silently); re-verify md5 pre-render; record the rendered-against md5 in the summary.
- **>= 2s fit headroom per beat**; re-cut short beats.
- **Every segment re-mounts its clip at frame 0**: cut beats so the clip's FIRST 2-3 seconds show the expected state; QA each segment with multi-sample OCR (segment-local +0.5/+1.5/+2.5s minimum), not just midpoints; trim capture takes to start ON the expected state (pages transition through wrong states for ~2s).
- **Screencast playback lags wall-clock events ~1.5-2.5s** — cut state windows by OCR, not script timings; keep OCR sample times within take duration (-ss past EOF repeats the last frame).
- **YAVG cannot discriminate defects on this dark UI** — OCR content decides.
- **tesseract psm 11 + band crops**; **--concurrency=2**; **publish with identical md5** across out/dist/public.
- **Environment**: :3001 dead, :3000 is the opencode proxy — own dev server on port >= 3002 (BASE_URL=http://localhost:3002, `set -a && . ./.env.local && set +a` from /home/justin/piano-suite); port-scoped kill only; one browser context per capture run; MOCK_MIDI injected (Workshop drill blocks read MIDI the same way); local Convex (:3210) dead — settings/history via Convex cloud (intent-snail-943) or seeded localStorage keys only.

# Task boundaries
- Do NOT modify any app source under /home/justin/piano-suite/app, components/, lib/ (capture script and contract files are your only piano-suite writes besides the published mp4).
- Do NOT touch prior capture scripts or any prior variant's files (script-web*, scenes-web*, scenes-vert*, script.txt, scenes.json, *-chord-drill*, *-arpeggios*, *-root-cycling*, *-progression*, demo-web2*/demo-chord-drill*/demo-arpeggios*/demo-root-cycling*/demo-progression* in out/dist/public, /tmp/opencode/cfg-vert-backup.ts).
- Do NOT reconfigure tailscale serve, the Convex backend, or anyone else's dev servers.

# Effort budget
2 hours wall clock. Expect 5-10 beats. If capture or render proves impossible in that budget, stop with STATUS: blocked, what you tried, and numeric evidence.

# Acceptance criteria
- [ ] ffprobe /home/justin/piano-content/out/demo-workshop.mp4 reports h264, 1440x900, duration >= 24s — validator re-runs it.
- [ ] dist/ and public/ copies exist and match the render (validator compares md5).
- [ ] capture-workshop.mjs exists and is committed with provenance trailers (Phase: video-workshop; Agent-Id: $PASEO_AGENT_ID; Session-Id from ~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json) — validator checks git log --format=full.
- [ ] script-workshop.txt + scenes-workshop2.json exist; script one idea per beat; prior phases' files unchanged.
- [ ] summaries/video-workshop.json matches schemas/worker-summary.json, carries the full beat table + rendered-against config md5; for every segment the validator independently OCRs the segment midpoint AND one early segment-local sample (>= +0.5s) and finds the expected on-screen UI text AND caption.
- [ ] No frozen beats: validator runs signalstats YDIF per segment window.
- [ ] config.generated.ts: zero scene:null captions, sceneSegments cover 0 through max(last caption end, last segment end) with no uncovered caption span, and every segment fits its clip with >= 2s headroom — validator re-derives from config + clip ffprobe durations using the recorded config md5 and slot snapshots.
- [ ] Piano-suite tree: nothing NEW dirty beyond docs/quick-fixes-2026-09/, public/demo-web.mp4, and .paseo-delegate relay files (everything else tracked — commit your own additions: capture script, public/demo-workshop.mp4, summaries/video-workshop.json).

# Constraints
- The demo copy speaks to self-taught beginners; plain, welcoming, no hype.
- Distinct first line: never re-render or modify any shipped cut.
- Write incrementally. Do not pre-plan the whole artefact.

# Completion contract
Your final chat message: STATUS: complete|blocked|failed; SUMMARY; FILES CHANGED; VERIFICATION (ffmpeg/OCR/ffprobe outputs, full beat table, config md5); BLOCKERS; TOOLING NOTES (defects/surprises in tools — `none` if none); HANDOFF NOTES.