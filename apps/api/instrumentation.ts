export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { spawnDesktop } = await import("./instrumentation-node");
    await spawnDesktop();
  }
}
