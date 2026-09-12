#!/usr/bin/env bash
# Recovers the heavy-directories setup after a Cloud Shell machine
# recreation (which wipes /var/tmp and drops bind mounts).
#
#   bash scripts/recover-env.sh
#
# What it does:
#   1. Re-creates /var/tmp/tw backing dirs on the big disk.
#   2. Re-mounts node_modules (bind mount keeps Turbopack happy).
#      The pnpm store stays a symlink -> /var/tmp/tw/pnpm-store.
#   3. Reinstalls dependencies (lands on the big disk, not /home).
set -eu
cd "$(dirname "$0")/.."

mkdir -p /var/tmp/tw/root_modules /var/tmp/tw/pnpm-store
if ! mountpoint -q node_modules 2>/dev/null; then
  sudo -n mount --bind /var/tmp/tw/root_modules node_modules
  echo "mounted node_modules -> /var/tmp/tw/root_modules"
else
  echo "node_modules already mounted"
fi

NVM_BIN="$(ls -d /usr/local/nvm/versions/node/v*/bin 2>/dev/null | sort -V | tail -1)"
export PATH="${NVM_BIN}:$PATH"
PNPM_CJS="$HOME/.cache/node/corepack/v1/pnpm/10.4.1/dist/pnpm.cjs"
node "$PNPM_CJS" install
df -h /home | tail -1
