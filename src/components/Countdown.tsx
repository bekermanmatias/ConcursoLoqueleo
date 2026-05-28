import { useEffect, useState } from "react";

/** Fecha de cierre de inscripciones (ajustar cuando esté definida) */
const TARGET = new Date("2026-08-31T23:59:59");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(): TimeLeft {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const units = [
  { key: "days", label: "Días", color: "var(--color-countdown-red)" },
  { key: "hours", label: "Horas", color: "var(--color-countdown-purple)" },
  { key: "minutes", label: "Min", color: "var(--color-countdown-blue)" },
  { key: "seconds", label: "Seg", color: "var(--color-countdown-green)" },
] as const;

export default function Countdown() {
  const [time, setTime] = useState<TimeLeft>(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full text-center">
      <p className="text-sm sm:text-base font-medium text-[#555] mb-3">
        Faltan para el cierre de inscripciones
      </p>
      <div className="grid grid-cols-4 gap-5 sm:gap-8 text-center max-w-md mx-auto">
        {units.map(({ key, label, color }) => (
          <div key={key}>
            <p
              className="text-4xl sm:text-5xl font-extrabold tabular-nums leading-none"
              style={{ color }}
            >
              {String(time[key]).padStart(2, "0")}
            </p>
            <p className="text-sm font-semibold text-[#666] mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
