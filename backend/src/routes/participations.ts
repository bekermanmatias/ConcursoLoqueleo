import { Router, type NextFunction, type Request, type Response } from "express";
import {
  createParticipation,
  findByDni,
  isDniBlocked,
  reuploadFile,
} from "../services/participations.js";
import { requireDocenteEmail } from "../utils/email.js";
import { requirePersonName } from "../utils/person-name.js";

export const participationsRouter = Router();

type AsyncRoute = (req: Request, res: Response) => Promise<void>;

function asyncRoute(handler: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

function cleanDni(raw: string | string[]): string | null {
  const dni = String(raw).replace(/\D/g, "");
  return dni.length === 8 ? dni : null;
}

participationsRouter.get(
  "/:dni/blocked",
  asyncRoute(async (req, res) => {
    const dni = cleanDni(req.params.dni);
    if (!dni) {
      res.status(400).json({ error: "DNI inv?lido" });
      return;
    }

    res.json({ blocked: await isDniBlocked(dni) });
  }),
);

participationsRouter.get(
  "/:dni",
  asyncRoute(async (req, res) => {
    const dni = cleanDni(req.params.dni);
    if (!dni) {
      res.status(400).json({ error: "DNI inv?lido" });
      return;
    }

    const record = await findByDni(dni);
    if (!record) {
      res.status(404).json({ error: "No encontrado" });
      return;
    }

    res.json(record);
  }),
);

participationsRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const dni = cleanDni(String(req.body.dni ?? ""));
    const dniApoderado = cleanDni(String(req.body.dniApoderado ?? ""));

    if (!dni) {
      res.status(400).json({ error: "DNI del estudiante inv?lido" });
      return;
    }
    if (!dniApoderado) {
      res.status(400).json({ error: "DNI del apoderado inv?lido" });
      return;
    }

    const required = [
      "bookId",
      "bookTitle",
      "colegio",
      "codigoColegio",
      "grado",
      "sexo",
      "celularApoderado",
      "fileName",
    ] as const;

    for (const field of required) {
      if (req.body[field] === undefined || req.body[field] === "") {
        res.status(400).json({ error: `Falta ${field}` });
        return;
      }
    }

    let concursante: { nombres: string; apellidos: string };
    let apoderado: { nombres: string; apellidos: string };
    let docente: { nombres: string; apellidos: string };
    let emailDocente: string;

    try {
      concursante = requirePersonName(
        req.body.concursanteNombres,
        req.body.concursanteApellidos,
        "concursante",
      );
      apoderado = requirePersonName(
        req.body.apoderadoNombres,
        req.body.apoderadoApellidos,
        "apoderado",
      );
      docente = requirePersonName(req.body.docenteNombres, req.body.docenteApellidos, "docente");
      emailDocente = requireDocenteEmail(req.body.emailDocente);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Datos inv?lidos.";
      res.status(400).json({ error: message });
      return;
    }

    if (!["M", "F"].includes(String(req.body.sexo))) {
      res.status(400).json({ error: "Sexo inv?lido" });
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
        concursanteNombres: concursante.nombres,
        concursanteApellidos: concursante.apellidos,
        sexo: req.body.sexo,
        apoderadoNombres: apoderado.nombres,
        apoderadoApellidos: apoderado.apellidos,
        dniApoderado,
        celularApoderado: String(req.body.celularApoderado),
        docenteNombres: docente.nombres,
        docenteApellidos: docente.apellidos,
        emailDocente,
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
              error: "Este DNI ya particip? en un reto.",
              code: "DNI_ALREADY_REGISTERED",
            });
            return;
          case "INSCRIPCIONES_CERRADAS":
            res.status(403).json({
              error: "Las inscripciones est?n cerradas. Ya no es posible enviar trabajos.",
              code: "INSCRIPCIONES_CERRADAS",
            });
            return;
          case "NO_ACTIVE_CONCURSO":
            res.status(503).json({
              error: "El concurso no est? disponible en este momento.",
              code: "NO_ACTIVE_CONCURSO",
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
              error: "El grado del reto no es v?lido.",
              code: "GRADO_NOT_FOUND",
            });
            return;
          case "OBRA_NOT_FOUND":
            res.status(400).json({
              error: "El libro o grado seleccionado no est? disponible en el concurso activo.",
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
              error: "Primero sube tu archivo antes de enviar la inscripci?n.",
              code: "FILE_NOT_UPLOADED",
            });
            return;
          case "FILE_FORMAT_NOT_ALLOWED":
            res.status(400).json({
              error: "El formato del archivo no est? permitido para este reto.",
              code: "FILE_FORMAT_NOT_ALLOWED",
            });
            return;
        }
      }
      throw error;
    }
  }),
);

participationsRouter.patch(
  "/:dni/file",
  asyncRoute(async (req, res) => {
    const dni = cleanDni(req.params.dni);
    const fileName = String(req.body.fileName ?? "").trim();

    if (!dni || !fileName) {
      res.status(400).json({ error: "Datos inv?lidos" });
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
        error: "La correcci?n de archivos estar? disponible cuando el jurado habilite un nuevo env?o.",
      });
      return;
    }

    res.json(record);
  }),
);
