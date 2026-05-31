import { pool } from "../db/pool.js";
import { joinPersonName } from "../utils/person-name.js";
import type {
  EstadoTrabajo,
  InternalStats,
  TrabajoDetail,
  TrabajoListItem,
  TrabajosFilterOptions,
} from "../types/internal.js";

const BASE_FROM = `
  FROM trabajos t
  JOIN participantes p ON p.id = t.participante_id
  JOIN retos r ON r.id = t.reto_id
  JOIN colegios c ON c.id = p.colegio_id
  JOIN grados g ON g.id = p.grado_id
  LEFT JOIN ubicaciones u ON u.id = c.ubicacion_id
`;

const BASE_SELECT = `
  SELECT
    t.id,
    t.codigo_entrega,
    t.trabajo_enlace,
    t.tipo_archivo,
    t.estado,
    t.fecha_envio,
    t.permite_reenvio,
    p.dni_estudiante AS dni,
    p.concursante_nombres,
    p.concursante_apellidos,
    p.sexo,
    p.apoderado_nombres,
    p.apoderado_apellidos,
    p.dni_apoderado,
    p.celular_apoderado,
    p.docente_nombres,
    p.docente_apellidos,
    p.email_docente,
    r.nombre_obra,
    co.book_slug,
    c.nombre AS colegio,
    g.nombre AS grado_nombre,
    g.nivel AS grado_nivel,
    u.departamento,
    u.provincia,
    u.distrito
  FROM trabajos t
  JOIN participantes p ON p.id = t.participante_id
  JOIN retos r ON r.id = t.reto_id
  JOIN colegios c ON c.id = p.colegio_id
  JOIN grados g ON g.id = p.grado_id
  LEFT JOIN ubicaciones u ON u.id = c.ubicacion_id
  LEFT JOIN concursos cc ON cc.codigo = t.codigo_concurso
  LEFT JOIN concurso_obras co ON co.concurso_id = cc.id AND co.grado_id = r.grado_id
`;

interface TrabajoRow {
  id: number;
  codigo_entrega: string;
  trabajo_enlace: string;
  tipo_archivo: "pdf" | "mp4" | "imagen";
  estado: EstadoTrabajo;
  fecha_envio: Date;
  permite_reenvio: boolean;
  dni: string;
  concursante_nombres: string;
  concursante_apellidos: string;
  sexo: "M" | "F";
  apoderado_nombres: string;
  apoderado_apellidos: string;
  dni_apoderado: string;
  celular_apoderado: string;
  docente_nombres: string;
  docente_apellidos: string;
  email_docente: string;
  nombre_obra: string;
  book_slug: string | null;
  colegio: string;
  grado_nombre: string;
  grado_nivel: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
}

function mapListItem(row: TrabajoRow): TrabajoListItem {
  return {
    id: row.id,
    codigoEntrega: row.codigo_entrega,
    dni: row.dni,
    concursante: joinPersonName(row.concursante_nombres, row.concursante_apellidos),
    bookTitle: row.nombre_obra,
    bookId: row.book_slug ?? row.nombre_obra,
    colegio: row.colegio,
    grado: `${row.grado_nombre} ${row.grado_nivel}`,
    departamento: row.departamento,
    provincia: row.provincia,
    distrito: row.distrito,
    tipoArchivo: row.tipo_archivo,
    estado: row.estado,
    fechaEnvio: row.fecha_envio.toISOString(),
    permiteReenvio: row.permite_reenvio,
  };
}

export type TipoArchivoTrabajo = TrabajoListItem["tipoArchivo"];
export type EvaluacionFiltro = "pendiente" | "evaluado";

export const TRABAJOS_PAGE_SIZE_DEFAULT = 15;
export const TRABAJOS_PAGE_SIZE_MAX = 100;

export interface ListTrabajosOptions {
  estado?: EstadoTrabajo;
  q?: string;
  gradoId?: number;
  colegioId?: number;
  libro?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  tipoArchivo?: TipoArchivoTrabajo;
  sexo?: "M" | "F";
  fechaDesde?: string;
  fechaHasta?: string;
  evaluacion?: EvaluacionFiltro;
  juradoId?: number;
  codigoConcurso?: string;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface TrabajosListResult {
  items: TrabajoListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function resolveTrabajosPagination(options: {
  page?: number;
  limit?: number;
  offset?: number;
}): { page: number; limit: number; offset: number } {
  const limit = Math.min(
    Math.max(options.limit ?? TRABAJOS_PAGE_SIZE_DEFAULT, 1),
    TRABAJOS_PAGE_SIZE_MAX,
  );

  if (options.page !== undefined && options.page >= 1) {
    const page = Math.floor(options.page);
    return { page, limit, offset: (page - 1) * limit };
  }

  const offset = Math.max(options.offset ?? 0, 0);
  const page = Math.floor(offset / limit) + 1;
  return { page, limit, offset };
}

function buildListTrabajosWhere(options: ListTrabajosOptions): {
  whereSql: string;
  params: unknown[];
  evalJoin: string;
} {
  const params: unknown[] = [];
  const where: string[] = [];
  let evalJoin = "";

  if (options.estado) {
    params.push(options.estado);
    where.push(`t.estado = $${params.length}`);
  }

  if (options.codigoConcurso) {
    params.push(options.codigoConcurso);
    where.push(`t.codigo_concurso = $${params.length}`);
  }

  if (options.q?.trim()) {
    params.push(`%${options.q.trim()}%`);
    const idx = params.length;
    where.push(
      `(p.dni_estudiante ILIKE $${idx} OR (p.concursante_nombres || ' ' || p.concursante_apellidos) ILIKE $${idx} OR t.codigo_entrega ILIKE $${idx} OR r.nombre_obra ILIKE $${idx} OR c.nombre ILIKE $${idx})`,
    );
  }

  if (options.gradoId) {
    params.push(options.gradoId);
    where.push(`g.id = $${params.length}`);
  }

  if (options.colegioId) {
    params.push(options.colegioId);
    where.push(`c.id = $${params.length}`);
  }

  if (options.libro?.trim()) {
    params.push(options.libro.trim());
    where.push(`r.nombre_obra = $${params.length}`);
  }

  if (options.departamento?.trim()) {
    params.push(options.departamento.trim());
    where.push(`u.departamento = $${params.length}`);
  }

  if (options.provincia?.trim()) {
    params.push(options.provincia.trim());
    where.push(`u.provincia = $${params.length}`);
  }

  if (options.distrito?.trim()) {
    params.push(options.distrito.trim());
    where.push(`u.distrito = $${params.length}`);
  }

  if (options.tipoArchivo) {
    params.push(options.tipoArchivo);
    where.push(`t.tipo_archivo = $${params.length}`);
  }

  if (options.sexo) {
    params.push(options.sexo);
    where.push(`p.sexo = $${params.length}`);
  }

  if (options.fechaDesde) {
    params.push(options.fechaDesde);
    where.push(`t.fecha_envio >= $${params.length}::date`);
  }

  if (options.fechaHasta) {
    params.push(options.fechaHasta);
    where.push(`t.fecha_envio < ($${params.length}::date + interval '1 day')`);
  }

  if (options.evaluacion && options.juradoId) {
    params.push(options.juradoId);
    evalJoin = `LEFT JOIN evaluaciones ev ON ev.trabajo_id = t.id AND ev.jurado_id = $${params.length}`;
    if (options.evaluacion === "pendiente") {
      where.push("ev.id IS NULL");
    } else {
      where.push("ev.id IS NOT NULL");
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params, evalJoin };
}

export async function listTrabajos(
  options: ListTrabajosOptions = {},
): Promise<TrabajosListResult> {
  const { page, limit, offset } = resolveTrabajosPagination(options);
  const { whereSql, params, evalJoin } = buildListTrabajosWhere(options);

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(DISTINCT t.id)::text AS total
     ${BASE_FROM}
     ${evalJoin}
     ${whereSql}`,
    params,
  );

  const total = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  const listParams = [...params, limit, offset];
  const result = await pool.query<TrabajoRow>(
    `${BASE_SELECT}
     ${evalJoin}
     ${whereSql}
     ORDER BY t.fecha_envio DESC, t.id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    items: result.rows.map(mapListItem),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getTrabajosFilterOptions(): Promise<TrabajosFilterOptions> {
  const [grados, libros, colegios, ubicaciones, tiposArchivo] = await Promise.all([
    pool.query<{ id: number; nombre: string; nivel: string }>(
      `SELECT id, nombre, nivel
       FROM grados
       ORDER BY
         CASE nivel WHEN 'primaria' THEN 0 WHEN 'secundaria' THEN 1 ELSE 2 END,
         nombre`,
    ),
    pool.query<{ nombre_obra: string }>(
      `SELECT DISTINCT nombre_obra
       FROM retos
       ORDER BY nombre_obra`,
    ),
    pool.query<{ id: number; nombre: string }>(
      `SELECT id, nombre
       FROM colegios
       ORDER BY nombre`,
    ),
    pool.query<{ departamento: string; provincia: string; distrito: string }>(
      `SELECT DISTINCT u.departamento, u.provincia, u.distrito
       FROM ubicaciones u
       JOIN colegios c ON c.ubicacion_id = u.id
       ORDER BY u.departamento, u.provincia, u.distrito`,
    ),
    pool.query<{ tipo_archivo: TipoArchivoTrabajo }>(
      `SELECT unnest(enum_range(NULL::tipo_archivo))::text AS tipo_archivo`,
    ),
  ]);

  return {
    grados: grados.rows.map((row) => ({
      id: row.id,
      label: `${row.nombre} ${row.nivel}`.trim(),
    })),
    libros: libros.rows.map((row) => row.nombre_obra),
    colegios: colegios.rows.map((row) => ({ id: row.id, nombre: row.nombre })),
    ubicaciones: ubicaciones.rows.map((row) => ({
      departamento: row.departamento,
      provincia: row.provincia,
      distrito: row.distrito,
    })),
    tiposArchivo: tiposArchivo.rows.map((row) => row.tipo_archivo),
  };
}

export async function getTrabajoById(id: number): Promise<TrabajoDetail | null> {
  const result = await pool.query<TrabajoRow>(
    `${BASE_SELECT} WHERE t.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...mapListItem(row),
    concursanteNombres: row.concursante_nombres,
    concursanteApellidos: row.concursante_apellidos,
    sexo: row.sexo,
    apoderadoNombres: row.apoderado_nombres,
    apoderadoApellidos: row.apoderado_apellidos,
    apoderado: joinPersonName(row.apoderado_nombres, row.apoderado_apellidos),
    dniApoderado: row.dni_apoderado,
    celularApoderado: row.celular_apoderado,
    docenteNombres: row.docente_nombres,
    docenteApellidos: row.docente_apellidos,
    docente: joinPersonName(row.docente_nombres, row.docente_apellidos),
    emailDocente: row.email_docente,
    trabajoEnlace: row.trabajo_enlace,
    evaluacion: null,
  };
}

export async function getTrabajoEnlace(id: number): Promise<string | null> {
  const result = await pool.query<{ trabajo_enlace: string }>(
    `SELECT trabajo_enlace FROM trabajos WHERE id = $1`,
    [id],
  );
  return result.rows[0]?.trabajo_enlace ?? null;
}

export async function updateTrabajoEstado(
  id: number,
  estado: EstadoTrabajo,
): Promise<TrabajoDetail | null> {
  await pool.query(`UPDATE trabajos SET estado = $2 WHERE id = $1`, [id, estado]);
  return getTrabajoById(id);
}

export async function setPermiteReenvio(
  id: number,
  permiteReenvio: boolean,
): Promise<TrabajoDetail | null> {
  await pool.query(`UPDATE trabajos SET permite_reenvio = $2 WHERE id = $1`, [
    id,
    permiteReenvio,
  ]);
  return getTrabajoById(id);
}

export async function getInternalStats(codigoConcurso?: string): Promise<InternalStats> {
  const params: unknown[] = [];
  const whereSql = codigoConcurso ? "WHERE codigo_concurso = $1" : "";
  if (codigoConcurso) params.push(codigoConcurso);

  const totalResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM trabajos ${whereSql}`,
    params,
  );
  const participantesResult = await pool.query<{ total: string }>(
    `SELECT COUNT(DISTINCT participante_id)::text AS total FROM trabajos ${whereSql}`,
    params,
  );
  const byEstado = await pool.query<{ estado: EstadoTrabajo; total: string }>(
    `SELECT estado, COUNT(*)::text AS total FROM trabajos ${whereSql} GROUP BY estado`,
    params,
  );
  const byDia = await pool.query<{ fecha: string; cantidad: string }>(
    `SELECT (fecha_envio AT TIME ZONE 'America/Lima')::date::text AS fecha,
            COUNT(*)::text AS cantidad
     FROM trabajos
     ${whereSql}
     GROUP BY 1
     ORDER BY 1`,
    params,
  );

  const porEstado: InternalStats["porEstado"] = {
    recibido: 0,
    en_revision: 0,
    finalista: 0,
    ganador: 0,
  };
  for (const row of byEstado.rows) {
    porEstado[row.estado] = Number(row.total);
  }

  return {
    totalTrabajos: Number(totalResult.rows[0]?.total ?? 0),
    totalParticipantes: Number(participantesResult.rows[0]?.total ?? 0),
    porEstado,
    entregasPorDia: buildEntregasPorDiaSeries(byDia.rows),
  };
}

function buildEntregasPorDiaSeries(
  rows: Array<{ fecha: string; cantidad: string }>,
): InternalStats["entregasPorDia"] {
  if (rows.length === 0) return [];

  const byDate = new Map(
    rows.map((row) => [row.fecha.slice(0, 10), Number(row.cantidad)]),
  );
  const start = parseIsoDate(rows[0].fecha.slice(0, 10));
  const end = parseIsoDate(rows[rows.length - 1].fecha.slice(0, 10));
  const series: InternalStats["entregasPorDia"] = [];
  let acumulado = 0;

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    const fecha = formatIsoDate(cursor);
    const cantidad = byDate.get(fecha) ?? 0;
    acumulado += cantidad;
    series.push({ fecha, cantidad, acumulado });
  }

  return series;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function upsertEvaluacion(input: {
  trabajoId: number;
  juradoId: number;
  puntaje?: number | null;
  comentarios?: string | null;
  esDestacado?: boolean;
}) {
  const result = await pool.query<{
    id: number;
    puntaje: number | null;
    comentarios: string | null;
    es_destacado: boolean;
    fecha_evaluacion: Date;
  }>(
    `INSERT INTO evaluaciones (trabajo_id, jurado_id, puntaje, comentarios, es_destacado)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (trabajo_id, jurado_id) DO UPDATE SET
       puntaje = EXCLUDED.puntaje,
       comentarios = EXCLUDED.comentarios,
       es_destacado = EXCLUDED.es_destacado,
       fecha_evaluacion = NOW()
     RETURNING id, puntaje, comentarios, es_destacado, fecha_evaluacion`,
    [
      input.trabajoId,
      input.juradoId,
      input.puntaje ?? null,
      input.comentarios?.trim() || null,
      input.esDestacado ?? false,
    ],
  );
  return result.rows[0];
}

export async function getEvaluacionByJurado(trabajoId: number, juradoId: number) {
  const result = await pool.query<{
    id: number;
    puntaje: number | null;
    comentarios: string | null;
    es_destacado: boolean;
    fecha_evaluacion: Date;
  }>(
    `SELECT id, puntaje, comentarios, es_destacado, fecha_evaluacion
     FROM evaluaciones WHERE trabajo_id = $1 AND jurado_id = $2`,
    [trabajoId, juradoId],
  );
  return result.rows[0] ?? null;
}

export async function getEvaluacionesOtrosJurados(
  trabajoId: number,
  excludeJuradoId: number,
) {
  const result = await pool.query<{
    id: number;
    jurado_id: number;
    jurado_nombre: string;
    puntaje: number | null;
    comentarios: string | null;
    es_destacado: boolean;
    fecha_evaluacion: Date;
  }>(
    `SELECT
       e.id,
       e.jurado_id,
       u.nombre AS jurado_nombre,
       e.puntaje,
       e.comentarios,
       e.es_destacado,
       e.fecha_evaluacion
     FROM evaluaciones e
     JOIN usuarios_internos u ON u.id = e.jurado_id
     WHERE e.trabajo_id = $1 AND e.jurado_id <> $2
     ORDER BY e.fecha_evaluacion DESC`,
    [trabajoId, excludeJuradoId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    juradoId: row.jurado_id,
    juradoNombre: row.jurado_nombre,
    puntaje: row.puntaje,
    comentarios: row.comentarios,
    esDestacado: row.es_destacado,
    fechaEvaluacion: row.fecha_evaluacion.toISOString(),
  }));
}

export async function getTrabajoDetailForJurado(
  id: number,
  juradoId: number,
): Promise<TrabajoDetail | null> {
  const trabajo = await getTrabajoById(id);
  if (!trabajo) return null;
  const evaluacion = await getEvaluacionByJurado(id, juradoId);
  const evaluacionesOtros = await getEvaluacionesOtrosJurados(id, juradoId);
  return {
    ...trabajo,
    evaluacionesOtros,
    evaluacion: evaluacion
      ? {
          id: evaluacion.id,
          puntaje: evaluacion.puntaje,
          comentarios: evaluacion.comentarios,
          esDestacado: evaluacion.es_destacado,
          fechaEvaluacion: evaluacion.fecha_evaluacion.toISOString(),
        }
      : null,
  };
}

export const DELETE_TRABAJOS_CONFIRM_WORD = "ELIMINAR";

export async function bulkUpdateTrabajosEstado(
  ids: number[],
  estado: EstadoTrabajo,
): Promise<{ updated: number }> {
  const result = await pool.query(
    `UPDATE trabajos SET estado = $2 WHERE id = ANY($1::int[])`,
    [ids, estado],
  );
  return { updated: result.rowCount ?? 0 };
}

export async function bulkDeleteTrabajos(
  ids: number[],
  confirmacion: string,
): Promise<{ deleted: number }> {
  if (confirmacion !== DELETE_TRABAJOS_CONFIRM_WORD) {
    throw new Error("CONFIRMATION_REQUIRED");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const participantes = await client.query<{ participante_id: number }>(
      `SELECT participante_id FROM trabajos WHERE id = ANY($1::int[])`,
      [ids],
    );
    const participanteIds = participantes.rows.map((row) => row.participante_id);

    await client.query(`DELETE FROM evaluaciones WHERE trabajo_id = ANY($1::int[])`, [ids]);
    const deleted = await client.query(`DELETE FROM trabajos WHERE id = ANY($1::int[])`, [ids]);

    if (participanteIds.length > 0) {
      await client.query(
        `DELETE FROM participantes p
         WHERE p.id = ANY($1::int[])
           AND NOT EXISTS (SELECT 1 FROM trabajos t WHERE t.participante_id = p.id)`,
        [participanteIds],
      );
    }

    await client.query("COMMIT");
    return { deleted: deleted.rowCount ?? 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
