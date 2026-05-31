import { useEffect, useState, type ReactNode } from "react";
import { getAuthToken, getStoredUser, type InternalUser } from "../../lib/auth";
import { fetchActiveConcurso } from "../../lib/internal-api";
import type { InternalNavId } from "../../data/internal-nav";
import InternalSidebar from "./InternalSidebar";
import { InternalToastProvider } from "../../lib/internal-toast";

interface Props {
  activeNav: InternalNavId;
  children: ReactNode;
}

export default function InternalAppShell({ activeNav, children }: Props) {
  const [user, setUser] = useState<InternalUser | null>(null);
  const [panelAnio, setPanelAnio] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    const token = getAuthToken();
    if (!stored || !token) {
      window.location.replace("/interno/login/");
      return;
    }
    setUser(stored);
    void fetchActiveConcurso()
      .then((concurso) => setPanelAnio(concurso.anio))
      .catch(() => setPanelAnio(null));
    setReady(true);
  }, []);

  if (!ready || !user) {
    return (
      <div className="internal-gate">
        <span className="internal-gate-dot" aria-hidden="true" />
        <p className="internal-muted">Un momento…</p>
      </div>
    );
  }

  return (
    <InternalToastProvider>
      <div className="internal-app">
        <InternalSidebar
          activeNav={activeNav}
          user={user}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          panelAnio={panelAnio}
        />

        <div className="internal-main">
          <div className="internal-main-top">
            <button
              type="button"
              className="internal-menu-toggle"
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
          <div className="internal-main-content">{children}</div>
        </div>
      </div>
    </InternalToastProvider>
  );
}
