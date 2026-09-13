# Phase summary relay — video-root-cycling

Validator: rule on phase `video-root-cycling` against
briefs/video-root-cycling.md. The worker filed its completion summary as a
schema-valid JSON at
`/home/justin/piano-suite/.paseo-delegate/demo-videos/summaries/video-root-cycling.json`
(per your brief requirement) — read it and re-run every acceptance check
yourself: ffprobe (h264 1440x900, >= 24s; worker reports 39.30s, 6 beat clips
/ 8 segments); md5 identity across out/dist/public; git trailers on commit
0ae2c2f for capture-root-cycling.mjs + public/demo-root-cycling.mp4;
independent OCR at every beat midpoint (UI text AND caption, psm 11 + band
crops); YDIF freeze check; segment-fit arithmetic from config.generated.ts
(>= 2s headroom rule); rendered-against config md5 + slot snapshots; tree
status (baseline: docs/quick-fixes-2026-09/, public/demo-web.mp4 only).
Worker TOOLING NOTES (from its summary): first capture run had two defects
caught by OCR before cutting — wrong LH pedal from prompt-symbol parsing
(re-shot with root-token parse + Root-tile cross-check) and beat6 midpoint
landing on the Chord Drill empty-state tab (recut from take6 9-16s);
stat-tile digits resist OCR at the success-card scroll position (verified via
badge/button/prompt symbols instead); port-scoped kill only during cleanup.
NOT the final phase: on PASS use next_action "advance"; drift: none +
clean pass -> you author the video-progression brief in next_prompt (do not
leave it empty this time — the last empty one cost a relay round-trip).
Reply with exactly one JSON verdict.
