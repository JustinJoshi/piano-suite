#!/usr/bin/env bash
set -euo pipefail

# Toggle whether Kimi Code automatically injects the repo's AGENTS.md
# into every session for the Piano Suite project.
#
# When SYSTEM.md exists, Kimi Code loads it as the main agent prompt and
# the ${agents_md} placeholder pulls in AGENTS.md automatically.
# When SYSTEM.md.disabled exists instead, AGENTS.md is not auto-loaded.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEM_MD="${SCRIPT_DIR}/SYSTEM.md"
SYSTEM_MD_DISABLED="${SCRIPT_DIR}/SYSTEM.md.disabled"

if [[ -f "${SYSTEM_MD}" ]]; then
  mv "${SYSTEM_MD}" "${SYSTEM_MD_DISABLED}"
  echo "AGENTS.md auto-load is now OFF (disabled SYSTEM.md)."
elif [[ -f "${SYSTEM_MD_DISABLED}" ]]; then
  mv "${SYSTEM_MD_DISABLED}" "${SYSTEM_MD}"
  echo "AGENTS.md auto-load is now ON (enabled SYSTEM.md)."
else
  echo "Neither SYSTEM.md nor SYSTEM.md.disabled exists in ${SCRIPT_DIR}."
  echo "Creating SYSTEM.md to enable AGENTS.md auto-load."
  cat > "${SYSTEM_MD}" <<'EOF'
${base_prompt}

${agents_md}

${skills}
EOF
  echo "AGENTS.md auto-load is now ON."
fi
