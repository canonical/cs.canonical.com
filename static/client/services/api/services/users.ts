import { api } from "@/services/api";
import type { IUser, IUsersResponse } from "@/services/api/types/users";

export const getUsers = async (username: string): Promise<IUsersResponse["data"]> => {
  return api.users.getUsers(username);
};

export const getCurrentUser = async (): Promise<IUser> => {
  return api.users.getCurrentUser();
};

export const getDefaultUser = () => {
  return {
    department: "",
    email: "",
    id: 1,
    jobTitle: "",
    name: "Default",
    team: "",
  } as IUser;
};

export * as UsersServices from "./users";
