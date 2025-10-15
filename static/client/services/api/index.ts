import { JiraApiClass } from "./partials/JiraApiClass";
import { PagesApiClass } from "./partials/PagesApiClass";
import { ProductsApiClass } from "./partials/ProductsApiClass";
import { UsersApiClass } from "./partials/UsersApiClass";

class ApiClass {
  public pages: PagesApiClass;
  public users: UsersApiClass;
  public products: ProductsApiClass;
  public jira: JiraApiClass;

  constructor() {
    this.pages = new PagesApiClass();
    this.users = new UsersApiClass();
    this.products = new ProductsApiClass();
    this.jira = new JiraApiClass();
  }
}

export const api = new ApiClass();
