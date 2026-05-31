import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createInternalUser,
  deleteInternalUser,
  fetchInternalUsers,
  updateInternalUser,
  USERS_PAGE_SIZE,
} from "../../lib/internal-api";
import { getStoredUser, type InternalUser, type RolUsuario } from "../../lib/auth";
import { rolLabels } from "../../data/internal-nav";
import { useInternalToast } from "../../lib/internal-toast";


const ROLES: RolUsuario[] = ["admin", "jurado"];
const ROLES_FILTER: (RolUsuario | "")[] = ["", ...ROLES];
const PAGE_SIZE = USERS_PAGE_SIZE;

interface UsuariosFilters {
  q: string;
  rol: RolUsuario | "";
}

const EMPTY_FILTERS: UsuariosFilters = {
  q: "",
  rol: "",
};

function filtersToParams(filters: UsuariosFilters) {
  return {
    q: filters.q.trim() || undefined,
    rol: filters.rol || undefined,
  };
}

type UserFormState = {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
};

const emptyForm = (): UserFormState => ({
  nombre: "",
  email: "",
  password: "",
  rol: "jurado",
});

export default function UsuariosPanel() {
  const [createOpen, setCreateOpen] = useState(false);
  const { showToast } = useInternalToast();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<UsuariosFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<UsuariosFilters>(EMPTY_FILTERS);
  const [editUser, setEditUser] = useState<InternalUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<InternalUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.rol !== "admin") {
      window.location.href = "/interno/jurado/";
      return;
    }
    setCurrentUserId(user.id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInternalUsers({
        ...filtersToParams(appliedFilters),
        page,
        limit: PAGE_SIZE,
      });
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      if (data.page && data.page !== page) setPage(data.page);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, showToast]);

  useEffect(() => {
    if (currentUserId === null) return;
    void load();
  }, [currentUserId, load]);

  useEffect(() => {
    if (createOpen) setForm(emptyForm());
  }, [createOpen]);

  const hasActiveFilters = useMemo(
    () => appliedFilters.q.trim() !== "" || appliedFilters.rol !== "",
    [appliedFilters],
  );

  const totalPagesDisplay = totalPages || Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, total);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const openEdit = (user: InternalUser) => {
    setForm({
      nombre: user.nombre,
      email: user.email,
      password: "",
      rol: user.rol,
    });
    setEditUser(user);
  };

  const closeModals = () => {
    if (saving) return;
    setCreateOpen(false);
    setEditUser(null);
    setDeleteUser(null);
    setForm(emptyForm());
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      showToast("error", "Completa nombre, email y contraseña.");
      return;
    }
    if (form.password.length < 6) {
      showToast("error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSaving(true);
    try {
      await createInternalUser({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: form.rol,
      });
      setCreateOpen(false);
      setForm(emptyForm());
      setPage(1);
      await load();
      showToast("success", "Usuario creado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editUser) return;
    if (!form.nombre.trim() || !form.email.trim()) {
      showToast("error", "Nombre y email son obligatorios.");
      return;
    }
    if (form.password && form.password.length < 6) {
      showToast("error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSaving(true);
    try {
      await updateInternalUser(editUser.id, {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        rol: form.rol,
        ...(form.password ? { password: form.password } : {}),
      });
      setEditUser(null);
      setForm(emptyForm());
      await load();
      showToast("success", "Usuario actualizado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo actualizar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const changeRol = async (user: InternalUser, rol: RolUsuario) => {
    if (user.rol === rol) return;
    setSaving(true);
    try {
      await updateInternalUser(user.id, { rol });
      await load();
      showToast("success", `Rol actualizado a ${rolLabels[rol]}.`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo cambiar el rol.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      await deleteInternalUser(deleteUser.id);
      setDeleteUser(null);
      const nextPage =
        users.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else await load();
      showToast("success", "Usuario eliminado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo eliminar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  if (currentUserId === null) {
    return <p className="internal-muted">Cargando…</p>;
  }

  return (
    <div className="internal-panel internal-panel--dense">
      <header className="internal-header internal-header--compact internal-header--with-actions">
        <h1 className="internal-title">
          Usuarios
          <span className="internal-title__meta">
            {total} usuario{total === 1 ? "" : "s"}
          </span>
        </h1>
        <div className="internal-header-actions">
          <button
            type="button"
            className="internal-btn internal-btn--primary"
            onClick={() => setCreateOpen(true)}
          >
            Nuevo usuario
          </button>
        </div>
      </header>

      <section
        className="internal-search-toolbar internal-search-toolbar--compact"
        aria-label="Filtros de usuarios"
      >
        <div className="internal-search-bar">
          <input
            type="search"
            placeholder="Buscar por nombre o email…"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            className="form-field internal-search-bar__input"
            aria-label="Buscar usuarios"
          />

          <label className="internal-quick-filter">
            <span className="sr-only">Rol</span>
            <select
              value={filters.rol}
              onChange={(e) => setFilters((prev) => ({ ...prev, rol: e.target.value as RolUsuario | "" }))}
              className="form-field internal-quick-filter__select"
              aria-label="Filtrar por rol"
            >
              {ROLES_FILTER.map((value) => (
                <option key={value || "all"} value={value}>
                  {value ? rolLabels[value] : "Todos los roles"}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn-primary internal-search-bar__submit"
            onClick={applyFilters}
          >
            Buscar
          </button>
        </div>

        {hasActiveFilters && (
          <div className="internal-active-filters">
            {appliedFilters.q.trim() && (
              <span className="internal-active-filter">
                Búsqueda: «{appliedFilters.q.trim()}»
              </span>
            )}
            {appliedFilters.rol && (
              <span className="internal-active-filter">
                Rol: {rolLabels[appliedFilters.rol]}
              </span>
            )}
            <button type="button" className="internal-active-filters__clear" onClick={clearFilters}>
              Limpiar
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <p className="internal-muted">Cargando usuarios…</p>
      ) : users.length === 0 ? (
        <p className="internal-muted">
          {hasActiveFilters
            ? "No hay usuarios con esos filtros."
            : "No hay usuarios registrados."}
        </p>
      ) : (
        <>
          <div className="internal-table-wrap internal-table-wrap--scroll">
            <table className="internal-table internal-table--dense">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="internal-cell-truncate" title={user.nombre}>
                      {user.nombre}
                      {user.id === currentUserId && (
                        <span className="internal-table-sub">Tú</span>
                      )}
                    </td>
                    <td className="internal-cell-truncate internal-cell-truncate--book" title={user.email}>
                      {user.email}
                    </td>
                    <td>
                      <select
                        value={user.rol}
                        disabled={saving}
                        onChange={(e) => void changeRol(user, e.target.value as RolUsuario)}
                        className={`internal-rol-select internal-rol-select--${user.rol}`}
                        aria-label={`Rol de ${user.nombre}`}
                      >
                        {ROLES.map((rol) => (
                          <option key={rol} value={rol}>
                            {rolLabels[rol]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="internal-table-actions">
                        <button
                          type="button"
                          className="internal-link"
                          disabled={saving}
                          onClick={() => openEdit(user)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="internal-link internal-link--danger"
                          disabled={saving || user.id === currentUserId}
                          onClick={() => setDeleteUser(user)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="internal-pagination" aria-label="Paginación de usuarios">
            <p className="internal-pagination__info">
              {total === 0
                ? "Sin resultados"
                : `Mostrando ${pageStart}–${pageEnd} de ${total}`}
            </p>
            <div className="internal-pagination__actions">
              <button
                type="button"
                className="internal-btn internal-btn--outline"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="internal-pagination__page">
                Página {total === 0 ? 0 : page} de {total === 0 ? 0 : totalPagesDisplay}
              </span>
              <button
                type="button"
                className="internal-btn internal-btn--outline"
                disabled={loading || page >= totalPagesDisplay || total === 0}
                onClick={() => setPage((p) => Math.min(totalPagesDisplay, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </nav>
        </>
      )}

      {createOpen && (
        <div className="internal-modal-backdrop" role="presentation" onClick={closeModals}>
          <div
            className="internal-modal"
            role="dialog"
            aria-labelledby="create-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-user-title" className="internal-modal__title">
              Nuevo usuario
            </h2>
            <form className="internal-user-form" onSubmit={(e) => void submitCreate(e)}>
              <UserFormFields form={form} setForm={setForm} includePassword requiredPassword />
              <div className="internal-modal__actions">
                <button
                  type="button"
                  className="internal-btn internal-btn--outline"
                  onClick={closeModals}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando…" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="internal-modal-backdrop" role="presentation" onClick={closeModals}>
          <div
            className="internal-modal"
            role="dialog"
            aria-labelledby="edit-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-user-title" className="internal-modal__title">
              Editar usuario
            </h2>
            <p className="internal-modal__text">{editUser.email}</p>
            <form className="internal-user-form" onSubmit={(e) => void submitEdit(e)}>
              <UserFormFields
                form={form}
                setForm={setForm}
                includePassword
                passwordPlaceholder="Dejar vacío para no cambiar"
              />
              <div className="internal-modal__actions">
                <button
                  type="button"
                  className="internal-btn internal-btn--outline"
                  onClick={closeModals}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="internal-modal-backdrop" role="presentation" onClick={closeModals}>
          <div
            className="internal-modal"
            role="dialog"
            aria-labelledby="delete-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-user-title" className="internal-modal__title">
              Eliminar usuario
            </h2>
            <p className="internal-modal__text">
              ¿Eliminar a <strong>{deleteUser.nombre}</strong> ({deleteUser.email})? Esta acción no
              se puede deshacer.
            </p>
            <div className="internal-modal__actions">
              <button
                type="button"
                className="internal-btn internal-btn--outline"
                onClick={closeModals}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="internal-btn internal-btn--danger"
                onClick={() => void confirmDelete()}
                disabled={saving}
              >
                {saving ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserFormFields({
  form,
  setForm,
  includePassword,
  requiredPassword,
  passwordPlaceholder = "Mínimo 6 caracteres",
}: {
  form: UserFormState;
  setForm: (form: UserFormState) => void;
  includePassword?: boolean;
  requiredPassword?: boolean;
  passwordPlaceholder?: string;
}) {
  return (
    <>
      <label className="internal-field internal-user-form__field">
        <span>Nombre</span>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="form-field internal-input"
          autoFocus
          required
        />
      </label>

      <label className="internal-field internal-user-form__field">
        <span>Email</span>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="form-field internal-input"
          required
        />
      </label>

      <label className="internal-field internal-user-form__field">
        <span>Rol</span>
        <select
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value as RolUsuario })}
          className="form-field internal-select"
        >
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {rolLabels[rol]}
            </option>
          ))}
        </select>
      </label>

      {includePassword && (
        <label className="internal-field internal-user-form__field">
          <span>Contraseña</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="form-field internal-input"
            placeholder={passwordPlaceholder}
            required={requiredPassword}
            minLength={requiredPassword ? 6 : undefined}
            autoComplete="new-password"
          />
        </label>
      )}
    </>
  );
}
