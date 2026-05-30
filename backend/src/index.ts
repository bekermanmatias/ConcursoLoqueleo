import cors from "cors";
import express from "express";
import { assertProductionConfig, config, isS3Enabled } from "./config.js";
import { pool } from "./db/pool.js";
import { runMigrations } from "./db/migrate.js";
import { participationsRouter } from "./routes/participations.js";
import { uploadsRouter } from "./routes/uploads.js";

assertProductionConfig();

const app = express();

app.use(cors({ origin: config.corsOrigin }));
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
app.use("/api/participations", participationsRouter);

async function start() {
  await runMigrations();
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`API escuchando en 0.0.0.0:${config.port} (${config.nodeEnv})`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
