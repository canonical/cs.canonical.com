import { useQuery } from "react-query";

import { PagesServices } from "@/services/api/services/pages";
import type { IAssetsResponse } from "@/services/api/types/assets";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";

export function useWebpageAssets(
  pageUrl: string,
  projectName: string,
  page: number = 1,
  perPage: number = 12,
): IUseQueryHookRest<IAssetsResponse["data"]> {
  const result = useQuery<IAssetsResponse["data"], IApiBasicError>({
    queryKey: ["webpageAssets", pageUrl, projectName, page, perPage],
    queryFn: () =>
      PagesServices.getWebpageAssets({ pageUrl, projectName, page, perPage }).then(
        (response: IAssetsResponse) => response.data,
      ),
  });

  const error = result.error;
  const data = result.data;
  const isLoading = result.isFetching || result.isLoading;

  return { data, error, isLoading };
}
