#!/usr/bin/env bash
# Load nvm (Node 22 via .nvmrc) and ~/.turso so `npm run dev` works from a
# login-less npm script, where .zshrc PATH is not sourced.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="${HOME}/.turso:${PATH}"
export NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"
if [ -s "${NVM_DIR}/nvm.sh" ]; then
  # nvm is a shell function, not a binary.
  . "${NVM_DIR}/nvm.sh"
  nvm use
fi
exec npx concurrently -n turso,api,web -c magenta,cyan,green \
  "npm:dev:turso" "npm:dev:api" "npm:dev:web"
