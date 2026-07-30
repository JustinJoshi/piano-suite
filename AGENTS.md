<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Direction

Piano Suite is repositioning as a **free learning community for self-taught pianists**. Docs, copy, and new features should reinforce welcome, inclusivity, and beginner success. The README and landing page speak to beginners first; deep technical history and architecture live in `docs/PROJECT_HISTORY.md`.

# Primitive Layer Conventions

This project extracts shared capabilities from the original Reflex Drill HTML apps into reusable primitives. When building or migrating practice tools, follow these rules.

## Where primitives live

| Directory | Purpose |
|-----------|---------|
| `lib/music-theory.ts` | Note names, pitch classes, chord parsing, chord building, quality definitions |
| `lib/scoring.ts` | Comparing held MIDI notes to target pitch-class sets and sequences |
| `lib/anki.ts` | Typed AnkiConnect HTTP client and helpers |
| `lib/midi-session.ts` | Tab-scoped Web MIDI session store (access, devices, held notes); survives tool-page navigation |
| `hooks/useMidi.ts` | React subscription to `midi-session`; note-on events include velocity |
| `hooks/useChladniRipple.ts` | MIDI impulses + held notes → Chladni viz props (Ripple Lab) |
| `lib/chladni-ripple.ts` | Pitch-class → mode table, octave density, velocity decay mapping |
| `hooks/useAudio.ts` | Web Audio chimes, ticks, metronome |
| `hooks/useDrillTimer.ts` | Generic drill timer state machine |
| `hooks/useAnkiSync.ts` | Poll Anki for current card and parse its chord |
| `hooks/useThemeCssVars.ts` | Read theme CSS custom properties and watch for theme changes; useful for Canvas/WebGL visuals |
| `hooks/useThemePreference.ts` | Active theme; localStorage always; Convex sync when `canPersist` (Pro) |
| `lib/experimental-features.ts` | Opt-in experimental flag (off by default); catalogs experimental tools/kinds |
| `hooks/useExperimentalFeatures.tsx` | `ExperimentalFeaturesProvider` + hook; localStorage + Convex when Pro |
| `hooks/useHeroAtmosphereKind.ts` | Welcome hero visual kind (`chladni` \| `quasiperiodic` \| `multigrid`); localStorage + Convex when Pro |
| `hooks/useHeroMultigridSettings.ts` | Home Multigrid appearance (localStorage + Convex when Pro) |
| `lib/multigrid.ts` | De Bruijn multigrid → dual rhombus tiling math |
| `lib/multigrid-hero-settings.ts` | Serializable home-hero Multigrid appearance |
| `lib/ambient-effects.ts` | Per-route ambient backgrounds + float panel settings, soft viz defaults |
| `hooks/useAmbientEffects.ts` | `AmbientEffectsProvider` + hook; localStorage always; Convex when `canPersist` |
| `components/ambient/*` | Root ambient host, renderer, background, float panel |
| `hooks/useAuthAccess.ts` | Shared Clerk gate: `canAccess` / `canPersist` (Pro `sync` or `AUTH_DISABLED`) |
| `hooks/useToolUserReady.ts` | Ensures Convex user row when signed in; ready immediately when auth is disabled |
| `components/ensure-signed-in-user.tsx` | Bootstraps Convex `users` row on Clerk sign-in (homepage settings before tools) |
| `lib/auth-disabled.ts` | Opt-in `isAuthDisabled()` (`=== "true"` only); Hobby Vercel may set temporarily (see README Deploy) |
| `lib/clerk-authorized-parties.ts` | Parse `CLERK_AUTHORIZED_PARTIES` for `clerkMiddleware` `authorizedParties` (Phase A / production) |
| `lib/billing.ts` | Clerk Billing plan/feature slugs (`pro`, `sync`) + `canPersistFromEntitlements` / `canUseFloatPanelFromEntitlements` + JWT `pla`/`fea` helpers; apply Dashboard catalog via `docs/clerk-billing-setup.md` |
| `lib/local-practice-history.ts` | Free-tier browser practice history (Reflex-compatible keys); drills write when `!canPersist` |
| `convex/lib/entitlements.ts` | `ensureUserIdWithSync` — Pro/`sync` JWT gate for tracking, technique, and settings writes |
| `hooks/useLocalPracticeHistory.ts` | Version bump when local history changes (Tracking/Technique refresh) |
| `components/pricing/*` | Public `/pricing` marketing page (Clerk `PricingTable`) |
| `app/settings/billing/page.tsx` | Signed-in plan management (Clerk `PricingTable`) |
| `lib/chat-auth.ts` | Chat API allowlist decisions (`authorizeChatAccess`) |
| `convex/lib/auth.ts` | `optionalUserId` (queries), `ensureUserId` (mutations, upserts the row), `requireUserId` (throws) |
| `proxy.ts` | Clerk route gate (Next 16 proxy convention); public-route list + `unauthenticatedUrl` redirect |
| `app/error.tsx`, `app/global-error.tsx` | Error boundaries so a thrown query cannot blank the app |
| `components/drills/drill-shell.tsx` | Shared layout wrapper for every tool page |
| `components/tools/dashboard-nav.tsx` | Dashboard drawer open state + mobile Menu button |
| `components/tools/dashboard-shell.tsx` | Shared tools/settings shell (provider + sidebar + main) |
| `lib/welcome-config.ts` | Typed copy + style-token config for the landing page and onboarding |
| `hooks/useWelcomeConfig.ts` | React hook for reading and writing `welcome-config` |
| `components/welcome/welcome-config-provider.tsx` | Context provider that persists welcome config to `localStorage` |
| `app/dev/welcome-lab/page.tsx` | Interactive lab for tuning welcome copy and style tokens |
| `lib/dev-tools.ts` | Environment helpers for `/dev/*` pages and links (currently always enabled) |
| `components/dev-tools-link.tsx` | Floating link to the dev lab |

## Welcome / onboarding conventions

1. **Keep welcome copy and style tokens in `lib/welcome-config.ts`.** Landing-page and onboarding components should read from `useWelcomeConfig()` instead of hard-coding marketing copy or style values. This makes the section easy to iterate on from `/dev/welcome-lab`.
2. **Mobile-first layout.** Hero feature cards, pillar slides, and tool grids must reflow for narrow viewports. Avoid fixed-height containers that clip content on small screens.
3. **Wrap onboarding in `WelcomeConfigProvider`.** `DashboardShell` already wraps `<Onboarding />` with the provider; new onboarding entry points should do the same.
4. **Dev lab is always enabled.** `/dev/welcome-lab` is public and reachable from any deployment so styling can be iterated without environment gating. Use `lib/dev-tools.ts` helpers rather than inlining `NODE_ENV` checks.

## Rules for tool pages

1. **Use the primitives.** Do not add new inline Web MIDI, Web Audio, or AnkiConnect code. If a tool needs behavior the primitives don't support, extend the primitive layer first. MIDI access lives in `lib/midi-session.ts` (tab-scoped); tools must use `useMidi()` rather than calling `navigator.requestMIDIAccess` themselves.
2. **Wrap every tool page in `DrillShell`.** Keep the page component thin; the actual drill logic belongs in a component under `components/drills/<tool-name>/`.
3. **Log practice events to Convex.** The `practiceEvents` and `missEvents` tables are the source of truth for tracking. Do not store drill history only in component state or localStorage.
4. **Keep Anki integration optional.** All Anki features must degrade gracefully when AnkiConnect is not running.
5. **Add unit tests for pure logic.** Chord parsing, scoring, and Anki client behavior must be tested with Vitest. Hook behavior should be tested with React Testing Library.

## Convex auth conventions

Auth helpers live in `convex/lib/auth.ts`. Do not re-implement a local `currentUserId` in new Convex modules.

1. **Queries must not throw for a signed-in user.** Use `optionalUserId(ctx)` and return a neutral value (`null`, `[]`) when it returns `null`. A signed-in user may not have a `users` row yet — that is a normal state, not an error.
2. **Mutations use `ensureUserId(ctx)`.** It creates the `users` row on first write, so a write can never lose a race with the client-side bootstrap. Use `requireUserId(ctx)` only when creating the row would be wrong.
3. **Never throw into a root provider.** `AmbientEffectsProvider` and the theme hooks query Convex from the root layout, so a thrown query error unmounts the entire app. This is exactly what caused the post-login blank page on preview deploys.
4. **Add `returns` validators** to new public queries and mutations.
5. **Cover auth edge cases with `convex-test`.** See `convex/__tests__/settings-auth.test.ts` for the no-identity / no-user-row / first-write cases.

## Naming conventions

- Pure utility files: `lib/<domain>.ts`
- React hooks: `hooks/use<CamelCase>.ts`
- Drill components: `components/drills/<kebab-case>/<PascalCase>.tsx`
- Tests: co-located in `__tests__` directories next to the code under test

## Theming conventions

The app has a token-driven theming system. **Never hard-code hex/rgb/hsl colors, raw gradients, or glow shadows in components.** Always pull colors from the theme so they switch correctly when the user changes presets.

Before making styling changes, read `DESIGN-PRINCIPLES.md` for the visual conventions (typography, spacing, surface treatments, hero graphics, dashboard layout) that should be preserved across the app.

### Where tokens live

- `app/globals.css` — the single source of truth for all color tokens.
- `lib/themes.ts` — the registry of preset themes (`amber`, `rose`, `emerald`, `ocean`, `violet`, `slate`).
- `hooks/useThemePreference.ts` — the hook for reading and setting the active theme.
- `hooks/useExperimentalFeatures.tsx` — `ExperimentalFeaturesProvider` in root layout; Theme toggle for experimental labs (Multigrid); off by default; shared so nav updates instantly.
- `app/settings/theme/page.tsx` — the user-facing theme picker + experimental features toggle.
- `app/settings/atmosphere/page.tsx` — per-route ambient backgrounds and float panel.

### Ambient effects

`AmbientEffectsProvider` in `app/layout.tsx` owns a single shared store for page backgrounds and the float panel. Use `useAmbientEffects()` — do not instantiate a second ambient store. Background ownership for Welcome (`/`) lives in `AmbientEffectsHost`; Pattern Lab **Apply to home** still writes hero param blobs and also sets the ambient `/` kind. MIDI reactivity is only wired for `chladni-ripple`. Soft ambient defaults live in `lib/ambient-effects.ts` so tools stay readable. Theme / ambient / hero Convex sync uses `canPersist` (Pro or `AUTH_DISABLED`), not merely signed-in — Free prefs stay device-local. The **float / pop-out panel** is Pro-only (`canUseFloatPanel` in `useAuthAccess`); `AmbientEffectsHost` must not mount it for Free even if localStorage still has `float.enabled`.

### Tokens you should use

| Token / utility | Purpose | Example |
|---|---|---|
| `--color-primary` / `bg-primary`, `text-primary`, `border-primary`, `ring-primary` | Main brand color (buttons, active nav, focus rings) | `bg-primary text-primary-foreground` |
| `--color-accent` / `bg-accent`, `text-accent` | Accent highlights | `text-accent` |
| `--color-background`, `--color-foreground`, `--color-card`, `--color-muted` | Surfaces and text | `bg-card text-foreground` |
| `--color-grade-again`, `--grade-hard`, `--grade-good`, `--grade-easy`, `--grade-ungraded` | Anki-style grade badges/dots | `bg-grade-good` |
| `--color-success` / `bg-success`, `text-success`, `border-success` | Positive feedback (MIDI connected, drill phase complete, success flash) | `bg-success/10 text-success` |
| `--color-destructive` / `bg-destructive`, `text-destructive` | Errors and unsupported states | `text-destructive` |
| `--hero-glow-*`, `--hero-orb-*`, `--beam-mid`, `--beam-highlight` | Hero section graphics | used by `.hero-glow`, `.hero-orb`, `.beam` |
| `--color-sidebar-background` / `bg-sidebar-background` | Dashboard sidebar | `bg-sidebar-background` |
| `--primary-glow` | Primary glow shadows | `shadow-[0_0_12px_2px_var(--primary-glow)]` |

### Adding a new preset theme

1. Add the theme id and metadata to `lib/themes.ts` (`themeIds` and `themes`).
2. Add a matching CSS class in `app/globals.css` that overrides the relevant tokens (see existing `.rose`, `.emerald`, etc.).
3. Make sure the class name matches the `id` exactly — `next-themes` applies it to `<html>`.
4. Keep `ThemeProvider` in `app/layout.tsx` wired as `themes={[...themeIds]}`. Without that list, `next-themes` only removes `light`/`dark` on switch, leftover preset classes accumulate on `<html>`, and later rules in `globals.css` win over the selected theme.

### Anti-patterns to avoid

- `bg-[#c9a227]`, `text-[#E8CF7A]`, `shadow-[0_0_12px_2px_rgba(201,162,39,0.6)]` in components.
- Inline SVG/chart strokes with raw hex strings — use `var(--color-*)` instead.
- Adding one-off Tailwind color utilities like `text-blue-500` for branded UI; use the semantic tokens.

If a component genuinely needs a color that is not covered by the existing tokens, add a new semantic token to `app/globals.css` rather than hard-coding it.

For Canvas or WebGL visuals that cannot use Tailwind utilities, read the CSS custom properties with `getComputedStyle` and use `hooks/useThemeCssVars.ts` to react to theme changes.

## Testing

- Unit tests: `npm run test:unit:run`
- E2E tests: `npm run test:e2e`
- All new primitives must have unit tests before a tool migration is considered complete.

Vitest collects specs from `lib/`, `hooks/`, `components/`, **and `convex/`**. Convex functions are tested with [`convex-test`](https://docs.convex.dev/testing/convex-test) — see `convex/__tests__/settings-auth.test.ts`, which uses `t.withIdentity()` to simulate a Clerk session and guards the auth edge cases (no identity, signed in with no `users` row, first write creating the row).

Auth E2E specs (`e2e/auth-protection.spec.ts`, `e2e/chat-auth.spec.ts`) assert real Clerk gating, so global setup **fails fast when `NEXT_PUBLIC_AUTH_DISABLED=true`** unless you set `E2E_ALLOW_AUTH_DISABLED=true`. Shared assertions live in `e2e/auth-assertions.ts` — reuse `expectRedirectedToSignIn`, `expectNotBare404`, and `expectNoApplicationError` rather than writing new URL/error checks.

## Parallel Work & Git Worktrees

**Always use a git worktree for any code change** when working on a shared local checkout. Do not edit files directly in the main worktree on `main`. Other agents may be active in parallel, and worktrees are the only reliable way to avoid file collisions. Each worktree is an independent working directory backed by the same repository.

Paths below use `$REPO_ROOT` for the main checkout (on the primary dev machine this is `~/piano-suite`; cloud agents get their own isolated clone, typically `/workspace`).

> **Cloud agents:** you already have a dedicated VM and clone, so a worktree adds nothing. Create a branch in place instead and skip this section.

### Quick setup

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
mkdir -p .worktrees

# Create a worktree + branch for the new task
git worktree add .worktrees/<your-name>-<task-name> -b <your-name>/<task-name>
cd .worktrees/<your-name>-<task-name>
```

Example:

```bash
git worktree add .worktrees/kimi-arpeggios -b kimi/arpeggios
cd .worktrees/kimi-arpeggios
```

Work inside that directory only. Commit incrementally. When done, merge the branch into `main` from the main worktree and remove the worktree:

```bash
cd "$REPO_ROOT"
git merge kimi/arpeggios
git worktree remove .worktrees/kimi-arpeggios
```

### What to avoid

- **Do not edit files directly in the main worktree on `main`.** Always create a worktree first, even if no other agent is visibly active.
- **Do not run multiple agents in the same working directory at the same time.** They will overwrite each other's edits.
- **Do not reuse branches across worktrees.** Git only allows one worktree per branch.
- **Do not leave worktrees around after merging.** Remove them with `git worktree remove` so branch names stay available.

### Hotspot files — single-writer rule

These files are touched by many features. If more than one agent edits them in parallel, expect merge conflicts:

- `convex/schema.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/tools/layout.tsx`
- `components/tools/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/*`
- `lib/music-theory.ts`
- `lib/scoring.ts`
- `package.json` / `package-lock.json`

If your task needs to change one of these, mention it explicitly before starting and coordinate with any other active agent. For dependency changes, let one agent own `package.json`/`package-lock.json` per integration batch.

### Per-tool isolation

Most new work fits cleanly inside one of these areas. Keep all related changes in the matching directories:

| Concern | Where it lives |
|---------|----------------|
| New tool page | `app/tools/<tool>/page.tsx` |
| Tool component | `components/drills/<tool>/` |
| Pure helpers | `lib/<tool>.ts` |
| Tool settings / backend | `convex/<tool>.ts` |
| Tool hook | `hooks/use<Tool>.ts` |
| Tool tests | `lib/__tests__/<tool>.test.ts`, `hooks/__tests__/use<Tool>.test.ts`, `e2e/<tool>.*.spec.ts` |

### Merge workflow

1. Finish and commit your work in the worktree.
2. From the main worktree, make sure `main` is up to date: `git pull origin main`.
3. Merge one branch at a time, rebasing the next branch onto the updated `main` before merging it.
4. Run the full gate before each merge:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   ```
5. If e2e tests cover the changed flow, run `npm run test:e2e` as well.

### Shared resources across worktrees

Worktrees isolate the working directory and Git state, but they do **not** isolate running services. Be aware of the following shared resources:

- **`npm run dev` port:** Every worktree defaults to Next.js on port `3000`. If another agent already has a dev server running, start yours on a different port:
  ```bash
  PORT=3001 npm run dev
  ```
- **Convex dev server (`npx convex dev`):** There is only one local Convex backend on port `3210` (by default). All worktrees share it. Schema migrations, seeded data, and tracked events from one worktree are visible to every other worktree. Avoid destructive migrations while other agents are testing, and coordinate if database state matters for your task.
- **`node_modules` and lockfile:** The dependency tree is shared. If your task requires adding or removing dependencies, own `package.json`/`package-lock.json` for that batch and warn other active agents.

If you need fully isolated database state, run Convex against a separate project/deployment instead of the shared local backend.

## Finishing work

When you complete a task, follow this checklist before telling the user you are done:

1. **Update `README.md` and `docs/PROJECT_HISTORY.md` as needed.** If the change affects what the app does, how to run it, or what features exist, add or update the relevant section in the README.
2. **Update `AGENTS.md` if needed.** If you introduced new conventions, primitives, or workflow rules that future agents need to know, document them here.
3. **Run the gate.** At minimum:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   ```
   Run `npm run test:e2e` if the change touches an authenticated or critical user flow.
4. **Commit with descriptive messages.** Use one commit per logical change. Message titles should describe *what* and *why*, e.g.:
   - `feat: add token-driven theme system with six presets`
   - `fix: use theme grade tokens in tracking chart instead of hard-coded hex`
   - `docs: update README and AGENTS with theming conventions`
5. **Push to GitHub.** Do not leave committed work sitting local-only unless the user explicitly asked you not to push.
   ```bash
   git push origin <branch>
   ```
6. **Open a PR when the user asks (or when finishing a feature branch).** Use `gh pr create` as usual. After `gh pr create` or a push that creates/updates a PR preview deployment:
   - Print the **Vercel Preview** URL in your reply (from the PR checks / deployments, or `gh pr view --json statusCheckRollup` / the Vercel deployment for that branch). Prefer the GitHub PR “Visit Preview” link when available.
   - Open it **once** in the user’s browser with `xdg-open <preview-url>` (or the platform equivalent). Do not keep re-opening on every follow-up message.
   - Do **not** spin up a separate local/CLI host just for PR review when a Vercel Preview already exists. If the Preview build failed, say so and link the failed deployment instead of improvising a second host.

If you are working in a git worktree, push from the worktree branch. If you are on `main` in the main worktree, push directly.

### Creating PRs from cloud / headless / Codespaces environments

`git push` may work while `gh pr create` fails with "You are not logged into any GitHub hosts." In these environments `gh` maintains its own auth state separately from git.

1. **Check for an existing token.** In GitHub Codespaces, look in `/workspaces/.codespaces/shared/.env`:
   ```bash
   grep GH_TOKEN /workspaces/.codespaces/shared/.env
   ```
   If it exists, source it before running `gh`:
   ```bash
   set -a && . /workspaces/.codespaces/shared/.env && set +a
   gh auth status
   gh pr create --base main --title "..." --body "..."
   ```

2. **If no token is available, authenticate once.** Create a GitHub personal access token with at least `contents:read` + `pull_requests:write` (or `repo` scope for classic tokens), then:
   ```bash
   gh auth login --with-token
   # paste the token, then press Enter
   gh pr create --base main --title "..." --body "..."
   ```

3. **On Termux / mobile shells,** the `gh` auth you do in the local terminal does **not** automatically reach a remote Codespace agent. Either:
   - Set `GH_TOKEN` as a Codespaces repository secret and reload the Codespace, or
   - Paste the token once into the agent session with `export GH_TOKEN=...` before running `gh pr create`.

After `gh pr create`, print the PR URL and the Vercel Preview URL once the PR checks finish.

### Cleaning up stale state

If a git command fails with an `index.lock` error, no other git process is running, and the worktree is stale, remove the lock:

```bash
rm .git/worktrees/<worktree-name>/index.lock
```

To remove ghost worktree entries after a crash:

```bash
git worktree prune
```

## Cursor Cloud specific instructions

This environment is pre-provisioned. Clerk **development** keys, the Convex client URL, and the Playwright test-user credentials (`E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD`) are injected as secrets — you do **not** need to create `.env.local` by hand or paste Clerk keys. `npx convex dev` writes the local Convex URLs to `.env.local` itself. Standard commands live in the README and `package.json` (`npm run dev`, `npm run build`, `npm run lint`, `npm run test:unit:run`, `npm run test:e2e`); this section only records the non-obvious caveats.

### Services (each in its own terminal, e.g. tmux)

- **Convex backend** — a *local anonymous* deployment on `:3210` (functions + HTTP actions on `:3211`). Start it with `npx convex dev` (see the CONVEX_DEPLOYMENT gotcha below). It also re-syncs functions after you edit anything under `convex/`.
- **Next.js** — `npm run dev` on `:3000`. Reads Clerk vars from the injected env and the Convex URL from `.env.local`.

### CONVEX_DEPLOYMENT gotcha (important)

The injected `CONVEX_DEPLOYMENT` secret is a placeholder name that does **not** match the real local deployment, which `.env.local` records as `anonymous:anonymous-workspace`. Because a process env var overrides `.env.local`, every Convex CLI command otherwise fails with a `Could not find deployment with name …` error naming the injected placeholder. Run Convex tooling with the injected vars cleared so `.env.local` wins:

```bash
unset CONVEX_DEPLOYMENT NEXT_PUBLIC_CONVEX_URL NEXT_PUBLIC_CONVEX_SITE_URL
npx convex dev
```

`NEXT_PUBLIC_CONVEX_URL` points at the same local backend either way (port `3210`), so `next dev` is unaffected — only the Convex CLI cares.

The local deployment keeps its own env vars in its sqlite state (persisted under `.convex/local/`, gitignored). `convex/auth.config.js` requires `CLERK_FRONTEND_API_URL`; if you ever start from a fresh deployment (no snapshot / empty `.convex/local`), set it once, then re-run dev:

```bash
unset CONVEX_DEPLOYMENT NEXT_PUBLIC_CONVEX_URL NEXT_PUBLIC_CONVEX_SITE_URL
npx convex env set CLERK_FRONTEND_API_URL "$CLERK_FRONTEND_API_URL"
npx convex dev
```

### Auth / MIDI / chat caveats

- **Manual Clerk sign-in does not work in an automation/headless browser** — it hits a Cloudflare bot CAPTCHA that never resolves. Exercise authenticated flows through the Playwright E2E suite instead (it uses `setupClerkTestingToken` + a backend sign-in token). `/` and `/tools/chladni` (Pattern Lab) are public and need no sign-in — use them for quick manual/UI checks.
- **MIDI drills** (`chord-drill`, `arpeggios`, `progression`, `root-cycling`, `chladni-ripple`) need Web MIDI hardware, which the VM lacks. For hardware-free verification use the Technique tracker (`/tools/technique`) or the visualization labs (`/tools/chladni`, `/tools/julia`, `/tools/lissajous`, `/tools/quasiperiodic`, `/tools/multigrid`); the E2E specs cover the drills without hardware.
- **AI chat is not configured.** No `KIMI_CODE_API_KEY` / `KIMI_CODE_BASE_URL` / `KIMI_CODE_MODEL` / `ALLOWED_CLERK_USER_ID` secrets are provided, so `/chat` and `POST /api/chat` will not function until those are added. Everything else runs normally.

### E2E browser

`npm run test:e2e` needs the Playwright Chromium browser: `npx playwright install chromium` (persists in `~/.cache/ms-playwright`, so usually already present via the snapshot). Keep `NEXT_PUBLIC_AUTH_DISABLED` unset for the auth specs.
