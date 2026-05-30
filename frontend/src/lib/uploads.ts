const API_BASE = (import.meta.env.PUBLIC_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export interface PresignResponse {
  mode: "s3";
  uploadUrl: string;
  fileUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface LocalUploadResponse {
  mode: "local";
}

export type UploadTarget = PresignResponse | LocalUploadResponse;

export interface UploadedFileMeta {
  fileName: string;
  fileUrl?: string;
  s3Key?: string;
}

async function requestPresign(
  file: File,
  bookId: string,
  dni?: string,
): Promise<UploadTarget> {
  const response = await fetch(`${API_BASE}/api/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
      bookId,
      dni,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "No se pudo preparar la subida del archivo.");
  }

  return response.json() as Promise<UploadTarget>;
}

/** Sube el archivo a S3 si el backend está en modo s3; en local solo devuelve metadatos. */
export async function uploadParticipationFile(
  file: File,
  bookId: string,
  dni?: string,
): Promise<UploadedFileMeta> {
  const target = await requestPresign(file, bookId, dni);

  if (target.mode === "local") {
    return { fileName: file.name };
  }

  const uploadResponse = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("No se pudo subir el archivo. Intenta otra vez.");
  }

  return {
    fileName: file.name,
    fileUrl: target.fileUrl,
    s3Key: target.s3Key,
  };
}
