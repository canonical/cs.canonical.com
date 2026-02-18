import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type { IReleasesData, IReleasesResponse } from "@/services/api/types/releases";

export class ReleasesApiClass extends BasicApiClass {
  public getReleases(): Promise<IReleasesResponse> {
    return this.callApi<IReleasesResponse>(ENDPOINTS.getReleases, REST_TYPES.GET);
  }

  public submitRelease(data: IReleasesData): Promise<void> {
    return this.callApi(ENDPOINTS.submitRelease, REST_TYPES.POST, { releases: data });
  }
}
