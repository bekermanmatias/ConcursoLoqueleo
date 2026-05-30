import RocketMarker from "./RocketMarker";

type Step = 1 | 2 | 3;

interface StepConfig {
  percent: number;
  title: string;
  titleAccent: string;
  description: string;
}

const stepConfig: Record<Step, StepConfig> = {
  1: {
    percent: 25,
    title: "¿Desde dónde",
    titleAccent: "envías tu trabajo?",
    description:
      "Elige tu departamento, ciudad y distrito. Así sabremos desde qué lugar del Perú participas.",
  },
  2: {
    percent: 55,
    title: "¿En qué colegio",
    titleAccent: "estudias?",
    description:
      "Elige tu colegio y escribe tu DNI. Con eso completamos tu participación (un solo reto por estudiante).",
  },
  3: {
    percent: 82,
    title: "¡Es hora de",
    titleAccent: "subir tu trabajo!",
    description:
      "Arrastra tu archivo o haz clic para elegirlo. Solo falta este paso para enviar tu participación.",
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
