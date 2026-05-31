import { apiUrl } from "./api";
import { clearAuthSession, getAuthToken, type InternalUser } from "./auth";

export type EstadoTrabajo = "recibido" | "en_revision" | "finalista" | "ganador";

export interface TrabajoListItem {
  id: number;
  codigoEntrega: string;
  dni: string;
  concursante: string;
  bookTitle: string;
  bookId: string;
  colegio: string;
  grado: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  tipoArchivo: "pdf" | "mp4" | "imagen";
  estado: EstadoTrabajo;
  fechaEnvio: string;
  permiteReenvio: boolean;
}

export interface TrabajoDetail extends TrabajoListItem {
  sexo: "M" | "F";
  apoderado: string;
  dniApoderado: string;
  celularApoderado: string;
  docente: string;
  emailDocente: string;
  trabajoEnlace: string;
  evaluacion?: {
    id: number;
    puntaje: number | null;
    comentarios: string | null;
    esDestacado: boolean;
    fechaEvaluacion: string;
  } | null;
  evaluacionesOtros?: EvaluacionJurado[];
}

export interface EvaluacionJurado {
  id: number;
  juradoId: number;
  juradoNombre: string;
  puntaje: number | null;
  comentarios: string | null;
  esDestacado: boolean;
  fechaEvaluacion: string;
}

export interface InternalStats {
  totalTrabajos: number;
  porEstado: Record<EstadoTrabajo, number>;
}

export interface TrabajosFilterOptions {
  grados: { id: number; label: string }[];
  libros: string[];
  colegios: { id: number; nombre: string }[];
  ubicaciones: { departamento: string; provincia: string; distrito: string }[];
  tiposArchivo: TrabajoListItem["tipoArchivo"][];
}

export type EvaluacionFiltro = "pendiente" | "evaluado";

class InternalApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "InternalApiError";
    this.status = status;
  }
}

async function internalRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401) {
    clearAuthSession();
    window.location.href = "/interno/login/";
    throw new InternalApiError("Sesión expirada.", 401);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new InternalApiError(body?.error ?? "Error en la solicitud.", response.status);
  }

  return response.json() as Promise<T>;
}

export async function loginInternal(email: string, password: string) {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new InternalApiError(body?.error ?? "Credenciales incorrectas.", response.status);
  }

  return response.json() as Promise<{ token: string; user: InternalUser }>;
}

export async function fetchMe() {
  return internalRequest<{ user: InternalUser }>("/api/auth/me");
}

export async function fetchTrabajosFiltros() {
  return internalRequest<TrabajosFilterOptions>("/api/internal/trabajos/filtros");
}

export async function fetchTrabajos(params?: {
  estado?: EstadoTrabajo;
  q?: string;
  gradoId?: number;
  colegioId?: number;
  libro?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  tipoArchivo?: TrabajoListItem["tipoArchivo"];
  sexo?: "M" | "F";
  fechaDesde?: string;
  fechaHasta?: string;
  evaluacion?: EvaluacionFiltro;
}) {
  const search = new URLSearchParams();
  if (params?.estado) search.set("estado", params.estado);
  if (params?.q) search.set("q", params.q);
  if (params?.gradoId) search.set("gradoId", String(params.gradoId));
  if (params?.colegioId) search.set("colegioId", String(params.colegioId));
  if (params?.libro) search.set("libro", params.libro);
  if (params?.departamento) search.set("departamento", params.departamento);
  if (params?.provincia) search.set("provincia", params.provincia);
  if (params?.distrito) search.set("distrito", params.distrito);
  if (params?.tipoArchivo) search.set("tipoArchivo", params.tipoArchivo);
  if (params?.sexo) search.set("sexo", params.sexo);
  if (params?.fechaDesde) search.set("fechaDesde", params.fechaDesde);
  if (params?.fechaHasta) search.set("fechaHasta", params.fechaHasta);
  if (params?.evaluacion) search.set("evaluacion", params.evaluacion);
  const qs = search.toString();
  return internalRequest<{ items: TrabajoListItem[]; total: number }>(
    `/api/internal/trabajos${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchTrabajo(id: number) {
  return internalRequest<TrabajoDetail>(`/api/internal/trabajos/${id}`);
}

export async function updateTrabajoEstado(id: number, estado: EstadoTrabajo) {
  return internalRequest<TrabajoDetail>(`/api/internal/trabajos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}

export async function bulkUpdateTrabajosEstado(ids: number[], estado: EstadoTrabajo) {
  return internalRequest<{ updated: number }>("/api/internal/trabajos/bulk/estado", {
    method: "PATCH",
    body: JSON.stringify({ ids, estado }),
  });
}

export const DELETE_TRABAJOS_CONFIRM_WORD = "ELIMINAR";

export async function bulkDeleteTrabajos(ids: number[], confirmacion: string) {
  return internalRequest<{ deleted: number }>("/api/internal/trabajos/bulk/eliminar", {
    method: "POST",
    body: JSON.stringify({ ids, confirmacion }),
  });
}

export async function setTrabajoReenvio(id: number, permiteReenvio: boolean) {
  return internalRequest<TrabajoDetail>(`/api/internal/trabajos/${id}/permite-reenvio`, {
    method: "PATCH",
    body: JSON.stringify({ permiteReenvio }),
  });
}

export async function saveEvaluacion(
  id: number,
  input: { puntaje?: number | null; comentarios?: string; esDestacado?: boolean },
) {
  return internalRequest(`/api/internal/trabajos/${id}/evaluacion`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchInternalStats() {
  return internalRequest<InternalStats>("/api/internal/stats");
}

export async function fetchInternalUsers() {
  return internalRequest<{ items: InternalUser[] }>("/api/internal/usuarios");
}

/** Abre el entregable en una pestaña nueva (requiere sesión activa). */
export async function openTrabajoArchivo(id: number): Promise<void> {
  const url = await fetchArchivoBlobUrl(id);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new InternalApiError(
      "No se pudo abrir el archivo. Permite ventanas emergentes o usa Detalle.",
      0,
    );
  }
}

/** Carga el entregable con Authorization y devuelve blob URL para iframe/video */
export async function fetchArchivoBlobUrl(id: number): Promise<string> {
  const token = getAuthToken();
  const response = await fetch(apiUrl(`/api/internal/trabajos/${id}/archivo`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new InternalApiError("No se pudo cargar el archivo.", response.status);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export const estadoLabels: Record<EstadoTrabajo, string> = {
  recibido: "Recibido",
  en_revision: "En revisión",
  finalista: "Finalista",
  ganador: "Ganador",
};

export const tipoArchivoLabels: Record<TrabajoListItem["tipoArchivo"], string> = {
  pdf: "PDF",
  mp4: "Video",
  imagen: "Imagen",
};

export { InternalApiError };
