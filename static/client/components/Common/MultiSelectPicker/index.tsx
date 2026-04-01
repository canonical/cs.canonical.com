import { type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import classNames from "classnames";

import type { MultiSelectPickerProps } from "./MultiSelectPicker.types";

import "./_MultiSelectPicker.scss";

const MultiSelectPicker = <T extends Record<string, any>>({
  options,
  value,
  onSelect,
  className,
  disabled = false,
  placeholder = "Select...",
  error,
  indexKey = "id" as keyof T,
  labelKey = "name" as keyof T,
  searchKeys,
}: MultiSelectPickerProps<T>): ReactNode => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [committedValue, setCommittedValue] = useState<T[]>(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);
  const displayContainerRef = useRef<HTMLDivElement>(null);
  const dropdownOrderRef = useRef<T[]>([]);
  const latestValueRef = useRef(value);
  latestValueRef.current = value;
  const [visibleCount, setVisibleCount] = useState(value.length);

  const keysToSearch = useMemo(() => searchKeys ?? [labelKey], [searchKeys, labelKey]);

  const getLabel = useCallback((item: T): string => String(item[labelKey] ?? ""), [labelKey]);

  // Sync committedValue when closed and value changes externally
  useEffect(() => {
    if (!isOpen) {
      setCommittedValue(value);
    }
  }, [value, isOpen]);

  const sortedValue = useMemo(
    () => [...committedValue].sort((a, b) => getLabel(a).localeCompare(getLabel(b))),
    [committedValue, getLabel],
  );

  // Stable chip order while open: committed items (sorted) + newly added items appended
  const displayChips = useMemo(() => {
    const committedIds = new Set(committedValue.map((v) => v[indexKey]));
    const kept = committedValue.filter((v) => value.some((sel) => sel[indexKey] === v[indexKey]));
    const keptSorted = [...kept].sort((a, b) => getLabel(a).localeCompare(getLabel(b)));
    const added = value.filter((v) => !committedIds.has(v[indexKey]));
    return [...keptSorted, ...added];
  }, [value, committedValue, indexKey, getLabel]);

  // Compute how many names fit in the collapsed display
  useEffect(() => {
    if (isOpen || sortedValue.length === 0) return;

    const container = displayContainerRef.current;
    const textEl = displayRef.current;
    if (!container || !textEl) return;

    const containerWidth = container.clientWidth - 60; // reserve space for "+N" and chevron
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const style = getComputedStyle(textEl);
    ctx.font = `${style.fontSize} ${style.fontFamily}`;

    let count = 0;
    let totalWidth = 0;
    for (let i = 0; i < sortedValue.length; i++) {
      const label = getLabel(sortedValue[i]);
      const separator = i > 0 ? ", " : "";
      const segmentWidth = ctx.measureText(separator + label).width;
      if (totalWidth + segmentWidth > containerWidth && i > 0) break;
      totalWidth += segmentWidth;
      count++;
    }

    setVisibleCount(count);
  }, [sortedValue, isOpen, getLabel]);

  const displayText = useMemo(() => {
    if (sortedValue.length === 0) return "";
    const visible = sortedValue.slice(0, visibleCount).map(getLabel);
    return visible.join(", ");
  }, [sortedValue, visibleCount, getLabel]);

  const overflowCount = sortedValue.length - visibleCount;

  const snapshotDropdownOrder = useCallback(() => {
    const selected: T[] = [];
    const unselected: T[] = [];
    for (const opt of options) {
      if (value.some((v) => v[indexKey] === opt[indexKey])) {
        selected.push(opt);
      } else {
        unselected.push(opt);
      }
    }
    const byLabel = (a: T, b: T) => getLabel(a).localeCompare(getLabel(b));
    selected.sort(byLabel);
    unselected.sort(byLabel);
    dropdownOrderRef.current = [...selected, ...unselected];
  }, [options, value, indexKey, getLabel]);

  // Frozen dropdown order filtered by search query
  const dropdownOptions = useMemo(() => {
    const source = dropdownOrderRef.current;
    if (!query) return source;
    const lowerQuery = query.toLowerCase();
    return source.filter((opt) =>
      keysToSearch.some((key) => {
        const val = opt[key];
        return typeof val === "string" && val.toLowerCase().includes(lowerQuery);
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, keysToSearch, isOpen]);

  const isSelected = useCallback(
    (option: T): boolean => value.some((v) => v[indexKey] === option[indexKey]),
    [value, indexKey],
  );

  const toggleOption = useCallback(
    (option: T) => {
      const alreadySelected = value.some((v) => v[indexKey] === option[indexKey]);
      const newValue = alreadySelected ? value.filter((v) => v[indexKey] !== option[indexKey]) : [...value, option];
      onSelect(newValue);
    },
    [value, indexKey, onSelect],
  );

  const handleChipDismiss = useCallback(
    (option: T) => {
      onSelect(value.filter((v) => v[indexKey] !== option[indexKey]));
    },
    [value, indexKey, onSelect],
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // If focus is moving to another element within the container, don't close
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setCommittedValue([...latestValueRef.current]);
    setIsOpen(false);
    setQuery("");
  }, []);

  const handleOptionMouseDown = useCallback((e: MouseEvent<HTMLLIElement>) => {
    e.preventDefault();
  }, []);

  const handleOptionClick = useCallback(
    (e: MouseEvent<HTMLLIElement>) => {
      const idx = Number(e.currentTarget.dataset.idx);
      const option = dropdownOptions[idx];
      if (option) toggleOption(option);
    },
    [dropdownOptions, toggleOption],
  );

  const handleDisplayClick = useCallback(() => {
    if (disabled) return;
    snapshotDropdownOrder();
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [disabled, snapshotDropdownOrder]);

  const handleChevronMouseDown = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (disabled) return;
      if (isOpen) {
        setCommittedValue([...latestValueRef.current]);
        setIsOpen(false);
        setQuery("");
      } else {
        snapshotDropdownOrder();
        setIsOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    [disabled, isOpen, snapshotDropdownOrder],
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const wrapperClassName = error ? "p-form-validation is-error" : undefined;

  return (
    <div
      className={classNames("p-search-and-filter p-multi-select-picker", wrapperClassName, className)}
      onBlur={handleBlur}
      ref={containerRef}
    >
      {isOpen ? (
        <div
          aria-expanded="true"
          className="p-search-and-filter__search-container"
          data-active="true"
          data-empty={value.length === 0 ? "true" : "false"}
        >
          {displayChips.map((item) => (
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
          <form className="p-search-and-filter__box" data-overflowing="false">
            <input
              autoComplete="off"
              className="p-search-and-filter__input"
              onChange={handleSearchChange}
              placeholder={value.length === 0 ? placeholder : undefined}
              ref={inputRef}
              type="search"
              value={query}
            />
          </form>
          <button
            aria-label="Toggle dropdown"
            className="p-multi-select-picker__chevron"
            disabled={disabled}
            onMouseDown={handleChevronMouseDown}
            tabIndex={-1}
            type="button"
          >
            <i className="p-icon--chevron-up" />
          </button>
        </div>
      ) : (
        <div
          className={classNames("p-multi-select-picker__display", {
            "is-disabled": disabled,
          })}
          onClick={handleDisplayClick}
          ref={displayContainerRef}
          tabIndex={disabled ? -1 : 0}
        >
          {sortedValue.length === 0 ? (
            <span className="p-multi-select-picker__display-placeholder">{placeholder}</span>
          ) : (
            <>
              <span className="p-multi-select-picker__display-text" ref={displayRef}>
                {displayText}
              </span>
              {overflowCount > 0 && <span className="p-multi-select-picker__overflow-count">+{overflowCount}</span>}
            </>
          )}
          <button
            aria-label="Toggle dropdown"
            className="p-multi-select-picker__chevron"
            disabled={disabled}
            onMouseDown={handleChevronMouseDown}
            tabIndex={-1}
            type="button"
          >
            <i className="p-icon--chevron-down" />
          </button>
        </div>
      )}

      {isOpen && (
        <ul className="p-multi-select-picker__dropdown" role="listbox">
          {dropdownOptions.map((option, idx) => (
            <li
              aria-selected={isSelected(option)}
              className="p-multi-select-picker__option"
              data-idx={idx}
              key={String(option[indexKey])}
              onClick={handleOptionClick}
              onMouseDown={handleOptionMouseDown}
              role="option"
            >
              <input
                checked={isSelected(option)}
                className="p-multi-select-picker__checkbox"
                readOnly
                tabIndex={-1}
                type="checkbox"
              />
              <span className="p-multi-select-picker__option-label">{getLabel(option)}</span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="p-form-validation__message">{error}</p>}
    </div>
  );
};

export default MultiSelectPicker;
