import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSV_FILES = {
  departamentos: "1_ubigeo_departamentos.csv",
  provincias: "2_ubigeo_provincias.csv",
  distritos: "3_ubigeo_distritos.csv",
} as const;

/** Convierte "LA LIBERTAD" → "La Libertad" para mostrar en el formulario. */
export function formatUbigeoName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/(^|\s|['(/])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}

function resolveDatosDir(): string {
  const dbDir = path.join(__dirname, "../../db");
  const candidates = [
    path.join(__dirname, "../../../datos"),
    "/app/datos",
    path.join(dbDir, "ubigeo"),
    "/app/db/ubigeo",
  ];

  for (const dir of candidates) {
    if (existsSync(path.join(dir, CSV_FILES.departamentos))) {
      return dir;
    }
  }

  throw new Error(
    "No se encontraron los CSV de ubigeo. Colócalos en la carpeta datos/ del repositorio.",
  );
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  fields.push(current.trim());
  return fields;
}

function readCsvRows(filePath: string): string[][] {
  const content = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map(parseCsvLine);
}

async function syncUbicaciones(pool: Pool): Promise<void> {
  await pool.query(`
    INSERT INTO ubicaciones (departamento, provincia, distrito, ubigeo)
    SELECT d.nombre, p.nombre, di.nombre, di.ubigeo
    FROM distritos di
    JOIN provincias p ON p.id = di.provincia_id
    JOIN departamentos d ON d.id = di.departamento_id
    ON CONFLICT (ubigeo) DO UPDATE SET
      departamento = EXCLUDED.departamento,
      provincia = EXCLUDED.provincia,
      distrito = EXCLUDED.distrito
  `);
}

export async function importUbigeo(pool: Pool): Promise<void> {
  const datosDir = resolveDatosDir();

  const deptRows = readCsvRows(path.join(datosDir, CSV_FILES.departamentos));
  const provRows = readCsvRows(path.join(datosDir, CSV_FILES.provincias));
  const distRows = readCsvRows(path.join(datosDir, CSV_FILES.distritos));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const [id, nombreRaw, ubigeo] of deptRows) {
      await client.query(
        `INSERT INTO departamentos (id, nombre, ubigeo) VALUES ($1, $2, $3)`,
        [Number(id), formatUbigeoName(nombreRaw), ubigeo.replace(/"/g, "")],
      );
    }

    for (const [id, nombreRaw, ubigeo, departamentoId] of provRows) {
      await client.query(
        `INSERT INTO provincias (id, nombre, ubigeo, departamento_id) VALUES ($1, $2, $3, $4)`,
        [Number(id), formatUbigeoName(nombreRaw), ubigeo.replace(/"/g, ""), Number(departamentoId)],
      );
    }

    for (const [id, nombreRaw, ubigeo, provinciaId, departamentoId] of distRows) {
      await client.query(
        `INSERT INTO distritos (id, nombre, ubigeo, provincia_id, departamento_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          Number(id),
          formatUbigeoName(nombreRaw),
          ubigeo.replace(/"/g, ""),
          Number(provinciaId),
          Number(departamentoId),
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await syncUbicaciones(pool);

  console.log(
    `Ubigeo importado: ${deptRows.length} departamentos, ${provRows.length} provincias, ${distRows.length} distritos.`,
  );
}
