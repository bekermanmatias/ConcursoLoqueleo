import type { Grado } from "./locations";

export type SubmissionStatus = "recibido" | "en_revision" | "validado" | "error";

export type FileStatus = "ok" | "pendiente" | "error";

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
  /** Si el equipo marcó la entrega como incorrecta, el estudiante puede subir de nuevo */
  reuploadAllowed?: boolean;
  /** Motivo visible para el estudiante cuando debe corregir */
  rejectionReason?: string;
  reuploadCount?: number;
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
  validado: {
    label: "Validado",
    detail: "Tu entrega fue recibida y el archivo está en orden.",
  },
  error: {
    label: "Requiere corrección",
    detail: "Tu archivo no cumple las indicaciones. Lee el motivo y vuelve a subirlo desde esta sección.",
  },
};

export const fileStatusLabels: Record<FileStatus, string> = {
  ok: "Archivo cargado correctamente",
  pendiente: "Verificando archivo…",
  error: "Problema con el archivo",
};

/** Participaciones de demo para probar la sección Ayuda */
export const demoParticipations: ParticipationRecord[] = [
  {
    dni: "12345678",
    code: "LL-TUSU-A1B2C3",
    bookId: "tusuj-6",
    bookTitle: "Tusuj, un cuy especial",
    colegio: "IE San Martín de Porres",
    grado: "1ro primaria",
    fileName: "rima-tusuj.pdf",
    fileStatus: "ok",
    fileStatusDetail: "PDF legible, orientación horizontal, 4 versos con ilustración.",
    estado: "validado",
    submittedAt: "2026-05-10T14:32:00.000Z",
  },
  {
    dni: "87654321",
    code: "LL-REVU-X9Y8Z7",
    bookId: "revueltos-8",
    bookTitle: "Libros revueltos",
    colegio: "Colegio Innovación School",
    grado: "3ro primaria",
    fileName: "recomendacion-libros.mp4",
    fileStatus: "pendiente",
    fileStatusDetail: "Estamos confirmando duración y audio del video.",
    estado: "en_revision",
    submittedAt: "2026-05-22T09:15:00.000Z",
  },
  {
    dni: "11223344",
    code: "LL-LONC-M4N5O6",
    bookId: "lonchera-6",
    bookTitle: "La lonchera mentirosa",
    colegio: "IE María Auxiliadora",
    grado: "2do primaria",
    fileName: "carta-borrador.pdf",
    fileStatus: "error",
    fileStatusDetail: "El archivo está borroso y no se lee la carta completa.",
    estado: "error",
    reuploadAllowed: true,
    rejectionReason:
      "La carta debe ser legible, de una página y con tu nombre al final. Sube un PDF más nítido o una foto con buena luz.",
    reuploadCount: 0,
    submittedAt: "2026-05-18T11:40:00.000Z",
  },
];

export const PARTICIPATIONS_STORAGE_KEY = "loqueleo-participaciones";
