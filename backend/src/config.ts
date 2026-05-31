import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config();

const MB = 1024 * 1024;

function requiredInProduction(name: string, value: string | undefined): string {
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error(`Variable requerida en producción: ${name}`);
  }
  return value ?? "";
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://loqueleo:loqueleo@localhost:5432/loqueleo",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4321",
  /** Dominio oficial del concurso (CORS S3, cookies, redirects). */
  appDomain: process.env.APP_DOMAIN ?? "concursope.loqueleo.com",
  storage: {
    /** local = disco del servidor (dev). s3 = carga directa vía presigned URL (AWS/MinIO). */
    mode: (process.env.STORAGE_MODE ?? "local") as "local" | "s3",
    /** Carpeta donde se guardan entregables en modo local. */
    localDir: process.env.STORAGE_LOCAL_DIR ?? path.join(rootDir, "uploads"),
    /** Secreto HMAC para tokens de subida local (presign → POST /file). */
    uploadTokenSecret:
      process.env.UPLOAD_TOKEN_SECRET ?? "dev-upload-secret-change-me",
    bucket: process.env.S3_UPLOAD_BUCKET ?? "",
    region: process.env.AWS_REGION ?? "us-east-1",
    prefix: process.env.S3_UPLOAD_PREFIX ?? "entregables",
    /** Endpoint alternativo (MinIO local o LocalStack). Vacío = AWS estándar. */
    endpoint: process.env.S3_ENDPOINT,
    /** URL pública base para objetos (CloudFront del bucket de entregables). */
    publicUrlBase: process.env.S3_PUBLIC_URL_BASE,
  },
  limits: {
    pdfMaxBytes: Number(process.env.MAX_PDF_BYTES ?? 10 * MB),
    videoMaxBytes: Number(process.env.MAX_VIDEO_BYTES ?? 250 * MB),
  },
  /** Código general del certamen (trabajos.codigo_concurso). */
  codigoConcurso: process.env.CODIGO_CONCURSO ?? "LQL2026",
};

/** Valida configuración mínima para ECS + RDS + S3 en producción. */
export function assertProductionConfig(): void {
  if (config.nodeEnv !== "production") return;

  requiredInProduction("DATABASE_URL", process.env.DATABASE_URL);
  requiredInProduction("CORS_ORIGIN", process.env.CORS_ORIGIN);

  if (config.storage.mode === "s3") {
    requiredInProduction("S3_UPLOAD_BUCKET", config.storage.bucket);
    requiredInProduction("AWS_REGION", config.storage.region);
  } else if (config.nodeEnv === "production") {
    requiredInProduction("UPLOAD_TOKEN_SECRET", process.env.UPLOAD_TOKEN_SECRET);
  }
}

export function isS3Enabled(): boolean {
  return config.storage.mode === "s3" && Boolean(config.storage.bucket);
}
