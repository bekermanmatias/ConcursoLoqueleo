import { useEffect, useState } from "react";
import {
  estadoLabels,
  fetchInternalStats,
  type InternalStats,
} from "../../lib/internal-api";
import { getStoredUser } from "../../lib/auth";
import { useInternalToast } from "../../lib/internal-toast";
import EntregasDiariasChart from "./EntregasDiariasChart";

export default function AdminDashboard() {
  const { showToast } = useInternalToast();
  const [stats, setStats] = useState<InternalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.rol !== "admin") {
      window.location.href = "/interno/jurado/";
      return;
    }

    const load = async () => {
      try {
        const statsData = await fetchInternalStats();
        setStats(statsData);
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Error al cargar el panel.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [showToast]);

  return (
    <div className="internal-panel internal-panel--dense">
      <header className="internal-header internal-header--compact">
        <h1 className="internal-title">Resumen del concurso</h1>
        <p className="internal-subtitle internal-subtitle--compact">
          Cuántos participantes hay y cómo avanza el concurso en tiempo real.
        </p>
      </header>

      {loading && <p className="internal-muted">Cargando…</p>}

      {stats && (
        <>
          <div className="internal-stats-grid">
            <article className="internal-stat-card">
              <p className="internal-stat-label">Participantes</p>
              <p className="internal-stat-value">{stats.totalParticipantes ?? 0}</p>
            </article>
            <article className="internal-stat-card">
              <p className="internal-stat-label">Total entregas</p>
              <p className="internal-stat-value">{stats.totalTrabajos}</p>
            </article>
            {(Object.keys(stats.porEstado) as Array<keyof InternalStats["porEstado"]>).map(
              (estado) => (
                <article key={estado} className="internal-stat-card">
                  <p className="internal-stat-label">{estadoLabels[estado]}</p>
                  <p className="internal-stat-value">{stats.porEstado[estado]}</p>
                </article>
              ),
            )}
          </div>

          <EntregasDiariasChart data={stats.entregasPorDia ?? []} />
        </>
      )}
    </div>
  );
}
