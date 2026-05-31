import {
  mapApiObraToBook,
  mapApiObrasToBooks,
  type PublicBook,
} from "../types/public-book";

function serverApiBase(): string {
  return (
    process.env.BUILD_API_URL ||
    process.env.API_PROXY_TARGET ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${serverApiBase()}${path}`);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchPublicObrasServer(): Promise<PublicBook[]> {
  const data = await serverFetch<Parameters<typeof mapApiObrasToBooks>[0]>(
    "/api/concurso/activo/obras/",
  );
  return data ? mapApiObrasToBooks(data) : [];
}

export async function fetchPublicObraServer(slug: string): Promise<PublicBook | null> {
  const data = await serverFetch<Parameters<typeof mapApiObraToBook>[0]>(
    `/api/concurso/activo/obras/${encodeURIComponent(slug)}/`,
  );
  return data ? mapApiObraToBook(data) : null;
}

export async function fetchPublicObraSlugsServer(): Promise<string[]> {
  const obras = await fetchPublicObrasServer();
  return obras.map((obra) => obra.slug);
}

interface ApiPublicConcurso {
  codigo: string;
  nombre: string;
  anio: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  inscripcionesAbiertas: boolean;
  terminosPdf: string | null;
}

export async function fetchPublicConcursoServer(): Promise<ApiPublicConcurso | null> {
  return serverFetch<ApiPublicConcurso>("/api/concurso/activo/");
}
