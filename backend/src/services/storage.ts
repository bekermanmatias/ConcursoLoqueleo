import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, open, rename, rm, stat } from "node:fs/promises";
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

const UPLOAD_TOKEN_TTL_SECONDS = 900;

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
  if ([".mp4", ".mov"].includes(ext) || contentType.startsWith("video/")) {
    return "video";
  }
  return null;
}

export function validateFileSize(kind: FileKind, fileSize: number): string | null {
  const limit =
    kind === "pdf" ? config.limits.pdfMaxBytes : config.limits.videoMaxBytes;
  const limitMb = Math.round(limit / (1024 * 1024));

  if (fileSize <= 0) {
    return "El archivo está vacío.";
  }

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

export function buildObjectKey(input: PresignInput): string {
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

function buildUploadToken(
  storageKey: string,
  fileSize: number,
  contentType: string,
  expiresAt: number,
): string {
  const payload = `${storageKey}|${fileSize}|${contentType}|${expiresAt}`;
  const signature = createHmac("sha256", config.storage.uploadTokenSecret)
    .update(payload)
    .digest("hex");
  return `${expiresAt}.${signature}`;
}

export function verifyUploadToken(
  token: string,
  storageKey: string,
  fileSize: number,
  contentType: string,
): boolean {
  const [expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!expiresRaw || !signature || !Number.isFinite(expiresAt)) return false;
  if (Date.now() > expiresAt * 1000) return false;

  const expected = buildUploadToken(storageKey, fileSize, contentType, expiresAt);
  const expectedSig = expected.split(".")[1] ?? "";
  if (expectedSig.length !== signature.length) return false;

  return timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature));
}

export function resolveLocalPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error("INVALID_STORAGE_KEY");
  }

  const root = path.resolve(config.storage.localDir);
  const full = path.resolve(root, normalized);
  if (!full.startsWith(`${root}${path.sep}`) && full !== root) {
    throw new Error("INVALID_STORAGE_KEY");
  }
  return full;
}

export async function ensureStorageReady(): Promise<void> {
  if (isS3Enabled()) return;
  await mkdir(config.storage.localDir, { recursive: true });
}

export async function localObjectExists(storageKey: string): Promise<boolean> {
  try {
    const filePath = resolveLocalPath(storageKey);
    const info = await stat(filePath);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

export async function assertLocalObjectReady(storageKey: string): Promise<void> {
  if (isS3Enabled()) return;
  if (!(await localObjectExists(storageKey))) {
    throw new Error("FILE_NOT_UPLOADED");
  }
}

async function readFileHead(filePath: string, bytes = 16): Promise<Buffer> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function moveIntoStorage(tempPath: string, destination: string): Promise<void> {
  try {
    await rename(tempPath, destination);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EXDEV") throw error;
    await copyFile(tempPath, destination);
    await rm(tempPath, { force: true });
  }
}

export function validateMagicBytes(buffer: Buffer, kind: FileKind): boolean {
  if (kind === "pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (kind === "video") {
    return buffer.length >= 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }
  return false;
}

export async function finalizeLocalUpload(
  storageKey: string,
  tempPath: string,
  declaredSize: number,
  contentType: string,
): Promise<void> {
  const kind = detectFileKind(storageKey, contentType);
  if (!kind) {
    await rm(tempPath, { force: true });
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const sizeError = validateFileSize(kind, declaredSize);
  if (sizeError) {
    await rm(tempPath, { force: true });
    throw new Error(sizeError);
  }

  let actualSize = 0;
  try {
    const info = await stat(tempPath);
    actualSize = info.size;
  } catch {
    throw new Error("UPLOAD_FAILED");
  }

  if (actualSize !== declaredSize) {
    await rm(tempPath, { force: true });
    throw new Error("FILE_SIZE_MISMATCH");
  }

  const head = await readFileHead(tempPath);
  if (!validateMagicBytes(head, kind)) {
    await rm(tempPath, { force: true });
    throw new Error("INVALID_FILE_CONTENT");
  }

  const destination = resolveLocalPath(storageKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await moveIntoStorage(tempPath, destination);
}

export function buildLocalUploadUrl(
  storageKey: string,
  fileSize: number,
  contentType: string,
  expiresIn: number,
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const token = buildUploadToken(storageKey, fileSize, contentType, expiresAt);
  const params = new URLSearchParams({
    storageKey,
    token,
    fileSize: String(fileSize),
    contentType,
  });
  return `/api/uploads/file?${params.toString()}`;
}

export async function createUploadTarget(input: PresignInput): Promise<UploadTarget> {
  const kind = detectFileKind(input.fileName, input.contentType);
  if (!kind) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const sizeError = validateFileSize(kind, input.fileSize);
  if (sizeError) {
    throw new Error(sizeError);
  }

  const s3Key = buildObjectKey(input);
  const expiresIn = UPLOAD_TOKEN_TTL_SECONDS;

  if (!isS3Enabled()) {
    await ensureStorageReady();
    return {
      mode: "local",
      uploadUrl: buildLocalUploadUrl(
        s3Key,
        input.fileSize,
        input.contentType,
        expiresIn,
      ),
      s3Key,
      expiresIn,
    };
  }

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

/** Solo desarrollo: lectura de un objeto local (no expone rutas del SO). */
export function createLocalReadStream(storageKey: string) {
  const filePath = resolveLocalPath(storageKey);
  if (!existsSync(filePath)) return null;
  return createReadStream(filePath);
}

export async function saveConcursoConfigPdf(
  codigoConcurso: string,
  fileName: string,
  tmpPath: string,
): Promise<string> {
  const safeCodigo = sanitizeSegment(codigoConcurso);
  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const relativeDir = path.join("config", safeCodigo);
  const destDir = path.join(config.storage.localDir, relativeDir);
  await mkdir(destDir, { recursive: true });
  const destPath = path.join(destDir, safeName);
  await copyFile(tmpPath, destPath);
  return `local://${relativeDir}/${safeName}`.replace(/\\/g, "/");
}

const COVER_IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export function coverExtensionForMime(mime: string): string | null {
  return COVER_IMAGE_TYPES[mime] ?? null;
}

export async function saveConcursoConfigCoverImage(
  codigoConcurso: string,
  obraId: number,
  tmpPath: string,
  mime: string,
  maxBytes: number,
): Promise<string> {
  const ext = coverExtensionForMime(mime);
  if (!ext) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }

  const info = await stat(tmpPath);
  if (info.size <= 0 || info.size > maxBytes) {
    throw new Error("IMAGE_SIZE_INVALID");
  }

  const head = await readFileHead(tmpPath, 12);
  const valid =
    (mime === "image/png" && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (mime === "image/jpeg" && head[0] === 0xff && head[1] === 0xd8) ||
    (mime === "image/webp" && head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP");

  if (!valid) {
    throw new Error("INVALID_IMAGE_CONTENT");
  }

  const safeCodigo = sanitizeSegment(codigoConcurso);
  const fileName = `cover-${obraId}${ext}`;
  const relativeDir = path.join("config", safeCodigo);
  const destDir = path.join(config.storage.localDir, relativeDir);
  await mkdir(destDir, { recursive: true });
  const destPath = path.join(destDir, fileName);
  await copyFile(tmpPath, destPath);
  return `local://${relativeDir}/${fileName}`.replace(/\\/g, "/");
}
