import { useMemo } from "react";

import { useProjects } from "@/services/api/hooks/projects";
import type { IPage } from "@/services/api/types/pages";
import { flattenPages } from "@/utils/flattenPages";

export type IPageOption = { id: number; name: string; title: string; page: IPage };

export function usePageOptions(excludeId?: number): IPageOption[] {
  const { unfilteredProjects: projects } = useProjects();

  return useMemo(() => {
    if (!projects?.length) return [];
    return projects
      .flatMap((project) => {
        if (!project?.templates) return [];
        return flattenPages(project.templates, excludeId);
      })
      .map((page) => ({
        id: page.id as number,
        name: page.project?.name ? page.project.name + page.name : page.name,
        title: page.title || "",
        page,
      }));
  }, [projects, excludeId]);
}
