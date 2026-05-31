import { useState } from "react";
import {
  clearAuthSession,
  getStoredUser,
  type InternalUser,
  type RolUsuario,
} from "../../lib/auth";
import {
  navItemsForRole,
  rolLabels,
  type InternalNavId,
} from "../../data/internal-nav";

interface SidebarProps {
  activeNav: InternalNavId;
  user: InternalUser;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  panelAnio?: number | null;
}

export default function InternalSidebar({
  activeNav,
  user,
  mobileOpen,
  onCloseMobile,
  panelAnio,
}: SidebarProps) {
  const items = navItemsForRole(user.rol);

  const logout = () => {
    clearAuthSession();
    window.location.href = "/interno/login/";
  };

  return (
    <>
      <div
        className={[
          "internal-sidebar-backdrop",
          mobileOpen ? "internal-sidebar-backdrop--open" : "",
        ].join(" ")}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={[
          "internal-sidebar",
          mobileOpen ? "internal-sidebar--open" : "",
        ].join(" ")}
        aria-label="Menú del panel interno"
      >
        <div className="internal-sidebar-head">
          <a href="/" className="internal-sidebar-logo" aria-label="Ir al sitio del concurso">
            <img src="/loqueleo.png" alt="Loqueleo" width="130" height="44" />
          </a>
          <p className="internal-sidebar-eyebrow">
            Panel interno · {panelAnio ?? new Date().getFullYear()}
          </p>
        </div>

        <div className="internal-sidebar-user">
          <p className="internal-sidebar-user-name">{user.nombre}</p>
          <p className="internal-sidebar-user-role">{rolLabels[user.rol]}</p>
        </div>

        <nav className="internal-sidebar-nav">
          <p className="internal-sidebar-nav-label">Opciones</p>
          <ul className="internal-sidebar-nav-list">
            {items.map((item) => {
              const active = item.id === activeNav;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={[
                      "internal-sidebar-link",
                      active ? "internal-sidebar-link--active" : "",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                    onClick={onCloseMobile}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="internal-sidebar-foot">
          <a href="/" className="internal-sidebar-foot-link">
            Sitio del concurso
          </a>
          <button type="button" className="internal-sidebar-logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
