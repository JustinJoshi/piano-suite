# Phase summary relay — video-chord-drill

Validator: rule on phase `video-chord-drill`. Brief:
`/home/justin/piano-suite/.paseo-delegate/demo-videos/briefs/video-chord-drill.md`
Worker completion summary (STATUS: complete) follows; the full labeled contract
is reproduced here because the worker did not file a summaries JSON.

STATUS: complete

SUMMARY: Produced demo-chord-drill.mp4 (31.7s, 1440x900 h264, Kokoro af_heart
at 0.9) through the piano-demo-video pipeline — Playwright capture with mock
MIDI on a private dev server (:3002), numeric-only verification, 4 beat clips,
7 scenes, Remotion render, per-beat QA, published to both distribution spots,
committed to the repo. The shared :3001 dev server died mid-phase; :3000 is the
opencode proxy. Capture ran against its own next dev on :3002, then stopped.

FILES: ~/piano-content/out/demo-chord-drill.mp4 (render, 3.0 MB);
~/piano-content/dist/demo-chord-drill.mp4 and
~/piano-suite/public/demo-chord-drill.mp4 (byte-identical, md5
27f960e9046cadbcc195cb533f1e562f);
.paseo-delegate/capture-chord-drill.mjs (committed — force-added past the
.paseo-delegate/* gitignore pattern); script-chord-drill.txt +
scenes-chord-drill.json (new, originals untouched); config.generated.ts
regenerated (shared per-render state); commit 82f7899 on main, pushed, with
all five trailers; includes the phase brief, the validator fixup note, and the
welcome-video relay note.

BEAT TABLE (7 scenes / 4 clips; ffprobe h264 1440x900 31.67s >= 24s; all
segment midpoints maxYDIF 1.45-14.9, no frozen beats; OCR UI text AND caption
confirmed per midpoint; Anki only as "Follow off"):
0-3.3   "Meet Chord Drill — a ready-made practice tool" | landing -> drill loads, MIDI bar | OCR: "Chord Drill","Connect MIDI Keyboard","A READY-MADE PRACTICE TOOL" | YDIF 14.9
3.3-6.3 "Pick a chord, connect any MIDI keyboard, press start" | MIDI connected, rep target 5 | "Chord Drill","A CHORD, CONNECT ANY" | 13.7
6.3-10.8 "The drill asks for one chord; lift hands, get ready, play" | Cmaj7 target, armed, reps played | "0/5 reps","No keys held","LIFT YOUR HANDS, GET" | 1.6
10.8-14.7 "Every note checked; timer measures how fast you find it" | live scoring, holding C E G B | "0/5 reps","Reps per round","AND THE TIMER MEASURES" | 2.1
14.7-19.5 "Small reps add up: five at a time, average and best kept" | round complete: stats + Redo/Next chord | "5/5 reps","5 reps — avg 1.38s, best 0.62s, first chord 0.62s","TIME. WITH YOUR AVERAGE" | 1.8
19.5-24.1 "Each round is logged; watch your chord changes get quicker" | tracking page: Cmaj7 chart, seeded history + today | "Cmaj7 — 28 first-chord attempts recorded","YOU CAN WATCH YOUR" | 1.5
24.1-29.2 "All of this is free. Open Piano Suite, pick Chord Drill" | chart holds; end card | "Cmaj7","28 first-chord attempts recorded","PICK CHORD DRILL, AND" | 1.9

VERIFICATION (self-reported): ffprobe h264 1440x900 31.67s aac; segment fit
re-cut check vs config.generated.ts (longest beat1 segment 6.32s = beat1
6.32s; others fit); no frozen beats; OCR per midpoint; Tailscale
https://thinkpad.tail4f5d20.ts.net:8454/demo-chord-drill.mp4 -> 200; git
status --porcelain clean except pre-existing docs/quick-fixes-2026-09/ and
public/demo-web.mp4.

TOOLING NOTES (verbatim): Shared :3001 dev server vanished mid-phase; :3000 is
the opencode proxy, not the app. Ran own server on :3002 (plan.json
worker-port rule), now stopped. Chord-drill settings/history persist via
Convex cloud (intent-snail-943), not localStorage — seeded
blocked-drill-first-chord-log for the Tracking chart, set rep target through
the UI. Convex cloud answered during capture (local :3210 still dead). Cold
dev-server compile inflates early clips (~112s of blank/home footage in one
take) — re-captured after warm-up. Intermittent dev-mode main-thread stalls
swallowed a mock note-on twice; capture script now fires a 6th pulse and
breaks on completion. .paseo-delegate/capture-*.mjs is gitignored by pattern;
force-added since the validator requires it in git log. Render needed
--concurrency=2 (default concurrency timed out at frame 631).

HANDOFF NOTES (verbatim): For the arpeggios/root-cycling/progression phases:
settings load from Convex, so configure through the UI (data-testids exist,
e.g. chord-drill-rep-target-N); seed only the tracking localStorage key;
expect cold-compile dead time on a fresh dev server; render with
--concurrency=2 if the machine is loaded; my :3002 server is stopped — start
your own port. tesseract here lacks tsv/hocr configs; use full-frame psm 11 +
band crops. Chained scenes config: config.generated.ts is now mine —
regenerate it before your render.

Validator reminders: re-run every check yourself (ffprobe, md5 matches across
the three copies, git log trailers on capture-chord-drill.mjs, OCR at
midpoints, YDIF, segment-fit derivation from config.generated.ts, tree
cleanliness — note demo-web2.mp4 is now TRACKED and the relay/brief files are
committed in 82f7899). This is NOT the final phase: on PASS use
next_action "advance"; per the drift rule of the run config (next:auto), the
welcome-video PASS already carried drift: detected — the orchestrator will
route next-brief authoring accordingly (a Planner agent is spawned on first
escalation). Your verdict must state your own drift finding for THIS phase.
Reply with exactly one JSON verdict.
