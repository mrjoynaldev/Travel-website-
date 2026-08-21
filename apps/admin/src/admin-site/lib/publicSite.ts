export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://codereportglobal.indevs.in";

export const publicArticleUrl = (slug: string) =>
  `${PUBLIC_SITE_URL}/articles/${slug}`;
