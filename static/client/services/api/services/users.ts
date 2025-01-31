import { api } from "@/services/api";
import type { IUser, IUsersResponse } from "@/services/api/types/users";

export const getUsers = async (username: string): Promise<IUsersResponse> => {
  return api.users.getUsers(username);
};

export const getCurrentUser = async (): Promise<IUser> => {
  return api.users.getCurrentUser();
};

export * as UsersServices from "./users";
