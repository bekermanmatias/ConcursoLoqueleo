import { Router } from "express";
import { createUploadTarget } from "../services/storage.js";

export const uploadsRouter = Router();

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
      if (error.message.includes("límite")) {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    throw error;
  }
});
