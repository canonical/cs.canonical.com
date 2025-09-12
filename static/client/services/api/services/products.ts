import { api } from "@/services/api";
import type { IProductsResponse } from "@/services/api/types/products";

export const getProducts = async (): Promise<IProductsResponse> => {
  return api.products.getProducts();
};

export const addProduct = async (name: string) => {
  return api.products.addProduct(name);
};
export const editProduct = async (productId: number, name: string) => {
  return api.products.editProduct(productId, name);
};
export const deleteProduct = async (productId: number) => {
  return api.products.deleteProduct(productId);
};

export * as ProductsServices from "./products";
