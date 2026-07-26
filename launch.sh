#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/justin/piano-suite"
LOG_FILE="$PROJECT_DIR/.launcher.log"
URL="http://localhost:3000"

cd "$PROJECT_DIR"

# Kill any previous dev server instances tied to this project directory.
# We match processes whose cwd is the project dir and whose command line
# contains npm/node running the dev server.
pids=$(lsof -t -i :3000 2>/dev/null || true)
if [ -n "$pids" ]; then
  echo "Stopping existing dev server on port 3000 (PIDs: $pids)..." | tee -a "$LOG_FILE"
  kill $pids 2>/dev/null || true
  sleep 2
  kill -9 $pids 2>/dev/null || true
fi

# Also sweep any node/npm processes whose cwd is this project.
for pid_dir in /proc/[0-9]*/cwd; do
  if [ -L "$pid_dir" ] && [ "$(readlink "$pid_dir" 2>/dev/null)" = "$PROJECT_DIR" ]; then
    pid=$(basename "$(dirname "$pid_dir")")
    cmd=$(cat "/proc/$pid/cmdline" 2>/dev/null | tr '\0' ' ' || true)
    case "$cmd" in
      *node*|*npm*)
        echo "Stopping leftover project process $pid..." | tee -a "$LOG_FILE"
        kill "$pid" 2>/dev/null || true
        ;;
    esac
  fi
done

# Rotate / clear the log.
echo "--- Launcher started $(date -Iseconds) ---" > "$LOG_FILE"

# Start the Next.js dev server in the background.
nohup npm run dev >> "$LOG_FILE" 2>&1 &
DEV_PID=$!

# Wait for the server to become reachable.
echo "Starting dev server (PID: $DEV_PID)..." | tee -a "$LOG_FILE"
for i in {1..30}; do
  if curl -s "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Open the browser.
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
else
  echo "xdg-open not found; please open $URL manually." | tee -a "$LOG_FILE"
fi
