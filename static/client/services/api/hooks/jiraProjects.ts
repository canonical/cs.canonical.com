// Hook to fetch jira projects
import { useQuery } from "react-query";

import { JiraServices } from "@/services/api/services/jira";
import type { IJiraProject } from "@/services/api/types/jira";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";

export function useJiraProjects(): IUseQueryHookRest<IJiraProject[]> {
  const result = useQuery<IJiraProject[], IApiBasicError>({
    queryKey: ["jiraProjects"],
    queryFn: () => JiraServices.getJiraProjects(),
  });

  return {
    data: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
}
