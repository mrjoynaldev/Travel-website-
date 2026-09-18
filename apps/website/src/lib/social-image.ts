export function optimizedSocialImage(url: string | undefined | null, width = 1200, height = 630): string | undefined {
  if (!url || !/^https?:\/\//.test(url)) return url ?? undefined;
  const clean = url.replace(/&amp;/g, "&").split(/[?#]/)[0];
  const match = clean.match(/^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/);
  if (!match) return url;
  return `${match[1]}/storage/v1/render/image/public/${match[2]}?width=${width}&height=${height}&resize=cover&quality=75&format=webp`;
}

export function optimizedImageUrl(url: string | undefined | null, width = 800, height = 600): string | undefined {
  if (!url || !/^https?:\/\//.test(url)) return url ?? undefined;
  const clean = url.replace(/&amp;/g, "&").split(/[?#]/)[0];
  const match = clean.match(/^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/);
  if (!match) return url;
  return `${match[1]}/storage/v1/render/image/public/${match[2]}?width=${width}&height=${height}&resize=cover&quality=80&format=webp`;
}

/**
 * Display-size image URL for <img> tags. Tour/brand images come from the CMS
 * (Supabase storage) or the Unsplash seed data, in either case often far
 * larger than their display size. This rewrites to a width-appropriate
 * variant at the render layer instead of touching stored data:
 * - Supabase → storage image-render transform (width, aspect preserved).
 * - Unsplash → imgix w/q params retargeted (auto=format keeps WebP/AVIF).
 * - Anything else → returned unchanged.
 */
/**
 * Responsive srcset for an image URL (`"u480 480w, u800 800w"`), built with
 * displayImageUrl so CMS originals are never shipped at full size on mobile.
 * Returns undefined when the URL is not transformable (caller falls back to
 * a single src). Widths must be ascending.
 */
export function responsiveSrcSet(url: string | undefined | null, widths: number[], quality = 75): string | undefined {
  if (!url || !widths.length) return undefined;
  const entries: string[] = [];
  for (const w of widths) {
    const variant = displayImageUrl(url, w, quality);
    if (!variant || variant === url) return undefined;
    entries.push(`${variant} ${w}w`);
  }
  return entries.join(", ");
}

export function displayImageUrl(url: string | undefined | null, width = 1200, quality = 75): string | undefined {
  if (!url || !/^https?:\/\//.test(url)) return url ?? undefined;
  const unsplash = url.replace(/&amp;/g, "&").match(/^(https:\/\/images\.unsplash\.com\/[^?#]+)(\?[^#]*)?(#.*)?$/);
  if (unsplash) {
    const params = new URLSearchParams((unsplash[2] || "").replace(/^\?/, ""));
    params.set("auto", "format");
    params.set("fit", "crop");
    params.set("w", String(width));
    params.set("q", String(quality));
    return `${unsplash[1]}?${params.toString()}${unsplash[3] || ""}`;
  }
  const clean = url.replace(/&amp;/g, "&").split(/[?#]/)[0];
  const sb = clean.match(/^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/);
  if (sb) return `${sb[1]}/storage/v1/render/image/public/${sb[2]}?width=${width}&resize=contain&quality=${quality}&format=webp`;
  return url;
}
