import type { RolUsuario } from "../lib/auth";

export type InternalNavId =
  | "trabajos"
  | "resumen"
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
    id: "trabajos",
    label: "Trabajos recibidos",
    href: "/interno/jurado/",
    roles: ["admin", "jurado"],
  },
  {
    id: "resumen",
    label: "Resumen del concurso",
    href: "/interno/admin/",
    roles: ["admin"],
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
