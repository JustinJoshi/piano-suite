# Phase summary relay — video-progression

Validator: rule on phase `video-progression` against
briefs/video-progression.md. Worker reported STATUS: complete. Summary:

Render: demo-progression.mp4 h264 1440x900 36.833s; md5
451ab136e18c1301fc0eb6447f105047 identical across out/dist/public;
http://127.0.0.1:8454/demo-progression.mp4 -> 200.

FILES: .paseo-delegate/capture-progression.mjs (new, committed 2787dce,
trailers); .paseo-delegate/demo-videos/summaries/video-progression.json
(committed 22edf3f); script-progression.txt + scenes-progression.json +
public/footage-progression/ (new; no prior phase touched); shared slot
regenerated (rendered-against md5 c9aa64f047add108e9f4ceca87f5113f; pre-regen
snapshot matched root-cycling final dbd9a870...).

Verification (self-reported): sceneSegments=10, captions=24, 0 nulls,
coverage 0-34.325s no gaps; longest span vs clip headroom >= 6.1s on every
clip; 5 captures on own :3002 server (stopped after); beat table: seg1-2
beat1 idle ii-V-I in C (Dm7 / D Dorian / strip Dm7 G7 Cmaj7) -> seg3-5 beat2
live loop graded + loop 1 completes -> seg6 beat3 12-bar blues (C7 /
Mixolydian strip) -> seg7 beat4 key G (Am7 D7 Gmaj7) -> seg8-10 beat5
Personal bests after a live loop (1.57s/1.67s/Total loops 1) -> end card.
20 OCR samples (+0.5s and midpoint per segment) all pass; YDIF no frozen
beats. Two capture defects fixed pre-cut via OCR: personal-bests card reads
Convex progression-history-v1 (empty for fresh user) — re-shot playing a real
loop in-take; two scenes rows missed renamed lines — caught by scene:null +
gap checks, regenerated to zero.

TOOLING NOTES (verbatim): ffmpeg -ss past EOF still emits the final frame on
these webm captures, so extra-take OCR samples silently repeat the last
frame — keep sample times within duration. Screencast playback lags
wall-clock UI events ~1.5-2.5s; state windows must be cut by OCR, not script
timings.

HANDOFF NOTES (verbatim): Chain protocol carries to video-workshop unchanged
(slot snapshot with md5 before regen; regen immediately before render; assert
BOTH zero scene:null captions AND last-segment-end == last-caption-end —
tts.mjs drops one scene per unmatched line silently; >=2s headroom; md5
re-check pre-render; --concurrency=2; publish with identical md5). New
footprints: footage-progression/, script-progression.txt,
scenes-progression.json. Dev server :3002 was mine and is now stopped. All
work pushed to origin/main; repo tree clean beyond baseline
(docs/quick-fixes-2026-09/, public/demo-web.mp4).

NOT the final phase: video-workshop remains. On PASS use next_action
"advance"; drift: none + clean pass -> author the video-workshop brief in
next_prompt (do NOT leave it empty). Reply with exactly one JSON verdict.
