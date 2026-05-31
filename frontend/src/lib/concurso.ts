import { apiUrl } from "./api";
import { resolveTermsPdfUrl } from "./legal";
import {
  mapApiObraToBook,
  mapApiObrasToBooks,
  type PublicBook,
  type PublicConcurso,
} from "../types/public-book";

export async function fetchPublicObras(): Promise<PublicBook[]> {
  const response = await fetch(apiUrl("/api/concurso/activo/obras"));
  if (!response.ok) return [];
  const data = (await response.json()) as Parameters<typeof mapApiObrasToBooks>[0];
  return mapApiObrasToBooks(data);
}

export async function fetchPublicObra(slug: string): Promise<PublicBook | null> {
  const response = await fetch(apiUrl(`/api/concurso/activo/obras/${encodeURIComponent(slug)}`));
  if (!response.ok) return null;
  const data = (await response.json()) as Parameters<typeof mapApiObraToBook>[0];
  return mapApiObraToBook(data);
}

export async function fetchPublicConcurso(): Promise<PublicConcurso | null> {
  const response = await fetch(apiUrl("/api/concurso/activo"));
  if (!response.ok) return null;
  const data = (await response.json()) as PublicConcurso;
  return {
    ...data,
    terminosPdf: resolveTermsPdfUrl(data.terminosPdf),
  };
}
