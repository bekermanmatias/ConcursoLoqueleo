import { apiUrl } from "./api";
import { clearAuthSession, getAuthToken, type InternalUser, type RolUsuario } from "./auth";

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

export interface EntregaPorDia {
  fecha: string;
  cantidad: number;
  acumulado: number;
}

export interface InternalStats {
  totalTrabajos: number;
  totalParticipantes: number;
  porEstado: Record<EstadoTrabajo, number>;
  entregasPorDia: EntregaPorDia[];
}

export interface TrabajosFilterOptions {
  grados: { id: number; label: string }[];
  libros: string[];
  colegios: { id: number; nombre: string }[];
  ubicaciones: { departamento: string; provincia: string; distrito: string }[];
  tiposArchivo: TrabajoListItem["tipoArchivo"][];
}

export type EvaluacionFiltro = "pendiente" | "evaluado";

export const TRABAJOS_PAGE_SIZE = 15;

export interface TrabajosListResponse {
  items: TrabajoListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
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
  page?: number;
  limit?: number;
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
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  const qs = search.toString();
  return internalRequest<TrabajosListResponse>(
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
  const data = await internalRequest<Partial<InternalStats>>("/api/internal/stats");
  return {
    totalTrabajos: data.totalTrabajos ?? 0,
    totalParticipantes: data.totalParticipantes ?? data.totalTrabajos ?? 0,
    porEstado: {
      recibido: data.porEstado?.recibido ?? 0,
      en_revision: data.porEstado?.en_revision ?? 0,
      finalista: data.porEstado?.finalista ?? 0,
      ganador: data.porEstado?.ganador ?? 0,
    },
    entregasPorDia: data.entregasPorDia ?? [],
  } satisfies InternalStats;
}

export interface InternalUsersListResponse {
  items: InternalUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const USERS_PAGE_SIZE = TRABAJOS_PAGE_SIZE;

function normalizeUsersListResponse(
  data: InternalUsersListResponse | InternalUser[],
  params?: { q?: string; rol?: RolUsuario; page?: number; limit?: number },
): InternalUsersListResponse {
  const limit = params?.limit ?? USERS_PAGE_SIZE;
  const page = Math.max(params?.page ?? 1, 1);

  if (!Array.isArray(data) && data.items && data.total !== undefined) {
    const total = data.total ?? 0;
    const resolvedLimit = data.limit ?? limit;
    const totalPages =
      data.totalPages ?? (total === 0 ? 0 : Math.ceil(total / resolvedLimit));
    return {
      items: data.items,
      total,
      page: data.page ?? page,
      limit: resolvedLimit,
      totalPages,
    };
  }

  let items = Array.isArray(data) ? data : (data.items ?? []);

  if (params?.q) {
    const q = params.q.toLowerCase();
    items = items.filter(
      (user) =>
        user.nombre.toLowerCase().includes(q) || user.email.toLowerCase().includes(q),
    );
  }
  if (params?.rol) {
    items = items.filter((user) => user.rol === params.rol);
  }

  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const offset = (safePage - 1) * limit;

  return {
    items: items.slice(offset, offset + limit),
    total,
    page: safePage,
    limit,
    totalPages,
  };
}

export async function fetchInternalUsers(params?: {
  q?: string;
  rol?: RolUsuario;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.rol) search.set("rol", params.rol);
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  const qs = search.toString();
  const data = await internalRequest<InternalUsersListResponse | InternalUser[]>(
    `/api/internal/usuarios${qs ? `?${qs}` : ""}`,
  );
  return normalizeUsersListResponse(data, params);
}

export async function createInternalUser(input: {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}) {
  return internalRequest<InternalUser>("/api/internal/usuarios", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateInternalUser(
  id: number,
  input: {
    nombre?: string;
    email?: string;
    rol?: RolUsuario;
    password?: string;
  },
) {
  return internalRequest<InternalUser>(`/api/internal/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteInternalUser(id: number) {
  return internalRequest<void>(`/api/internal/usuarios/${id}`, {
    method: "DELETE",
  });
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
