export type BlockType = "text" | "image" | "video" | "audio";

export type GravityBlock = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  content?: string;
  level?: "h2" | "p";
  url?: string;
  caption?: string;
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

export const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
