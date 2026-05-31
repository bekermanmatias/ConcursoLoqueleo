import type { ParticipationRecord } from "../data/participations";
import type { Grado, Sexo } from "../data/locations";
import { apiUrl } from "./api";

export interface SaveParticipationInput {
  dni: string;
  bookId: string;
  bookTitle: string;
  colegio: string;
  codigoColegio: string;
  grado: Grado;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  concursante: string;
  sexo: Sexo;
  apoderado: string;
  dniApoderado: string;
  celularApoderado: string;
  docente: string;
  emailDocente: string;
  fileName: string;
  fileUrl?: string;
  s3Key?: string;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function isDniBlockedForRegistration(dni: string): Promise<boolean> {
  const clean = dni.replace(/\D/g, "");
  if (clean.length !== 8) return false;

  const data = await apiRequest<{ blocked: boolean }>(
    `/api/participations/${clean}/blocked`,
  );
  return data.blocked;
}

export async function saveParticipation(
  input: SaveParticipationInput,
): Promise<ParticipationRecord> {
  return apiRequest<ParticipationRecord>("/api/participations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function reuploadParticipationFile(
  dni: string,
  fileName: string,
  fileUrl?: string,
  s3Key?: string,
): Promise<ParticipationRecord | null> {
  const clean = dni.replace(/\D/g, "");
  try {
    return await apiRequest<ParticipationRecord>(`/api/participations/${clean}/file`, {
      method: "PATCH",
      body: JSON.stringify({ fileName, fileUrl, s3Key }),
    });
  } catch {
    return null;
  }
}

export async function getParticipationByDni(dni: string): Promise<ParticipationRecord | null> {
  const clean = dni.replace(/\D/g, "");
  if (clean.length !== 8) return null;

  const response = await fetch(apiUrl(`/api/participations/${clean}`));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("No se pudo consultar la participación");

  return response.json() as Promise<ParticipationRecord>;
}

export function formatParticipationDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export { canReuploadParticipation } from "../data/participations";
