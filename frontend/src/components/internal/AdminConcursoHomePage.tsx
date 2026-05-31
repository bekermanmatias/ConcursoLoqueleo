import InternalAppShell from "./InternalAppShell";
import ConcursoConfigPanel from "./ConcursoConfigPanel";

export default function AdminConcursoHomePage() {
  return (
    <InternalAppShell activeNav="configuracion-concurso">
      <ConcursoConfigPanel />
    </InternalAppShell>
  );
}
