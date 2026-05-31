import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "./pool.js";
import { importUbigeo } from "./import-ubigeo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, "../../db");

export async function runMigrations() {
  const initSql = readFileSync(path.join(dbDir, "init.sql"), "utf8");
  await pool.query(initSql);

  const migrationsDir = path.join(dbDir, "migrations");
  try {
    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = readFileSync(path.join(migrationsDir, file), "utf8");
      await pool.query(sql);
    }
  } catch {
    // Sin carpeta migrations adicionales
  }

  await importUbigeo(pool);

  const seedSql = readFileSync(path.join(dbDir, "seed.sql"), "utf8");
  await pool.query(seedSql);
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
