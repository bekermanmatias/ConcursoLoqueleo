import { useCallback, useRef, useState } from "react";
import {
  formatosAcceptAttribute,
  formatosHintLabel,
  validateFileForFormatos,
} from "../../lib/participation-validation";

const PDF_MAX_MB = 10;
const VIDEO_MAX_MB = 250;

interface Props {
  onFile: (file: File | null) => void;
  onValidationError?: (message: string) => void;
  error?: string;
  allowedFormatos: string[];
}

function maxBytesForFile(f: File): number {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return PDF_MAX_MB * 1024 * 1024;
  if (["mp4", "mov", "mp3"].includes(ext)) return VIDEO_MAX_MB * 1024 * 1024;
  if (["jpg", "jpeg", "png"].includes(ext)) return PDF_MAX_MB * 1024 * 1024;
  return PDF_MAX_MB * 1024 * 1024;
}

function maxLabelForFile(f: File): string {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return `${PDF_MAX_MB} MB`;
  if (["mp4", "mov", "mp3"].includes(ext)) return `${VIDEO_MAX_MB} MB`;
  if (["jpg", "jpeg", "png"].includes(ext)) return `${PDF_MAX_MB} MB`;
  return `${PDF_MAX_MB} MB`;
}

export default function FileDropzone({
  onFile,
  onValidationError,
  error,
  allowedFormatos,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const accept = formatosAcceptAttribute(allowedFormatos);
  const formatHint = formatosHintLabel(allowedFormatos);

  const validate = (f: File): string | null => {
    const formatError = validateFileForFormatos(f.name, allowedFormatos);
    if (formatError) return formatError;

    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedExts = accept
      .split(",")
      .map((item) => item.trim().replace(/^\./, ""))
      .filter(Boolean);
    if (!allowedExts.includes(ext)) {
      return `Para este reto solo puedes enviar: ${formatHint}.`;
    }

    const limit = maxBytesForFile(f);
    if (f.size > limit) {
      return `Tu archivo es muy pesado. El máximo para este formato es ${maxLabelForFile(f)}.`;
    }
    return null;
  };

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) {
        setFile(null);
        onFile(null);
        setLocalError(null);
        return;
      }
      const err = validate(f);
      if (err) {
        setLocalError(err);
        onValidationError?.(err);
        setFile(null);
        onFile(null);
        return;
      }
      setLocalError(null);
      onValidationError?.("");
      setFile(f);
      onFile(f);
    },
    [onFile, onValidationError, allowedFormatos, accept, formatHint],
  );

  return (
    <div>
      <p className="wizard-hint mb-3 text-sm text-gray-600">
        Formatos permitidos para este reto: <strong>{formatHint}</strong>
      </p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={[
          "wizard-dropzone cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition",
          drag ? "wizard-dropzone--drag" : "",
          error || localError ? "wizard-dropzone--error" : "",
        ].join(" ")}
      >
        <p className="wizard-dropzone-title">Arrastra y suelta tu trabajo aquí</p>
        <p className="wizard-dropzone-or">o</p>
        <p className="wizard-dropzone-cta">Haz clic para subir tu archivo</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="wizard-dropzone-file">
            ¡Archivo listo! {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </p>
        )}
      </div>
    </div>
  );
}
