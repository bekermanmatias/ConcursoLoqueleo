import { useMemo, useState } from "react";
import FileDropzone from "./FileDropzone";
import {
  ciudadesPorDepartamento,
  colegiosMock,
  departamentos,
  distritosPorCiudad,
  dniRegistrados,
  grados,
} from "../../data/locations";

interface Props {
  bookId: string;
  bookTitle: string;
  accent: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink-800 outline-none transition focus:border-[color:var(--color-brand-red)] focus:ring-2 focus:ring-red-100";

export default function RegistrationWizard({ bookId, bookTitle, accent }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [distrito, setDistrito] = useState("");
  const [colegioSearch, setColegioSearch] = useState("");
  const [colegio, setColegio] = useState("");
  const [grado, setGrado] = useState("");
  const [dni, setDni] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ciudades = useMemo(
    () => (departamento ? ciudadesPorDepartamento[departamento] ?? [] : []),
    [departamento],
  );
  const distritos = useMemo(
    () => (ciudad ? distritosPorCiudad[ciudad] ?? [] : []),
    [ciudad],
  );
  const colegiosFiltrados = useMemo(() => {
    const q = colegioSearch.trim().toLowerCase();
    if (!q) return colegiosMock;
    return colegiosMock.filter((c) => c.toLowerCase().includes(q));
  }, [colegioSearch]);

  const dniLimpio = dni.replace(/\D/g, "");
  const dniDuplicado = dniLimpio.length === 8 && dniRegistrados.has(dniLimpio);

  const canNext = () => {
    if (step === 1) return departamento && ciudad && distrito;
    if (step === 2) return !!colegio;
    if (step === 3) return !!grado;
    if (step === 4) return dniLimpio.length === 8 && !dniDuplicado;
    if (step === 5) return !!file;
    return false;
  };

  const submit = () => {
    if (!file) {
      setFileError("Sube tu archivo para continuar.");
      return;
    }
    setSubmitting(true);
    const code = `LL-${bookId.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    sessionStorage.setItem(
      "loqueleo-inscripcion",
      JSON.stringify({
        bookId,
        bookTitle,
        code,
        colegio,
        grado,
        dni: dniLimpio,
        fileName: file.name,
      }),
    );
    window.location.href = `/libro/${bookId}/confirmacion`;
  };

  return (
    <div className="flow-panel max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 text-sm font-semibold text-gray-500">
        <span>Paso {step} de 5</span>
        <span style={{ color: accent }}>{bookTitle}</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink-900">Ubicación</h2>
          <p className="text-sm text-gray-500">Selecciona departamento, ciudad y distrito.</p>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Departamento</span>
            <select
              className={`${inputClass} mt-1`}
              value={departamento}
              onChange={(e) => {
                setDepartamento(e.target.value);
                setCiudad("");
                setDistrito("");
              }}
            >
              <option value="">Selecciona…</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Ciudad</span>
            <select
              className={`${inputClass} mt-1`}
              value={ciudad}
              disabled={!departamento}
              onChange={(e) => {
                setCiudad(e.target.value);
                setDistrito("");
              }}
            >
              <option value="">Selecciona…</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Distrito</span>
            <select
              className={`${inputClass} mt-1`}
              value={distrito}
              disabled={!ciudad}
              onChange={(e) => setDistrito(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {distritos.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink-900">Colegio</h2>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Escribe tu colegio</span>
            <input
              type="search"
              className={`${inputClass} mt-1`}
              placeholder="Buscar colegio…"
              value={colegioSearch}
              onChange={(e) => setColegioSearch(e.target.value)}
            />
          </label>
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
            {colegiosFiltrados.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setColegio(c)}
                  className={[
                    "w-full text-left px-4 py-3 text-sm transition hover:bg-gray-50",
                    colegio === c ? "bg-red-50 font-semibold text-[color:var(--color-brand-red)]" : "text-ink-800",
                  ].join(" ")}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink-900">Grado</h2>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Grado escolar</span>
            <select
              className={`${inputClass} mt-1`}
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {grados.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink-900">DNI del participante</h2>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">DNI (8 dígitos)</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              className={`${inputClass} mt-1`}
              placeholder="12345678"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
            />
          </label>
          {dniDuplicado && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3" role="alert">
              Este DNI ya fue registrado anteriormente.
            </p>
          )}
          {dniLimpio.length === 8 && !dniDuplicado && (
            <p className="text-sm text-green-700">DNI disponible para inscripción.</p>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-ink-900">Sube tu trabajo</h2>
          <p className="text-sm text-gray-500">
            Arrastra tu archivo o selecciónalo desde tu dispositivo.
          </p>
          <FileDropzone
            onFile={(f) => {
              setFile(f);
              setFileError("");
            }}
            error={fileError}
          />
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex-1 rounded-full border-2 border-gray-200 py-3 text-sm font-semibold text-ink-800 hover:bg-gray-50 transition"
          >
            Atrás
          </button>
        )}
        {step < 5 ? (
          <button
            type="button"
            disabled={!canNext()}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="flex-1 rounded-full py-3 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ background: accent }}
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            disabled={!canNext() || submitting}
            onClick={submit}
            className="flex-1 btn-primary py-3 text-sm disabled:opacity-40"
          >
            {submitting ? "Enviando…" : "Enviar participación"}
          </button>
        )}
      </div>
    </div>
  );
}
