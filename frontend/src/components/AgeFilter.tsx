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
    <div className="flex flex-wrap items-end justify-center gap-5 sm:gap-8">
      {ageFilters.map((f) => {
        const active = selected === f.key;
        const bookColor = f.key === "todo" ? "#9ca3af" : f.ring;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => handleSelect(f.key)}
            aria-pressed={active}
            className={[
              "focus:outline-none flex flex-col items-center min-w-14 transition-transform duration-200 ease-out",
              active ? "scale-110 -translate-y-0.5" : "hover:scale-105",
            ].join(" ")}
          >
            {/* Círculo con borde grueso (~25% del diámetro) */}
            <span
              className={[
                "block rounded-full bg-white shrink-0",
                "w-10 h-10 sm:w-11 sm:h-11",
              ].join(" ")}
              style={{
                border: "8px solid #111111",
                boxSizing: "border-box",
              }}
            />

            {/* libro.svg debajo del círculo */}
            <span
              className="mt-0.5 h-3 w-10 sm:h-3.5 sm:w-11 shrink-0"
              style={{
                backgroundColor: bookColor,
                WebkitMaskImage: "url('/libro.svg')",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                WebkitMaskSize: "contain",
                maskImage: "url('/libro.svg')",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                maskSize: "contain",
              }}
            />

            <span className="mt-1.5 text-base sm:text-[1.05rem] leading-none font-semibold text-ink-800">
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
