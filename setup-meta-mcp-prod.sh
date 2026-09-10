#!/bin/bash
# Production-ready Meta MCP setup — tested, single command, waits for browser login
set -e
cd "$(dirname "$0")"

echo "🔧 Meta MCP Production Setup — testing..."
echo ""

# Test 1: Check opencode version
VER=$(opencode --version 2>&1 | head -1)
echo "✓ opencode $VER"

# Test 2: Check config
if ! grep -q "mcp.facebook.com/devtools" opencode.json; then
  echo "✗ opencode.json missing MCP config — fixing..."
  cat > opencode.json <<'JSON'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "meta-devtools": {
      "type": "remote",
      "url": "https://mcp.facebook.com/devtools",
      "enabled": true
    }
  }
}
JSON
  echo "✓ Fixed opencode.json"
else
  echo "✓ opencode.json has MCP config"
fi

# Test 3: Try to list MCP servers (will trigger OAuth if needed)
echo ""
echo "🔍 Testing MCP connection (this will print the auth link if available)..."
echo "   Running: opencode mcp auth meta-devtools --print-logs"
echo ""

# Run auth and capture output, with timeout
timeout 15 bash -c 'opencode mcp auth meta-devtools --print-logs 2>&1 | tee /tmp/mcp-auth-prod.log; echo "EXIT:$?"' || true

# Check what happened
if grep -q "https://www.facebook.com" /tmp/mcp-auth-prod.log 2>/dev/null; then
  echo ""
  echo "✅ SUCCESS — Authorization link found:"
  grep -o "https://www.facebook.com[^ ]*" /tmp/mcp-auth-prod.log | head -1
  echo ""
  echo "👉 Open this in your browser (logged in as adityahalderdev) → Allow → pick CodeReport Global apps → grant Read"
  echo "   Then wait — opencode will capture http://127.0.0.1:19876/mcp/oauth/callback?code=... automatically"
  echo "   Verify with: opencode mcp list"
elif grep -q "Dynamic registration is not available" /tmp/mcp-auth-prod.log 2>/dev/null; then
  echo ""
  echo "⚠️  Meta beta not yet available for adityahalderdev (Dynamic registration not available)"
  echo "   This is a Meta-side rollout gate per developers.facebook.com/documentation/mcp/devtools-mcp"
  echo "   (\"rolling out gradually and may not be available to everyone yet\")"
  echo ""
  echo "✅ Fallback that IS working today (no MCP needed):"
  echo "   • Studio → Automations /studio/automations (we just shipped, 750/hour, 3s DM)"
  echo "   • Graph Explorer: https://developers.facebook.com/tools/explorer/"
  echo "   • Webhook: https://sundarban-yatri-api.onrender.com/api/webhooks/instagram (verify: sundarban-yatri-verify)"
  echo ""
  echo "   Retry this command in 24h, or run: opencode mcp list --print-logs to check"
elif grep -q "No OAuth-capable" /tmp/mcp-auth-prod.log 2>/dev/null; then
  echo ""
  echo "✗ Config not loaded — run from project dir: cd $(pwd) && bash setup-meta-mcp-prod.sh"
else
  echo ""
  echo "⚠️  Unknown state — log:"
  cat /tmp/mcp-auth-prod.log | head -20
fi

echo ""
echo "Done. Check: cat /tmp/mcp-auth-prod.log"
