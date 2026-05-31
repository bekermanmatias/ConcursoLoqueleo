import { randomBytes } from "node:crypto";
import { pool } from "../db/pool.js";
import {
  findActiveObraForParticipation,
  findBookSlugByObraTitle,
  getActiveConcursoCodigo,
} from "./concursos.js";
import { assertLocalObjectReady } from "./storage.js";
import {
  buildArchivoUrl,
  inferTipoArchivo,
  parseGradoLabel,
} from "../data/books.js";
import {
  canReupload,
  mapRow,
  type CreateParticipationInput,
  type ParticipationRecord,
} from "../types/participation.js";

const SELECT_JOIN = `
  SELECT
    p.dni_estudiante AS dni,
    p.concursante_nombres,
    p.concursante_apellidos,
    t.codigo_entrega,
    r.nombre_obra,
    c.nombre AS colegio,
    g.nombre AS grado_nombre,
    g.nivel AS grado_nivel,
    u.departamento,
    u.provincia,
    u.distrito,
    t.trabajo_enlace,
    t.tipo_archivo,
    t.estado,
    t.permite_reenvio,
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
  concursante_nombres: string;
  concursante_apellidos: string;
  codigo_entrega: string;
  nombre_obra: string;
  colegio: string;
  grado_nombre: string;
  grado_nivel: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  trabajo_enlace: string;
  tipo_archivo: "pdf" | "mp4" | "imagen";
  estado: "recibido" | "en_revision" | "finalista" | "ganador";
  permite_reenvio: boolean;
  fecha_envio: Date;
  book_slug?: string | null;
}

async function generateCodigoEntrega(): Promise<string> {
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  const codigoConcurso = await getActiveConcursoCodigo();
  return `${codigoConcurso}-${suffix}`;
}

export async function findByDni(dni: string): Promise<ParticipationRecord | null> {
  const result = await pool.query<ParticipationRow>(
    `${SELECT_JOIN} WHERE p.dni_estudiante = $1`,
    [dni],
  );
  if (!result.rows[0]) return null;
  return mapRow({
    ...result.rows[0],
    book_slug: (await findBookSlugByObraTitle(result.rows[0].nombre_obra)) ?? result.rows[0].nombre_obra,
    permite_reenvio: result.rows[0].permite_reenvio,
  });
}

export async function isDniBlocked(dni: string): Promise<boolean> {
  const record = await findByDni(dni);
  if (!record) return false;
  return !canReupload(record);
}

async function findOrCreateUbicacion(
  departamento: string,
  provincia: string,
  distrito: string,
): Promise<number> {
  const existing = await pool.query<{ id: number }>(
    `SELECT id FROM ubicaciones
     WHERE departamento = $1 AND provincia = $2 AND distrito = $3`,
    [departamento, provincia, distrito],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await pool.query<{ id: number }>(
    `INSERT INTO ubicaciones (departamento, provincia, distrito)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [departamento, provincia, distrito],
  );
  return inserted.rows[0].id;
}

async function findOrCreateColegio(
  codigoColegio: string,
  nombre: string,
  ubicacionId: number,
): Promise<number> {
  const byCodigo = await pool.query<{ id: number }>(
    `SELECT id FROM colegios WHERE codigo_colegio = $1`,
    [codigoColegio],
  );
  if (byCodigo.rows[0]) return byCodigo.rows[0].id;

  const inserted = await pool.query<{ id: number }>(
    `INSERT INTO colegios (codigo_colegio, nombre, ubicacion_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [codigoColegio, nombre, ubicacionId],
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

async function findRetoId(bookId: string, bookTitle: string, gradoLabel: string): Promise<number> {
  const obra = await findActiveObraForParticipation(bookId, gradoLabel);
  if (!obra) throw new Error("OBRA_NOT_FOUND");

  const title = obra.nombreObra;
  if (bookTitle.trim() && bookTitle.trim() !== title) {
    throw new Error("OBRA_NOT_FOUND");
  }

  const result = await pool.query<{ id: number }>(
    `SELECT id FROM retos WHERE nombre_obra = $1 AND grado_id = $2`,
    [title, obra.gradoId],
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
  const retoId = await findRetoId(input.bookId, input.bookTitle, input.grado);

  if (!input.departamento || !input.provincia || !input.distrito) {
    throw new Error("UBICACION_REQUIRED");
  }

  const ubicacionId = await findOrCreateUbicacion(
    input.departamento,
    input.provincia,
    input.distrito,
  );

  const colegioId = await findOrCreateColegio(
    input.codigoColegio,
    input.colegio,
    ubicacionId,
  );

  const storageKey = input.s3Key ?? input.fileUrl;
  if (storageKey) {
    await assertLocalObjectReady(storageKey);
  } else if (!input.fileUrl?.startsWith("http")) {
    throw new Error("FILE_NOT_UPLOADED");
  }

  const trabajoEnlace = buildArchivoUrl(input.fileName, input.fileUrl, input.s3Key);
  const tipoArchivo = inferTipoArchivo(input.fileName);
  const codigoEntrega = await generateCodigoEntrega();
  const codigoConcurso = await getActiveConcursoCodigo();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const participante = await client.query<{ id: number }>(
      `INSERT INTO participantes (
        dni_estudiante, concursante_nombres, concursante_apellidos, sexo,
        apoderado_nombres, apoderado_apellidos, dni_apoderado, celular_apoderado,
        docente_nombres, docente_apellidos, email_docente, colegio_id, grado_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (dni_estudiante) DO UPDATE SET
        concursante_nombres = EXCLUDED.concursante_nombres,
        concursante_apellidos = EXCLUDED.concursante_apellidos,
        sexo = EXCLUDED.sexo,
        apoderado_nombres = EXCLUDED.apoderado_nombres,
        apoderado_apellidos = EXCLUDED.apoderado_apellidos,
        dni_apoderado = EXCLUDED.dni_apoderado,
        celular_apoderado = EXCLUDED.celular_apoderado,
        docente_nombres = EXCLUDED.docente_nombres,
        docente_apellidos = EXCLUDED.docente_apellidos,
        email_docente = EXCLUDED.email_docente,
        colegio_id = EXCLUDED.colegio_id,
        grado_id = EXCLUDED.grado_id
      RETURNING id`,
      [
        input.dni,
        input.concursanteNombres,
        input.concursanteApellidos,
        input.sexo,
        input.apoderadoNombres,
        input.apoderadoApellidos,
        input.dniApoderado,
        input.celularApoderado,
        input.docenteNombres,
        input.docenteApellidos,
        input.emailDocente,
        colegioId,
        gradoId,
      ],
    );

    await client.query(
      `INSERT INTO trabajos (
        codigo_concurso, codigo_entrega, participante_id, reto_id,
        trabajo_enlace, tipo_archivo, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, 'recibido')
      ON CONFLICT (participante_id) DO UPDATE SET
        reto_id = EXCLUDED.reto_id,
        trabajo_enlace = EXCLUDED.trabajo_enlace,
        tipo_archivo = EXCLUDED.tipo_archivo,
        estado = 'recibido',
        fecha_envio = NOW()`,
      [
        codigoConcurso,
        codigoEntrega,
        participante.rows[0].id,
        retoId,
        trabajoEnlace,
        tipoArchivo,
      ],
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
  dni: string,
  fileName: string,
  fileUrl?: string,
  s3Key?: string,
): Promise<ParticipationRecord | null> {
  const existing = await findByDni(dni);
  if (!existing || !canReupload(existing)) return null;

  const storageKey = s3Key ?? fileUrl;
  if (storageKey) {
    await assertLocalObjectReady(storageKey);
  } else if (!fileUrl?.startsWith("http")) {
    throw new Error("FILE_NOT_UPLOADED");
  }

  const trabajoEnlace = buildArchivoUrl(fileName, fileUrl, s3Key);
  const tipoArchivo = inferTipoArchivo(fileName);

  await pool.query(
    `UPDATE trabajos t SET
      trabajo_enlace = $2,
      tipo_archivo = $3,
      estado = 'recibido',
      fecha_envio = NOW()
    FROM participantes p
    WHERE t.participante_id = p.id AND p.dni_estudiante = $1`,
    [dni, trabajoEnlace, tipoArchivo],
  );

  return findByDni(dni);
}
