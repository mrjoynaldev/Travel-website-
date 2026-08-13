export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.VNC_AUTOSTART === "0") return;
  if (process.env.RENDER === "true") {
    console.log("[vnc] desktop autostart skipped (Render)");
    return;
  }
  const { spawn } = await import("node:child_process");
  const { join } = await import("node:path");
  const script = join(process.cwd(), "scripts", "vnc-desktop.mjs");
  const child = spawn(process.execPath, [script], { stdio: "inherit" });
  child.on("error", err => {
    console.error("[vnc] desktop autostart failed:", err.message);
  });
  process.on("exit", () => {
    try {
      child.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  });
}
