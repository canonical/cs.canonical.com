import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type { IReleasesData, IReleasesResponse } from "@/services/api/types/releases";

export class ReleasesApiClass extends BasicApiClass {
  public getReleases(): Promise<{ data: IReleasesResponse }> {
    return this.callApi<{ data: IReleasesResponse }>(ENDPOINTS.getReleases, REST_TYPES.GET);
  }

  public updateReleases(data: IReleasesData, commitMessage: string): Promise<void> {
    return this.callApi(ENDPOINTS.updateReleases, REST_TYPES.POST, { releases: data, commit_message: commitMessage });
  }
}
