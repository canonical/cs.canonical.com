import type { IPage } from "@/services/api/types/pages";
import { PageStatus } from "@/services/api/types/pages";

export function flattenPages(root: IPage, excludeId?: number): IPage[] {
  const result: IPage[] = [];

  function shouldInclude(page: IPage): boolean {
    if (page.status === PageStatus.TO_DELETE) return false;
    if (excludeId !== undefined && page.id === excludeId) return false;
    return true;
  }

  if (shouldInclude(root)) {
    result.push(root);
  }

  function walk(page: IPage) {
    for (const child of page.children) {
      if (!shouldInclude(child)) continue;
      result.push(child);
      walk(child);
    }
  }

  walk(root);
  return result;
}
