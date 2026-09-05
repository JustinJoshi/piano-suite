#!/usr/bin/env bash
# Nightly full-e2e owner. Agents never run the full suite (AGENTS.md); this
# script does, on a schedule (piano-suite-nightly.timer). On red it bisects
# the failing specs to the culprit commit, spawns a glm-5.3-flash
# investigator agent ([Nightly] e2e-red-<date>) to verify the root cause and
# author a phased fix plan, then — when the verdict allows it — hands the
# plan to paseo-delegate on full auto (worker/validator/planner, all
# glm-5.3-flash). Opencode is the fallback harness if the paseo CLI is
# unavailable. Nothing pushes to main; the morning human reviews.
#
# Runs in a dedicated worktree (default ~/piano-suite-nightly) so the main
# checkout — and any agent working in it — is never touched, even mid-bisect.
#
# State/logs: ${NIGHTLY_STATE_DIR:-~/.local/state/piano-suite-nightly}/
#   last-green.sha   last commit where the full suite passed
#   report-*.log     one per run: result, culprit commit, verdict, handoff
#   verdict.json     investigator verdict for the latest red run (schema:
#                    scripts/nightly/schemas/nightly-verdict.json in-repo)
#   plan.md          investigator-authored phased fix plan for the latest red

set -u

REPO="${NIGHTLY_REPO:-/home/justin/piano-suite}"
WORKTREE="${NIGHTLY_WORKTREE:-/home/justin/piano-suite-nightly}"
STATE_DIR="${NIGHTLY_STATE_DIR:-$HOME/.local/state/piano-suite-nightly}"
PORT="${NIGHTLY_E2E_PORT:-3300}"
BRANCH="main"
GREEN_FILE="$STATE_DIR/last-green.sha"
# The investigator + every delegate role run glm-5.3-flash only (user
# constraint). PASEO_PROVIDER uses paseo's provider/model form.
PASEO_PROVIDER="${NIGHTLY_AGENT_PROVIDER:-zai/glm-5.3-flash}"
OPENCODE_MODEL="${NIGHTLY_AGENT_PROVIDER#*/}"
# Workspace the spawned agents attach to (paseo workspace ls). Env-overridable
# in case the workspace is ever recreated.
WORKSPACE_ID="${NIGHTLY_WORKSPACE_ID:-}"
DELEGATE_WAIT="${NIGHTLY_DELEGATE_WAIT:-5400}"
AGENT_TIMEOUT="${NIGHTLY_AGENT_TIMEOUT:-3600}"

export PATH="/home/justin/.nvm/versions/node/v22.18.0/bin:/usr/local/bin:/usr/bin:/bin"

mkdir -p "$STATE_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
REPORT="$STATE_DIR/report-$STAMP.log"

# One run at a time, ever (timer catch-up + manual triggers can overlap).
exec 9>"$STATE_DIR/nightly.lock"
if ! flock -n 9; then
  echo "nightly-e2e: another run is already active; exiting." >&2
  exit 0
fi

log() { printf '%s %s\n' "$(date +%H:%M:%S)" "$*" | tee -a "$REPORT"; }
notify() { command -v notify-send >/dev/null && notify-send -a nightly-e2e "$@"; }

# ── worktree: create once, then reset hard to origin/main each run ──────────
if [ ! -d "$WORKTREE/.git" ] && [ ! -f "$WORKTREE/.git" ]; then
  log "creating dedicated worktree at $WORKTREE"
  git -C "$REPO" worktree add --detach "$WORKTREE" >/dev/null || exit 1
fi
git -C "$WORKTREE" fetch origin "$BRANCH" >>"$REPORT" 2>&1 || exit 1
git -C "$WORKTREE" reset --hard "origin/$BRANCH" >>"$REPORT" 2>&1 || exit 1
git -C "$WORKTREE" clean -fdx >>"$REPORT" 2>&1
HEAD_SHA="$(git -C "$WORKTREE" rev-parse HEAD)"
log "testing origin/$BRANCH at $HEAD_SHA"

# The dedicated worktree has no .env.local (gitignored). Playwright's config
# loads it for Clerk/Convex keys; copy from the main checkout each run.
cp "$REPO/.env.local" "$WORKTREE/.env.local" 2>/dev/null || log "WARN: no .env.local in $REPO"

# ── deps + build ─────────────────────────────────────────────────────────────
cd "$WORKTREE" || exit 1
LOCK_BLOB="$(git rev-parse HEAD:package-lock.json)"
if [ ! -d node_modules ] || [ "$LOCK_BLOB" != "$(cat "$STATE_DIR/lock-blob" 2>/dev/null)" ]; then
  log "npm ci (lockfile changed or fresh node_modules)"
  npm ci >>"$REPORT" 2>&1 || { log "FAIL: npm ci"; notify "nightly e2e: npm ci failed"; exit 1; }
  echo "$LOCK_BLOB" >"$STATE_DIR/lock-blob"
else
  log "deps up to date (lockfile unchanged)"
fi

log "building"
npm run build >>"$REPORT" 2>&1 || { log "FAIL: build"; notify "nightly e2e: build failed at $HEAD_SHA"; exit 1; }

# ── full suite ───────────────────────────────────────────────────────────────
# CI=true matches GitHub CI semantics: prod server (npm run start), 1 worker,
# 2 retries per test.
log "running full e2e suite"
CI=true E2E_PORT=$PORT PORT=$PORT ./node_modules/.bin/playwright test >>"$REPORT" 2>&1
STATUS=$?

if [ $STATUS -eq 0 ]; then
  echo "$HEAD_SHA" >"$GREEN_FILE"
  log "PASS: full suite green at $HEAD_SHA"
  exit 0
fi

log "FAIL: full suite red (exit $STATUS)"
notify "nightly e2e FAILED" "bisecting…"

# ── red path: bisect only the failing specs ─────────────────────────────────
FAILED_SPECS="$(grep -E '^\s+[0-9]+\) ' "$REPORT" | sed -E 's/^\s+[0-9]+\) \[[^]]*\] //; s/^\s+[0-9]+\) //' | sort -u | tr '\n' ' ')"
if [ -z "$FAILED_SPECS" ]; then
  FAILED_SPECS="$(grep -oE 'e2e/[A-Za-z0-9._-]+\.spec\.ts' "$REPORT" | sort -u | tr '\n' ' ')"
fi
if [ -z "$FAILED_SPECS" ]; then
  log "could not identify failing specs from the log; no bisect. See $REPORT"
  notify "nightly e2e FAILED" "no bisect — see report"
  exit 1
fi
log "failing specs: $FAILED_SPECS"

LAST_GREEN="$(cat "$GREEN_FILE" 2>/dev/null || true)"
if [ -z "$LAST_GREEN" ]; then
  log "no last-green baseline recorded yet; skipping bisect. See $REPORT"
  notify "nightly e2e FAILED" "no baseline — see report"
  exit 1
fi

if git -C "$WORKTREE" merge-base --is-ancestor "$LAST_GREEN" "$HEAD_SHA" 2>/dev/null; then
  GOOD="$LAST_GREEN"
else
  GOOD="$(git -C "$WORKTREE" merge-base "$LAST_GREEN" "$HEAD_SHA")"
  log "last green $LAST_GREEN is not an ancestor (force-push/rebase?); bisecting from merge-base $GOOD"
fi

log "bisecting $GOOD..$HEAD_SHA on specs: $FAILED_SPECS"
git -C "$WORKTREE" bisect start "$HEAD_SHA" "$GOOD" >>"$REPORT" 2>&1

# One retry per step: the shared Clerk dev instance throws occasional
# false failures (AGENTS.md notes 8s+ FAPI degradation under load).
# git bisect run cannot reliably see exported shell functions, so the step
# lives in a small script; bisect runs it with cwd = the worktree root.
STEP="$STATE_DIR/bisect-step.sh"
cat >"$STEP" <<'STEP_EOF'
#!/usr/bin/env bash
set -u
for attempt in 1 2; do
  npm ci --silent >>"$REPORT" 2>&1 || { [ "${attempt}" -eq 1 ] && sleep 30; continue; }
  npm run build >>"$REPORT" 2>&1 || { [ "${attempt}" -eq 1 ] && sleep 30; continue; }
  CI=true E2E_PORT=$PORT PORT=$PORT ./node_modules/.bin/playwright test $FAILED_SPECS >>"$REPORT" 2>&1 && exit 0
  [ "${attempt}" -eq 1 ] && sleep 30
done
exit 1
STEP_EOF
chmod +x "$STEP"
export REPORT PORT FAILED_SPECS

if git -C "$WORKTREE" bisect run "$STEP" >>"$REPORT" 2>&1; then
  CULPRIT="$(git -C "$WORKTREE" rev-parse refs/bisect/bad 2>/dev/null || git -C "$WORKTREE" rev-parse HEAD)"
else
  CULPRIT=""
fi
git -C "$WORKTREE" bisect reset >>"$REPORT" 2>&1 || true

# ── red path: investigator agent ────────────────────────────────────────────
# paseo's --output-schema cannot combine with --background (the daemon waits
# and enforces the JSON itself), so the investigator runs foreground: spawn,
# wait, and schema enforcement are one command. bypass_permissions is what
# paseo's own delegate workers use for unattended runs.
PROTOCOL_SRC="$REPO/scripts/nightly/investigator-protocol.md"
SCHEMA_SRC="$REPO/scripts/nightly/schemas/nightly-verdict.json"
VERDICT_JSON="$STATE_DIR/verdict.json"
PLAN_PATH="$STATE_DIR/plan.md"
if [ ! -f "$PROTOCOL_SRC" ] || [ ! -f "$SCHEMA_SRC" ]; then
  log "investigator assets missing in $REPO; skipping agent stage"
  PROTOCOL_SRC=""
fi

resolve_workspace() {
  if [ -n "$WORKSPACE_ID" ]; then return; fi
  WORKSPACE_ID="$(paseo workspace ls --json 2>/dev/null | python3 -c 'import json,sys; print(next((w["workspaceId"] for w in json.load(sys.stdin) if w.get("cwd")=="'"$REPO"'"), ""))' 2>/dev/null || true)"
}

if [ -n "$PROTOCOL_SRC" ]; then
  mkdir -p "$STATE_DIR/schemas"
  cp "$SCHEMA_SRC" "$STATE_DIR/schemas/nightly-verdict.json"
  rm -f "$VERDICT_JSON"
  cat >"$STATE_DIR/verdict-prompt.txt" <<VERDICT_PROMPT_EOF
cd $WORKTREE
Read $PROTOCOL_SRC and execute it as the nightly investigator.

Run stamp: $STAMP
Tested SHA (origin/$BRANCH): $HEAD_SHA
Culprit SHA from the bot's bisect: ${CULPRIT:-inconclusive}
Failing specs: $FAILED_SPECS
Report (bot log): $REPORT
State dir (write plan.md and verdict.json here): $STATE_DIR
Schemas dir: $STATE_DIR/schemas

Investigate only: verify the root cause yourself (re-run the failing specs
on your own ports, e.g. CI=true E2E_PORT=3310 PORT=3310 ./node_modules/.bin/playwright test $FAILED_SPECS —
never the full suite), author the phased fix plan, and write exactly one
JSON verdict to $VERDICT_JSON. Do not fix anything.
VERDICT_PROMPT_EOF
  if command -v paseo >/dev/null; then
    resolve_workspace
    log "spawning investigator (paseo, $PASEO_PROVIDER, title '[Nightly] e2e-red-$STAMP')"
    VERDICT_RAW="$(cd "$STATE_DIR" && env -u PASEO_AGENT_ID timeout "$AGENT_TIMEOUT" paseo run --json --mode bypass_permissions ${WORKSPACE_ID:+--workspace "$WORKSPACE_ID"} --title "[Nightly] e2e-red-$STAMP" --provider "$PASEO_PROVIDER" --output-schema "$STATE_DIR/schemas/nightly-verdict.json" "$(cat "$STATE_DIR/verdict-prompt.txt")" 2>"$STATE_DIR/spawn.err")"
    SPAWN_RC=$?
    if [ $SPAWN_RC -ne 0 ]; then
      log "WARN: investigator run exited $SPAWN_RC: $(head -c 300 "$STATE_DIR/spawn.err" 2>/dev/null)"
    fi
    # Authoritative source: the daemon's schema-enforced stdout; fall back to
    # the file the agent was told to write. Re-validated either way.
    if [ -z "$VERDICT_RAW" ] && [ -f "$VERDICT_JSON" ]; then
      VERDICT_RAW="$(cat "$VERDICT_JSON")"
    fi
  elif command -v opencode >/dev/null; then
    log "paseo CLI missing — investigator via opencode harness, model $OPENCODE_MODEL"
    timeout "$AGENT_TIMEOUT" opencode run -m "$OPENCODE_MODEL" "$(cat "$STATE_DIR/verdict-prompt.txt")" >>"$REPORT" 2>&1 || log "WARN: opencode investigator exited nonzero"
    [ -f "$VERDICT_JSON" ] && VERDICT_RAW="$(cat "$VERDICT_JSON")"
  else
    log "no paseo or opencode CLI found; skipping investigator"
  fi

  # Validate the verdict: exactly one JSON object, schema-conformant
  # (stdlib json only — no jq on this host).
  printf '%s' "${VERDICT_RAW:-}" >"$STATE_DIR/verdict-raw.json"
  VERDICT="$(python3 - "$STATE_DIR/verdict-raw.json" "$STATE_DIR/schemas/nightly-verdict.json" <<'PY_EOF'
import json, sys
raw = open(sys.argv[1]).read()
try:
    v = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
except Exception:
    sys.exit(0)
required = {"run","tested_sha","culprit_sha","verdict","root_cause","evidence",
            "plan_path","drift","next_action","next_prompt"}
enums = {"verdict": {"PASS","FAIL"}, "drift": {"none","detected"},
         "next_action": {"delegate_fix","escalate"}}
if (isinstance(v, dict) and set(v) == required
        and all(v[k] in allowed for k, allowed in enums.items())
        and isinstance(v["evidence"], list)
        and all(isinstance(x, str) for x in v["evidence"])
        and all(isinstance(v[k], str) for k in required - {"evidence"})):
    print(json.dumps(v))
PY_EOF
)"
  if [ -n "$VERDICT" ]; then
    printf '%s' "$VERDICT" >"$VERDICT_JSON"
    V_VERDICT="$(printf '%s' "$VERDICT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["verdict"])')"
    V_ACTION="$(printf '%s' "$VERDICT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["next_action"])')"
    V_DRIFT="$(printf '%s' "$VERDICT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["drift"])')"
    V_CULPRIT="$(printf '%s' "$VERDICT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["culprit_sha"])')"
    log "investigator verdict: $V_VERDICT (next_action=$V_ACTION drift=$V_DRIFT)"
  else
    log "WARN: no schema-valid verdict (stdout or $VERDICT_JSON)"
  fi
fi

# ── red path: full-auto paseo-delegate (gated on the verdict) ────────────────
if [ "${V_VERDICT:-}" = "PASS" ] && [ "$V_ACTION" = "delegate_fix" ] && [ -f "$PLAN_PATH" ]; then
  if command -v paseo >/dev/null; then
    resolve_workspace
    mkdir -p "$WORKTREE/.paseo-delegate"
    printf '# Nightly red-run fix plan\n\nExecuted via paseo-delegate on full auto.\n\n# Task\nRead %s and execute every phase it defines, in order, with no questions.\n' "$PLAN_PATH" >"$WORKTREE/.paseo-delegate/plan"
    log "handing plan to paseo-delegate on full auto (all roles $PASEO_PROVIDER; worktree $WORKTREE)"
    {
      echo "cd $WORKTREE"
      echo "Run the paseo-delegate skill (.claude/skills/paseo-delegate) on full auto: plan $WORKTREE/.paseo-delegate/plan, full auto, strict, ${WORKSPACE_ID:+workspace $WORKSPACE_ID, }worker-provider $PASEO_PROVIDER, validator-provider $PASEO_PROVIDER, planner-provider $PASEO_PROVIDER. cd $WORKTREE first. Never push to main."
    } >"$STATE_DIR/delegate-prompt.txt"
    DELEGATE_OUT="$(cd "$WORKTREE" && env -u PASEO_AGENT_ID timeout 120 paseo run --background --json --mode bypass_permissions ${WORKSPACE_ID:+--workspace "$WORKSPACE_ID"} --title "[Nightly] e2e-fix-$STAMP" --provider "$PASEO_PROVIDER" "$(cat "$STATE_DIR/delegate-prompt.txt")" 2>"$STATE_DIR/spawn-delegate.err")"
    DELEGATE_ID="$(printf '%s' "$DELEGATE_OUT" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin)
except Exception:
    sys.exit(1)
print(d.get("agentId") or d.get("id") or "")' 2>/dev/null || true)"
    if [ -n "$DELEGATE_ID" ]; then
      log "delegate orchestrator spawned: $DELEGATE_ID — waiting up to ${DELEGATE_WAIT}s"
      timeout "$DELEGATE_WAIT" paseo wait "$DELEGATE_ID" --timeout "$DELEGATE_WAIT" >>"$REPORT" 2>&1 || log "WARN: delegate wait ended (timeout or error); run may still be executing"
      paseo logs "$DELEGATE_ID" --tail 40 --filter text >>"$REPORT" 2>&1 || true
    else
      log "WARN: delegate orchestrator spawn failed: $(head -c 300 "$STATE_DIR/spawn-delegate.err" 2>/dev/null)"
    fi
  else
    log "verdict allows a delegate run but the paseo CLI is missing; plan awaits manual execution"
  fi
elif [ -n "${VERDICT:-}" ]; then
  log "delegated fix not started (verdict $V_VERDICT, next_action $V_ACTION)"
fi

# ── final report ─────────────────────────────────────────────────────────────
CULPRIT_SUBJECT="" ; [ -n "$CULPRIT" ] && CULPRIT_SUBJECT="$(git -C "$WORKTREE" log -1 --format=%s "$CULPRIT" 2>/dev/null)"
if [ -n "$CULPRIT" ] && [ -n "$V_CULPRIT" ] && [ "$CULPRIT" != "$V_CULPRIT" ]; then
  BISECT_NOTE="bot bisect said $CULPRIT ($CULPRIT_SUBJECT); investigator attributed $V_CULPRIT instead"
elif [ -n "$CULPRIT" ] && [ -z "$V_CULPRIT" ] && [ -n "$V_VERDICT" ]; then
  BISECT_NOTE="bot bisect said $CULPRIT ($CULPRIT_SUBJECT); investigator could not confirm it"
else
  BISECT_NOTE=""
fi

{
  echo ""
  echo "════════ NIGHTLY RESULT ════════"
  echo "date:        $(date -Iseconds)"
  echo "tested:      $HEAD_SHA (origin/$BRANCH)"
  echo "last green:  $LAST_GREEN"
  echo "failing specs: $FAILED_SPECS"
  if [ -n "$CULPRIT" ]; then
    echo "bisect culprit: $CULPRIT"
    git -C "$WORKTREE" show --stat --no-color "$CULPRIT"
  else
    echo "bisect culprit: inconclusive (skipped/untestable commits) — see log above"
  fi
  echo ""
  echo "── investigator ([Nightly] e2e-red-$STAMP) ──"
  if [ -n "$VERDICT" ]; then
    printf 'verdict: %s   next_action: %s   drift: %s\n' "$V_VERDICT" "$V_ACTION" "$V_DRIFT"
    printf 'verified culprit: %s\n' "${V_CULPRIT:-unattributed}"
    [ -n "$BISECT_NOTE" ] && echo "note: $BISECT_NOTE"
    printf '%s\n' "$VERDICT" | python3 -c 'import json,sys; v=json.load(sys.stdin); print("root cause:", v["root_cause"]); [print("  evidence:", e) for e in v["evidence"]]; print("next:", v["next_prompt"])'
    echo "verdict json: $VERDICT_JSON"
  elif [ -n "${PROTOCOL_SRC:-}" ]; then
    echo "no schema-valid verdict — investigator output unusable; triage manually from the log above"
  else
    echo "investigator stage skipped (missing assets or harness)"
  fi
  echo ""
  echo "── morning summary ──"
  if [ "${V_VERDICT:-}" = "PASS" ] && [ "$V_ACTION" = "delegate_fix" ] && [ -f "$PLAN_PATH" ]; then
    echo "Red run → bisected → investigated → full-auto fix executed by delegate workers in $WORKTREE."
    echo "Review: check the [Nightly] agents in paseo, their branches, and open/merge the PR."
  elif [ "${V_VERDICT:-}" = "PASS" ]; then
    echo "Red run → bisected → investigated. Verified plan at $PLAN_PATH awaits execution (paseo-delegate on full auto)."
  elif [ -n "${VERDICT:-}" ]; then
    echo "Red run → investigation inconclusive (escalated). Read $VERDICT_JSON and $REPORT."
  else
    echo "Red run → no agent verdict. Triage prompt: run ONLY the failing specs on your own port"
    echo "(CI=true E2E_PORT=3310 PORT=3310 ./node_modules/.bin/playwright test $FAILED_SPECS); never the full suite."
  fi
  echo "report: $REPORT"
} >>"$REPORT"

if [ -n "$CULPRIT" ]; then
  notify "nightly e2e red: culprit + verdict ready" "${CULPRIT_SUBJECT:-see report}"
else
  notify "nightly e2e FAILED" "bisect inconclusive — see report"
fi
exit 1
