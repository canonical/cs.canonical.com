import { PagesApiClass } from "./partials/PagesApiClass";
import { ProductsApiClass } from "./partials/ProductsApiClass";
import { UsersApiClass } from "./partials/UsersApiClass";

class ApiClass {
  public pages: PagesApiClass;
  public users: UsersApiClass;
  public products: ProductsApiClass;

  constructor() {
    this.pages = new PagesApiClass();
    this.users = new UsersApiClass();
    this.products = new ProductsApiClass();
  }
}

export const api = new ApiClass();
