/**
 * Premios del concurso (según bases Soy Loqueleo Digital).
 *
 * Fotos en /public/premios/. Si un bloque no tiene `photo`, se muestra el placeholder.
 */
export type PrizeAudience = "estudiantes" | "docentes" | "colegios";
export type PrizePlaceGroup = "first" | "second";

const prizePhotos = {
  chromebook: "/premios/1 12.png",
  docentes1: "/premios/5 2.png",
  secundariaEstudiantes1: "/premios/5 1.png",
  audifonos: "/premios/4 143.png",
  secundariaEstudiantes2: "/premios/LOQUELEO 1.png",
  parlante: "/premios/6 1.png",
  colegios1: "/premios/Estudiantes 1.° a 6.° grado de Primaria (1) 1.png",
} as const;

export interface PrizeBlock {
  id: string;
  audience: PrizeAudience;
  title: string;
  place: string;
  placeGroup: PrizePlaceGroup;
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

/** Resumen general */
export const prizesOverview = {
  intro:
    "Cada nivel — Primaria y Secundaria — incluye premios de 1.er y 2.° puesto para estudiantes y docentes, además del reconocimiento al colegio del ganador del 1.er puesto.",
  juryNote:
    "La selección de ganadores la realiza el jurado calificador. Santillana contacta a las familias de los estudiantes premiados.",
};

export const prizeSummaryIcons: Record<PrizeAudience, string> = {
  estudiantes: "/premios/estudiantes.png",
  docentes: "/premios/docentes.png",
  colegios: "/premios/colegios.png",
};

export const prizeWinSummaries: Record<
  PrizeAudience,
  { title: string; text: string }
> = {
  estudiantes: {
    title: "Estudiantes",
    text: "En Primaria, el 1.er puesto gana un Chromebook; en Secundaria, una Tablet. El 2.° puesto en general recibe audífonos.",
  },
  docentes: {
    title: "Docentes",
    text: "El docente asesor del 1.er puesto gana una Tablet. El 2.° puesto en docentes recibe un parlante.",
  },
  colegios: {
    title: "Centros educativos",
    text: "El colegio del estudiante ganador del 1.er puesto de su grado recibe trofeo y obras literarias Loqueleo.",
  },
};

const studentHowToWin = (grades: string) =>
  `Deben leer la obra de concurso de su grado, cumplir el reto y subir su trabajo en la web. Se evalúa un 1.er puesto por grado (${grades}).`;

const teacherHowToWin = (grades: string) =>
  `Corresponde al docente registrado como asesor del estudiante que obtenga el 1.er puesto en su grado (${grades}).`;

const schoolHowToWin = (grades: string) =>
  `Corresponde al centro educativo del estudiante ganador del 1.er puesto en su grado (${grades}).`;

const secondStudentHowToWin = (level: string) =>
  `Para estudiantes de ${level} que obtengan el 2.° puesto en la calificación general del concurso.`;

const secondTeacherHowToWin = (level: string) =>
  `Para el docente asesor de ${level} vinculado al proyecto que obtenga el 2.° puesto entre los docentes participantes.`;

export const prizeCategories: PrizeCategory[] = [
  {
    id: "primaria",
    label: "Primaria",
    grades: "1.° a 6.° grado",
    blocks: [
      {
        id: "primaria-estudiantes-1",
        audience: "estudiantes",
        title: "Estudiantes",
        place: "1.er puesto",
        placeGroup: "first",
        howToWin: studentHowToWin("1.° a 6.° de primaria"),
        items: ["Chromebook"],
        photo: prizePhotos.chromebook,
      },
      {
        id: "primaria-estudiantes-2",
        audience: "estudiantes",
        title: "Estudiantes",
        place: "2.° puesto en general",
        placeGroup: "second",
        howToWin: secondStudentHowToWin("primaria"),
        items: ["Audífonos"],
        photo: prizePhotos.audifonos,
      },
      {
        id: "primaria-docentes-1",
        audience: "docentes",
        title: "Docentes",
        place: "1.er puesto",
        placeGroup: "first",
        howToWin: teacherHowToWin("1.° a 6.° de primaria"),
        items: ["Tablet"],
        photo: prizePhotos.docentes1,
      },
      {
        id: "primaria-docentes-2",
        audience: "docentes",
        title: "Docentes",
        place: "2.° puesto",
        placeGroup: "second",
        howToWin: secondTeacherHowToWin("primaria"),
        items: ["Parlante"],
        photo: prizePhotos.parlante,
      },
      {
        id: "primaria-colegios-1",
        audience: "colegios",
        title: "Centros educativos",
        place: "1.er puesto",
        placeGroup: "first",
        howToWin: schoolHowToWin("1.° a 6.° de primaria"),
        items: ["1 trofeo", "40 obras literarias impresas Loqueleo Santillana"],
        photo: prizePhotos.colegios1,
      },
    ],
  },
  {
    id: "secundaria",
    label: "Secundaria",
    grades: "1.° a 5.° grado",
    blocks: [
      {
        id: "secundaria-estudiantes-1",
        audience: "estudiantes",
        title: "Estudiantes",
        place: "1.er puesto",
        placeGroup: "first",
        howToWin: studentHowToWin("1.° a 5.° de secundaria"),
        items: ["Tablet"],
        photo: prizePhotos.secundariaEstudiantes1,
      },
      {
        id: "secundaria-estudiantes-2",
        audience: "estudiantes",
        title: "Estudiantes",
        place: "2.° puesto en general",
        placeGroup: "second",
        howToWin: secondStudentHowToWin("secundaria"),
        items: ["Audífonos"],
        photo: prizePhotos.secundariaEstudiantes2,
      },
      {
        id: "secundaria-docentes-1",
        audience: "docentes",
        title: "Docentes",
        place: "1.er puesto",
        placeGroup: "first",
        howToWin: teacherHowToWin("1.° a 5.° de secundaria"),
        items: ["Tablet"],
        photo: prizePhotos.docentes1,
      },
      {
        id: "secundaria-docentes-2",
        audience: "docentes",
        title: "Docentes",
        place: "2.° puesto",
        placeGroup: "second",
        howToWin: secondTeacherHowToWin("secundaria"),
        items: ["Parlante"],
        photo: prizePhotos.parlante,
      },
      {
        id: "secundaria-colegios-1",
        audience: "colegios",
        title: "Centros educativos",
        place: "1.er puesto",
        placeGroup: "first",
        howToWin: schoolHowToWin("1.° a 5.° de secundaria"),
        items: ["1 trofeo", "40 obras literarias Loqueleo Santillana"],
        photo: prizePhotos.colegios1,
      },
    ],
  },
];
