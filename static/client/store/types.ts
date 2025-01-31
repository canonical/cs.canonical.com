import { type IPagesResponse } from "@/services/api/types/pages";
import { type IUser } from "@/services/api/types/users";

export interface IStore {
  selectedProject: IPagesResponse["data"] | null;
  user: IUser;
  setSelectedProject: (s: IPagesResponse["data"]) => void;
  setUser: (u: IUser) => void;
}
