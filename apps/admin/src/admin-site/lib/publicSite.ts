export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

export const publicArticleUrl = (slug: string) =>
  `${PUBLIC_SITE_URL}/articles/${slug}`;
