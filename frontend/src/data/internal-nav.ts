import type { RolUsuario } from "../lib/auth";

export type InternalNavId =
  | "dashboard"
  | "trabajos"
  | "usuarios"
  | "configuracion-concurso";

export interface InternalNavItem {
  id: InternalNavId;
  label: string;
  href: string;
  roles: RolUsuario[];
}

export const internalNavItems: InternalNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/interno/admin/",
    roles: ["admin"],
  },
  {
    id: "trabajos",
    label: "Trabajos recibidos",
    href: "/interno/jurado/",
    roles: ["admin", "jurado"],
  },
  {
    id: "usuarios",
    label: "Usuarios",
    href: "/interno/admin/usuarios/",
    roles: ["admin"],
  },
  {
    id: "configuracion-concurso",
    label: "Configuración concurso",
    href: "/interno/admin/concurso/",
    roles: ["admin"],
  },
];

export function navItemsForRole(rol: RolUsuario): InternalNavItem[] {
  return internalNavItems.filter((item) => item.roles.includes(rol));
}

export const rolLabels: Record<RolUsuario, string> = {
  admin: "Administración",
  jurado: "Jurado",
};
