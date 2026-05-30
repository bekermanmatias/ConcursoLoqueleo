export type EstadoTrabajo = "recibido" | "en_revision" | "finalista" | "ganador";
export type TipoArchivo = "pdf" | "mp4" | "imagen";

/** Respuesta de la API pública (compatible con el frontend actual). */
export interface ParticipationRecord {
  dni: string;
  code: string;
  bookId: string;
  bookTitle: string;
  colegio: string;
  grado: string;
  departamento?: string | null;
  ciudad?: string | null;
  distrito?: string | null;
  fileName: string;
  fileUrl?: string | null;
  s3Key?: string | null;
  fileStatus: "ok" | "pendiente";
  fileStatusDetail: string;
  estado: EstadoTrabajo;
  reuploadAllowed: boolean;
  submittedAt: string;
}

export interface CreateParticipationInput {
  dni: string;
  code: string;
  bookId: string;
  bookTitle: string;
  colegio: string;
  grado: string;
  departamento?: string;
  ciudad?: string;
  distrito?: string;
  fileName: string;
  fileUrl?: string;
  s3Key?: string;
  nombreCompleto?: string;
  edad?: number;
}

interface ParticipationRow {
  dni: string;
  trabajo_id: number;
  book_slug: string | null;
  titulo_libro: string;
  colegio: string;
  grado_nombre: string;
  grado_nivel: string;
  departamento: string | null;
  ciudad: string | null;
  distrito: string | null;
  archivo_url: string;
  tipo_archivo: TipoArchivo;
  estado: EstadoTrabajo;
  fecha_envio: Date;
}

export function mapRow(row: ParticipationRow): ParticipationRecord {
  const grado = `${row.grado_nombre} ${row.grado_nivel}`;
  const fileName = row.archivo_url.split("/").pop() ?? row.archivo_url;

  return {
    dni: row.dni,
    code: `LL-${String(row.trabajo_id).padStart(6, "0")}`,
    bookId: row.book_slug ?? row.titulo_libro,
    bookTitle: row.titulo_libro,
    colegio: row.colegio,
    grado,
    departamento: row.departamento,
    ciudad: row.ciudad,
    distrito: row.distrito,
    fileName,
    fileUrl: row.archivo_url.startsWith("http") ? row.archivo_url : null,
    s3Key: row.archivo_url.startsWith("http") ? row.archivo_url : null,
    fileStatus: "ok",
    fileStatusDetail: statusDetail(row.estado, row.tipo_archivo),
    estado: row.estado,
    reuploadAllowed: false,
    submittedAt: row.fecha_envio.toISOString(),
  };
}

function statusDetail(estado: EstadoTrabajo, tipo: TipoArchivo): string {
  const tipoLabel =
    tipo === "pdf" ? "PDF" : tipo === "mp4" ? "Video MP4" : "Imagen";
  switch (estado) {
    case "recibido":
      return `Recibimos tu ${tipoLabel}. Lo verificaremos pronto.`;
    case "en_revision":
      return `Estamos revisando tu ${tipoLabel}.`;
    case "finalista":
      return `Tu ${tipoLabel} fue seleccionado como finalista.`;
    case "ganador":
      return `¡Felicitaciones! Tu ${tipoLabel} fue seleccionado como ganador.`;
  }
}

export function canReupload(_record: ParticipationRecord): boolean {
  return false;
}
