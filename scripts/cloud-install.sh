#!/usr/bin/env bash
#
# Idempotent bootstrap for the Flashcard Marketplace monorepo.
# Safe to run repeatedly and against cached state.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing Turso CLI (local libSQL dev server) if missing"
if ! command -v turso >/dev/null 2>&1 && [ ! -x "$HOME/.turso/turso" ]; then
  curl -sSfL https://get.tur.so/install.sh | bash
fi
export PATH="$HOME/.turso:$PATH"

echo "==> Installing workspace dependencies"
npm install

echo "==> Preparing local env files"
[ -f backend/.dev.vars ] || cp backend/.dev.vars.example backend/.dev.vars
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

echo "==> Creating + seeding local libSQL database (.turso/dev.db)"
mkdir -p .turso
npm run db:setup

echo "==> Install complete"
