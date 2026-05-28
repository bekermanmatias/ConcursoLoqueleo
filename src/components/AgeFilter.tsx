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
        const underlineColor = f.key === "todo" ? "transparent" : f.ring;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => handleSelect(f.key)}
            aria-pressed={active}
            className="focus:outline-none flex flex-col items-center"
          >
            <span
              className={[
                "grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white transition",
                active ? "scale-110 shadow-sm" : "hover:scale-105",
              ].join(" ")}
              style={{
                border: "3px solid #111111",
              }}
            />
            <span
              className="mt-1 h-2 w-8 rounded-b-full"
              style={{
                borderBottom: `5px solid ${underlineColor}`,
                borderRadius: "0 0 999px 999px",
              }}
            />
            <span className="mt-1 text-[1.05rem] leading-none font-semibold text-ink-800">
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
