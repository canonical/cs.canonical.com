import { api } from "@/services/api";
import type { IReleasesData, IReleasesResponse } from "@/services/api/types/releases";

export const getReleases = async (): Promise<IReleasesResponse> => {
  return api.releases.getReleases();
};

export const submitRelease = async (data: IReleasesData): Promise<void> => {
  return api.releases.submitRelease(data);
};

export * as ReleasesServices from "./releases";