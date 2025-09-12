import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type { ICRUDProductResponse, IProductsResponse } from "@/services/api/types/products";

export class ProductsApiClass extends BasicApiClass {
  public getProducts(): Promise<IProductsResponse> {
    return this.callApi<IProductsResponse>(ENDPOINTS.getProducts, REST_TYPES.GET);
  }
  public addProduct(name: string): Promise<ICRUDProductResponse> {
    return this.callApi(ENDPOINTS.crudProduct, REST_TYPES.POST, { name: name });
  }
  public editProduct(productId: number, name: string): Promise<ICRUDProductResponse> {
    return this.callApi(ENDPOINTS.crudProduct + `/${productId}`, REST_TYPES.PUT, { name: name });
  }
  public deleteProduct(productId: number): Promise<ICRUDProductResponse> {
    return this.callApi(ENDPOINTS.crudProduct + `/${productId}`, REST_TYPES.DELETE);
  }
}
