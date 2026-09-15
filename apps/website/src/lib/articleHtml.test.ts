import { describe, expect, it } from "vitest";
import { enhanceArticleHtml, injectRelatedLinks } from "./articleHtml";

const html5p =
  "<p>One</p><p>Two</p><p>Three</p><p>Four</p><p>Five</p><p>Six</p>";

describe("injectRelatedLinks", () => {
  it("leaves html untouched when fewer than two related posts exist", () => {
    expect(injectRelatedLinks(html5p, [])).toBe(html5p);
    expect(
      injectRelatedLinks(html5p, [{ slug: "only-one", title: "Only" }])
    ).toBe(html5p);
  });

  it("only links real related slugs — never a hardcoded hub page", () => {
    const out = injectRelatedLinks(html5p, [
      { slug: "sundarban-safari-guide", title: "Safari Guide" },
      { slug: "best-time-to-visit-sundarban", title: "Best Time" },
    ]);
    expect(out).toContain("/articles/sundarban-safari-guide");
    expect(out).toContain("/articles/best-time-to-visit-sundarban");
    expect(out).not.toContain("ai-code-production-checks");
    expect(out).not.toContain("production checks");
  });

  it("filters invalid slugs and blank titles", () => {
    const out = injectRelatedLinks(html5p, [
      { slug: "Bad Slug!!", title: "Bad" },
      { slug: "good-slug", title: "   " },
      { slug: "first-good", title: "First" },
      { slug: "second-good", title: "Second" },
    ]);
    expect(out).toContain("/articles/first-good");
    expect(out).toContain("/articles/second-good");
    expect(out).not.toContain("Bad Slug");
  });

  it("escapes titles to prevent stored XSS", () => {
    const out = injectRelatedLinks(html5p, [
      { slug: "a-post", title: '<script>alert("x")</script>' },
      { slug: "b-post", title: "B" },
    ]);
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("skips injection when the author already wrote Also read / Related blocks", () => {
    const authored = `${html5p}<p>Also read: <a href="/articles/x">X</a></p>`;
    expect(
      injectRelatedLinks(authored, [
        { slug: "a-post", title: "A" },
        { slug: "b-post", title: "B" },
      ])
    ).toBe(authored);
  });
});

describe("enhanceArticleHtml", () => {
  it("wraps bare <pre> blocks for copy support without dropping code", () => {
    const out = enhanceArticleHtml("<p>Hello</p><pre><code>const a = 1;</code></pre>");
    expect(out).toContain("gravity-code");
    expect(out).toContain("const a = 1;");
  });
});
