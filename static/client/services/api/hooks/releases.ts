import { useQuery } from "react-query";

import { ReleasesServices } from "@/services/api/services/releases";
import type { IReleasesResponse } from "@/services/api/types/releases";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";

export function useReleases(): IUseQueryHookRest<IReleasesResponse> {
  const result = useQuery<IReleasesResponse, IApiBasicError>({
    queryKey: "releases",
    queryFn: () => ReleasesServices.getReleases().then((response:any) => response.data),
    refetchOnWindowFocus: false,
  });
  const error = result.error;
  const data = result.data;
  const isLoading = result.isLoading;
  const isFetching = result.isFetching;

  return { data, error, isLoading, isFetching };
}
