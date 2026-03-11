import { type MouseEvent, type ReactNode, useCallback, useMemo, useRef, useState } from "react";

import { SearchBox } from "@canonical/react-components";
import classNames from "classnames";

import type { SearchProps } from "./Search.types";

import "./_Search.scss";

const PageSearch = <T extends Record<string, any>>({
  options,
  value,
  onSelect,
  onClear,
  className,
  disabled,
  placeholder = "Search...",
  error,
  indexKey = "id" as keyof T,
  labelKey = "name" as keyof T,
  titleKey = "title" as keyof T,
  searchKeys,
}: SearchProps<T>): ReactNode => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const keysToSearch = useMemo(() => searchKeys ?? [labelKey, titleKey], [searchKeys, labelKey, titleKey]);

  const formatDisplay = useCallback(
    (option: T): string => {
      const name = String(option[labelKey] ?? "");
      const title = option[titleKey] ? String(option[titleKey]) : "";
      return title ? `${name} - ${title}` : name;
    },
    [labelKey, titleKey],
  );

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

  const handleChange = useCallback((inputValue: string) => {
    setQuery(inputValue);
    setIsOpen(inputValue.length >= 3);
  }, []);

  const handleSelect = useCallback(
    (e: MouseEvent<HTMLLIElement>) => {
      const idx = Number(e.currentTarget.dataset.idx);
      const option = filtered[idx];
      if (option) {
        onSelect(option);
        setQuery("");
        setIsOpen(false);
      }
    },
    [filtered, onSelect],
  );

  const handleBlur = useCallback(() => {
    setIsOpen(false);
    if (!value) {
      setQuery("");
    }
  }, [value]);

  const handleOptionMouseDown = useCallback((e: MouseEvent<HTMLLIElement>) => {
    e.preventDefault();
  }, []);

  const wrapperClassName = error ? "p-form-validation is-error" : undefined;

  return (
    <div className={classNames("p-page-search-select", wrapperClassName, className)}>
      <div className="l-search-container">
        <SearchBox
          autocomplete="off"
          disabled={disabled}
          externallyControlled
          onBlur={handleBlur}
          onChange={handleChange}
          onClear={value ? onClear : undefined}
          placeholder={value ? undefined : placeholder}
          ref={inputRef}
          value={value ? formatDisplay(value) : query}
        />
        {isOpen && filtered.length > 0 && (
          <ul className="l-search-dropdown">
            {filtered.map((option, idx) => (
              <li
                className="l-search-item"
                data-idx={idx}
                key={String(option[indexKey])}
                onClick={handleSelect}
                onMouseDown={handleOptionMouseDown}
              >
                {formatDisplay(option)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="p-form-validation__message">{error}</p>}
    </div>
  );
};

export default PageSearch;
