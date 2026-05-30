import { useCallback, useRef, useState } from "react";

const PDF_MAX_MB = 10;
const VIDEO_MAX_MB = 250;
const ACCEPT = ".pdf,.mp4,.mov";

interface Props {
  onFile: (file: File | null) => void;
  onValidationError?: (message: string) => void;
  error?: string;
}

function maxBytesForFile(f: File): number {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return PDF_MAX_MB * 1024 * 1024;
  if (["mp4", "mov"].includes(ext)) return VIDEO_MAX_MB * 1024 * 1024;
  return PDF_MAX_MB * 1024 * 1024;
}

function maxLabelForFile(f: File): string {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return `${PDF_MAX_MB} MB`;
  if (["mp4", "mov"].includes(ext)) return `${VIDEO_MAX_MB} MB`;
  return `${PDF_MAX_MB} MB`;
}

export default function FileDropzone({ onFile, onValidationError, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validate = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["pdf", "mp4", "mov"];
    if (!allowed.includes(ext)) {
      return "Ese formato no sirve. Sube un PDF o un video MP4/MOV.";
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
    [onFile, onValidationError],
  );

  return (
    <div>
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
        <p className="wizard-dropzone-cta">Haz clic para subir tu PDF o video</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
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
