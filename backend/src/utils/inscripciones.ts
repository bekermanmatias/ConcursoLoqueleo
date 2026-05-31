import { parseFechaFinMs } from "./concurso-dates.js";

export interface ConcursoInscripcionState {
  inscripcionesAbiertas: boolean;
  fechaFin: string | null;
}

export function inscripcionesEstanAbiertas(concurso: ConcursoInscripcionState | null): boolean {
  if (!concurso) return false;
  if (!concurso.inscripcionesAbiertas) return false;
  const finMs = parseFechaFinMs(concurso.fechaFin);
  if (finMs !== null && Date.now() > finMs) return false;
  return true;
}

export function assertInscripcionesAbiertas(concurso: ConcursoInscripcionState | null): void {
  if (!concurso) {
    throw new Error("NO_ACTIVE_CONCURSO");
  }
  if (!inscripcionesEstanAbiertas(concurso)) {
    throw new Error("INSCRIPCIONES_CERRADAS");
  }
}
