#!/usr/bin/env bash
# Nightly full-e2e owner. Agents never run the full suite (AGENTS.md); this
# script does, on a schedule (piano-suite-nightly.timer), and on red bisects
# the failing specs down to the culprit commit.
#
# Runs in a dedicated worktree (default ~/piano-suite-nightly) so the main
# checkout — and any agent working in it — is never touched, even mid-bisect.
#
# State/logs: ${NIGHTLY_STATE_DIR:-~/.local/state/piano-suite-nightly}/
#   last-green.sha   last commit where the full suite passed
#   report-*.log     one per run: result, culprit commit, triage prompt

set -u

REPO="${NIGHTLY_REPO:-/home/justin/piano-suite}"
WORKTREE="${NIGHTLY_WORKTREE:-/home/justin/piano-suite-nightly}"
STATE_DIR="${NIGHTLY_STATE_DIR:-$HOME/.local/state/piano-suite-nightly}"
PORT="${NIGHTLY_E2E_PORT:-3300}"
BRANCH="main"
GREEN_FILE="$STATE_DIR/last-green.sha"

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

{
  echo ""
  echo "════════ NIGHTLY RESULT ════════"
  echo "date:        $(date -Iseconds)"
  echo "tested:      $HEAD_SHA (origin/$BRANCH)"
  echo "last green:  ${LAST_GREEN:-none}"
  if [ -n "$CULPRIT" ]; then
    echo "culprit:     $CULPRIT"
    git -C "$WORKTREE" show --stat --no-color "$CULPRIT"
  else
    echo "culprit:     bisect inconclusive (skipped/untestable commits) — see log above"
  fi
  echo "failing specs: $FAILED_SPECS"
  echo "report:      $REPORT"
  echo ""
  echo "── morning triage prompt (paste into a fresh agent) ──"
  echo "The nightly full-e2e run failed on origin/main. Investigate only; do not"
  echo "run the full suite (AGENTS.md: the nightly bot owns it). Culprit commit:"
  if [ -n "$CULPRIT" ]; then
    echo "$CULPRIT ($(git -C "$WORKTREE" log -1 --format=%s "$CULPRIT" 2>/dev/null))"
  else
    echo "inconclusive — read the report first"
  fi
  echo "Failing specs: $FAILED_SPECS. Full log: $REPORT"
  echo "Repro: run ONLY those specs, e.g. CI=true E2E_PORT=3310 PORT=3310 \\"
  echo "  ./node_modules/.bin/playwright test $FAILED_SPECS"
} >>"$REPORT"

if [ -n "$CULPRIT" ]; then
  notify "nightly e2e: culprit found" "$(git -C "$WORKTREE" log -1 --format=%s "$CULPRIT" 2>/dev/null)"
else
  notify "nightly e2e FAILED" "bisect inconclusive — see report"
fi
exit 1
