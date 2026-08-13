import { spawnSync } from "node:child_process";

const DISPLAY = process.env.VNC_DISPLAY || ":99";
const DISPLAY_NUM = DISPLAY.replace(/^:/, "");
const RFB_PORT = process.env.VNC_RFB_PORT || "5900";

const patterns = [
  `x11vnc -display ${DISPLAY}`,
  `-rfbport ${RFB_PORT}`,
  "openbox",
  `Xvfb ${DISPLAY}`,
  "websockify.mjs",
];

for (const pattern of patterns) {
  const result = spawnSync("pkill", ["-f", pattern], { stdio: "ignore" });
  if (result.status === 0) {
    console.log(`[vnc] stopped: ${pattern}`);
  }
}
console.log(`[vnc] desktop stopped (display ${DISPLAY}, rfb ${RFB_PORT})`);
