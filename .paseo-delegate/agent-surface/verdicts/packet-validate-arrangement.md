OUTCOME PACKET (phase 1 of 4: validate-arrangement → next: blocks-api-route)

## 1. Master plan's spec for the next phase (blocks-api-route), verbatim from the authoritative spec

Source: `/home/justin/piano-suite/.worktrees/fleet-agent-surface/docs/stage-2/phase-2.5-agent-surface/PLAN.md`

> ### Step 2 — The catalogue route
>
> Create `app/api/blocks/route.ts` and `lib/blocks-api-auth.ts`.
>
> The auth module holds a pure decision function in the shape of
> `lib/chat-auth.ts`. The route handler calls `auth()`, passes the result to the
> decision function, and returns the catalogue or the appropriate status.
>
> Document the policy in the route's doc comment: what it returns, who may call
> it, and why. `AGENTS.md` requires every API handler to authorize itself; a
> handler that decides to be public must say so explicitly.
>
> Return `describeRegistryForAgent()` output. Set cache headers appropriate to a
> catalogue that only changes on deploy.
>
> Write `lib/__tests__/blocks-api-auth.test.ts` for criterion 2.
>
> ### The authorization pattern to copy
>
> `app/api/chat/route.ts` is the reference:
>
> ```ts
> import { auth } from "@clerk/nextjs/server";
> import { authorizeChatAccess } from "@/lib/chat-auth";
> ```
>
> `lib/chat-auth.ts` keeps the decision pure and testable:
>
> ```ts
> export type ChatAuthDecision = "ok" | "unauthorized" | "forbidden";
> export function authorizeChatAccess(options: {
>   userId: string | null | undefined;
>   allowedUserId: string | undefined;
> }): ChatAuthDecision
> ```
>
> Follow that shape: a pure decision function in `lib/`, unit-tested, called by
> a thin route handler. `AGENTS.md` notes that the `AUTH_DISABLED` bypass must
> never open a paid endpoint — see `lib/chat-auth.ts` for how that is enforced.
>
> `GET /api/blocks` is different from `/api/chat`: it returns a public catalogue,
> not a paid capability. Decide the policy deliberately and write it in the
> route's doc comment. Reading the catalogue of a free, open product is a
> reasonable thing to allow; the point is that the handler states its policy
> rather than inheriting one by accident.

Acceptance criteria this phase owns (numbered per the spec's table):
1. `GET /api/blocks` returns the serialised catalogue with HTTP 200.
2. The route states and enforces an explicit authorization policy (unit test on the pure decision function, both branches).
3. The response includes every registered component with its `kind`, `accepts`, `outputs`, `requires`, and `configSpec` (test asserting the count matches `listManifests().length`).

Files this phase is expected to touch (per the spec's "Files you will touch" list): `app/api/blocks/route.ts` (new), `lib/blocks-api-auth.ts` (new), `lib/__tests__/blocks-api-auth.test.ts` (new).

Files this phase must not touch (per the spec's "Files you must not touch" list): `proxy.ts` (the `/api` gate — do not add a route-level gate there; `/api` is public by design and the handler is the enforcement point), `app/chat/page.tsx`, `app/api/chat/route.ts`, and the hotspot files (`convex/schema.ts`, `app/globals.css`, `app/layout.tsx`, `app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`, `package.json`, `package-lock.json`).

Mandatory: this is NOT the Next.js version in training data — read the relevant guide under `node_modules/next/dist/docs/` for route-handler conventions before writing `app/api/blocks/route.ts`.

## 2. Worker's completion summary for phase 1 (raw, unedited)

STATUS: complete

SUMMARY: Created `lib/feature-blocks/validate-arrangement.ts` exporting `ArrangementResult` and `validateArrangement(blocks)`, a pure typed wrapper around `validatePageWiring`. Resolved the `unconsumed_output` dead-variant question by removing it from the `WiringIssue` union in `manifest-types.ts` — implementing it per the brief's literal definition ("a source block whose outputs no other block accepts") would falsely flag two shipped pages: marketplace seed `pentatonic-scope` and starter template `pentatonic-improv`, both of which pair a `scaleLibrary` source with a `freePlay` block that reads raw MIDI directly rather than consuming the `practiceNotes` stream. Removal was clean — `unconsumed_output` had exactly one reference in the codebase (the type definition itself) and no test referenced it.

FILES CHANGED:
- `lib/feature-blocks/validate-arrangement.ts` (new)
- `lib/feature-blocks/__tests__/validate-arrangement.test.ts` (new)
- `lib/feature-blocks/manifest-types.ts` (edit: removed `"unconsumed_output"` from `WiringIssue["issue"]`)

BLOCKERS: none.

TOOLING NOTES: Every shell command in this environment prints an `ERROR: ld.so: object '.../libnxegl.so' from LD_PRELOAD cannot be preloaded` line to stderr before actual output. Harmless (NX remote-display leftover env var) but adds noise to every tool call's output.

HANDOFF NOTES: `ArrangementResult` is `{status:"valid"}` or `{status:"invalid", issues: WiringIssue[]}` — the `valid` branch carries no `issues` key at all (not an empty array). `WiringIssue.issue` is now a two-member union: `"unmet_requirement" | "orphan_transform"` — `"unconsumed_output"` no longer exists.

## 3. Validator's assessment (curated, fact-checked against the files)

PASS, no gaps. Independently re-verified in the worktree: `validateArrangement` matches the exact spec shape, is pure (relative imports only, discipline matching `target-blocks.ts`), all 5 acceptance criteria (4,5,6,7,10) confirmed with real test runs (41 test cases total, including 26 starter templates and 12 marketplace seeds, both non-empty). Full gate re-run independently: lint 0 errors, unit 1390/1390 passing, build exit 0. Provenance trailers complete and correct, commit scoped to exactly 3 files, tree clean. The `unconsumed_output` removal was spot-checked against the two real pages it would have falsely flagged (`marketplace-seeds.ts:436`, `starter-templates.ts:676`) — justified.

## 4. Validator's handoff_notes (deltas the next phase must absorb)

(1) `WiringIssue["issue"]` is now the two-member union `"unmet_requirement" | "orphan_transform"` — `unconsumed_output` no longer exists anywhere in code. (2) `ArrangementResult`'s valid branch carries no `issues` key at all (not an empty array) — discriminate on `status`, not `issues.length`. (3) **DRIFT** (see §6 below) — this affects the editor-wiring-notice phase, not this one, but the catalogue route should be aware that `WiringIssue` is a 2-member union when it serializes anything wiring-related (it likely won't, since this route returns `describeRegistryForAgent()`, not wiring issues — confirm that's still true when you read the current manifest.ts). (4) `blocks-api-route` can serialize `WiringIssue` as-is if it ever needs to; no shape change expected for this phase's actual scope (the registry catalogue, not wiring). (5) Pre-existing `tsc --noEmit` errors in unrelated test files exist and are not a regression — don't be surprised by them if you run `tsc` directly; the project gate (lint/test/build) does not surface them.

## 5. Tooling notes (verbatim, worker's own words, carried by the validator)

"Every shell command in this environment prints `ERROR: ld.so: object '/usr/NX/lib/libnxegl.so' from LD_PRELOAD cannot be preloaded (cannot open shared object file): ignored.` to stderr before actual output. Harmless (NX remote-display leftover env var) but adds noise to every tool call's output."

## 6. Drift flagged by the validator — why the planner is authoring this brief

The validator set `drift: "detected"` even though phase 1 PASSED cleanly (no fix-up rounds). The master plan/authoritative spec's own worked example (`docs/stage-2/phase-2.5-agent-surface/PLAN.md`) assumed `unconsumed_output` might remain a renderable `WiringIssue` variant referenced later in the editor-UI phase's plain-language mapping table (spec line ~192: `| unconsumed_output | Nothing on this page uses this block's output |`). Phase 1 resolved the "keep or remove" question by removing the variant entirely (justified — see §3 above). The spec doc was correctly left unedited (workers/validator are not allowed to edit it), but its editor-UI mapping table is now stale: it lists a row for a variant that no longer exists in the type.

**This packet is for the blocks-api-route phase, which does not touch that mapping table** — it's a heads-up, not an actionable requirement for this specific phase. Your job as planner: when you write the blocks-api-route brief, note this drift in its Context section so the worker doesn't get confused if they happen to grep `unconsumed_output` and find it in the spec doc's prose but nowhere in code. The *next* phase after this one (editor-wiring-notice) is the one that actually needs the stale-row correction spelled out explicitly in its own brief — please flag that requirement clearly if/when you or the validator authors that phase's brief too, since the spec doc itself cannot be corrected (it's read-only for every phase).

## 7. Ledger extract

- Phase `validate-arrangement`: 1 spawn (worker, claude/claude-sonnet-5, agent 5c74ba37-56e6-4a87-95e4-6e0b46c5f516), 0 fix-up rounds, verdict PASS, drift detected.
- Commit: `a4e871c4608c0bb76c27520e539bad41ce55ad94` on branch `fleet/agent-surface`.
- Remaining phases: `blocks-api-route` (this one, depends_on validate-arrangement — satisfied), `editor-wiring-notice` (depends_on validate-arrangement — satisfied, not yet started), `finish-gate-and-pr` (depends on all three — not started).
