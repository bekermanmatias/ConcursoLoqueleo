import { useState } from "react";
import { formatGradeLabel } from "../../lib/books";
import {
  canReuploadParticipation,
  formatParticipationDate,
  getParticipationByDni,
} from "../../lib/participations";
import {
  fileStatusLabels,
  submissionStatusLabels,
  type ParticipationRecord,
} from "../../data/participations";
import ParticipationCertificate from "./ParticipationCertificate";
import ReuploadForm from "./ReuploadForm";

export default function HelpLookup() {
  const [dni, setDni] = useState("");
  const [result, setResult] = useState<ParticipationRecord | null>(null);
  const [reuploadDone, setReuploadDone] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dniLimpio = dni.replace(/\D/g, "");

  const handleSearch = async () => {
    setError("");
    setSearched(true);
    setLoading(true);

    if (dniLimpio.length !== 8) {
      setResult(null);
      setError("Escribe un DNI de 8 números.");
      setLoading(false);
      return;
    }

    try {
      const found = await getParticipationByDni(dniLimpio);
      setResult(found);
      setReuploadDone(false);

      if (!found) {
        setError(
          "No encontramos tu DNI. Revísalo o pregunta a tu profe si ya enviaste tu trabajo.",
        );
      }
    } catch {
      setResult(null);
      setError("No pudimos consultar ahora. Intenta en unos minutos.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="help-lookup">
      <form
        className="help-search"
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
      >
        <label className="wizard-label-text" htmlFor="help-dni">
          Tu DNI
        </label>
        <div className="help-search-row">
          <input
            id="help-dni"
            type="text"
            inputMode="numeric"
            maxLength={8}
            className="form-field help-search-input"
            placeholder="Escribe tus 8 números"
            value={dni}
            onChange={(event) => {
              setDni(event.target.value.replace(/\D/g, "").slice(0, 8));
              setError("");
            }}
          />
          <button type="submit" className="help-search-btn btn-primary" disabled={loading}>
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>

      {error && (
        <p className="help-message help-message--error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="help-result">
          {reuploadDone && (
            <p className="help-message help-message--success" role="status">
              Recibimos tu archivo corregido. Lo revisaremos y aquí verás el cambio.
            </p>
          )}

          <h3 className="help-result-title">{result.bookTitle}</h3>
          <p className="help-result-meta">
            {formatGradeLabel(result.grado)} · {result.colegio}
          </p>

          <dl className="help-result-details">
            <div>
              <dt>Participante</dt>
              <dd>
                {result.concursante ||
                  [result.concursanteNombres, result.concursanteApellidos]
                    .filter(Boolean)
                    .join(" ")}
              </dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                {submissionStatusLabels[result.estado].label}.{" "}
                {submissionStatusLabels[result.estado].detail}
              </dd>
            </div>
            <div>
              <dt>Archivo</dt>
              <dd>
                {result.fileName} — {fileStatusLabels[result.fileStatus]}.{" "}
                {result.fileStatusDetail}
              </dd>
            </div>
            <div>
              <dt>Enviado</dt>
              <dd>{formatParticipationDate(result.submittedAt)}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd className="help-result-code">{result.code}</dd>
            </div>
          </dl>

          {!canReuploadParticipation(result) && (
            <button type="button" className="help-print-btn btn-primary" onClick={handlePrint}>
              Reimprimir constancia
            </button>
          )}

          {canReuploadParticipation(result) && !reuploadDone && (
            <ReuploadForm
              record={result}
              onSuccess={(updated) => {
                setResult(updated);
                setReuploadDone(true);
              }}
            />
          )}

          {!canReuploadParticipation(result) && (
            <ParticipationCertificate record={result} />
          )}
        </div>
      )}

      {searched && !result && !error && (
        <p className="help-message">No hay resultados.</p>
      )}
    </div>
  );
}
