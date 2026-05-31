import { PERSON_NAME_MAX_LENGTH } from "../../lib/participation-validation";

interface Props {
  nombresLabel: string;
  apellidosLabel: string;
  nombres: string;
  apellidos: string;
  nombresPlaceholder?: string;
  apellidosPlaceholder?: string;
  onNombresChange: (value: string) => void;
  onApellidosChange: (value: string) => void;
}

export default function PersonNameFields({
  nombresLabel,
  apellidosLabel,
  nombres,
  apellidos,
  nombresPlaceholder = "Ej. María",
  apellidosPlaceholder = "Ej. López García",
  onNombresChange,
  onApellidosChange,
}: Props) {
  return (
    <>
      <label className="wizard-label">
        <span className="wizard-label-text">{nombresLabel}</span>
        <input
          type="text"
          className="form-field"
          placeholder={nombresPlaceholder}
          maxLength={PERSON_NAME_MAX_LENGTH}
          value={nombres}
          onChange={(e) => onNombresChange(e.target.value)}
        />
      </label>
      <label className="wizard-label">
        <span className="wizard-label-text">{apellidosLabel}</span>
        <input
          type="text"
          className="form-field"
          placeholder={apellidosPlaceholder}
          maxLength={PERSON_NAME_MAX_LENGTH}
          value={apellidos}
          onChange={(e) => onApellidosChange(e.target.value)}
        />
      </label>
    </>
  );
}
