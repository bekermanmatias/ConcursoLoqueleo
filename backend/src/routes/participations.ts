import { Router } from "express";
import {
  createParticipation,
  findByDni,
  isDniBlocked,
  reuploadFile,
} from "../services/participations.js";

export const participationsRouter = Router();

function cleanDni(raw: string): string | null {
  const dni = raw.replace(/\D/g, "");
  return dni.length === 8 ? dni : null;
}

participationsRouter.get("/:dni/blocked", async (req, res) => {
  const dni = cleanDni(req.params.dni);
  if (!dni) {
    res.status(400).json({ error: "DNI inválido" });
    return;
  }

  res.json({ blocked: await isDniBlocked(dni) });
});

participationsRouter.get("/:dni", async (req, res) => {
  const dni = cleanDni(req.params.dni);
  if (!dni) {
    res.status(400).json({ error: "DNI inválido" });
    return;
  }

  const record = await findByDni(dni);
  if (!record) {
    res.status(404).json({ error: "No encontrado" });
    return;
  }

  res.json(record);
});

participationsRouter.post("/", async (req, res) => {
  const dni = cleanDni(String(req.body.dni ?? ""));
  const dniApoderado = cleanDni(String(req.body.dniApoderado ?? ""));

  if (!dni) {
    res.status(400).json({ error: "DNI del estudiante inválido" });
    return;
  }
  if (!dniApoderado) {
    res.status(400).json({ error: "DNI del apoderado inválido" });
    return;
  }

  const required = [
    "bookId",
    "bookTitle",
    "colegio",
    "codigoColegio",
    "grado",
    "concursante",
    "sexo",
    "apoderado",
    "celularApoderado",
    "docente",
    "emailDocente",
    "fileName",
  ] as const;

  for (const field of required) {
    if (req.body[field] === undefined || req.body[field] === "") {
      res.status(400).json({ error: `Falta ${field}` });
      return;
    }
  }

  if (!["M", "F"].includes(String(req.body.sexo))) {
    res.status(400).json({ error: "Sexo inválido" });
    return;
  }

  try {
    const record = await createParticipation({
      dni,
      bookId: req.body.bookId,
      bookTitle: req.body.bookTitle,
      colegio: req.body.colegio,
      codigoColegio: String(req.body.codigoColegio),
      grado: req.body.grado,
      departamento: req.body.departamento,
      provincia: req.body.provincia ?? req.body.ciudad,
      distrito: req.body.distrito,
      concursante: String(req.body.concursante).trim(),
      sexo: req.body.sexo,
      apoderado: String(req.body.apoderado).trim(),
      dniApoderado,
      celularApoderado: String(req.body.celularApoderado),
      docente: String(req.body.docente).trim(),
      emailDocente: String(req.body.emailDocente).trim(),
      fileName: req.body.fileName,
      fileUrl: req.body.fileUrl,
      s3Key: req.body.s3Key,
    });
    res.status(201).json(record);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "DNI_ALREADY_REGISTERED":
          res.status(409).json({
            error: "Este DNI ya participó en un reto.",
            code: "DNI_ALREADY_REGISTERED",
          });
          return;
        case "UBICACION_REQUIRED":
          res.status(400).json({
            error: "Completa departamento, provincia y distrito.",
            code: "UBICACION_REQUIRED",
          });
          return;
        case "GRADO_NOT_FOUND":
          res.status(400).json({
            error: "El grado del reto no es válido.",
            code: "GRADO_NOT_FOUND",
          });
          return;
        case "OBRA_NOT_FOUND":
          res.status(400).json({
            error: "El libro o grado seleccionado no está disponible en el concurso activo.",
            code: "OBRA_NOT_FOUND",
          });
          return;
        case "RETO_NOT_FOUND":
          res.status(400).json({
            error: "No encontramos el reto de este libro.",
            code: "RETO_NOT_FOUND",
          });
          return;
        case "FILE_NOT_UPLOADED":
          res.status(400).json({
            error: "Primero sube tu archivo antes de enviar la inscripción.",
            code: "FILE_NOT_UPLOADED",
          });
          return;
      }
    }
    throw error;
  }
});

participationsRouter.patch("/:dni/file", async (req, res) => {
  const dni = cleanDni(req.params.dni);
  const fileName = String(req.body.fileName ?? "").trim();

  if (!dni || !fileName) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const record = await reuploadFile(
    dni,
    fileName,
    req.body.fileUrl ? String(req.body.fileUrl) : undefined,
    req.body.s3Key ? String(req.body.s3Key) : undefined,
  );
  if (!record) {
    res.status(403).json({
      error: "La corrección de archivos estará disponible cuando el jurado habilite un nuevo envío.",
    });
    return;
  }

  res.json(record);
});
