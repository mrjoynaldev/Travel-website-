const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
<head><title>Studio Login</title></head>
<body>
  <h1>Studio Login</h1>
  <form id="login-form" onsubmit="event.preventDefault(); window.location.href='/studio';">
    <div>
      <label>Email</label>
      <input id="email" type="email" value="qa.browser.1786554198@example.test" required />
    </div>
    <div>
      <label>Password</label>
      <input id="password" type="password" value="CrgBrowserQA!1786554198A" required />
    </div>
    <button id="submit" type="submit">Sign In</button>
  </form>
</body>
</html>`);
});
server.listen(5174, '127.0.0.1', () => {
  console.log('Server running on http://127.0.0.1:5174');
});
