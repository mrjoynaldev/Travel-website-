import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || "3100");
const vncUpstream = process.env.VNC_UPSTREAM || "ws://127.0.0.1:6080";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = http.createServer((req, res) => handle(req, res));

const relay = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  let pathname;
  try {
    pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  } catch {
    socket.destroy();
    return;
  }
  if (pathname !== "/websockify") return;

  try {
    relay.handleUpgrade(req, socket, head, ws => {
      const up = new WebSocket(vncUpstream);
      const pending = [];
      const closeBoth = () => {
        try {
          up.close();
        } catch {}
        try {
          ws.close();
        } catch {}
      };
      ws.on("message", data => {
        if (up.readyState !== WebSocket.OPEN) {
          pending.push(data);
          return;
        }
        up.send(Buffer.isBuffer(data) ? data : Buffer.from(data));
      });
      up.on("message", (data, isBinary) => {
        if (ws.readyState === WebSocket.OPEN)
          ws.send(data, { binary: isBinary });
      });
      up.on("open", () => {
        for (const data of pending.splice(0)) {
          if (up.readyState === WebSocket.OPEN)
            up.send(Buffer.isBuffer(data) ? data : Buffer.from(data));
        }
        if (ws.readyState === WebSocket.OPEN) ws.send(Buffer.alloc(0));
      });
      up.on("error", closeBoth);
      up.on("close", closeBoth);
      ws.on("error", () => {
        try {
          up.close();
        } catch {}
      });
      ws.on("close", () => {
        try {
          up.close();
        } catch {}
      });
    });
  } catch {
    socket.destroy();
  }
});

server.listen(port, hostname, () => {
  console.log(`[admin] http://${hostname}:${port} (dev: ${dev})`);
  console.log(`[admin] /websockify -> ${vncUpstream}`);
});
