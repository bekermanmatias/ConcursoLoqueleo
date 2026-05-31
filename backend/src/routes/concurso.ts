import { Router } from "express";
import path from "node:path";
import { createLocalReadStream } from "../services/storage.js";
import {
  getPublicActiveConcurso,
  getPublicObraBySlug,
  isPublicConfigAssetKey,
  listPublicObras,
} from "../services/public-concurso.js";

export const concursoRouter = Router();

function contentTypeForStorageKey(storageKey: string): string {
  const ext = path.extname(storageKey).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/pdf";
}

concursoRouter.get("/activo", async (_req, res) => {
  const concurso = await getPublicActiveConcurso();
  if (!concurso) {
    res.status(404).json({ error: "No hay un concurso activo." });
    return;
  }
  res.json(concurso);
});

concursoRouter.get("/activo/obras", async (_req, res) => {
  const obras = await listPublicObras();
  res.json(obras);
});

concursoRouter.get("/activo/obras/:slug", async (req, res) => {
  const obra = await getPublicObraBySlug(req.params.slug);
  if (!obra) {
    res.status(404).json({ error: "Obra no encontrada." });
    return;
  }
  res.json(obra);
});

concursoRouter.get("/assets", async (req, res) => {
  const raw = String(req.query.path ?? "");
  if (!raw.startsWith("local://")) {
    res.status(400).json({ error: "Ruta inválida." });
    return;
  }
  const storageKey = raw.slice("local://".length);
  if (!isPublicConfigAssetKey(storageKey)) {
    res.status(403).json({ error: "Acceso denegado." });
    return;
  }
  const stream = createLocalReadStream(storageKey);
  if (!stream) {
    res.status(404).json({ error: "Archivo no encontrado." });
    return;
  }
  const contentType = contentTypeForStorageKey(storageKey);
  res.setHeader("Content-Type", contentType);
  if (contentType === "application/pdf") {
    res.setHeader("Content-Disposition", "inline");
  }
  res.setHeader("Cache-Control", "public, max-age=300");
  stream.pipe(res);
});
