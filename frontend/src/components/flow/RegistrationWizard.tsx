import { useMemo, useState, type CSSProperties } from "react";
import FileDropzone from "./FileDropzone";
import FormSelect from "./FormSelect";
import { WizardJourneyHead, WizardProgressBar, type WizardStep } from "./WizardProgress";
import { formatGradeLabel } from "../../lib/books";
import { saveParticipation, isDniBlockedForRegistration } from "../../lib/participations";
import { uploadParticipationFile } from "../../lib/uploads";
import {
  ciudadesPorDepartamento,
  colegiosMock,
  colegiosNombres,
  departamentos,
  distritosPorCiudad,
  type Grado,
  type Sexo,
} from "../../data/locations";

interface Props {
  bookId: string;
  bookTitle: string;
  bookGrade: Grado;
  bookAge: string;
  accent: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegistrationWizard({ bookId, bookTitle, bookGrade, bookAge, accent }: Props) {
  const [step, setStep] = useState<WizardStep>(1);
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [colegio, setColegio] = useState("");
  const [concursante, setConcursante] = useState("");
  const [dni, setDni] = useState("");
  const [sexo, setSexo] = useState<Sexo | "">("");
  const [edad, setEdad] = useState("");
  const [apoderado, setApoderado] = useState("");
  const [dniApoderado, setDniApoderado] = useState("");
  const [telefonoApoderado, setTelefonoApoderado] = useState("");
  const [celularApoderado, setCelularApoderado] = useState("");
  const [docente, setDocente] = useState("");
  const [emailDocente, setEmailDocente] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingDni, setCheckingDni] = useState(false);

  const provincias = useMemo(
    () => (departamento ? ciudadesPorDepartamento[departamento] ?? [] : []),
    [departamento],
  );
  const distritos = useMemo(
    () => (provincia ? distritosPorCiudad[provincia] ?? [] : []),
    [provincia],
  );

  const colegioSeleccionado = colegiosMock.find((c) => c.nombre === colegio);
  const dniLimpio = dni.replace(/\D/g, "");
  const dniApoderadoLimpio = dniApoderado.replace(/\D/g, "");

  const validateStep = (currentStep: WizardStep): string | null => {
    if (currentStep === 1) {
      if (!departamento || !provincia || !distrito) {
        return "Completa departamento, provincia y distrito para continuar.";
      }
      return null;
    }
    if (currentStep === 2) {
      if (!colegio) return "Elige tu colegio para continuar.";
      return null;
    }
    if (currentStep === 3) {
      if (!concursante.trim()) return "Escribe tu nombre completo.";
      if (dniLimpio.length !== 8) return "Escribe un DNI de 8 números.";
      if (!sexo) return "Elige tu sexo.";
      const edadNum = Number(edad);
      if (!edad || !Number.isInteger(edadNum) || edadNum < 5 || edadNum > 20) {
        return "Escribe una edad válida (5 a 20 años).";
      }
      return null;
    }
    if (currentStep === 4) {
      if (!apoderado.trim()) return "Escribe el nombre del apoderado.";
      if (dniApoderadoLimpio.length !== 8) return "DNI del apoderado: 8 números.";
      if (!celularApoderado.trim()) return "Escribe el celular del apoderado.";
      if (!docente.trim()) return "Escribe el nombre del docente.";
      if (!isValidEmail(emailDocente)) return "Escribe un correo válido del docente.";
      return null;
    }
    return null;
  };

  const goNext = async () => {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }

    if (step === 3) {
      setCheckingDni(true);
      try {
        const blocked = await isDniBlockedForRegistration(dniLimpio);
        if (blocked) {
          setStepError("Este DNI ya participó en un reto.");
          return;
        }
      } catch {
        setStepError("No pudimos validar tu DNI. Intenta otra vez.");
        return;
      } finally {
        setCheckingDni(false);
      }
    }

    setStepError("");
    setStep((s) => (s + 1) as WizardStep);
  };

  const submit = async () => {
    if (!file) {
      setFileError("Falta subir tu trabajo. ¡Elige un archivo para continuar!");
      return;
    }
    if (!colegioSeleccionado) {
      setStepError("Falta el colegio. Vuelve al paso anterior.");
      return;
    }

    setSubmitting(true);
    setStepError("");

    try {
      const uploaded = await uploadParticipationFile(file, bookId, dniLimpio);
      const record = await saveParticipation({
        dni: dniLimpio,
        bookId,
        bookTitle,
        colegio,
        codigoColegio: colegioSeleccionado.codigo,
        grado: bookGrade,
        departamento,
        provincia,
        distrito,
        concursante: concursante.trim(),
        sexo: sexo as Sexo,
        edad: Number(edad),
        apoderado: apoderado.trim(),
        dniApoderado: dniApoderadoLimpio,
        telefonoApoderado: telefonoApoderado.trim() || undefined,
        celularApoderado: celularApoderado.trim(),
        docente: docente.trim(),
        emailDocente: emailDocente.trim(),
        fileName: uploaded.fileName,
        fileUrl: uploaded.fileUrl,
        s3Key: uploaded.s3Key,
      });

      sessionStorage.setItem(
        "loqueleo-inscripcion",
        JSON.stringify({
          bookId,
          bookTitle,
          code: record.code,
          colegio,
          grado: bookGrade,
          dni: dniLimpio,
          concursante: concursante.trim(),
          fileName: uploaded.fileName,
        }),
      );
      window.location.href = `/libro/${bookId}/confirmacion/`;
    } catch (error) {
      setStepError(
        error instanceof Error
          ? error.message
          : "No pudimos registrar tu participación. Revisa los datos e intenta otra vez.",
      );
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setStepError("");
    if (step === 1) {
      window.location.href = `/libro/${bookId}/`;
      return;
    }
    setStep((s) => (s - 1) as WizardStep);
  };

  const isLastStep = step === 5;

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
                      setProvincia("");
                      setDistrito("");
                      setStepError("");
                    }}
                    options={departamentos}
                    placeholder="Elige tu departamento…"
                  />
                </div>
                <div className="wizard-label">
                  <span className="wizard-label-text">Provincia</span>
                  <FormSelect
                    value={provincia}
                    disabled={!departamento}
                    onChange={(next) => {
                      setProvincia(next);
                      setDistrito("");
                      setStepError("");
                    }}
                    options={provincias}
                    placeholder={departamento ? "Elige tu provincia…" : "Primero elige departamento"}
                  />
                </div>
                <div className="wizard-label">
                  <span className="wizard-label-text">Distrito</span>
                  <FormSelect
                    value={distrito}
                    disabled={!provincia}
                    onChange={(next) => {
                      setDistrito(next);
                      setStepError("");
                    }}
                    options={distritos}
                    placeholder={provincia ? "Elige tu distrito…" : "Primero elige provincia"}
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
                    options={colegiosNombres}
                    placeholder="Busca y elige tu colegio…"
                  />
                </div>
                {colegioSeleccionado && (
                  <div className="wizard-label">
                    <span className="wizard-label-text">Código del colegio</span>
                    <p className="form-field form-field--readonly" aria-readonly="true">
                      {colegioSeleccionado.codigo}
                    </p>
                  </div>
                )}
                <div className="wizard-label">
                  <span className="wizard-label-text">Grado</span>
                  <p className="form-field form-field--readonly" aria-readonly="true">
                    {formatGradeLabel(bookGrade)}
                  </p>
                  <p className="wizard-hint">
                    Este reto es solo para {formatGradeLabel(bookGrade)} ({bookAge}). Cada estudiante participa una vez.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="wizard-step">
                <label className="wizard-label">
                  <span className="wizard-label-text">Nombre completo del estudiante</span>
                  <input
                    type="text"
                    className="form-field"
                    placeholder="Como figura en tu DNI"
                    value={concursante}
                    onChange={(e) => {
                      setConcursante(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
                <label className="wizard-label">
                  <span className="wizard-label-text">DNI del estudiante</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    className="form-field"
                    placeholder="8 números"
                    value={dni}
                    onChange={(e) => {
                      setDni(e.target.value.replace(/\D/g, "").slice(0, 8));
                      setStepError("");
                    }}
                  />
                </label>
                <div className="wizard-label">
                  <span className="wizard-label-text">Sexo</span>
                  <FormSelect
                    value={sexo === "M" ? "Masculino" : sexo === "F" ? "Femenino" : ""}
                    onChange={(next) => {
                      setSexo(next === "Masculino" ? "M" : "F");
                      setStepError("");
                    }}
                    options={["Masculino", "Femenino"]}
                    placeholder="Elige…"
                  />
                </div>
                <label className="wizard-label">
                  <span className="wizard-label-text">Edad</span>
                  <input
                    type="number"
                    min={5}
                    max={20}
                    className="form-field"
                    placeholder="Años cumplidos"
                    value={edad}
                    onChange={(e) => {
                      setEdad(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="wizard-step">
                <label className="wizard-label">
                  <span className="wizard-label-text">Nombre del apoderado</span>
                  <input
                    type="text"
                    className="form-field"
                    value={apoderado}
                    onChange={(e) => {
                      setApoderado(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
                <label className="wizard-label">
                  <span className="wizard-label-text">DNI del apoderado</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    className="form-field"
                    value={dniApoderado}
                    onChange={(e) => {
                      setDniApoderado(e.target.value.replace(/\D/g, "").slice(0, 8));
                      setStepError("");
                    }}
                  />
                </label>
                <label className="wizard-label">
                  <span className="wizard-label-text">Celular del apoderado</span>
                  <input
                    type="tel"
                    className="form-field"
                    placeholder="Obligatorio"
                    value={celularApoderado}
                    onChange={(e) => {
                      setCelularApoderado(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
                <label className="wizard-label">
                  <span className="wizard-label-text">Teléfono fijo (opcional)</span>
                  <input
                    type="tel"
                    className="form-field"
                    value={telefonoApoderado}
                    onChange={(e) => setTelefonoApoderado(e.target.value)}
                  />
                </label>
                <label className="wizard-label">
                  <span className="wizard-label-text">Nombre del docente</span>
                  <input
                    type="text"
                    className="form-field"
                    value={docente}
                    onChange={(e) => {
                      setDocente(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
                <label className="wizard-label">
                  <span className="wizard-label-text">Correo del docente</span>
                  <input
                    type="email"
                    className="form-field"
                    placeholder="nombre@colegio.edu.pe"
                    value={emailDocente}
                    onChange={(e) => {
                      setEmailDocente(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
              </div>
            )}

            {step === 5 && (
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
            {(stepError || (isLastStep && fileError)) && (
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
            <div className="wizard-actions-forward">
              <button
                type="button"
                onClick={goNext}
                disabled={checkingDni}
                className={[
                  "wizard-btn wizard-btn--primary",
                  isLastStep ? "wizard-btn--hidden" : "",
                ].join(" ")}
                style={{ background: accent }}
                aria-hidden={isLastStep}
                tabIndex={isLastStep ? -1 : 0}
              >
                {checkingDni ? "Verificando DNI…" : "Siguiente"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className={[
                  "wizard-btn wizard-btn--primary disabled:opacity-40",
                  !isLastStep ? "wizard-btn--hidden" : "",
                ].join(" ")}
                style={{ background: accent }}
                aria-hidden={!isLastStep}
                tabIndex={!isLastStep ? -1 : 0}
              >
                {submitting ? "Enviando tu trabajo…" : "¡Enviar mi trabajo!"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
