# Stage 2: from specification to experience

Stage 0 wrote the component specification. Stage 1 built eight components
against it. Stage 2 makes the specification visible to people and true in the
product.

## Success criterion

One sentence governs every phase:

> A signed-out visitor, using only a keyboard, can open the Workshop,
> understand what each block does and how blocks connect, assemble a working
> practice page, and run it.

If a proposed change serves no clause of that sentence, it belongs to a later
stage.

## Phases

Complete phases **in turn**. After you finish a phase, stop and wait for
instruction before starting the next one.

| Phase | Folder | Goal | Depends on |
| --- | --- | --- | --- |
| 2.0 | [`phase-2.0-chain-runtime/`](phase-2.0-chain-runtime/PLAN.md) | Make a source's output reach a display | — |
| 2.1 | [`phase-2.1-open-door/`](phase-2.1-open-door/PLAN.md) | Let a signed-out visitor use the Workshop | — |
| 2.2 | [`phase-2.2-tier-library/`](phase-2.2-tier-library/PLAN.md) | Tier the block library by component kind | 2.0 |
| 2.3 | [`phase-2.3-keyboard-first/`](phase-2.3-keyboard-first/PLAN.md) | Make the Workshop usable without a mouse | — |
| 2.4 | [`phase-2.4-stock-shelves/`](phase-2.4-stock-shelves/PLAN.md) | Put the new blocks in front of users | 2.0, 2.2 |
| 2.5 | [`phase-2.5-agent-surface/`](phase-2.5-agent-surface/PLAN.md) | Expose the registry to assembling agents | 2.0 |

Phases 2.0, 2.1, and 2.3 touch disjoint files and may run in parallel if you
are told to. Otherwise, run them in listed order.

## Protocols every phase must follow

Read both files before starting any phase.

1. **`~/.config/opencode/AGENTS.md`** — the Definition of Done Protocol
   (6 steps), FAB's coding rules, and the 7 commit-message rules.
2. **`AGENTS.md`** at the repository root — primitive-layer conventions,
   feature-block rules, theming rules, hotspot files, worktree workflow, and
   the "Finishing work" checklist.

The Definition of Done Protocol governs. In particular:

- State acceptance criteria before you write code.
- Write the test before the fix when fixing a bug. Observe it fail, then pass.
- Show actual command output as evidence. Never claim "this works".
- Fix failures without asking. Stop after 3 failed attempts on one criterion
  and report what you tried.
- Commit and push before reporting completion.

## The gate every phase runs

```bash
npm run lint
npm run test:unit:run
npm run build
```

Paste the real output. Phases that touch a critical or authenticated flow also
run `npm run test:e2e`; each plan says whether yours does.

## Known pre-existing failure

`e2e/home-mobile.spec.ts` fails on `main` because it looks for an
"enter the workshop" CTA that does not exist in the codebase. Do not fix it as
a side effect of your phase, and do not treat it as your regression. Report it
as pre-existing if it appears.
