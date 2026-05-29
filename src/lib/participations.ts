import {
  demoParticipations,
  PARTICIPATIONS_STORAGE_KEY,
  type ParticipationRecord,
} from "../data/participations";
import type { Grado } from "../data/locations";

export interface SaveParticipationInput {
  dni: string;
  code: string;
  bookId: string;
  bookTitle: string;
  colegio: string;
  grado: Grado;
  fileName: string;
}

function readStoredParticipations(): Record<string, ParticipationRecord> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(PARTICIPATIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ParticipationRecord>;
  } catch {
    return {};
  }
}

export function canReuploadParticipation(record: ParticipationRecord): boolean {
  if (record.reuploadAllowed === false) return false;
  return record.estado === "error" || record.fileStatus === "error";
}

export function isDniBlockedForRegistration(dni: string): boolean {
  const existing = getParticipationByDni(dni);
  if (!existing) return false;
  return !canReuploadParticipation(existing);
}

export function saveParticipation(input: SaveParticipationInput): ParticipationRecord {
  const existing = readStoredParticipations()[input.dni];
  const isCorrection = existing && canReuploadParticipation(existing);

  const record: ParticipationRecord = {
    ...(isCorrection ? existing : {}),
    ...input,
    code: isCorrection ? existing.code : input.code,
    fileStatus: "pendiente",
    fileStatusDetail: isCorrection
      ? "Recibimos tu archivo corregido. Lo verificaremos de nuevo."
      : "Recibimos tu archivo. Lo verificaremos en las próximas horas.",
    estado: "recibido",
    reuploadAllowed: false,
    rejectionReason: undefined,
    reuploadCount: isCorrection ? (existing.reuploadCount ?? 0) + 1 : 0,
    submittedAt: new Date().toISOString(),
  };

  const stored = readStoredParticipations();
  stored[input.dni] = record;
  localStorage.setItem(PARTICIPATIONS_STORAGE_KEY, JSON.stringify(stored));

  return record;
}

export function reuploadParticipationFile(
  dni: string,
  fileName: string,
): ParticipationRecord | null {
  const clean = dni.replace(/\D/g, "");
  const stored = readStoredParticipations();
  const existing = stored[clean] ?? demoParticipations.find((item) => item.dni === clean);

  if (!existing || !canReuploadParticipation(existing)) return null;

  const updated: ParticipationRecord = {
    ...existing,
    fileName,
    fileStatus: "pendiente",
    fileStatusDetail: "Recibimos tu archivo corregido. Lo verificaremos de nuevo.",
    estado: "recibido",
    reuploadAllowed: false,
    rejectionReason: undefined,
    reuploadCount: (existing.reuploadCount ?? 0) + 1,
    submittedAt: new Date().toISOString(),
  };

  stored[clean] = updated;
  localStorage.setItem(PARTICIPATIONS_STORAGE_KEY, JSON.stringify(stored));

  return updated;
}

export function getParticipationByDni(dni: string): ParticipationRecord | null {
  const clean = dni.replace(/\D/g, "");
  if (clean.length !== 8) return null;

  const stored = readStoredParticipations()[clean];
  if (stored) return stored;

  return demoParticipations.find((item) => item.dni === clean) ?? null;
}

export function formatParticipationDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}
