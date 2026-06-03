import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type { ITeam } from "@/services/api/types/teams";

export class TeamsApiClass extends BasicApiClass {
  public getTeams(): Promise<ITeam[]> {
    return this.callApi<{ data: ITeam[] }>(ENDPOINTS.getTeams, REST_TYPES.GET).then(
      (response) => response.data,
    );
  }
}
