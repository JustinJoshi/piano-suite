cd /home/justin/piano-content. Fix-up 2 for phase video-root-cycling of the demo-videos delegation (paseo run). Zero context assumed; piano-content is NOT a git repo — files only, no commits there. Numeric verification only (ffmpeg signalstats/ffprobe/tesseract OCR); NEVER read images — doing so invalidates the work.

# Task
The render's closing beats show the tracking page in the wrong state at their start: beat6.mp4's first ~2.2s show 'Sign in to view your practice history' (signed-out) then 'No first-chord attempts logged yet' (signed-in empty) before the seeded Root Cycling panel appears; since seg8 (26.777-31.294) and seg9 (31.294-36.779) BOTH re-mount beat6 at frame 0, the shipped render contradicts its captions ('Every attempt is logged... watch random recall get faster' / 'All of this is free...') for ~4.3s total. Fix by trimming beat6 to start on the stable seeded panel, re-render, re-publish. The config does NOT change: src/config.generated.ts md5 must remain dbd9a870e61b76cb45ef13ea2e2df5e0 (9 segments, 29 captions, coverage 0.000-36.779) — do NOT regenerate it.

# Relevant files
- /home/justin/piano-content/public/footage-root-cycling/beat6.mp4 — currently 13.0s, cut from a 25.4s take; re-cut so the clip's frame 0 is the seeded panel ('IDEAS / Chord - m7 / 40 attempts recorded / Local practice mode' visible, 'Sign in to view' and 'No first-chord attempts logged yet' absent).
- The raw take it was cut from (in /home/justin/piano-content/public/footage-root-cycling/ or /tmp — identify it by OCR sweep; if the take's panel-visible tail after the seeded state settles is < 12.1s, re-capture ONCE with the committed 14s settle pattern from /home/justin/piano-suite/.paseo-delegate/capture-root-cycling.mjs, own dev server port >= 3002, port-scoped kill only).
- /home/justin/piano-content/src/PianoVideo.tsx — read-only reference: every segment re-mounts its clip at frame 0.
- /home/justin/piano-content/src/config.generated.ts — DO NOT MODIFY; verify md5 unchanged before and after your render.
- /home/justin/piano-content/out/demo-root-cycling.mp4 + dist/ + /home/justin/piano-suite/public/demo-root-cycling.mp4 — publish spots (current md5 6b0b82859612456c385a35de607ac5b9).
- /home/justin/piano-suite/.paseo-delegate/demo-videos/summaries/video-root-cycling.json — update its stale `summary` field (still says 8 segments) and append fix-up 2 evidence to `verification`.

# Acceptance criteria
- [ ] beat6.mp4 re-cut: ffprobe duration >= 12.1s (hosted segment total 10.001s + 2.0s headroom); OCR at segment-local times +0.5, +1.5, +2.5, +4.0 of BOTH beat6-hosted segments shows the seeded panel (expect 'IDEAS' or 'attempts recorded' AND 'Local practice mode') and ZERO occurrences of 'Sign in to view' or 'No first-chord attempts' anywhere in seg8 (26.777-31.294) or seg9 (31.294-36.779) — verify with an OCR sweep at fps=1 over both spans (frame dumps to /tmp/opencode/*.png, psm 11).
- [ ] src/config.generated.ts md5 still dbd9a870e61b76cb45ef13ea2e2df5e0 before and after the render (slot snapshots to /tmp/opencode/ with md5, before and after, per chain protocol).
- [ ] Re-render: `npx remotion render PianoVideo out/demo-root-cycling.mp4 --concurrency=2` from /home/justin/piano-content; ffprobe: h264 1440x900, duration within 0.5s of 39.278667.
- [ ] Full numeric QA on the NEW render: (a) the seg8/seg9 OCR sweep from criterion 1; (b) all 9 segment midpoints still OCR-verified (UI text AND caption — expectations unchanged: app intro 'A READY-MADE PRACTICE TOOL'@1.77, Practice setup @5.65/9.68, 'GRADES YOU, THEN JUMPS'@13.39, 'THAT IS HOW SHAPES'@16.94, arpeggio 'MODE AND CYCLE THE'@20.65, Root Pool grid 'THE KEYS YOU WANT'@24.68, Tracking seeded 'OVER WEEKS YOU CAN'@29.04, CTA 'SUITE, PICK ROOT CYCLING,'@34.04); (c) per-segment YDIF on downscaled frames — no frozen segment; (d) end card OCR @37.5 ('Piano Suite').
- [ ] Publish both spots: md5 identical across out/dist/public; record it.
- [ ] Piano-suite repo: commit ONLY updated /home/justin/piano-suite/public/demo-root-cycling.mp4 and the updated summaries JSON (if staged for you) with scoped paths and trailers Phase: video-root-cycling (fix-up 2 in the body), Agent-Id: $PASEO_AGENT_ID, Session-Id from ~/.paseo/agents/home-justin-piano-suite/$PASEO_AGENT_ID.json. Paste `git -C /home/justin/piano-suite status --porcelain` at the end; nothing NEW beyond docs/quick-fixes-2026-09/, public/demo-web.mp4, and .paseo-delegate relay files.
- [ ] Never modify: demo-web2/demo-chord-drill/demo-arpeggios files anywhere, /tmp/opencode/cfg-vert-backup.ts, other variants' script/scenes files, config.generated.ts, or any app source under /home/justin/piano-suite/app|components|lib.

# Constraints
- 45 minutes wall clock. Do not regenerate the config or re-run TTS; do not re-capture unless the existing take lacks >= 12.1s of panel-visible tail (justify with an OCR sweep of the take if you re-capture).
- Numeric verification only; NEVER read images.

# Completion contract
Your final chat message: STATUS: complete|blocked|failed; SUMMARY; FILES CHANGED; VERIFICATION (commands + numeric outputs: beat6 duration + sweep OCR lines, config md5 checks, midpoint OCR lines, YDIF, ffprobe, md5s, git status); BLOCKERS; TOOLING NOTES; HANDOFF NOTES.