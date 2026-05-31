import { apiUrl } from "./api";

export interface Departamento {
  id: number;
  nombre: string;
  ubigeo: string;
}

export interface Provincia {
  id: number;
  nombre: string;
  ubigeo: string;
  departamento_id: number;
}

export interface Distrito {
  id: number;
  nombre: string;
  ubigeo: string;
  provincia_id: number;
  departamento_id: number;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path));
  if (!response.ok) {
    throw new Error(`Error ${response.status} al cargar ${path}`);
  }
  return response.json() as Promise<T>;
}

export function fetchDepartamentos(): Promise<Departamento[]> {
  return fetchJson<Departamento[]>("/api/ubigeo/departamentos");
}

export function fetchProvincias(departamentoId: number): Promise<Provincia[]> {
  return fetchJson<Provincia[]>(`/api/ubigeo/provincias?departamento_id=${departamentoId}`);
}

export function fetchDistritos(provinciaId: number): Promise<Distrito[]> {
  return fetchJson<Distrito[]>(`/api/ubigeo/distritos?provincia_id=${provinciaId}`);
}

export function toSelectOptions<T extends { id: number; nombre: string }>(
  rows: T[],
): { value: string; label: string }[] {
  return rows.map((row) => ({ value: String(row.id), label: row.nombre }));
}
