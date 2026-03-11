import { BasicApiClass } from "./BasicApiClass";

import { ENDPOINTS, REST_TYPES } from "@/services/api/constants";
import type {
  IReportBugBody,
  IReportBugResponse,
  IRequestFeatureBody,
  IRequestFeatureResponse,
} from "@/services/api/types/jira";
import type { IGetTicketsParams, IGetTicketsResponse } from "@/services/api/types/tickets";

export class JiraApiClass extends BasicApiClass {
  public reportBug(body: IReportBugBody): Promise<IReportBugResponse> {
    return this.callApi(ENDPOINTS.reportBug, REST_TYPES.POST, body);
  }

  public requestFeature(body: IRequestFeatureBody): Promise<IRequestFeatureResponse> {
    return this.callApi(ENDPOINTS.requestFeature, REST_TYPES.POST, body);
  }

  public getTickets(params: IGetTicketsParams): Promise<IGetTicketsResponse> {
    return this.callApi(
      `${ENDPOINTS.getTickets}?page=${params.page}&per_page=${params.per_page}&type=${params.type}`,
      REST_TYPES.GET,
    );
  }
}
