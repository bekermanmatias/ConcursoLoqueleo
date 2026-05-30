"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export default function FormSelect({
  value,
  onChange,
  options,
  placeholder = "Elige una opción…",
  disabled = false,
  id,
}: Props) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const searchId = `${triggerId}-search`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.toLowerCase().includes(normalized));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const selectOption = (option: string) => {
    onChange(option);
    close();
  };

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();

    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
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
  }, [open]);

  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  const openWithQuery = (initialQuery = "") => {
    if (disabled) return;
    setQuery(initialQuery);
    setOpen(true);
  };

  return (
    <div className="form-select-wrap" ref={rootRef}>
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
                selectOption(filteredOptions[0]);
              }
            }}
          />
          <ul className="form-select-menu" role="listbox" aria-labelledby={triggerId}>
            {filteredOptions.map((option) => (
              <li key={option} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  className={[
                    "form-select-option",
                    value === option ? "form-select-option--active" : "",
                  ].join(" ")}
                  onClick={() => selectOption(option)}
                >
                  {option}
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
