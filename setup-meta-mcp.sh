#!/bin/bash
# Single-command Meta MCP auth — prints link, waits for login, verifies
set -e
cd "$(dirname "$0")"
echo "🔧 Meta MCP Quick Auth — single command"
echo "This will start the OAuth flow and wait for your browser login..."
echo ""
# Run auth in background and capture the URL it prints
timeout 60 opencode mcp auth meta-devtools --print-logs 2>&1 | tee /tmp/mcp-auth.log &
PID=$!
echo "⏳ Waiting for authorization link (check /tmp/mcp-auth.log)..."
sleep 3
# Try to extract the URL from the log (opencode prints it to stderr)
if grep -q "https://www.facebook.com" /tmp/mcp-auth.log 2>/dev/null; then
  echo ""
  echo "✅ Authorization link found — open this in your browser (logged in as adityahalderdev):"
  grep -o "https://www.facebook.com[^ ]*" /tmp/mcp-auth.log | head -1
  echo ""
  echo "After you Allow → pick CodeReport Global apps → grant Read (add Manage later), return here."
  echo "Waiting for callback on http://127.0.0.1:19876/mcp/oauth/callback ..."
  wait $PID
else
  echo ""
  echo "⚠️  No link printed yet — check log:"
  cat /tmp/mcp-auth.log
  echo ""
  echo "If you see 'Dynamic registration is not available', your account isn't in the beta rollout yet."
  echo "Try again in 24h or use https://developers.facebook.com/tools/explorer/ as fallback."
  wait $PID || true
fi
echo ""
echo "Done. Run: opencode mcp list  to verify → should show meta-devtools ● ready"
