#!/usr/bin/env bash
# Install or upgrade the nightly e2e bot on this machine. Idempotent.
# Deploys a runtime copy to ~/.local/lib/piano-suite-nightly so branch
# switches in any checkout never affect the installed bot, then (re)installs
# the systemd user units and enables the timer.
set -eu
SRC="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${NIGHTLY_INSTALL_DIR:-$HOME/.local/lib/piano-suite-nightly}"

# Capture paseo daemon auth (and anything else the invoker has) into an
# out-of-repo env file the service loads. Only created, never overwritten.
ENV_FILE="$DEST/env"
if [ -n "${PASEO_PASSWORD:-}" ] && [ ! -f "$ENV_FILE" ]; then
  umask 077
  printf 'PASEO_PASSWORD=%s\n' "$PASEO_PASSWORD" >"$ENV_FILE"
  echo "wrote $ENV_FILE (0600) from the invoking environment"
fi
[ -f "$ENV_FILE" ] || echo "WARN: no $ENV_FILE — paseo spawns will fail daemon auth unless PASEO_PASSWORD is set"

mkdir -p "$DEST/nightly"
cp "$SRC/scripts/nightly-e2e.sh" "$DEST/"
cp -r "$SRC/scripts/nightly/." "$DEST/nightly/"
chmod +x "$DEST/nightly-e2e.sh"

mkdir -p "$HOME/.config/systemd/user"
cp "$SRC/scripts/systemd/piano-suite-nightly.service" \
   "$SRC/scripts/systemd/piano-suite-nightly.timer" \
   "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now piano-suite-nightly.timer

echo "installed runtime: $DEST"
echo "test a run manually: systemctl --user start piano-suite-nightly.service"
systemctl --user list-timers piano-suite-nightly.timer --no-pager | sed -n '1,2p'
