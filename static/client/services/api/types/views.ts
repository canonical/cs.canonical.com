import type { VIEW_OWNED, VIEW_REVIEWED, VIEW_TABLE, VIEW_TREE } from "@/config";

export type TView = typeof VIEW_OWNED | typeof VIEW_REVIEWED | typeof VIEW_TREE | typeof VIEW_TABLE;
