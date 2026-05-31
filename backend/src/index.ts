import cors from "cors";
import express from "express";
import { assertProductionConfig, config, isS3Enabled } from "./config.js";
import { pool } from "./db/pool.js";
import { runMigrations } from "./db/migrate.js";
import { participationsRouter } from "./routes/participations.js";
import { concursoRouter } from "./routes/concurso.js";
import { authRouter } from "./routes/auth.js";
import { internalRouter } from "./routes/internal.js";
import { ubigeoRouter } from "./routes/ubigeo.js";
import { uploadsRouter } from "./routes/uploads.js";
import { ensureStorageReady } from "./services/storage.js";

assertProductionConfig();

const app = express();

const devOrigins = ["http://localhost:8080", "http://localhost:4321"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowed =
        origin === config.corsOrigin ||
        (config.nodeEnv !== "production" && devOrigins.includes(origin));
      callback(null, allowed);
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  let db = "ok";
  try {
    await pool.query("SELECT 1");
  } catch {
    db = "error";
  }

  res.status(db === "ok" ? 200 : 503).json({
    status: db === "ok" ? "ok" : "degraded",
    service: "loqueleo-api",
    environment: config.nodeEnv,
    storage: isS3Enabled() ? "s3" : "local",
    database: db,
  });
});

app.use("/api/uploads", uploadsRouter);
app.use("/api/concurso", concursoRouter);
app.use("/api/auth", authRouter);
app.use("/api/internal", internalRouter);
app.use("/api/ubigeo", ubigeoRouter);
app.use("/api/participations", participationsRouter);

async function start() {
  await runMigrations();
  await ensureStorageReady();
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`API escuchando en 0.0.0.0:${config.port} (${config.nodeEnv})`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
