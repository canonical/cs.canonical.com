import { api } from "@/services/api";
import type { IReleasesData, IReleasesResponse, IUpdateReleasesResponse } from "@/services/api/types/releases";

export const getReleases = async (): Promise<{ data: IReleasesResponse }> => {
  return api.releases.getReleases();
};

export const updateReleases = async (
  data: IReleasesData,
  commitMessage: string,
): Promise<{ data: IUpdateReleasesResponse }> => {
  return api.releases.updateReleases(data, commitMessage);
};

export * as ReleasesServices from "./releases";
