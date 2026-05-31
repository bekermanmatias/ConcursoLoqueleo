import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "./pool.js";
import { importUbigeoIfNeeded } from "./import-ubigeo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, "../../db");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>(
    "SELECT name FROM schema_migrations ORDER BY name",
  );
  return new Set(result.rows.map((row) => row.name));
}

async function databaseHasCoreSchema(): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'trabajos'
    ) AS exists
  `);
  return Boolean(result.rows[0]?.exists);
}

/** Esquema creado antes de schema_migrations (p. ej. init.sql + migraciones manuales). */
async function isLegacyDatabaseAtHead(): Promise<boolean> {
  const result = await pool.query<{ ready: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'trabajos'
        AND column_name = 'permite_reenvio'
    ) AS ready
  `);
  return Boolean(result.rows[0]?.ready);
}

async function stampMigrations(names: string[]) {
  for (const name of names) {
    await pool.query(
      "INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [name],
    );
  }
}

async function applyMigration(name: string, sql: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
    await client.query("COMMIT");
    console.log(`Migración aplicada: ${name}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function listMigrationFiles(): string[] {
  const migrationsDir = path.join(dbDir, "migrations");
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

async function runSeed() {
  const seedSql = readFileSync(path.join(dbDir, "seed.sql"), "utf8");
  await pool.query(seedSql);
}

export async function runMigrations() {
  await ensureMigrationsTable();

  const migrationFiles = listMigrationFiles();
  const applied = await getAppliedMigrations();

  if (migrationFiles.length === 0) {
    throw new Error("No se encontraron archivos en backend/db/migrations.");
  }

  if (
    applied.size === 0 &&
    (await databaseHasCoreSchema()) &&
    (await isLegacyDatabaseAtHead())
  ) {
    await stampMigrations(migrationFiles);
    console.log(
      "Base de datos existente detectada; migraciones previas marcadas como aplicadas.",
    );
  } else {
    for (const file of migrationFiles) {
      if (applied.has(file)) continue;
      const sql = readFileSync(path.join(dbDir, "migrations", file), "utf8");
      await applyMigration(file, sql);
    }
  }

  await importUbigeoIfNeeded(pool);
  await runSeed();
}

const isDirectRun = process.argv[1]?.includes("migrate");

if (isDirectRun) {
  runMigrations()
    .then(async () => {
      console.log("Base de datos lista.");
      await pool.end();
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exit(1);
    });
}
