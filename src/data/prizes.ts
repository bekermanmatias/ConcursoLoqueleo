/**
 * Premios del concurso (según bases Soy Loqueleo Digital).
 *
 * Fotos: asigna `photo` en cada bloque (estudiantes, docentes, colegios).
 * Convención: /premios/fotos/{id}.jpg
 */
export type PrizeAudience = "estudiantes" | "docentes" | "colegios";

export interface PrizeBlock {
  id: string;
  audience: PrizeAudience;
  title: string;
  howToWin: string;
  items: string[];
  photo?: string;
}

export interface PrizeCategory {
  id: "primaria" | "secundaria";
  label: string;
  grades: string;
  blocks: PrizeBlock[];
}

/** Resumen general — sección 2, 3 y 5 de las bases */
export const prizesOverview = {
  intro:
    "Hay un 1.er puesto por grado en Primaria y en Secundaria. Los trabajos los califica un jurado según los criterios del concurso.",
  juryNote:
    "La selección de ganadores la realiza el jurado calificador. Santillana contacta a las familias de los estudiantes premiados.",
};

export const prizeWinSummaries: Record<
  PrizeAudience,
  { title: string; text: string }
> = {
  estudiantes: {
    title: "Estudiantes",
    text: "Participan leyendo la obra de concurso de su grado, cumpliendo el reto y subiendo el trabajo en la web con su apoderado. Si su proyecto obtiene el 1.er puesto de su grado, gana el premio de estudiante.",
  },
  docentes: {
    title: "Docentes",
    text: "En la inscripción se registra el docente que asesoró el trabajo. Si ese proyecto queda en 1.er puesto de su grado, el premio de docente corresponde a quien figura como asesor.",
  },
  colegios: {
    title: "Centros educativos",
    text: "El colegio indicado en la inscripción del estudiante ganador del 1.er puesto de su grado recibe el premio institucional de esa categoría.",
  },
};

const studentHowToWin = (grades: string) =>
  `Deben leer la obra de concurso de su grado, cumplir el reto y subir su trabajo en la web. Se evalúa un 1.er puesto por grado (${grades}).`;

const teacherHowToWin = (grades: string) =>
  `Corresponde al docente registrado como asesor del estudiante que obtenga el 1.er puesto en su grado (${grades}).`;

const schoolHowToWin = (grades: string) =>
  `Corresponde al centro educativo del estudiante ganador del 1.er puesto en su grado (${grades}).`;

export const prizeCategories: PrizeCategory[] = [
  {
    id: "primaria",
    label: "Primaria",
    grades: "1.° a 6.° grado",
    blocks: [
      {
        id: "primaria-estudiantes",
        audience: "estudiantes",
        title: "Estudiantes",
        howToWin: studentHowToWin("1.° a 6.° de primaria"),
        items: [
          "Tablet Lenovo Tab M9 (9\"), con funda y protector",
          "20 obras literarias impresas Loqueleo Santillana",
          "Diploma de reconocimiento",
        ],
      },
      {
        id: "primaria-docentes",
        audience: "docentes",
        title: "Docentes",
        howToWin: teacherHowToWin("1.° a 6.° de primaria"),
        items: [
          "Tablet Lenovo Tab M9 (9\"), con funda y protector",
          "20 obras literarias impresas Loqueleo Santillana",
          "Diploma de reconocimiento",
        ],
      },
      {
        id: "primaria-colegios",
        audience: "colegios",
        title: "Centros educativos",
        howToWin: schoolHowToWin("1.° a 6.° de primaria"),
        items: ["1 trofeo", "40 obras literarias impresas Loqueleo Santillana"],
      },
    ],
  },
  {
    id: "secundaria",
    label: "Secundaria",
    grades: "1.° a 5.° grado",
    blocks: [
      {
        id: "secundaria-estudiantes",
        audience: "estudiantes",
        title: "Estudiantes",
        howToWin: studentHowToWin("1.° a 5.° de secundaria"),
        items: [
          "Tablet Lenovo Tab M9 (9\"), con funda y protector",
          "20 obras literarias Loqueleo Santillana",
          "Diploma de reconocimiento",
        ],
      },
      {
        id: "secundaria-docentes",
        audience: "docentes",
        title: "Docentes",
        howToWin: teacherHowToWin("1.° a 5.° de secundaria"),
        items: [
          "Tablet Lenovo Tab M9 (9\"), con funda y protector",
          "20 obras literarias Loqueleo Santillana",
          "Diploma de reconocimiento",
        ],
      },
      {
        id: "secundaria-colegios",
        audience: "colegios",
        title: "Centros educativos",
        howToWin: schoolHowToWin("1.° a 5.° de secundaria"),
        items: ["1 trofeo", "40 obras literarias Loqueleo Santillana"],
      },
    ],
  },
];
