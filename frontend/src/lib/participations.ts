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

export class ParticipationApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ParticipationApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: string;
  code?: string;
}

const FIELD_LABELS: Record<string, string> = {
  bookId: "el reto",
  bookTitle: "el libro",
  colegio: "el colegio",
  codigoColegio: "el código del colegio",
  grado: "el grado",
  concursante: "tu nombre",
  sexo: "tu género",
  apoderado: "el apoderado",
  celularApoderado: "el celular del apoderado",
  docente: "el docente",
  emailDocente: "el correo del docente",
  fileName: "el archivo",
};

function mapParticipationError(status: number, body: ApiErrorBody | null): ParticipationApiError {
  const raw = body?.error?.trim() ?? "";
  const code = body?.code;

  if (status === 409 || code === "DNI_ALREADY_REGISTERED") {
    return new ParticipationApiError(
      "Este DNI ya participó en un reto. Solo puedes inscribirte una vez.",
      status,
      "DNI_ALREADY_REGISTERED",
    );
  }

  if (status === 400) {
    if (code === "FILE_NOT_UPLOADED") {
      return new ParticipationApiError(
        "Primero sube tu archivo antes de enviar la inscripción.",
        status,
        code,
      );
    }
    if (raw === "DNI del estudiante inválido") {
      return new ParticipationApiError("Escribe tu DNI con 8 números.", status, code);
    }
    if (raw === "DNI del apoderado inválido") {
      return new ParticipationApiError("Escribe el DNI de tu apoderado con 8 números.", status, code);
    }
    if (raw === "Sexo inválido") {
      return new ParticipationApiError("Elige un género válido.", status, code);
    }
    if (raw === "DNI inválido") {
      return new ParticipationApiError("Escribe un DNI válido de 8 números.", status, code);
    }
    if (raw.startsWith("Falta ")) {
      const field = raw.replace("Falta ", "");
      const label = FIELD_LABELS[field] ?? field;
      return new ParticipationApiError(`Completa ${label} para continuar.`, status, code);
    }
    if (raw) {
      return new ParticipationApiError(raw, status, code);
    }
    return new ParticipationApiError(
      "Revisa los datos del formulario e intenta otra vez.",
      status,
      code,
    );
  }

  if (status === 403) {
    return new ParticipationApiError(
      raw || "No tienes permiso para realizar esta acción.",
      status,
      code,
    );
  }

  if (status >= 500) {
    return new ParticipationApiError(
      "Tuvimos un problema en el servidor. Intenta de nuevo en unos minutos.",
      status,
      code,
    );
  }

  return new ParticipationApiError(
    raw || "No pudimos completar la operación. Intenta otra vez.",
    status,
    code,
  );
}

async function readErrorBody(response: Response): Promise<ApiErrorBody | null> {
  return response.json().catch(() => null) as Promise<ApiErrorBody | null>;
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
    const body = await readErrorBody(response);
    throw mapParticipationError(response.status, body);
  }

  return response.json() as Promise<T>;
}

export function getParticipationErrorMessage(error: unknown): string {
  if (error instanceof ParticipationApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "No pudimos completar la operación. Intenta otra vez.";
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
  if (!response.ok) {
    throw mapParticipationError(response.status, await readErrorBody(response));
  }

  return response.json() as Promise<ParticipationRecord>;
}

export function formatParticipationDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export { canReuploadParticipation } from "../data/participations";
