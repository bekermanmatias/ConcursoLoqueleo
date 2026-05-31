"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";

export type SelectOption = string | { value: string; label: string };

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** Color del reto */
  accent?: string;
}

function normalizeOptions(options: readonly SelectOption[]): { value: string; label: string }[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

export default function FormSelect({
  value,
  onChange,
  options,
  placeholder = "Elige una opción…",
  disabled = false,
  id,
  accent,
}: Props) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const searchId = `${triggerId}-search`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return normalizedOptions;
    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [normalizedOptions, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    close();
  };

  const accentVars = accent ? ({ "--field-accent": accent } as CSSProperties) : undefined;

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      searchRef.current?.focus({ preventScroll: true });
    });

    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      close();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  const selectedOption = normalizedOptions.find((option) => option.value === value);
  const displayValue = selectedOption?.label ?? placeholder;
  const isPlaceholder = !value;

  const openWithQuery = (initialQuery = "") => {
    if (disabled) return;
    setQuery(initialQuery);
    setOpen(true);
  };

  return (
    <div
      className={["form-select-wrap", open ? "form-select-wrap--open" : ""].join(" ")}
      ref={rootRef}
      style={accentVars}
    >
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "form-field form-select-trigger",
          open ? "form-select-trigger--open" : "",
          isPlaceholder ? "form-select-trigger--placeholder" : "",
        ].join(" ")}
        onClick={() => (open ? close() : openWithQuery())}
        onMouseDown={(event) => {
          if (!disabled) event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (disabled || open) return;
          if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
            event.preventDefault();
            openWithQuery();
            return;
          }
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            openWithQuery(event.key);
          }
        }}
      >
        <span className="form-select-trigger-text">{displayValue}</span>
        <svg
          className="form-select-chevron"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="form-select-dropdown">
          <label htmlFor={searchId} className="sr-only">
            Buscar opción
          </label>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            className="form-select-search"
            placeholder="Busca aquí…"
            value={query}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && filteredOptions[0]) {
                event.preventDefault();
                selectOption(filteredOptions[0].value);
              }
            }}
          />
          <ul className="form-select-menu" role="listbox" aria-labelledby={triggerId}>
            {filteredOptions.map((option) => (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  className={[
                    "form-select-option",
                    value === option.value ? "form-select-option--active" : "",
                  ].join(" ")}
                  onClick={() => selectOption(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="form-select-empty" role="status">
                No encontramos opciones. Prueba escribiendo otro nombre.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
