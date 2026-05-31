export interface PublicConcurso {
  codigo: string;
  nombre: string;
  anio: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  inscripcionesAbiertas: boolean;
  terminosPdf: string | null;
}

export interface PublicObra {
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
