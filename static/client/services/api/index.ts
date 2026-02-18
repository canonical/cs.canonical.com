import { JiraApiClass } from "./partials/JiraApiClass";
import { PagesApiClass } from "./partials/PagesApiClass";
import { ProductsApiClass } from "./partials/ProductsApiClass";
import { ReleasesApiClass } from "./partials/ReleasesApiClass";
import { UsersApiClass } from "./partials/UsersApiClass";

class ApiClass {
  public pages: PagesApiClass;
  public users: UsersApiClass;
  public products: ProductsApiClass;
  public jira: JiraApiClass;
  public releases: ReleasesApiClass;

  constructor() {
    this.pages = new PagesApiClass();
    this.users = new UsersApiClass();
    this.products = new ProductsApiClass();
    this.jira = new JiraApiClass();
    this.releases = new ReleasesApiClass();
  }
}

export const api = new ApiClass();
