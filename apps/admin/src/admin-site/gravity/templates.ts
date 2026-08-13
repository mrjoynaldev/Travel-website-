import type { GravityBlock, GravityDoc, GravitySection } from "./types";

export type Template = { id: string; name: string; category: string; description: string; blocks: GravityBlock[]; sections: GravitySection[] };

const W = 1180;

const text = (id: string, x: number, y: number, width: number, content: string, level: "h2" | "p" = "p", parentId?: string): GravityBlock => ({ id, type: "text", x, y, width, content, level, parentId });
const image = (id: string, x: number, y: number, width: number, url: string, caption?: string, parentId?: string): GravityBlock => ({ id, type: "image", x, y, width, url, caption, parentId });
const video = (id: string, x: number, y: number, width: number, url: string, caption?: string, parentId?: string): GravityBlock => ({ id, type: "video", x, y, width, url, caption, parentId });
const audio = (id: string, x: number, y: number, width: number, url: string, caption?: string, parentId?: string): GravityBlock => ({ id, type: "audio", x, y, width, url, caption, parentId });
const section = (id: string, label: string): GravitySection => ({ id, label });

const img = (seed: string) => `https://picsum.photos/seed/${seed}/1000/700`;

const classicArticle: Template = {
  id: "classic",
  name: "Classic article",
  category: "Article",
  description: "A clean editorial layout of heading and paragraphs. Start here for long-form writing.",
  sections: [],
  blocks: [
    text("b1", 230, 40, 720, "The quiet craft of a well-made thing", "h2"),
    text("b2", 230, 120, 720, "Lead paragraph. A clear, specific promise to the reader that frames the whole story in one or two sentences."),
    text("b3", 230, 240, 720, "Body paragraph. Keep sentences short, show the work, and let the details carry the argument forward naturally."),
    text("b4", 230, 360, 720, "Closing paragraph. Circle back to the promise you made in the lead and leave the reader with something to think about."),
  ],
};

const hybridArticle: Template = {
  id: "hybrid",
  name: "Hybrid article",
  category: "Article + image",
  description: "Editorial text beside a supporting image in a responsive two-column grid.",
  sections: [section("s1", "Text + image")],
  blocks: [
    text("b1", 230, 40, 720, "Field notes from the garden", "h2"),
    text("b2", 32, 120, 560, "The produce aisle, explained. We're farmers, purveyors, and eaters of organically grown food.", "p", "s1"),
    image("b3", 608, 120, 540, img("hybrid"), "Heirloom tomatoes at dawn", "s1"),
    text("b4", 230, 500, 720, "Body paragraph. A hybrid layout pairs the rhythm of writing with the impact of imagery, so neither one does all the work."),
  ],
};

const imageArticle: Template = {
  id: "image",
  name: "Image article",
  category: "Image",
  description: "A full-width lead image with caption, followed by an editorial block.",
  sections: [],
  blocks: [
    image("b1", 32, 40, 1116, img("image-article"), "A single strong image sets the scene"),
    text("b2", 230, 420, 720, "Why this image matters", "h2"),
    text("b3", 230, 500, 720, "Body paragraph. Image-led articles move fast, so every line has to earn its place below the fold."),
    text("b4", 230, 620, 720, "Closing paragraph. End on the detail of the photograph you opened with, and the reader will leave with the frame still in mind."),
  ],
};

const videoStory: Template = {
  id: "video",
  name: "Video + image story",
  category: "Video",
  description: "An embedded video beside a poster image, then supporting text.",
  sections: [section("s1", "Video + image")],
  blocks: [
    text("b1", 230, 40, 720, "Watch, then read", "h2"),
    video("b2", 32, 120, 560, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "The two-minute explainer"),
    image("b3", 608, 120, 540, img("video-poster"), "Behind the scenes still", "s1"),
    text("b4", 230, 500, 720, "Body paragraph. Pair video and imagery when the story needs to be seen before it can be understood."),
  ],
};

const heroHeadline: Template = {
  id: "hero",
  name: "Hero headline",
  category: "Article",
  description: "A big statement headline above a hero image — great for announcements.",
  sections: [],
  blocks: [
    text("b1", 230, 40, 720, "The next chapter begins now", "h2"),
    text("b2", 230, 150, 720, "Supporting paragraph under a big headline. Short, confident, and pointed at exactly one reader."),
    image("b3", 32, 260, 1116, img("hero"), "The view from here"),
  ],
};

const gallery: Template = {
  id: "gallery",
  name: "Photo gallery",
  category: "Image",
  description: "Three captioned images in a responsive row with a short editorial block.",
  sections: [section("s1", "Gallery row")],
  blocks: [
    text("b1", 230, 40, 720, "A gallery of quiet moments", "h2"),
    image("b2", 32, 120, 361, img("g1"), "Morning light", "s1"),
    image("b3", 409, 120, 361, img("g2"), "Slow water", "s1"),
    image("b4", 786, 120, 361, img("g3"), "The long road", "s1"),
    text("b5", 230, 500, 720, "Gallery articles are built on captions — every image earns its space with a line of context."),
  ],
};

const productAnnouncement: Template = {
  id: "product",
  name: "Announcement",
  category: "Marketing",
  description: "Product-style layout: image opposite a short pitch with a call to action.",
  sections: [section("s1", "Image + pitch")],
  blocks: [
    text("b1", 230, 40, 720, "Introducing the field basket", "h2"),
    image("b2", 32, 120, 560, img("product"), "Hand-woven, weather-proof"),
    text("b3", 608, 120, 540, "Everything we ship is grown, packed, and delivered within a day's drive.", "p", "s1"),
    text("b4", 230, 520, 720, "Closing paragraph. Announcements end on the next step: order, subscribe, or come visit the stand."),
  ],
};

const quotedEssay: Template = {
  id: "quote",
  name: "Quoted essay",
  category: "Article",
  description: "A pull-quote as the visual centerpiece, wrapped in short editorial paragraphs.",
  sections: [],
  blocks: [
    text("b1", 230, 40, 720, "What we believe", "h2"),
    text("b2", 230, 130, 720, "“We believe in produce. Tasty produce. The kind you can taste the weather in.”", "p"),
    text("b3", 230, 260, 720, "Body paragraph. Essays lean on rhythm — a short beat after the pull-quote lets the statement land."),
  ],
};

const audioStory: Template = {
  id: "podcast",
  name: "Podcast / audio story",
  category: "Audio",
  description: "An embedded audio player beside a cover image, with show notes to follow.",
  sections: [section("s1", "Audio + cover")],
  blocks: [
    text("b1", 230, 40, 720, "The sound of the season", "h2"),
    audio("b2", 32, 120, 560, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "Episode 12 — full audio"),
    image("b3", 608, 120, 540, img("podcast"), "Season artwork", "s1"),
    text("b4", 230, 500, 720, "Show notes. Everything you need before you press play — who's talking, why it matters, and what comes next."),
  ],
};

export const postTemplates: Template[] = [classicArticle, hybridArticle, imageArticle, videoStory, audioStory, heroHeadline, gallery, productAnnouncement, quotedEssay];

export function offsetTemplate(template: Template, dx: number, dy: number): GravityDoc {
  const sectionIds = new Set(template.sections.map(item => item.id));
  return {
    type: "gravity",
    version: 1,
    sections: template.sections.map(item => ({ ...item, id: `${template.id}_${item.id}` })),
    blocks: template.blocks.map(block => ({ ...block, id: `${template.id}_${block.id}`, parentId: block.parentId && sectionIds.has(block.parentId) ? `${template.id}_${block.parentId}` : block.parentId, x: block.x + dx, y: block.y + dy })),
  };
}

export const CANVAS_WIDTH = W;
