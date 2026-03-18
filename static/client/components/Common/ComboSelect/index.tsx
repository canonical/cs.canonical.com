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
    if (Array.isArray(value)) return "";
    return getLabel(value);
  }, [query, value, getLabel]);

  const filtered = useMemo(() => {
    if (!query) return options;
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
      setIsOpen(true);
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

  const handleChevronMouseDown = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsOpen((prev) => !prev);
  }, []);

  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleChipDismiss = useCallback(
    (option: T) => {
      if (!Array.isArray(value)) return;
      const newValue = value.filter((v) => v[indexKey] !== option[indexKey]);
      onSelect(newValue);
    },
    [value, indexKey, onSelect],
  );

  const wrapperClassName = error ? "p-form-validation is-error" : undefined;

  const hasChips = multiple && Array.isArray(value) && value.length > 0;
  const showPlaceholder = (!value || (Array.isArray(value) && value.length === 0)) && !query;

  return (
    <div className={classNames("p-combo-select", wrapperClassName, className)}>
      {hasChips && (
        <div className="p-combo-select__chips">
          {(value as T[]).map((item) => (
            <span className="p-chip" key={String(item[indexKey])}>
              <span className="p-chip__value">{getLabel(item)}</span>
              <button
                aria-label={`Remove ${getLabel(item)}`}
                className="p-chip__dismiss"
                onClick={() => handleChipDismiss(item)}
                type="button"
              >
                <i className="p-icon--close" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="p-combo-select__input-wrapper">
        <input
          autoComplete="off"
          className="p-form__control"
          disabled={disabled}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={showPlaceholder ? placeholder : undefined}
          type="text"
          value={displayValue}
        />
        <button
          aria-label="Toggle dropdown"
          className="p-combo-select__chevron"
          disabled={disabled}
          onMouseDown={handleChevronMouseDown}
          tabIndex={-1}
          type="button"
        >
          <i className="p-icon--chevron-down" />
        </button>
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
              <span className="p-combo-select__item-label">{getLabel(option)}</span>
              {isSelected(option) && <i className="p-icon--task-outstanding" data-testid="tick-icon" />}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="p-form-validation__message">{error}</p>}
    </div>
  );
};

export default ComboSelect;
