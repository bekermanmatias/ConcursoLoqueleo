import { pool } from "../db/pool.js";

export interface DepartamentoRow {
  id: number;
  nombre: string;
  ubigeo: string;
}

export interface ProvinciaRow {
  id: number;
  nombre: string;
  ubigeo: string;
  departamento_id: number;
}

export interface DistritoRow {
  id: number;
  nombre: string;
  ubigeo: string;
  provincia_id: number;
  departamento_id: number;
}

export async function listDepartamentos(): Promise<DepartamentoRow[]> {
  const result = await pool.query<DepartamentoRow>(
    `SELECT id, nombre, ubigeo FROM departamentos ORDER BY nombre`,
  );
  return result.rows;
}

export async function listProvincias(departamentoId: number): Promise<ProvinciaRow[]> {
  const result = await pool.query<ProvinciaRow>(
    `SELECT id, nombre, ubigeo, departamento_id
     FROM provincias
     WHERE departamento_id = $1
     ORDER BY nombre`,
    [departamentoId],
  );
  return result.rows;
}

export async function listDistritos(provinciaId: number): Promise<DistritoRow[]> {
  const result = await pool.query<DistritoRow>(
    `SELECT id, nombre, ubigeo, provincia_id, departamento_id
     FROM distritos
     WHERE provincia_id = $1
     ORDER BY nombre`,
    [provinciaId],
  );
  return result.rows;
}

export async function findUbicacionByNames(
  departamento: string,
  provincia: string,
  distrito: string,
): Promise<number | null> {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM ubicaciones
     WHERE departamento = $1 AND provincia = $2 AND distrito = $3`,
    [departamento, provincia, distrito],
  );
  return result.rows[0]?.id ?? null;
}
