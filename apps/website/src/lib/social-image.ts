export function optimizedSocialImage(url: string | undefined | null, width = 1200, height = 630): string | undefined {
  if (!url || !/^https?:\/\//.test(url)) return url ?? undefined;
  const clean = url.replace(/&amp;/g, "&").split(/[?#]/)[0];
  const match = clean.match(/^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/);
  if (!match) return url;
  return `${match[1]}/storage/v1/render/image/public/${match[2]}?width=${width}&height=${height}&resize=cover&quality=75`;
}
