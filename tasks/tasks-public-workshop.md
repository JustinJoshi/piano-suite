# Task List: Public Workshop

Source: [`docs/public-workshop-and-fork-plan.md`](../docs/public-workshop-and-fork-plan.md)
Change A. Direction: [`docs/NORTH-STAR.md`](../docs/NORTH-STAR.md) theme 5
(free at the front).

**Goal:** an unsigned visitor opens `/tools/workshop` and reaches the starter
picker — no Clerk redirect, no "Sign in to create…" card, no onboarding overlay.

**Do not** change `canAccess` globally. **Do not** public-prefix `/tools`.
Marketplace must open with the workshop (`isExactOrUnder("/tools/workshop")`).

Every code task is TDD: write the test, watch it fail, implement, watch it pass.

## Relevant Files

- `lib/public-routes.ts` - NEW: `isPublicPath(pathname)` extracted from proxy.ts
- `lib/__tests__/public-routes.test.ts` - Unit matrix (write FIRST)
- `proxy.ts` - Import `isPublicPath`; drop the inline list
- `app/tools/workshop/page.tsx` - Always render `PracticePageEditor`
- `app/tools/workshop/marketplace/page.tsx` - Always render `Marketplace`
- `components/tools/onboarding/index.tsx` - Return null when unsigned
- `hooks/useAuthAccess.ts` - Read only; do not change `canAccess`
- `e2e/auth-protection.spec.ts` - Public/protected matrix
- `e2e/workshop-anonymous.spec.ts` - NEW
- `e2e/auth-assertions.ts` - Reuse helpers; no new URL/error patterns
- `docs/PROJECT_HISTORY.md` - Route table

### Notes

- `userReady = canAccess && (!canPersist || ensured)`. Unsigned ⇒
  `userReady === false`. If the page keeps the loading branch after dropping
  the sign-in card, the visitor spins forever. Delete both branches.
- `PracticePageEditor` already works unsigned (see
  `practice-page-editor.test.tsx` mocks). `useWorkshopSync` is a no-op when
  `!canPersist`.
- Unsigned e2e must use empty `storageState` like
  `auth-protection.spec.ts`'s unsigned block, and must **not** write
  `piano-suite:onboarding-completed` — the product fix is that the overlay
  does not mount.
- `/tools` stays in `PROTECTED_ROUTES`. The 307 in `next.config.ts` never
  fires for unsigned visitors because the proxy runs first.

## Tasks

- [x] A.0 Branch
  - [x] A.0.1 `git checkout -b cursor/public-workshop-<suffix>` from current
    main (or the overhaul-plan branch if this lands in the same PR)

- [x] A.1 Extract and test the public-route matrix
  - [x] A.1.1 Write `lib/__tests__/public-routes.test.ts` FIRST:
        `/tools/workshop` and `/tools/workshop/marketplace` public;
        `/tools`, `/tools/workshop-extra`, `/tools/chord-drill`,
        `/tools/chladni-ripple` not public; `/` and `/tools/chladni` still
        public. Run — expect FAIL
  - [x] A.1.2 Extract `isPublicPath` to `lib/public-routes.ts` from the
        `isPublicRoute` expression in `proxy.ts` (keep `isExactOrUnder`).
        Add `isExactOrUnder(pathname, "/tools/workshop")`. Point `proxy.ts`
        at it. Update the proxy file comment. Re-run — expect PASS

- [x] A.2 Drop the page-level sign-in cards
  - [x] A.2.1 Write page tests FIRST: workshop and marketplace render the
        editor / marketplace when `canAccess` is false. Expect FAIL
        ("Sign in to create custom practice pages.")
  - [x] A.2.2 Remove `useToolUserReady` and both gated branches from
        `app/tools/workshop/page.tsx` and
        `app/tools/workshop/marketplace/page.tsx`. Always render the child.
        Re-run — expect PASS

- [x] A.3 Skip onboarding for unsigned visitors
  - [x] A.3.1 Write `components/tools/onboarding/__tests__/onboarding.test.tsx`
        FIRST (or extend an existing one): unsigned + not completed → no
        `data-testid="onboarding-shell"`; signed-in + not completed → shell
        present. Expect FAIL
  - [x] A.3.2 In `Onboarding`, return `null` when
        `!isSignedIn && !isAuthDisabled()`. Re-run — expect PASS

- [x] A.4 E2E matrix
  - [x] A.4.1 Add `/tools/workshop` (heading "Workshop") and
        `/tools/workshop/marketplace` (heading "Marketplace") to
        `PUBLIC_ROUTES` in `e2e/auth-protection.spec.ts`. Keep `/tools` in
        `PROTECTED_ROUTES`.
  - [x] A.4.2 Write `e2e/workshop-anonymous.spec.ts`: empty storageState;
        `/tools/workshop` stays, no sign-in, no onboarding shell, starter
        picker or grid visible; Marketplace add-metronome-and-return works;
        `/tools` and `/tools/chord-drill` still redirect. Run
        `npx playwright test e2e/workshop-anonymous.spec.ts e2e/auth-protection.spec.ts`
        — expect PASS

- [x] A.5 Docs + gate
  - [x] A.5.1 Update the route table in `docs/PROJECT_HISTORY.md` and the
        proxy comment. Mention in `README.md` only if the public-route
        sentence is now wrong.
  - [x] A.5.2 `npm run lint && npm run test:unit:run && npm run build`
  - [x] A.5.3 Manual: incognito, `/` → "Enter the Workshop" → starter picker,
        no account. Time it.
