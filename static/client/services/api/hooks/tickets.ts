import { useQuery } from "react-query";

import { JiraServices } from "@/services/api/services/jira";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";
import type { IGetTicketsResponse } from "@/services/api/types/tickets";

export function useTickets(
  page: number = 1,
  per_page: number = 10,
  type = "active",
): IUseQueryHookRest<IGetTicketsResponse["data"]> {
  const result = useQuery<IGetTicketsResponse["data"], IApiBasicError>({
    queryKey: ["tickets", page, per_page, type],
    queryFn: () => JiraServices.getTickets(page, per_page, type).then((response: IGetTicketsResponse) => response.data),
  });

  const error = result.error;
  const data = result.data;
  const isLoading = result.isFetching || result.isLoading;

  return { data, error, isLoading };
}
