// Storage helpers backed by Supabase Storage (public bucket).
// Uploads go to the "media" bucket via the service role; downloads use public URLs.

import { getSupabase } from "./supabase";

const BUCKET = "media";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

async function ensureBucket(): Promise<void> {
  const sb = getSupabase();
  const { data, error } = await sb.storage.listBuckets();
  if (error) {
    throw new Error(`Storage bucket list failed: ${error.message}`);
  }
  if (data?.some(bucket => bucket.name === BUCKET)) return;
  const { error: createError } = await sb.storage.createBucket(BUCKET, { public: true });
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Storage bucket create failed: ${createError.message}`);
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  await ensureBucket();
  const key = appendHashSuffix(normalizeKey(relKey));

  const body = typeof data === "string" ? new Blob([data], { type: contentType }) : data;

  const { error: uploadError } = await getSupabase().storage
    .from(BUCKET)
    .upload(key, body, { contentType, upsert: false });

  if (uploadError) {
    throw new Error(`Storage upload to Supabase failed: ${uploadError.message}`);
  }

  const { data: publicInfo } = getSupabase().storage.from(BUCKET).getPublicUrl(key);
  return { key, url: publicInfo.publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const { data: publicInfo } = getSupabase().storage.from(BUCKET).getPublicUrl(key);
  return { key, url: publicInfo.publicUrl };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  const { data: publicInfo } = getSupabase().storage.from(BUCKET).getPublicUrl(key);
  return publicInfo.publicUrl;
}

export async function storageRemove(relKey: string): Promise<void> {
  const key = normalizeKey(relKey);
  const { error } = await getSupabase().storage.from(BUCKET).remove([key]);
  // A missing file is already the desired end state — only real failures throw.
  if (error && !/not found|does not exist/i.test(error.message)) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}