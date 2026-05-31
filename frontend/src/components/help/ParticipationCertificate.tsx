import { formatGradeLabel } from "../../lib/books";
import { formatParticipationDate } from "../../lib/participations";
import type { ParticipationRecord } from "../../data/participations";

interface Props {
  record: ParticipationRecord;
}

export default function ParticipationCertificate({ record }: Props) {
  return (
    <div className="participation-certificate" id="participation-certificate">
      <div className="participation-certificate-inner">
        <p className="participation-certificate-brand">Soy Loqueleo 2026</p>
        <h2 className="participation-certificate-title">Constancia de participación</h2>
        <p className="participation-certificate-text">
          Se certifica que{" "}
          <strong>
            {record.concursante ||
              [record.concursanteNombres, record.concursanteApellidos].filter(Boolean).join(" ")}
          </strong>{" "}
          (DNI <strong>{record.dni}</strong>), del <strong>{record.colegio}</strong> (
          {formatGradeLabel(record.grado)}), participó en el concurso con la obra{" "}
          <em>{record.bookTitle}</em>.
        </p>
        <dl className="participation-certificate-meta">
          <div>
            <dt>Código</dt>
            <dd>{record.code}</dd>
          </div>
          <div>
            <dt>Archivo enviado</dt>
            <dd>{record.fileName}</dd>
          </div>
          <div>
            <dt>Fecha de envío</dt>
            <dd>{formatParticipationDate(record.submittedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
