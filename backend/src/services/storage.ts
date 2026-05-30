import { randomUUID } from "node:crypto";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config, isS3Enabled } from "../config.js";

export type FileKind = "pdf" | "video";

export interface PresignInput {
  fileName: string;
  contentType: string;
  fileSize: number;
  bookId: string;
  dni?: string;
}

export interface PresignResult {
  mode: "s3";
  uploadUrl: string;
  fileUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface LocalStorageResult {
  mode: "local";
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.storage.region,
      ...(config.storage.endpoint
        ? {
            endpoint: config.storage.endpoint,
            forcePathStyle: true,
          }
        : {}),
    });
  }
  return s3Client;
}

export function detectFileKind(fileName: string, contentType: string): FileKind | null {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf" || contentType === "application/pdf") return "pdf";
  if (
    [".mp4", ".mov"].includes(ext) ||
    contentType.startsWith("video/")
  ) {
    return "video";
  }
  return null;
}

export function validateFileSize(kind: FileKind, fileSize: number): string | null {
  const limit =
    kind === "pdf" ? config.limits.pdfMaxBytes : config.limits.videoMaxBytes;
  const limitMb = Math.round(limit / (1024 * 1024));

  if (fileSize > limit) {
    return kind === "pdf"
      ? `El PDF supera el límite de ${limitMb} MB.`
      : `El video supera el límite de ${limitMb} MB.`;
  }
  return null;
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function buildObjectKey(input: PresignInput): string {
  const ext = path.extname(input.fileName).toLowerCase() || ".bin";
  const dniPart = input.dni ? sanitizeSegment(input.dni) : "anon";
  const bookPart = sanitizeSegment(input.bookId);
  return `${config.storage.prefix}/${bookPart}/${dniPart}/${randomUUID()}${ext}`;
}

function buildPublicUrl(key: string): string {
  const base = config.storage.publicUrlBase?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  return `https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/${key}`;
}

export async function createUploadTarget(
  input: PresignInput,
): Promise<PresignResult | LocalStorageResult> {
  if (!isS3Enabled()) {
    return { mode: "local" };
  }

  const kind = detectFileKind(input.fileName, input.contentType);
  if (!kind) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const sizeError = validateFileSize(kind, input.fileSize);
  if (sizeError) {
    throw new Error(sizeError);
  }

  const s3Key = buildObjectKey(input);
  const expiresIn = 900;

  const command = new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: s3Key,
    ContentType: input.contentType,
    ContentLength: input.fileSize,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });

  return {
    mode: "s3",
    uploadUrl,
    fileUrl: buildPublicUrl(s3Key),
    s3Key,
    expiresIn,
  };
}
