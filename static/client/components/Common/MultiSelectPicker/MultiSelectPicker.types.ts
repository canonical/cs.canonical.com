export interface MultiSelectPickerProps<T extends Record<string, any>> {
  options: T[];
  value: T[];
  onSelect: (selected: T[]) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  indexKey?: keyof T;
  labelKey?: keyof T;
  searchKeys?: (keyof T)[];
}
