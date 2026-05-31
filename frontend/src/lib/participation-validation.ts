export const PERSON_NAME_MIN_LENGTH = 2;
export const PERSON_NAME_MAX_LENGTH = 128;
const EMAIL_MAX_LENGTH = 255;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_PART_RE = /^[\p{L}\s''\-]+$/u;

export type FileKind = "pdf" | "video" | "audio" | "image";

const KIND_KEYWORDS: Record<FileKind, string[]> = {
  pdf: ["pdf", "documento", "texto"],
  video: ["video", "mp4", "mov"],
  audio: ["audio", "mp3"],
  image: ["jpg", "jpeg", "png", "foto", "imagen"],
};

export function normalizePersonNamePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

type PersonRole = "estudiante" | "apoderado" | "docente";

function roleLabels(role: PersonRole): { who: string; nombres: string; apellidos: string } {
  if (role === "estudiante") {
    return { who: "tu", nombres: "nombre", apellidos: "apellido" };
  }
  if (role === "apoderado") {
    return { who: "de tu apoderado", nombres: "nombre", apellidos: "apellido" };
  }
  return { who: "del docente", nombres: "nombre", apellidos: "apellido" };
}

export function validatePersonNamePart(
  value: string,
  role: PersonRole,
  part: "nombres" | "apellidos",
): string | null {
  const labels = roleLabels(role);
  const normalized = normalizePersonNamePart(value);
  if (!normalized) {
    return part === "nombres"
      ? `Escribe ${labels.who === "tu" ? "tu" : "el"} ${labels.nombres} ${labels.who}.`
      : `Escribe ${labels.who === "tu" ? "tu" : "el"} ${labels.apellidos} ${labels.who}.`;
  }
  if (normalized.length < PERSON_NAME_MIN_LENGTH) {
    return `El ${labels[part]} ${labels.who} debe tener al menos ${PERSON_NAME_MIN_LENGTH} letras.`;
  }
  if (normalized.length > PERSON_NAME_MAX_LENGTH) {
    return `El ${labels[part]} ${labels.who} es demasiado largo.`;
  }
  if (!PERSON_PART_RE.test(normalized)) {
    return `El ${labels[part]} ${labels.who} solo puede incluir letras, espacios, tildes, guiones y apóstrofes.`;
  }
  return null;
}

export function validateDocenteEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Escribe el correo del docente.";
  if (!EMAIL_RE.test(email)) {
    return "Escribe un correo válido del docente (ejemplo: nombre@colegio.edu.pe).";
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    return "El correo del docente es demasiado largo.";
  }
  return null;
}

export function inferFileKind(fileName: string): FileKind | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["mp4", "mov"].includes(ext)) return "video";
  if (ext === "mp3") return "audio";
  if (["jpg", "jpeg", "png"].includes(ext)) return "image";
  return null;
}

export function isFileKindAllowedByFormatos(formatos: string[], kind: FileKind): boolean {
  if (formatos.length === 0) return kind === "pdf" || kind === "video";
  const haystack = formatos.map((f) => f.toLowerCase()).join(" ");
  return KIND_KEYWORDS[kind].some((keyword) => haystack.includes(keyword));
}

export function validateFileForFormatos(fileName: string, formatos: string[]): string | null {
  const kind = inferFileKind(fileName);
  if (!kind) {
    return "Ese formato no está permitido para este reto.";
  }
  if (!isFileKindAllowedByFormatos(formatos, kind)) {
    const permitidos = formatosHintLabel(formatos);
    return `Para este reto solo puedes enviar: ${permitidos}.`;
  }
  return null;
}

export function formatosAcceptAttribute(formatos: string[]): string {
  if (formatos.length === 0) return ".pdf,.mp4,.mov";

  const exts = new Set<string>();
  const haystack = formatos.map((f) => f.toLowerCase()).join(" ");

  if (KIND_KEYWORDS.pdf.some((k) => haystack.includes(k))) exts.add(".pdf");
  if (KIND_KEYWORDS.video.some((k) => haystack.includes(k))) {
    exts.add(".mp4");
    exts.add(".mov");
  }
  if (KIND_KEYWORDS.audio.some((k) => haystack.includes(k))) exts.add(".mp3");
  if (KIND_KEYWORDS.image.some((k) => haystack.includes(k))) {
    exts.add(".jpg");
    exts.add(".jpeg");
    exts.add(".png");
  }

  return exts.size > 0 ? [...exts].join(",") : ".pdf,.mp4,.mov";
}

export function formatosHintLabel(formatos: string[]): string {
  if (formatos.length === 0) return "PDF o video (MP4/MOV)";
  return formatos.join(", ");
}
