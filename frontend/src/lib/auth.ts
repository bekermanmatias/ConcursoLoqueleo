const TOKEN_KEY = "loqueleo-internal-token";
const USER_KEY = "loqueleo-internal-user";

export type RolUsuario = "admin" | "jurado";

export interface InternalUser {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export function getAuthToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user: InternalUser): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): InternalUser | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InternalUser;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function homePathForRole(rol: RolUsuario): string {
  return rol === "admin" ? "/interno/admin/" : "/interno/jurado/";
}
