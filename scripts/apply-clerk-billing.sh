#!/usr/bin/env bash
# Apply Piano Suite B2C Billing config to the linked Clerk instance (dev by default).
#
# Prerequisites:
#   npx clerk auth login
#   npx clerk link          # from the repo root, once
#
# Usage:
#   ./scripts/apply-clerk-billing.sh           # enable + dry-run patch
#   ./scripts/apply-clerk-billing.sh --apply   # enable + apply patch
#   ./scripts/apply-clerk-billing.sh --instance prod --apply
#
# Manual Dashboard fallback: docs/clerk-billing-setup.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Desired PLAPI patch only — no comment/meta keys (Clerk rejects unknown keys).
DESIRED="$ROOT/clerk/billing.desired.json"
APPLY=0
INSTANCE_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1; shift ;;
    --instance)
      INSTANCE_ARGS+=(--instance "$2")
      shift 2
      ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$DESIRED" ]]; then
  echo "Missing $DESIRED" >&2
  exit 1
fi

CLERK=(npx --yes clerk@latest)

echo "==> Checking Clerk CLI auth…"
if ! "${CLERK[@]}" whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: npx clerk auth login" >&2
  echo "Then link this repo: npx clerk link" >&2
  exit 1
fi

"${CLERK[@]}" whoami

echo "==> Enabling Billing for users (creates free_user if needed)…"
"${CLERK[@]}" enable billing --for users --yes --no-skills "${INSTANCE_ARGS[@]+"${INSTANCE_ARGS[@]}"}"

echo "==> Pulling current billing config (for your review)…"
mkdir -p "$ROOT/clerk"
PULL_OUT="$ROOT/clerk/billing.pulled.json"
# Pulled file is gitignored — local inspection only.
if "${CLERK[@]}" config pull --keys billing --output "$PULL_OUT" "${INSTANCE_ARGS[@]+"${INSTANCE_ARGS[@]}"}"; then
  echo "Wrote $PULL_OUT"
else
  echo "Pull failed; continuing with desired patch only." >&2
fi

echo "==> Patching from clerk/billing.desired.json (Pro + sync feature)…"
if [[ "$APPLY" -eq 1 ]]; then
  "${CLERK[@]}" config patch --file "$DESIRED" --yes "${INSTANCE_ARGS[@]+"${INSTANCE_ARGS[@]}"}"
  echo "Applied. Verify at https://dashboard.clerk.com/last-active?path=billing/plans"
else
  "${CLERK[@]}" config patch --file "$DESIRED" --dry-run "${INSTANCE_ARGS[@]+"${INSTANCE_ARGS[@]}"}" || {
    echo ""
    echo "Dry-run failed (schema may differ)." >&2
    echo "Fastest unblock: create Pro (slug pro, \$8/mo / \$72/yr) + feature sync" >&2
    echo "in Dashboard → Billing → Plans → Plans for Users." >&2
    echo "See Path B in docs/clerk-billing-setup.md." >&2
    echo "Or align clerk/billing.desired.json with clerk/billing.pulled.json and retry." >&2
    exit 1
  }
  echo ""
  echo "Dry-run OK. Re-run with --apply to write the config."
fi
