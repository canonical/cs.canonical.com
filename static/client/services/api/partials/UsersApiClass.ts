import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type { IUser } from "@/services/api/types/users";

export class UsersApiClass extends BasicApiClass {
  public getUsers(username: string): Promise<IUser[]> {
    return this.callApi<{ data: IUser[] }>(ENDPOINTS.getUsers(username), REST_TYPES.GET).then(
      (response) => response.data,
    );
  }

  public getCurrentUser(): Promise<IUser> {
    return this.callApi<{ data: IUser }>(ENDPOINTS.currentUser, REST_TYPES.GET).then((res) => res.data);
  }
}
