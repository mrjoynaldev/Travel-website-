#!/usr/bin/env bash
# CodeReport Global — one-command CLI bootstrap for external AI agents.
# Usage:  mkdir -p ~/crg-cli && cd ~/crg-cli && curl -fsSL https://codereportglobal-backend.onrender.com/docs/setup.sh -o setup.sh && bash setup.sh
set -e

BASE="https://codereportglobal-backend.onrender.com/docs"
DIR="$(pwd)"

echo "→ Downloading CLI files…"
curl -fsSL "$BASE/blog.mjs" -o blog.mjs
curl -fsSL "$BASE/gravity.mjs" -o gravity.mjs

echo "→ Installing dependencies (@trpc/client v11, superjson)…"
[ -f package.json ] || npm init -y >/dev/null
npm install --silent @trpc/client@^11.6.0 superjson >/dev/null

cat <<EOF

✓ CodeReport Global CLI ready in $DIR

Next steps (as documented in https://codereportglobal-backend.onrender.com/docs/AI-EDITOR-AGENT.md):

  export CRG_TOKEN="crg_…"                                                  # from Studio → API tokens
  export CRG_API_URL="https://codereportglobal-backend.onrender.com"
  node blog.mjs whoami                                                      # ALWAYS run first

If whoami fails, stop and report — never attempt to work around auth.
