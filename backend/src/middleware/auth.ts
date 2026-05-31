import type { NextFunction, Request, Response } from "express";
import { findUserById, verifyToken } from "../services/auth.js";
import type { InternalUser, RolUsuario } from "../types/internal.js";

declare global {
  namespace Express {
    interface Request {
      user?: InternalUser;
    }
  }
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Sesión requerida." });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Sesión expirada o inválida." });
    return;
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    res.status(401).json({ error: "Usuario no encontrado." });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Sesión requerida." });
      return;
    }
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ error: "No tienes permiso para esta acción." });
      return;
    }
    next();
  };
}
