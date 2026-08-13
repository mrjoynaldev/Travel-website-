import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";

const DISPLAY = process.env.VNC_DISPLAY || ":99";
const DISPLAY_NUM = DISPLAY.replace(/^:/, "");
const RFB_PORT = Number(process.env.VNC_RFB_PORT || "5900");
const WS_PORT = Number(process.env.VNC_WS_PORT || "6080");
const RESOLUTION = process.env.VNC_RESOLUTION || "1280x800x24";

const children = [];

function log(message) {
  console.log(`[vnc] ${message}`);
}

function spawnBin(name, args, env = {}) {
  const child = spawn(name, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  child.on("error", err => {
    log(`failed to start ${name}: ${err.message}`);
  });
  child.on("exit", (code, signal) => {
    log(`${name} exited (${signal || code || "ok"})`);
  });
  children.push(child);
  return child;
}

function cleanup() {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

function portOpen(port) {
  return new Promise(resolve => {
    const sock = net.connect({ port, host: "127.0.0.1" });
    sock.once("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.once("error", () => resolve(false));
  });
}

async function waitFor(probe, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await probe()) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

function requireBin(name) {
  if (process.env.PATH.split(":").some(dir => existsSync(`${dir}/${name}`)))
    return true;
  return false;
}

async function main() {
  if (process.env.VNC_AUTOSTART === "0") {
    log("autostart disabled via VNC_AUTOSTART=0");
    return;
  }
  if (process.env.RENDER === "true") {
    log("skipped on Render (no display server available)");
    return;
  }

  const missing = ["Xvfb", "x11vnc", "openbox"].filter(bin => !requireBin(bin));
  if (missing.length) {
    log(
      `skipped: missing packages ${missing.join(", ")}. Install with: sudo apt-get install xvfb x11vnc openbox`
    );
    return;
  }

  if (await portOpen(WS_PORT)) {
    log(`already running (ws://127.0.0.1:${WS_PORT} is listening)`);
    return;
  }

  const x11Socket = `/tmp/.X11-unix/X${DISPLAY_NUM}`;
  if (!existsSync(x11Socket)) {
    spawnBin("Xvfb", [
      DISPLAY,
      "-screen",
      "0",
      RESOLUTION,
      "-nolisten",
      "tcp",
      "-ac",
    ]);
    const up = await waitFor(() => existsSync(x11Socket), 15000);
    if (!up) {
      log("Xvfb did not come up in time");
      cleanup();
      process.exit(1);
    }
    log(`virtual display ${DISPLAY} started`);
  }

  if (!(await portOpen(RFB_PORT))) {
    spawnBin("openbox", [], { DISPLAY });
    await new Promise(resolve => setTimeout(resolve, 1000));
    spawnBin("x11vnc", [
      "-display",
      DISPLAY,
      "-forever",
      "-shared",
      "-rfbport",
      String(RFB_PORT),
      "-nopw",
      "-localhost",
      "-quiet",
    ]);
    const up = await waitFor(() => portOpen(RFB_PORT), 15000);
    if (!up) {
      log("x11vnc did not start in time");
      cleanup();
      process.exit(1);
    }
    log(`x11vnc serving display ${DISPLAY} on 127.0.0.1:${RFB_PORT}`);
  }

  if (!(await portOpen(WS_PORT))) {
    const relay = fileURLToPath(new URL("./websockify.mjs", import.meta.url));
    spawnBin(process.execPath, [relay], {
      VNC_WS_PORT: String(WS_PORT),
      VNC_RFB_PORT: String(RFB_PORT),
    });
  }

  log(`remote desktop ready: ws://127.0.0.1:${WS_PORT}/websockify`);

  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => {
      cleanup();
      process.exit(0);
    });
  }
}

main().catch(err => {
  console.error("[vnc] fatal:", err);
  process.exit(1);
});
