<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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
| `hooks/useHeroAtmosphereKind.ts` | Welcome hero visual kind (`chladni` \| `quasiperiodic`); localStorage + Convex |
| `lib/ambient-effects.ts` | Per-route ambient backgrounds + float panel settings, soft viz defaults |
| `hooks/useAmbientEffects.ts` | `AmbientEffectsProvider` + hook for ambient backgrounds / float (localStorage + Convex) |
| `components/ambient/*` | Root ambient host, renderer, background, float panel |
| `hooks/useAuthAccess.ts` | Shared Clerk gate: `canAccess` / `canPersist`, respects `NEXT_PUBLIC_AUTH_DISABLED` |
| `hooks/useToolUserReady.ts` | Ensures Convex user row when signed in; ready immediately when auth is disabled |
| `components/ensure-signed-in-user.tsx` | Bootstraps Convex `users` row on Clerk sign-in (homepage settings before tools) |
| `lib/auth-disabled.ts` | Opt-in `isAuthDisabled()` (`=== "true"` only); Hobby Vercel may set temporarily (see README Deploy) |
| `lib/chat-auth.ts` | Chat API allowlist decisions (`authorizeChatAccess`) |
| `convex/lib/auth.ts` | `optionalUserId` (queries), `ensureUserId` (mutations, upserts the row), `requireUserId` (throws) |
| `proxy.ts` | Clerk route gate (Next 16 proxy convention); public-route list + `unauthenticatedUrl` redirect |
| `app/error.tsx`, `app/global-error.tsx` | Error boundaries so a thrown query cannot blank the app |
| `components/drills/drill-shell.tsx` | Shared layout wrapper for every tool page |

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
- `app/settings/theme/page.tsx` — the user-facing theme picker.
- `app/settings/atmosphere/page.tsx` — per-route ambient backgrounds and float panel.

### Ambient effects

`AmbientEffectsProvider` in `app/layout.tsx` owns a single shared store for page backgrounds and the float panel. Use `useAmbientEffects()` — do not instantiate a second ambient store. Background ownership for Welcome (`/`) lives in `AmbientEffectsHost`; Pattern Lab **Apply to home** still writes hero param blobs and also sets the ambient `/` kind. MIDI reactivity is only wired for `chladni-ripple`. Soft ambient defaults live in `lib/ambient-effects.ts` so tools stay readable.

### Tokens you should use

| Token / utility | Purpose | Example |
|---|---|---|
| `--color-primary` / `bg-primary`, `text-primary`, `border-primary`, `ring-primary` | Main brand color (buttons, active nav, focus rings) | `bg-primary text-primary-foreground` |
| `--color-accent` / `bg-accent`, `text-accent` | Accent highlights | `text-accent` |
| `--color-background`, `--color-foreground`, `--color-card`, `--color-muted` | Surfaces and text | `bg-card text-foreground` |
| `--color-grade-again`, `--grade-hard`, `--grade-good`, `--grade-easy`, `--grade-ungraded` | Anki-style grade badges/dots | `bg-grade-good` |
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

## Parallel Work & Git Worktrees

**Always use a git worktree for any code change.** Do not edit files directly in `/home/justin/piano-suite` on `main`. Other agents may be active in parallel, and worktrees are the only reliable way to avoid file collisions. Each worktree is an independent working directory backed by the same repository.

### Quick setup

```bash
cd /home/justin/piano-suite
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
cd /home/justin/piano-suite
git merge kimi/arpeggios
git worktree remove .worktrees/kimi-arpeggios
```

### What to avoid

- **Do not edit files directly in `/home/justin/piano-suite` on `main`.** Always create a worktree first, even if no other agent is visibly active.
- **Do not run multiple agents in `/home/justin/piano-suite` at the same time.** They will overwrite each other's edits.
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

1. **Update `README.md`.** If the change affects what the app does, how to run it, or what features exist, add or update the relevant section in the README.
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

### Cleaning up stale state

If a git command fails with an `index.lock` error, no other git process is running, and the worktree is stale, remove the lock:

```bash
rm .git/worktrees/<worktree-name>/index.lock
```

To remove ghost worktree entries after a crash:

```bash
git worktree prune
```
