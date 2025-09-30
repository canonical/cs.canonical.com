import type { ChangeEvent } from "react";

export interface ICustomSearchAndFilterProps<T> {
  label: string | React.ReactNode;
  options: T[];
  selectedOptions: T[];
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (option?: T) => () => void;
  onSelect: (option: T) => void;
  indexKey?: string;
  labelKey?: string;
}
