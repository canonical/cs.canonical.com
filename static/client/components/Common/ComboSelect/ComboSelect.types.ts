export interface ComboSelectProps<T extends Record<string, any>> {
  options: T[];
  value: T | T[] | null;
  onSelect: (selected: T | T[] | null) => void;
  onClear?: () => void;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  indexKey?: keyof T;
  labelKey?: keyof T;
  searchKeys?: (keyof T)[];
}
