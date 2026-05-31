import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import type { AuthTokenPayload, InternalUser, RolUsuario } from "../types/internal.js";

interface UserRow {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: RolUsuario;
}

function mapUser(row: UserRow): InternalUser {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
  };
}

export async function findUserByEmail(email: string): Promise<(InternalUser & { passwordHash: string }) | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, nombre, email, password_hash, rol FROM usuarios_internos WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export async function findUserById(id: number): Promise<InternalUser | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, nombre, email, password_hash, rol FROM usuarios_internos WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  return row ? mapUser(row) : null;
}

export async function verifyLogin(
  email: string,
  password: string,
): Promise<InternalUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
  };
}

export function signToken(user: InternalUser): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    rol: user.rol,
  };
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.tokenTtlSeconds,
  });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    if (typeof payload === "string") return null;
    if (!payload.sub || !payload.email || !payload.rol) return null;
    return {
      sub: Number(payload.sub),
      email: String(payload.email),
      rol: payload.rol as RolUsuario,
    };
  } catch {
    return null;
  }
}

export async function listInternalUsers(): Promise<InternalUser[]> {
  const result = await listInternalUsersPaginated({});
  return result.items;
}

export const USERS_PAGE_SIZE_DEFAULT = 15;
export const USERS_PAGE_SIZE_MAX = 100;

export interface ListInternalUsersOptions {
  q?: string;
  rol?: RolUsuario;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface InternalUsersListResult {
  items: InternalUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function resolveUsersPagination(options: {
  page?: number;
  limit?: number;
  offset?: number;
}): { page: number; limit: number; offset: number } {
  const limit = Math.min(
    Math.max(options.limit ?? USERS_PAGE_SIZE_DEFAULT, 1),
    USERS_PAGE_SIZE_MAX,
  );

  if (options.page !== undefined && options.page >= 1) {
    const page = Math.floor(options.page);
    return { page, limit, offset: (page - 1) * limit };
  }

  const offset = Math.max(options.offset ?? 0, 0);
  const page = Math.floor(offset / limit) + 1;
  return { page, limit, offset };
}

export async function listInternalUsersPaginated(
  options: ListInternalUsersOptions = {},
): Promise<InternalUsersListResult> {
  const { page, limit, offset } = resolveUsersPagination(options);
  const params: unknown[] = [];
  const where: string[] = [];

  if (options.q?.trim()) {
    params.push(`%${options.q.trim()}%`);
    const idx = params.length;
    where.push(`(nombre ILIKE $${idx} OR email ILIKE $${idx})`);
  }

  if (options.rol) {
    params.push(options.rol);
    where.push(`rol = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM usuarios_internos ${whereSql}`,
    params,
  );
  const total = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  const listParams = [...params, limit, offset];
  const result = await pool.query<UserRow>(
    `SELECT id, nombre, email, password_hash, rol
     FROM usuarios_internos
     ${whereSql}
     ORDER BY nombre ASC, id ASC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    items: result.rows.map(mapUser),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function createInternalUser(input: {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}): Promise<InternalUser> {
  const hash = await bcrypt.hash(input.password, 10);
  const result = await pool.query<UserRow>(
    `INSERT INTO usuarios_internos (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, email, password_hash, rol`,
    [input.nombre.trim(), input.email.trim().toLowerCase(), hash, input.rol],
  );
  return mapUser(result.rows[0]);
}

export async function countAdminUsers(): Promise<number> {
  const result = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM usuarios_internos WHERE rol = 'admin'`,
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function countUserEvaluaciones(userId: number): Promise<number> {
  const result = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM evaluaciones WHERE jurado_id = $1`,
    [userId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function updateInternalUser(
  id: number,
  input: {
    nombre?: string;
    email?: string;
    rol?: RolUsuario;
    password?: string;
  },
): Promise<InternalUser | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.nombre !== undefined) {
    fields.push(`nombre = $${index++}`);
    values.push(input.nombre.trim());
  }
  if (input.email !== undefined) {
    fields.push(`email = $${index++}`);
    values.push(input.email.trim().toLowerCase());
  }
  if (input.rol !== undefined) {
    fields.push(`rol = $${index++}`);
    values.push(input.rol);
  }
  if (input.password) {
    const hash = await bcrypt.hash(input.password, 10);
    fields.push(`password_hash = $${index++}`);
    values.push(hash);
  }

  if (fields.length === 0) {
    return findUserById(id);
  }

  values.push(id);
  const result = await pool.query<UserRow>(
    `UPDATE usuarios_internos SET ${fields.join(", ")}
     WHERE id = $${index}
     RETURNING id, nombre, email, password_hash, rol`,
    values,
  );
  const row = result.rows[0];
  return row ? mapUser(row) : null;
}

export type DeleteInternalUserResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function deleteInternalUser(
  id: number,
  actorId: number,
): Promise<DeleteInternalUserResult> {
  if (id === actorId) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta.", status: 400 };
  }

  const user = await findUserById(id);
  if (!user) {
    return { ok: false, error: "Usuario no encontrado.", status: 404 };
  }

  if (user.rol === "admin") {
    const admins = await countAdminUsers();
    if (admins <= 1) {
      return {
        ok: false,
        error: "Debe quedar al menos un administrador.",
        status: 400,
      };
    }
  }

  const evaluaciones = await countUserEvaluaciones(id);
  if (evaluaciones > 0) {
    return {
      ok: false,
      error: "Este usuario tiene evaluaciones registradas y no puede eliminarse.",
      status: 409,
    };
  }

  const result = await pool.query(`DELETE FROM usuarios_internos WHERE id = $1`, [id]);
  if ((result.rowCount ?? 0) === 0) {
    return { ok: false, error: "Usuario no encontrado.", status: 404 };
  }

  return { ok: true };
}
