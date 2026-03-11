import { api } from "@/services/api";
import type {
  IReportBugBody,
  IReportBugResponse,
  IRequestFeatureBody,
  IRequestFeatureResponse,
} from "@/services/api/types/jira";
import type { IGetTicketsParams, IGetTicketsResponse } from "@/services/api/types/tickets";

export const reportBug = (body: IReportBugBody): Promise<IReportBugResponse> => {
  return api.jira.reportBug(body);
};

export const requestFeature = (body: IRequestFeatureBody): Promise<IRequestFeatureResponse> => {
  return api.jira.requestFeature(body);
};

export const getTickets = async (
  page: number = 1,
  per_page: number = 10,
  type = "active",
): Promise<IGetTicketsResponse> => {
  const params = { page, per_page, type } as IGetTicketsParams;
  return api.jira.getTickets(params);
};

export * as JiraServices from "./jira";
