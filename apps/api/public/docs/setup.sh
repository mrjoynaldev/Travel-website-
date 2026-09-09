#!/usr/bin/env bash
# Sundarban Yatri - one-command CLI bootstrap for external AI agents.
# Usage:  mkdir -p ~/sy-cli && cd ~/sy-cli && curl -fsSL https://sundarbanyatra.com/docs/setup.sh -o setup.sh && bash setup.sh
set -e

BASE="https://sundarbanyatra.com/docs"
DIR="$(pwd)"

echo "-> Downloading CLI files..."
curl -fsSL "$BASE/blog.mjs" -o blog.mjs
curl -fsSL "$BASE/gravity.mjs" -o gravity.mjs
curl -fsSL "$BASE/distribute.mjs" -o distribute.mjs
curl -fsSL "$BASE/mcp.mjs" -o mcp.mjs

echo "-> Installing dependencies (@trpc/client v11, superjson)..."
[ -f package.json ] || npm init -y >/dev/null
npm install --silent @trpc/client@^11.6.0 superjson >/dev/null

cat <<'SY_DONE'

Sundarban Yatri CLI ready in'" $DIR"'

Next steps (as documented in https://sundarbanyatra.com/docs/AI-EDITOR-AGENT.md):

  export SY_TOKEN="sy_..."                                                  # from Studio -> API tokens
  export SY_API_URL="https://sundarbanyatra.com"
  node blog.mjs whoami                                                      # ALWAYS run first

If whoami fails, stop and report - never attempt to work around auth.
SY_DONE
