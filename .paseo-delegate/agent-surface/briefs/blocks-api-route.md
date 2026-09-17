# Task
Create the Workshop block-catalogue API endpoint: `app/api/blocks/route.ts` serving `GET /api/blocks`, plus `lib/blocks-api-auth.ts` (a pure authorization-decision module modelled on `lib/chat-auth.ts`) and its unit test `lib/__tests__/blocks-api-auth.test.ts`. The route states its authorization policy explicitly in a doc comment, returns `describeRegistryForAgent()` output (the serialized block registry), and sets cache headers appropriate to a catalogue that only changes on deploy. This is Step 2 ("The catalogue route") of the agent-surface plan.

# Context
You are working in the piano-suite git worktree at `/home/justin/piano-suite/.worktrees/fleet-agent-surface`, branch `fleet/agent-surface`. Start there:

```bash
cd /home/justin/piano-suite/.worktrees/fleet-agent-surface
git branch --show-current   # must print: fleet/agent-surface
```

This is phase `blocks-api-route` (phase 2 of 4) of a delegated run. Phase 1 (`validate-arrangement`, commit `a4e871c`) landed `lib/feature-blocks/validate-arrangement.ts` and removed the dead `"unconsumed_output"` variant from the `WiringIssue` union in `lib/feature-blocks/manifest-types.ts`. Your phase exposes the block registry itself as a read-only catalogue endpoint — groundwork for an external assembling agent that will describe practice pages built from these blocks.

**Drift note (background only — no action item for you):** if you grep `unconsumed_output`, you will find it in the spec doc's prose (`docs/stage-2/phase-2.5-agent-surface/PLAN.md`, the Step 3 editor mapping table) but nowhere in code. It was removed in phase 1. Your phase serializes the block registry, not `WiringIssue`, so this does not affect you. (Also from phase 1's validator: `ArrangementResult`'s valid branch carries no `issues` key — discriminate on `status`, not `issues.length` — and pre-existing `tsc --noEmit` errors in unrelated test files exist and are not a regression; the project gate does not surface them.)

**One verified discrepancy you must resolve deliberately.** The spec (Step 2) says the route returns `describeRegistryForAgent()` output, but acceptance criterion 3 requires the response to include each component's `configSpec`. As of HEAD `a4e871c`, `describeRegistryForAgent()` (`lib/feature-blocks/manifest.ts:741`) serializes only `type`, `kind`, `label`, `summary`, `justification`, `accepts`, `outputs`, `requires`, `status` — it omits `configSpec`. `configSpec` exists on every manifest (`lib/feature-blocks/manifest-types.ts:70`). Two readings satisfy the spec together; pick one and say which in your HANDOFF NOTES:

- (a) Extend `describeRegistryForAgent()` in `lib/feature-blocks/manifest.ts` to include `configSpec` (a serializer-output change only — do not alter any manifest's registered content), or
- (b) Build the response in the route from `listManifests()` directly, leaving `describeRegistryForAgent()` untouched.

Read the actual current function and manifest type yourself before deciding; do not rely on this paragraph's summary.

# Relevant files
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/docs/stage-2/phase-2.5-agent-surface/PLAN.md` — the authoritative spec. Step 2 starts at line 160; the acceptance-criteria table (rows 1–3 are yours) is at lines 120–122; "Files you will touch" / "Files you must not touch" follow line 205. This file is read-only for you.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/AGENTS.md` — binding repo conventions. Relevant here: the `proxy.ts` entry ("`/api` is public by design — every `app/api/**/route.ts` handler must authorize itself via `auth()`"), the hotspot-file list, naming conventions, testing conventions.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/chat-auth.ts` — the authorization pattern to copy: a pure, unit-tested decision function (`ChatAuthDecision`, `authorizeChatAccess`) with a doc comment explaining the policy, including how the `AUTH_DISABLED` bypass is kept away from a non-public endpoint. Read it and follow its shape; do not paste or extend it blindly — your endpoint's policy differs (see the spec: this is a public catalogue of a free product, not a paid capability, and the handler must say so explicitly rather than inherit a policy by accident).
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/app/api/chat/route.ts` — the thin route-handler reference: imports `auth` from `@clerk/nextjs/server` and the decision function from `@/lib/chat-auth`, calls `auth()`, passes the result to the decision function, maps the decision to a status. Note how `auth()` is awaited — do not assume your training data's sync signature.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/__tests__/chat-auth.test.ts` — style reference for unit-testing the pure decision function (both branches).
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/feature-blocks/manifest.ts` — `describeRegistryForAgent()` at line 741; `listManifests(kind?)` at line 647.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/lib/feature-blocks/manifest-types.ts` — `ComponentManifest` shape, incl. `configSpec: ConfigFieldSpec[]` at line 70.
- `/home/justin/piano-suite/.worktrees/fleet-agent-surface/proxy.ts` — context only, do not edit: `/api` is public at the gate by design; the route handler is the enforcement point for its own policy.
- `/home/justin/piano-suite/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` and `/home/justin/piano-suite/node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — the installed Next.js docs (16.2.12). Note: the worktree's own `node_modules` is an empty directory; the docs and deps live in the main checkout at this path.

# Output format
Three new files (plus, only if you choose discrepancy option (a), one small edit):

```
app/api/blocks/route.ts                    (new)
lib/blocks-api-auth.ts                     (new)
lib/__tests__/blocks-api-auth.test.ts      (new)
lib/feature-blocks/manifest.ts             (edit — only under option (a): serializer output gains configSpec)
```

- The auth module: a pure decision function in the shape of `lib/chat-auth.ts`, with a doc comment stating the policy.
- The route: a doc comment stating the policy — what the endpoint returns, who may call it, and why — then a thin handler: call `auth()`, pass the result to the decision function, return the catalogue (pretty-printed JSON is what `describeRegistryForAgent()` already produces) or the status the decision dictates, with cache headers suited to a deploy-time-static catalogue.
- Commit your work on `fleet/agent-surface` in a single commit scoped to exactly this phase's paths (never `git add -A` from the root), with message title describing what and why, and these trailers (fill Agent-Id / Session-Id from your spawn context; paths relative to repo root):

  ```
  Phase: blocks-api-route
  Agent-Id: <agentId>
  Session-Id: <sessionId>
  Brief: .paseo-delegate/agent-surface/briefs/blocks-api-route.md
  Verdict: .paseo-delegate/agent-surface/verdicts/blocks-api-route.json
  ```

# Tool and source guidance
- **This is not the Next.js in your training data.** Before writing `app/api/blocks/route.ts`, read the route-handler docs listed under Relevant files (`route.md` file-convention reference and the route-handlers getting-started guide) and heed deprecation notices. Verify conventions against the existing `app/api/chat/route.ts` and `app/api/webhooks/` rather than memory.
- Write incrementally. Do not pre-plan the whole artefact: auth module → its test → route → gate.
- Suggested extra assertion (straight from the spec's risk table, "the route leaks something private"): assert in a test that no field of the catalogue varies by caller — the catalogue is static registry metadata with no user data.
- Verification for criterion 1 per the spec's table: a route test or `curl` against `npm run dev`. Note the practical implication of your policy choice: an anonymous `curl` can only exercise the happy path if your stated policy allows anonymous reads; manual Clerk sign-in does not work in this environment's browsers (see AGENTS.md), so if you decide the endpoint requires a session, be explicit in HANDOFF NOTES about how you demonstrated HTTP 200.
- Run the gate before declaring done and paste real output in VERIFICATION:
  ```bash
  npm run lint
  npm run test:unit:run
  npm run build
  ```
- Tooling: every shell command here prints an `ERROR: ld.so: object '/usr/NX/lib/libnxegl.so' from LD_PRELOAD cannot be preloaded` line to stderr first — harmless noise, ignore it. If you hit any other tool/harness surprise, work around it and record it under TOOLING NOTES.

# Task boundaries
This phase does not touch:
- `proxy.ts` — do not add a route-level gate there; `/api` is public by design and the handler is the enforcement point.
- `app/chat/page.tsx`, `app/api/chat/route.ts` — the reference pattern only; repurposing chat is a later audit phase, not yours.
- Any hotspot file per AGENTS.md: `convex/schema.ts`, `app/globals.css`, `app/layout.tsx`, `app/tools/layout.tsx`, `components/tools/sidebar.tsx`, `components/navbar.tsx`, `components/ui/*`, `lib/music-theory.ts`, `lib/scoring.ts`, `package.json`, `package-lock.json`. No `npm install` / `npm ci`.
- Editor/wiring UI (`components/custom-practice/*`, `components/workshop-grid/*`) — that is the next phase's territory (`editor-wiring-notice`), not yours.
- No push, no PR — the final phase (`finish-gate-and-pr`) owns that. Commit locally on `fleet/agent-surface` and stop.
- The repository already exists inside this worktree; never create one.

# Effort budget
A moderate, self-contained slice: one route handler, one pure auth module, one test file (plus at most the one-line-ish serializer extension under option (a)). Comparable to phase 1's slice — a single focused session. If you find yourself editing editor components, grid files, or anything beyond the paths in Output format, you have left the phase; stop and report.

# Acceptance criteria
Checked by the validator against files you cannot edit — the authoritative spec (`docs/stage-2/phase-2.5-agent-surface/PLAN.md`, acceptance-criteria table rows 1–3, lines 120–122) and `AGENTS.md`:

- [ ] 1. `GET /api/blocks` returns the serialised catalogue with HTTP 200. (Spec criterion 1, PLAN.md line 120.)
- [ ] 2. The route states and enforces an explicit authorization policy — the policy is written in the route's doc comment, the decision lives in a pure function in `lib/blocks-api-auth.ts` following the `lib/chat-auth.ts` shape, and a unit test covers both branches of the decision. (Spec criterion 2, PLAN.md line 121; `AGENTS.md` rule that every `app/api/**/route.ts` handler authorizes itself via `auth()` and says so explicitly if public.)
- [ ] 3. The response includes every registered component with its `kind`, `accepts`, `outputs`, `requires`, and `configSpec` — a test asserts the component count matches `listManifests().length`. (Spec criterion 3, PLAN.md line 122.)

# Constraints
- Must-preserve: `lib/chat-auth.ts` and `app/api/chat/route.ts` behave exactly as before (they are your pattern, not your subject); the block registry's registered content is unchanged — any `manifest.ts` edit is confined to what `describeRegistryForAgent()` serializes, and the full gate must stay green (the registry-parity test guards registry invariants).
- The route must not embed secrets, user data, or per-caller state in the catalogue body.
- A brief gave you pointers, not the answer: read the pattern files and write your own code.
- The finishing checklist in `AGENTS.md` (README/`PROJECT_HISTORY`/AGENTS updates, push, PR) does **not** apply to this phase — the final phase of the run owns it. Do not push.
- Leave the whole repository clean: `git status --porcelain` empty after your commit, no stray files anywhere in the worktree.

# Completion contract
Your final chat message must be your completion summary:

```
STATUS: complete|blocked|failed
SUMMARY: ...
FILES CHANGED: ...
VERIFICATION: ...
BLOCKERS: ...
TOOLING NOTES: ...
HANDOFF NOTES: ...
```

`TOOLING NOTES:` is mandatory even when empty — write `TOOLING NOTES: none`. It is for defects, surprises and workarounds in the **tools** (checker, harness, CLI), distinct from this phase's own work. Do not omit the line: a prior worker in this run left it out and had to be asked separately.

`HANDOFF NOTES:` must state which resolution of the `configSpec` discrepancy you chose — (a) serializer extended in `manifest.ts`, or (b) route builds the catalogue from `listManifests()` directly — plus anything the next phase (`editor-wiring-notice`) must absorb.
