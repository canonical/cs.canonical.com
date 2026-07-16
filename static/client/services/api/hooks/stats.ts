import { useQuery } from "react-query";

import { PagesServices } from "@/services/api/services/pages";
import type { IPageStats } from "@/services/api/types/pages";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";

export function useWebpageStats(pageUrl: string, projectName: string): IUseQueryHookRest<IPageStats["data"]> {
  const result = useQuery<IPageStats["data"], IApiBasicError>({
    queryKey: ["webpageStats", pageUrl, projectName],
    queryFn: () => PagesServices.getWebpageStats(pageUrl, projectName).then((response: IPageStats) => response.data),
  });

  const error = result.error;
  const data = result.data;
  const isLoading = result.isFetching || result.isLoading;

  return { data, error, isLoading };
}
