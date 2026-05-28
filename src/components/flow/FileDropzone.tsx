import { useCallback, useState } from "react";

const MAX_MB = 50;
const ACCEPT = ".pdf,.mp4,.mov,.mp3,.jpg,.jpeg,.png";

interface Props {
  onFile: (file: File | null) => void;
  error?: string;
}

export default function FileDropzone({ onFile, error }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validate = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["pdf", "mp4", "mov", "mp3", "jpg", "jpeg", "png"];
    if (!allowed.includes(ext)) {
      return "Formato no permitido. Usa PDF, video o imagen.";
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `El archivo supera ${MAX_MB} MB.`;
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
        setFile(null);
        onFile(null);
        return;
      }
      setLocalError(null);
      setFile(f);
      onFile(f);
    },
    [onFile],
  );

  return (
    <div>
      <div
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
          "flow-dropzone rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition",
          drag
            ? "border-[color:var(--color-brand-red)] bg-red-50/50"
            : "border-gray-200 bg-gray-50/80 hover:border-gray-300",
          error || localError ? "border-red-400" : "",
        ].join(" ")}
      >
        <p className="text-sm font-semibold text-ink-900">
          Arrastra tu archivo aquí
        </p>
        <p className="mt-1 text-xs text-gray-500">
          o haz clic para subir tu PDF o video
        </p>
        <p className="mt-2 text-xs text-gray-400">Máximo {MAX_MB} MB</p>
        <label className="mt-4 inline-block cursor-pointer">
          <span className="btn-primary text-sm py-2.5 px-6">Elegir archivo</span>
          <input
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <p className="mt-4 text-sm font-medium text-green-700">
            Archivo listo: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </p>
        )}
      </div>
      {(error || localError) && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error || localError}
        </p>
      )}
    </div>
  );
}
