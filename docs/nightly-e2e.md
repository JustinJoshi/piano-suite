# Nightly e2e bot

The full e2e suite is slow (100+ specs against a shared Clerk dev instance), so **agents never run it during development** (see [AGENTS.md](../AGENTS.md#testing)). It is owned by two robots:

1. **GitHub CI** — full suite on every push/PR to `main` (`.github/workflows/ci.yml`).
2. **The nightly bot** — this document. Runs the suite on a schedule, and when it goes red, finds the culprit and dispatches fix agents — all unattended, on the ThinkPad.

## Schedule

A systemd **user** timer fires the script every night at 03:30 local time:

- `Persistent=true` — a run missed during suspend/off fires at next boot.
- `ConditionACPower=true` — skipped on battery (ThinkPad battery care); the next attempt is the following 03:30.
- `flock` in the script guarantees one run at a time, ever (catch-up + manual triggers can't overlap).

Unit files are versioned at [`scripts/systemd/`](../scripts/systemd/). On a new host, deploy with the installer:

```bash
scripts/nightly/install.sh      # idempotent; also upgrades
loginctl enable-linger "$USER"  # lets the timer fire while logged out
```

It copies the script and its assets to a runtime directory outside any git checkout (`~/.local/lib/piano-suite-nightly/`), installs the systemd user units, and enables the timer. The runtime copy matters: the timer executes the deployed script, so switching branches in any checkout can never change what runs at 03:30.

The host also needs: Node 22, a one-time `npx playwright install chromium`, a `.env.local` in the main checkout (Clerk/Convex keys — copied into the run worktree each night), and `gh` or git credentials to fetch `origin`.

## The pipeline

```
03:30  script starts (dedicated worktree ~/piano-suite-nightly)
         pull origin/main → npm ci (only if lockfile changed) → build
         → full suite: CI=true (prod server, 1 worker, 2 retries)
         │
      green? ──yes──▶ record last-green.sha; done
         │ no
         ▼
   bisect ONLY the failing specs (one retry per step for Clerk flake)
         │
         ▼
   spawn [Nightly] e2e-red-<date>  (zai/glm-5.3-flash, paseo foreground
   run with daemon-enforced verdict JSON; opencode fallback)
         │  reads investigator-protocol.md (runtime copy of
         │  investigate only · re-run the specs itself · never trust the
         │  bisect · flag drift (stale expectations)
         │  writes: state dir plan.md + verdict.json
         │
      verdict PASS + next_action=delegate_fix?
         │ yes
         ▼
   spawn [Nightly] e2e-fix-<date> — paseo-delegate on full auto,
   worker/validator/planner all pinned to glm-5.3-flash, working in the
   nightly worktree, committing to a branch. Never pushes to main.
         │
         ▼
   07:00 you: notification → report → review branches → merge
```

## Agent roles

| Agent | Title | Provider | Reads | Writes |
|---|---|---|---|---|
| Investigator | `[Nightly] e2e-red-<date>` | `zai/glm-5.3-flash` | [`scripts/nightly/investigator-protocol.md`](../scripts/nightly/investigator-protocol.md) | `verdict.json` (schema-enforced), `plan.md` |
| Fix orchestrator | `[Nightly] e2e-fix-<date>` | `zai/glm-5.3-flash` | paseo-delegate skill, `plan.md` | worker/validator/planner spawns in the nightly worktree |

The verdict schema ([`scripts/nightly/schemas/nightly-verdict.json`](../scripts/nightly/schemas/nightly-verdict.json)) adapts the paseo-delegate validator verdict: `verdict` PASS/FAIL, `drift` (`detected` = deliberate product change the spec never followed), `next_action` (`delegate_fix` | `escalate`). The script re-validates whatever the daemon returned — a malformed verdict degrades to a manual-triage report, never a crash.

## State and reports

Everything lands in `~/.local/state/piano-suite-nightly/`:

| File | Meaning |
|---|---|
| `report-<stamp>.log` | One per run: suite output, bisect trace, verdict, morning summary |
| `last-green.sha` | Bisect baseline — the last commit where the full suite passed |
| `verdict.json` / `plan.md` | Investigator output for the latest red run |
| `nightly.lock` | Overlap guard |

Reports end with a **morning summary** whose content depends on how far the chain got: fix executed (review branches), plan awaiting execution, escalated (inconclusive — read the verdict), or no agent verdict (manual triage prompt with the failing specs and a scoped repro command).

## Configuration

Environment overrides (set in the service unit or an env file if you ever need to move things):

| Variable | Default | Purpose |
|---|---|---|
| `NIGHTLY_REPO` | `/home/justin/piano-suite` | Main checkout (source of `.env.local`, protocol, schema) |
| `NIGHTLY_WORKTREE` | `~/piano-suite-nightly` | Dedicated run worktree — reset hard to origin/main every run |
| `NIGHTLY_STATE_DIR` | `~/.local/state/piano-suite-nightly` | Reports, baselines, verdicts |
| `NIGHTLY_E2E_PORT` | `3300` | Suite port; agents use 3310+ so they never collide |
| `NIGHTLY_AGENT_PROVIDER` | `zai/glm-5.3-flash` | Provider/model for every agent role |
| `NIGHTLY_DIR` | `<script dir>/nightly` | Where the script loads the protocol + verdict schema (deployed runtime copy) |
| `NIGHTLY_WORKSPACE_ID` | auto-resolved | paseo workspace for spawns (resolved by cwd) |
| `NIGHTLY_AGENT_TIMEOUT` / `NIGHTLY_DELEGATE_WAIT` | 3600s / 5400s | Caps so a stuck agent can't spin forever |

## Manual operations

```bash
# install or upgrade the deployed runtime + systemd units
scripts/nightly/install.sh

# run the whole thing right now (non-blocking)
systemctl --user start --no-block piano-suite-nightly.service

# watch a run
journalctl --user -u piano-suite-nightly -f
tail -f ~/.local/state/piano-suite-nightly/report-*.log

# timer health
systemctl --user list-timers piano-suite-nightly.timer
```

To test the red path without waiting for a real failure, check out a commit known to be red (e.g. anything before the `home-mobile.spec.ts` CTA fix), point `NIGHTLY_WORKTREE` at a scratch copy, and run the script by hand.

## Safety rails

- The main checkout is **never touched** — all testing, bisecting, and agent work happens in `~/piano-suite-nightly`.
- Agent commits go to branches in the nightly worktree only; **nothing pushes to `main` unattended**. The morning human reviews and merges.
- Every stage degrades gracefully: no paseo CLI → opencode; no opencode → text triage report; no bisect baseline → report without bisect. A stuck agent hits a wall-clock cap, and the run still produces its report.
