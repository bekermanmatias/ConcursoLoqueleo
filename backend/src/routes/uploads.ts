import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { config, isS3Enabled } from "../config.js";
import {
  createUploadTarget,
  ensureStorageReady,
  finalizeLocalUpload,
  verifyUploadToken,
} from "../services/storage.js";

export const uploadsRouter = Router();

const upload = multer({
  dest: path.join(config.storage.localDir, ".tmp"),
  limits: {
    fileSize: config.limits.videoMaxBytes,
    files: 1,
  },
});

uploadsRouter.post("/presign", async (req, res) => {
  const fileName = String(req.body.fileName ?? "").trim();
  const contentType = String(req.body.contentType ?? "").trim();
  const fileSize = Number(req.body.fileSize ?? 0);
  const bookId = String(req.body.bookId ?? "").trim();
  const dni = req.body.dni ? String(req.body.dni).replace(/\D/g, "") : undefined;

  if (!fileName || !contentType || !fileSize || !bookId) {
    res.status(400).json({ error: "Faltan datos del archivo" });
    return;
  }

  try {
    const target = await createUploadTarget({
      fileName,
      contentType,
      fileSize,
      bookId,
      dni,
    });
    res.json(target);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNSUPPORTED_FILE_TYPE") {
        res.status(400).json({ error: "Formato no permitido. Usa PDF o video MP4/MOV." });
        return;
      }
      if (error.message.includes("límite") || error.message.includes("vacío")) {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    throw error;
  }
});

uploadsRouter.post("/file", upload.single("file"), async (req, res) => {
  if (isS3Enabled()) {
    res.status(404).json({ error: "La subida directa al servidor no está activa en modo S3." });
    return;
  }

  await ensureStorageReady();

  const storageKey = String(req.query.storageKey ?? "").trim();
  const token = String(req.query.token ?? "").trim();
  const declaredSize = Number(req.query.fileSize ?? 0);
  const contentType = String(req.query.contentType ?? "").trim();

  if (!storageKey || !token || !declaredSize || !contentType) {
    res.status(400).json({ error: "Faltan parámetros de la subida." });
    return;
  }

  if (!verifyUploadToken(token, storageKey, declaredSize, contentType)) {
    res.status(403).json({ error: "El enlace de subida expiró o no es válido. Vuelve a elegir tu archivo." });
    return;
  }

  if (!req.file?.path) {
    res.status(400).json({ error: "No recibimos ningún archivo." });
    return;
  }

  try {
    await finalizeLocalUpload(storageKey, req.file.path, declaredSize, contentType);
    res.status(201).json({
      ok: true,
      s3Key: storageKey,
      storageKey,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "UNSUPPORTED_FILE_TYPE":
          res.status(400).json({ error: "Formato no permitido. Usa PDF o video MP4/MOV." });
          return;
        case "INVALID_FILE_CONTENT":
          res.status(400).json({
            error: "El contenido del archivo no coincide con el formato declarado.",
          });
          return;
        case "FILE_SIZE_MISMATCH":
          res.status(400).json({
            error: "El tamaño del archivo no coincide con lo declarado. Vuelve a intentarlo.",
          });
          return;
        default:
          if (error.message.includes("límite")) {
            res.status(400).json({ error: error.message });
            return;
          }
      }
    }
    throw error;
  }
});
