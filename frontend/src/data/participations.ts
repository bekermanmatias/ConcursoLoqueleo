import type { Grado } from "./locations";

/** Estados del trabajo según el modelo de datos (evaluación jurado). */
export type SubmissionStatus = "recibido" | "en_revision" | "finalista" | "ganador";

export type FileStatus = "ok" | "pendiente";

export interface ParticipationRecord {
  dni: string;
  code: string;
  bookId: string;
  bookTitle: string;
  colegio: string;
  grado: Grado;
  fileName: string;
  fileStatus: FileStatus;
  fileStatusDetail: string;
  estado: SubmissionStatus;
  submittedAt: string;
}

export function canReuploadParticipation(_record: ParticipationRecord): boolean {
  return false;
}

export const submissionStatusLabels: Record<
  SubmissionStatus,
  { label: string; detail: string }
> = {
  recibido: {
    label: "Recibido",
    detail: "Registramos tu participación. Pronto revisaremos tu archivo.",
  },
  en_revision: {
    label: "En revisión",
    detail: "Tu trabajo está en cola de evaluación.",
  },
  finalista: {
    label: "Finalista",
    detail: "Tu trabajo fue seleccionado como finalista del concurso.",
  },
  ganador: {
    label: "Ganador",
    detail: "¡Felicitaciones! Tu trabajo fue seleccionado entre los ganadores.",
  },
};

export const fileStatusLabels: Record<FileStatus, string> = {
  ok: "Archivo registrado",
  pendiente: "Verificando archivo…",
};
