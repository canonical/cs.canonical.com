import { useQuery } from "react-query";

import { ProductsServices } from "@/services/api/services/products";
import type { IProductsResponse } from "@/services/api/types/products";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";

export function useProducts(): IUseQueryHookRest<IProductsResponse> {
  const result = useQuery<IProductsResponse, IApiBasicError>({
    queryKey: "products",
    queryFn: ProductsServices.getProducts,
  });

  const isLoading = result.isLoading;
  const isFetching = result.isFetching;
  const error = result.error;
  const data = result.data;

  return { isLoading, data, error, isFetching };
}
