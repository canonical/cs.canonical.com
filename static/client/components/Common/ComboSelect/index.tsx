import { type MouseEvent, type ReactNode, useCallback, useMemo, useState } from "react";

import classNames from "classnames";

import type { ComboSelectProps } from "./ComboSelect.types";

import "./_ComboSelect.scss";

const ComboSelect = <T extends Record<string, any>>({
  options,
  value,
  onSelect,
  onClear,
  multiple = false,
  className,
  disabled,
  placeholder = "Select...",
  error,
  indexKey = "id" as keyof T,
  labelKey = "name" as keyof T,
  searchKeys,
}: ComboSelectProps<T>): ReactNode => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const keysToSearch = useMemo(() => searchKeys ?? [labelKey], [searchKeys, labelKey]);

  const getLabel = useCallback((item: T): string => String(item[labelKey] ?? ""), [labelKey]);

  const displayValue = useMemo(() => {
    if (query) return query;
    if (!value) return "";
    if (Array.isArray(value)) return value.map(getLabel).join(", ");
    return getLabel(value);
  }, [query, value, getLabel]);

  const filtered = useMemo(() => {
    if (query.length < 3) return [];
    const lowerQuery = query.toLowerCase();
    return options.filter((opt) =>
      keysToSearch.some((key) => {
        const val = opt[key];
        return typeof val === "string" && val.toLowerCase().includes(lowerQuery);
      }),
    );
  }, [query, options, keysToSearch]);

  const isSelected = useCallback(
    (option: T): boolean => {
      if (!value) return false;
      if (Array.isArray(value)) return value.some((v) => v[indexKey] === option[indexKey]);
      return value[indexKey] === option[indexKey];
    },
    [value, indexKey],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (!inputValue && value && !multiple) {
        onClear?.();
      }
      setQuery(inputValue);
      setIsOpen(inputValue.length >= 3);
    },
    [value, multiple, onClear],
  );

  const handleSelect = useCallback(
    (e: MouseEvent<HTMLLIElement>) => {
      const idx = Number(e.currentTarget.dataset.idx);
      const option = filtered[idx];
      if (!option) return;

      if (multiple) {
        const currentValue = (Array.isArray(value) ? value : []) as T[];
        const alreadySelected = currentValue.some((v) => v[indexKey] === option[indexKey]);
        const newValue = alreadySelected
          ? currentValue.filter((v) => v[indexKey] !== option[indexKey])
          : [...currentValue, option];
        onSelect(newValue);
      } else {
        onSelect(option);
        setQuery("");
        setIsOpen(false);
      }
    },
    [filtered, onSelect, multiple, value, indexKey],
  );

  const handleBlur = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const handleOptionMouseDown = useCallback((e: MouseEvent<HTMLLIElement>) => {
    e.preventDefault();
  }, []);

  const wrapperClassName = error ? "p-form-validation is-error" : undefined;

  return (
    <div className={classNames("p-combo-select", wrapperClassName, className)}>
      <div className="p-combo-select__input-wrapper">
        <input
          autoComplete="off"
          className="p-form__control"
          disabled={disabled}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder={!value || (Array.isArray(value) && value.length === 0) ? placeholder : undefined}
          type="text"
          value={displayValue}
        />
        <span className="p-combo-select__chevron">▾</span>
      </div>
      {isOpen && filtered.length > 0 && (
        <ul className="p-combo-select__dropdown" role="listbox">
          {filtered.map((option, idx) => (
            <li
              aria-selected={isSelected(option)}
              className={classNames("p-combo-select__item", {
                "is-selected": isSelected(option),
              })}
              data-idx={idx}
              key={String(option[indexKey])}
              onClick={handleSelect}
              onMouseDown={handleOptionMouseDown}
              role="option"
            >
              {getLabel(option)}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="p-form-validation__message">{error}</p>}
    </div>
  );
};

export default ComboSelect;
