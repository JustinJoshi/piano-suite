WORKER COMPLETION SUMMARY (phase: validate-arrangement)

Worker: [Worker] validate-arrangement · claude/claude-sonnet-5 · agent 5c74ba37-56e6-4a87-95e4-6e0b46c5f516 · session 5c4affb5-fd5e-440c-906b-21fdb55ff607
Brief: .paseo-delegate/agent-surface/briefs/validate-arrangement.md
Commit: a4e871c4608c0bb76c27520e539bad41ce55ad94 (branch fleet/agent-surface)

--- RAW COMPLETION MESSAGE (verbatim) ---

STATUS: complete

SUMMARY: Created `lib/feature-blocks/validate-arrangement.ts` exporting `ArrangementResult` and `validateArrangement(blocks)`, a pure typed wrapper around `validatePageWiring`. Resolved the `unconsumed_output` dead-variant question by removing it from the `WiringIssue` union in `manifest-types.ts` — implementing it per the brief's literal definition ("a source block whose outputs no other block accepts") would falsely flag two shipped pages: marketplace seed `pentatonic-scope` and starter template `pentatonic-improv`, both of which pair a `scaleLibrary` source with a `freePlay` block that reads raw MIDI directly rather than consuming the `practiceNotes` stream. Removal was clean — `unconsumed_output` had exactly one reference in the codebase (the type definition itself) and no test referenced it.

FILES CHANGED:
- `lib/feature-blocks/validate-arrangement.ts` (new)
- `lib/feature-blocks/__tests__/validate-arrangement.test.ts` (new)
- `lib/feature-blocks/manifest-types.ts` (edit: removed `"unconsumed_output"` from `WiringIssue["issue"]`)

VERIFICATION:
```
$ npx vitest run lib/feature-blocks/__tests__/validate-arrangement.test.ts lib/feature-blocks/__tests__/wiring.test.ts lib/__tests__/page-fixtures.test.ts lib/__tests__/starter-templates.test.ts lib/feature-blocks/__tests__/registry-parity.test.ts
 Test Files  5 passed (5)
      Tests  215 passed (215)

$ npm run test:unit:run
 Test Files  148 passed (148)
      Tests  1390 passed (1390)

$ npx eslint lib/feature-blocks/validate-arrangement.ts lib/feature-blocks/__tests__/validate-arrangement.test.ts lib/feature-blocks/manifest-types.ts
(no output — clean)

$ npx tsc --noEmit -p tsconfig.json | grep -i "validate-arrangement\|WiringIssue\|unconsumed"
(no output — no errors touch this change)
```
Note: `tsc --noEmit` on the whole project surfaces pre-existing errors in unrelated files (`audio-storage.test.ts`, `custom-practice-storage.test.ts`, `feature-block-schemas.test.ts`, `registry-parity.test.ts`'s `provides`/`maxPerPage` checks, `music-player.test.ts`) that predate this change — confirmed via `git status --porcelain` showing only the 3 intended files modified.

BLOCKERS: none.

HANDOFF NOTES: `ArrangementResult` is `{status:"valid"}` or `{status:"invalid", issues: WiringIssue[]}` — the `valid` branch carries no `issues` key at all (not an empty array), so callers should discriminate on `status` rather than checking `issues.length`. `WiringIssue.issue` is now a two-member union: `"unmet_requirement" | "orphan_transform"` — `"unconsumed_output"` no longer exists, so the editor-UI phase's plain-language mapping table in the plan doc should drop that row entirely rather than trying to render it. If a future phase wants source/output-consumption feedback, it needs a new, more carefully scoped variant that accounts for blocks like `freePlay` that legitimately read MIDI directly instead of the composed stream — don't resurrect `unconsumed_output` with the same definition, it's been proven wrong against real content in `lib/marketplace-seeds.ts` and `lib/starter-templates.ts`.

--- ORCHESTRATOR NOTE ---

The worker's completion message did not include a `TOOLING NOTES:` line at all (checked the full transcript tail — it jumps from BLOCKERS straight to HANDOFF NOTES). Per your standing protocol, this makes the summary incomplete on that field; please request it from the worker (target: same, since it still has full context) before ruling, rather than assuming "none".
