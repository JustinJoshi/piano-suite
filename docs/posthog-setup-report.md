# PostHog setup report

Date: 2026-11-08
PR: https://github.com/JustinJoshi/piano-suite/pull/126
Merge commit: `cde2b7c`

## Status

Code, tests, and the reverse proxy are shipped and verified on production.
**PostHog capture is still off in production because `NEXT_PUBLIC_POSTHOG_KEY`
is missing.** No project key exists in Vercel Production, Vercel Preview, or
local env. Analytics is a no-op until the key is added.

The owner's instruction was to not invent a key, so no key was created or
copied from another app. See "What Justin must do" below.

## What changed

### First-party reverse proxy (US Cloud)

`next.config.ts`:

- `/ingest/static/:path*` → `https://us-assets.i.posthog.com/static/:path*`
- `/ingest/decide` → `https://us.i.posthog.com/decide`
- `/ingest/:path*` → `https://us.i.posthog.com/:path*`
- `skipTrailingSlashRedirect: true`

`proxy.ts`: the Clerk matcher now excludes `/ingest(?:/|$)`, so analytics
requests are never bounced to `/sign-in`. Before this change, production
`/ingest/decide` returned **307** (Clerk redirect).

The cloud is **US**. The PostHog account is served from `us.posthog.com`, and
the upstream hosts in the rewrite are the US ingest/assets hosts. `ui_host` is
pinned to `https://us.posthog.com`.

### Full capture

`lib/analytics.ts` now initializes with:

```ts
api_host: "/ingest",
ui_host: "https://us.posthog.com",
autocapture: true,
capture_pageview: false, // manual path-only $pageview from the provider
capture_pageleave: true,
capture_heatmaps: true,
capture_dead_clicks: true,
capture_exceptions: true,
disable_session_recording: false,
session_recording: { maskAllInputs: true },
```

Existing `ANALYTICS_EVENTS` are unchanged. `capturePageview` still strips query
strings before sending `$current_url`.

`identifyUser(userId)` ties events to the Clerk user.
`resetAnalytics()` starts a fresh anonymous person on sign-out. The provider
only resets on a signed-in → signed-out transition, so a first anonymous load
keeps one distinct id.

### Other changes

- `.env.example` documents `NEXT_PUBLIC_POSTHOG_KEY` (no host variable needed).
- `app/privacy` now discloses clicks, heatmaps, error reports, and session
  replays with all form inputs masked. MIDI/keypress content is still never
  sent.
- `AGENTS.md` and `docs/PROJECT_HISTORY.md` document the proxy and capture
  setup.
- Fixed a stale unit test on `main` that predated the chord-under-construction
  guard (`22964b5`), so CI can pass.

## Verification

### Gate

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `eslint .` | clean |
| `vitest run` | 189 files, 1709 tests passed |
| `next build` | succeeded |
| GitHub CI run `42493731651` | lint, typecheck, unit, build, e2e all passed |
| Vercel production deploy | completed, merged commit `cde2b7c` |

### Production reverse proxy

```
GET  https://piano-suite.vercel.app/ingest/static/array.js   -> 200 (PostHog asset)
POST https://piano-suite.vercel.app/ingest/decide (invalid)  -> 401 (PostHog auth error)
POST https://piano-suite.vercel.app/ingest/decide (valid)    -> 200 (PostHog JSON)
GET  https://piano-suite.vercel.app/                          -> 200
```

Before merge, `/ingest/decide` returned `307` from Clerk. It is now served by
PostHog.

### Client wiring (local production build)

Because production has no key, the live site makes **no** PostHog requests. To
prove the client wiring, I built locally with a probe key and intercepted
event/snapshot ingestion in Playwright so nothing was written to PostHog.
Read-only config/flags/static requests were allowed through.

Requests observed from a desktop Chrome user agent:

```
GET  /ingest/static/1.422.5/exception-autocapture.js
GET  /ingest/static/1.422.5/dead-clicks-autocapture.js
GET  /ingest/static/1.422.5/surveys.js
GET  /ingest/static/1.422.5/posthog-recorder.js
GET  /ingest/array/<token>/config.js
POST /ingest/e/
POST /ingest/i/v0/e/
POST /ingest/s/        <- session recording snapshot
```

Decoded event batches contained:

- `$pageview` with `$current_url: "/start"` (path only, no query)
- `$autocapture`
- `$dead_click`
- `$exception`

Visits covered `/start`, `/`, `/tools/chord-drill`, and a door click.

### Production browser check

Playwright (Chromium channel, normal Chrome UA,
`--disable-blink-features=AutomationControlled`) loaded `/start`, `/`, and
`/tools/chord-drill` on production.

- `fetch("/ingest/static/array.js")` from the page → **200**
- SDK ingest requests → **0**, because `NEXT_PUBLIC_POSTHOG_KEY` is unset

## What Justin must do

1. **Create a PostHog project** in US Cloud (`https://us.posthog.com`).
   The account currently has only one project, `Default project` (id `718000`),
   which the slime-bar app uses. Do not reuse its key for Piano Suite.
2. **Copy the new project's `phc_...` key** and set it in Vercel:
   - Production
   - Preview
   - local `.env.local` for development
   Then redeploy production (and preview) so the `NEXT_PUBLIC_*` value is baked
   into the client bundle.
3. **Enable these in the PostHog project settings** (client options cannot
   override project-level toggles):
   - Session recording
   - Autocapture
   - Dead clicks
   - Exception autocapture
   - Heatmaps (if not already on)
   - Session replay masking: mask all inputs (the client already sets
     `maskAllInputs: true`; the project setting is a second layer)
4. **Verify** after the redeploy:
   ```bash
   curl -i https://piano-suite.vercel.app/ingest/decide?v=3
   # 200 from PostHog, not 307
   ```
   Then load the site in a normal browser and confirm `/ingest/e/` and
   `/ingest/s/` requests return 200 in DevTools → Network.

## Notes

- The owner explicitly chose to proceed despite the legal hold in
  `IMPORTANT-NOTICES.md`. The Privacy page was updated to match the new
  collection so the site does not claim "no recordings" while recording.
- No billing changes, no social posts.
- Session recordings mask all form inputs. MIDI note data, piano keypresses,
  and practice content do not go to PostHog.
