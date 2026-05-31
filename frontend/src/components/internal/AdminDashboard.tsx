import { useEffect, useState } from "react";
import {
  estadoLabels,
  fetchInternalStats,
  fetchInternalUsers,
  type InternalStats,
} from "../../lib/internal-api";
import { getStoredUser, type InternalUser } from "../../lib/auth";
import { useInternalToast } from "../../lib/internal-toast";

export default function AdminDashboard() {
  const { showToast } = useInternalToast();
  const [stats, setStats] = useState<InternalStats | null>(null);
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.rol !== "admin") {
      window.location.href = "/interno/jurado/";
      return;
    }

    const load = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          fetchInternalStats(),
          fetchInternalUsers(),
        ]);
        setStats(statsData);
        setUsers(usersData.items);
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Error al cargar el panel.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [showToast]);

  return (
    <div className="internal-panel">
      <header className="internal-header">
        <div>
          <h1 className="internal-title">Resumen del concurso</h1>
          <p className="internal-subtitle">Métricas generales y usuarios del panel.</p>
        </div>
      </header>

      {loading && <p className="internal-muted">Cargando…</p>}

      {stats && (
        <div className="internal-stats-grid">
          <article className="internal-stat-card">
            <p className="internal-stat-label">Total entregas</p>
            <p className="internal-stat-value">{stats.totalTrabajos}</p>
          </article>
          {(Object.keys(stats.porEstado) as Array<keyof InternalStats["porEstado"]>).map((estado) => (
            <article key={estado} className="internal-stat-card">
              <p className="internal-stat-label">{estadoLabels[estado]}</p>
              <p className="internal-stat-value">{stats.porEstado[estado]}</p>
            </article>
          ))}
        </div>
      )}

      <section className="internal-card internal-card--wide">
        <h2>Usuarios internos</h2>
        <div className="internal-table-wrap">
          <table className="internal-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.nombre}</td>
                  <td>{user.email}</td>
                  <td>{user.rol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="internal-muted internal-mt">
          Creación de usuarios vía API <code>POST /api/internal/usuarios</code> (próximo formulario en UI).
        </p>
      </section>
    </div>
  );
}
