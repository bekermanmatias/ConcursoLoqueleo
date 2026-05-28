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
  { key: "days", label: "Días", color: "#e63946" },
  { key: "hours", label: "Horas", color: "#9b7dd4" },
  { key: "minutes", label: "Min", color: "#3b82f6" },
  { key: "seconds", label: "Seg", color: "#22c55e" },
] as const;

export default function Countdown() {
  const [time, setTime] = useState<TimeLeft>(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 max-w-md">
      <p className="text-sm font-medium text-[#555] mb-4">
        Faltan para el cierre de inscripciones
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {units.map(({ key, label, color }) => (
          <div key={key}>
            <p
              className="text-2xl sm:text-3xl font-extrabold tabular-nums"
              style={{ color }}
            >
              {String(time[key]).padStart(2, "0")}
            </p>
            <p className="text-xs font-semibold text-[#666] mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
