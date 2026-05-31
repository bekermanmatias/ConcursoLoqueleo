import InternalAppShell from "./InternalAppShell";
import TrabajoDetailPanel from "./TrabajoDetailPanel";

export default function JuradoDetallePage() {
  return (
    <InternalAppShell activeNav="trabajos">
      <TrabajoDetailPanel />
    </InternalAppShell>
  );
}
