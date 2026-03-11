import type { VIEW_OWNED, VIEW_REQUESTS, VIEW_REVIEWED, VIEW_TABLE, VIEW_TREE } from "@/config";

export type TView =
  | typeof VIEW_OWNED
  | typeof VIEW_REVIEWED
  | typeof VIEW_TREE
  | typeof VIEW_TABLE
  | typeof VIEW_REQUESTS;

export interface IViewFilter {
  owners: string[];
  reviewers: string[];
  products: string[];
  query: string | null;
}
