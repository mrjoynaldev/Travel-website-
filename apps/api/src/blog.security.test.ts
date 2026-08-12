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

  it("preserves rich media and call-to-action blocks while rejecting unsafe embeds", () => {
    const output = sanitizeArticleHtml(
      '<p>Body</p>' +
        '<audio controls preload="metadata"><source src="https://cdn.example.com/song.mp3" type="audio/mpeg" /></audio>' +
        '<a class="cta-button cta-primary" href="https://example.com/guide" target="_blank" rel="noopener noreferrer">Read the guide</a>' +
        '<iframe src="https://www.youtube-nocookie.com/embed/abc123" title="A video" allowfullscreen="true"></iframe>' +
        '<iframe src="https://evil.example.com/steal"></iframe>' +
        '<mark>highlighted</mark><u>underlined</u><del>struck</del>' +
        '<figure><img src="https://cdn.example.com/a.jpg" alt="alt"><figcaption>Caption</figcaption></figure>' +
        '<table><tr><th>Head</th></tr><tr><td>Cell</td></tr></table>',
    );

    expect(output).toContain('<audio controls preload="metadata">');
    expect(output).toContain('song.mp3');
    expect(output).toContain('class="cta-button cta-primary"');
    expect(output).toContain('Read the guide');
    expect(output).toContain('www.youtube-nocookie.com');
    expect(output).toContain('<mark>highlighted</mark>');
    expect(output).toContain('<u>underlined</u>');
    expect(output).toContain('<figcaption>Caption</figcaption>');
    expect(output).toContain('<th>Head</th>');
    expect(output).not.toContain('evil.example.com');
    expect(output).not.toMatch(/<iframe(?![^>]*\bsrc=)[^>]*><\/iframe>/);
    expect(output).not.toMatch(/script|onerror|javascript:/i);
  });
});
