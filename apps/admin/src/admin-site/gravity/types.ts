export type BlockType = "text" | "image" | "video" | "audio" | "button" | "code" | "custom";

export type TextRun = {
  text: string;
  mark?: boolean;
  link?: string;
  button?: boolean;
};

export type GravityBlock = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height?: number;
  rotation?: number;
  content?: string;
  /** Legacy alias from agent/CLI docs: `code` is equivalent to `content` for code blocks */
  code?: string;
  runs?: TextRun[];
  level?: "h2" | "h3" | "p" | "quote" | "list";
  url?: string;
  alt?: string;
  caption?: string;
  link?: string;
  language?: string;
  parentId?: string;
};

export type GravitySection = {
  id: string;
  label: string;
};

export type GravityDoc = {
  type: "gravity";
  version: 1;
  sections: GravitySection[];
  blocks: GravityBlock[];
};

export const uid = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
