import { useState } from "react";

import { usePages } from "./pages";

import type { IPage, IPagesResponse } from "@/services/api/types/pages";
import { useViewsStore } from "@/store/views";

export function useProjects() {
  const { data, isLoading } = usePages();
  const filter = useViewsStore((state) => state.filter);
  const isFilterApplied = filter.owners.length || filter.reviewers.length || filter.products.length || filter.query;

  const [projects, setProjects] = useState<IPagesResponse["data"][]>([]);

  const hasData = data?.every((project) => project!);
  if (!isLoading && data?.length && hasData && projects.length !== data.length) {
    setProjects(data);
  }

  function filterProjectsAndPages(data: IPagesResponse["data"]) {
    function filterChildren(children: IPage[]): IPage[] {
      let results: IPage[] = [];

      for (const child of children) {
        const filteredChildChildren = filterChildren(child.children || []);

        let condition = true;

        if (filter.owners?.length) {
          condition = condition && filter.owners.includes(child.owner?.email);
        }

        if (filter.reviewers?.length) {
          condition =
            condition && filter.reviewers.some((reviewer) => child.reviewers?.some((rev) => rev.email === reviewer));
        }

        if (filter.products?.length) {
          condition =
            condition &&
            filter.products.some((product) =>
              child.products?.some((prod) => prod.name.toLowerCase() === product.toLowerCase()),
            );
        }

        if (filter.query) {
          condition =
            condition &&
            (child.url?.toLowerCase()?.includes(filter.query.toLowerCase()) ||
              child.name?.toLowerCase()?.includes(filter.query.toLowerCase()));
        }

        if (condition) {
          // Include the node itself, along with its filtered children
          results.push({
            ...child,
            children: filteredChildChildren,
          });
        } else {
          // Parent doesn't match, but children might — so promote them
          results.push(...filteredChildChildren);
        }
      }

      return results;
    }

    return {
      ...data,
      templates: {
        ...data.templates,
        children: filterChildren(data.templates?.children || []),
      },
    };
  }

  function getFilteredProjects() {
    if (isFilterApplied) return projects.map((project) => filterProjectsAndPages(project));
    return projects;
  }

  return {
    data: getFilteredProjects(),
    unfilteredProjects: data,
    isLoading,
    isFilterApplied,
  };
}
