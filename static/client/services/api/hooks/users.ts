// Hook to fetch users data
import { useQuery } from "react-query";

import { UsersServices } from "@/services/api/services/users";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";
import type { IUsersResponse } from "@/services/api/types/users";

export function useUsers(): IUseQueryHookRest<IUsersResponse> {
  const result = useQuery<IUsersResponse, IApiBasicError>({
    queryKey: ["users"],
    queryFn: () => UsersServices.getUsers(""),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
  });

  return {
    data: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
}
