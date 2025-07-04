import type { QueryClient } from "react-query";

import type { IPage, IPagesResponse } from "@/services/api/types/pages";

// recursively find the page in the tree by the given name (URL)
export function findPage(
  tree: IPage,
  pageName: string,
  prefix: string = "",
  returnObject: boolean = false,
): boolean | IPage {
  const parts = pageName.split("/");

  for (let i = 0; i < tree.children.length; i += 1) {
    if (tree.children[i].name === `${prefix}/${parts[1]}`) {
      if (parts.length > 2) {
        return findPage(tree.children[i], `/${parts.slice(2).join("/")}`, `${prefix}/${parts[1]}`, returnObject);
      }
      return returnObject ? tree.children[i] : true;
    }
  }

  return false;
}

export function findPageById(pageId: number, tree: IPage): IPage | boolean {
  if (tree.id === pageId) return tree;
  for (let i = 0; i < tree.children.length; i += 1) {
    if (pageId === tree.children[i].id) return tree.children[i];
    if (tree.children[i].children?.length) {
      const found = findPageById(pageId, tree.children[i]);
      if (found) return found;
    }
  }
  return false;
}

export function insertPage(page: IPage, queryClient: QueryClient) {
  if (!page || !page.project?.name || !page.id || !page.parent_id) return;

  const projectName = page.project.name;

  // Access the specific cache entry
  const key = ["pages", projectName];
  const oldCache = queryClient.getQueryData<IPagesResponse["data"]>(key); // Replace 'any' with your exact type

  if (!oldCache) return;

  // Check if the page already exists
  const pageExists = findPageById(page.id, oldCache.templates);
  if (pageExists) return;

  // find the parent page to insert the new page under

  const parentPage = findPageById(page.parent_id, oldCache.templates) as IPage;

  if (!parentPage) return;
  if (!parentPage.hasOwnProperty("children")) parentPage.children = [];

  // add the new page to the parent's children
  parentPage.children.push(page);

  // Immutable update: insert page
  const updatedTemplates = {
    ...oldCache.templates,
    children: [...oldCache.templates.children],
  };

  const updatedData = {
    ...oldCache,
    templates: updatedTemplates,
  };

  // Update the React Query cache
  queryClient.setQueryData(key, updatedData);
}

export * as TreeServices from "./pages";
