export type RolUsuario = "admin" | "jurado";

export interface InternalUser {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface AuthTokenPayload {
  sub: number;
  email: string;
  rol: RolUsuario;
}

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
