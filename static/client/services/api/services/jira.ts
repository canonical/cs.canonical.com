import { api } from "@/services/api";
import type {
  IReportBugBody,
  IReportBugResponse,
  IRequestFeatureBody,
  IRequestFeatureResponse,
} from "@/services/api/types/jira";

export const reportBug = (body: IReportBugBody): Promise<IReportBugResponse> => {
  return api.jira.reportBug(body);
};

export const requestFeature = (body: IRequestFeatureBody): Promise<IRequestFeatureResponse> => {
  return api.jira.requestFeature(body);
};

export * as JiraServices from "./jira";
