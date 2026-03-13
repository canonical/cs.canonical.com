export interface IProduct {
  id: number;
  name: string;
}

export interface IProductsResponse {
  data: IProduct[];
}
export interface ICRUDProductResponse {
  data: {
    message: string;
    product: IProduct;
  };
}

export type IProductAction = "edit" | "delete" | "add" | null;
