import type { Grado } from "./locations";

export type AgeKey = "todo" | "+6" | "+8" | "+10" | "+12" | "+14";

export interface AgeFilterItem {
  key: AgeKey;
  label: string;
  ring: string;
}

export const ageFilters: AgeFilterItem[] = [
  { key: "todo", label: "Todo",  ring: "var(--color-age-todo)" },
  { key: "+6",   label: "+6",    ring: "var(--color-age-6)"    },
  { key: "+8",   label: "+8",    ring: "var(--color-age-8)"    },
  { key: "+10",  label: "+10",   ring: "var(--color-age-10)"   },
  { key: "+12",  label: "+12",   ring: "var(--color-age-12)"   },
  { key: "+14",  label: "+14",   ring: "var(--color-age-14)"   },
];

/** @deprecated Usa PublicBook desde types/public-book.ts */
export interface Book {
  id: string;
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
}

export const ageUiStyles: Record<Exclude<AgeKey, "todo">, { accent: string }> = {
  "+6":  { accent: "#dfcc56" },
  "+8":  { accent: "#7369a9" },
  "+10": { accent: "#dfa24d" },
  "+12": { accent: "#258ad1" },
  "+14": { accent: "#db3f52" },
};

export const participateNote =
  "Al participar te pediremos ubicación, colegio, datos de tu docente, DNI, datos de tu apoderado y el archivo de tu trabajo. El formulario te tomará unos minutos; te recomendamos tener todo a mano.";
