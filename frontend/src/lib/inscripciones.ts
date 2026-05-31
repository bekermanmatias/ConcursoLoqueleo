import type { PublicConcurso } from "../types/public-book";

export function parseFechaFinMs(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function inscripcionesEstanAbiertas(
  concurso: Pick<PublicConcurso, "inscripcionesAbiertas" | "fechaFin"> | null,
): boolean {
  if (!concurso) return false;
  if (!concurso.inscripcionesAbiertas) return false;
  const finMs = parseFechaFinMs(concurso.fechaFin);
  if (finMs !== null && Date.now() > finMs) return false;
  return true;
}
