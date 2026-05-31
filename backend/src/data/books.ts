/** Utilidades de archivos y grados (sin catálogo estático de obras). */
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
