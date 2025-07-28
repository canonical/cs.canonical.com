import type { ChangeEvent } from "react";

import type { IUser } from "@/services/api/types/users";

export interface ICustomSearchAndFilterProps {
  label: string | JSX.Element;
  options: IUser[];
  selectedOptions: IUser[];
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (option?: IUser) => () => void;
  onSelect: (option: IUser) => void;
}
