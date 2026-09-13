# Handoff — demo-videos delegation run + follow-ups

Run: paseo-delegate v3.0, state namespace `demo-videos`, workspace
`wks_1eb10d7b1e2bd470`, all agents on `opencode/opencode-go/glm-5.3-flash`.
Ledger (append-only, resume point): `.paseo-delegate/demo-videos/ledger.json`.
All agents archived. Every commit on `origin/main` carries provenance
trailers (Phase / Agent-Id / Session-Id / Brief / Verdict).

## What shipped (all merged to main, verified, deployed)

1. **Welcome page** — `public/demo-web2.mp4` embedded as section
   "06 / see it in action" (`components/welcome/demo-video-section.tsx`,
   copy in `lib/welcome-config.ts`, `useWelcomeConfig`). Bonus: `proxy.ts`
   Clerk matcher now passes `mp4|webm|mov` static files (signed-out visitors
   get 200, protected `/tools/*` still gate).
2. **Five demo videos** (1440x900 h264, Kokoro `af_heart` @ 0.9, Remotion,
   numeric QA only): `demo-chord-drill.mp4` (31.7s), `demo-arpeggios.mp4`
   (41.3s, free-CTA line removed per user), `demo-root-cycling.mp4` (39.3s),
   `demo-progression.mp4` (36.8s), `demo-workshop.mp4` (38.6s). Each in
   THREE verified-identical spots: `~/piano-content/out/`, `~/piano-content/dist/`
   (Tailscale `https://thinkpad.tail4f5d20.ts.net:8454/demo-<name>.mp4`),
   `~/piano-suite/public/`. Capture scripts committed at
   `.paseo-delegate/capture-<tool>.mjs`.
3. **Wiring** — `lib/demo-videos.ts` registry + `components/drills/tool-demo-video.tsx`
   (collapsed "Watch the demo" details) mounted on all five tool pages.
4. **First-visit intro overlay** — `ToolDemoVideo` shows a warm, tool-
   specific welcome (headline/body/CTA + the tool's video) once per device
   (`piano-suite:demo-intro-seen:<href>`, localStorage only, never Convex);
   Escape/CTA/close dismisses; falls back to the collapsed details. Copy was
   rewritten twice: grounded in drill sources (fe6378e), then warmed
   (3b6908c). Capture scripts pre-set the flag so re-captures never film it.

## Verify anything

- Registry/file-existence test: `node_modules/.bin/vitest run lib/__tests__/demo-videos.test.ts`
- Full gate: `npm run lint` / `npm run test:unit:run` / `npm run build`
- Axe gate (scans /tools/workshop, /tools/workshop/blocks, /marketplace):
  `E2E_PORT=3003 npm run test:e2e -- e2e/a11y.spec.ts` (port 3000 is held by
  a stray proxy process in this environment — use 3003)
- Video QA is numeric-only per `~/.agents/skills/piano-demo-video/SKILL.md`
  (signalstats YAVG/YDIF, ffprobe, tesseract OCR; NEVER read images).

## Known issues / hazards

- **Product bug:** `useDrillRuntime` never calls `useDrillTimer.arm()`, so
  Workshop drill timers stick at "Play when ready" and scoring never runs.
  Fix exists on unmerged branch `claude/drill-arm-and-keyboard-audio`
  (31318a3). Merge before any re-cut showing live scoring.
- **All four drills require a connected MIDI keyboard to start**
  (`disabled={!midiConnected}`); the copy was corrected to match. To make
  drills startable with the on-screen keyboard, change that gate per drill.
- **Adversarial shared slot:** `~/piano-content/src/config.generated.ts` is
  per-render shared state and was clobbered mid-render once by an
  out-of-band vertical-cut process. Protocol (in every video brief): snapshot
  md5 to /tmp/opencode/ before/after, regenerate immediately before render,
  assert 0 scene:null captions AND last-segment-end == last-caption-end,
  then re-verify md5 pre-render. Chain lessons also live in each phase's
  summary under `summaries/`.
- **Capture env:** dev servers drift (3000 = opencode proxy, 3001 died
  mid-run); use your own `PORT` >=3002 with `BASE_URL` + `set -a && . ./.env.local && set +a`.
  Screencast playback lags wall-clock ~1.5-2.5s — cut state windows by OCR,
  not script timings. Segments re-mount clips at frame 0: cut beats so the
  FIRST 2-3s show the expected state; check segment STARTS, not just
  midpoints. `@axe-core/playwright` is declared but was missing from the
  shared node_modules once — `npm install` fixes; worktree node_modules
  symlink breaks Turbopack — use `cp -al`.

## Extending

- New video for a new tool: add `lib/demo-videos.ts` entry + one
  `<ToolDemoVideo href=... />` line on the page + a capture script (model on
  capture-chord-drill.mjs) + pre-set the intro flag in it. The unit test
  fails until the mp4 exists in `public/`.
- Intro copy lives in `lib/demo-videos.ts` (`introHeadline/introBody/introCta`);
  verified mechanics per tool are in `briefs/intro-copy-research.md` +
  `verdicts/intro-copy-research.json`.

## Deploy state at handoff

Latest production deploy: commit f9d850e (warmed intro copy)
https://piano-suite-c8dr6ejiv-justin-joshis-projects.vercel.app (Vercel SSO
protected; assets like /demo-*.mp4 serve 200 directly).
