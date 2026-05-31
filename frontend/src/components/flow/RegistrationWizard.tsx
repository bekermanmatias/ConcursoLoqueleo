import { useEffect, useMemo, useState, type CSSProperties } from "react";
import FileDropzone from "./FileDropzone";
import FormSelect from "./FormSelect";
import PersonNameFields from "./PersonNameFields";
import WizardAlert from "./WizardAlert";
import { joinPersonName } from "../../lib/person-name";
import { fetchPublicConcurso } from "../../lib/concurso";
import { inscripcionesEstanAbiertas } from "../../lib/inscripciones";
import {
  normalizePersonNamePart,
  validateDocenteEmail,
  validateFileForFormatos,
  validatePersonNamePart,
} from "../../lib/participation-validation";
import { WizardJourneyHead, WizardProgressBar, type WizardStep } from "./WizardProgress";
import {
  getParticipationErrorMessage,
  isDniBlockedForRegistration,
  saveParticipation,
} from "../../lib/participations";
import { uploadParticipationFile } from "../../lib/uploads";
import {
  fetchDepartamentos,
  fetchDistritos,
  fetchProvincias,
  toSelectOptions,
  type Departamento,
  type Distrito,
  type Provincia,
} from "../../lib/ubigeo";
import {
  colegiosMock,
  colegiosNombres,
  type Grado,
  type Sexo,
} from "../../data/locations";

interface Props {
  bookId: string;
  bookTitle: string;
  bookGrade: Grado;
  bookFormats: string[];
  accent: string;
  termsPdfUrl: string;
}

export default function RegistrationWizard({
  bookId,
  bookTitle,
  bookGrade,
  bookFormats,
  accent,
  termsPdfUrl,
}: Props) {
  const [step, setStep] = useState<WizardStep>(1);
  const [departamentoId, setDepartamentoId] = useState("");
  const [provinciaId, setProvinciaId] = useState("");
  const [distritoId, setDistritoId] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [ubigeoLoading, setUbigeoLoading] = useState(true);
  const [ubigeoError, setUbigeoError] = useState("");
  const [colegio, setColegio] = useState("");
  const [concursanteNombres, setConcursanteNombres] = useState("");
  const [concursanteApellidos, setConcursanteApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [sexo, setSexo] = useState<Sexo | "">("");
  const [apoderadoNombres, setApoderadoNombres] = useState("");
  const [apoderadoApellidos, setApoderadoApellidos] = useState("");
  const [dniApoderado, setDniApoderado] = useState("");
  const [celularApoderado, setCelularApoderado] = useState("");
  const [docenteNombres, setDocenteNombres] = useState("");
  const [docenteApellidos, setDocenteApellidos] = useState("");
  const [emailDocente, setEmailDocente] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dniChecking, setDniChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchDepartamentos()
      .then((rows) => {
        if (!cancelled) {
          setDepartamentos(rows);
          setUbigeoError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUbigeoError("No pudimos cargar los departamentos. Recarga la página e intenta otra vez.");
        }
      })
      .finally(() => {
        if (!cancelled) setUbigeoLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!departamentoId) {
      setProvincias([]);
      return;
    }

    let cancelled = false;
    setUbigeoError("");

    fetchProvincias(Number(departamentoId))
      .then((rows) => {
        if (!cancelled) setProvincias(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setUbigeoError("No pudimos cargar las provincias. Elige el departamento otra vez.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [departamentoId]);

  useEffect(() => {
    if (!provinciaId) {
      setDistritos([]);
      return;
    }

    let cancelled = false;
    setUbigeoError("");

    fetchDistritos(Number(provinciaId))
      .then((rows) => {
        if (!cancelled) setDistritos(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setUbigeoError("No pudimos cargar los distritos. Elige la provincia otra vez.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [provinciaId]);

  const departamentoOptions = useMemo(() => toSelectOptions(departamentos), [departamentos]);
  const provinciaOptions = useMemo(() => toSelectOptions(provincias), [provincias]);
  const distritoOptions = useMemo(() => toSelectOptions(distritos), [distritos]);

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
      const docenteNombreErr =
        validatePersonNamePart(docenteNombres, "docente", "nombres") ??
        validatePersonNamePart(docenteApellidos, "docente", "apellidos");
      if (docenteNombreErr) return docenteNombreErr;
      const emailErr = validateDocenteEmail(emailDocente);
      if (emailErr) return emailErr;
      return null;
    }
    if (currentStep === 3) {
      const estudianteNombreErr =
        validatePersonNamePart(concursanteNombres, "estudiante", "nombres") ??
        validatePersonNamePart(concursanteApellidos, "estudiante", "apellidos");
      if (estudianteNombreErr) return estudianteNombreErr;
      if (dniLimpio.length !== 8) return "Escribe tu DNI (8 números).";
      if (!sexo) return "Elige tu género.";
      return null;
    }
    if (currentStep === 4) {
      const apoderadoNombreErr =
        validatePersonNamePart(apoderadoNombres, "apoderado", "nombres") ??
        validatePersonNamePart(apoderadoApellidos, "apoderado", "apellidos");
      if (apoderadoNombreErr) return apoderadoNombreErr;
      if (dniApoderadoLimpio.length !== 8) return "Escribe el DNI de tu apoderado (8 números).";
      if (!celularApoderado.trim()) return "Escribe un celular de contacto.";
      return null;
    }
    if (currentStep === 5 && file) {
      const fileErr = validateFileForFormatos(file.name, bookFormats);
      if (fileErr) return fileErr;
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
      setDniChecking(true);
      setStepError("");
      try {
        const blocked = await isDniBlockedForRegistration(dniLimpio);
        if (blocked) {
          setStepError("Este DNI ya participó en un reto. Solo puedes inscribirte una vez.");
          return;
        }
      } catch {
        setStepError("No pudimos verificar tu DNI. Revisa tu conexión e intenta otra vez.");
        return;
      } finally {
        setDniChecking(false);
      }
    }

    setStepError("");
    setStep((s) => (s + 1) as WizardStep);
  };

  const submit = async () => {
    const stepErr = validateStep(5);
    if (stepErr) {
      setStepError(stepErr);
      return;
    }
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
      const concurso = await fetchPublicConcurso();
      if (!inscripcionesEstanAbiertas(concurso)) {
        setStepError("Las inscripciones están cerradas. Ya no es posible enviar trabajos.");
        setSubmitting(false);
        return;
      }

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
        concursanteNombres: normalizePersonNamePart(concursanteNombres),
        concursanteApellidos: normalizePersonNamePart(concursanteApellidos),
        sexo: sexo as Sexo,
        apoderadoNombres: normalizePersonNamePart(apoderadoNombres),
        apoderadoApellidos: normalizePersonNamePart(apoderadoApellidos),
        dniApoderado: dniApoderadoLimpio,
        celularApoderado: celularApoderado.trim(),
        docenteNombres: normalizePersonNamePart(docenteNombres),
        docenteApellidos: normalizePersonNamePart(docenteApellidos),
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
          concursante: joinPersonName(concursanteNombres, concursanteApellidos),
          fileName: uploaded.fileName,
        }),
      );
      window.location.href = `/libro/${bookId}/confirmacion/`;
    } catch (error) {
      setStepError(getParticipationErrorMessage(error));
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

  const alertMessage =
    stepError || (isLastStep && fileError) || (step === 1 && ubigeoError) || "";

  const dismissAlert = () => {
    setStepError("");
    setFileError("");
    setUbigeoError("");
  };

  return (
    <div className="wizard" style={{ "--field-accent": accent } as CSSProperties}>
      <WizardProgressBar step={step} />
      <div className="wizard-main">
        <WizardJourneyHead step={step} />

        <div className="wizard-panel">
          <div className={step === 5 ? "wizard-step-slot wizard-step-slot--scroll" : "wizard-step-slot"}>
            {step === 1 && (
              <div className="wizard-step">
                {ubigeoLoading && (
                  <p className="wizard-hint text-gray-600 bg-gray-50">Cargando departamentos…</p>
                )}
                <div className="wizard-label">
                  <span className="wizard-label-text">Departamento</span>
                  <FormSelect
                    accent={accent}
                    value={departamentoId}
                    disabled={ubigeoLoading || departamentoOptions.length === 0}
                    onChange={(nextId) => {
                      const selected = departamentos.find((row) => String(row.id) === nextId);
                      setDepartamentoId(nextId);
                      setDepartamento(selected?.nombre ?? "");
                      setProvinciaId("");
                      setProvincia("");
                      setDistritoId("");
                      setDistrito("");
                      setStepError("");
                    }}
                    options={departamentoOptions}
                    placeholder="Elige tu departamento…"
                  />
                </div>
                <div className="wizard-label">
                  <span className="wizard-label-text">Provincia</span>
                  <FormSelect
                    accent={accent}
                    value={provinciaId}
                    disabled={!departamentoId || provinciaOptions.length === 0}
                    onChange={(nextId) => {
                      const selected = provincias.find((row) => String(row.id) === nextId);
                      setProvinciaId(nextId);
                      setProvincia(selected?.nombre ?? "");
                      setDistritoId("");
                      setDistrito("");
                      setStepError("");
                    }}
                    options={provinciaOptions}
                    placeholder={departamentoId ? "Elige tu provincia…" : "Primero elige departamento"}
                  />
                </div>
                <div className="wizard-label">
                  <span className="wizard-label-text">Distrito</span>
                  <FormSelect
                    accent={accent}
                    value={distritoId}
                    disabled={!provinciaId || distritoOptions.length === 0}
                    onChange={(nextId) => {
                      const selected = distritos.find((row) => String(row.id) === nextId);
                      setDistritoId(nextId);
                      setDistrito(selected?.nombre ?? "");
                      setStepError("");
                    }}
                    options={distritoOptions}
                    placeholder={provinciaId ? "Elige tu distrito…" : "Primero elige provincia"}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="wizard-step">
                <div className="wizard-label">
                  <span className="wizard-label-text">Colegio</span>
                  <FormSelect
                    accent={accent}
                    value={colegio}
                    onChange={(next) => {
                      setColegio(next);
                      setStepError("");
                    }}
                    options={colegiosNombres}
                    placeholder="Busca y elige tu colegio…"
                  />
                </div>
                <PersonNameFields
                  nombresLabel="Nombre del docente"
                  apellidosLabel="Apellido del docente"
                  nombres={docenteNombres}
                  apellidos={docenteApellidos}
                  onNombresChange={(value) => {
                    setDocenteNombres(value);
                    setStepError("");
                  }}
                  onApellidosChange={(value) => {
                    setDocenteApellidos(value);
                    setStepError("");
                  }}
                />
                <label className="wizard-label">
                  <span className="wizard-label-text">Correo del docente</span>
                  <input
                    type="email"
                    className="form-field"
                    placeholder="nombre@colegio.edu.pe"
                    maxLength={255}
                    value={emailDocente}
                    onChange={(e) => {
                      setEmailDocente(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="wizard-step">
                <PersonNameFields
                  nombresLabel="Tu nombre"
                  apellidosLabel="Tu apellido"
                  nombres={concursanteNombres}
                  apellidos={concursanteApellidos}
                  onNombresChange={(value) => {
                    setConcursanteNombres(value);
                    setStepError("");
                  }}
                  onApellidosChange={(value) => {
                    setConcursanteApellidos(value);
                    setStepError("");
                  }}
                />
                <label className="wizard-label">
                  <span className="wizard-label-text">DNI</span>
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
                  <span className="wizard-label-text">Género</span>
                  <FormSelect
                    accent={accent}
                    value={sexo === "M" ? "Masculino" : sexo === "F" ? "Femenino" : ""}
                    onChange={(next) => {
                      setSexo(next === "Masculino" ? "M" : "F");
                      setStepError("");
                    }}
                    options={["Masculino", "Femenino"]}
                    placeholder="Elige tu género…"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="wizard-step">
                <PersonNameFields
                  nombresLabel="Nombre del apoderado"
                  apellidosLabel="Apellido del apoderado"
                  nombres={apoderadoNombres}
                  apellidos={apoderadoApellidos}
                  onNombresChange={(value) => {
                    setApoderadoNombres(value);
                    setStepError("");
                  }}
                  onApellidosChange={(value) => {
                    setApoderadoApellidos(value);
                    setStepError("");
                  }}
                />
                <label className="wizard-label">
                  <span className="wizard-label-text">DNI</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    className="form-field"
                    placeholder="8 números"
                    value={dniApoderado}
                    onChange={(e) => {
                      setDniApoderado(e.target.value.replace(/\D/g, "").slice(0, 8));
                      setStepError("");
                    }}
                  />
                </label>
                <label className="wizard-label">
                  <span className="wizard-label-text">Celular</span>
                  <input
                    type="tel"
                    className="form-field"
                    placeholder="Ej. 999 888 777"
                    value={celularApoderado}
                    onChange={(e) => {
                      setCelularApoderado(e.target.value);
                      setStepError("");
                    }}
                  />
                </label>
              </div>
            )}

            {step === 5 && (
              <div className="wizard-step">
                <FileDropzone
                  allowedFormatos={bookFormats}
                  onFile={(f) => {
                    setFile(f);
                    if (f) setFileError("");
                  }}
                  onValidationError={setFileError}
                  error={fileError}
                />
                <p className="wizard-hint mt-4 text-sm text-gray-600">
                  Al enviar tu trabajo aceptas los{" "}
                  <a
                    href={termsPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2"
                    style={{ color: accent }}
                  >
                    términos y condiciones
                  </a>{" "}
                  del concurso.
                </p>
              </div>
            )}
          </div>

          <div className="wizard-footer">
            <div aria-live="polite">
              {alertMessage ? (
                <WizardAlert message={alertMessage} onClose={dismissAlert} />
              ) : null}
            </div>

            {step === 3 && dniChecking && (
              <p className="wizard-hint text-gray-600 bg-gray-50">Consultando tu DNI…</p>
            )}
            <div className="wizard-actions">
            <button
              type="button"
              onClick={goBack}
              disabled={dniChecking || submitting}
              className="wizard-btn wizard-btn--outline"
              style={{ borderColor: accent, color: accent }}
            >
              Atrás
            </button>
            <div className="wizard-actions-forward">
              <button
                type="button"
                onClick={() => void goNext()}
                disabled={dniChecking || submitting}
                className={[
                  "wizard-btn wizard-btn--primary",
                  isLastStep ? "wizard-btn--hidden" : "",
                ].join(" ")}
                style={{ background: accent }}
                aria-hidden={isLastStep}
                tabIndex={isLastStep ? -1 : 0}
              >
                {step === 3 && dniChecking ? "Consultando…" : "Siguiente"}
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
    </div>
  );
}
