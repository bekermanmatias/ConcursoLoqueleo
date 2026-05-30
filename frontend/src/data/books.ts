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

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  role: string;
  /** Grado al que corresponde esta obra (orden fijo en el array `books`) */
  grade: Grado;
  age: Exclude<AgeKey, "todo">;
  /** Párrafo breve que introduce el reto (opcional) */
  challengeIntro?: string;
  /** Línea destacada bajo el rol (layout simple del reto) */
  challengeHeadline?: string;
  challenge: string;
  /** Texto del bloque «Entregable» (layout simple) */
  deliverable?: string;
  formats: string[];
  requirements: string[];
  /** Texto humano sobre el registro (sustituye lista de datos genérica) */
  participateNote: string;
  /** PDF de bases/indicaciones completas (descarga directa desde /public) */
  basesPdf?: string;
}

export const ageUiStyles: Record<Exclude<AgeKey, "todo">, { accent: string }> = {
  "+6":  { accent: "#dfcc56" },
  "+8":  { accent: "#7369a9" },
  "+10": { accent: "#dfa24d" },
  "+12": { accent: "#258ad1" },
  "+14": { accent: "#db3f52" },
};

export const books: Book[] = [
  {
    id: "tusuj-6",
    title: "Tusuj, un cuy especial",
    author: "Andrea Paz / Claudia Paz",
    cover: "/libro/1.png",
    role: "Soy un(a) compositor(a).",
    grade: "1ro primaria",
    age: "+6",
    challengeHeadline: "Escribe una rima basada en el cuento y la ilustra.",
    challenge:
      "Escribe una rima basada en «Tusuj, un cuy especial», con cuatro versos, e ilústrala.",
    deliverable:
      "Archivo PDF. Hoja formato A4. Orientación horizontal. Extensión de cuatro (4) versos, con ilustración hecha a mano.",
    formats: ["PDF"],
    requirements: [
      "Solo una participación por estudiante",
      "El PDF debe ser legible y en orientación horizontal (A4)",
      "Cuatro versos con ilustración hecha a mano",
      "Incluye tu nombre, grado y colegio en el archivo o en el formulario de envío",
      "Tu colegio debe estar inscrito en Loqueleo",
    ],
    participateNote:
      "Al participar te pediremos ubicación, colegio, grado, DNI y el archivo de tu trabajo. El formulario toma unos minutos si ya tienes todo a la mano.",
    basesPdf: "/pdf/Bases LQL2026 Tusuj.pdf",
  },
  {
    id: "lonchera-6",
    title: "La lonchera mentirosa",
    author: "Jorge Eslava",
    cover: "/libro/2.png",
    role: "Soy un(a) amigo(a).",
    grade: "2do primaria",
    age: "+6",
    challengeIntro:
      "En el libro hay personajes con personalidades muy distintas. Piensa en cuál te habría gustado conocer de verdad.",
    challenge:
      "Escribe una carta de una página como si le hablaras a ese personaje: preséntate, cuéntale algo de ti y dile por qué quieres ser su amigo o su amiga.",
    formats: ["PDF", "Foto legible de hoja escrita a mano"],
    requirements: [
      "Una carta por participante",
      "Letra clara; si escribes a mano, escanea con buena luz",
      "No más de dos carillas",
      "Firma con tu nombre completo al final",
      "Participa desde un colegio registrado en el concurso",
    ],
    participateNote:
      "Necesitarás datos de tu colegio y tu DNI para completar la inscripción. Luego subes la carta en PDF o como imagen.",
  },
  {
    id: "revueltos-8",
    title: "Libros revueltos",
    author: "Lorenzo Helguero",
    cover: "/libro/3.png",
    role: "Soy un(a) lector(a).",
    grade: "3ro primaria",
    age: "+8",
    challengeIntro:
      "La familia del libro vive entre libros y pantallas. Seguro tú también tienes una escena favorita.",
    challenge:
      "Graba un audio o un video de máximo 3 minutos recomendándole el libro a un compañero que no lo ha leído. Cuéntale qué pasa, sin spoilear el final, y por qué vale la pena.",
    formats: ["Audio MP3", "Video hasta 3 min"],
    requirements: [
      "Una recomendación por estudiante",
      "Menciona al menos un momento que te haya gustado",
      "Habla claro y sin música muy fuerte de fondo",
      "Identifícate con nombre y colegio al empezar",
      "Colegio inscrito en Soy Loqueleo 2026",
    ],
    participateNote:
      "El registro pide departamento, ciudad, distrito, colegio, grado y DNI. El archivo puede ser audio o video según lo que hayas grabado.",
  },
  {
    id: "gallinas-8",
    title: "Tres gallinas contra un pícaro ladrón",
    author: "Vicky Canales",
    cover: "/libro/4.png",
    role: "Soy un(a) reportero(a).",
    grade: "4to primaria",
    age: "+8",
    challengeIntro:
      "Las tres gallinas armaron un plan para atrapar al ladrón. Tú puedes contar otra versión de lo que pasó en el granero.",
    challenge:
      "Redacta una noticia con titular, entradilla y cuerpo: ¿qué robó el pícaro?, ¿cómo reaccionaron las gallinas?, ¿hubo final feliz? Inventa detalles, pero que suene a crónica de verdad.",
    formats: ["PDF", "Documento de texto"],
    requirements: [
      "Una noticia por participante",
      "Titular llamativo y texto ordenado en párrafos",
      "Extensión máxima: dos páginas",
      "Al pie, tu nombre y sección o grado",
      "Desde colegio registrado en Loqueleo",
    ],
    participateNote:
      "Completa el formulario con tus datos escolares y adjunta la noticia en PDF. Revisa ortografía antes de enviar.",
  },
  {
    id: "corazon-misha-10",
    title: "El corazón de Misha",
    author: "Jorge Eslava",
    cover: "/libro/5.png",
    role: "Soy un(a) propagandista.",
    grade: "5to primaria",
    age: "+10",
    challengeIntro:
      "Misha vive una historia intensa en la selva. Piensa qué imagen o frase haría que alguien quiera abrir el libro hoy mismo.",
    challenge:
      "Diseña un afiche digital (como los que ves en el pasillo del colegio) que anuncie el libro. Incluye título, una frase breve y algún elemento visual que represente la historia.",
    formats: ["PDF", "JPG o PNG en buena resolución"],
    requirements: [
      "Un afiche por estudiante",
      "Tamaño mínimo equivalente a una hoja A4",
      "Que se lea el nombre del libro sin forzar la vista",
      "Tu nombre en una esquina",
      "Colegio participante del concurso",
    ],
    participateNote:
      "Guarda el afiche en PDF o imagen y súbelo en el paso final. Antes te pediremos datos de ubicación y colegio.",
  },
  {
    id: "comando-espacial-10",
    title: "Comando Espacial 2",
    author: "Iván Bolaños Gamero",
    cover: "/libro/6.png",
    role: "Soy un(a) inventor(a).",
    grade: "6to primaria",
    age: "+10",
    challengeIntro:
      "El Comando Espacial usa artefactos muy particulares. ¿Y si tu equipo necesitara un invento nuevo para la siguiente misión?",
    challenge:
      "Crea un invento original (dibujo, maqueta en foto o infografía) y explícalo en video de hasta 3 minutos o en un PDF con imágenes: nombre del invento, para qué sirve y cómo se usa.",
    formats: ["Video hasta 3 min", "PDF con esquemas o fotos"],
    requirements: [
      "Un invento por participante",
      "Debe relacionarse con la aventura espacial del libro",
      "Explica con tus palabras, no copies texto del libro",
      "Indica tu nombre y grado en el archivo",
      "Colegio registrado en Loqueleo",
    ],
    participateNote:
      "Puedes filmar la explicación con el celular. Recuerda: este reto es solo para 6.° de primaria y cada estudiante participa una vez.",
  },
  {
    id: "yute-tocuyo-12",
    title: "Yute & Tocuyo, El Salto a las Nubes",
    author: "Rafael Lanfranco",
    cover: "/libro/7.png",
    role: "Soy un(a) escritor(a).",
    grade: "1ro secundaria",
    age: "+12",
    challengeIntro:
      "Yute y Tocuyo se atreven a algo imposible. Tu reto es seguir esa energía y abrir un capítulo nuevo.",
    challenge:
      "Escribe el comienzo de una aventura (entre una y tres páginas) donde los personajes intenten dar un salto a las nubes. Puedes usar a Yute y Tocuyo u otros nombres, pero mantén el espíritu del libro.",
    formats: ["PDF"],
    requirements: [
      "Un relato por estudiante",
      "Entre 1 y 3 páginas, letra tamaño 12",
      "Primera página con título, tu nombre y colegio",
      "Cuídate de copiar párrafos del libro original",
      "Participación válida solo con colegio inscrito",
    ],
    participateNote:
      "Exporta tu texto a PDF antes de subirlo. Si trabajas en Word, revisa que no queden comentarios ni marcas de corrección.",
  },
  {
    id: "maleta-libertad-12",
    title: "La maleta de la libertad",
    author: "Iván Thays",
    cover: "/libro/8.png",
    role: "Soy un(a) fabulador(a).",
    grade: "2do secundaria",
    age: "+12",
    challengeIntro:
      "En la novela, la maleta guarda más que ropa. Si tú armaras la tuya para un viaje importante, ¿qué llevarías?",
    challenge:
      "Cuenta en un relato breve o en un video de hasta 3 minutos qué objetos meterías en tu maleta de la libertad y qué significa cada uno. Puedes ser simbólico: no hace falta que sean cosas reales.",
    formats: ["PDF", "Video hasta 3 min"],
    requirements: [
      "Un trabajo por estudiante",
      "Relaciona tus objetos con la idea de libertad del libro",
      "Video: cámara fija y buen audio",
      "Texto: máximo tres páginas",
      "Colegio inscrito en el concurso",
    ],
    participateNote:
      "Elige el formato con el que te sientas más cómodo. El mismo formulario sirve para texto o video.",
  },
  {
    id: "ocho-14",
    title: "Ocho segundos",
    author: "María Fernanda Heredia",
    cover: "/libro/9.png",
    role: "Soy un(a) booktoker.",
    grade: "3ro secundaria",
    age: "+14",
    challengeIntro:
      "Ocho segundos habla de decisiones que cambian todo en muy poco tiempo. Es un libro ideal para contarlo en voz alta y directo.",
    challenge:
      "Graba un video vertical, estilo recomendación rápida, de máximo 60 segundos. Di de qué trata, qué te enganchó y a quién le regalarías el libro, sin contar el final.",
    formats: ["MP4 vertical", "Máximo 60 segundos"],
    requirements: [
      "Un video por participante",
      "Duración real: hasta 1 minuto",
      "Menciona título y autora al inicio",
      "Evita canciones con copyright; mejor voz sola o sonido ambiente suave",
      "Colegio registrado en Loqueleo",
    ],
    participateNote:
      "Ideal grabarlo con el celular en vertical. Al inscribirte, verifica que el archivo no pese más de 50 MB.",
  },
  {
    id: "levita-14",
    title: "La tía Levita",
    author: "Javier Arévalo",
    cover: "/libro/10.png",
    role: "Soy un(a) periodista.",
    grade: "4to secundaria",
    age: "+14",
    challengeIntro:
      "La tía Levita guarda secretos que el pueblo comenta a media voz. Un buen periodista sabe hacer las preguntas difíciles.",
    challenge:
      "Escribe una entrevista ficticia a Levita o a otro personaje del libro. Mínimo ocho preguntas con respuestas que revelen algo nuevo sobre la historia, en tono de revista o programa de radio.",
    formats: ["PDF"],
    requirements: [
      "Una entrevista por estudiante",
      "Formato claro: pregunta y respuesta",
      "Hasta cuatro páginas en total",
      "Tu nombre al final del documento",
      "Desde institución educativa registrada",
    ],
    participateNote:
      "Puedes inspirarte en el libro, pero las respuestas deben ser tuyas. Sube el PDF en el último paso del registro.",
  },
  {
    id: "sol-14",
    title: "Sol tan lejos",
    author: "Jorge Eslava",
    cover: "/libro/11.png",
    role: "Soy un(a) crítico(a).",
    grade: "5to secundaria",
    age: "+14",
    challengeIntro:
      "Sol tan lejos mezcla memoria, viaje y fotografía. Como crítico literario, tu lectura puede ayudar a otro estudiante a decidir si es su próximo libro.",
    challenge:
      "Escribe una reseña de al menos 200 palabras: de qué va, qué funcionó para ti, qué te dejó con dudas y qué tipo de lector lo disfrutaría más.",
    formats: ["PDF", "Texto en procesador"],
    requirements: [
      "Una reseña por participante",
      "Mínimo 200 palabras, sin contar título ni datos",
      "Opinión propia; no resúmenes copiados de internet",
      "Incluye tu nombre y colegio",
      "Colegio participante del concurso",
    ],
    participateNote:
      "Si ya tienes la reseña en Word, guárdala en PDF. El DNI se usa para evitar inscripciones duplicadas.",
  },
];
