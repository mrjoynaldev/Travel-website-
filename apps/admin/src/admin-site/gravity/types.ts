export type BlockType = "text" | "image" | "video" | "audio" | "button";

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
  runs?: TextRun[];
  level?: "h2" | "p";
  url?: string;
  caption?: string;
  link?: string;
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
