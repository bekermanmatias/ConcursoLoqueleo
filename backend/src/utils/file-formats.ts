export type FileKind = "pdf" | "video" | "audio" | "image";

const KIND_KEYWORDS: Record<FileKind, string[]> = {
  pdf: ["pdf", "documento", "texto"],
  video: ["video", "mp4", "mov"],
  audio: ["audio", "mp3"],
  image: ["jpg", "jpeg", "png", "foto", "imagen"],
};

export function inferFileKind(fileName: string): FileKind | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["mp4", "mov"].includes(ext)) return "video";
  if (ext === "mp3") return "audio";
  if (["jpg", "jpeg", "png"].includes(ext)) return "image";
  return null;
}

export function isFileKindAllowedByFormatos(formatos: string[], kind: FileKind): boolean {
  if (formatos.length === 0) {
    return kind === "pdf" || kind === "video";
  }
  const haystack = formatos.map((f) => f.toLowerCase()).join(" ");
  return KIND_KEYWORDS[kind].some((keyword) => haystack.includes(keyword));
}

export function assertFileAllowedByFormatos(fileName: string, formatos: string[]): void {
  const kind = inferFileKind(fileName);
  if (!kind) {
    throw new Error("FILE_FORMAT_NOT_ALLOWED");
  }
  if (!isFileKindAllowedByFormatos(formatos, kind)) {
    throw new Error("FILE_FORMAT_NOT_ALLOWED");
  }
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
