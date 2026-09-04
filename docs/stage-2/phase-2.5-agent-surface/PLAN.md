# Phase 2.5: expose the registry to assembling agents

## Goal

Make the component registry readable by an assembling agent over HTTP, make
`validateArrangement(blocks)` the one gate every arrangement passes, and show
wiring problems inline in the editor instead of failing silently.

## Why this matters

Stage 0's stated purpose was a machine-readable specification so an AI agent
could assemble a Workshop page from verified parts. The function that does it
exists and has no caller:

```bash
grep -rn "describeRegistryForAgent" --include=*.ts --include=*.tsx . | grep -v node_modules
```

Only `lib/feature-blocks/manifest.ts` itself.

`docs/audit-2026-09/04-roadmap.md` Phase 5 gates the AI composer on the
library passing roughly fifteen blocks. At twenty, that gate is met.

The most valuable item here is the smallest. `validatePageWiring` already
exists; surfacing its output in the editor helps a human *before* any model is
involved. The same validator that stops an agent from producing a broken page
stops a person from doing it.

## Prerequisite

**Phase 2.0 must be merged first.** It fixes `requirementToStream`, without
which `validatePageWiring` reports a false `unmet_requirement` on every page
containing a MIDI connection bar. Surfacing that in the editor would show
users a permanent, wrong warning.

## Scope boundary

This phase ships the **substrate only**. No model call, no natural-language
entry point, no tool-call loop. Those stay in audit Phase 5, which warns that
an arranger over a thin library looks like a gimmick.

If you find yourself writing a prompt, you have left the scope.

## Read before you start

1. `~/.config/opencode/AGENTS.md` — Definition of Done Protocol, coding rules,
   commit-message rules. **This governs the whole phase.**
2. `AGENTS.md` at the repository root — especially the `proxy.ts` note that
   `/api` is public by design and **every `app/api/**/route.ts` handler must
   authorize itself via `auth()`**.
3. `docs/audit-2026-09/04-roadmap.md` Phase 5.

## Codebase research

Verified as of `23a2f7b`.

### What exists

`lib/feature-blocks/manifest.ts` exports:

| Function | Line | Purpose |
| --- | --- | --- |
| `describeRegistryForAgent` | 734 | Serialise every manifest to compact JSON |
| `validatePageWiring` | 673 | Return `WiringIssue[]` for a block list |
| `resolveChain` | 774 | Order sources, transforms, displays |

`WiringIssue` (`manifest-types.ts:78`):

```ts
{ blockId: string; type: string; issue: "unmet_requirement" | "unconsumed_output" | "orphan_transform"; detail: string }
```

Note that `resolveChain` returns `issues` from `validatePageWiring`, and that
`"unconsumed_output"` is declared in the type but never produced by the
current implementation. Decide whether to implement it or drop it from the
union; do not leave a dead variant.

### The authorization pattern to copy

`app/api/chat/route.ts` is the reference:

```ts
import { auth } from "@clerk/nextjs/server";
import { authorizeChatAccess } from "@/lib/chat-auth";
```

`lib/chat-auth.ts` keeps the decision pure and testable:

```ts
export type ChatAuthDecision = "ok" | "unauthorized" | "forbidden";
export function authorizeChatAccess(options: {
  userId: string | null | undefined;
  allowedUserId: string | undefined;
}): ChatAuthDecision
```

Follow that shape: a pure decision function in `lib/`, unit-tested, called by
a thin route handler. `AGENTS.md` notes that the `AUTH_DISABLED` bypass must
never open a paid endpoint — see `lib/chat-auth.ts` for how that is enforced.

`GET /api/blocks` is different from `/api/chat`: it returns a public catalogue,
not a paid capability. Decide the policy deliberately and write it in the
route's doc comment. Reading the catalogue of a free, open product is a
reasonable thing to allow; the point is that the handler states its policy
rather than inheriting one by accident.

### Where the editor renders tiles

`components/workshop-grid/workshop-tile.tsx` renders each tile and already has
a toolbar and a settings panel. `components/custom-practice/practice-page-editor.tsx`
owns `page.blocks` and passes them to `WorkshopGrid`.

`components/feature-blocks/target-block-shell.tsx` is the existing precedent
for a block telling the user it is inert — read it before designing the
notice, and match its tone.

## Acceptance criteria

| # | Criterion | How you verify it |
| --- | --- | --- |
| 1 | `GET /api/blocks` returns the serialised catalogue with HTTP 200. | Route test or `curl` against `npm run dev` |
| 2 | The route states and enforces an explicit authorization policy. | Unit test on the pure decision function, both branches |
| 3 | The response includes every registered component with its `kind`, `accepts`, `outputs`, `requires`, and `configSpec`. | Test asserting the count matches `listManifests().length` |
| 4 | `validateArrangement(blocks)` exists, is pure, and returns a typed result distinguishing valid from invalid. | Unit test |
| 5 | `validateArrangement` rejects an unknown block type, an orphan transform, and an unmet requirement. | Unit test, one case each |
| 6 | `validateArrangement` accepts every starter template and every marketplace seed. | Unit test parameterised over both |
| 7 | A page containing only `midiConnectionBar` produces zero issues. | Unit test — regression guard for the Phase 2.0 fix |
| 8 | The editor shows an inline notice on a tile with a wiring issue, naming the problem in plain language. | RTL test |
| 9 | A page with no wiring issues shows no notices. | RTL test |
| 10 | `"unconsumed_output"` is either produced by the validator or removed from the type. | `grep -rn "unconsumed_output"` and a test, or its absence |
| 11 | The full gate passes. | `npm run lint && npm run test:unit:run && npm run build` |

## Implementation steps

Commit after each numbered step.

### Step 1 — Promote the validator

Create `lib/feature-blocks/validate-arrangement.ts` exporting:

```ts
export type ArrangementResult =
  | { status: "valid" }
  | { status: "invalid"; issues: WiringIssue[] };

export function validateArrangement(blocks: FeatureBlock[]): ArrangementResult;
```

Build it on `validatePageWiring`. Keep it pure — no React, no DOM, no fetch.
It must be safe to call from a route handler and from a component.

Resolve the `"unconsumed_output"` question here (criterion 10). If you
implement it, define precisely what counts as unconsumed: a source whose
`outputs` no other block `accepts`. If you drop it, remove the variant from
`manifest-types.ts` and update the parity test.

Write `lib/feature-blocks/__tests__/validate-arrangement.test.ts` covering
criteria 4 through 7.

### Step 2 — The catalogue route

Create `app/api/blocks/route.ts` and `lib/blocks-api-auth.ts`.

The auth module holds a pure decision function in the shape of
`lib/chat-auth.ts`. The route handler calls `auth()`, passes the result to the
decision function, and returns the catalogue or the appropriate status.

Document the policy in the route's doc comment: what it returns, who may call
it, and why. `AGENTS.md` requires every API handler to authorize itself; a
handler that decides to be public must say so explicitly.

Return `describeRegistryForAgent()` output. Set cache headers appropriate to a
catalogue that only changes on deploy.

Write `lib/__tests__/blocks-api-auth.test.ts` for criterion 2.

### Step 3 — Surface issues in the editor

Compute `validateArrangement(page.blocks)` in
`components/custom-practice/practice-page-editor.tsx`, memoised on
`page.blocks`, and pass the per-block issues down through `WorkshopGrid` to
`WorkshopTile`.

Render a short inline notice on any tile with an issue. Requirements:

- Plain language, not the raw `issue` enum. Map each variant to a sentence:

  | Variant | Sentence |
  | --- | --- |
  | `unmet_requirement` | Needs a transport / a source / a MIDI input — derive from `detail` |
  | `orphan_transform` | This transform has nothing to transform. Add a source above it |
  | `unconsumed_output` | Nothing on this page uses this block's output |

- Use existing theme tokens. `--color-destructive` exists for errors, but a
  wiring issue is guidance, not a failure — prefer a muted or warning
  treatment already in the token set over introducing one.
- Do not block the user. The tile still renders and the page still saves.
  This is information, not enforcement.
- Follow the tone of `components/feature-blocks/target-block-shell.tsx`, which
  already handles "this block is inert" gracefully.

Write the RTL tests for criteria 8 and 9.

## Files you will touch

```
lib/feature-blocks/validate-arrangement.ts                  (new)
lib/feature-blocks/__tests__/validate-arrangement.test.ts   (new)
lib/blocks-api-auth.ts                                      (new)
lib/__tests__/blocks-api-auth.test.ts                       (new)
app/api/blocks/route.ts                                     (new)
components/custom-practice/__tests__/wiring-notice.test.tsx (new)

components/custom-practice/practice-page-editor.tsx         (edit)
components/workshop-grid/workshop-grid.tsx                  (edit: pass issues through)
components/workshop-grid/workshop-tile.tsx                  (edit: render the notice)
lib/feature-blocks/manifest-types.ts                        (edit, only if dropping a variant)
```

## Files you must not touch

`proxy.ts` — `/api` is already public by design and the handler is the
enforcement point. Do not add a route-level gate there.

Also off limits: `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`,
`app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`,
`components/ui/*`, `package.json`, `package-lock.json`.

Do not touch `app/chat/page.tsx` or `app/api/chat/route.ts`. Repurposing chat
into the composer is audit Phase 5, not this phase.

## Risks

| Risk | Mitigation |
| --- | --- |
| Scope creep into an actual AI composer | The scope boundary above. No prompt, no model call, no tool loop |
| The route leaks something private | The catalogue is static registry metadata with no user data. Assert that in a test: no field of the response varies by caller |
| A false wiring issue trains users to ignore notices | Criterion 7 is the regression guard. If it fails, Phase 2.0 did not land — stop and report |
| Passing issues through the grid bloats its props | Pass a `Map<blockId, WiringIssue[]>` once, not a prop per issue type |
| `validateArrangement` imports React by accident and breaks the Convex bundle | Keep it in `lib/feature-blocks/` with relative imports only, matching `target-blocks.ts` |

## Definition of done

Follow `~/.config/opencode/AGENTS.md` exactly:

1. Restate the 11 acceptance criteria as a checklist before coding.
2. Run each criterion and paste real output. No summaries. For criterion 1,
   paste the actual HTTP response, not a description of it.
3. Fix failures yourself. Stop after 3 attempts on one criterion and report.
4. Run the gate and paste output:
   ```bash
   npm run lint
   npm run test:unit:run
   npm run build
   ```
5. Run `npm run test:e2e -- e2e/chat-auth.spec.ts e2e/auth-protection.spec.ts`.
   This phase adds an API route, and those specs guard the API boundary.
6. Update `AGENTS.md`: add `lib/feature-blocks/validate-arrangement.ts` and
   `app/api/blocks/route.ts` to the primitives table, and record the wiring
   notice convention.
7. Update `README.md` and `docs/PROJECT_HISTORY.md`.
8. Commit per logical step, using the 7 commit-message rules.
9. Push the branch and open a PR. Print the Vercel preview URL once.

## Stop condition

When every criterion has passing evidence and the PR is open, **stop**.
Report completion. This is the last Stage 2 phase; summarise what Stage 2
delivered against the success criterion in `docs/stage-2/README.md` and wait
for instruction.
