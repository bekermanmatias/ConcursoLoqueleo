import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bulkDeleteTrabajos,
  bulkUpdateTrabajosEstado,
  DELETE_TRABAJOS_CONFIRM_WORD,
  estadoLabels,
  fetchTrabajos,
  fetchTrabajosFiltros,
  openTrabajoArchivo,
  tipoArchivoLabels,
  updateTrabajoEstado,
  type EstadoTrabajo,
  type EvaluacionFiltro,
  type TrabajoListItem,
  type TrabajosFilterOptions,
} from "../../lib/internal-api";
import { getStoredUser } from "../../lib/auth";
import { useInternalToast } from "../../lib/internal-toast";

const ESTADOS: (EstadoTrabajo | "")[] = ["", "recibido", "en_revision", "finalista", "ganador"];
const ESTADOS_TRABAJO: EstadoTrabajo[] = ["recibido", "en_revision", "finalista", "ganador"];
const EVALUACIONES: (EvaluacionFiltro | "")[] = ["", "pendiente", "evaluado"];

const QUICK_FILTER_KEYS = ["gradoId", "estado"] as const;
const ADVANCED_FILTER_KEYS = [
  "evaluacion",
  "libro",
  "colegioId",
  "departamento",
  "provincia",
  "distrito",
  "tipoArchivo",
  "sexo",
  "fechaDesde",
  "fechaHasta",
] as const;

interface TrabajosFilters {
  q: string;
  estado: EstadoTrabajo | "";
  gradoId: string;
  colegioId: string;
  libro: string;
  departamento: string;
  provincia: string;
  distrito: string;
  tipoArchivo: TrabajoListItem["tipoArchivo"] | "";
  sexo: "M" | "F" | "";
  fechaDesde: string;
  fechaHasta: string;
  evaluacion: EvaluacionFiltro | "";
}

const EMPTY_FILTERS: TrabajosFilters = {
  q: "",
  estado: "",
  gradoId: "",
  colegioId: "",
  libro: "",
  departamento: "",
  provincia: "",
  distrito: "",
  tipoArchivo: "",
  sexo: "",
  fechaDesde: "",
  fechaHasta: "",
  evaluacion: "",
};

function filtersToParams(filters: TrabajosFilters) {
  return {
    q: filters.q.trim() || undefined,
    estado: filters.estado || undefined,
    gradoId: filters.gradoId ? Number(filters.gradoId) : undefined,
    colegioId: filters.colegioId ? Number(filters.colegioId) : undefined,
    libro: filters.libro || undefined,
    departamento: filters.departamento || undefined,
    provincia: filters.provincia || undefined,
    distrito: filters.distrito || undefined,
    tipoArchivo: filters.tipoArchivo || undefined,
    sexo: filters.sexo || undefined,
    fechaDesde: filters.fechaDesde || undefined,
    fechaHasta: filters.fechaHasta || undefined,
    evaluacion: filters.evaluacion || undefined,
  };
}

function countAdvancedFilters(filters: TrabajosFilters) {
  return ADVANCED_FILTER_KEYS.filter((key) => filters[key] !== "").length;
}

export default function TrabajosPanel() {
  const user = getStoredUser();
  const { showToast } = useInternalToast();
  const filtersRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TrabajoListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<TrabajosFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TrabajosFilters>(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState<TrabajosFilterOptions | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [openingArchivoId, setOpeningArchivoId] = useState<number | null>(null);
  const [savingEstadoId, setSavingEstadoId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<EstadoTrabajo>("recibido");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const provincias = useMemo(() => {
    if (!filterOptions) return [];
    const rows = filters.departamento
      ? filterOptions.ubicaciones.filter((u) => u.departamento === filters.departamento)
      : filterOptions.ubicaciones;
    return [...new Set(rows.map((u) => u.provincia))].sort();
  }, [filterOptions, filters.departamento]);

  const distritos = useMemo(() => {
    if (!filterOptions) return [];
    let rows = filterOptions.ubicaciones;
    if (filters.departamento) {
      rows = rows.filter((u) => u.departamento === filters.departamento);
    }
    if (filters.provincia) {
      rows = rows.filter((u) => u.provincia === filters.provincia);
    }
    return [...new Set(rows.map((u) => u.distrito))].sort();
  }, [filterOptions, filters.departamento, filters.provincia]);

  const departamentos = useMemo(() => {
    if (!filterOptions) return [];
    return [...new Set(filterOptions.ubicaciones.map((u) => u.departamento))].sort();
  }, [filterOptions]);

  const advancedCount = useMemo(() => countAdvancedFilters(appliedFilters), [appliedFilters]);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const data = await fetchTrabajosFiltros();
      setFilterOptions(data);
    } catch (err) {
      setFilterOptions(null);
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudieron cargar las opciones de filtro.",
      );
    } finally {
      setOptionsLoading(false);
    }
  }, [showToast]);

  const load = useCallback(async (nextFilters: TrabajosFilters = appliedFilters) => {
    setLoading(true);
    try {
      const data = await fetchTrabajos(filtersToParams(nextFilters));
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Error al cargar trabajos.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, showToast]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void load(appliedFilters);
  }, [appliedFilters, load]);

  useEffect(() => {
    setSelectedIds((current) => {
      const visible = new Set(items.map((item) => item.id));
      const next = new Set([...current].filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [items]);

  useEffect(() => {
    if (!filtersOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [filtersOpen]);

  const applyFilters = () => {
    setAppliedFilters(filters);
    setFiltersOpen(false);
  };

  const updateFilter = <K extends keyof TrabajosFilters>(key: K, value: TrabajosFilters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departamento") {
        next.provincia = "";
        next.distrito = "";
      } else if (key === "provincia") {
        next.distrito = "";
      }
      return next;
    });
  };

  const updateQuickFilter = <K extends (typeof QUICK_FILTER_KEYS)[number]>(
    key: K,
    value: TrabajosFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setAppliedFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
  };

  const handleOpenArchivo = async (id: number) => {
    setOpeningArchivoId(id);
    try {
      await openTrabajoArchivo(id);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo abrir el archivo.");
    } finally {
      setOpeningArchivoId(null);
    }
  };

  const handleEstadoChange = async (id: number, estado: EstadoTrabajo) => {
    const previous = items.find((item) => item.id === id)?.estado;
    if (!previous || previous === estado) return;

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, estado } : item)),
    );
    setSavingEstadoId(id);

    try {
      await updateTrabajoEstado(id, estado);
    } catch (err) {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, estado: previous } : item)),
      );
      showToast("error", err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    } finally {
      setSavingEstadoId(null);
    }
  };

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someVisibleSelected = items.some((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(items.map((item) => item.id)));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkEstado = async () => {
    if (selectedCount === 0) return;
    setBulkLoading(true);
    const ids = [...selectedIds];
    try {
      const result = await bulkUpdateTrabajosEstado(ids, bulkEstado);
      setItems((current) =>
        current.map((item) =>
          selectedIds.has(item.id) ? { ...item, estado: bulkEstado } : item,
        ),
      );
      showToast(
        "success",
        `Estado actualizado a «${estadoLabels[bulkEstado]}» en ${result.updated} entrega${result.updated === 1 ? "" : "s"}.`,
      );
      setSelectedIds(new Set());
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    } finally {
      setBulkLoading(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (bulkLoading) return;
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0 || deleteConfirmText !== DELETE_TRABAJOS_CONFIRM_WORD) return;
    setBulkLoading(true);
    const ids = [...selectedIds];
    try {
      const result = await bulkDeleteTrabajos(ids, deleteConfirmText);
      setItems((current) => current.filter((item) => !selectedIds.has(item.id)));
      setTotal((current) => Math.max(0, current - result.deleted));
      setSelectedIds(new Set());
      setDeleteModalOpen(false);
      setDeleteConfirmText("");
      showToast(
        "success",
        `${result.deleted} entrega${result.deleted === 1 ? "" : "s"} eliminada${result.deleted === 1 ? "" : "s"} permanentemente.`,
      );
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "No se pudieron eliminar las entregas.");
    } finally {
      setBulkLoading(false);
    }
  };

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => value !== ""),
    [appliedFilters],
  );

  return (
    <div className="internal-panel">
      <header className="internal-header">
        <div>
          <h1 className="internal-title">Trabajos recibidos</h1>
          <p className="internal-subtitle">
            {user?.nombre} · {total} entrega{total === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <section className="internal-search-toolbar" aria-label="Filtros de búsqueda" ref={filtersRef}>
        <div className="internal-search-bar">
          <input
            type="search"
            placeholder="Buscar por DNI, nombre, código, libro o colegio…"
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            className="form-field internal-search-bar__input"
            aria-label="Buscar trabajos"
          />

          <label className="internal-quick-filter">
            <span className="sr-only">Grado</span>
            <select
              value={filters.gradoId}
              onChange={(e) => updateQuickFilter("gradoId", e.target.value)}
              className="form-field internal-quick-filter__select"
              disabled={optionsLoading}
              aria-label="Filtrar por grado"
            >
              <option value="">Todos los grados</option>
              {filterOptions?.grados.map((grado) => (
                <option key={grado.id} value={grado.id}>
                  {grado.label}
                </option>
              ))}
            </select>
          </label>

          <label className="internal-quick-filter">
            <span className="sr-only">Estado</span>
            <select
              value={filters.estado}
              onChange={(e) => updateQuickFilter("estado", e.target.value as EstadoTrabajo | "")}
              className="form-field internal-quick-filter__select"
              aria-label="Filtrar por estado"
            >
              {ESTADOS.map((value) => (
                <option key={value || "all"} value={value}>
                  {value ? estadoLabels[value] : "Todos los estados"}
                </option>
              ))}
            </select>
          </label>

          <div className="internal-search-bar__filters">
            <button
              type="button"
              className={`internal-btn internal-btn--outline internal-filters-toggle${filtersOpen ? " internal-filters-toggle--open" : ""}`}
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-haspopup="true"
            >
              Más filtros
              {advancedCount > 0 && (
                <span className="internal-filters-badge">{advancedCount}</span>
              )}
            </button>

            {filtersOpen && (
              <div className="internal-filters-dropdown" role="dialog" aria-label="Filtros avanzados">
                {optionsLoading && (
                  <p className="internal-muted internal-filters-dropdown__loading">
                    Cargando opciones…
                  </p>
                )}

                <div className="internal-filters-grid">
                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Mi evaluación</span>
                    <select
                      value={filters.evaluacion}
                      onChange={(e) =>
                        updateFilter("evaluacion", e.target.value as EvaluacionFiltro | "")
                      }
                      className="form-field"
                    >
                      {EVALUACIONES.map((value) => (
                        <option key={value || "all"} value={value}>
                          {value === "pendiente"
                            ? "Pendientes"
                            : value === "evaluado"
                              ? "Ya evaluados"
                              : "Todas"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Libro / reto</span>
                    <select
                      value={filters.libro}
                      onChange={(e) => updateFilter("libro", e.target.value)}
                      className="form-field"
                      disabled={optionsLoading}
                    >
                      <option value="">Todos</option>
                      {filterOptions?.libros.map((libro) => (
                        <option key={libro} value={libro}>
                          {libro}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Colegio</span>
                    <select
                      value={filters.colegioId}
                      onChange={(e) => updateFilter("colegioId", e.target.value)}
                      className="form-field"
                      disabled={optionsLoading}
                    >
                      <option value="">Todos</option>
                      {filterOptions?.colegios.map((colegio) => (
                        <option key={colegio.id} value={colegio.id}>
                          {colegio.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Departamento</span>
                    <select
                      value={filters.departamento}
                      onChange={(e) => updateFilter("departamento", e.target.value)}
                      className="form-field"
                      disabled={optionsLoading}
                    >
                      <option value="">Todos</option>
                      {departamentos.map((departamento) => (
                        <option key={departamento} value={departamento}>
                          {departamento}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Provincia</span>
                    <select
                      value={filters.provincia}
                      onChange={(e) => updateFilter("provincia", e.target.value)}
                      className="form-field"
                      disabled={optionsLoading || provincias.length === 0}
                    >
                      <option value="">Todas</option>
                      {provincias.map((provincia) => (
                        <option key={provincia} value={provincia}>
                          {provincia}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Distrito</span>
                    <select
                      value={filters.distrito}
                      onChange={(e) => updateFilter("distrito", e.target.value)}
                      className="form-field"
                      disabled={optionsLoading || distritos.length === 0}
                    >
                      <option value="">Todos</option>
                      {distritos.map((distrito) => (
                        <option key={distrito} value={distrito}>
                          {distrito}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Tipo de archivo</span>
                    <select
                      value={filters.tipoArchivo}
                      onChange={(e) =>
                        updateFilter(
                          "tipoArchivo",
                          e.target.value as TrabajoListItem["tipoArchivo"] | "",
                        )
                      }
                      className="form-field"
                      disabled={optionsLoading}
                    >
                      <option value="">Todos</option>
                      {filterOptions?.tiposArchivo.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipoArchivoLabels[tipo]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Sexo</span>
                    <select
                      value={filters.sexo}
                      onChange={(e) => updateFilter("sexo", e.target.value as "M" | "F" | "")}
                      className="form-field"
                    >
                      <option value="">Todos</option>
                      <option value="F">Femenino</option>
                      <option value="M">Masculino</option>
                    </select>
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Enviado desde</span>
                    <input
                      type="date"
                      value={filters.fechaDesde}
                      onChange={(e) => updateFilter("fechaDesde", e.target.value)}
                      className="form-field"
                    />
                  </label>

                  <label className="internal-filter-field">
                    <span className="internal-filter-label">Enviado hasta</span>
                    <input
                      type="date"
                      value={filters.fechaHasta}
                      onChange={(e) => updateFilter("fechaHasta", e.target.value)}
                      className="form-field"
                    />
                  </label>
                </div>

                <div className="internal-filters-actions">
                  <button type="button" className="btn-primary shrink-0" onClick={applyFilters}>
                    Aplicar filtros
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="internal-btn internal-btn--outline shrink-0"
                      onClick={clearFilters}
                    >
                      Limpiar todo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button type="button" className="btn-primary internal-search-bar__submit" onClick={applyFilters}>
            Buscar
          </button>
        </div>

        {hasActiveFilters && (
          <div className="internal-active-filters">
            {appliedFilters.q && (
              <span className="internal-active-filter">
                Búsqueda: «{appliedFilters.q}»
              </span>
            )}
            {appliedFilters.gradoId && filterOptions && (
              <span className="internal-active-filter">
                Grado:{" "}
                {filterOptions.grados.find((g) => String(g.id) === appliedFilters.gradoId)?.label}
              </span>
            )}
            {appliedFilters.estado && (
              <span className="internal-active-filter">
                Estado: {estadoLabels[appliedFilters.estado]}
              </span>
            )}
            {advancedCount > 0 && (
              <span className="internal-active-filter">
                +{advancedCount} filtro{advancedCount === 1 ? "" : "s"} avanzado
                {advancedCount === 1 ? "" : "s"}
              </span>
            )}
            <button type="button" className="internal-active-filters__clear" onClick={clearFilters}>
              Limpiar
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <p className="internal-muted">Cargando trabajos…</p>
      ) : items.length === 0 ? (
        <p className="internal-muted">No hay trabajos con esos filtros.</p>
      ) : (
        <>
          {selectedCount > 0 && (
            <div className="internal-bulk-bar" aria-live="polite">
              <span className="internal-bulk-bar__count">
                {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
              </span>
              <div className="internal-bulk-bar__actions">
                <label className="internal-bulk-bar__estado">
                  <span className="sr-only">Nuevo estado</span>
                  <select
                    value={bulkEstado}
                    onChange={(e) => setBulkEstado(e.target.value as EstadoTrabajo)}
                    className="form-field internal-quick-filter__select"
                    disabled={bulkLoading}
                  >
                    {ESTADOS_TRABAJO.map((estado) => (
                      <option key={estado} value={estado}>
                        {estadoLabels[estado]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="internal-btn internal-btn--primary"
                  onClick={() => void handleBulkEstado()}
                  disabled={bulkLoading}
                >
                  Cambiar estado
                </button>
                <button
                  type="button"
                  className="internal-btn internal-btn--danger"
                  onClick={openDeleteModal}
                  disabled={bulkLoading}
                >
                  Eliminar…
                </button>
                <button
                  type="button"
                  className="internal-btn internal-btn--outline"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkLoading}
                >
                  Deseleccionar
                </button>
              </div>
            </div>
          )}

          <div className="internal-table-wrap">
          <table className="internal-table">
            <thead>
              <tr>
                <th className="internal-table-check">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todas las entregas visibles"
                  />
                </th>
                <th>Código</th>
                <th>Concursante</th>
                <th>Libro</th>
                <th>Grado</th>
                <th>Estado</th>
                <th>Enviado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={selectedIds.has(item.id) ? "internal-table-row--selected" : undefined}
                >
                  <td className="internal-table-check">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      aria-label={`Seleccionar ${item.concursante}`}
                    />
                  </td>
                  <td>{item.codigoEntrega}</td>
                  <td>{item.concursante}</td>
                  <td>{item.bookTitle}</td>
                  <td>{item.grado}</td>
                  <td>
                    <select
                      value={item.estado}
                      onChange={(e) =>
                        void handleEstadoChange(item.id, e.target.value as EstadoTrabajo)
                      }
                      disabled={savingEstadoId === item.id}
                      className={`internal-estado-select internal-estado-select--${item.estado}`}
                      aria-label={`Estado de ${item.concursante}`}
                    >
                      {ESTADOS_TRABAJO.map((estado) => (
                        <option key={estado} value={estado}>
                          {estadoLabels[estado]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(item.fechaEnvio).toLocaleString("es-PE")}</td>
                  <td>
                    <div className="internal-table-actions">
                      <button
                        type="button"
                        className="internal-link"
                        onClick={() => void handleOpenArchivo(item.id)}
                        disabled={openingArchivoId === item.id}
                      >
                        {openingArchivoId === item.id ? "Abriendo…" : "Archivo"}
                      </button>
                      <a
                        href={`/interno/jurado/detalle/?id=${item.id}`}
                        className="internal-link"
                      >
                        Detalle
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {deleteModalOpen && (
        <div className="internal-modal-backdrop" role="presentation" onClick={closeDeleteModal}>
          <div
            className="internal-modal"
            role="alertdialog"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-modal-title" className="internal-modal__title">
              Eliminar entregas permanentemente
            </h2>
            <p id="delete-modal-desc" className="internal-modal__text">
              Vas a eliminar <strong>{selectedCount}</strong> entrega
              {selectedCount === 1 ? "" : "s"}, incluyendo evaluaciones y datos del participante.
              Esta acción no se puede deshacer.
            </p>
            <p className="internal-modal__text">
              Escribe <strong>{DELETE_TRABAJOS_CONFIRM_WORD}</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="form-field internal-modal__input"
              autoComplete="off"
              spellCheck={false}
              placeholder={DELETE_TRABAJOS_CONFIRM_WORD}
              disabled={bulkLoading}
            />
            <div className="internal-modal__actions">
              <button
                type="button"
                className="internal-btn internal-btn--outline"
                onClick={closeDeleteModal}
                disabled={bulkLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="internal-btn internal-btn--danger"
                onClick={() => void handleBulkDelete()}
                disabled={
                  bulkLoading || deleteConfirmText !== DELETE_TRABAJOS_CONFIRM_WORD
                }
              >
                {bulkLoading ? "Eliminando…" : "Eliminar permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
