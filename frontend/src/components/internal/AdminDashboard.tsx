import { useEffect, useState } from "react";
import {
  estadoLabels,
  fetchInternalStats,
  type EstadoTrabajo,
  type InternalStats,
} from "../../lib/internal-api";
import { getStoredUser } from "../../lib/auth";
import { useInternalToast } from "../../lib/internal-toast";
import EntregasDiariasChart from "./EntregasDiariasChart";

const ESTADO_ORDER: EstadoTrabajo[] = ["recibido", "en_revision", "finalista", "ganador"];

function formatCount(value: number): string {
  return new Intl.NumberFormat("es-PE").format(value);
}

function percentPart(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function DashboardSkeleton() {
  return (
    <div className="internal-dashboard internal-dashboard--loading" aria-hidden="true">
      <div className="internal-dashboard-skeleton internal-dashboard-skeleton--hero" />
      <div className="internal-dashboard__pipeline">
        {ESTADO_ORDER.map((estado) => (
          <div key={estado} className="internal-dashboard-skeleton internal-dashboard-skeleton--pipe" />
        ))}
      </div>
      <div className="internal-dashboard-skeleton internal-dashboard-skeleton--chart" />
    </div>
  );
}

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

  const totalTrabajos = stats?.totalTrabajos ?? 0;

  return (
    <div className="internal-panel internal-dashboard">
      {loading && <DashboardSkeleton />}

      {stats && !loading && (
        <>
          <header className="internal-dashboard-hero" aria-label="Resumen general">
            <div className="internal-dashboard-hero__copy">
              <h1 className="internal-dashboard-hero__title">Dashboard</h1>
              <p className="internal-dashboard-hero__lead">
                Participación y avance del concurso activo.
              </p>
            </div>
            <div className="internal-dashboard-hero__metric">
              <p className="internal-dashboard-hero__metric-label">Participantes con entrega</p>
              <p className="internal-dashboard-hero__metric-value">{formatCount(totalTrabajos)}</p>
            </div>
          </header>

          <section className="internal-dashboard__pipeline" aria-label="Entregas por estado">
            <h2 className="internal-dashboard__section-title">Por estado</h2>
            <div className="internal-dashboard-pipeline">
              {ESTADO_ORDER.map((estado) => {
                const count = stats.porEstado[estado] ?? 0;
                const pct = percentPart(count, totalTrabajos);
                return (
                  <article
                    key={estado}
                    className={`internal-dashboard-pipe internal-dashboard-pipe--${estado}`}
                  >
                    <div className="internal-dashboard-pipe__head">
                      <span className={`internal-badge internal-badge--${estado}`}>
                        {estadoLabels[estado]}
                      </span>
                      <p className="internal-dashboard-pipe__value">{formatCount(count)}</p>
                    </div>
                    <div className="internal-dashboard-pipe__track" aria-hidden="true">
                      <div
                        className="internal-dashboard-pipe__fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="internal-dashboard-pipe__pct">{pct}% del total</p>
                  </article>
                );
              })}
            </div>
          </section>

          <EntregasDiariasChart data={stats.entregasPorDia ?? []} />
        </>
      )}
    </div>
  );
}
