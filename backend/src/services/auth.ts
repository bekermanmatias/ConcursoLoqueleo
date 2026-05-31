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
  const result = await pool.query<UserRow>(
    `SELECT id, nombre, email, password_hash, rol FROM usuarios_internos ORDER BY nombre`,
  );
  return result.rows.map(mapUser);
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
