import { useState } from "react";

import { usePages } from "./pages";

import type { IPagesResponse } from "@/services/api/types/pages";
import type { IUseQueryHookRest } from "@/services/api/types/query";

export function useProjects(): IUseQueryHookRest<IPagesResponse["data"][]> {
  const { data, isLoading } = usePages();

  const [projects, setProjects] = useState<IPagesResponse["data"][]>([]);

  const hasData = data?.every((project) => project?.data);
  if (!isLoading && data?.length && hasData && projects.length !== data.length) {
    setProjects(data.map((project) => project.data));
  }

  return { data: projects, error: null, isLoading };
}
