import type { IPage } from "@/services/api/types/pages";

export interface INavigationElementProps {
  activePageName: string | null;
  page: IPage;
  project: string;
  onSelect: (path: string) => void;
}

export interface INavigationElementBadgeProps {
  page: IPage;
  appearance?: "is-dark" | "is-light";
}
