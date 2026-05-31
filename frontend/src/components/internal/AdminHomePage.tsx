import InternalAppShell from "./InternalAppShell";
import AdminDashboard from "./AdminDashboard";

export default function AdminHomePage() {
  return (
    <InternalAppShell activeNav="resumen">
      <AdminDashboard />
    </InternalAppShell>
  );
}
