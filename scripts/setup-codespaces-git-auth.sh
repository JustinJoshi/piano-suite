#!/bin/bash
# Configures git in a GitHub Codespace to push using a personal access token.
#
# Usage:
#   1. Create a fine-grained personal access token in GitHub:
#      Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens.
#      Grant Contents: read and write for the JustinJoshi/piano-suite repo.
#   2. Add the token as a Codespaces secret named GH_TOKEN for this repository,
#      or export it in the current terminal:
#        export GH_TOKEN="ghp_..."
#   3. Run this script:
#        bash scripts/setup-codespaces-git-auth.sh
#
# The token is stored in the local git config for this repo only (not committed).

set -euo pipefail

REPO="JustinJoshi/piano-suite"
TOKEN_NAME="GH_TOKEN"
TOKEN="${!TOKEN_NAME:-}"

# Codespaces injects secrets into /workspaces/.codespaces/shared/.env, which is
# loaded by interactive shells but not always by non-interactive ones. Source it
# if the token is not already in the environment.
if [ -z "$TOKEN" ] && [ -f /workspaces/.codespaces/shared/.env ]; then
  # shellcheck source=/dev/null
  set -a
  . /workspaces/.codespaces/shared/.env
  set +a
  TOKEN="${!TOKEN_NAME:-}"
fi

if [ -z "$TOKEN" ]; then
  echo "Error: $TOKEN_NAME is not set." >&2
  echo "Add it as a Codespaces secret or run: export $TOKEN_NAME='ghp_...'" >&2
  exit 1
fi

git remote set-url origin "https://${TOKEN}@github.com/${REPO}.git"

echo "Git remote updated to authenticate with $TOKEN_NAME."
echo "You can now push with: git push origin <branch>"
