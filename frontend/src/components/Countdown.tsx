import { useEffect, useMemo, useState } from "react";
import { fetchPublicConcurso } from "../lib/concurso";
import type { PublicConcurso } from "../types/public-book";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZERO: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function calcTimeLeft(targetMs: number): TimeLeft {
  const diff = targetMs - Date.now();
  if (diff <= 0) return ZERO;
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
  const [concurso, setConcurso] = useState<PublicConcurso | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicConcurso()
      .then((data) => {
        if (!cancelled) setConcurso(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const targetMs = useMemo(() => {
    const raw = concurso?.fechaFin;
    if (!raw) return null;
    const parsed = new Date(raw).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }, [concurso?.fechaFin]);

  useEffect(() => {
    if (targetMs === null) {
      setTime(null);
      return;
    }
    const tick = () => setTime(calcTimeLeft(targetMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const display = time ?? ZERO;

  if (loading) {
    return (
      <div className="w-full text-center">
        <p className="text-sm text-[#888]">Cargando cuenta regresiva…</p>
      </div>
    );
  }

  if (!concurso?.fechaFin || targetMs === null) {
    return (
      <div className="w-full text-center">
        <p className="text-sm sm:text-base font-medium text-[#555]">
          La fecha de cierre del concurso aún no está configurada.
        </p>
      </div>
    );
  }

  const ended = targetMs <= Date.now();

  return (
    <div className="w-full text-center">
      <p className="text-sm sm:text-base font-medium text-[#555] mb-3">
        {ended ? "Las inscripciones han cerrado" : "Faltan para el cierre de inscripciones"}
      </p>
      {!ended && (
        <div className="grid grid-cols-4 gap-5 sm:gap-8 text-center max-w-md mx-auto">
          {units.map(({ key, label, color }) => (
            <div key={key}>
              <p
                className="text-4xl sm:text-5xl font-extrabold tabular-nums leading-none"
                style={{ color }}
              >
                {String(display[key]).padStart(2, "0")}
              </p>
              <p className="text-sm font-semibold text-[#666] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
