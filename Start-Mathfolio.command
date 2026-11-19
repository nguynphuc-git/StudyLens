#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Cài Node.js 24 LTS và mở lại file này."
  read -r answer
  exit 1
fi
exec node scripts/start-local.mjs
