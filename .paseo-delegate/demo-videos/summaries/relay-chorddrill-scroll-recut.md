# Phase summary relay — chorddrill-scroll-recut

STATUS: complete

SUMMARY: Re-captured chord-drill beats so every shot obeys the scroll rule
(top by default; Settings in frame only while narration covers it), re-cut
beat2/beat3, re-rendered out/demo-chord-drill.mp4 with the unchanged config,
and republished. Beat1 and beat4 verified good and kept.

FILES CHANGED:
- public/demo-chord-drill.mp4 (md5 6030bff0c4433428fff56ea077b98cfd = out/ =
  dist/) — commit 361335f, pushed origin main, Phase trailer chorddrill-scroll-recut.
- .paseo-delegate/capture-chord-drill.mjs — scroll discipline edits: locator
  click's auto-scroll is transient (cut off), page-top hold 2.6s before the
  drill beat, settings-card edge positioned exactly at y900 for beat2, beat3
  scrolls to Settings (anchor: "Configure how the drill behaves"), rep loop
  hardened against dev-mode note swallows (stall log printed only when a rep
  did not land).

BEAT TABLE (scroll state at clip start; 7 segments / 4 clips, 31.667s,
config md5 cb526971f84f70e65ad00c948bf134ec unchanged, narration untouched):
 beat1.mp4 (kept): segs 1-2 top: landing → drill page top, header + MIDI
   connect bar + on-screen keyboard; narration = intro, pick chord, connect.
 beat2.mp4 (NEW, source take page@2247df79*, 21.5-28.0s, 6.48s): segs 3-4
   open at filmed top framing → drills prompt/holding/reps row; Settings
   card NOT in frame. Narration = "the drill asks… every note checked,
   timer" — drill card, no settings.
 beat3.mp4 (NEW, take 78.2-84.5s, 6.32s): Settings card in view with Reps
   per round `5` highlighted + 5/5 avg/best + Redo. Settings-in-view
   JUSTIFIED: narration "Small reps add up: five at a time" — rep target is
   the Settings row.
 beat4.mp4 (kept): tracking page, no scroll concern.

RAW TAKES: page@2247df79caf6f4b8acb878cea3677dff.webm (used); only this take
and pre-existing page@539676bca4685905cd14a585ee88b83a.webm retained.

VERIFICATION (numeric only):
- ffprobe: h264 1440x900 30fps, 31.666667s (target 31.667).
- Segment-start (+0.5s segment-local) full-frame OCR: segs 1-4 show top band
  "Chord Drill"/"Blocked-practice chord drill…" header, NO "Reps per
  round"; seg 5 shows Settings card as declared exception; segs 6-7 = the
  Tracking page with "28 first-chord attempts recorded".
- Midpoints captions (band y760-880) match fix1's table verbatim: "A
  READY-MADE PRACTICE TOOL", "MIDI KEYBOARD, AND PRESS", "LIFT YOUR HANDS,
  GET", "AND THE TIMER MEASURES", "…ME, WITH YOUR AVERAGE", "YOU CAN WATCH
  YOUR", "PICK CHORD DRILL, AND".
- Fit: config sceneSegments spans 3.307/3.006 (beat1), 4.510/3.908 (beat2,
  headroom 1.970), 4.810 (beat3, headroom 1.510), 4.510/5.111 (beat4, clip
  11.48) — beats 1-2 headroom ≥3.0s; all ≥1.5s ≥0.5s target.
- Config slot: before fee1a5d50a9448ce3fe50c1c93d96354 (arpeggios leftover,
  snapshotted /tmp/opencode/echo-scroll/cfg-before.md5-fee1a5.ts), after
  cb526971f84f70e65ad00c948bf134ec (snapshotted
  /tmp/opencode/echo-s9/cfg-after.md5-cb52697.ts) — identical to the md5 the
  original render was bundled from.
- YDIF per segment (fps=2, w=32:18): b1 14.87, b1b 14.99, b2a 1.50, b2b
  4.54, beat3 9.28, beat4a 6.23, beat4b 5.60 — no frozen segment.
- End card OCR: "Piano Suite / Free practice tools for self-taught pianists".
- Tailscale :8454 URL 200.

TOOLING NOTES: Header "Chord Drill"/description is STICKY — do not use the
top band as a scroll discriminator; discriminate on the "Reps per round"
row. Rep scoring is flaky under dev Next (note-ons swallowed: one run
stalled at 0/5 across all 12 attempts twice); stall-followup loop now
re-fires per stalled rep. Synthetic JS `el.click()` on Start silently
breaks scoring — only locator clicks register; instead pre-scroll so the
button is in-viewport before the filmed top hold.

HANDOFF NOTES: capture script comments carry the framing reasons. Beat2
frame opens mid-beat already glided (drill card in view); scroll and framing
are baked into the take. Config regenerated in the shared slot — next
phases must regenerate their own before render, as usual.
