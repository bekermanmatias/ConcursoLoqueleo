import { pool } from "../db/pool.js";
import {
  BOOKS_BY_SLUG,
  buildArchivoUrl,
  gradoLabel,
  inferTipoArchivo,
  parseGradoLabel,
  slugFromBookTitle,
} from "../data/books.js";
import {
  canReupload,
  mapRow,
  type CreateParticipationInput,
  type ParticipationRecord,
} from "../types/participation.js";

const SELECT_JOIN = `
  SELECT
    p.dni,
    t.id AS trabajo_id,
    r.titulo_libro,
    c.nombre AS colegio,
    g.nombre AS grado_nombre,
    g.nivel AS grado_nivel,
    u.departamento,
    u.ciudad,
    u.distrito,
    t.archivo_url,
    t.tipo_archivo,
    t.estado,
    t.fecha_envio
  FROM participantes p
  JOIN trabajos t ON t.participante_id = p.id
  JOIN retos r ON r.id = t.reto_id
  JOIN colegios c ON c.id = p.colegio_id
  JOIN grados g ON g.id = p.grado_id
  LEFT JOIN ubicaciones u ON u.id = c.ubicacion_id
`;

interface ParticipationRow {
  dni: string;
  trabajo_id: number;
  titulo_libro: string;
  colegio: string;
  grado_nombre: string;
  grado_nivel: string;
  departamento: string | null;
  ciudad: string | null;
  distrito: string | null;
  archivo_url: string;
  tipo_archivo: "pdf" | "mp4" | "imagen";
  estado: "recibido" | "en_revision" | "finalista" | "ganador";
  fecha_envio: Date;
  book_slug?: string | null;
}

export async function findByDni(dni: string): Promise<ParticipationRecord | null> {
  const result = await pool.query<ParticipationRow>(
    `${SELECT_JOIN} WHERE p.dni = $1`,
    [dni],
  );
  if (!result.rows[0]) return null;
  return mapRow({
    ...result.rows[0],
    book_slug: slugFromBookTitle(result.rows[0].titulo_libro),
  });
}

export async function isDniBlocked(dni: string): Promise<boolean> {
  const record = await findByDni(dni);
  if (!record) return false;
  return !canReupload(record);
}

async function findOrCreateUbicacion(
  departamento: string,
  ciudad: string,
  distrito: string,
): Promise<number> {
  const existing = await pool.query<{ id: number }>(
    `SELECT id FROM ubicaciones
     WHERE departamento = $1 AND ciudad = $2 AND distrito = $3`,
    [departamento, ciudad, distrito],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await pool.query<{ id: number }>(
    `INSERT INTO ubicaciones (departamento, ciudad, distrito)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [departamento, ciudad, distrito],
  );
  return inserted.rows[0].id;
}

async function findOrCreateColegio(nombre: string, ubicacionId: number): Promise<number> {
  const existing = await pool.query<{ id: number }>(
    `SELECT id FROM colegios WHERE nombre = $1 AND ubicacion_id = $2`,
    [nombre, ubicacionId],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await pool.query<{ id: number }>(
    `INSERT INTO colegios (nombre, ubicacion_id) VALUES ($1, $2) RETURNING id`,
    [nombre, ubicacionId],
  );
  return inserted.rows[0].id;
}

async function findGradoId(gradoLabelStr: string): Promise<number> {
  const { nombre, nivel } = parseGradoLabel(gradoLabelStr);
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM grados WHERE nombre = $1 AND nivel = $2`,
    [nombre, nivel],
  );
  if (!result.rows[0]) throw new Error("GRADO_NOT_FOUND");
  return result.rows[0].id;
}

async function findRetoId(bookId: string, bookTitle: string, gradoId: number): Promise<number> {
  const meta = BOOKS_BY_SLUG[bookId];
  const title = meta?.title ?? bookTitle;

  const result = await pool.query<{ id: number }>(
    `SELECT id FROM retos WHERE titulo_libro = $1 AND grado_id = $2`,
    [title, gradoId],
  );
  if (!result.rows[0]) throw new Error("RETO_NOT_FOUND");
  return result.rows[0].id;
}

export async function createParticipation(
  input: CreateParticipationInput,
): Promise<ParticipationRecord> {
  const existing = await findByDni(input.dni);
  if (existing && !canReupload(existing)) {
    throw new Error("DNI_ALREADY_REGISTERED");
  }

  const gradoId = await findGradoId(input.grado);
  const retoId = await findRetoId(input.bookId, input.bookTitle, gradoId);

  const ubicacionId = input.departamento && input.ciudad && input.distrito
    ? await findOrCreateUbicacion(input.departamento, input.ciudad, input.distrito)
    : (await pool.query<{ id: number }>(`SELECT id FROM ubicaciones LIMIT 1`)).rows[0]?.id;

  if (!ubicacionId) throw new Error("UBICACION_REQUIRED");

  const colegioId = await findOrCreateColegio(input.colegio, ubicacionId);
  const archivoUrl = buildArchivoUrl(input.fileName, input.fileUrl, input.s3Key);
  const tipoArchivo = inferTipoArchivo(input.fileName);
  const nombreCompleto = input.nombreCompleto?.trim() || `Estudiante ${input.dni}`;
  const edad = input.edad ?? 10;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const participante = await client.query<{ id: number }>(
      `INSERT INTO participantes (dni, nombre_completo, edad, colegio_id, grado_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (dni) DO UPDATE SET
         nombre_completo = EXCLUDED.nombre_completo,
         colegio_id = EXCLUDED.colegio_id,
         grado_id = EXCLUDED.grado_id
       RETURNING id`,
      [input.dni, nombreCompleto, edad, colegioId, gradoId],
    );

    await client.query(
      `INSERT INTO trabajos (participante_id, reto_id, archivo_url, tipo_archivo, estado)
       VALUES ($1, $2, $3, $4, 'recibido')
       ON CONFLICT (participante_id) DO UPDATE SET
         reto_id = EXCLUDED.reto_id,
         archivo_url = EXCLUDED.archivo_url,
         tipo_archivo = EXCLUDED.tipo_archivo,
         estado = 'recibido',
         fecha_envio = NOW()`,
      [participante.rows[0].id, retoId, archivoUrl, tipoArchivo],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const record = await findByDni(input.dni);
  if (!record) throw new Error("CREATE_FAILED");
  return record;
}

export async function reuploadFile(
  _dni: string,
  _fileName: string,
  _fileUrl?: string,
  _s3Key?: string,
): Promise<ParticipationRecord | null> {
  return null;
}

export { gradoLabel };
