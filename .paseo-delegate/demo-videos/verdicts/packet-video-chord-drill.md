OUTCOME PACKET (phase video-chord-drill -> next phase video-arpeggios)

## 1. Master plan's spec for video-arpeggios
{
  "id": "video-arpeggios",
  "title": "Produce demo-arpeggios.mp4 for the Arpeggios drill",
  "depends_on": [
    "video-chord-drill"
  ],
  "effort_budget": "2 hours wall clock",
  "acceptance_criteria": [
    "same shape as video-chord-drill with tool=arpeggios (files demo-arpeggios.mp4, capture-arpeggios.mjs, script-arpeggios.txt, scenes-arpeggios.json)"
  ],
  "tool_context": "components/drills/arpeggios \u2014 7-note minor-11 arpeggio cells, two-phase root/sequence drilling"
}

## 2. Worker's completion summary (raw)
See summaries/relay-video-chord-drill.md (main phase) and
summaries/relay-video-chord-drill-fix1.md (fix-up) — full labeled contract
relayed there verbatim. Key numbers: render 31.667s h264 1440x900, md5
27f960e9046cadbcc195cb533f1e562f identical across out/, dist/,
piano-suite/public/; config md5 cb526971f84f70e65ad00c948bf134ec; scene->beat
order [1,1,2,2,3,4,4]; Tailscale :8454 URL 200; commit 82f7899 on main with
all five trailers.

## 3. Validator's assessment (curated)
Phase passes after fix-up 1; all eight criteria now independently verified. The render itself never needed redoing: out/demo-chord-drill.mp4 md5 27f960e9046cadbcc195cb533f1e562f unchanged, h264 1440x900 31.667s (>= 24s), md5 identical across out/, dist/, and piano-suite/public/. Fix checks re-run by the validator: (a) regenerated src/config.generated.ts md5 cb526971f84f70e65ad00c948bf134ec, 1440x900, durationSeconds 31.662667, 32 footage-chord-drill refs (captions beat1 x5 / beat2 x7 / beat3 x4 / beat4 x9 + sceneSegments), scene->beat order [1,1,2,2,3,4,4] matching scenes-chord-drill.json; (b) fit arithmetic re-derived: clip durations ffprobe 6.320/14.960/5.960/11.480 vs hosted segment totals 6.313/8.418/4.810/9.621 — every clip fits (beat1 margin is thin, 7ms, but real); 29.163s footage + 2.5s end card = 31.663s = render's 950 frames at 30fps; (c) config->render binding re-OCR'd at all 7 midpoints with caption-band crops: 'A READY-MADE PRACTICE TOOL' / 'A CHORD, CONNECT ANY' / 'LIFT YOUR HANDS, GET' / 'AND THE TIMER MEASURES' / 'TIME, WITH YOUR AVERAGE' (comma confirmed, resolving the earlier punctuation ambiguity) / 'YOU CAN WATCH YOUR' / 'PICK CHORD DRILL, AND' — each matches the regenerated caption span containing that time under PianoVideo's uppercase display; (d) /tmp/opencode/cfg-vert-backup.ts untouched (still the vertical config, md5 5a24578b...); (e) piano-suite tree clean — only baseline dirt (docs/quick-fixes-2026-09/, public/demo-web.mp4) plus orchestrator relay/brief/verdict files untracked, and the standing verdicts/video-chord-drill.json is my FAIL verdict relayed by the orchestrator, not worker output. Original-phase evidence (trailers on 82f7899, script one-idea-per-line, no frozen beats maxYDIF 1.94-14.86, Tailscale 200) stands. The deliverable is genuine and now fully re-derivable from the on-disk config.

## 4. Validator's handoff_notes
Original worker HANDOFF NOTES, verbatim: For the arpeggios/root-cycling/progression phases: settings load from Convex, so configure through the UI (data-testids exist, e.g. chord-drill-rep-target-N); seed only the tracking localStorage key; expect cold-compile dead time on a fresh dev server; render with --concurrency=2 if the machine is loaded; my :3002 server is stopped — start your own port. tesseract here lacks tsv/hocr configs; use full-frame psm 11 + band crops. Chained scenes config: config.generated.ts is now mine — regenerate it before your render. Fix worker HANDOFF NOTES, verbatim: The slot now holds the chord-drill config as the standing state. Any next phase should regenerate from its own script/scenes as the pipeline already requires, and ideally snapshot the slot to /tmp/opencode/ before and after — the concurrent-process pattern that caused the FAIL has not been coordinated away. DRIFT (my standing finding for this phase): the piano-content src/config.generated.ts slot is not exclusively owned — a concurrent vertical-cut process restored the vertical config at 05:13:25 mid-render, which caused the criterion-7 FAIL. The fix restored verifiability but the structural hazard remains uncoordinated; every future video phase must regenerate the slot immediately before bundling and record the config md5 in its summary so fit can be re-derived post hoc. Verbatim original TOOLING NOTES also carry Convex-cloud capture caveats (settings/history live in Convex cloud intent-snail-943, local :3210 dead; seed blocked-drill-first-chord-log; cold-compile dead time; --concurrency=2).

## 5. Tooling notes (verbatim)
No slot clobber during this fix. The slot was verified overwritten at 05:13 (8725 bytes, 1080x1920) before regeneration; /tmp/opencode/cfg-vert-backup.ts still 8725 bytes @ 04:41, untouched as instructed.

## 6. Ledger extract
- welcome-video: PASS (fix-ups 0), drift detected — demo-web2.mp4 now TRACKED; proxy.ts matcher gains mp4|webm|mov; .paseo-delegate contract files tracked, ledger ignored.
- video-chord-drill: PASS after 1 fix-up (criterion 7), drift detected — piano-content config.generated.ts slot is adversarial (out-of-band vertical-cut process restored vertical config mid-render); every future phase must regenerate immediately before render and snapshot md5 to /tmp/opencode/ before and after; worker's own capture ran on :3002, shared :3001 died mid-phase, :3000 is the opencode proxy.
