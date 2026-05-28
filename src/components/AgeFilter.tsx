import { useState } from "react";
import { ageFilters, type AgeKey } from "../data/books";

export default function AgeFilter() {
  const [selected, setSelected] = useState<AgeKey>("todo");

  const handleSelect = (key: AgeKey) => {
    setSelected(key);
    document.querySelectorAll<HTMLElement>("[data-age]").forEach((card) => {
      const age = card.dataset.age as AgeKey;
      card.style.display = key === "todo" || age === key ? "" : "none";
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {ageFilters.map((f) => {
        const active = selected === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => handleSelect(f.key)}
            aria-pressed={active}
            className="focus:outline-none"
          >
            <span
              className={[
                "grid place-items-center w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full bg-white font-bold text-sm sm:text-base transition",
                active ? "scale-110 shadow-md" : "hover:scale-105",
              ].join(" ")}
              style={{
                border: active ? `4px solid ${f.ring}` : `3px solid ${f.ring}`,
                color: "var(--color-ink-900)",
              }}
            >
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
