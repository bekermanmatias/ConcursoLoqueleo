import { Router } from "express";
import {
  listDepartamentos,
  listDistritos,
  listProvincias,
} from "../services/ubigeo.js";

export const ubigeoRouter = Router();

ubigeoRouter.get("/departamentos", async (_req, res) => {
  try {
    const rows = await listDepartamentos();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron cargar los departamentos." });
  }
});

ubigeoRouter.get("/provincias", async (req, res) => {
  const departamentoId = Number(req.query.departamento_id);
  if (!Number.isInteger(departamentoId) || departamentoId <= 0) {
    res.status(400).json({ error: "departamento_id es obligatorio." });
    return;
  }

  try {
    const rows = await listProvincias(departamentoId);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron cargar las provincias." });
  }
});

ubigeoRouter.get("/distritos", async (req, res) => {
  const provinciaId = Number(req.query.provincia_id);
  if (!Number.isInteger(provinciaId) || provinciaId <= 0) {
    res.status(400).json({ error: "provincia_id es obligatorio." });
    return;
  }

  try {
    const rows = await listDistritos(provinciaId);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron cargar los distritos." });
  }
});
