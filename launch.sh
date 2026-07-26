#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/justin/piano-suite"
LOG_FILE="$PROJECT_DIR/.launcher.log"
URL="http://localhost:3000"

cd "$PROJECT_DIR"

# Kill only the Next.js dev server on port 3000. Leave other project
# processes (e.g. the Convex dev server on port 3210) running.
pids=$(lsof -t -i :3000 2>/dev/null || true)
if [ -n "$pids" ]; then
  echo "Stopping existing Next.js dev server on port 3000 (PIDs: $pids)..." | tee -a "$LOG_FILE"
  kill $pids 2>/dev/null || true
  sleep 2
  kill -9 $pids 2>/dev/null || true
fi

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
