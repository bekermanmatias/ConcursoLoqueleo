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
  concursanteNombres: string;
  concursanteApellidos: string;
  sexo: "M" | "F";
  apoderadoNombres: string;
  apoderadoApellidos: string;
  /** Nombre completo del apoderado */
  apoderado: string;
  dniApoderado: string;
  celularApoderado: string;
  docenteNombres: string;
  docenteApellidos: string;
  /** Nombre completo del docente */
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

export interface Concurso {
  id: number;
  codigo: string;
  nombre: string;
  anio: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  inscripcionesAbiertas: boolean;
  activo: boolean;
  terminosPdf: string | null;
  createdAt: string;
}

export interface ConcursoSummary extends Concurso {
  totalTrabajos: number;
  totalParticipantes: number;
}

export interface ConcursoObra {
  id: number;
  concursoId: number;
  gradoId: number;
  gradoLabel: string;
  bookSlug: string | null;
  nombreObra: string;
  autor: string | null;
  rol: string | null;
  edad: string | null;
  tipoReto: string;
  coverUrl: string | null;
  basesPdf: string | null;
  challengeIntro: string | null;
  challengeHeadline: string | null;
  descripcionReto: string | null;
  entregable: string | null;
  formatos: string[];
  requisitos: string[];
  notaParticipacion: string | null;
  activo: boolean;
}

export interface ConcursoDetail extends ConcursoSummary {
  obras: ConcursoObra[];
}

export interface InternalStats {
  totalTrabajos: number;
  totalParticipantes: number;
  porEstado: Record<EstadoTrabajo, number>;
  entregasPorDia: EntregaPorDia[];
}

export interface EntregaPorDia {
  fecha: string;
  cantidad: number;
  acumulado: number;
}

export interface TrabajosFilterOptions {
  grados: { id: number; label: string }[];
  libros: string[];
  colegios: { id: number; nombre: string }[];
  ubicaciones: { departamento: string; provincia: string; distrito: string }[];
  tiposArchivo: TrabajoListItem["tipoArchivo"][];
}
