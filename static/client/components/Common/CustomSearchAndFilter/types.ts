import type { ChangeEvent, ReactNode } from "react";

export interface ICustomSearchAndFilterProps<T> {
  label: string | React.ReactNode;
  options: T[];
  selectedOptions: T[];
  placeholder: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (option?: T) => () => void;
  onSelect: (option: T) => void;
  indexKey?: string;
  labelKey?: string;
  loading?: boolean;
  searchKeys?: string[];
  renderOption?: (option: T) => ReactNode;
  error?: string;
}
