import { Router, type Request } from "express";
import path from "node:path";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  countAdminUsers,
  createInternalUser,
  deleteInternalUser,
  findUserById,
  listInternalUsersPaginated,
  updateInternalUser,
} from "../services/auth.js";
import {
  bulkDeleteTrabajos,
  bulkUpdateTrabajosEstado,
  getInternalStats,
  getTrabajoById,
  getTrabajoDetailForJurado,
  getTrabajoEnlace,
  getTrabajosFilterOptions,
  listTrabajos,
  setPermiteReenvio,
  updateTrabajoEstado,
  upsertEvaluacion,
} from "../services/trabajos.js";
import { createLocalReadStream } from "../services/storage.js";
import type { EstadoTrabajo, RolUsuario } from "../types/internal.js";

export const internalRouter = Router();

internalRouter.use(requireAuth);

const ESTADOS: EstadoTrabajo[] = ["recibido", "en_revision", "finalista", "ganador"];
const TIPOS_ARCHIVO = ["pdf", "mp4", "imagen"] as const;
const EVALUACION_FILTROS = ["pendiente", "evaluado"] as const;

function parseEstado(value: unknown): EstadoTrabajo | null {
  const estado = String(value ?? "");
  return ESTADOS.includes(estado as EstadoTrabajo) ? (estado as EstadoTrabajo) : null;
}

function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseDateParam(value: unknown): string | undefined {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  return raw;
}

function parseListTrabajosQuery(req: Request) {
  const estado = req.query.estado ? parseEstado(req.query.estado) : undefined;
  const tipoArchivoRaw = req.query.tipoArchivo
    ? String(req.query.tipoArchivo)
    : undefined;
  const tipoArchivo = TIPOS_ARCHIVO.includes(tipoArchivoRaw as (typeof TIPOS_ARCHIVO)[number])
    ? (tipoArchivoRaw as (typeof TIPOS_ARCHIVO)[number])
    : undefined;
  const sexoRaw = req.query.sexo ? String(req.query.sexo) : undefined;
  const sexo: "M" | "F" | undefined =
    sexoRaw === "M" || sexoRaw === "F" ? sexoRaw : undefined;
  const evaluacionRaw = req.query.evaluacion
    ? String(req.query.evaluacion)
    : undefined;
  const evaluacion = EVALUACION_FILTROS.includes(
    evaluacionRaw as (typeof EVALUACION_FILTROS)[number],
  )
    ? (evaluacionRaw as (typeof EVALUACION_FILTROS)[number])
    : undefined;

  return {
    estado: estado ?? undefined,
    invalidEstado: Boolean(req.query.estado && !estado),
    q: req.query.q ? String(req.query.q) : undefined,
    gradoId: parseOptionalInt(req.query.gradoId),
    colegioId: parseOptionalInt(req.query.colegioId),
    libro: req.query.libro ? String(req.query.libro) : undefined,
    departamento: req.query.departamento ? String(req.query.departamento) : undefined,
    provincia: req.query.provincia ? String(req.query.provincia) : undefined,
    distrito: req.query.distrito ? String(req.query.distrito) : undefined,
    tipoArchivo,
    sexo,
    fechaDesde: parseDateParam(req.query.fechaDesde),
    fechaHasta: parseDateParam(req.query.fechaHasta),
    evaluacion,
    page: parseOptionalInt(req.query.page),
    limit: parseOptionalInt(req.query.limit),
    offset: parseOptionalInt(req.query.offset),
  };
}

function resolveStorageKey(enlace: string): string {
  if (enlace.startsWith("local://")) return enlace.slice("local://".length);
  if (enlace.startsWith("http://") || enlace.startsWith("https://")) return enlace;
  return enlace;
}

function parseTrabajoIds(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null;
  const ids = [
    ...new Set(
      value
        .map((item) => Number(item))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
  return ids.length === value.length ? ids : null;
}

internalRouter.get("/stats", requireRole("admin"), async (_req, res) => {
  res.json(await getInternalStats());
});

internalRouter.get("/usuarios", requireRole("admin"), async (req, res) => {
  const rolRaw = req.query.rol ? String(req.query.rol) : undefined;
  const rol = rolRaw ? parseRol(rolRaw) : undefined;
  if (rolRaw && !rol) {
    res.status(400).json({ error: "Rol inválido." });
    return;
  }

  const data = await listInternalUsersPaginated({
    q: req.query.q ? String(req.query.q) : undefined,
    rol,
    page: parseOptionalInt(req.query.page),
    limit: parseOptionalInt(req.query.limit),
    offset: parseOptionalInt(req.query.offset),
  });

  res.json(data);
});

internalRouter.post("/usuarios", requireRole("admin"), async (req, res) => {
  const nombre = String(req.body.nombre ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");
  const rol = String(req.body.rol ?? "") as RolUsuario;

  if (!nombre || !email || !password || !["admin", "jurado"].includes(rol)) {
    res.status(400).json({ error: "Datos de usuario inválidos." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    return;
  }

  try {
    const user = await createInternalUser({ nombre, email, password, rol });
    res.status(201).json(user);
  } catch {
    res.status(409).json({ error: "Ya existe un usuario con ese email." });
  }
});

function parseRol(value: unknown): RolUsuario | null {
  const rol = String(value ?? "");
  return rol === "admin" || rol === "jurado" ? rol : null;
}

async function assertCanDemoteAdmin(
  userId: number,
  nextRol: RolUsuario,
): Promise<string | null> {
  if (nextRol === "admin") return null;
  const user = await findUserById(userId);
  if (!user || user.rol !== "admin") return null;
  const admins = await countAdminUsers();
  if (admins <= 1) {
    return "Debe quedar al menos un administrador.";
  }
  return null;
}

internalRouter.patch("/usuarios/:id(\\d+)", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const existing = await findUserById(id);
  if (!existing) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }

  const nombreRaw = req.body.nombre;
  const emailRaw = req.body.email;
  const rolRaw = req.body.rol;
  const passwordRaw = req.body.password;

  const patch: {
    nombre?: string;
    email?: string;
    rol?: RolUsuario;
    password?: string;
  } = {};

  if (nombreRaw !== undefined) {
    const nombre = String(nombreRaw).trim();
    if (!nombre) {
      res.status(400).json({ error: "El nombre es obligatorio." });
      return;
    }
    patch.nombre = nombre;
  }

  if (emailRaw !== undefined) {
    const email = String(emailRaw).trim();
    if (!email) {
      res.status(400).json({ error: "El email es obligatorio." });
      return;
    }
    patch.email = email;
  }

  if (rolRaw !== undefined) {
    const rol = parseRol(rolRaw);
    if (!rol) {
      res.status(400).json({ error: "Rol inválido." });
      return;
    }
    const demoteError = await assertCanDemoteAdmin(id, rol);
    if (demoteError) {
      res.status(400).json({ error: demoteError });
      return;
    }
    patch.rol = rol;
  }

  if (passwordRaw !== undefined && passwordRaw !== null && String(passwordRaw).length > 0) {
    const password = String(passwordRaw);
    if (password.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    patch.password = password;
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No hay cambios para guardar." });
    return;
  }

  try {
    const user = await updateInternalUser(id, patch);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }
    res.json(user);
  } catch {
    res.status(409).json({ error: "Ya existe un usuario con ese email." });
  }
});

internalRouter.delete("/usuarios/:id(\\d+)", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const result = await deleteInternalUser(id, req.user!.id);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(204).send();
});

internalRouter.get("/trabajos/filtros", requireRole("admin", "jurado"), async (_req, res) => {
  res.json(await getTrabajosFilterOptions());
});

internalRouter.get("/trabajos", requireRole("admin", "jurado"), async (req, res) => {
  const query = parseListTrabajosQuery(req);
  if (query.invalidEstado) {
    res.status(400).json({ error: "Estado inválido." });
    return;
  }

  const data = await listTrabajos({
    estado: query.estado,
    q: query.q,
    gradoId: query.gradoId,
    colegioId: query.colegioId,
    libro: query.libro,
    departamento: query.departamento,
    provincia: query.provincia,
    distrito: query.distrito,
    tipoArchivo: query.tipoArchivo,
    sexo: query.sexo,
    fechaDesde: query.fechaDesde,
    fechaHasta: query.fechaHasta,
    evaluacion: query.evaluacion,
    juradoId: query.evaluacion ? req.user!.id : undefined,
    page: query.page,
    limit: query.limit,
    offset: query.offset,
  });

  res.json(data);
});

internalRouter.patch("/trabajos/bulk/estado", requireRole("admin", "jurado"), async (req, res) => {
  const ids = parseTrabajoIds(req.body.ids);
  const estado = parseEstado(req.body.estado);
  if (!ids || !estado) {
    res.status(400).json({ error: "Datos inválidos." });
    return;
  }

  const result = await bulkUpdateTrabajosEstado(ids, estado);
  res.json(result);
});

internalRouter.post("/trabajos/bulk/eliminar", requireRole("admin", "jurado"), async (req, res) => {
  const ids = parseTrabajoIds(req.body.ids);
  const confirmacion = String(req.body.confirmacion ?? "");
  if (!ids) {
    res.status(400).json({ error: "Datos inválidos." });
    return;
  }

  try {
    const result = await bulkDeleteTrabajos(ids, confirmacion);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "CONFIRMATION_REQUIRED") {
      res.status(400).json({ error: 'Debes escribir "ELIMINAR" para confirmar.' });
      return;
    }
    throw error;
  }
});

internalRouter.get("/trabajos/:id(\\d+)", requireRole("admin", "jurado"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const trabajo = await getTrabajoDetailForJurado(id, req.user!.id);

  if (!trabajo) {
    res.status(404).json({ error: "Trabajo no encontrado." });
    return;
  }

  res.json(trabajo);
});

internalRouter.patch("/trabajos/:id(\\d+)/estado", requireRole("admin", "jurado"), async (req, res) => {
  const id = Number(req.params.id);
  const estado = parseEstado(req.body.estado);
  if (!Number.isFinite(id) || !estado) {
    res.status(400).json({ error: "Datos inválidos." });
    return;
  }

  const ok = await updateTrabajoEstado(id, estado);
  if (!ok) {
    res.status(404).json({ error: "Trabajo no encontrado." });
    return;
  }

  const trabajo = await getTrabajoDetailForJurado(id, req.user!.id);
  if (!trabajo) {
    res.status(404).json({ error: "Trabajo no encontrado." });
    return;
  }

  res.json(trabajo);
});

internalRouter.patch(
  "/trabajos/:id(\\d+)/permite-reenvio",
  requireRole("admin", "jurado"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    const ok = await setPermiteReenvio(id, Boolean(req.body.permiteReenvio));
    if (!ok) {
      res.status(404).json({ error: "Trabajo no encontrado." });
      return;
    }

    const trabajo = await getTrabajoDetailForJurado(id, req.user!.id);
    if (!trabajo) {
      res.status(404).json({ error: "Trabajo no encontrado." });
      return;
    }

    res.json(trabajo);
  },
);

internalRouter.post("/trabajos/:id(\\d+)/evaluacion", requireRole("admin", "jurado"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const trabajo = await getTrabajoById(id);
  if (!trabajo) {
    res.status(404).json({ error: "Trabajo no encontrado." });
    return;
  }

  const puntajeRaw = req.body.puntaje;
  const puntaje =
    puntajeRaw === null || puntajeRaw === undefined || puntajeRaw === ""
      ? null
      : Number(puntajeRaw);

  if (puntaje !== null && (!Number.isFinite(puntaje) || puntaje < 0 || puntaje > 100)) {
    res.status(400).json({ error: "El puntaje debe estar entre 0 y 100." });
    return;
  }

  const evaluacion = await upsertEvaluacion({
    trabajoId: id,
    juradoId: req.user!.id,
    puntaje,
    comentarios: req.body.comentarios ? String(req.body.comentarios) : null,
    esDestacado: Boolean(req.body.esDestacado),
  });

  res.json({
    id: evaluacion.id,
    puntaje: evaluacion.puntaje,
    comentarios: evaluacion.comentarios,
    esDestacado: evaluacion.es_destacado,
    fechaEvaluacion: evaluacion.fecha_evaluacion.toISOString(),
  });
});

internalRouter.get("/trabajos/:id(\\d+)/archivo", requireRole("admin", "jurado"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const enlace = await getTrabajoEnlace(id);
  if (!enlace) {
    res.status(404).json({ error: "Trabajo no encontrado." });
    return;
  }

  if (enlace.startsWith("http://") || enlace.startsWith("https://")) {
    res.redirect(enlace);
    return;
  }

  const storageKey = resolveStorageKey(enlace);
  const stream = createLocalReadStream(storageKey);
  if (!stream) {
    res.status(404).json({ error: "Archivo no disponible en el servidor." });
    return;
  }

  const ext = path.extname(storageKey).toLowerCase();
  const contentType =
    ext === ".pdf"
      ? "application/pdf"
      : [".mp4", ".mov"].includes(ext)
        ? "video/mp4"
        : "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `inline; filename="${path.basename(storageKey)}"`);
  stream.pipe(res);
});
