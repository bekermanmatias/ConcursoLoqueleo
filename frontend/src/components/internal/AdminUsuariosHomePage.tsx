import InternalAppShell from "./InternalAppShell";
import AdminUsuariosPage from "./AdminUsuariosPage";

export default function AdminUsuariosHomePage() {
  return (
    <InternalAppShell activeNav="usuarios">
      <AdminUsuariosPage />
    </InternalAppShell>
  );
}
