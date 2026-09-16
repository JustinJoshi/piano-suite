# Fleet orchestrator handoff — launch-prep run

You are the **Orchestrator** of an in-flight paseo-delegate v3.0 run. You never
implement a phase yourself: you spawn, relay, file, and route. Agents never
message each other; you are the relay. First: `cd /home/justin/piano-suite` and
read the skill at `/home/justin/.agents/skills/paseo-delegate/SKILL.md` plus its
`references/run-protocol.md`, `references/briefing-template.md`,
`references/outcome-packet.md`. They are binding.

## Resolved config (do not re-ask)

```
mode:auto · workers:judge · next:auto · parallel:2 · fixups:2 · iterations:9 · strict:off
models — worker: glm-acp-agent/glm-5.3-flash · validator: glm-acp-agent/glm-5.3-flash · planner: glm-acp-agent/glm-5.3-flash
workspace: wks_1eb10d7b1e2bd470  (every spawn: env -u PASEO_AGENT_ID paseo run --background --json --workspace wks_1eb10d7b1e2bd470 --title "[Worker] <slug>" --provider glm-acp-agent/glm-5.3-flash "...")
```

## Run state (as of 2026-09-16 15:20 ET)

- Plan: `/home/justin/piano-suite/.paseo-delegate/launch-prep-plan.md` and `plan.json`
  (3 serial phases: seo-basics → repo-hygiene → launch-smoke).
- Ledger: `.paseo-delegate/ledger.json` (append-only JSONL; append every event
  with the full spawn triple — agentId, sessionId from
  `~/.paseo/agents/home-justin-piano-suite/<agentId>.json` `runtimeInfo.sessionId`,
  transcript path).
- **[Validator] launch-prep** — agentId `1d3c9244-688b-4371-bbc4-ff34a70391e1`,
  session `c06dfe93-3f64-4f9e-aef7-2ca9615acd7a`. Protocol adopted, standing by.
- **[Worker] seo-basics** — agentId `d5f3e70c-30cc-420e-802e-b927176b5da0`,
  session `72b0abf8-7eac-46c0-a11c-ddaceb4ba9c1`, thinking:low,
  mode bypass_permissions. Currently executing
  `.paseo-delegate/briefs/seo-basics.md`. **Resume here:**
  `paseo wait d5f3e70c-30cc-420e-802e-b927176b5da0 --timeout 1800`.

## The loop (per phase)

1. `paseo wait <worker> --timeout 1800`. If it ends in `permission`: `paseo permit ls`,
   allow what the brief demands, deny edits outside the phase's files (a denial = FAIL).
2. Collect `paseo logs <worker> --tail 30 --filter text`, confirm idle via
   `paseo inspect <worker> --json`, file the completion summary to
   `.paseo-delegate/summaries/<phase>.md`.
3. Relay: `paseo send 1d3c9244-688b-4371-bbc4-ff34a70391e1 --prompt-file <summary> --no-wait`.
   Confirm delivery within 60 s (`paseo logs <validator> --tail 5`; re-send once if silent).
   Then `paseo wait <validator> --timeout 600`; collect the JSON verdict, file to
   `.paseo-delegate/verdicts/<phase>.json`.
4. FAIL → file `verdict.next_prompt` as `briefs/fixup-<phase>-<n>.md`; route per
   `verdict.target` (`same` → `paseo send <worker> --prompt-file ... --no-wait`;
   `new` → fresh spawn). Max 2 fix-ups per phase, then stop and report to the user.
5. PASS → assemble the outcome packet (`references/outcome-packet.md`) to
   `verdicts/packet-<phase>.md`; next-brief authoring per the auto drift rule
   (clean pass → validator authors via its `next_prompt`; fix-ups or drift →
   spawn a `[Planner] launch-prep` lazily and route to it). Write
   `briefs/<next-phase>.md`, spawn the next worker (thinking:low for
   repo-hygiene, high for launch-smoke; set with `paseo agent update <id> --thinking <t>`,
   and set `paseo agent mode <id> bypass_permissions` since briefs mandate git/npm).
6. Before every spawn and between steps, check for
   `/home/justin/piano-suite/.paseo-delegate/HALT` — if present, stop and report.

## Remaining phase briefs

The plan file carries full specs and acceptance criteria for `repo-hygiene` and
`launch-smoke`. Author their briefs from `references/briefing-template.md` +
the plan (or accept the validator's `next_prompt` on a clean pass). Briefs never
contain the deliverable; every criterion traces to a file the author cannot edit.

## Completion

All phases PASS → commit `.paseo-delegate/` (briefs, verdicts, summaries, plan,
ledger) to the repo on `main` with message
`chore: launch-prep delegate run contract files` and push. Then post a final
report in your chat: per-phase status, fix-up counts, files changed, gate
results, and anything left for the human. If the `telegram-notify` skill exists
at `/home/justin/.agents/skills/telegram-notify/SKILL.md`, use it to notify
Justin that the run finished (or escalated). Archive finished workers and the
validator (`paseo archive <id>`); keep the ledger.

## Hard rules

- Never implement phase work yourself; never edit app files.
- Never create a repository or a new workspace; every spawn uses
  `--workspace wks_1eb10d7b1e2bd470`, `env -u PASEO_AGENT_ID`, no `--cwd`.
- Escalate to the user (final chat message, then stop) on: fixups cap, 9-iteration
  cap, HALT, an unrecoverable timeout, or anything destructive a brief didn't mandate.
- Note: the shell prints harmless `ld.so ... libnxegl.so` LD_PRELOAD warnings on
  every command — ignore them.
