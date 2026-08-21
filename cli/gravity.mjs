/**
 * Gravity block → HTML serializer.
 * Mirrors apps/admin/src/admin-site/gravity/serialize.ts so CLI-generated
 * articles render identically to canvas-built ones.
 */

/* ------------------------------------------------------------------ */
/* Gravity block HTML serializer (mirrors apps/admin serialize.ts)     */
/* ------------------------------------------------------------------ */

const esc = value =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function youtubeId(url) {
  const match = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([\w-]{6,})/);
  return match ? match[1] : null;
}

function videoEmbed(url) {
  const youtube = youtubeId(url);
  if (youtube) return `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${youtube}" title="Embedded video" frameborder="0" allowfullscreen></iframe>`;
  const vimeo = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Embedded video" frameborder="0" allowfullscreen></iframe>`;
  return `<video controls preload="metadata"><source src="${esc(url)}"></video>`;
}

function audioEmbed(url) {
  const id = youtubeId(url);
  if (id) return `<iframe class="gravity-audio-youtube" src="https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1" title="Audio" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  return `<audio controls preload="metadata" src="${esc(url)}">Your browser does not support audio playback.</audio>`;
}

const wrapLink = (html, block) => {
  if (!block.link) return html;
  return `<a class="gravity-block-link" href="${esc(block.link)}">${html}</a>`;
};

function renderRuns(block) {
  const runs = block.runs && block.runs.length ? block.runs : block.content ? [{ text: block.content }] : [];
  return runs.map(run => {
    let inner = esc(run.text);
    if (run.link) {
      const cls = run.button ? "cta-button cta-link" : "gravity-inline-link";
      inner = `<a class="${cls}" href="${esc(run.link)}">${inner}</a>`;
    }
    if (run.mark && !run.button) inner = `<mark>${inner}</mark>`;
    return inner;
  }).join("");
}

function codeBlockMarkup(block) {
  let code = (block.content || "").replace(/\u200b|\u200c|\u200d|\ufeff/g, "");
  // Strip ChatGPT-style paste residue: a leading line like "yamlCopy" / "Copy".
  const lines = code.split("\n");
  while (lines.length && /^\s*[\w+-]*\s*copy\s*$/i.test(lines[0])) lines.shift();
  while (lines.length && /^\s*copy\s*$/i.test(lines[lines.length - 1])) lines.pop();
  code = lines.join("\n");
  // Language chip: strip "Copy" residue from the label itself ("yamlCopy" -> "yaml").
  const rawLang = String(block.language || "").replace(/copy/gi, "").trim().toLowerCase();
  const lang = /^[a-z0-9+#-]{1,16}$/.test(rawLang) ? rawLang : "code";
  const copy = `var b=this,n=this.closest('.gravity-code');navigator.clipboard.writeText(n.dataset.code||'').then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)})`;
  return `<div class="gravity-code" data-code="${esc(code)}" data-lang="${esc(lang)}"><div class="gravity-code-head"><span class="gravity-code-lang">${esc(lang)}</span><button type="button" class="gravity-code-copy" aria-label="Copy code" onclick="${copy}">Copy</button></div><pre><code>${esc(code)}</code></pre></div>`;
}

function blockMarkup(block) {
  if (block.type === "image") {
    const caption = block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : "";
    return wrapLink(`<figure class="gravity-media"><img src="${esc(block.url || "")}" alt="${esc(block.alt || block.caption || "")}" loading="lazy">${caption}</figure>`, block);
  }
  if (block.type === "video") {
    const caption = block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : "";
    return wrapLink(`<figure class="gravity-media">${videoEmbed(block.url || "")}${caption}</figure>`, block);
  }
  if (block.type === "audio") {
    const caption = block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : "";
    return wrapLink(`<figure class="gravity-media${youtubeId(block.url || "") ? " gravity-audio-strip" : ""}">${audioEmbed(block.url || "")}${caption}</figure>`, block);
  }
  if (block.type === "text") {
    if (block.level === "list") {
      const items = (block.content || "").split("\n").filter(line => line.trim()).map(line => `<li>${esc(line)}</li>`).join("");
      return items ? `<ul class="gravity-list">${items}</ul>` : "";
    }
    if (block.level === "quote") {
      return wrapLink(`<blockquote class="gravity-text gravity-quote">${renderRuns(block)}</blockquote>`, block);
    }
    const tag = block.level === "h2" ? "h2" : block.level === "h3" ? "h3" : "p";
    return wrapLink(`<${tag} class="gravity-text">${renderRuns(block)}</${tag}>`, block);
  }
  if (block.type === "button") {
    const href = esc(block.link || "#");
    return `<p class="gravity-button-wrap"><a class="cta-button cta-primary" href="${href}">${esc(block.content || "Button")}</a></p>`;
  }
  if (block.type === "code") {
    return codeBlockMarkup(block);
  }
  if (block.type === "custom") {
    return `<div class="gravity-custom">${block.content || ""}</div>`;
  }
  return "";
}

const rowsOverlap = (a, b, gap = 24) => Math.min(a.y + 90, b.y + 90) - Math.max(a.y, b.y) > -gap;

function renderSection(children) {
  const sideBySide = children.some((a, index) => children.slice(index + 1).some(b => Math.abs(a.y - b.y) <= 12 && rowsOverlap(a, b)));
  const ordered = [...children].sort((a, b) => (sideBySide ? a.x - b.x : a.y - b.y));
  if (sideBySide) {
    const items = ordered.map(block => `<div class="gravity-cell">${blockMarkup(block)}</div>`).join("");
    return `<section class="gravity-section gravity-grid" style="grid-template-columns:repeat(${ordered.length}, minmax(0, 1fr));gap:1rem">${items}</section>`;
  }
  return `<section class="gravity-section gravity-stack">${ordered.map(blockMarkup).join("")}</section>`;
}

export function gravityToHtml(blocks, sections) {
  const groups = sections.map(section => ({ section, children: blocks.filter(block => block.parentId === section.id) })).filter(group => group.children.length > 0);
  const free = blocks.filter(block => !block.parentId);
  const units = [
    ...groups.map(group => ({ kind: "section", group, y: Math.min(...group.children.map(child => child.y)) })),
    ...free.map(block => ({ kind: "block", block, y: block.y })),
  ].sort((a, b) => a.y - b.y);
  return units.map(unit => (unit.kind === "section" ? renderSection(unit.group.children) : blockMarkup(unit.block))).join("\n");
}
