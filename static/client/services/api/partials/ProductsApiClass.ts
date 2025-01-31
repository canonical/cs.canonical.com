import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type { IProductsResponse } from "@/services/api/types/products";

export class ProductsApiClass extends BasicApiClass {
  public getProducts(): Promise<IProductsResponse> {
    return this.callApi<IProductsResponse>(ENDPOINTS.getProducts, REST_TYPES.GET);
  }
}
