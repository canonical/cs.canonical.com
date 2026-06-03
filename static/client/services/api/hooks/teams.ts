import { useQuery } from "react-query";

import { TeamsServices } from "@/services/api/services/teams";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";
import type { ITeam } from "@/services/api/types/teams";

export function useTeams(): IUseQueryHookRest<ITeam[]> {
  const result = useQuery<ITeam[], IApiBasicError>({
    queryKey: ["teams"],
    queryFn: () => TeamsServices.getTeams(),
  });

  return {
    data: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
}
