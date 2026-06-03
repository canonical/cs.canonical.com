import { api } from "@/services/api";
import type { ITeam } from "@/services/api/types/teams";

export const getTeams = async (): Promise<ITeam[]> => {
  return api.teams.getTeams();
};

export * as TeamsServices from "./teams";
