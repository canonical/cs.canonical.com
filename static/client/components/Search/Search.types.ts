export interface SearchProps<T extends Record<string, any>> {
  options: T[];
  value: T | null;
  onSelect: (option: T) => void;
  onClear: () => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  indexKey?: keyof T;
  labelKey?: keyof T;
  titleKey?: keyof T;
  searchKeys?: (keyof T)[];
}
