import { pool } from "../db/pool.js";
import { config } from "../config.js";
import { normalizeFechaFin } from "../utils/concurso-dates.js";
import type { Concurso, ConcursoDetail, ConcursoObra, ConcursoSummary } from "../types/internal.js";

interface ConcursoRow {
  id: number;
  codigo: string;
  nombre: string;
  anio: number;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  inscripciones_abiertas: boolean;
  activo: boolean;
  terminos_pdf: string | null;
  created_at: Date;
  total_trabajos?: string;
  total_participantes?: string;
}

export const OBRA_COVER_MAX_BYTES = 2 * 1024 * 1024;
export const OBRA_COVER_RECOMMENDED = { width: 600, height: 900, ratio: "2:3" };

interface ObraRow {
  id: number;
  concurso_id: number;
  grado_id: number;
  grado_nombre: string;
  grado_nivel: string;
  book_slug: string | null;
  nombre_obra: string;
  autor: string | null;
  rol: string | null;
  edad: string | null;
  tipo_reto: string;
  cover_url: string | null;
  bases_pdf: string | null;
  challenge_intro: string | null;
  challenge_headline: string | null;
  descripcion_reto: string | null;
  entregable: string | null;
  formatos: string[] | null;
  requisitos: string[] | null;
  nota_participacion: string | null;
  activo: boolean;
}

const OBRA_SELECT = `
  o.id, o.concurso_id, o.grado_id, g.nombre AS grado_nombre, g.nivel AS grado_nivel,
  o.book_slug, o.nombre_obra, o.autor, o.rol, o.edad, o.tipo_reto,
  o.cover_url, o.bases_pdf, o.challenge_intro, o.challenge_headline,
  o.descripcion_reto, o.entregable, o.formatos, o.requisitos, o.nota_participacion, o.activo
`;

function mapObra(row: ObraRow): ConcursoObra {
  return {
    id: row.id,
    concursoId: row.concurso_id,
    gradoId: row.grado_id,
    gradoLabel: `${row.grado_nombre} ${row.grado_nivel}`.trim(),
    bookSlug: row.book_slug,
    nombreObra: row.nombre_obra,
    autor: row.autor,
    rol: row.rol,
    edad: row.edad,
    tipoReto: row.tipo_reto,
    coverUrl: row.cover_url,
    basesPdf: row.bases_pdf,
    challengeIntro: row.challenge_intro,
    challengeHeadline: row.challenge_headline,
    descripcionReto: row.descripcion_reto,
    entregable: row.entregable,
    formatos: row.formatos ?? [],
    requisitos: row.requisitos ?? [],
    notaParticipacion: row.nota_participacion,
    activo: row.activo,
  };
}

async function fetchObraRow(concursoId: number, obraId: number): Promise<ObraRow | null> {
  const result = await pool.query<ObraRow>(
    `SELECT ${OBRA_SELECT}
     FROM concurso_obras o
     JOIN grados g ON g.id = o.grado_id
     WHERE o.id = $1 AND o.concurso_id = $2`,
    [obraId, concursoId],
  );
  return result.rows[0] ?? null;
}

function mapConcurso(row: ConcursoRow): Concurso {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    anio: row.anio,
    fechaInicio: row.fecha_inicio?.toISOString() ?? null,
    fechaFin: row.fecha_fin?.toISOString() ?? null,
    inscripcionesAbiertas: row.inscripciones_abiertas,
    activo: row.activo,
    terminosPdf: row.terminos_pdf,
    createdAt: row.created_at.toISOString(),
  };
}

function mapConcursoSummary(row: ConcursoRow): ConcursoSummary {
  return {
    ...mapConcurso(row),
    totalTrabajos: Number(row.total_trabajos ?? 0),
    totalParticipantes: Number(row.total_participantes ?? 0),
  };
}

async function listObrasForConcurso(concursoId: number): Promise<ConcursoObra[]> {
  const result = await pool.query<ObraRow>(
    `SELECT ${OBRA_SELECT}
     FROM concurso_obras o
     JOIN grados g ON g.id = o.grado_id
     WHERE o.concurso_id = $1
     ORDER BY
       CASE g.nivel WHEN 'primaria' THEN 0 WHEN 'secundaria' THEN 1 ELSE 2 END,
       g.nombre`,
    [concursoId],
  );
  return result.rows.map(mapObra);
}

export async function listActiveObras(): Promise<ConcursoObra[]> {
  const active = await getActiveConcurso();
  if (!active) return [];
  const obras = await listObrasForConcurso(active.id);
  return obras.filter((obra) => obra.activo);
}

export async function getActiveObraBySlug(slug: string): Promise<ConcursoObra | null> {
  const obras = await listActiveObras();
  return obras.find((obra) => obra.bookSlug === slug) ?? null;
}

export async function findActiveObraForParticipation(
  bookSlug: string,
  gradoLabel: string,
): Promise<ConcursoObra | null> {
  const active = await getActiveConcurso();
  if (!active) return null;
  const result = await pool.query<ObraRow>(
    `SELECT ${OBRA_SELECT}
     FROM concurso_obras o
     JOIN grados g ON g.id = o.grado_id
     WHERE o.concurso_id = $1
       AND o.activo = TRUE
       AND o.book_slug = $2
       AND TRIM(g.nombre || ' ' || g.nivel) = $3`,
    [active.id, bookSlug, gradoLabel.trim()],
  );
  return result.rows[0] ? mapObra(result.rows[0]) : null;
}

export async function findBookSlugByObraTitle(title: string): Promise<string | null> {
  const active = await getActiveConcurso();
  if (!active) return null;
  const result = await pool.query<{ book_slug: string | null }>(
    `SELECT book_slug FROM concurso_obras
     WHERE concurso_id = $1 AND nombre_obra = $2
     LIMIT 1`,
    [active.id, title],
  );
  return result.rows[0]?.book_slug ?? null;
}

const CONCURSO_SELECT = `
  c.id, c.codigo, c.nombre, c.anio, c.fecha_inicio, c.fecha_fin,
  c.inscripciones_abiertas, c.activo, c.terminos_pdf, c.created_at
`;

const CONCURSO_FROM = `
  FROM concursos c
  LEFT JOIN trabajos t ON t.codigo_concurso = c.codigo
`;

export async function getActiveConcurso(): Promise<Concurso | null> {
  const result = await pool.query<ConcursoRow>(
    `SELECT ${CONCURSO_SELECT}
     FROM concursos c
     WHERE c.activo = TRUE
     LIMIT 1`,
  );
  return result.rows[0] ? mapConcurso(result.rows[0]) : null;
}

export async function getActiveConcursoCodigo(): Promise<string> {
  const active = await getActiveConcurso();
  return active?.codigo ?? config.codigoConcurso;
}

export async function getConcursoById(id: number): Promise<ConcursoSummary | null> {
  const result = await pool.query<ConcursoRow>(
    `SELECT ${CONCURSO_SELECT},
            COUNT(t.id)::text AS total_trabajos,
            COUNT(DISTINCT t.participante_id)::text AS total_participantes
     ${CONCURSO_FROM}
     WHERE c.id = $1
     GROUP BY c.id`,
    [id],
  );
  return result.rows[0] ? mapConcursoSummary(result.rows[0]) : null;
}

export async function getConcursoDetail(id: number): Promise<ConcursoDetail | null> {
  const summary = await getConcursoById(id);
  if (!summary) return null;
  const obras = await listObrasForConcurso(id);
  return { ...summary, obras };
}

export async function listConcursos(): Promise<ConcursoSummary[]> {
  const result = await pool.query<ConcursoRow>(
    `SELECT ${CONCURSO_SELECT},
            COUNT(t.id)::text AS total_trabajos,
            COUNT(DISTINCT t.participante_id)::text AS total_participantes
     ${CONCURSO_FROM}
     GROUP BY c.id
     ORDER BY c.activo DESC, c.anio DESC, c.id DESC`,
  );
  return result.rows.map(mapConcursoSummary);
}

export async function updateConcurso(
  id: number,
  input: {
    nombre?: string;
    anio?: number;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    inscripcionesAbiertas?: boolean;
    terminosPdf?: string | null;
  },
): Promise<Concurso | null> {
  const existing = await getConcursoById(id);
  if (!existing) return null;

  const nombre = input.nombre?.trim() || existing.nombre;
  const anio = input.anio ?? existing.anio;

  if (!nombre || !Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new Error("INVALID_DATA");
  }

  const fechaFin =
    input.fechaFin === undefined
      ? existing.fechaFin
      : input.fechaFin === null
        ? null
        : normalizeFechaFin(input.fechaFin);

  const result = await pool.query<ConcursoRow>(
    `UPDATE concursos SET
       nombre = $2,
       anio = $3,
       fecha_inicio = $4,
       fecha_fin = $5,
       inscripciones_abiertas = COALESCE($6, inscripciones_abiertas),
       terminos_pdf = $7
     WHERE id = $1
     RETURNING id, codigo, nombre, anio, fecha_inicio, fecha_fin,
               inscripciones_abiertas, activo, terminos_pdf, created_at`,
    [
      id,
      nombre,
      anio,
      input.fechaInicio === undefined ? existing.fechaInicio : input.fechaInicio,
      fechaFin,
      input.inscripcionesAbiertas,
      input.terminosPdf === undefined ? existing.terminosPdf : input.terminosPdf,
    ],
  );
  return result.rows[0] ? mapConcurso(result.rows[0]) : null;
}

async function cloneObrasFromConcurso(sourceId: number, targetId: number): Promise<void> {
  await pool.query(
    `INSERT INTO concurso_obras (
       concurso_id, grado_id, nombre_obra, tipo_reto, cover_url, bases_pdf, activo,
       book_slug, autor, rol, edad, challenge_intro, challenge_headline,
       descripcion_reto, entregable, formatos, requisitos, nota_participacion
     )
     SELECT $2, grado_id, nombre_obra, tipo_reto, cover_url, bases_pdf, activo,
            book_slug, autor, rol, edad, challenge_intro, challenge_headline,
            descripcion_reto, entregable, formatos, requisitos, nota_participacion
     FROM concurso_obras
     WHERE concurso_id = $1
     ON CONFLICT (concurso_id, grado_id) DO NOTHING`,
    [sourceId, targetId],
  );
}

export async function createConcurso(input: {
  codigo: string;
  nombre: string;
  anio: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  inscripcionesAbiertas?: boolean;
  clonarDesdeId?: number;
}): Promise<ConcursoDetail> {
  const codigo = input.codigo.trim().toUpperCase();
  const nombre = input.nombre.trim();

  if (!/^[A-Z0-9_-]{3,32}$/.test(codigo) || !nombre || !Number.isInteger(input.anio)) {
    throw new Error("INVALID_DATA");
  }

  const result = await pool.query<ConcursoRow>(
    `INSERT INTO concursos (codigo, nombre, anio, fecha_inicio, fecha_fin, inscripciones_abiertas, activo)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)
     RETURNING id, codigo, nombre, anio, fecha_inicio, fecha_fin,
               inscripciones_abiertas, activo, terminos_pdf, created_at`,
    [
      codigo,
      nombre,
      input.anio,
      input.fechaInicio ?? null,
      input.fechaFin != null ? normalizeFechaFin(input.fechaFin) : null,
      input.inscripcionesAbiertas ?? false,
    ],
  );

  const created = mapConcurso(result.rows[0]);
  let sourceId = input.clonarDesdeId;
  if (!sourceId) {
    const active = await getActiveConcurso();
    sourceId = active?.id;
  }
  if (sourceId) {
    await cloneObrasFromConcurso(sourceId, created.id);
    const source = await getConcursoById(sourceId);
    if (source?.terminosPdf) {
      await pool.query(`UPDATE concursos SET terminos_pdf = $2 WHERE id = $1`, [
        created.id,
        source.terminosPdf,
      ]);
    }
  }

  const detail = await getConcursoDetail(created.id);
  if (!detail) throw new Error("CREATE_FAILED");
  return detail;
}

export async function updateConcursoObra(
  concursoId: number,
  obraId: number,
  input: {
    bookSlug?: string | null;
    nombreObra?: string;
    autor?: string | null;
    rol?: string | null;
    edad?: string | null;
    tipoReto?: string;
    coverUrl?: string | null;
    basesPdf?: string | null;
    challengeIntro?: string | null;
    challengeHeadline?: string | null;
    descripcionReto?: string | null;
    entregable?: string | null;
    formatos?: string[];
    requisitos?: string[];
    notaParticipacion?: string | null;
    activo?: boolean;
  },
): Promise<ConcursoObra | null> {
  const existing = await fetchObraRow(concursoId, obraId);
  if (!existing) return null;

  await pool.query(
    `UPDATE concurso_obras SET
       book_slug = CASE WHEN $3::boolean THEN $4 ELSE book_slug END,
       nombre_obra = COALESCE($5, nombre_obra),
       autor = CASE WHEN $6::boolean THEN $7 ELSE autor END,
       rol = CASE WHEN $8::boolean THEN $9 ELSE rol END,
       edad = CASE WHEN $10::boolean THEN $11 ELSE edad END,
       tipo_reto = COALESCE($12, tipo_reto),
       cover_url = CASE WHEN $13::boolean THEN $14 ELSE cover_url END,
       bases_pdf = CASE WHEN $15::boolean THEN $16 ELSE bases_pdf END,
       challenge_intro = CASE WHEN $17::boolean THEN $18 ELSE challenge_intro END,
       challenge_headline = CASE WHEN $19::boolean THEN $20 ELSE challenge_headline END,
       descripcion_reto = CASE WHEN $21::boolean THEN $22 ELSE descripcion_reto END,
       entregable = CASE WHEN $23::boolean THEN $24 ELSE entregable END,
       formatos = CASE WHEN $25::boolean THEN $26::jsonb ELSE formatos END,
       requisitos = CASE WHEN $27::boolean THEN $28::jsonb ELSE requisitos END,
       nota_participacion = CASE WHEN $29::boolean THEN $30 ELSE nota_participacion END,
       activo = COALESCE($31, activo)
     WHERE id = $1 AND concurso_id = $2`,
    [
      obraId,
      concursoId,
      input.bookSlug !== undefined,
      input.bookSlug,
      input.nombreObra?.trim() ?? null,
      input.autor !== undefined,
      input.autor,
      input.rol !== undefined,
      input.rol,
      input.edad !== undefined,
      input.edad,
      input.tipoReto?.trim() ?? null,
      input.coverUrl !== undefined,
      input.coverUrl,
      input.basesPdf !== undefined,
      input.basesPdf,
      input.challengeIntro !== undefined,
      input.challengeIntro,
      input.challengeHeadline !== undefined,
      input.challengeHeadline,
      input.descripcionReto !== undefined,
      input.descripcionReto,
      input.entregable !== undefined,
      input.entregable,
      input.formatos !== undefined,
      JSON.stringify(input.formatos ?? []),
      input.requisitos !== undefined,
      JSON.stringify(input.requisitos ?? []),
      input.notaParticipacion !== undefined,
      input.notaParticipacion,
      input.activo ?? null,
    ],
  );

  const updated = await fetchObraRow(concursoId, obraId);
  return updated ? mapObra(updated) : null;
}

export async function activateConcurso(id: number): Promise<Concurso | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const target = await client.query<{ id: number }>(
      `SELECT id FROM concursos WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!target.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(`UPDATE concursos SET activo = FALSE WHERE activo = TRUE`);
    const updated = await client.query<ConcursoRow>(
      `UPDATE concursos SET activo = TRUE
       WHERE id = $1
       RETURNING id, codigo, nombre, anio, fecha_inicio, fecha_fin,
                 inscripciones_abiertas, activo, terminos_pdf, created_at`,
      [id],
    );

    await client.query("COMMIT");
    return updated.rows[0] ? mapConcurso(updated.rows[0]) : null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setConcursoTerminosPdf(
  concursoId: number,
  terminosPdf: string,
): Promise<Concurso | null> {
  const result = await pool.query<ConcursoRow>(
    `UPDATE concursos SET terminos_pdf = $2
     WHERE id = $1
     RETURNING id, codigo, nombre, anio, fecha_inicio, fecha_fin,
               inscripciones_abiertas, activo, terminos_pdf, created_at`,
    [concursoId, terminosPdf],
  );
  return result.rows[0] ? mapConcurso(result.rows[0]) : null;
}

export async function setConcursoObraCoverUrl(
  concursoId: number,
  obraId: number,
  coverUrl: string,
): Promise<ConcursoObra | null> {
  return updateConcursoObra(concursoId, obraId, { coverUrl });
}

export async function setConcursoObraBasesPdf(
  concursoId: number,
  obraId: number,
  basesPdf: string,
): Promise<ConcursoObra | null> {
  return updateConcursoObra(concursoId, obraId, { basesPdf });
}
