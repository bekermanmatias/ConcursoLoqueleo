import type { AgeKey } from "../data/books";
import type { Grado } from "../data/locations";

export interface PublicBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  cover: string;
  role: string;
  grade: Grado;
  age: Exclude<AgeKey, "todo">;
  challengeIntro?: string;
  challengeHeadline?: string;
  challenge: string;
  deliverable?: string;
  formats: string[];
  requirements: string[];
  participateNote: string;
  basesPdf?: string;
  tipoReto: string;
}

export interface PublicConcurso {
  codigo: string;
  nombre: string;
  anio: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  inscripcionesAbiertas: boolean;
  terminosPdf: string | null;
}

interface ApiPublicObra {
  slug: string;
  title: string;
  author: string | null;
  cover: string | null;
  role: string | null;
  grade: string;
  age: string;
  tipoReto: string;
  challengeIntro: string | null;
  challengeHeadline: string | null;
  challenge: string | null;
  deliverable: string | null;
  formats: string[];
  requirements: string[];
  participateNote: string | null;
  basesPdf: string | null;
}

const VALID_AGES = new Set(["+6", "+8", "+10", "+12", "+14"]);

function normalizeAge(age: string): PublicBook["age"] {
  return VALID_AGES.has(age) ? (age as PublicBook["age"]) : "+6";
}

export function mapApiObraToBook(obra: ApiPublicObra): PublicBook {
  return {
    id: obra.slug,
    slug: obra.slug,
    title: obra.title,
    author: obra.author ?? "",
    cover: obra.cover ?? "/libro/placeholder.png",
    role: obra.role ?? "",
    grade: obra.grade as Grado,
    age: normalizeAge(obra.age),
    challengeIntro: obra.challengeIntro ?? undefined,
    challengeHeadline: obra.challengeHeadline ?? undefined,
    challenge: obra.challenge ?? "",
    deliverable: obra.deliverable ?? undefined,
    formats: obra.formats ?? [],
    requirements: obra.requirements ?? [],
    participateNote: obra.participateNote ?? "",
    basesPdf: obra.basesPdf ?? undefined,
    tipoReto: obra.tipoReto,
  };
}

export function mapApiObrasToBooks(obras: ApiPublicObra[]): PublicBook[] {
  return obras.map(mapApiObraToBook);
}
