import { ENV } from "./env";

export type StorageRedirectResult =
  | { url: string; error?: never }
  | { url?: never; error: { status: number; message: string } };

export async function resolveStorageRedirect(key: string): Promise<StorageRedirectResult> {
  if (!key) {
    return { error: { status: 400, message: "Missing storage key" } };
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    return { error: { status: 500, message: "Storage proxy not configured" } };
  }

  try {
    const forgeUrl = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
    forgeUrl.searchParams.set("path", key);

    const forgeResp = await fetch(forgeUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      return { error: { status: 502, message: "Storage backend error" } };
    }

    const { url } = (await forgeResp.json()) as { url: string };
    if (!url) {
      return { error: { status: 502, message: "Empty signed URL from backend" } };
    }

    return { url };
  } catch (err) {
    console.error("[StorageProxy] failed:", err);
    return { error: { status: 502, message: "Storage proxy error" } };
  }
}
