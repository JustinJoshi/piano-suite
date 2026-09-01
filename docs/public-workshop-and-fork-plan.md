# Public Workshop + Save a Copy — implementation plan

Code-grounded plan for the two highest-leverage items in
[`overhaul-plan.md`](overhaul-plan.md): take the sign-in wall off the Workshop,
and wire the `forkCustomDrill` mutation that has sat unused since it shipped.

This is **not** all of Phase 1. No landing rewrite, no three-door chooser, no
sidebar collapse. Just the two changes that make "enter the Workshop" and
"save a community page" actually work.

Written: 2026-08-31. Read the cited files before editing — the naive one-line
fixes are wrong.

---

## Change A — Make the Workshop public

### What a first-time visitor actually hits today

Three gates, stacked. Opening only the first one leaves a dead end.

```
unsigned click "Enter the Workshop"
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ 1. proxy.ts                                             │
│    /tools/workshop is NOT on the public list            │
│    → auth.protect → /sign-in                            │
│    (this is the wall the hero CTA hits)                 │
└─────────────────────────────────────────────────────────┘
        │  if we only add the route to the allowlist
        ▼
┌─────────────────────────────────────────────────────────┐
│ 2. app/tools/workshop/page.tsx:16                       │
│    useToolUserReady() → canAccess                       │
│    canAccess = authDisabled || signedIn   (useAuthAccess)│
│    unsigned → "Sign in to create custom practice pages."│
│    Marketplace page has the same gate (page.tsx:59)     │
└─────────────────────────────────────────────────────────┘
        │  if we only delete that card
        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. DashboardShell → <Onboarding />                      │
│    6-slide fullscreen overlay (z-50, fixed inset-0)     │
│    until piano-suite:onboarding-completed === "true"    │
│    Pattern Lab already has this bug: /tools/chladni is  │
│    public at the proxy and still mounts the overlay.    │
└─────────────────────────────────────────────────────────┘
        │  if we skip the overlay for unsigned visitors
        ▼
   PracticePageEditor (localStorage). This already works
   unsigned — its tests mock canAccess: true, isSignedIn: false.
   useWorkshopSync is a no-op when !canPersist.
```

A fourth footgun if gate 2 is removed carelessly:

```ts
// hooks/useToolUserReady.ts
const userReady = canAccess && (!canPersist || ensured);
```

Unsigned ⇒ `canAccess === false` ⇒ `userReady === false`. If the page keeps
the `!userReady ? "Loading your account…" : <Editor />` branch, an unsigned
visitor who got past `canAccess` sits on a spinner forever.

### What to change (and what not to)

**Do not change `canAccess` itself.** It is the gate for Chord Drill, Tracking,
settings, and every other tool page. Opening it for unsigned users would
unlock those UIs the moment someone hit the URL (the proxy would still stop
them, but the meaning of the flag would be wrong).

**Do not public-prefix `/tools`.** `startsWith("/tools")` would open every
drill. Use the existing helper:

```ts
isExactOrUnder(pathname, "/tools/workshop")
```

That covers `/tools/workshop` **and** `/tools/workshop/marketplace`. The
marketplace has to be public too: the editor's Marketplace button and the `/`
shortcut both go there (`practice-page-editor.tsx:39, 192`). Leaving it
protected turns "add a block" into a sign-in wall.

**Leave `/tools` itself protected.** `next.config.ts` 307s `/tools` →
`/tools/workshop`, but the proxy runs first. An unsigned `/tools` still
redirects to sign-in and never hits the 307. That is fine — the navbar and
hero already link to `/tools/workshop` directly
(`components/navbar.tsx:16`, `lib/welcome-config.ts:123`).

### Concrete edits

| File | What |
|---|---|
| `proxy.ts` | Add `isExactOrUnder(pathname, "/tools/workshop")` to `isPublicRoute`. Update the file comment: Workshop is public because Free persistence is localStorage (`lib/custom-practice-storage.ts`); sign-in buys sync and publishing, not access. |
| `app/tools/workshop/page.tsx` | Stop gating on `canAccess` / `userReady`. Always render `<PracticePageEditor />`. Drop `useToolUserReady` from this page. |
| `app/tools/workshop/marketplace/page.tsx` | Same: always render `<Marketplace />`. The add/remove helpers already write localStorage. |
| `components/tools/onboarding/index.tsx` | Return `null` when `!isSignedIn && !authDisabled`. Unsigned visitors are not in the product yet; the deck stays for the first signed-in session (until Phase 1.7 removes it). This also unblocks public Pattern Lab. |
| `e2e/auth-protection.spec.ts` | Add `/tools/workshop` and `/tools/workshop/marketplace` to `PUBLIC_ROUTES` with a heading assert. Do **not** remove `/tools` from `PROTECTED_ROUTES`. |
| `docs/PROJECT_HISTORY.md` | Route table: `/tools/workshop`, `/tools/workshop/marketplace` → Yes. Keep `/tools` and the other `/tools/*` as No. |

Optional, worth doing because the list is currently untestable without
Playwright: extract `isPublicPath(pathname)` into `lib/public-routes.ts` and
unit-test the matrix (workshop yes, `/tools` no, `/tools/workshop-extra` no,
`/tools/chord-drill` no). `proxy.ts` imports it. Same pattern as
`lib/clerk-authorized-parties.ts`.

### What the unsigned visitor then sees

`PracticePageEditor` on a fresh store: one page titled "My Practice Page", one
`drillShortcuts` tile, and the starter picker (cannot be dismissed on first
run). That is the right first-run. Share still says "Upgrade to Pro to
publish" (`share-menu.tsx:106`) — correct, publishing is Pro. Sidebar links
to Chord Drill etc. still bounce to sign-in — acceptable for this change;
nav collapse is Phase 1.5.

### Tests (TDD)

1. **Unit** `lib/__tests__/public-routes.test.ts` (if extracted): the matrix
   above. Write first, watch it fail, then extract.
2. **RTL** workshop page: unsigned (`canAccess: false`) still renders the
   editor, not the sign-in card. Marketplace page: same.
3. **RTL** onboarding: unsigned + mounted + not completed → no
   `data-testid="onboarding-shell"`. Signed-in + not completed → shell
   present.
4. **E2E** `e2e/workshop-anonymous.spec.ts`, `storageState` empty like the
   unsigned block in `auth-protection.spec.ts`:
   - `goto /tools/workshop` → URL stays, heading "Workshop", no sign-in
     redirect, no onboarding shell, starter picker or grid visible.
   - Click Marketplace → `/tools/workshop/marketplace` stays public, add a
     metronome, back to workshop, metronome tile present.
   - `goto /tools` still redirects to sign-in (regression).
   - `goto /tools/chord-drill` still redirects to sign-in (regression).

Existing signed-in workshop specs (`e2e/workshop-grid.spec.ts`,
`e2e/workshop-marketplace.spec.ts`, `e2e/tools.spec.ts`) keep calling
`signInAsTestUser`. They should stay green without edits.

### Done when

An incognito window can land on `/`, click "Enter the Workshop", and reach
the starter picker — no account, no overlay, no "Sign in to create…" card.
Time it. Target under 20 seconds.

---

## Change B — Save a copy (`forkCustomDrill`)

### What already exists

The mutation is real, tested, and unused.

```286:335:convex/workshop.ts
export const forkCustomDrill = mutation({
  args: { drillId: v.id("customDrills") },
  // ...
  handler: async (ctx, args) => {
    const userId = await ensureUserId(ctx);  // any signed-in user, not Pro
    // returns null if source missing / not public / deleted
    // inserts a private row with forkedFrom = root original
    // returns { _id, clientPageId, title, blocks, authorName }
  },
});
```

| Fact | Where |
|---|---|
| Any signed-in user, including Free | `ensureUserId`, not `ensureUserIdWithSync` |
| Unsigned cannot call it | `ensureUserId` → `requireUserId` throws `"Not authenticated"` |
| Forks are private | `isPublic: false` — `getPublicDrill` on the new id returns null (already tested) |
| Fork chain flattens to the root | `source.forkedFrom ?? source._id` (already tested) |
| Return payload is the client contract | comment at `workshop.ts:279-284`: write this into localStorage |
| Convex tests are green | `convex/__tests__/workshop-sharing.test.ts` `describe("forkCustomDrill")` |
| **No UI imports the mutation** | repo-wide grep: only the mutation, its tests, and marketing copy |

The public view is where motivation peaks and the button is missing:

```60:71:app/workshop/[id]/page.tsx
        {canAccess && (
          <Button ... onClick={() => { void navigator.clipboard.writeText(...) }}>
            Copy link
          </Button>
        )}
```

Copy-link is gated on `canAccess` (signed-in). There is no save-a-copy
control at all. `/workshop` gallery cards are links only
(`app/workshop/page.tsx:52`). `PracticePage` has no `forkedFrom` field
(`lib/feature-blocks/types.ts:90-95`). `forkedFrom` is returned by
`getPublicDrill` and never rendered.

### The comment vs the code

The mutation comment says Free forks "land in localStorage and are
best-effort on the server." The handler always `insert`s a Convex row. That
row is invisible to Free clients because `useWorkshopSync` skips
`listCustomDrills` when `!canPersist`. So a signed-in Free user who calls
the mutation and does **not** write localStorage has forked into a black
hole: the row exists, the editor never shows it.

The return value exists specifically so the client can write the store.
That write is the work.

### Two paths, one button

Theme 5 (free at the front) and Change A together mean an unsigned visitor
can already build pages in localStorage. Requiring sign-in to save a copy
would rebuild the wall we just took down. The public drill is already on
the client via `getPublicDrill` — no mutation needed to copy blocks.

| Visitor | Server | Local store | Page id |
|---|---|---|---|
| Unsigned | none | `importPublicPage(...)` from the query payload | new `generateId()` |
| Signed-in (Free or Pro) | `forkCustomDrill` | `importPublicPage(...)` using the **returned** `clientPageId` | mutation's `clientPageId` (so a later Pro upgrade / sync matches) |

If the mutation returns `null` (source vanished), show an error, do not
write a local copy of stale data.

After a successful import: `router.push("/tools/workshop")`. The helper
sets `activePageId` to the new page, so the editor opens on the copy.

### New helper

Add to `lib/custom-practice-storage.ts` (pure, next to `duplicatePracticePage`):

```ts
importPublicPage(store, {
  id?: string;          // mutation clientPageId when signed in
  title: string;
  blocks: FeatureBlock[];
}): PracticePageStore
```

Rules, matching existing helpers:

- Remint every block `id` (same as `duplicatePracticePage:229-238`). Copied
  ids are unique within one page but collide if the user forks twice into
  the same store and we keep them.
- `uniqueTitle(store, title)` so a second save is `"Scale Practice 2"`.
- If the store is a first-run starter (`pages.length === 1` &&
  `isStarterPage(page)`), **replace** that page in place (same as
  `selectStarterTemplate` in the editor). Otherwise append.
- Set `activePageId` to the imported page.

Do not add `forkedFrom` to `PracticePage` in this change. Attribution on
the public page is enough for v1 (below). Local pages stay `{ id, title,
blocks, updatedAt }`.

### UI

New component `components/workshop/save-copy-button.tsx` (or under
`components/custom-practice/` — either is fine; it is not a drill):

- Label: **"Save a copy to my Workshop"** — Jakob's Law; nobody outside
  software says "fork".
- Always enabled for a loaded public drill. No "Sign in to save a copy"
  disabled state.
- Pending + error states. Error copy when the mutation returns `null`:
  "This page is no longer available."
- After success, navigate to `/tools/workshop`.

Mount it in `app/workshop/[id]/page.tsx` in the header next to (or
replacing the signed-in-only) Copy link. Copy link can stay, ungated — a
URL is not a secret.

Attribution, one line under the byline, only when `drill.forkedFrom` is
set:

```
Based on a community drill
```

linking to `/workshop/${drill.forkedFrom}`. Do not resolve the original
author in this change (`getPublicDrill` does not join). The `forkedFrom`
id is already on the public payload.

Gallery cards stay links-only. The detail page is the save surface.

### Mutation: leave it alone unless a test forces a change

Known gaps, none of them block the button:

- No `MAX_PAGES_PER_USER` check (upsert has one at `workshop.ts:207`).
- Blocks are copied raw; `normalizeStoredPage` is not applied.
- Title is not uniquified on the server.
- `publicDrillValidator.forkedFrom` is `v.string()`; schema is
  `v.id("customDrills")`. IDs serialize as strings; tests pass.

Do not "fix" these in the same PR unless a new test proves a break.

### Tests (TDD)

1. **Unit** `lib/__tests__/custom-practice-storage.test.ts`:
   - Import into an empty/starter store replaces the starter page.
   - Import into a store that already has a real page appends and activates.
   - Block ids are reminted; configs are copied, not referenced.
   - Duplicate titles get the ` 2` suffix.
2. **RTL** `save-copy-button.test.tsx`:
   - Unsigned: does **not** call `forkCustomDrill`; writes the store; the
     mock router is pushed to `/tools/workshop`.
   - Signed-in: calls the mutation with `drillId`; writes the store using
     returned `clientPageId`; navigates.
   - Mutation `null` → error text, store unchanged, no navigate.
3. **Convex** — already covered. Add one case only if we touch the
   mutation: no identity throws (documents the unsigned path stays
   client-side).
4. **E2E** — do **not** block this change on a Playwright fork spec. The
   gallery is empty in CI (`listPublicDrills` → `[]`); publishing requires
   Pro (`upsertCustomDrill` → `ensureUserIdWithSync`). Cover the anonymous
   workshop path in Change A's e2e. Add `e2e/workshop-fork.spec.ts` later
   when official starter pages exist to publish, or behind
   `AUTH_DISABLED` locally.

### Done when

On a machine with at least one public drill (publish one from a Pro /
`AUTH_DISABLED` session, or insert via convex-test and a local dashboard):

1. Open `/workshop/<id>` signed out. Click Save a copy. Land on
   `/tools/workshop` with that page active. Reload: still there
   (localStorage).
2. Repeat signed in. Convex `customDrills` has a private row with
   `forkedFrom` set to the source. The editor shows the same page.
   `/workshop/<new-id>` 404s / "not available" (forks are private).

---

## Order of work

Two PRs, in this order. Change A is the dependency: the fork button
navigates to `/tools/workshop`, which today is a sign-in wall.

1. **PR: public workshop** — proxy + drop the two page gates + skip
   onboarding when unsigned + tests + route-table docs.
2. **PR: save a copy** — `importPublicPage` + button + attribution line +
   tests.

Do not fold them into the landing-page / three-door work. These two
should land and stay green on their own.

The executable checklists:
[`tasks/tasks-public-workshop.md`](../tasks/tasks-public-workshop.md) and
[`tasks/tasks-save-a-copy.md`](../tasks/tasks-save-a-copy.md).
