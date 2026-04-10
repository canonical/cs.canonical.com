export interface ComboSelectProps<T extends Record<string, any>> {
  options: T[];
  value: T | null;
  onSelect: (selected: T) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  indexKey?: keyof T;
  labelKey?: keyof T;
  searchKeys?: (keyof T)[];
  maxVisible?: number;
}
