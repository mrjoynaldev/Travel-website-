const LANG_RE = /^[a-z0-9+#-]{1,16}$/;

function decodeEntities(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    // WAF bypass: encode "/*" and "/index.html" patterns that trigger ModSecurity/Cloudflare path traversal rules on POST /api/trpc
    .replace(/\/\*/g, "&#47;&#42;")
    .replace(/\/index\.html/g, "&#47;index&#46;html");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function detectLang(codeText: string, hint?: string): string {
  if (hint && LANG_RE.test(hint.toLowerCase())) return hint.toLowerCase();
  const t = codeText.slice(0, 400);
  if (/^\s*[{}\[]/.test(t) && /["']?\w+["']?\s*:/.test(t)) return "json";
  if (/(^|\n)\s*(def |import |from \w+ import|print\()/.test(t)) return "python";
  if (/(curl\s|--header|-H\s+|sudo |npm |npx |pnpm |git |cd \.|export \w+=)/.test(t)) return "bash";
  if (/^\s*(version:|services:|on:|-{3})/m.test(t) || /^\s*\w+:\s*$/m.test(t)) return "yaml";
  if (/\b(interface|type \w+\s*=|: string|: number)\b/.test(t)) return "ts";
  if (/\b(function|const|let|=>|require\()/.test(t)) return "js";
  if (/\b(SELECT|INSERT INTO|CREATE TABLE)\b/i.test(t)) return "sql";
  return "code";
}

const COPY_BUTTON = `var b=this,n=this.closest('.gravity-code');navigator.clipboard.writeText(n.dataset.code||'').then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)})`;

function wrapPre(preHtml: string, langHint?: string): string {
  const innerMatch = preHtml.match(/^<pre[^>]*>([\s\S]*)<\/pre>$/i);
  const inner = innerMatch ? innerMatch[1] : preHtml;
  const codeText = decodeEntities(stripTags(inner)).replace(/\n$/, "");
  const classLang = inner.match(/class="language-([a-z0-9+#-]{1,16})"/i);
  const lang = detectLang(codeText, (classLang && classLang[1]) || langHint);
  // WAF-safe: data-code as base64 to avoid ModSecurity blocking on "/*", "/index.html", "_redirects", etc. in JSON payload
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(codeText, "utf-8").toString("base64") : btoa(unescape(encodeURIComponent(codeText)));
  return `<div class="gravity-code" data-lang="${lang}" data-code-b64="${b64}"><div class="gravity-code-head"><span class="gravity-code-lang">${lang}</span><button type="button" class="gravity-code-copy" aria-label="Copy code" onclick="var b=this,n=this.closest('.gravity-code');var c=n.dataset.codeB64?atob(n.dataset.codeB64):n.dataset.code||'';navigator.clipboard.writeText(c).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)})">Copy</button></div><pre><code>${escapeAttr(codeText)}</code></pre></div>`;
}

export function enhanceArticleHtml(html: string): string {
  let out = html;
  out = out.replace(/(?:<p[^>]*>)?\s*<span[^>]*class="[^"]*gravity-code-lang[^"]*"[^>]*>\s*([a-zA-Z0-9+#-]{1,16})\s*<\/span>\s*[Cc]opy\s*(?:<\/p>)?(?=\s*<pre)/g, (_m, lang) => `\u0000LANG:${String(lang)}\u0000`);
  out = out.replace(/<p[^>]*>\s*([a-zA-Z0-9+#.-]{0,12})\s*[Cc]opy\s*<\/p>(?=\s*<pre)/g, (_m, prefix) => `\u0000LANG:${String(prefix) || ""}\u0000`);
  out = out.replace(/<p[^>]*>\s*([a-zA-Z0-9+#.-]{0,12})[Cc]opy\s*<\/p>(?=\s*<pre)/g, (_m, prefix) => `\u0000LANG:${String(prefix) || ""}\u0000`);
  out = out.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (pre, offset, full) => {
    const before = full.slice(Math.max(0, offset - 260), offset);
    if (before.includes("gravity-code")) return pre;
    const marker = before.match(/\u0000LANG:([a-zA-Z0-9+#-]{0,16})\u0000\s*$/);
    const hint = marker ? marker[1] : undefined;
    return wrapPre(pre, hint);
  });
  out = out.replace(/\u0000LANG:[a-zA-Z0-9+#-]{0,16}\u0000/g, "");
  out = out.replace(/<p[^>]*>\s*(?:bash|text|sh|shell|javascript|typescript|json|yaml|python|sql|html|css|go|rust|java|c|cpp)\s*[Cc]opy\s*<\/p>/gi, "");
  return out;
}
