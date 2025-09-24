import type { IPage, PageStatus } from "@/services/api/types/pages";

export interface INavigationElementProps {
  activePageName: string | null;
  page: IPage;
  project: string;
  onSelect: (path: string) => void;
}

export interface NavigationElementBadgeProps {
  status: (typeof PageStatus)[keyof typeof PageStatus];
  appearance?: "is-dark" | "is-light";
}
