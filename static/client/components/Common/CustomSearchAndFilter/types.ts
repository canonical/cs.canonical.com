import type { ChangeEvent } from "react";

import type { IUser } from "@/services/api/types/users";

export interface ICustomSearchAndFilterProps<T> {
  label: string | JSX.Element;
  options: T[];
  selectedOptions: T[];
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (option?: T) => () => void;
  onSelect: (option: T) => void;
  indexKey?: string;
  labelKey?: string;
}

export interface IUserSearchAndFilterProps extends ICustomSearchAndFilterProps<IUser> {}
