import { apiUrl } from "./api";

export interface S3UploadTarget {
  mode: "s3";
  uploadUrl: string;
  fileUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface LocalUploadTarget {
  mode: "local";
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

export type UploadTarget = S3UploadTarget | LocalUploadTarget;

export interface UploadedFileMeta {
  fileName: string;
  fileUrl?: string;
  s3Key?: string;
}

async function requestUploadTarget(
  file: File,
  bookId: string,
  dni?: string,
): Promise<UploadTarget> {
  const response = await fetch(apiUrl("/api/uploads/presign"), {
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

/**
 * Sube el entregable:
 * - modo local → POST multipart al backend (simula S3 con misma clave de objeto)
 * - modo s3 → PUT directo a URL firmada
 */
export async function uploadParticipationFile(
  file: File,
  bookId: string,
  dni?: string,
): Promise<UploadedFileMeta> {
  const target = await requestUploadTarget(file, bookId, dni);

  if (target.mode === "local") {
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(apiUrl(target.uploadUrl), {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const body = (await uploadResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "No se pudo subir el archivo. Intenta otra vez.");
    }

    return {
      fileName: file.name,
      s3Key: target.s3Key,
    };
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
