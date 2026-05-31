import { useEffect, useMemo, useState } from "react";
import {
  OBRA_COVER_MAX_MB,
  OBRA_COVER_RECOMMENDED,
  resolveConcursoAssetUrl,
  updateConcursoObra,
  uploadConcursoObraCoverImage,
  uploadConcursoObraBasesPdf,
  type ConcursoObra,
} from "../../lib/internal-api";

type ObraFormState = {
  bookSlug: string;
  nombreObra: string;
  autor: string;
  rol: string;
  edad: string;
  tipoReto: string;
  challengeIntro: string;
  challengeHeadline: string;
  descripcionReto: string;
  entregable: string;
  formatosText: string;
  requisitosText: string;
  notaParticipacion: string;
};

const EDAD_OPTIONS = ["+6", "+8", "+10", "+12", "+14"];

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(items: string[] | null | undefined): string {
  return (items ?? []).join("\n");
}

function obraToForm(obra: ConcursoObra): ObraFormState {
  return {
    bookSlug: obra.bookSlug ?? "",
    nombreObra: obra.nombreObra,
    autor: obra.autor ?? "",
    rol: obra.rol ?? "",
    edad: obra.edad ?? "+6",
    tipoReto: obra.tipoReto,
    challengeIntro: obra.challengeIntro ?? "",
    challengeHeadline: obra.challengeHeadline ?? "",
    descripcionReto: obra.descripcionReto ?? "",
    entregable: obra.entregable ?? "",
    formatosText: arrayToLines(obra.formatos),
    requisitosText: arrayToLines(obra.requisitos),
    notaParticipacion: obra.notaParticipacion ?? "",
  };
}

interface ObraEditModalProps {
  concursoId: number;
  obra: ConcursoObra;
  saving: boolean;
  onClose: () => void;
  onSaved: (obra: ConcursoObra) => void;
  onSavingChange: (saving: boolean) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function ObraEditModal({
  concursoId,
  obra,
  saving,
  onClose,
  onSaved,
  onSavingChange,
  onError,
  onSuccess,
}: ObraEditModalProps) {
  const [form, setForm] = useState<ObraFormState>(() => obraToForm(obra));
  const [coverUrl, setCoverUrl] = useState<string | null>(obra.coverUrl);
  const [basesPdf, setBasesPdf] = useState<string | null>(obra.basesPdf);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBases, setUploadingBases] = useState(false);

  useEffect(() => {
    setForm(obraToForm(obra));
    setCoverUrl(obra.coverUrl);
    setBasesPdf(obra.basesPdf);
  }, [obra]);

  const coverPreview = useMemo(() => resolveConcursoAssetUrl(coverUrl), [coverUrl]);
  const basesPdfUrl = useMemo(() => resolveConcursoAssetUrl(basesPdf), [basesPdf]);

  const handleCoverUpload = async (file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      onError("Solo se permiten imágenes PNG, JPG o WebP.");
      return;
    }
    if (file.size > OBRA_COVER_MAX_MB * 1024 * 1024) {
      onError(`La imagen supera ${OBRA_COVER_MAX_MB} MB.`);
      return;
    }
    setUploadingCover(true);
    onSavingChange(true);
    try {
      const updated = await uploadConcursoObraCoverImage(concursoId, obra.id, file);
      setCoverUrl(updated.coverUrl);
      onSaved(updated);
      onSuccess("Portada actualizada.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo subir la portada.");
    } finally {
      setUploadingCover(false);
      onSavingChange(false);
    }
  };

  const handleBasesUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      onError("Solo se permiten archivos PDF.");
      return;
    }
    setUploadingBases(true);
    onSavingChange(true);
    try {
      const updated = await uploadConcursoObraBasesPdf(concursoId, obra.id, file);
      setBasesPdf(updated.basesPdf);
      onSaved(updated);
      onSuccess("Bases PDF actualizadas.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo subir el PDF.");
    } finally {
      setUploadingBases(false);
      onSavingChange(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nombreObra.trim() || !form.tipoReto.trim()) {
      onError("Completa al menos el nombre de la obra y el tipo de reto.");
      return;
    }
    onSavingChange(true);
    try {
      const updated = await updateConcursoObra(concursoId, obra.id, {
        bookSlug: form.bookSlug.trim() || null,
        nombreObra: form.nombreObra.trim(),
        autor: form.autor.trim() || null,
        rol: form.rol.trim() || null,
        edad: form.edad || null,
        tipoReto: form.tipoReto.trim(),
        challengeIntro: form.challengeIntro.trim() || null,
        challengeHeadline: form.challengeHeadline.trim() || null,
        descripcionReto: form.descripcionReto.trim() || null,
        entregable: form.entregable.trim() || null,
        formatos: linesToArray(form.formatosText),
        requisitos: linesToArray(form.requisitosText),
        notaParticipacion: form.notaParticipacion.trim() || null,
      });
      onSaved(updated);
      onSuccess("Detalle de la obra guardado.");
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo guardar la obra.");
    } finally {
      onSavingChange(false);
    }
  };

  const busy = saving || uploadingCover || uploadingBases;

  return (
    <div
      className="internal-modal-backdrop"
      role="presentation"
      onClick={() => !busy && onClose()}
    >
      <div
        className="internal-modal internal-modal--wide internal-modal--obra"
        role="dialog"
        aria-labelledby="obra-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="obra-edit-title" className="internal-modal__title">
          Editar obra — {obra.gradoLabel}
        </h2>
        <p className="internal-modal__text">
          Contenido del detalle del reto que verán los participantes. Los cambios se guardan en la
          base de datos.
        </p>

        <form className="internal-obra-form" onSubmit={(e) => void handleSubmit(e)}>
          <div className="internal-obra-form__cover">
            <div className="internal-obra-form__cover-preview">
              {coverPreview ? (
                <img src={coverPreview} alt={`Portada de ${form.nombreObra}`} />
              ) : (
                <span className="internal-muted">Sin portada</span>
              )}
            </div>
            <div className="internal-obra-form__cover-actions">
              <p className="internal-muted internal-obra-form__cover-hint">
                Tamaño recomendado: {OBRA_COVER_RECOMMENDED.width}×{OBRA_COVER_RECOMMENDED.height}{" "}
                px (proporción {OBRA_COVER_RECOMMENDED.ratio}). Máximo {OBRA_COVER_MAX_MB} MB.
                Formatos: PNG, JPG o WebP.
              </p>
              <label className="internal-btn internal-btn--outline internal-file-btn">
                {uploadingCover ? "Subiendo…" : "Cambiar portada"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCoverUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="internal-obra-form__doc">
            <p className="internal-field">
              <span className="internal-obra-form__doc-label">Bases PDF</span>
            </p>
            <p className="internal-muted internal-obra-form__cover-hint">
              Documento con las bases e indicaciones completas del reto para los participantes.
            </p>
            <div className="internal-doc-row">
              {basesPdfUrl ? (
                <a
                  href={basesPdfUrl}
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
                {uploadingBases ? "Subiendo…" : "Subir bases PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleBasesUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="internal-obra-form__grid">
            <label className="internal-field">
              <span>Nombre de la obra</span>
              <input
                type="text"
                value={form.nombreObra}
                onChange={(e) => setForm({ ...form, nombreObra: e.target.value })}
                className="form-field internal-input"
                required
              />
            </label>
            <label className="internal-field">
              <span>Identificador (slug)</span>
              <input
                type="text"
                value={form.bookSlug}
                onChange={(e) => setForm({ ...form, bookSlug: e.target.value })}
                className="form-field internal-input"
                placeholder="tusuj-6"
              />
            </label>
            <label className="internal-field">
              <span>Autor(es)</span>
              <input
                type="text"
                value={form.autor}
                onChange={(e) => setForm({ ...form, autor: e.target.value })}
                className="form-field internal-input"
              />
            </label>
            <label className="internal-field">
              <span>Edad sugerida</span>
              <select
                value={form.edad}
                onChange={(e) => setForm({ ...form, edad: e.target.value })}
                className="form-field internal-input"
              >
                {EDAD_OPTIONS.map((edad) => (
                  <option key={edad} value={edad}>
                    {edad}
                  </option>
                ))}
              </select>
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Rol del participante</span>
              <input
                type="text"
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="form-field internal-input"
                placeholder="Soy un(a) compositor(a)."
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Tipo de reto (etiqueta corta)</span>
              <input
                type="text"
                value={form.tipoReto}
                onChange={(e) => setForm({ ...form, tipoReto: e.target.value })}
                className="form-field internal-input"
                required
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Introducción al reto (opcional)</span>
              <textarea
                value={form.challengeIntro}
                onChange={(e) => setForm({ ...form, challengeIntro: e.target.value })}
                className="form-field internal-input internal-textarea"
                rows={2}
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Título destacado del reto</span>
              <textarea
                value={form.challengeHeadline}
                onChange={(e) => setForm({ ...form, challengeHeadline: e.target.value })}
                className="form-field internal-input internal-textarea"
                rows={2}
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Descripción del reto</span>
              <textarea
                value={form.descripcionReto}
                onChange={(e) => setForm({ ...form, descripcionReto: e.target.value })}
                className="form-field internal-input internal-textarea"
                rows={3}
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Entregable</span>
              <textarea
                value={form.entregable}
                onChange={(e) => setForm({ ...form, entregable: e.target.value })}
                className="form-field internal-input internal-textarea"
                rows={2}
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Formatos aceptados (uno por línea)</span>
              <textarea
                value={form.formatosText}
                onChange={(e) => setForm({ ...form, formatosText: e.target.value })}
                className="form-field internal-input internal-textarea"
                rows={2}
                placeholder="PDF"
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Requisitos (uno por línea)</span>
              <textarea
                value={form.requisitosText}
                onChange={(e) => setForm({ ...form, requisitosText: e.target.value })}
                className="form-field internal-input internal-textarea"
                rows={4}
              />
            </label>
            <label className="internal-field internal-obra-form__full">
              <span>Nota sobre la participación</span>
              <textarea
                value={form.notaParticipacion}
                onChange={(e) => setForm({ ...form, notaParticipacion: e.target.value })}
                className="form-field internal-input internal-textarea"
                rows={3}
              />
            </label>
          </div>

          <div className="internal-modal__actions">
            <button
              type="button"
              className="internal-btn internal-btn--outline"
              onClick={onClose}
              disabled={busy}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Guardando…" : "Guardar detalle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
