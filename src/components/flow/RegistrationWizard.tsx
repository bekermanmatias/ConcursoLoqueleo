import { useMemo, useState, type CSSProperties } from "react";
import FileDropzone from "./FileDropzone";
import FormSelect from "./FormSelect";
import { WizardJourneyHead, WizardProgressBar } from "./WizardProgress";
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

type Step = 1 | 2 | 3;

export default function RegistrationWizard({ bookId, bookTitle, accent }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [distrito, setDistrito] = useState("");
  const [colegio, setColegio] = useState("");
  const [grado, setGrado] = useState("");
  const [dni, setDni] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ciudades = useMemo(
    () => (departamento ? ciudadesPorDepartamento[departamento] ?? [] : []),
    [departamento],
  );
  const distritos = useMemo(
    () => (ciudad ? distritosPorCiudad[ciudad] ?? [] : []),
    [ciudad],
  );

  const dniLimpio = dni.replace(/\D/g, "");

  const validateStep = (currentStep: Step): string | null => {
    if (currentStep === 1) {
      if (!departamento || !ciudad || !distrito) {
        return "Completa departamento, ciudad y distrito para continuar.";
      }
      return null;
    }
    if (currentStep === 2) {
      if (!colegio) return "Elige tu colegio para continuar.";
      if (!grado) return "Elige tu grado para continuar.";
      if (dniLimpio.length !== 8) return "Escribe un DNI de 8 números.";
      if (dniRegistrados.has(dniLimpio)) {
        return "Este DNI ya participó. Si necesitas ayuda, pregunta a tu profe o apoderado.";
      }
      return null;
    }
    return null;
  };

  const goNext = () => {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError("");
    setStep((s) => (s + 1) as Step);
  };

  const goBack = () => {
    setStepError("");
    if (step === 1) {
      window.location.href = `/libro/${bookId}`;
      return;
    }
    setStep((s) => (s - 1) as Step);
  };

  const submit = () => {
    if (!file) {
      setFileError("Falta subir tu trabajo. ¡Elige un archivo para continuar!");
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
        departamento,
        ciudad,
        distrito,
        colegio,
        grado,
        dni: dniLimpio,
        fileName: file.name,
      }),
    );
    window.location.href = `/libro/${bookId}/confirmacion`;
  };

  return (
    <div className="wizard" style={{ "--field-accent": accent } as CSSProperties}>
      <WizardProgressBar step={step} />
      <div className="wizard-main">
        <WizardJourneyHead step={step} />

        <div className="wizard-panel">
          <div className="wizard-step-slot">
            {step === 1 && (
              <div className="wizard-step">

          <div className="wizard-label">
            <span className="wizard-label-text">Departamento</span>
            <FormSelect
              value={departamento}
              onChange={(next) => {
                setDepartamento(next);
                setCiudad("");
                setDistrito("");
                setStepError("");
              }}
              options={departamentos}
              placeholder="Elige tu departamento…"
            />
          </div>

          <div className="wizard-label">
            <span className="wizard-label-text">Ciudad</span>
            <FormSelect
              value={ciudad}
              disabled={!departamento}
              onChange={(next) => {
                setCiudad(next);
                setDistrito("");
                setStepError("");
              }}
              options={ciudades}
              placeholder={departamento ? "Elige tu ciudad…" : "Primero elige departamento"}
            />
          </div>

          <div className="wizard-label">
            <span className="wizard-label-text">Distrito</span>
            <FormSelect
              value={distrito}
              disabled={!ciudad}
              onChange={(next) => {
                setDistrito(next);
                setStepError("");
              }}
              options={distritos}
              placeholder={ciudad ? "Elige tu distrito…" : "Primero elige ciudad"}
            />
          </div>
              </div>
            )}

            {step === 2 && (
              <div className="wizard-step">
          <div className="wizard-label">
            <span className="wizard-label-text">Colegio</span>
            <FormSelect
              value={colegio}
              onChange={(next) => {
                setColegio(next);
                setStepError("");
              }}
              options={colegiosMock}
              placeholder="Busca y elige tu colegio…"
            />
          </div>

          <div className="wizard-label">
            <span className="wizard-label-text">Grado</span>
            <FormSelect
              value={grado}
              onChange={(next) => {
                setGrado(next);
                setStepError("");
              }}
              options={grados}
              placeholder="¿En qué grado estudias?"
            />
          </div>

          <label className="wizard-label">
            <span className="wizard-label-text">Tu DNI</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              className="form-field"
              placeholder="Escribe tus 8 números"
              value={dni}
              onChange={(e) => {
                setDni(e.target.value.replace(/\D/g, "").slice(0, 8));
                setStepError("");
              }}
            />
          </label>
              </div>
            )}

            {step === 3 && (
              <div className="wizard-step">
                <FileDropzone
                  onFile={(f) => {
                    setFile(f);
                    if (f) setFileError("");
                  }}
                  onValidationError={setFileError}
                  error={fileError}
                />
              </div>
            )}
          </div>

          <div className="wizard-step-error" aria-live="polite">
            {(stepError || (step === 3 && fileError)) && (
              <p className="wizard-hint wizard-hint--error" role="alert">
                {stepError || fileError}
              </p>
            )}
          </div>

          <div className="wizard-actions">
            <button
              type="button"
              onClick={goBack}
              className="wizard-btn wizard-btn--outline"
              style={{ borderColor: accent, color: accent }}
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={goNext}
              className={[
                "wizard-btn wizard-btn--primary",
                step >= 3 ? "invisible pointer-events-none" : "",
              ].join(" ")}
              style={{ background: accent }}
              aria-hidden={step >= 3}
              tabIndex={step >= 3 ? -1 : 0}
            >
              Siguiente
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className={[
                "wizard-btn wizard-btn--primary col-start-2 row-start-1 disabled:opacity-40",
                step < 3 ? "invisible pointer-events-none" : "",
              ].join(" ")}
              style={{ background: accent }}
              aria-hidden={step < 3}
              tabIndex={step < 3 ? -1 : 0}
            >
              {submitting ? "Enviando tu trabajo…" : "¡Enviar mi trabajo!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
