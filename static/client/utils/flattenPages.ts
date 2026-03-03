import type { IPage } from "@/services/api/types/pages";
import { PageStatus } from "@/services/api/types/pages";

export function flattenPages(root: IPage, excludeId?: number): IPage[] {
  const result: IPage[] = [];

  function walk(page: IPage) {
    for (const child of page.children) {
      if (child.status === PageStatus.TO_DELETE) continue;
      if (excludeId !== undefined && child.id === excludeId) continue;
      result.push(child);
      walk(child);
    }
  }

  walk(root);
  return result;
}
