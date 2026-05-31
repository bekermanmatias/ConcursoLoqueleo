import InternalAppShell from "./InternalAppShell";
import TrabajosPanel from "./TrabajosPanel";

export default function JuradoTrabajosPage() {
  return (
    <InternalAppShell activeNav="trabajos">
      <TrabajosPanel />
    </InternalAppShell>
  );
}
