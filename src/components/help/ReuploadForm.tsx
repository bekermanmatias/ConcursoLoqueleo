import { useState } from "react";
import FileDropzone from "../flow/FileDropzone";
import { reuploadParticipationFile } from "../../lib/participations";
import type { ParticipationRecord } from "../../data/participations";

interface Props {
  record: ParticipationRecord;
  onSuccess: (updated: ParticipationRecord) => void;
}

export default function ReuploadForm({ record, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = () => {
    if (!file) {
      setFileError("Elige el archivo corregido.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const updated = reuploadParticipationFile(record.dni, file.name);
    if (!updated) {
      setFormError("No se pudo guardar. Intenta otra vez.");
      setSubmitting(false);
      return;
    }

    onSuccess(updated);
    setSubmitting(false);
  };

  return (
    <div className="help-reupload">
      <p className="help-reupload-lead">
        <strong>Te falta corregir el archivo.</strong>{" "}
        {record.rejectionReason ?? record.fileStatusDetail}
      </p>
      <p className="help-reupload-note">
        Tu código sigue siendo {record.code}; solo cambias el archivo.
      </p>

      <FileDropzone
        onFile={(nextFile) => {
          setFile(nextFile);
          if (nextFile) setFileError("");
        }}
        onValidationError={setFileError}
        error={fileError}
      />

      {formError && (
        <p className="help-message help-message--error mt-4" role="alert">
          {formError}
        </p>
      )}

      <button
        type="button"
        className="help-reupload-btn btn-primary mt-4"
        disabled={submitting}
        onClick={submit}
      >
        {submitting ? "Enviando…" : "Subir archivo corregido"}
      </button>
    </div>
  );
}
