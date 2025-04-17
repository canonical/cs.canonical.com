import { useState } from "react";

import { usePages } from "./pages";

import type { IPage, IPagesResponse } from "@/services/api/types/pages";
import { useViewsStore } from "@/store/views";

export function useProjects() {
  const { data, isLoading } = usePages();
  const filter = useViewsStore((state) => state.filter);
  const isFilterApplied = filter.owners.length || filter.reviewers.length || filter.products.length || filter.query;

  const [projects, setProjects] = useState<IPagesResponse["data"][]>([]);

  const hasData = data?.every((project) => project?.data);
  if (!isLoading && data?.length && hasData && projects.length !== data.length) {
    setProjects(data.map((project) => project.data));
  }

  function filterProjectsAndPages(data: IPagesResponse["data"]) {
    function filterChildren(children: IPage[]) {
      return children
        .map((child) => {
          const filteredChild: IPage = {
            ...child,
            children: filterChildren(child.children || []) as IPage[],
          };

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
              (child.url?.toLowerCase()?.includes(filter.query.toLocaleLowerCase()) ||
                child.name?.toLowerCase()?.includes(filter.query.toLowerCase()));
          }

          if (condition || filteredChild.children.length > 0) return filteredChild;

          return null;
        })
        .filter(Boolean);
    }

    return {
      ...data,
      templates: {
        ...data.templates,
        children: filterChildren(data.templates?.children || []) as IPage[],
      },
    };
  }

  function getFilteredProjects() {
    if (isFilterApplied) return projects.map((project) => filterProjectsAndPages(project));
    return projects;
  }

  return { data: getFilteredProjects(), isLoading, isFilterApplied };
}
