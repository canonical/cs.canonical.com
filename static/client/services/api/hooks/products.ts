import { useQuery } from "react-query";

import { ProductsServices } from "@/services/api/services/products";
import type { IProductsResponse } from "@/services/api/types/products";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";

export function useProducts(): IUseQueryHookRest<IProductsResponse["data"]> {
  const result = useQuery<IProductsResponse["data"], IApiBasicError>({
    queryKey: "products",
    queryFn: () => ProductsServices.getProducts().then((res) => res.data),
  });

  const error = result.error;
  const data = result.data;

  return { data, error };
}
