# Phase 2.1: open the door

## Goal

Let a signed-out visitor open the Workshop, add a block, and keep the page
across a reload — with no account.

## Why this matters

The Workshop is the core of the product. It is currently behind a sign-in wall,
and the landing page's primary button leads straight into it.

Theme T4 in `docs/audit-2026-09/04-roadmap.md` states: *"Free, no account,
works in the browser... Every gate should have to justify itself. Today the
front door is gated and the justification is habit, not reasoning."*

The gate is not technical. `lib/custom-practice-storage.ts` persists pages to
`localStorage` for the Free tier already. Nothing needs a Convex row to build
a page.

Every other Stage 2 phase improves a page most visitors never reach. This one
is small and unblocks all of them.

## Read before you start

1. `~/.config/opencode/AGENTS.md` — Definition of Done Protocol, coding rules,
   commit-message rules. **This governs the whole phase.**
2. `AGENTS.md` at the repository root — especially "Navigation conventions",
   the `proxy.ts` note, and "Finishing work".
3. `docs/audit-2026-09/03-entry-flow-spec.md` §2 (the three doors) and §7
   (acceptance criteria 1 and 2).

## Codebase research

Verified as of `23a2f7b`.

### The gate, exactly

`proxy.ts` builds `isPublicRoute` from an explicit list. It includes `/`,
`/pricing`, `/tools/chladni`, four drill routes, `/routes`, `/terms`,
`/privacy`, `/articles`, `/dev`, `/sign-in`, `/sign-up`, `/api`, `/__clerk`,
`/marketplace`, `/workshop`.

It **omits** `/tools/workshop`, `/tools/workshop/blocks`, and `/start`.

`hooks/useAuthAccess.ts` defines the client gate:

```ts
canAccess: authDisabled || signedIn,
```

Two pages branch on it:

- `app/tools/workshop/page.tsx` renders *"Sign in to create custom practice
  pages."*
- `app/tools/workshop/blocks/page.tsx` renders *"Sign in to build your
  workshop."*

Both then call `useToolUserReady()`, whose `userReady` is
`canAccess && (!canPersist || ensured)`. For a signed-out visitor with
`canPersist === false`, `userReady` follows `canAccess` directly — so opening
`canAccess` is enough. Do not weaken the Convex bootstrap in
`hooks/useToolUserReady.ts`; it correctly no-ops when `canPersist` is false.

### The landing CTA leads into the wall

`lib/welcome-config.ts:137` sets `ctaHref: "/start"`. `/start` is not public.

`lib/welcome-config.ts:143-163` defines three doors. Two of them share a
destination:

| Door | `href` |
| --- | --- |
| `play` | `/tools/workshop` |
| `build` | `/tools/workshop` |
| `learn` | `/articles` |

`docs/audit-2026-09/03-entry-flow-spec.md` §2 specifies Play as *"a ready-made
drill running immediately"*. The four ready-made drills are already public in
`proxy.ts`: `/tools/chord-drill`, `/tools/arpeggios`, `/tools/root-cycling`,
`/tools/progression`.

### Storage already works signed out

`lib/custom-practice-storage.ts` exports `STORAGE_KEY` and the store
functions. `e2e/workshop-seed.ts` seeds it directly via `localStorage`, which
proves it needs no session.

`hooks/useWorkshopSync.ts` handles Convex sync; it is Pro-gated by
`canPersist` and must keep no-oping for Free and signed-out users.

### The e2e signed-out pattern

The `chromium` Playwright project uses `storageState: authFile`, so tests are
signed in by default. `e2e/auth-protection.spec.ts:155` shows the override:

```ts
test.use({
  storageState: { cookies: [] as never[], origins: [] as never[] },
});
```

`e2e/auth-protection.spec.ts` also holds `PROTECTED_ROUTES`, a list asserting
which routes redirect signed-out visitors to sign-in. It does not currently
list the workshop routes, so no existing assertion contradicts this change —
verify that before you edit.

## Acceptance criteria

| # | Criterion | How you verify it |
| --- | --- | --- |
| 1 | A signed-out visitor loads `/tools/workshop` and sees the editor, not a sign-in prompt. | New e2e spec, signed-out project |
| 2 | A signed-out visitor loads `/tools/workshop/blocks` and sees block cards. | Same spec |
| 3 | A signed-out visitor adds a block and it survives a page reload. | Same spec, asserting after `page.reload()` |
| 4 | A signed-out visitor loads `/start` without redirecting to `/sign-in`. | Same spec |
| 5 | The Play door and the Build door have different `href` values, and Play points at a public ready-made drill. | Unit test on `lib/welcome-config.ts` defaults |
| 6 | The Workshop header shows a non-blocking sign-in affordance for signed-out visitors and not for signed-in ones. | RTL test |
| 7 | No Convex mutation fires for a signed-out visitor building a page. | Existing `hooks/useWorkshopSync.ts` behaviour; assert `canPersist` gating in a unit test |
| 8 | Previously protected routes stay protected. | `npm run test:e2e -- e2e/auth-protection.spec.ts` still passes |
| 9 | The full gate passes. | `npm run lint && npm run test:unit:run && npm run build` |

## Implementation steps

Commit after each numbered step.

### Step 1 — Open the routes

Add three paths to the public list in `proxy.ts`:

- `/tools/workshop` (and its descendants, so `/tools/workshop/blocks` comes
  along — use the existing `isExactOrUnder` helper)
- `/start`

Follow the file's existing comment style: each addition states *why* it is
public, with the audit reference. Match the tone of the Phase 0.2 comment
already there.

Do not open `/tools/*` broadly. `/tools/technique`, `/tools/tracking`, and the
labs stay protected — `e2e/auth-protection.spec.ts` asserts that and must
keep passing.

### Step 2 — Remove the client-side wall

In `app/tools/workshop/page.tsx` and `app/tools/workshop/blocks/page.tsx`,
delete the `!canAccess` branch and render the editor and library
unconditionally.

Keep the `!userReady` loading branch. For a signed-out visitor
`userReady` is true immediately, so it costs nothing; for a signed-in Pro user
it still waits for the Convex row.

### Step 3 — Differentiate the doors

In `lib/welcome-config.ts`, change the `play` door's `href` to a public
ready-made drill and leave `build` pointing at `/tools/workshop`. Update the
two descriptions so the difference is legible without clicking.

`lib/welcome-config.ts` has a normalizer (`clampArray` / `isValidDoor`) and
existing tests. Check `components/welcome/__tests__/` before editing and keep
those green.

### Step 4 — Add the sync affordance

Add a small, dismissible, non-blocking element to the Workshop header in
`components/custom-practice/practice-page-editor.tsx` that appears only when
signed out. Say what signing in *adds*, not what it locks:

> Your pages are saved in this browser. Sign in to sync them across devices.

Requirements:

- No modal. Audit criterion 3: *"No modal blocks any route on first visit."*
- Use existing theme tokens only. No new colors — see the theming rules in
  `AGENTS.md`.
- Reuse `components/custom-practice/workshop-sync-badge.tsx` if it fits; read
  it first before adding a second component.

### Step 5 — Prove it

Create `e2e/workshop-anonymous.spec.ts`. Use the signed-out `test.use` pattern
from `e2e/auth-protection.spec.ts:155`. Cover criteria 1 through 4.

For criterion 3, drive the real UI — navigate to the block library, click the
add button, return to the Workshop, reload, assert the tile is still there. Do
not seed `localStorage` directly; that would test the store, not the door.

## Files you will touch

```
proxy.ts                                        (edit)
app/tools/workshop/page.tsx                     (edit)
app/tools/workshop/blocks/page.tsx              (edit)
lib/welcome-config.ts                           (edit)
components/custom-practice/practice-page-editor.tsx (edit)
e2e/workshop-anonymous.spec.ts                  (new)
lib/__tests__/welcome-config.test.ts            (edit or new)
```

## Files you must not touch

`hooks/useAuthAccess.ts` — changing `canAccess` would open every protected
tool at once. Open routes at the `proxy.ts` and page level instead.

Also off limits: `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`,
`app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`,
`components/ui/*`, `package.json`, `package-lock.json`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Opening `/tools/workshop` accidentally opens sibling tools | Use `isExactOrUnder` on the exact base, and re-run `e2e/auth-protection.spec.ts` |
| A signed-out visitor triggers a Convex mutation and hits an auth error | `useWorkshopSync` is `canPersist`-gated. Add criterion 7's unit test to prove it |
| `AUTH_DISABLED` masks the real behaviour during testing | Keep `NEXT_PUBLIC_AUTH_DISABLED` unset. `e2e/global.setup.ts` fails fast if it is set — do not set `E2E_ALLOW_AUTH_DISABLED` |
| The starter picker assumes a signed-in first run | Exercise the signed-out first run in the new spec and fix what breaks |

## Definition of done

Follow `~/.config/opencode/AGENTS.md` exactly:

1. Restate the 9 acceptance criteria as a checklist before coding.
2. Run each criterion and paste real output. No summaries.
3. Fix failures yourself. Stop after 3 attempts on one criterion and report.
4. Run the gate and paste output:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   ```
5. Run `npm run test:e2e` — this phase changes an authentication boundary,
   which is a critical flow. Both `e2e/auth-protection.spec.ts` and the new
   spec must pass. Report `e2e/home-mobile.spec.ts` as pre-existing if it
   fails.
6. Update `README.md` — the Workshop no longer requires an account.
7. Update `AGENTS.md`: the `proxy.ts` line describing public routes currently
   says only the drill routes and `/marketplace` are public. Correct it.
8. Update `docs/PROJECT_HISTORY.md` with the Phase 2.1 entry.
9. Commit per logical step, using the 7 commit-message rules.
10. Push the branch and open a PR. Print the Vercel preview URL once.

## Stop condition

When every criterion has passing evidence and the PR is open, **stop**.
Report completion and wait for instruction before starting the next phase.
