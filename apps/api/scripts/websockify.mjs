import net from "node:net";
import { WebSocketServer } from "ws";

const WS_PORT = Number(process.env.VNC_WS_PORT || "6080");
const RFB_PORT = Number(process.env.VNC_RFB_PORT || "5900");
const HOST = process.env.VNC_WS_HOST || "127.0.0.1";

const wss = new WebSocketServer({ port: WS_PORT, host: HOST });

wss.on("listening", () => {
  console.log(
    `[vnc] websockify ws://${HOST}:${WS_PORT}/websockify -> 127.0.0.1:${RFB_PORT}`
  );
});

wss.on("connection", ws => {
  const sock = net.connect(RFB_PORT, "127.0.0.1");
  sock.on("connect", () => {
    if (ws.readyState === ws.OPEN) ws.send(Buffer.alloc(0));
  });
  ws.on("message", data => {
    if (sock.destroyed) return;
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    sock.write(buf);
  });
  sock.on("data", chunk => {
    if (ws.readyState === ws.OPEN) ws.send(chunk);
  });
  sock.on("error", () => sock.destroy());
  ws.on("close", () => sock.destroy());
  ws.on("error", () => sock.destroy());
});

wss.on("error", err => {
  console.error("[vnc] websockify error:", err.message);
  process.exitCode = 1;
});
