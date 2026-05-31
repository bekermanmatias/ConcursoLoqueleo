import { useEffect, useState, type ReactNode } from "react";
import {
  estadoLabels,
  fetchArchivoBlobUrl,
  fetchTrabajo,
  openTrabajoArchivo,
  saveEvaluacion,
  setTrabajoReenvio,
  updateTrabajoEstado,
  tipoArchivoLabels,
  type EstadoTrabajo,
  type EvaluacionJurado,
  type TrabajoDetail,
} from "../../lib/internal-api";
import { useInternalToast } from "../../lib/internal-toast";

interface Props {
  trabajoId?: number;
}

const ESTADOS: EstadoTrabajo[] = ["recibido", "en_revision", "finalista", "ganador"];

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="internal-detail-group">
      <h3 className="internal-detail-group__title">{title}</h3>
      <dl className="internal-dl internal-dl--compact">{children}</dl>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EvaluacionDetailGroup({
  title,
  puntaje,
  comentarios,
  esDestacado,
  fechaEvaluacion,
}: {
  title: string;
  puntaje: number | null;
  comentarios: string | null;
  esDestacado: boolean;
  fechaEvaluacion: string;
}) {
  return (
    <DetailGroup title={title}>
      <DetailRow
        label="Puntaje"
        value={puntaje !== null ? `${puntaje} / 100` : "—"}
      />
      <DetailRow label="Destacado" value={esDestacado ? "Sí" : "No"} />
      <DetailRow label="Comentarios" value={comentarios?.trim() || "—"} />
      <DetailRow
        label="Evaluado"
        value={new Date(fechaEvaluacion).toLocaleString("es-PE")}
      />
    </DetailGroup>
  );
}

function EvaluacionesPanel({
  evaluaciones,
  evaluacionPropia,
}: {
  evaluaciones?: EvaluacionJurado[];
  evaluacionPropia?: TrabajoDetail["evaluacion"];
}) {
  const items = evaluaciones ?? [];
  const hasOwn = Boolean(evaluacionPropia);
  const isEmpty = items.length === 0 && !hasOwn;

  return (
    <section className="internal-card internal-card--participant" aria-label="Evaluaciones del jurado">
      <h2 className="internal-card__title">Evaluaciones del jurado</h2>

      {isEmpty ? (
        <p className="internal-muted internal-card__hint">
          Ningún jurado ha evaluado este trabajo aún.
        </p>
      ) : (
        <>
          {items.map((ev) => (
            <EvaluacionDetailGroup
              key={ev.id}
              title={ev.juradoNombre}
              puntaje={ev.puntaje}
              comentarios={ev.comentarios}
              esDestacado={ev.esDestacado}
              fechaEvaluacion={ev.fechaEvaluacion}
            />
          ))}
          {evaluacionPropia && (
            <EvaluacionDetailGroup
              title="Tu evaluación"
              puntaje={evaluacionPropia.puntaje}
              comentarios={evaluacionPropia.comentarios}
              esDestacado={evaluacionPropia.esDestacado}
              fechaEvaluacion={evaluacionPropia.fechaEvaluacion}
            />
          )}
        </>
      )}
    </section>
  );
}

function mergeTrabajoDetail(prev: TrabajoDetail, updated: TrabajoDetail): TrabajoDetail {
  return {
    ...updated,
    evaluacion: updated.evaluacion ?? prev.evaluacion,
    evaluacionesOtros: updated.evaluacionesOtros ?? prev.evaluacionesOtros,
  };
}

export default function TrabajoDetailPanel({ trabajoId: trabajoIdProp }: Props) {
  const { showToast } = useInternalToast();
  const [trabajoId, setTrabajoId] = useState<number | null>(
    trabajoIdProp && Number.isFinite(trabajoIdProp) ? trabajoIdProp : null,
  );
  const [trabajo, setTrabajo] = useState<TrabajoDetail | null>(null);
  const [archivoUrl, setArchivoUrl] = useState<string | null>(null);
  const [archivoLoading, setArchivoLoading] = useState(false);
  const [puntaje, setPuntaje] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [destacado, setDestacado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (trabajoId !== null) return;

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    if (!Number.isFinite(id)) {
      setLoadError("ID de trabajo inválido.");
      showToast("error", "ID de trabajo inválido.");
      setLoading(false);
      return;
    }
    setTrabajoId(id);
  }, [trabajoId, showToast]);

  useEffect(() => {
    if (trabajoId === null) return;

    let blobUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      setArchivoUrl(null);
      try {
        const data = await fetchTrabajo(trabajoId);
        if (cancelled) return;

        setTrabajo(data);
        setPuntaje(data.evaluacion?.puntaje?.toString() ?? "");
        setComentarios(data.evaluacion?.comentarios ?? "");
        setDestacado(Boolean(data.evaluacion?.esDestacado));

        setArchivoLoading(true);
        try {
          blobUrl = await fetchArchivoBlobUrl(trabajoId);
          if (!cancelled) setArchivoUrl(blobUrl);
        } catch {
          if (!cancelled) setArchivoUrl(null);
        } finally {
          if (!cancelled) setArchivoLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "No se pudo cargar el trabajo.";
          setLoadError(message);
          showToast("error", message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [trabajoId, showToast]);

  useEffect(() => {
    if (!evalModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setEvalModalOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [evalModalOpen, saving]);

  const refresh = async () => {
    if (trabajoId === null) return;
    const data = await fetchTrabajo(trabajoId);
    setTrabajo(data);
  };

  const changeEstado = async (estado: EstadoTrabajo) => {
    if (trabajoId === null || !trabajo || trabajo.estado === estado) return;
    setSaving(true);
    try {
      const updated = await updateTrabajoEstado(trabajoId, estado);
      setTrabajo((prev) => (prev ? mergeTrabajoDetail(prev, updated) : updated));
      showToast("success", `Estado actualizado a ${estadoLabels[estado]}.`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    } finally {
      setSaving(false);
    }
  };

  const toggleReenvio = async () => {
    if (!trabajo || trabajoId === null) return;
    setSaving(true);
    try {
      const updated = await setTrabajoReenvio(trabajoId, !trabajo.permiteReenvio);
      setTrabajo((prev) => (prev ? mergeTrabajoDetail(prev, updated) : updated));
      showToast(
        "success",
        updated.permiteReenvio ? "Reenvío habilitado." : "Reenvío deshabilitado.",
      );
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo cambiar el reenvío.");
    } finally {
      setSaving(false);
    }
  };

  const submitEvaluacion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (trabajoId === null) return;
    setSaving(true);
    try {
      await saveEvaluacion(trabajoId, {
        puntaje: puntaje === "" ? null : Number(puntaje),
        comentarios,
        esDestacado: destacado,
      });
      await refresh();
      setEvalModalOpen(false);
      showToast("success", "Evaluación guardada.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo guardar la evaluación.");
    } finally {
      setSaving(false);
    }
  };

  const openEvalModal = () => {
    if (!trabajo) return;
    setPuntaje(trabajo.evaluacion?.puntaje?.toString() ?? "");
    setComentarios(trabajo.evaluacion?.comentarios ?? "");
    setDestacado(Boolean(trabajo.evaluacion?.esDestacado));
    setEvalModalOpen(true);
  };

  const closeEvalModal = () => {
    if (saving) return;
    setEvalModalOpen(false);
  };

  const openArchivo = async () => {
    if (trabajoId === null) return;
    try {
      await openTrabajoArchivo(trabajoId);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo abrir el archivo.");
    }
  };

  if (loading) {
    return (
      <div className="internal-panel internal-detail-loading">
        <div className="internal-detail-skeleton internal-detail-skeleton--header" />
        <div className="internal-detail-layout">
          <div className="internal-detail-skeleton internal-detail-skeleton--card" />
          <div className="internal-detail-skeleton internal-detail-skeleton--card-sm" />
          <div className="internal-detail-skeleton internal-detail-skeleton--file" />
        </div>
      </div>
    );
  }

  if (!trabajo) {
    return (
      <div className="internal-panel">
        <a href="/interno/jurado/" className="internal-back">
          ← Volver al listado
        </a>
        <p className="internal-muted">{loadError || "Trabajo no encontrado."}</p>
      </div>
    );
  }

  const ubicacion =
    [trabajo.distrito, trabajo.provincia, trabajo.departamento].filter(Boolean).join(", ") || "—";

  return (
    <div className="internal-panel internal-detail">
      <header className="internal-detail-header">
        <a href="/interno/jurado/" className="internal-back">
          ← Volver al listado
        </a>
        <div className="internal-detail-header__row">
          <div>
            <h1 className="internal-title">{trabajo.concursante}</h1>
            <p className="internal-detail-header__meta">
              {trabajo.codigoEntrega} · {trabajo.grado} ·{" "}
              {new Date(trabajo.fechaEnvio).toLocaleDateString("es-PE")}
            </p>
          </div>
          <div className="internal-detail-toolbar">
            <button
              type="button"
              className="internal-btn internal-btn--primary internal-eval-trigger"
              onClick={openEvalModal}
            >
              {trabajo.evaluacion ? "Editar evaluación" : "Evaluar"}
              {(trabajo.evaluacionesOtros?.length ?? 0) > 0 && (
                <span className="internal-eval-trigger__count">
                  {trabajo.evaluacionesOtros!.length}
                </span>
              )}
            </button>
            <label className="internal-detail-toolbar__field">
              <span className="sr-only">Estado</span>
              <select
                value={trabajo.estado}
                disabled={saving}
                onChange={(e) => void changeEstado(e.target.value as EstadoTrabajo)}
                className={`internal-estado-select internal-estado-select--${trabajo.estado}`}
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estadoLabels[estado]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`internal-pill-toggle${trabajo.permiteReenvio ? " internal-pill-toggle--on" : ""}`}
              disabled={saving}
              onClick={() => void toggleReenvio()}
            >
              {trabajo.permiteReenvio ? "Reenvío activo" : "Permitir reenvío"}
            </button>
          </div>
        </div>
      </header>

      <div className="internal-detail-layout">
        <section className="internal-card internal-card--participant">
          <h2 className="internal-card__title">Datos del participante</h2>

          <DetailGroup title="Entrega">
            <DetailRow label="Libro / reto" value={trabajo.bookTitle} />
            <DetailRow label="DNI" value={trabajo.dni} />
            <DetailRow label="Sexo" value={trabajo.sexo === "F" ? "Femenino" : "Masculino"} />
            <DetailRow
              label="Enviado"
              value={new Date(trabajo.fechaEnvio).toLocaleString("es-PE")}
            />
          </DetailGroup>

          <DetailGroup title="Colegio">
            <DetailRow label="Institución" value={trabajo.colegio} />
            <DetailRow label="Grado" value={trabajo.grado} />
            <DetailRow label="Ubicación" value={ubicacion} />
          </DetailGroup>

          <DetailGroup title="Apoderado">
            <DetailRow label="Nombre" value={trabajo.apoderado} />
            <DetailRow label="DNI" value={trabajo.dniApoderado} />
            <DetailRow label="Celular" value={trabajo.celularApoderado} />
          </DetailGroup>

          <DetailGroup title="Docente">
            <DetailRow label="Nombre" value={trabajo.docente} />
            <DetailRow label="Email" value={trabajo.emailDocente} />
          </DetailGroup>
        </section>

        <EvaluacionesPanel
          evaluaciones={trabajo.evaluacionesOtros}
          evaluacionPropia={trabajo.evaluacion}
        />

        <section className="internal-card internal-card--file internal-card--file-compact">
          <div className="internal-card__head">
            <h2 className="internal-card__title">Entregable</h2>
            <span className="internal-file-type">{tipoArchivoLabels[trabajo.tipoArchivo]}</span>
          </div>

          {archivoLoading ? (
            <div className="internal-file-empty">
              <p className="internal-muted">Cargando archivo…</p>
            </div>
          ) : archivoUrl ? (
            <>
              <div className="internal-file-preview">
                {trabajo.tipoArchivo === "pdf" ? (
                  <iframe title="PDF entregable" src={archivoUrl} className="internal-file-frame" />
                ) : trabajo.tipoArchivo === "mp4" ? (
                  <video controls src={archivoUrl} className="internal-file-frame" />
                ) : (
                  <img src={archivoUrl} alt="Entregable" className="internal-file-frame internal-file-frame--image" />
                )}
              </div>
              <button type="button" className="internal-link internal-file-open" onClick={() => void openArchivo()}>
                Abrir en pestaña nueva
              </button>
            </>
          ) : (
            <div className="internal-file-empty">
              <p className="internal-file-empty__title">Archivo no disponible</p>
              <p className="internal-muted">
                No se encontró en el servidor local. Puede ser un registro demo o el archivo fue movido.
              </p>
              <button type="button" className="internal-btn internal-btn--outline" onClick={() => void openArchivo()}>
                Intentar abrir
              </button>
            </div>
          )}
        </section>
      </div>

      {evalModalOpen && (
        <div className="internal-modal-backdrop" role="presentation" onClick={closeEvalModal}>
          <div
            className="internal-modal internal-modal--eval"
            role="dialog"
            aria-labelledby="eval-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="eval-modal-title" className="internal-modal__title">
              Evaluar trabajo
            </h2>
            <p className="internal-modal__text">
              {trabajo.concursante} · {trabajo.bookTitle}
            </p>
            {trabajo.evaluacion?.fechaEvaluacion && (
              <p className="internal-muted internal-modal__hint">
                Última guardada el{" "}
                {new Date(trabajo.evaluacion.fechaEvaluacion).toLocaleString("es-PE")}
              </p>
            )}

            <form className="internal-eval-form internal-eval-form--modal" onSubmit={(e) => void submitEvaluacion(e)}>
              <label className="internal-field">
                <span>Puntaje (0–100)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={puntaje}
                  onChange={(e) => setPuntaje(e.target.value)}
                  className="form-field internal-eval-score"
                  placeholder="—"
                  autoFocus
                />
              </label>

              <label className="internal-field internal-field--full">
                <span>Comentarios</span>
                <textarea
                  rows={4}
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  className="form-field internal-textarea"
                  placeholder="Observaciones para el jurado o administración…"
                />
              </label>

              <label className="internal-check internal-field--full">
                <input
                  type="checkbox"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                />
                Marcar como destacado
              </label>

              <div className="internal-modal__actions internal-field--full">
                <button
                  type="button"
                  className="internal-btn internal-btn--outline"
                  onClick={closeEvalModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar evaluación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
