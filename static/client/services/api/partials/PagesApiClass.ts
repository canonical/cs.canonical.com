import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type { IGetWebpageAssets } from "@/services/api/types/assets";
import type {
  INewPage,
  INewPageResponse,
  IPagesResponse,
  IRequestChanges,
  IRequestRemoval,
  ISetProducts,
} from "@/services/api/types/pages";
import { type IUser } from "@/services/api/types/users";

export class PagesApiClass extends BasicApiClass {
  public getPages(domain: string, noCache?: boolean): Promise<IPagesResponse> {
    return this.callApi<IPagesResponse>(ENDPOINTS.getPagesTree(domain, noCache), REST_TYPES.GET);
  }

  public setOwner(user: IUser | {}, webpageId: number): Promise<void> {
    return this.callApi(ENDPOINTS.setOwner, REST_TYPES.POST, {
      user_struct: user,
      webpage_id: webpageId,
    });
  }

  public setReviewers(users: IUser[], webpageId: number): Promise<void> {
    return this.callApi(ENDPOINTS.setReviewers, REST_TYPES.POST, {
      user_structs: users,
      webpage_id: webpageId,
    });
  }

  public createPage(page: INewPage): Promise<INewPageResponse> {
    return this.callApi(ENDPOINTS.createNewPage, REST_TYPES.POST, page);
  }

  public requestChanges(body: IRequestChanges): Promise<void> {
    return this.callApi(ENDPOINTS.requestChanges, REST_TYPES.POST, body);
  }

  public requestRemoval(body: IRequestRemoval): Promise<void> {
    return this.callApi(ENDPOINTS.requestRemoval, REST_TYPES.POST, body);
  }

  public setProducts(body: ISetProducts) {
    return this.callApi(ENDPOINTS.setProducts, REST_TYPES.POST, body);
  }

  public getWebpageAssets(body: IGetWebpageAssets) {
    return this.callApi(`${ENDPOINTS.getWebpageAssets}?page=${body.page}&per_page=${body.perPage}`, REST_TYPES.POST, {
      webpage_url: body.pageUrl,
      project_name: body.projectName,
    });
  }
}
