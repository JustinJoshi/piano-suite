# Fix-up 1 (validator FAIL) — video-chord-drill

cd /home/justin/piano-content. Fix phase video-chord-drill of the demo-videos delegation (paseo run). Zero context assumed; piano-content is NOT a git repo — files only, no commits. Numeric verification only (ffmpeg signalstats/ffprobe/tesseract OCR); NEVER read images — doing so invalidates the work.

# Task
Restore a verifiable segment config for the already-delivered chord-drill render and re-derive its beat fit. The delivered render /home/justin/piano-content/out/demo-chord-drill.mp4 (h264 1440x900 31.67s, md5 27f960e9046cadbcc195cb533f1e562f) is validated and must NOT be re-rendered. But the config it was bundled from is gone: src/config.generated.ts was overwritten at 2026-09-13 05:13:25 by a concurrent vertical-cut process and now holds the vertical config (byte-identical to /tmp/opencode/cfg-vert-backup.ts). Regenerate the chord-drill config, re-derive segment fit against the beat table, and leave the chord-drill config as the standing slot state.

# Relevant files
- /home/justin/piano-content/scripts/tts.mjs — generates src/config.generated.ts from script + scenes.
- /home/justin/piano-content/script-chord-drill.txt, /home/justin/piano-content/scenes-chord-drill.json — the phase's script/scenes (never edit or clobber other variants: script-web*, scenes-web*, scenes-vert*, script.txt, scenes.json).
- /home/justin/piano-content/src/config.generated.ts — the shared slot.
- /tmp/opencode/cfg-vert-backup.ts — backup of the vertical config someone left at 04:41; leave it in place, do not restore it.
- Beat table (authoritative, from the phase summary): scenes map to clips as beat1.mp4 = scenes 1-2 (window 0-6.3s), beat2.mp4 = scenes 3-4 (6.3-14.7s), beat3.mp4 = scene 5 (14.7-19.5s), beat4.mp4 = scenes 6-7 (19.5-29.2s); the composition adds a 2.5s end card, explaining 29.2 -> 31.67s total.

# Acceptance criteria
- [ ] After running `node scripts/tts.mjs script-chord-drill.txt --scenes scenes-chord-drill.json --web --tts-speed 0.9` from /home/justin/piano-content, src/config.generated.ts references public/footage-chord-drill/beatN.mp4 scenes and carries exactly the 7 chord-drill captions from script-chord-drill.txt. Record the file md5 in your summary.
- [ ] Re-derive segment fit and show the arithmetic in your summary: every segment (sceneSegments and per-caption spans) mapped to clip N must fit inside that clip's beat window from the beat table above. Flag any beat window shorter than its longest segment as a looping defect — that would be new evidence against the render; report it, do not re-render on your own.
- [ ] Bind config to render: OCR midpoints of out/demo-chord-drill.mp4 (export TESSDATA_PREFIX=$(dirname $(find / -name eng.traineddata 2>/dev/null | head -1)); frames to /tmp/opencode/*.png; psm 11) at 1.65, 4.8, 8.55, 12.75, 17.1, 21.8, 26.65 and confirm the regenerated caption texts match the captions visible in the render. Also state the regenerated total duration; it should be ~31.67s. If it differs by more than 0.5s, stop with STATUS: blocked and the numbers.
- [ ] Leave src/config.generated.ts holding the chord-drill config (the worker handoff note 'config.generated.ts is now mine' is the intended end state). Do not restore the vertical config.
- [ ] The piano-suite repo tree stays untouched: run `git -C /home/justin/piano-suite status --porcelain` at the end and paste it; nothing NEW beyond docs/quick-fixes-2026-09/, public/demo-web.mp4, and .paseo-delegate/demo-videos/summaries/relay-video-chord-drill.md (orchestrator relay).

# Constraints
- 30 minutes wall clock. Do not re-render, re-capture, or touch out/, dist/, public/ mp4s of any variant. Do not modify any app source in /home/justin/piano-suite. If another process clobbers the slot mid-fix, record it in TOOLING NOTES with timestamps and complete the derivation anyway.

# Completion contract
Your final chat message: STATUS: complete|blocked|failed; SUMMARY; FILES CHANGED; VERIFICATION (commands + numeric outputs, incl. the md5, the fit arithmetic, and the 7 midpoint OCR lines); BLOCKERS; TOOLING NOTES; HANDOFF NOTES.
