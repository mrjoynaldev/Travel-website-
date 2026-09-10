#!/usr/bin/env node
// Temporary setup for Meta Developer Tools MCP OAuth - provides single-command auth link and waits
import http from 'http';
import { execSync } from 'child_process';

const MCP_URL = 'https://mcp.facebook.com/devtools';
const PORT = 19876;

console.log(`\n🔧 Meta MCP Quick Auth — single command setup\n`);
console.log(`This will start a local callback server on http://127.0.0.1:${PORT}/mcp/oauth/callback`);
console.log(`and print the authorization link for you to open in your browser.\n`);

// Start a simple callback server to capture the OAuth code
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname === '/mcp/oauth/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    console.log(`\n✅ Callback received!`);
    if (error) {
      console.log(`❌ OAuth error: ${error} - ${url.searchParams.get('error_description')}`);
    } else {
      console.log(`✅ Code: ${code?.slice(0,20)}...`);
      console.log(`✅ State: ${state?.slice(0,20)}...`);
      console.log(`\n🎉 Authorization successful! You can close this window.`);
      console.log(`opencode will capture this automatically — no further action needed.`);
      console.log(`Run: opencode mcp list  to verify → should show meta-devtools READY`);
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h1>Authorization successful!</h1><p>You can close this window and return to the terminal.</p><script>window.close();</script>`);
    setTimeout(() => { server.close(); process.exit(0); }, 1000);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`✅ Callback server listening on http://127.0.0.1:${PORT}/mcp/oauth/callback`);
  console.log(`\n📋 Next: Run in another terminal:`);
  console.log(`   cd ${process.cwd()} && opencode mcp auth meta-devtools --print-logs`);
  console.log(`\n   Then copy the https://www.facebook.com/.../dialog/oauth?... link it prints`);
  console.log(`   and open it in your browser (logged in as adityahalderdev).`);
  console.log(`\n⏳ Waiting for callback on http://127.0.0.1:${PORT}/mcp/oauth/callback ... (Ctrl+C to cancel)`);
  console.log(`   This server will stay open for 5 minutes.\n`);
});

setTimeout(() => {
  console.log(`\n⏰ Timeout — no callback received in 5 minutes. Closing.`);
  server.close();
  process.exit(0);
}, 5 * 60 * 1000);
