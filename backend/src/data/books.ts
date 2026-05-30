/** Slugs del frontend → metadatos del reto (alineado con frontend/src/data/books.ts) */
export const BOOKS_BY_SLUG: Record<
  string,
  { title: string; gradoNombre: string; gradoNivel: string }
> = {
  "tusuj-6": { title: "Tusuj, un cuy especial", gradoNombre: "1ro", gradoNivel: "primaria" },
  "lonchera-6": { title: "La lonchera mentirosa", gradoNombre: "2do", gradoNivel: "primaria" },
  "revueltos-8": { title: "Libros revueltos", gradoNombre: "3ro", gradoNivel: "primaria" },
  "gallinas-8": {
    title: "Tres gallinas contra un pícaro ladrón",
    gradoNombre: "4to",
    gradoNivel: "primaria",
  },
  "corazon-misha-10": {
    title: "El corazón de Misha",
    gradoNombre: "5to",
    gradoNivel: "primaria",
  },
  "comando-espacial-10": {
    title: "Comando Espacial 2",
    gradoNombre: "6to",
    gradoNivel: "primaria",
  },
  "yute-tocuyo-12": {
    title: "Yute & Tocuyo, El Salto a las Nubes",
    gradoNombre: "1ro",
    gradoNivel: "secundaria",
  },
  "maleta-libertad-12": {
    title: "La maleta de la libertad",
    gradoNombre: "2do",
    gradoNivel: "secundaria",
  },
  "ocho-14": { title: "Ocho segundos", gradoNombre: "3ro", gradoNivel: "secundaria" },
  "levita-14": { title: "La tía Levita", gradoNombre: "4to", gradoNivel: "secundaria" },
  "sol-14": { title: "Sol tan lejos", gradoNombre: "5to", gradoNivel: "secundaria" },
};

export function slugFromBookTitle(title: string): string | null {
  const entry = Object.entries(BOOKS_BY_SLUG).find(([, book]) => book.title === title);
  return entry?.[0] ?? null;
}

export function gradoLabel(nombre: string, nivel: string): string {
  return `${nombre} ${nivel}`;
}

export function parseGradoLabel(label: string): { nombre: string; nivel: string } {
  if (label.includes("secundaria")) {
    return { nombre: label.replace(" secundaria", ""), nivel: "secundaria" };
  }
  return { nombre: label.replace(" primaria", ""), nivel: "primaria" };
}

export function inferTipoArchivo(fileName: string): "pdf" | "mp4" | "imagen" {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["mp4", "mov"].includes(ext)) return "mp4";
  if (["jpg", "jpeg", "png"].includes(ext)) return "imagen";
  return "pdf";
}

export function buildArchivoUrl(
  fileName: string,
  fileUrl?: string,
  s3Key?: string,
): string {
  if (fileUrl) return fileUrl;
  if (s3Key) return s3Key;
  return `local://${fileName}`;
}

export function fileNameFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1] ?? url;
}
