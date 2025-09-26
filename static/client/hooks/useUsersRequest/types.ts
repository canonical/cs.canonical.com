import type { Dispatch, SetStateAction, ChangeEvent } from "react";

import type { IUser } from "@/services/api/types/users";

export interface IUseUsersRequest {
  options: IUser[];
  setOptions: Dispatch<SetStateAction<IUser[]>>;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
