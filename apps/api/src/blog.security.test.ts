import { describe, expect, it } from "vitest";
import { canTransition, sanitizeArticleHtml } from "./blog";

describe("editorial workflow policy", () => {
  it("enforces only the exact draft, review, published, and archived transition graph", () => {
    expect(canTransition("author", "draft", "review", true)).toBe(true);
    expect(canTransition("author", "review", "draft", true)).toBe(true);
    expect(canTransition("author", "review", "published", true)).toBe(false);
    expect(canTransition("editor", "review", "published", false)).toBe(true);
    expect(canTransition("editor", "draft", "published", false)).toBe(false);
    expect(canTransition("admin", "published", "archived", false)).toBe(true);
    expect(canTransition("admin", "archived", "draft", false)).toBe(true);
    expect(canTransition("admin", "published", "review", false)).toBe(false);
  });
});

describe("rich content sanitization", () => {
  it("removes executable markup and unsafe URL schemes while preserving allowed article structure", () => {
    const output = sanitizeArticleHtml('<h2>Safe title</h2><p>Read <a href="javascript:alert(1)">this</a>.</p><img src="https://cdn.example.com/image.jpg" onerror="alert(1)"><script>alert(1)</script>');

    expect(output).toContain("<h2>Safe title</h2>");
    expect(output).toContain("https://cdn.example.com/image.jpg");
    expect(output).not.toMatch(/script|onerror|javascript:/i);
  });
});
