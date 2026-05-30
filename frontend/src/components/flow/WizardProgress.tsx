import RocketMarker from "./RocketMarker";

type Step = 1 | 2 | 3 | 4 | 5;

interface StepConfig {
  percent: number;
  title: string;
  titleAccent: string;
  description: string;
}

const stepConfig: Record<Step, StepConfig> = {
  1: {
    percent: 15,
    title: "¿Desde dónde",
    titleAccent: "participas?",
    description:
      "Elige departamento, provincia y distrito. Así ubicamos tu colegio en el Perú.",
  },
  2: {
    percent: 32,
    title: "¿En qué colegio",
    titleAccent: "estudias?",
    description:
      "Elige tu colegio. El grado ya está fijado por el reto del libro que elegiste.",
  },
  3: {
    percent: 50,
    title: "Datos del",
    titleAccent: "estudiante",
    description:
      "Escribe tu nombre completo, DNI, sexo y edad. Un solo reto por estudiante.",
  },
  4: {
    percent: 68,
    title: "Apoderado",
    titleAccent: "y docente",
    description:
      "Datos de contacto del apoderado y del docente a cargo en tu colegio.",
  },
  5: {
    percent: 88,
    title: "¡Es hora de",
    titleAccent: "subir tu trabajo!",
    description:
      "Arrastra tu archivo o haz clic para elegirlo. Solo falta este paso para enviar.",
  },
};

const MOON_END = encodeURI("/cohete/image 319.png");

interface Props {
  step: Step;
}

export function WizardProgressBar({ step }: Props) {
  const { percent } = stepConfig[step];

  return (
    <div className="wizard-progress">
      <div className="wizard-progress-rail">
        <div className="wizard-progress-track">
          <div className="wizard-progress-fill" style={{ width: `${percent}%` }}>
            <span className="wizard-progress-marker">
              <RocketMarker />
            </span>
          </div>
          <img
            src={MOON_END}
            alt=""
            className="wizard-progress-planet wizard-progress-planet--end"
            width={128}
            height={128}
            decoding="async"
            draggable={false}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

export function WizardJourneyHead({ step }: Props) {
  const { title, titleAccent, description } = stepConfig[step];

  return (
    <header className="wizard-journey-head">
      <h1 className="wizard-journey-title">
        {title}{" "}
        <span className="wizard-journey-accent">{titleAccent}</span>
      </h1>
      <p className="wizard-journey-desc">{description}</p>
    </header>
  );
}

export type WizardStep = Step;
