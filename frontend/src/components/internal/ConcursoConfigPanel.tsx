import { useCallback, useEffect, useState } from "react";
import ObraEditModal from "./ObraEditModal";
import {
  activateConcurso,
  createConcurso,
  fetchConcurso,
  fetchConcursos,
  resolveConcursoDocUrl,
  updateConcurso,
  updateConcursoObra,
  uploadConcursoTerminosPdf,
  type ConcursoDetail,
  type ConcursoObra,
  type ConcursoSummary,
} from "../../lib/internal-api";
import { getStoredUser } from "../../lib/auth";
import { formatPeriodo, toDateInputValue } from "../../lib/concurso-format";
import { useInternalToast } from "../../lib/internal-toast";

type View = "list" | "detail";

type FormState = {
  nombre: string;
  anio: string;
  fechaInicio: string;
  fechaFin: string;
  inscripcionesAbiertas: boolean;
};

type CreateFormState = {
  codigo: string;
  nombre: string;
  anio: string;
  fechaInicio: string;
  fechaFin: string;
};

const emptyCreateForm = (): CreateFormState => ({
  codigo: "",
  nombre: "",
  anio: String(new Date().getFullYear() + 1),
  fechaInicio: "",
  fechaFin: "",
});

function concursoEstado(concurso: ConcursoSummary) {
  if (concurso.activo) {
    return { label: "Activo", className: "internal-badge internal-badge--active" };
  }
  if (concurso.inscripcionesAbiertas) {
    return { label: "Preparación", className: "internal-badge internal-badge--prep" };
  }
  return { label: "Archivado", className: "internal-badge internal-badge--archived" };
}

function detailToForm(concurso: ConcursoDetail): FormState {
  return {
    nombre: concurso.nombre,
    anio: String(concurso.anio),
    fechaInicio: toDateInputValue(concurso.fechaInicio),
    fechaFin: toDateInputValue(concurso.fechaFin),
    inscripcionesAbiertas: concurso.inscripcionesAbiertas,
  };
}

export default function ConcursoConfigPanel() {
  const { showToast } = useInternalToast();
  const [view, setView] = useState<View>("list");
  const [concursos, setConcursos] = useState<ConcursoSummary[]>([]);
  const [detail, setDetail] = useState<ConcursoDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [editingObra, setEditingObra] = useState<ConcursoObra | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setConcursos(await fetchConcursos());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar concursos.";
      setLoadError(message);
      setConcursos([]);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const openDetail = async (id: number) => {
    setLoading(true);
    try {
      const data = await fetchConcurso(id);
      setDetail(data);
      setForm(detailToForm(data));
      setView("detail");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo cargar el concurso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user?.rol !== "admin") {
      window.location.href = "/interno/jurado/";
      return;
    }
    void loadList();
  }, [loadList]);

  const backToList = () => {
    setView("list");
    setDetail(null);
    setForm(null);
    void loadList();
  };

  const saveGeneral = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail || !form) return;
    setSaving(true);
    try {
      const updated = await updateConcurso(detail.id, {
        nombre: form.nombre.trim(),
        anio: Number(form.anio),
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
        inscripcionesAbiertas: form.inscripcionesAbiertas,
      });
      setDetail(updated);
      setForm(detailToForm(updated));
      showToast("success", "Concurso actualizado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!detail || detail.activo) return;
    setSaving(true);
    try {
      await activateConcurso(detail.id);
      await openDetail(detail.id);
      showToast("success", "Concurso activado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo activar.");
    } finally {
      setSaving(false);
    }
  };

  const handleTerminosUpload = async (file: File) => {
    if (!detail) return;
    setSaving(true);
    try {
      await uploadConcursoTerminosPdf(detail.id, file);
      await openDetail(detail.id);
      showToast("success", "Términos y condiciones actualizados.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo subir el PDF.");
    } finally {
      setSaving(false);
    }
  };

  const handleObraSaved = (obra: ConcursoObra) => {
    if (!detail) return;
    setDetail({
      ...detail,
      obras: detail.obras.map((item) => (item.id === obra.id ? obra : item)),
    });
    setEditingObra((current) => (current?.id === obra.id ? obra : current));
  };

  const toggleObraActiva = async (obra: ConcursoObra) => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateConcursoObra(detail.id, obra.id, { activo: !obra.activo });
      await openDetail(detail.id);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo actualizar la obra.");
    } finally {
      setSaving(false);
    }
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.codigo.trim() || !createForm.nombre.trim()) {
      showToast("error", "Completa código y nombre.");
      return;
    }
    setSaving(true);
    try {
      const created = await createConcurso({
        codigo: createForm.codigo.trim(),
        nombre: createForm.nombre.trim(),
        anio: Number(createForm.anio),
        fechaInicio: createForm.fechaInicio || null,
        fechaFin: createForm.fechaFin || null,
        inscripcionesAbiertas: false,
      });
      setCreateOpen(false);
      setCreateForm(emptyCreateForm());
      showToast("success", "Edición creada. Se copiaron obras y documentos del concurso activo.");
      await openDetail(created.id);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo crear la edición.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="internal-panel internal-panel--dense">
      <header className="internal-header internal-header--compact internal-header--with-actions">
        <div>
          <h1 className="internal-title">
            {view === "list" ? (
              <>
                Configuración concurso
                <span className="internal-title__meta">
                  {concursos.length} edición{concursos.length === 1 ? "" : "es"}
                </span>
              </>
            ) : (
              detail?.nombre ?? "Concurso"
            )}
          </h1>
          {view === "detail" && detail && (
            <p className="internal-subtitle internal-subtitle--compact">
              {detail.codigo} · {formatPeriodo(detail.fechaInicio, detail.fechaFin)}
            </p>
          )}
          {view === "list" && (
            <p className="internal-subtitle internal-subtitle--compact">
              Gestiona ediciones, fechas, obras y documentos legales del certamen.
            </p>
          )}
        </div>
        <div className="internal-header-actions">
          {view === "detail" ? (
            <button
              type="button"
              className="internal-btn internal-btn--outline"
              onClick={backToList}
            >
              ← Volver
            </button>
          ) : (
            <button
              type="button"
              className="internal-btn internal-btn--primary"
              onClick={() => setCreateOpen(true)}
            >
              Nueva edición
            </button>
          )}
        </div>
      </header>

      {loading && view === "list" && <p className="internal-muted">Cargando…</p>}

      {!loading && loadError && view === "list" && (
        <p className="internal-error">{loadError}</p>
      )}

      {view === "list" && !loading && !loadError && (
        <div className="internal-table-wrap internal-table-wrap--scroll">
          <table className="internal-table internal-table--dense">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Año</th>
                <th>Estado</th>
                <th>Entregas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {concursos.map((concurso) => {
                const estado = concursoEstado(concurso);
                return (
                  <tr key={concurso.id}>
                    <td className="internal-cell-nowrap">{concurso.codigo}</td>
                    <td className="internal-cell-truncate" title={concurso.nombre}>
                      {concurso.nombre}
                    </td>
                    <td className="internal-cell-nowrap">{concurso.anio}</td>
                    <td>
                      <span className={estado.className}>{estado.label}</span>
                    </td>
                    <td className="internal-cell-nowrap">{concurso.totalTrabajos}</td>
                    <td>
                      <button
                        type="button"
                        className="internal-link"
                        onClick={() => void openDetail(concurso.id)}
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === "detail" && detail && form && (
        <div className="internal-concurso-detail">
          <section className="internal-concurso-section">
            <div className="internal-concurso-section__head">
              <h2 className="internal-concurso-section__title">Estado y fechas</h2>
              {!detail.activo && (
                <button
                  type="button"
                  className="internal-btn internal-btn--primary"
                  disabled={saving}
                  onClick={() => void handleActivate()}
                >
                  Activar edición
                </button>
              )}
            </div>

            <form className="internal-concurso-form" onSubmit={(e) => void saveGeneral(e)}>
              <div className="internal-concurso-form__grid">
                <label className="internal-field">
                  <span>Código</span>
                  <input type="text" value={detail.codigo} className="form-field internal-input" disabled />
                </label>
                <label className="internal-field">
                  <span>Nombre</span>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="form-field internal-input"
                    required
                  />
                </label>
                <label className="internal-field">
                  <span>Año</span>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={form.anio}
                    onChange={(e) => setForm({ ...form, anio: e.target.value })}
                    className="form-field internal-input"
                    required
                  />
                </label>
                <label className="internal-field">
                  <span>Inicio de inscripciones</span>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                    className="form-field internal-input"
                  />
                </label>
                <label className="internal-field">
                  <span>Cierre de inscripciones</span>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                    className="form-field internal-input"
                  />
                  <span className="internal-muted internal-concurso-section__hint">
                    Define el contador de la página de inicio (último día, hora Perú).
                  </span>
                </label>
                <label className="internal-field internal-field--checkbox">
                  <input
                    type="checkbox"
                    checked={form.inscripcionesAbiertas}
                    onChange={(e) =>
                      setForm({ ...form, inscripcionesAbiertas: e.target.checked })
                    }
                  />
                  <span>Inscripciones abiertas</span>
                </label>
              </div>
              <div className="internal-concurso-form__actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>

          <section className="internal-concurso-section">
            <h2 className="internal-concurso-section__title">Términos y condiciones</h2>
            <p className="internal-muted internal-concurso-section__hint">
              PDF legal que ven los participantes al inscribirse.
            </p>
            <div className="internal-doc-row">
              {detail.terminosPdf ? (
                <a
                  href={resolveConcursoDocUrl(detail.terminosPdf) ?? "#"}
                  className="internal-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver PDF actual
                </a>
              ) : (
                <span className="internal-muted">Sin documento cargado</span>
              )}
              <label className="internal-btn internal-btn--outline internal-file-btn">
                {saving ? "Subiendo…" : "Subir PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  disabled={saving}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleTerminosUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>

          <section className="internal-concurso-section">
            <h2 className="internal-concurso-section__title">Obras y retos</h2>
            <p className="internal-muted internal-concurso-section__hint">
              Catálogo de libros por grado para esta edición. Persisten en la base de datos.
            </p>
            <div className="internal-table-wrap internal-table-wrap--scroll">
              <table className="internal-table internal-table--dense">
                <thead>
                  <tr>
                    <th>Grado</th>
                    <th>Obra</th>
                    <th>Tipo</th>
                    <th>Detalle</th>
                    <th>Activa</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.obras.map((obra) => (
                    <tr key={obra.id}>
                      <td className="internal-cell-nowrap">{obra.gradoLabel}</td>
                      <td className="internal-cell-truncate" title={obra.nombreObra}>
                        {obra.nombreObra}
                      </td>
                      <td className="internal-cell-nowrap">{obra.tipoReto}</td>
                      <td>
                        <button
                          type="button"
                          className="internal-link"
                          onClick={() => setEditingObra(obra)}
                        >
                          Editar
                        </button>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={obra.activo}
                          disabled={saving}
                          onChange={() => void toggleObraActiva(obra)}
                          aria-label={`Obra activa: ${obra.nombreObra}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="internal-concurso-section internal-concurso-section--stats">
            <h2 className="internal-concurso-section__title">Resumen</h2>
            <div className="internal-stats-grid internal-stats-grid--inline">
              <article className="internal-stat-card">
                <p className="internal-stat-label">Participantes</p>
                <p className="internal-stat-value">{detail.totalParticipantes}</p>
              </article>
              <article className="internal-stat-card">
                <p className="internal-stat-label">Entregas</p>
                <p className="internal-stat-value">{detail.totalTrabajos}</p>
              </article>
            </div>
          </section>
        </div>
      )}

      {editingObra && detail && (
        <ObraEditModal
          concursoId={detail.id}
          obra={editingObra}
          saving={saving}
          onClose={() => setEditingObra(null)}
          onSaved={handleObraSaved}
          onSavingChange={setSaving}
          onError={(message) => showToast("error", message)}
          onSuccess={(message) => showToast("success", message)}
        />
      )}

      {createOpen && (
        <div
          className="internal-modal-backdrop"
          role="presentation"
          onClick={() => !saving && setCreateOpen(false)}
        >
          <div
            className="internal-modal"
            role="dialog"
            aria-labelledby="create-concurso-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-concurso-title" className="internal-modal__title">
              Nueva edición
            </h2>
            <p className="internal-modal__text">
              Se copiarán obras y términos del concurso activo como plantilla.
            </p>
            <form className="internal-user-form" onSubmit={(e) => void submitCreate(e)}>
              <label className="internal-field internal-user-form__field">
                <span>Código</span>
                <input
                  type="text"
                  value={createForm.codigo}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, codigo: e.target.value.toUpperCase() })
                  }
                  className="form-field internal-input"
                  placeholder="LQL2027"
                  required
                />
              </label>
              <label className="internal-field internal-user-form__field">
                <span>Nombre</span>
                <input
                  type="text"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  className="form-field internal-input"
                  required
                />
              </label>
              <label className="internal-field internal-user-form__field">
                <span>Año</span>
                <input
                  type="number"
                  value={createForm.anio}
                  onChange={(e) => setCreateForm({ ...createForm, anio: e.target.value })}
                  className="form-field internal-input"
                  required
                />
              </label>
              <div className="internal-modal__actions">
                <button
                  type="button"
                  className="internal-btn internal-btn--outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Creando…" : "Crear edición"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
