import { api } from "@/services/api";
import type { IProductsResponse } from "@/services/api/types/products";

export const getProducts = async (): Promise<IProductsResponse> => {
  return api.products.getProducts();
};

export * as ProductsServices from "./products";
