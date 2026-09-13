OUTCOME PACKET (phase video-arpeggios -> next phase video-root-cycling)

## 1. Master plan's spec for video-root-cycling
{
  "id": "video-root-cycling",
  "title": "Produce demo-root-cycling.mp4 for the Root Cycling drill",
  "depends_on": [
    "video-arpeggios"
  ],
  "effort_budget": "2 hours wall clock",
  "acceptance_criteria": [
    "same shape as video-chord-drill with tool=root-cycling (files demo-root-cycling.mp4, capture-root-cycling.mjs, script-root-cycling.txt, scenes-root-cycling.json)"
  ],
  "tool_context": "components/drills/root-cycling \u2014 one fixed chord/arpeggio idea across random roots in all 12 keys"
}

## 2. Worker's completion summary (raw)
summaries/relay-video-arpeggios.md (full labeled contract). Key: render
48.042667s h264 1440x900; md5 a58ce0956fba88f28a6b992ba0e11b4b identical
across out/dist/public; config md5 rendered-against
504d222002d8903bbccf2c64860777a0 with pre/post snapshots in /tmp/opencode/;
9 beats, 10 segments, all fit headroom >= 1.99s; commit c5d4050 on main.

## 3. Validator's assessment (curated)
All eight criteria independently verified against the real artifacts. (1) ffprobe out/demo-arpeggios.mp4: h264 1440x900, 48.042667s (>= 24s, aac). (2) md5 a58ce0956fba88f28a6b992ba0e11b4b identical across out/, dist/, and piano-suite/public/. (3) capture-arpeggios.mjs committed in c5d4050 (268 lines) with Phase: video-arpeggios / Agent-Id / Session-Id trailers (the brief's required three). (4) script-arpeggios.txt is 10 lines, one idea per beat; scenes-arpeggios.json maps them to 9 clips; prior phases' script/scenes untouched. (5) Beat-by-beat OCR at the config-derived segment midpoints (which match the worker's reported midpoints exactly): captions AND Arpeggios UI verified at every one — t=1.67 'Arpeggios'/'LH pedal (hold): Bb + F + Ab'/'A READY-MADE PRACTICE TOOL IN'; t=5.19 'Bbm11'/'PLAY THE ROOT + 5TH TO BEGIN'/'SEVEN-NOTE MINOR-ELEVEN CELLS, ONE'; t=9.54 'Laps Misses This lap'/'Restart chord'/'HOLD IT, AND THE'; t=14.89 'Connected Demo Keyboard'/'NEXT (11)'/'Holding: F G# A#'/'YOU PLAY IT, AND'; t=20.41 'Laps Misses This lap'/'LAPS AND MISSES ARE'; t=24.59 'RED AND GET COUNTED' (miss flash); t=27.94 'TO THE MISS FILTER'; t=32.29 settings 'Flash on Miss'/'Lap Chime'/'Miss filter'/'Use chord & sequence'/'RESTART THE ONE YOU ARE'; t=37.31 Tracking 'TRANSITIONS Bbm11 - b7Root 10 successful attempts recorded'/'Miss breakdown: played B instead (x1)'/'LOGGED, SO OVER WEEKS'; t=42.66 Tracking chart 'attempt # (chronological) — 10 total'/'FREE. OPEN PIANO SUITE,'. (6) No frozen beats — per-segment maxYDIF on 32x18 downscale at fps=4: 1.90/11.49/1.68/1.82/1.86/1.85/10.99/12.32/2.06/10.79 (all >= 1.68). (7) Segment fit re-derived from the recorded config: config.generated.ts md5 504d222002d8903bbccf2c64860777a0 == post-gen snapshot cfg-arp-after-gen.ts, and the pre-gen slot snapshot (8cce1182..., the chord-drill config) exists at /tmp/opencode/cfg-slot-before-arpeggios.ts; clips ffprobe 9.72/7.96/11.48/11.48/5.00/5.72/11.48/6.52/9.80 vs hosted segment totals 7.026/5.019/5.688/5.353/3.011/3.680/5.019/5.019/5.688 — every beat fits with >= 1.99s headroom (min beat5 1.989); 45.504s footage + 2.5s end card = 48.004s = render's 1441 frames. (8) Tree clean: only baseline dirt (docs/quick-fixes-2026-09/, public/demo-web.mp4) plus the orchestrator relay file untracked; demo-web2/demo-chord-drill/demo-arpeggios and contract files all tracked. The adversarial-slot protocol from the chord-drill FAIL was executed exactly (3 regenerations with intermediate defects caught and fixed before render; no clobber). Fragile: the relay summary condenses the beat table to midpoints + fit numbers without the per-beat spoken gist/on-screen action rows — I derived windows from config.generated.ts sceneSegments (the more authoritative source), so verification was unaffected, but future summaries should file the full table.

## 4. Validator's handoff_notes
Chain protocol for video-root-cycling and beyond (all re-verified this phase and working): own dev server on port >= 3002 (BASE_URL=http://localhost:3002, set -a && . ./.env.local && set +a); regenerate src/config.generated.ts immediately pre-render with before/after slot snapshots in /tmp/opencode/ and record the rendered-against md5 in the summary; count sceneSegments after every regeneration; leave >= 2s fit headroom per beat; tesseract psm 11 + band crops; render with --concurrency=2; publish to dist/ + public/ with identical md5. Environment deltas: the shared :3001 dev server is now definitively dead (the worker's cleanup pkill -f "next dev" killed whatever was answering there; :3000 is the opencode proxy — start your own port). Convex cloud (intent-snail-943) serves settings/history; local :3210 dead — configure drills through UI testids, seed only the tracking localStorage keys. Tree baseline for cleanliness checks: docs/quick-fixes-2026-09/ and public/demo-web.mp4 untracked; demo-web2.mp4, demo-chord-drill.mp4, demo-arpeggios.mp4, capture scripts, and .paseo-delegate contract files are tracked. Process notes for the orchestrator/planner: (a) the relay summaries should reproduce the worker's full beat table (time/gist/action/expected OCR) — this phase's relay condensed it to midpoints + fit, forcing the validator to derive windows from config sceneSegments instead; (b) workers still file no summaries JSON — consider requiring summaries/<phase>.json so beat tables survive; (c) commits c5d4050/82f7899 carry the three trailers the planner-authored briefs require, not the five the welcome-video brief required — keep the planner briefs explicit about which trailers each phase needs.

## 5. Tooling notes (verbatim)
Regenerated config 3x before the final render: two intermediate generations caught (a) stale scene matches after rewording lines 9-10 (segments dropped to 8 — caught by counting sceneSegments) and (b) caption-boundary midpoints; final config verified before render, no concurrent clobber observed. My pkill -f "next dev" during cleanup was broader than intended: a dev server that had been answering on :3001 was killed (the handoff already reported :3001 dead mid-phase, so it may have been a leftover). The :3000 server/proxy was untouched and is still up. My own :3002 server was stopped intentionally.

## 6. Ledger extract
- welcome-video: PASS (0 fix-ups), drift detected.
- video-chord-drill: PASS after 1 fix-up, drift detected (adversarial config slot).
- video-arpeggios: PASS (0 fix-ups), drift none. Relay summaries condensed the beat tables; future summaries must file the full table (spoken gist / on-screen action per beat) — the validator derived windows from config.generated.ts this time.
