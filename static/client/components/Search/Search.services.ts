import type { IMatch } from "./Search.types";

import type { IPage, IPagesResponse } from "@/services/api/types/pages";

const checkMatches = (pages: IPage[], value: string, matches: IMatch[], project: string) => {
  pages.forEach((page) => {
    if (page.name?.indexOf(value) >= 0 || (page.title && page.title.indexOf(value) >= 0)) {
      matches.push({
        name: page.name,
        project,
        title: page.title || "",
      });
    }
    if (page.children?.length) {
      checkMatches(page.children, value, matches, project);
    }
  });
};

export const searchForMatches = (value: string, tree: IPagesResponse["data"][]): IMatch[] => {
  const matches: IMatch[] = [];

  tree.forEach((project) => {
    if (project.templates.children?.length) {
      checkMatches(project.templates.children, value, matches, project.name);
    }
  });

  return matches;
};

export const getProjectByName = (
  data: IPagesResponse["data"][] | undefined,
  projectName: string,
): IPagesResponse["data"] | undefined => {
  return data?.find((project) => project.name === projectName);
};

export * as SearchServices from "./Search.services";
