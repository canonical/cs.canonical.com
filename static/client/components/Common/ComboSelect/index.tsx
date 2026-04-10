import { type MouseEvent, type ReactNode, useCallback, useMemo, useState } from "react";

import { Icon } from "@canonical/react-components";
import classNames from "classnames";

import type { ComboSelectProps } from "./ComboSelect.types";

import "./_ComboSelect.scss";

import HighlightedSearchText from "@/components/Common/HighlightedSearchText";

const ComboSelect = <T extends Record<string, any>>({
  options,
  value,
  onSelect,
  className,
  disabled,
  id,
  placeholder = "Select...",
  error,
  indexKey = "id" as keyof T,
  labelKey = "name" as keyof T,
  searchKeys,
  maxVisible = 50,
}: ComboSelectProps<T>): ReactNode => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const keysToSearch = useMemo(() => searchKeys ?? [labelKey], [searchKeys, labelKey]);

  const getLabel = useCallback((item: T): string => String(item[labelKey] ?? ""), [labelKey]);

  const displayValue = useMemo(() => {
    if (isOpen) return query;
    if (!value) return "";
    return getLabel(value);
  }, [isOpen, query, value, getLabel]);

  const filtered = useMemo(() => {
    const sorted = [...options].sort((a, b) => getLabel(a).localeCompare(getLabel(b), "en", { numeric: true }));
    if (!query) return sorted;
    const lowerQuery = query.toLowerCase();
    return sorted.filter((opt) =>
      keysToSearch.some((key) => {
        const val = opt[key];
        return typeof val === "string" && val.toLowerCase().includes(lowerQuery);
      }),
    );
  }, [query, options, keysToSearch, getLabel]);

  const isSelected = useCallback(
    (option: T): boolean => {
      if (!value) return false;
      return value[indexKey] === option[indexKey];
    },
    [value, indexKey],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  }, []);

  const handleSelect = useCallback(
    (option: T) => {
      onSelect(option);
      setQuery("");
      setIsOpen(false);
    },
    [onSelect],
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
    setQuery("");
    setIsOpen(true);
  }, []);

  const wrapperClassName = error ? "p-form-validation is-error" : undefined;

  const visibleOptions = useMemo(() => filtered.slice(0, maxVisible), [filtered, maxVisible]);

  const hiddenCount = filtered.length - visibleOptions.length;

  const dropdownItems = useMemo(() => {
    const items = visibleOptions.map((option) => (
      <li
        aria-selected={isSelected(option)}
        className={classNames("p-combo-select__item", {
          "is-selected": isSelected(option),
        })}
        key={String(option[indexKey])}
        onClick={() => handleSelect(option)}
        onMouseDown={handleOptionMouseDown}
        role="option"
      >
        <span className="p-combo-select__item-label">
          <HighlightedSearchText highlight={query} text={getLabel(option)} />
        </span>
        {isSelected(option) && <Icon data-testid="tick-icon" name="task-outstanding" />}
      </li>
    ));
    if (hiddenCount > 0) {
      items.push(
        <li className="p-combo-select__item p-combo-select__more-hint" key="__more__">
          <em>{hiddenCount} more — type to search</em>
        </li>,
      );
    }
    return items;
  }, [visibleOptions, hiddenCount, getLabel, handleSelect, handleOptionMouseDown, indexKey, isSelected, query]);

  return (
    <div className={classNames("p-combo-select", wrapperClassName, className)}>
      <div className="p-combo-select__input-wrapper">
        <input
          autoComplete="off"
          className="p-form__control u-no-margin--bottom"
          disabled={disabled}
          id={id}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={value ? getLabel(value) : (placeholder ?? "")}
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
          {dropdownItems}
        </ul>
      )}
      {error && <p className="p-form-validation__message">{error}</p>}
    </div>
  );
};

export default ComboSelect;
