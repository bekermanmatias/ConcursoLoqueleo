import type { ConcursoObra } from "../types/internal.js";
import type { PublicConcurso, PublicObra } from "../types/public-concurso.js";
import {
  getActiveConcurso,
  listActiveObras,
  getActiveObraBySlug,
} from "./concursos.js";

export function resolvePublicAssetUrl(stored: string | null): string | null {
  if (!stored) return null;
  if (stored.startsWith("local://")) {
    return `/api/concurso/assets?path=${encodeURIComponent(stored)}`;
  }
  return stored;
}

function mapPublicObra(obra: ConcursoObra): PublicObra | null {
  if (!obra.bookSlug) return null;
  return {
    slug: obra.bookSlug,
    title: obra.nombreObra,
    author: obra.autor,
    cover: resolvePublicAssetUrl(obra.coverUrl),
    role: obra.rol,
    grade: obra.gradoLabel,
    age: obra.edad ?? "+6",
    tipoReto: obra.tipoReto,
    challengeIntro: obra.challengeIntro,
    challengeHeadline: obra.challengeHeadline,
    challenge: obra.descripcionReto,
    deliverable: obra.entregable,
    formats: obra.formatos ?? [],
    requirements: obra.requisitos ?? [],
    participateNote: obra.notaParticipacion,
    basesPdf: resolvePublicAssetUrl(obra.basesPdf),
  };
}

export async function getPublicActiveConcurso(): Promise<PublicConcurso | null> {
  const concurso = await getActiveConcurso();
  if (!concurso) return null;
  return {
    codigo: concurso.codigo,
    nombre: concurso.nombre,
    anio: concurso.anio,
    fechaInicio: concurso.fechaInicio,
    fechaFin: concurso.fechaFin,
    inscripcionesAbiertas: concurso.inscripcionesAbiertas,
    terminosPdf: resolvePublicAssetUrl(concurso.terminosPdf),
  };
}

export async function listPublicObras(): Promise<PublicObra[]> {
  const obras = await listActiveObras();
  return obras
    .map(mapPublicObra)
    .filter((obra): obra is PublicObra => obra !== null);
}

export async function getPublicObraBySlug(slug: string): Promise<PublicObra | null> {
  const obra = await getActiveObraBySlug(slug);
  if (!obra) return null;
  return mapPublicObra(obra);
}

export function isPublicConfigAssetKey(storageKey: string): boolean {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized.startsWith("config/");
}
