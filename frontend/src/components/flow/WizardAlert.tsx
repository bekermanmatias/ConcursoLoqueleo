interface Props {
  message: string;
  onClose: () => void;
}

export default function WizardAlert({ message, onClose }: Props) {
  return (
    <div className="wizard-alert" role="alert">
      {message}
      <button
        type="button"
        className="wizard-alert__close"
        aria-label="Cerrar"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
