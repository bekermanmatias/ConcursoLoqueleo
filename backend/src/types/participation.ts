export type EstadoTrabajo = "recibido" | "en_revision" | "finalista" | "ganador";
export type TipoArchivo = "pdf" | "mp4" | "imagen";
export type Sexo = "M" | "F";

export interface ParticipationRecord {
  dni: string;
  code: string;
  bookId: string;
  bookTitle: string;
  colegio: string;
  grado: string;
  concursanteNombres: string;
  concursanteApellidos: string;
  /** Nombre completo (nombres + apellidos) para compatibilidad */
  concursante: string;
  departamento?: string | null;
  provincia?: string | null;
  /** @deprecated Alias de provincia para compatibilidad */
  ciudad?: string | null;
  distrito?: string | null;
  fileName: string;
  fileUrl?: string | null;
  fileStatus: "ok" | "pendiente";
  fileStatusDetail: string;
  estado: EstadoTrabajo;
  reuploadAllowed: boolean;
  submittedAt: string;
}

export interface CreateParticipationInput {
  dni: string;
  bookId: string;
  bookTitle: string;
  colegio: string;
  codigoColegio: string;
  grado: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  concursanteNombres: string;
  concursanteApellidos: string;
  sexo: Sexo;
  apoderadoNombres: string;
  apoderadoApellidos: string;
  dniApoderado: string;
  celularApoderado: string;
  docenteNombres: string;
  docenteApellidos: string;
  emailDocente: string;
  fileName: string;
  fileUrl?: string;
  s3Key?: string;
}

export interface ParticipationRow {
  dni: string;
  codigo_entrega: string;
  concursante_nombres: string;
  concursante_apellidos: string;
  nombre_obra: string;
  colegio: string;
  grado_nombre: string;
  grado_nivel: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  trabajo_enlace: string;
  tipo_archivo: TipoArchivo;
  estado: EstadoTrabajo;
  permite_reenvio: boolean;
  fecha_envio: Date;
  book_slug?: string | null;
}

export function mapRow(row: ParticipationRow): ParticipationRecord {
  const grado = `${row.grado_nombre} ${row.grado_nivel}`;
  const fileName = row.trabajo_enlace.split("/").pop() ?? row.trabajo_enlace;
  const concursante = [row.concursante_nombres, row.concursante_apellidos]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  return {
    dni: row.dni,
    code: row.codigo_entrega,
    concursanteNombres: row.concursante_nombres,
    concursanteApellidos: row.concursante_apellidos,
    concursante,
    bookId: row.book_slug ?? row.nombre_obra,
    bookTitle: row.nombre_obra,
    colegio: row.colegio,
    grado,
    departamento: row.departamento,
    provincia: row.provincia,
    ciudad: row.provincia,
    distrito: row.distrito,
    fileName,
    fileUrl: row.trabajo_enlace.startsWith("http") ? row.trabajo_enlace : null,
    fileStatus: "ok",
    fileStatusDetail: statusDetail(row.estado, row.tipo_archivo),
    estado: row.estado,
    reuploadAllowed: row.permite_reenvio,
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

export function canReupload(record: ParticipationRecord): boolean {
  return record.reuploadAllowed;
}
