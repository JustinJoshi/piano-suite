# Task List: Save a Copy

Source: [`docs/public-workshop-and-fork-plan.md`](../docs/public-workshop-and-fork-plan.md)
Change B. Depends on Change A — this button navigates to `/tools/workshop`.

**Goal:** a visitor on `/workshop/[id]` can save that page into their Workshop
in one click. Unsigned → localStorage only. Signed-in → `forkCustomDrill` +
localStorage using the returned `clientPageId`.

Do **not** change `convex/workshop.ts` unless a new test proves a break. The
mutation and its convex-test suite already do the server work.

Every code task is TDD: write the test, watch it fail, implement, watch it pass.

## Relevant Files

- `lib/custom-practice-storage.ts` - NEW `importPublicPage` helper
- `lib/__tests__/custom-practice-storage.test.ts` - Extend (write FIRST)
- `components/workshop/save-copy-button.tsx` - NEW
- `components/workshop/__tests__/save-copy-button.test.tsx` - RTL (write FIRST)
- `app/workshop/[id]/page.tsx` - Mount the button; attribution line
- `convex/workshop.ts` - Read only
- `convex/__tests__/workshop-sharing.test.ts` - Already covers the mutation

### Notes

- Label: **"Save a copy to my Workshop"**. Do not say "fork".
- `useWorkshopSync` never pulls for Free (`canPersist` false). A signed-in
  Free user who calls the mutation and does not write localStorage has
  forked into a black hole. The return payload is the client contract.
- Use the mutation's `clientPageId` as `PracticePage.id` when signed in so a
  later Pro sync matches. Generate a new id when unsigned.
- Remint block ids (see `duplicatePracticePage`). Unique-title the copy.
- Replace a first-run starter page in place (`isStarterPage` && one page),
  same as `selectStarterTemplate`.
- Do not add `forkedFrom` to `PracticePage` in this change. Attribution is
  a one-line link on the public view when `drill.forkedFrom` is set.
- No Playwright fork spec in this PR. CI has an empty gallery; publishing
  requires Pro. Cover the path with unit + RTL. Add e2e when official
  starter pages exist to publish.

## Tasks

- [x] B.0 Branch
  - [x] B.0.1 Land Change A first. Branch from that.

- [x] B.1 Local import helper
  - [x] B.1.1 Write tests in `custom-practice-storage.test.ts` FIRST:
        starter store → page replaced and activated; store with a real page
        → appended and activated; block ids reminted; configs copied not
        referenced; second import of the same title gets ` 2`. Expect FAIL
  - [x] B.1.2 Implement `importPublicPage`. Re-run — expect PASS

- [x] B.2 Save-copy button
  - [x] B.2.1 Write `save-copy-button.test.tsx` FIRST:
        unsigned → mutation **not** called, store written, router pushed
        to `/tools/workshop`;
        signed-in → `forkCustomDrill({ drillId })` called, store written
        with returned `clientPageId`, router pushed;
        mutation returns `null` → error "This page is no longer available.",
        store unchanged, no navigate.
        Mock `useMutation` / `useAuthAccess` / `useRouter`. Expect FAIL
  - [x] B.2.2 Implement `SaveCopyButton`. Re-run — expect PASS

- [x] B.3 Mount + attribution
  - [x] B.3.1 On `app/workshop/[id]/page.tsx`, render `SaveCopyButton` in
        the header for any loaded public drill. Ungate Copy link (a URL is
        not a secret).
  - [x] B.3.2 When `drill.forkedFrom` is set, render
        `Based on a community drill` linking to
        `/workshop/${drill.forkedFrom}` under the byline. Do not resolve
        the original author.

- [x] B.4 Gate
  - [x] B.4.1 `npm run lint && npm run test:unit:run && npm run build`
  - [x] B.4.2 Manual (local, one published page via Pro / AUTH_DISABLED):
        unsigned save → editor shows the copy after reload;
        signed-in save → Convex row exists, `isPublic` false,
        `forkedFrom` is the source, `/workshop/<new-id>` is not available.
