import "dotenv/config";

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
    /** local = solo metadatos (dev/Docker). s3 = carga directa vía presigned URL (AWS). */
    mode: (process.env.STORAGE_MODE ?? "local") as "local" | "s3",
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
};

/** Valida configuración mínima para ECS + RDS + S3 en producción. */
export function assertProductionConfig(): void {
  if (config.nodeEnv !== "production") return;

  requiredInProduction("DATABASE_URL", process.env.DATABASE_URL);
  requiredInProduction("CORS_ORIGIN", process.env.CORS_ORIGIN);

  if (config.storage.mode === "s3") {
    requiredInProduction("S3_UPLOAD_BUCKET", config.storage.bucket);
    requiredInProduction("AWS_REGION", config.storage.region);
  }
}

export function isS3Enabled(): boolean {
  return config.storage.mode === "s3" && Boolean(config.storage.bucket);
}
