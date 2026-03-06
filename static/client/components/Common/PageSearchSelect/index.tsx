import { type MouseEvent, type ReactNode, useCallback, useMemo, useRef, useState } from "react";

import { SearchBox } from "@canonical/react-components";

import type { PageSearchSelectProps } from "./PageSearchSelect.types";

const PageSearchSelect = <T extends Record<string, any>>({
  options,
  value,
  onSelect,
  onClear,
  placeholder = "Search...",
  error,
  indexKey = "id" as keyof T,
  labelKey = "name" as keyof T,
  titleKey = "title" as keyof T,
  searchKeys,
}: PageSearchSelectProps<T>): ReactNode => {
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

  const filtered =
    query.length >= 3
      ? options.filter((opt) =>
          keysToSearch.some((key) => {
            const val = opt[key];
            return typeof val === "string" && val.toLowerCase().includes(query.toLowerCase());
          }),
        )
      : [];

  const handleChange = useCallback((inputValue: string) => {
    setQuery(inputValue);
    setIsOpen(inputValue.length >= 3);
  }, []);

  const handleSelect = useCallback(
    (option: T) => () => {
      onSelect(option);
      setQuery("");
      setIsOpen(false);
    },
    [onSelect],
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
    <div className={`p-page-search-select ${wrapperClassName ?? ""}`.trim()}>
      <div className="l-search-container">
        <SearchBox
          autocomplete="off"
          externallyControlled
          onBlur={handleBlur}
          onChange={handleChange}
          onClear={value ? onClear : undefined}
          placeholder={value ? undefined : placeholder}
          readOnly={!!value}
          ref={inputRef}
          value={value ? formatDisplay(value) : query}
        />
        {isOpen && filtered.length > 0 && (
          <ul className="l-search-dropdown">
            {filtered.map((option) => (
              <li
                className="l-search-item"
                key={String(option[indexKey])}
                onClick={handleSelect(option)}
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

export default PageSearchSelect;
